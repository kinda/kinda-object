'use strict';

let KindaInstantiable = require('kinda-instantiable');
let pkg = require('../package.json');

let KindaObject = KindaInstantiable.extend('KindaObject', pkg.version, function() {
  // === Methods ===

  let _setMethod = function(klass, name, fn, isStatic) {
    let target = isStatic ? klass : klass.prototype;

    if (!klass.isPatching() && name in target) {
      if (isStatic) {
        throw new Error(`Static method '${name}' is already defined. Use overloadStaticMethod() to overload it.`);
      } else {
        throw new Error(`Method '${name}' is already defined. Use overloadMethod() to overload it.`);
      }
    }

    target[name] = fn;
  };

  _setMethod(this, 'setStaticMethod', function(name, fn) {
    _setMethod(this, name, fn, true);
  }, true);

  this.setStaticMethod('setMethod', function(name, fn) {
    _setMethod(this, name, fn);
  });

  let _overloadMethod = function(klass, name, fn, isStatic) {
    let target = isStatic ? klass : klass.prototype;

    let oldMethod = target[name];

    if (!oldMethod) {
      if (isStatic) {
        throw new Error(`Static method '${name}' is undefined.`);
      } else {
        throw new Error(`Method '${name}' is undefined.`);
      }
    }

    let newMethod = function(...args) {
      return fn.call(this, oldMethod.bind(this), ...args);
    };

    target[name] = newMethod;
  };

  this.setStaticMethod('overloadStaticMethod', function(name, fn) {
    _overloadMethod(this, name, fn, true);
  });

  this.setStaticMethod('overloadMethod', function(name, fn) {
    _overloadMethod(this, name, fn);
  });

  // === Properties ===

  let _setProperty = function(klass, name, descriptor, isStatic) {
    let target = isStatic ? klass : klass.prototype;

    if (!klass.isPatching() && name in target) {
      if (isStatic) {
        throw new Error(`Static property '${name}' is already defined. Use overloadStaticProperty() to overload it.`);
      } else {
        throw new Error(`Property '${name}' is already defined. Use overloadProperty() to overload it.`);
      }
    }

    if (typeof descriptor === 'function') {
      descriptor = { get: descriptor };
    }

    descriptor = {
      get: descriptor.get,
      set: descriptor.set,
      configurable: descriptor.configurable || true,
      enumerable: descriptor.enumeratble || true
    };

    Object.defineProperty(target, name, descriptor);
  };

  this.setStaticMethod('setStaticProperty', function(name, descriptor) {
    _setProperty(this, name, descriptor, true);
  });

  this.setStaticMethod('setProperty', function(name, descriptor) {
    _setProperty(this, name, descriptor);
  });

  let _overloadProperty = function(klass, name, descriptor, isStatic) {
    let target = isStatic ? klass : klass.prototype;

    let oldDescriptor = Object.getOwnPropertyDescriptor(target, name);

    if (!oldDescriptor) {
      if (isStatic) {
        throw new Error(`Static property '${name}' is undefined.`);
      } else {
        throw new Error(`Property '${name}' is undefined.`);
      }
    }

    if (typeof descriptor === 'function') {
      descriptor = { get: descriptor };
    }

    let newGet;
    if (descriptor.get) {
      if (!oldDescriptor.get) {
        if (isStatic) {
          throw new Error(`Static property '${name}' has no getter.`);
        } else {
          throw new Error(`Property '${name}' has no getter.`);
        }
      }
      newGet = function() {
        return descriptor.get.call(this, oldDescriptor.get.bind(this));
      };
    }

    let newSet;
    if (descriptor.set) {
      if (!oldDescriptor.set) {
        if (isStatic) {
          throw new Error(`Static property '${name}' has no setter.`);
        } else {
          throw new Error(`Property '${name}' has no setter.`);
        }
      }
      newSet = function(value) {
        return descriptor.set.call(this, oldDescriptor.set.bind(this), value);
      };
    }

    let newDescriptor = {
      get: newGet,
      set: newSet,
      configurable: descriptor.configurable || true,
      enumerable: descriptor.enumeratble || true
    };

    Object.defineProperty(target, name, newDescriptor);
  };

  this.setStaticMethod('overloadStaticProperty', function(name, descriptor) {
    _overloadProperty(this, name, descriptor, true);
  });

  this.setStaticMethod('overloadProperty', function(name, descriptor) {
    _overloadProperty(this, name, descriptor);
  });

  // === Helpers ===

  this.setStaticMethod('setInitializer', function(fn) {
    this.setStaticMethod('initializer', fn);
  });

  this.setStaticMethod('overloadInitializer', function(fn) {
    this.overloadStaticMethod('initializer', fn);
  });

  this.setStaticMethod('setCreator', function(fn) {
    this.setStaticMethod('creator', fn);
  });

  this.setStaticMethod('overloadCreator', function(fn) {
    this.overloadStaticMethod('creator', fn);
  });

  this.setStaticMethod('setSerializer', function(fn) {
    this.setStaticMethod('serializer', fn);
  });

  this.setStaticMethod('overloadSerializer', function(fn) {
    this.overloadStaticMethod('serializer', fn);
  });

  this.setStaticMethod('setUnserializer', function(fn) {
    this.setStaticMethod('unserializer', fn);
  });

  this.setStaticMethod('overloadUnserializer', function(fn) {
    this.overloadStaticMethod('unserializer', fn);
  });
});

module.exports = KindaObject;
