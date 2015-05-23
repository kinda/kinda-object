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

    let person = Person.create('Jean', 'Dupont');
    assert.strictEqual(person.firstname, 'Jean');
    assert.strictEqual(person.lastname, 'Dupont');
  });

  test('serializer', function() {
    let Person = KindaObject.extend('Person', function() {
      this.serializer = function() {
        return { firstname: this.firstname, lastname: this.lastname };
      };
    });

    let person = Person.create();
    person.firstname = 'Jean';
    person.lastname = 'Dupont';
    let json = person.serialize();
    assert.deepEqual(
      json,
      { firstname: 'Jean', lastname: 'Dupont' }
    );
  });

  test('unserializer', function() {
    let Person = KindaObject.extend('Person', function() {
      this.unserializer = function(json) {
        this.firstname = json.firstname;
        this.lastname = json.lastname;
      };
    });

    let person = Person.unserialize({ firstname: 'Jean', lastname: 'Dupont' });
    assert.strictEqual(person.firstname, 'Jean');
    assert.strictEqual(person.lastname, 'Dupont');
  });

  test('create with context', function() {
    let Company = KindaObject.extend('Company');
    let Person = KindaObject.extend('Person');

    let company = Company.create();
    company.context.data = 123;
    let person = company.create(Person);
    assert.strictEqual(person.context.data, 123);
    person.context.data = 456;
    assert.strictEqual(person.context.data, 456);
    assert.strictEqual(company.context.data, 123);
  });

  test('unserialize with context', function() {
    let Company = KindaObject.extend('Company');
    let Person = KindaObject.extend('Person', function() {
      this.unserializer = function(json) {
        this.firstname = json.firstname;
        this.lastname = json.lastname;
      };
    });

    let company = Company.create();
    company.context.data = 123;
    let person = company.unserialize(
      Person, { firstname: 'Jean', lastname: 'Dupont' }
    );
    assert.strictEqual(person.firstname, 'Jean');
    assert.strictEqual(person.lastname, 'Dupont');
    assert.strictEqual(person.context.data, 123);
    person.context.data = 456;
    assert.strictEqual(person.context.data, 456);
    assert.strictEqual(company.context.data, 123);
  });
});
