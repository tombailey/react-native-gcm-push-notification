# react-native-gcm-push-notification

GCM for React Native Android and IOS

## Demo

https://github.com/oney/TestGcm

## Installation

- Run `npm install react-native-gcm-push-notification --save`
- Run rnpm link
- If you need to receive initial notification in Android, change `new GcmPackge()` to `new GcmPackage(getIntent()` in MainActivity.java

## Android Configuration

- In `android/build.gradle`
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:1.3.1'
    classpath 'com.google.gms:google-services:2.1.0-alpha3' // <- Add this line
```

- In `android/app/build.gradle`
```gradle
apply plugin: "com.android.application"
apply plugin: 'com.google.gms.google-services'           // <- Add this line
...
```

- In `android/app/src/main/AndroidManifest.xml`, add these lines, be sure to change `com.xxx.yyy` to your package
```xml
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.SEND" />
<uses-permission android:name="android.permission.GET_ACCOUNTS" />
<uses-permission android:name="android.permission.GET_TASKS" /> 
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

<permission
  android:name="com.xxx.yyy.permission.C2D_MESSAGE"
  android:protectionLevel="signature" />
<uses-permission android:name="com.xxx.yyy.permission.C2D_MESSAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE"></uses-permission>

...

<application
  android:theme="@style/AppTheme">

  ...
  <receiver
        android:name="com.google.android.gms.gcm.GcmReceiver"
        android:exported="true"
        android:permission="com.google.android.c2dm.permission.SEND" >
        <intent-filter>
            <action android:name="com.google.android.c2dm.intent.RECEIVE" />
            <category android:name="com.xxx.yyy" />
        </intent-filter>
    </receiver>
    <service android:name="com.oney.gcm.GcmRegistrationService"/>
    <service
        android:name="com.oney.gcm.RNGcmListenerService"
        android:exported="false" >
        <intent-filter>
            <action android:name="com.google.android.c2dm.intent.RECEIVE" />
        </intent-filter>
    </service>
    <service android:name="com.oney.gcm.RNGcmInstanceIDListenerService" android:exported="false">
        <intent-filter>
            <action android:name="com.google.android.gms.iid.InstanceID"/>
        </intent-filter>
    </service>
  ...
```

### IOS Configuration
in AppDelegate.m add
```
#import "RNGCM.h"
```

```
- (void)application:(UIApplication *)application
didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSDictionary *userInfo = @{@"deviceToken" : deviceToken};
  [[NSNotificationCenter defaultCenter] postNotificationName:GCMRemoteNotificationRegistered
                                                      object:self
                                                    userInfo:userInfo];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
   NSDictionary *userInfo = @{@"error" :error.localizedDescription};
   [[NSNotificationCenter defaultCenter] postNotificationName:GCMRemoteNotificationRegistered
                                                       object:self
                                                     userInfo:userInfo];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification {
  [[NSNotificationCenter defaultCenter] postNotificationName: GCMRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];

}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))handler {
  [[NSNotificationCenter defaultCenter] postNotificationName:GCMRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];
  handler(UIBackgroundFetchResultNoData);
}
```


### GCM API KEY
By following [Cloud messaging](https://developers.google.com/cloud-messaging/android/client), you can get `google-services.json` file and place it in `android/app` directory
By following [Cloud messaging](https://developers.google.com/cloud-messaging/ios/client), you can get `googleServices-info.plist` file and place it in `/ios` directory 

### Usage

```javascript
'use strict';

var React = require('react'); // RN 0.25+
var {
  AppRegistry,
  View,
  DeviceEventEmitter,
} = require('react-native');

var GCM = require('react-native-gcm-push-notification');

var notification = GCM.popInitialNotification();
if (notification) {
  var info = JSON.parse(notification.info);
  Notification.create({
    subject: info.subject,
    message: info.message,
  });
  GcmAndroid.stopService();
} else {

  var {Router, Route, Schema, Animations, TabBar} = require('react-native-router-flux');
  var YourApp = React.createClass({
    componentDidMount: function() {
      GCM.addEventListener('register', function(data){
        if(!data.error){
            console.log('send gcm token to server', data.registrationToken);
        }
      });
      GCM.addEventListener('notification', function(notification){
        console.log('receive gcm notification', notification);
        var info = JSON.parse(notification.data.info);
        if (!GcmAndroid.isInForeground) {
          Notification.create({
            subject: info.subject,
            message: info.message,
          });
        }
      });

      GCM.requestPermissions();
    },
    render: function() {
      return (
        ...
      );
    }
  });

  AppRegistry.registerComponent('YourApp', () => YourApp);
}
```

* There are two situations.
##### The app is running on the foreground or background.
`GcmAndroid.launchNotification` is `null`, you can get notification in `GcmAndroid.addEventListener('notification'` listenter.
##### The app is killed/closed
`GcmAndroid.launchNotification` is your GCM data. You can create notification with resolving the data by using [react-native-system-notification module](https://github.com/Neson/react-native-system-notification).

* You can get info when clicking notification in `DeviceEventEmitter.addListener('sysNotificationClick'`. See [react-native-system-notification](https://github.com/Neson/react-native-system-notification) to get more informations about how to create notification 

## Troubleshoot

- Do not add `multiDexEnabled true` in `android/app/build.gradle` even encounter `com.android.dex.DexException: Multiple dex files...` failure.
- Make sure to install Google Play service in Genymotion simulator before testing.
