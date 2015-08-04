'use strict';

let semver = require('semver');
let pkg = require('../package.json');

let constructPrototype;

let KindaObject = function KindaObject() {
  return KindaObject.create.apply(KindaObject, arguments);
};

KindaObject.version = pkg.version;
KindaObject.isKindaClass = true;

KindaObject.constructor = function() {};

KindaObject.extend = function(name, version, constructor) {
  if (typeof name !== 'string') {
    constructor = version;
    version = name;
    name = 'Sub' + this.name;
  }

  if (typeof version !== 'string') {
    constructor = version;
    version = undefined;
  }

  let parent = this;

  /*eslint-disable */
  // Unfortunately, eval() is necessary to define a named function
  // TODO: sanitize the 'name' variable
  let child = eval(`
    (function() {
      function ${name}() {
        return child.create.apply(child, arguments);
      };
      return ${name};
    })();
  `);
  /*eslint-enable */

  child.version = version;

  // Copy class properties
  let keys = Object.getOwnPropertyNames(parent);
  for (let key of keys) {
    if (key in child) continue;
    if (key.startsWith('_')) continue; // Don't copy property starting with a '_'
    let descriptor = Object.getOwnPropertyDescriptor(parent, key);
    Object.defineProperty(child, key, descriptor);
  }

  child.constructor = function() {
    this.include(parent);
    if (!constructor) return;
    if (typeof constructor === 'function') {
      constructor.call(this);
    } else {
      let constructorKeys = Object.getOwnPropertyNames(constructor);
      for (let key of constructorKeys) {
        let descriptor = Object.getOwnPropertyDescriptor(constructor, key);
        Object.defineProperty(this, key, descriptor);
      }
    }
  };

  constructPrototype(child);

  return child;
};

KindaObject.instantiate = function() {
  return Object.create(this.prototype);
};

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

KindaObject.isClassOf = function(instance) {
  return !!(instance && instance.isInstanceOf && instance.isInstanceOf(this));
};

let checkCompatibility = function(v1, v2) {
  if (semver.satisfies(v1, '^' + v2)) return true;
  if (semver.satisfies(v2, '^' + v1)) return true;
  return false;
};

let compareClasses = function(a, b, errorIfNotCompatible) {
  if (a.name !== b.name) return false;
  if (!a.version || !b.version) return true;
  if (!checkCompatibility(a.version, b.version)) {
    if (errorIfNotCompatible) {
      throw new Error(`class ${a.name} v${a.version} is not compatible with class ${b.name} v${b.version}`);
    }
    return false;
  }
  if (semver.lte(a.version, b.version)) return true;
  return false;
};

constructPrototype = function(klass) {
  let superclasses = [];
  let creator;
  let serializer;
  let unserializer;

  Object.defineProperty(klass.prototype, 'class', {
    get() {
      return klass;
    }
  });

  Object.defineProperty(klass.prototype, 'superclasses', {
    get() {
      return superclasses;
    }
  });

  Object.defineProperty(klass.prototype, 'creator', {
    get() {
      return creator;
    },
    set(val) {
      creator = val;
    }
  });

  Object.defineProperty(klass.prototype, 'serializer', {
    get() {
      return serializer;
    },
    set(val) {
      serializer = val;
    }
  });

  Object.defineProperty(klass.prototype, 'unserializer', {
    get() {
      return unserializer;
    },
    set(val) {
      unserializer = val;
    }
  });

  klass.prototype.include = function(other) {
    let isAlreadyIncluded = this.superclasses.some(superclass => {
      return compareClasses(other, superclass, true);
    });
    if (isAlreadyIncluded) return this;
    other.constructor.call(this);
    this.superclasses.push(other);
    return this;
  };

  klass.prototype.isInstanceOf = function(other) {
    if (!(other && other.isKindaClass)) return false;
    if (compareClasses(this.class, other)) return true;
    return this.superclasses.some(superclass => {
      return compareClasses(superclass, other);
    });
  };

  klass.prototype.serialize = klass.prototype.toJSON = function() {
    if (!this.serializer) throw new Error('serializer is undefined');
    return this.serializer();
  };

  klass.constructor.call(klass.prototype);
};

module.exports = KindaObject;
