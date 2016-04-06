
'use strict';

var React = require('react-native');
var {
  DeviceEventEmitter,
  NativeModules
} = React;

var RNGCM = NativeModules.RNGCM;

var _notifHandlers = new Map();
var _initialNotification = RNGCM && RNGCM.initialNotification;

var DEVICE_NOTIF_EVENT = 'GCMRemoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'GCMRemoteNotificationRegistered';

class GCMClass {
  static addEventListener(type: string, handler: Function) {
    var listener;
    if (type === 'notification') {
      listener =  DeviceEventEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        (notifData) => {
          handler(new GCMClass(notifData));
        }
      );
    } else if (type === 'register') {
      listener = DeviceEventEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        (registrationInfo) => {
          handler(registrationInfo);
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
    RNGCM.requestPermissions();
  }

  static popInitialNotification() {
    var initialNotification = _initialNotification &&
      new GCMClass(_initialNotification);
    _initialNotification = null;
    return initialNotification;
  }

  static subscribeTopic(topic, callback){
    RNGCM.subscribeTopic(topic, callback)
  }

  static unsubscribeTopic(topic, callback){
    RNGCM.unsubscribeTopic(topic, callback)
  }

  constructor(data) {
    this.data = data;
  }
}

module.exports = GCMClass;
