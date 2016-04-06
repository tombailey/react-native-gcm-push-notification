/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RNGCM.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

#define UIUserNotificationTypeAlert UIRemoteNotificationTypeAlert
#define UIUserNotificationTypeBadge UIRemoteNotificationTypeBadge
#define UIUserNotificationTypeSound UIRemoteNotificationTypeSound
#define UIUserNotificationTypeNone  UIRemoteNotificationTypeNone
#define UIUserNotificationType      UIRemoteNotificationType

#endif

NSString *const GCMRemoteNotificationReceived = @"GCMRemoteNotificationReceived";
NSString *const GCMRemoteNotificationRegistered = @"GCMRemoteNotificationRegistered";
NSString *const GCMTopicSubscribed = @"GCMTopicSubscribed";


@implementation RNGCM

NSString* registrationToken;

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSDictionary<NSString *, id> *initialNotification =
  [_bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey] copy];
  return @{@"initialNotification": RCTNullIfNil(initialNotification)};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  
  NSError* configureError;
  [[GGLContext sharedInstance] configureWithError:&configureError];
  NSAssert(!configureError, @"Error configuring Google services: %@", configureError);
  
  GCMConfig *gcmConfig = [GCMConfig defaultConfig];
  gcmConfig.receiverDelegate = self;
  [[GCMService sharedInstance] startWithConfig:gcmConfig];
  
  GGLInstanceIDConfig *instanceIDConfig = [GGLInstanceIDConfig defaultConfig];
  instanceIDConfig.delegate = self;
  // Start the GGLInstanceID shared instance with the that config and request a registration
  // token to enable reception of notifications
  [[GGLInstanceID sharedInstance] startWithConfig:instanceIDConfig];
  

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:GCMRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:GCMRemoteNotificationRegistered
                                             object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(disconnectGCM)
                                               name:UIApplicationDidEnterBackgroundNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(connectToGCM)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];
}

- (void)connectToGCM
{
  [[GCMService sharedInstance] connectWithHandler:^(NSError *error) {
    if (error) {
      NSLog(@"Could not connect to GCM: %@", error.localizedDescription);
    } else {
      self.connectedToGCM = YES;
      NSLog(@"Connected to GCM");
    }
  }];
}

- (void)disconnectGCM
{
  [[GCMService sharedInstance] disconnect];
  self.connectedToGCM = NO;
}

RCT_EXPORT_METHOD(requestPermissions)
{
  if (RCTRunningInAppExtension()) {
    return;
  }
  
  //UIApplication *app = RCTSharedApplication();
  
  if (floor(NSFoundationVersionNumber) <= NSFoundationVersionNumber_iOS_7_1) {
    // iOS 7.1 or earlier
    UIRemoteNotificationType allNotificationTypes =
    (UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeBadge);
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:allNotificationTypes];
  } else {
    // iOS 8 or later
    // [END_EXCLUDE]
    UIUserNotificationType allNotificationTypes =
    (UIUserNotificationTypeSound | UIUserNotificationTypeAlert | UIUserNotificationTypeBadge);
    UIUserNotificationSettings *settings =
    [UIUserNotificationSettings settingsForTypes:allNotificationTypes categories:nil];
    [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  }
  
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [[GCMService sharedInstance] appDidReceiveMessage:notification.userInfo];
  [_bridge.eventDispatcher sendDeviceEventWithName:GCMRemoteNotificationReceived
                                              body:notification.userInfo];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  if([notification.userInfo objectForKey:@"deviceToken"] != nil){
    NSData* deviceToken = [notification.userInfo objectForKey:@"deviceToken"];
    __weak typeof(self) weakSelf = self;;
    
    NSDictionary *registrationOptions = @{kGGLInstanceIDRegisterAPNSOption:deviceToken,
                                          kGGLInstanceIDAPNSServerTypeSandboxOption:@YES};
    
    NSString* gcmSenderID = [[[GGLContext sharedInstance] configuration] gcmSenderID];
    
    [[GGLInstanceID sharedInstance] tokenWithAuthorizedEntity:gcmSenderID scope:kGGLInstanceIDScopeGCM options:registrationOptions
                                                      handler:^(NSString *token, NSError *error){
                                                        if (token != nil) {
                                                          NSLog(@"Registration Token: %@", token);
                                                          
                                                          weakSelf.connectedToGCM = YES;
                                                          registrationToken = token;
                                                          
                                                          NSDictionary *userInfo = @{@"registrationToken":token};
                                                          [_bridge.eventDispatcher sendDeviceEventWithName:GCMRemoteNotificationRegistered
                                                                                                      body:userInfo];
                                                        } else {
                                                          NSLog(@"Registration to GCM failed with error: %@", error.localizedDescription);
                                                          NSDictionary *userInfo = @{@"error":error.localizedDescription};
                                                          [_bridge.eventDispatcher sendDeviceEventWithName:GCMRemoteNotificationRegistered
                                                                                                      body:userInfo];
                                                        }
                                                      }];
  } else {
    [_bridge.eventDispatcher sendDeviceEventWithName:GCMRemoteNotificationRegistered
                                                body:notification.userInfo];
  }
  
}

-(void)onTokenRefresh {
  [self requestPermissions];
}


RCT_EXPORT_METHOD(subscribeTopic:(NSString*) topic callback: (RCTResponseSenderBlock)callback) {
  // If the app has a registration token and is connected to GCM, proceed to subscribe to the
  // topic
  if (self.connectedToGCM && registrationToken) {
    [[GCMPubSub sharedInstance] subscribeWithToken:registrationToken
                                             topic:topic
                                           options:nil
                                           handler:^(NSError *error) {
                                             if(error == nil || error.code == 3001){
                                               callback(@[]);
                                             }else{
                                               callback(@[error.localizedDescription]);
                                             }
                                           }];
  }else{
    callback(@[@"GCM not connected"]);
  }
}

RCT_EXPORT_METHOD(unsubscribeTopic:(NSString*) topic callback: (RCTResponseSenderBlock)callback) {
  // If the app has a registration token and is connected to GCM, proceed to subscribe to the
  // topic
  if (self.connectedToGCM && registrationToken) {
    [[GCMPubSub sharedInstance] unsubscribeWithToken:registrationToken
                                             topic:topic
                                           options:nil
                                           handler:^(NSError *error) {
                                             if(error == nil || error.code == 3001){
                                               callback(@[]);
                                             }else{
                                               callback(@[error.localizedDescription]);
                                             }
                                           }];
  }else{
    callback(@[@"GCM not connected"]);
  }
}

@end
