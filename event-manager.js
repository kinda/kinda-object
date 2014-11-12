"use strict";

var _ = require('lodash');
var KindaClass = require('kinda-class');

var globalEventSession = {
  count: 0,
  objects: [],
  deferredEvents: []
};

var EventManager = KindaClass.extend('EventManager', function() {
  this.beginEventSession = function() {
    globalEventSession.count++;
  };

  this.endEventSession = function() {
    if (!globalEventSession.count)
      throw new Error('cannot end a non opened session');
    if (globalEventSession.count === 1) {
      while (globalEventSession.deferredEvents.length) {
        var event = globalEventSession.deferredEvents.shift();
        var args = [event.name].concat(event.args);
        this.doEmit.apply(event.object, args);
      }
      globalEventSession.objects.forEach(function(obj) {
        delete obj._eventSession;
      });
      globalEventSession.objects = [];
      globalEventSession.deferredEvents = [];
    };
    globalEventSession.count--;
  };

  this.runEventSession = function(fn) {
    this.beginEventSession();
    try {
      fn.call(this);
    } finally {
      this.endEventSession();
    }
  };

  this.getEventSession = function() {
    if (!globalEventSession.count)
      throw new Error('no opened session');
    if (!this.hasOwnProperty('_eventSession')) {
      this._eventSession = {};
      globalEventSession.objects.push(this);
    }
    return this._eventSession;
  }

  this.getEventListeners = function(name, createIfUndefined) {
    if (!this.hasOwnProperty('_eventListeners')) {
      if (!createIfUndefined) return;
      this._eventListeners = {};
    }
    if (!this._eventListeners.hasOwnProperty(name)) {
      if (!createIfUndefined) return;
      this._eventListeners[name] = [];
    }
    return this._eventListeners[name];
  }

  this.on = function(name, fn) {
    var listeners = this.getEventListeners(name, true);
    listeners.push(fn);
    return fn;
  };

  this.off = function(name, fn) { // TODO: event removing in proto
    var listeners = this.getEventListeners(name);
    if (!listeners) return;
    if (!fn) {
      listeners.length = 0;
      return;
    }
    var index = listeners.indexOf(fn);
    if (index !== -1) listeners.splice(index, 1);
  };

  this.emit = function(name) {
    if (globalEventSession.count) {
      var session = this.getEventSession();
      var args = Array.prototype.slice.call(arguments, 1);
      if (_.isEqual(session[name], args))
        return; // Ignore the event if it was already emitted with the same args
      session[name] = args;
    }
    this.doEmit.apply(this, arguments);
  };

  this.doEmit = function(name) {
    // console.log('[' + this.getClass().name + ']', name, arguments[1], arguments[2]);
    var args = Array.prototype.slice.call(arguments, 1);
    callListners.call(this, name, this, args);
    var proto = Object.getPrototypeOf(this);
    if (proto.doEmit)
      callListners.call(proto, name, this, args);
  };

  var callListners = function(name, thisArg, args) {
    var listeners = this.getEventListeners(name);
    if (!listeners) return;
    listeners.forEach(function(listener) {
      listener.apply(thisArg, args);
    });
  };

  this.emitLater = function(name) {
    if (globalEventSession.count) {
      var session = this.getEventSession();
      var args = Array.prototype.slice.call(arguments, 1);
      if (_.isEqual(session[name], args)) {
        // The deferred event must move at the end of the queue
        globalEventSession.deferredEvents.some(function(event, index, events) {
          if (event.object === this && event.name === name && _.isEqual(event.args, args)) {
            events.splice(index, 1);
            return true;
          }
        }, this);
      } else
        session[name] = args;
      globalEventSession.deferredEvents.push({ object: this, name: name, args: args });
    } else {
      this.doEmit.apply(this, arguments);
    }
  };

  // Async Events

  this.getAsyncEventListeners = function(name, createIfUndefined) {
    if (!this.hasOwnProperty('_asyncEventListeners')) {
      if (!createIfUndefined) return;
      this._asyncEventListeners = {};
    }
    if (!this._asyncEventListeners.hasOwnProperty(name)) {
      if (!createIfUndefined) return;
      this._asyncEventListeners[name] = [];
    }
    return this._asyncEventListeners[name];
  }

  this.onAsync = function(name, fn) {
    var listeners = this.getAsyncEventListeners(name, true);
    listeners.push(fn);
    return fn;
  };

  this.emitAsync = function *(name) {
    var that = this;
    var args = Array.prototype.slice.call(arguments, 1);
    var listeners = that.getAsyncEventListeners(name);
    var proto = Object.getPrototypeOf(this);
    if (proto.emitAsync) {
      var protoListeners = proto.getAsyncEventListeners(name);
      if (protoListeners) {
        if (listeners) {
          listeners = listeners.concat(protoListeners);
        } else {
          listeners = protoListeners;
        }
      }
    }
    if (!listeners) return;
    yield listeners.map(function(listener) { // TODO: listeners should run sequentially?
      return listener.apply(that, args);
    });
  };
});

module.exports = EventManager;
