'use strict';

let assert = require('chai').assert;
let KindaObject = require('./src');

suite('KindaObject', function() {
  test('creator', function() {
    let Person = KindaObject.extend('Person', function() {
      this.creator = function(firstname, lastname) {
        this.firstname = firstname;
        this.lastname = lastname;
      };
    });

    assert.strictEqual(Person.name, 'Person');

    let person = Person.create('Jean', 'Dupont');
    assert.strictEqual(person.firstname, 'Jean');
    assert.strictEqual(person.lastname, 'Dupont');
  });
});
