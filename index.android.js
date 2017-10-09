'use strict';

var {
  NativeModules,
  DeviceEventEmitter,
} = require('react-native');

var GcmModule = NativeModules.GcmModule;

var _initialNotification = GcmModule && GcmModule.initialNotification;

var DEVICE_NOTIF_EVENT = 'GCMRemoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'GCMRemoteNotificationRegistered';

class GCMClass {
  static setRegistrationListener(listener: Function) {
    if (GCMClass.registrationListener) {
      GCMClass.registrationListener.remove();
    }

    GCMClass.registrationListener = DeviceEventEmitter.addListener(NOTIF_REGISTER_EVENT, (registrationInfo) => {
      listener(registrationInfo);
    });
  }

  static setNotificationListener(listener: Function) {
    if (GCMClass.notificationListener) {
      GCMClass.notificationListener.remove();
    }

    GCMClass.notificationListener = DeviceEventEmitter.addListener(DEVICE_NOTIF_EVENT, (notifData) => {
      GCMClass.isInForeground = notifData.isInForeground;
      const data = JSON.parse(notifData.dataJSON);
      listener(new GCMClass(data));
    });
  }

  static requestPermissions() {
    GcmModule.requestPermissions();
  }

  static stopService() {
    GcmModule.stopService();
  }
  static createNotification(infos) {
    GcmModule.createNotification(infos);
  }

  static popInitialNotification() {
    var initialNotification = _initialNotification &&
      new GCMClass(JSON.parse(_initialNotification));
    _initialNotification = null;
    return initialNotification;
  }

  static subscribeTopic(topic, callback){
    GcmModule.subscribeTopic(topic, callback)
  }

  static unsubscribeTopic(topic, callback){
    GcmModule.unsubscribeTopic(topic, callback)
  }

  constructor(data) {
    this.data = data;
  }
}

GCMClass.isInForeground = true;

module.exports = GCMClass;
