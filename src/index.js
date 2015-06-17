'use strict';

let KindaClass = require('kinda-class');

let KindaObject = KindaClass.extend('KindaObject', function() {
  Object.defineProperty(this, 'creator', {
    get() {
      return this._creator;
    },
    set(creator) {
      this._creator = creator;
    }
  });

  Object.defineProperty(this, 'serializer', {
    get() {
      return this._serializer;
    },
    set(serializer) {
      this._serializer = serializer;
    }
  });

  this.serialize = this.toJSON = function() {
    if (!this.serializer) throw new Error('serializer is undefined');
    return this.serializer();
  };

  Object.defineProperty(this, 'unserializer', {
    get() {
      return this._unserializer;
    },
    set(unserializer) {
      this._unserializer = unserializer;
    }
  });
});

KindaObject.create = function(...args) {
  let obj = this.instantiate();
  if (obj.creator) obj.creator(...args);
  return obj;
};

KindaObject.unserialize = function(...args) {
  let obj = this.instantiate();
  if (!obj.unserializer) throw new Error('unserializer is undefined');
  obj.unserializer(...args);
  return obj;
};

module.exports = KindaObject;
