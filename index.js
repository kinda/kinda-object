"use strict";

var KindaClass = require('kinda-class');
var EventManager = require('./event-manager');

var KindaObject = KindaClass.extend('KindaObject', function() {
  this.include(EventManager);

  this.serialize = function() {
    return this.callSerializer();
  };

  this.toJSON = function() {
    return this.callSerializer();
  };

  this.setCreator = function(creator) {
    this._creator = creator;
  };

  this.callCreator = function() {
    if (!this._creator) return;
    this._creator.apply(this, arguments);
  };

  this.setSerializer = function(serializer) {
    this._serializer = serializer;
  };

  this.callSerializer = function() {
    if (!this._serializer)
      throw new Error('serializer is undefined');
    return this._serializer();
  };

  this.setUnserializer = function(unserializer) {
    this._unserializer = unserializer;
  };

  this.callUnserializer = function(json) {
    if (!this._unserializer)
      throw new Error('unserializer is undefined');
    this._unserializer(json);
  };
});

KindaObject.create = function() {
  var args = Array.prototype.slice.call(arguments);
  var obj = this.instantiate();
  obj.runEventSession(function() {
    obj.callCreator.apply(obj, args);
    obj.emit('didCreate');
  });
  return obj;
};

KindaObject.unserialize = function(json) {
  var obj = this.instantiate();
  obj.runEventSession(function() {
    obj.callUnserializer(json);
    obj.emit('didUnserialize');
  });
  return obj;
};

module.exports = KindaObject;
