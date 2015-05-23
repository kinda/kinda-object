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

  this.create = function(klass, ...args) {
    return klass.createFrom(this, ...args);
  };

  this.unserialize = function(klass, json) {
    return klass.unserializeFrom(this, json);
  };

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

KindaObject.instantiateFrom = function(parent) {
  let obj = this.instantiate();
  if (parent && parent.context) {
    obj.context = Object.create(parent.context);
  } else {
    obj.context = {};
  }
  return obj;
};

KindaObject.create = function(...args) {
  return this.createFrom(undefined, ...args);
};

KindaObject.createFrom = function(parent, ...args) {
  let obj = this.instantiateFrom(parent);
  if (obj.creator) obj.creator(...args);
  return obj;
};

KindaObject.unserialize = function(json) {
  return this.unserializeFrom(undefined, json);
};

KindaObject.unserializeFrom = function(parent, json) {
  let obj = this.instantiateFrom(parent);
  if (!obj.unserializer) throw new Error('unserializer is undefined');
  obj.unserializer(json);
  return obj;
};

module.exports = KindaObject;
