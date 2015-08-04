'use strict';

let assert = require('chai').assert;
let KindaObject = require('./src');

suite('KindaObject', function() {
  suite('Simple classes hierarchy', function() {
    let Foo = KindaObject.extend('Foo', function() {
      this.cool = 'very';
    });

    Foo.hello = 'Hello';
    Foo._bye = 'Bye';

    let Bar = Foo.extend('Bar', function() {
      this.isCold = function() {
        return this.cool === 'very' ? 'yes' : 'no';
      };
    });

    let Baz = KindaObject.extend('Baz', function() {
      this.include(Bar);
    });

    let UnnamedClass = Foo.extend();

    suite('Class methods', function() {
      test('extend()', function() {
        assert.strictEqual(Bar.hello, 'Hello');
        assert.isUndefined(Bar._bye);
      });

      test('name', function() {
        assert.strictEqual(Foo.name, 'Foo');
        assert.strictEqual(UnnamedClass.name, 'SubFoo');
      });

      test('instantiate()', function() {
        let bar = Bar.instantiate();
        assert.strictEqual(bar.cool, 'very');
        assert.isFunction(bar.isCold);
      });

      test('create() and new', function() {
        let Person = KindaObject.extend('Person', function() {
          this.creator = function(firstname, lastname) {
            this.firstname = firstname;
            this.lastname = lastname;
          };
        });

        let person1 = Person.create('Jean', 'Dupont');
        assert.strictEqual(person1.firstname, 'Jean');
        assert.strictEqual(person1.lastname, 'Dupont');

        let person2 = new Person('Pierre', 'Durand');
        assert.strictEqual(person2.firstname, 'Pierre');
        assert.strictEqual(person2.lastname, 'Durand');
      });

      test('prototype', function() {
        let bar = Bar.instantiate();
        assert.strictEqual(Bar.prototype.isCold, bar.isCold);
      });

      test('isKindaClass', function() {
        assert.isTrue(Bar.isKindaClass);
      });

      test('isClassOf()', function() {
        let baz = Baz.instantiate();
        assert.isTrue(Baz.isClassOf(baz));
        assert.isTrue(Bar.isClassOf(baz));
        assert.isTrue(Foo.isClassOf(baz));
        assert.isTrue(KindaObject.isClassOf(baz));
        let Qux = KindaObject.extend('Qux');
        assert.isFalse(Qux.isClassOf(baz));
      });

      test('unserialize()', function() {
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
    });

    suite('Instance methods', function() {
      test('include()', function() {
        let baz = Baz.instantiate();
        assert.strictEqual(baz.cool, 'very');
        assert.isFunction(baz.isCold);
      });

      test('class', function() {
        let foo = Foo.instantiate();
        assert.strictEqual(foo.class, Foo);
      });

      test('superclasses', function() {
        let foo = Foo.instantiate();
        assert.deepEqual(foo.superclasses, [KindaObject]);
        let bar = Bar.instantiate();
        assert.deepEqual(bar.superclasses, [KindaObject, Foo]);
        let baz = Baz.instantiate();
        assert.deepEqual(baz.superclasses, [KindaObject, Foo, Bar]);
      });

      test('isInstanceOf()', function() {
        let foo = Foo.instantiate();
        assert.isTrue(foo.isInstanceOf(Foo));
        assert.isFalse(foo.isInstanceOf(Bar));
      });

      test('serialize()', function() {
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
    });
  });

  suite('Object constructor', function() {
    test('simple class', function() {
      let French = KindaObject.extend('French', {
        hello: 'Bonjour',
        bye: 'Au revoir'
      });

      assert.strictEqual(French.prototype.hello, 'Bonjour');
      assert.strictEqual(French.prototype.bye, 'Au revoir');
    });
  });

  suite('Name conflict', function() {
    test('extend a class with the same name', function() {
      let Person = KindaObject.extend('Person', function() {
        this.isNice = 'yes';
        this.isCool = 'yes';
      });

      Person = Person.extend('Person', function() {
        this.isCool = 'absolutely';
      });

      let person = Person.instantiate();
      assert.strictEqual(person.isNice, 'yes');
      assert.strictEqual(person.isCool, 'absolutely');

      Person = Person.extend('Person', function() {
        this.isCool = 'definitely';
      });

      person = Person.instantiate();
      assert.strictEqual(person.isNice, 'yes');
      assert.strictEqual(person.isCool, 'definitely');
    });
  });

  suite('Diamond problem', function() {
    test('top constructor should only be called once', function() {
      let count = 0;

      let Top = KindaObject.extend('Top', function() {
        count++;
      });
      assert.strictEqual(count, 1);

      let Left = Top.extend('Left');
      assert.strictEqual(count, 2);

      let Right = Top.extend('Right');
      assert.strictEqual(count, 3);

      Top.extend('Bottom', function() {
        this.include(Left);
        this.include(Right);
      });
      assert.strictEqual(count, 4);
    });
  });

  suite('Versioning', function() {
    test('version', function() {
      let A = KindaObject.extend('A');
      assert.isUndefined(A.version);
      let B = KindaObject.extend('B', '0.1.0');
      assert.strictEqual(B.version, '0.1.0');
    });

    test('isInstanceOf()', function() {
      let A010 = KindaObject.extend('A', '0.1.0');
      assert.isTrue(A010.prototype.isInstanceOf(A010));

      let A015 = KindaObject.extend('A', '0.1.5');
      assert.isTrue(A010.prototype.isInstanceOf(A015));
      assert.isFalse(A015.prototype.isInstanceOf(A010));

      let B015 = KindaObject.extend('B', '0.1.5');
      assert.isFalse(A010.prototype.isInstanceOf(B015));

      let A024 = KindaObject.extend('A', '0.2.4');
      assert.isFalse(A015.prototype.isInstanceOf(A024));
      assert.isFalse(A024.prototype.isInstanceOf(A015));

      let A117 = KindaObject.extend('A', '1.1.7');
      let A141 = KindaObject.extend('A', '1.4.1');
      assert.isTrue(A117.prototype.isInstanceOf(A141));
      assert.isFalse(A141.prototype.isInstanceOf(A117));

      let A202 = KindaObject.extend('A', '2.0.2');
      assert.isFalse(A117.prototype.isInstanceOf(A202));
      assert.isFalse(A202.prototype.isInstanceOf(A117));
    });

    test('include()', function() {
      let a010Constructed, a015Constructed;
      let A010 = KindaObject.extend('A', '0.1.0', function() {
        a010Constructed = true;
      });
      let A015 = KindaObject.extend('A', '0.1.5', function() {
        a015Constructed = true;
      });
      let A020 = KindaObject.extend('A', '0.2.0');

      a010Constructed = false;
      a015Constructed = false;
      (KindaObject.extend(function() {
        this.include(A010);
        this.include(A015);
      })).instantiate();
      assert.isTrue(a010Constructed);
      assert.isTrue(a015Constructed);

      a010Constructed = false;
      a015Constructed = false;
      (KindaObject.extend(function() {
        this.include(A015);
        this.include(A010);
      })).instantiate();
      assert.isTrue(a015Constructed);
      assert.isFalse(a010Constructed);

      assert.throws(function() {
        (KindaObject.extend(function() {
          this.include(A015);
          this.include(A020);
        })).instantiate();
      });
    });
  });
});
