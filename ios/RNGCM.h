/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <Google/CloudMessaging.h>

#import "RCTBridgeModule.h"

@interface RNGCM : NSObject <RCTBridgeModule>

+ (void)didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;
+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken delegate:(id<GCMReceiverDelegate>)delegate ;
+ (void)didReceiveLocalNotification:(UILocalNotification *)notification;
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))handler;
+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

+ (void)connectToGCM;
+ (void)disconnectGCM;
+ (void)initGCMWithDelegate:(id<GCMReceiverDelegate>)delegate;
+ (void)requestPermissions;

@end
