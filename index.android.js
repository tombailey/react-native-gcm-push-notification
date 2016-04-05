'use strict';

var {
  NativeModules,
  DeviceEventEmitter,
} = require('react-native');

var GcmModule = NativeModules.GcmModule;

var _notifHandlers = new Map();
var _initialNotification = GcmModule && GcmModule.launchNotification;

var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
var NOTIF_REGISTER_ERROR_EVENT = 'remoteNotificationsRegisteredError';

class GCMClass {
  static addEventListener(type: string, handler: Function) {
    var listener;
    if (type === 'notification') {
      listener =  DeviceEventEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        (notifData) => {
          GCMClass.isInForeground = notifData.isInForeground;
          var data = JSON.parse(notifData.dataJSON);
          handler(new GCMClass(data));
        }
      );
    } else if (type === 'register') {
      listener = DeviceEventEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        (registrationInfo) => {
          handler(registrationInfo.deviceToken);
        }
      );
    } else if (type === 'registerError') {
      listener = DeviceEventEmitter.addListener(
        NOTIF_REGISTER_ERROR_EVENT,
        (info) => {
          var error = new Error(info.message);
          handler(error);
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

  static requestPermissions() {
    GcmModule.requestPermissions();
  }

  static abandonPermissions() {
  }

  static stopService() {
    GcmModule.stopService();
  }
  static createNotification(infos) {
    GcmModule.createNotification(infos);
  }

  static checkPermissions(callback: Function) {
  }

  static presentLocalNotification(details: Object) {
  }

  static scheduleLocalNotification(details: Object) {
  }

  static cancelAllLocalNotifications() {
  }

  static setApplicationIconBadgeNumber(number: number) {
  }

  static getApplicationIconBadgeNumber(callback: Function) {
  }

  static cancelLocalNotifications(userInfo: Object) {
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

GCMClass.isInForeground = true;

module.exports = GCMClass;
