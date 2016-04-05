
'use strict';

var React = require('react-native');
var {
  DeviceEventEmitter,
  NativeModules
} = React;

var RNGCM = NativeModules.RNGCM;

var _notifHandlers = new Map();
var _initialNotification = RNGCM && RNGCM.initialNotification;

var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
var DEVICE_LOCAL_NOTIF_EVENT = 'localNotificationReceived';

class GCMClass {
  static addEventListener(type: string, handler: Function) {
    var listener;
    if (type === 'notification') {
      listener =  DeviceEventEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        (notifData) => {
          handler(new PushNotification(notifData));
        }
      );
    } else if (type === 'localNotification') {
      listener = DeviceEventEmitter.addListener(
        DEVICE_LOCAL_NOTIF_EVENT,
        (notifData) => {
          handler(new PushNotification(notifData));
        }
      );
    } else if (type === 'register') {
      listener = DeviceEventEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        (registrationInfo) => {
          handler(registrationInfo.deviceToken);
        }
      );
    }
    _notifHandlers.set(handler, listener);
  }

  static removeEventListener(type: string, handler: Function) {
    var listener = _notifHandlers.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _notifHandlers.delete(handler);
  }

  static requestPermissions(permissions?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean
  }) {
    var requestedPermissions = {};
    if (permissions) {
      requestedPermissions = {
        alert: !!permissions.alert,
        badge: !!permissions.badge,
        sound: !!permissions.sound
      };
    } else {
      requestedPermissions = {
        alert: true,
        badge: true,
        sound: true
      };
    }
    RNGCM.requestPermissions(requestedPermissions);
  }

  static abandonPermissions() {
    RNGCM.abandonPermissions();
  }

  static checkPermissions(callback: Function) {
    if(typeof callback !== 'function'){
      throw new Error('Must provide a valid callback');
    }
    RNGCM.checkPermissions(callback);
  }

  static presentLocalNotification(details: Object) {
    RNGCM.presentLocalNotification(details);
  }

  static scheduleLocalNotification(details: Object) {
    RNGCM.scheduleLocalNotification(details);
  }

  static cancelAllLocalNotifications() {
    RNGCM.cancelAllLocalNotifications();
  }

  static setApplicationIconBadgeNumber(number: number) {
    RNGCM.setApplicationIconBadgeNumber(number);
  }

  static getApplicationIconBadgeNumber(callback: Function) {
    RNGCM.getApplicationIconBadgeNumber(callback);
  }

  static cancelLocalNotifications(userInfo: Object) {
    RNGCM.cancelLocalNotifications(userInfo);
  }

  static popInitialNotification() {
    var initialNotification = _initialNotification &&
      new GCMClass(_initialNotification);
    _initialNotification = null;
    return initialNotification;
  }

  constructor(data) {
    this.data = data;
  }
}

module.exports = GCMClass;
