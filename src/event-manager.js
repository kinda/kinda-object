'use strict';

let _ = require('lodash');
let KindaClass = require('kinda-class');

let globalEventSession = {
  count: 0,
  objects: [],
  deferredEvents: []
};

let EventManager = KindaClass.extend('EventManager', function() {
  this.beginEventSession = function() {
    globalEventSession.count++;
  };

  this.endEventSession = function() {
    if (!globalEventSession.count) {
      throw new Error('cannot end a non opened session');
    }
    if (globalEventSession.count === 1) {
      while (globalEventSession.deferredEvents.length) {
        let event = globalEventSession.deferredEvents.shift();
        let args = [event.name].concat(event.args);
        this._emit.apply(event.object, args);
      }
      globalEventSession.objects.forEach(function(obj) {
        delete obj._eventSession;
      });
      globalEventSession.objects = [];
      globalEventSession.deferredEvents = [];
    }
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
    if (!globalEventSession.count) throw new Error('no opened session');
    if (!this.hasOwnProperty('_eventSession')) {
      this._eventSession = {};
      globalEventSession.objects.push(this);
    }
    return this._eventSession;
  };

  this.hasEventSession = function() {
    return !!globalEventSession.count;
  };

  this.getEventListeners = function(name, createIfUndefined) {
    if (!this.hasOwnProperty('_eventListeners')) {
      if (!createIfUndefined) return undefined;
      this._eventListeners = {};
    }
    if (!this._eventListeners.hasOwnProperty(name)) {
      if (!createIfUndefined) return undefined;
      this._eventListeners[name] = [];
    }
    return this._eventListeners[name];
  };

  this.on = function(name, fn) {
    let listeners = this.getEventListeners(name, true);
    listeners.push(fn);
    return fn;
  };

  this.off = function(name, fn) { // TODO: event removing in proto
    let listeners = this.getEventListeners(name);
    if (!listeners) return;
    if (!fn) {
      listeners.length = 0;
      return;
    }
    let index = listeners.indexOf(fn);
    if (index !== -1) listeners.splice(index, 1);
  };

  this.emit = function(name) {
    if (globalEventSession.count) {
      let session = this.getEventSession();
      let args = Array.prototype.slice.call(arguments, 1);
      if (_.isEqual(session[name], args)) return; // Ignore the event if it was already emitted with the same args
      session[name] = args;
    }
    this._emit.apply(this, arguments);
  };

  let callListners = function(name, thisArg, args) {
    let listeners = this.getEventListeners(name);
    if (!listeners) return;
    listeners.forEach(function(listener) {
      listener.apply(thisArg, args);
    });
  };

  this._emit = function(name) {
    let args = Array.prototype.slice.call(arguments, 1);
    callListners.call(this, name, this, args);
    let proto = Object.getPrototypeOf(this);
    if (proto._emit) callListners.call(proto, name, this, args);
  };

  this.emitLater = function(name) {
    if (globalEventSession.count) {
      let session = this.getEventSession();
      let args = Array.prototype.slice.call(arguments, 1);
      if (_.isEqual(session[name], args)) {
        // The deferred event must move at the end of the queue
        globalEventSession.deferredEvents.some(function(event, index, events) {
          if (event.object === this && event.name === name && _.isEqual(event.args, args)) {
            events.splice(index, 1);
            return true;
          }
        }, this);
      } else {
        session[name] = args;
      }
      globalEventSession.deferredEvents.push(
        { object: this, name, args }
      );
    } else {
      this._emit.apply(this, arguments);
    }
  };

  this.getAsyncEventListeners = function(name, createIfUndefined) {
    if (!this.hasOwnProperty('_asyncEventListeners')) {
      if (!createIfUndefined) return undefined;
      this._asyncEventListeners = {};
    }
    if (!this._asyncEventListeners.hasOwnProperty(name)) {
      if (!createIfUndefined) return undefined;
      this._asyncEventListeners[name] = [];
    }
    return this._asyncEventListeners[name];
  };

  this.onAsync = function(name, fn) {
    let listeners = this.getAsyncEventListeners(name, true);
    listeners.push(fn);
    return fn;
  };

  this.emitAsync = function *(name) {
    let args = Array.prototype.slice.call(arguments, 1);
    let listeners = this.getAsyncEventListeners(name);
    let proto = Object.getPrototypeOf(this);
    if (proto.emitAsync) {
      let protoListeners = proto.getAsyncEventListeners(name);
      if (protoListeners) {
        if (listeners) {
          listeners = listeners.concat(protoListeners);
        } else {
          listeners = protoListeners;
        }
      }
    }
    if (!listeners) return;
    for (let i = 0; i < listeners.length; i++) {
      yield listeners[i].apply(this, args);
    }
  };
});

module.exports = EventManager;
