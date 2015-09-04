'use strict';

import { assert } from 'chai';
import KindaObject from './src';

suite('KindaObject', function() {
  test('set a static method', function() {
    let Obj = KindaObject.extend('Obj', function() {
      this.setStaticMethod('echo', function(something) {
        return something;
      });
    });

    assert.strictEqual(Obj.echo('hi'), 'hi');

    assert.throws(function() {
      Obj.extend('SubObj', function() {
        this.setStaticMethod('echo', function(something) {
          return something;
        });
      });
    });
  });

  test('set a method', function() {
    let Obj = KindaObject.extend('Obj', function() {
      this.setMethod('echo', function(something) {
        return something;
      });
    });

    let obj = Obj.create();
    assert.strictEqual(obj.echo('hi'), 'hi');

    assert.throws(function() {
      Obj.extend('SubObj', function() {
        this.setMethod('echo', function(something) {
          return something;
        });
      });
    });
  });

  test('overload a static method', function() {
    let Obj = KindaObject.extend('Obj', function() {
      this.setStaticMethod('echo', function(something) {
        return something;
      });
    });

    assert.strictEqual(Obj.echo('hi'), 'hi');

    let SubObj = Obj.extend('SubObj', function() {
      this.overloadStaticMethod('echo', function(supr, something) {
        return supr(something).toUpperCase();
      });
    });

    assert.strictEqual(SubObj.echo('hi'), 'HI');

    assert.throws(function() {
      Obj.extend('SubObj', function() {
        this.overloadStaticMethod('missingMethod', function() {});
      });
    });
  });

  test('overload a method', function() {
    let Obj = KindaObject.extend('Obj', function() {
      this.setMethod('echo', function(something) {
        return something;
      });
    });

    let obj = Obj.create();
    assert.strictEqual(obj.echo('hi'), 'hi');

    let SubObj = Obj.extend('SubObj', function() {
      this.overloadMethod('echo', function(supr, something) {
        return supr(something).toUpperCase();
      });
    });

    let subObj = SubObj.create();
    assert.strictEqual(subObj.echo('hi'), 'HI');

    assert.throws(function() {
      Obj.extend('SubObj', function() {
        this.overloadMethod('missingMethod', function() {});
      });
    });
  });

  test('patch a static method', function() {
    let Obj = KindaObject.extend('Obj', '0.1.0', function() {
      this.setStaticMethod('echo', function(something) {
        return something;
      });
    });

    assert.strictEqual(Obj.echo('hi'), 'hi');

    let NewObj = KindaObject.extend('Obj', '0.1.1', function() {
      this.setStaticMethod('echo', function(something) {
        return something.toUpperCase();
      });
    });

    let Mixin = NewObj.extend('Mixin');

    let SubObj = Obj.extend('SubObj', function() {
      this.include(Mixin); // Obj should be upgraded to NewObj
    });

    assert.strictEqual(SubObj.echo('hi'), 'HI');
  });

  test('patch a method', function() {
    let Obj = KindaObject.extend('Obj', '0.1.0', function() {
      this.setMethod('echo', function(something) {
        return something;
      });
    });

    let obj = Obj.create();
    assert.strictEqual(obj.echo('hi'), 'hi');

    let NewObj = KindaObject.extend('Obj', '0.1.1', function() {
      this.setMethod('echo', function(something) {
        return something.toUpperCase();
      });
    });

    let Mixin = NewObj.extend('Mixin');

    let SubObj = Obj.extend('SubObj', function() {
      this.include(Mixin); // Obj should be upgraded to NewObj
    });

    let subObj = SubObj.create();
    assert.strictEqual(subObj.echo('hi'), 'HI');
  });

  test('set a property', function() {
    let Movie = KindaObject.extend('Movie', function() {
      this.setProperty('title', {
        get() {
          return this._title || 'Untitled';
        },
        set(title) {
          this._title = title;
        }
      });

      this.setProperty('bigTitle', function() {
        return this.title.toUpperCase();
      });
    });

    let movie = Movie.create();
    assert.strictEqual(movie.title, 'Untitled');
    assert.strictEqual(movie.bigTitle, 'UNTITLED');
    movie.title = 'Hello, World!';
    assert.strictEqual(movie.title, 'Hello, World!');
    assert.strictEqual(movie.bigTitle, 'HELLO, WORLD!');

    assert.throws(function() {
      Movie.extend('NewMovie', function() {
        this.setProperty('title', function() {
          return '???';
        });
      });
    });
  });

  test('overload a property', function() {
    let Movie = KindaObject.extend('Movie', function() {
      this.setProperty('title', {
        get() {
          return this._title;
        },
        set(title) {
          this._title = title;
        }
      });
    });

    let movie = Movie.create();
    assert.isUndefined(movie.title);
    movie.title = 'Hello, World!';
    assert.strictEqual(movie.title, 'Hello, World!');

    let NewMovie = Movie.extend('NewMovie', function() {
      this.overloadProperty('title', {
        get(supr) {
          return supr() || 'Untitled';
        },
        set(supr, title) {
          supr(title.toUpperCase());
        }
      });
    });

    let newMovie = NewMovie.create();
    assert.strictEqual(newMovie.title, 'Untitled');
    newMovie.title = 'Hello, World!';
    assert.strictEqual(newMovie.title, 'HELLO, WORLD!');

    assert.throws(function() {
      Movie.extend('NewMovie', function() {
        this.overloadMethod('missingMethod', function() {});
      });
    });
  });

  test('patch a property', function() {
    let Movie = KindaObject.extend('Movie', '0.1.0', function() {
      this.setProperty('title', {
        get() {
          return this._title;
        },
        set(title) {
          this._title = title;
        }
      });
    });

    let movie = Movie.create();
    assert.isUndefined(movie.title);
    movie.title = 'Hello, World!';
    assert.strictEqual(movie.title, 'Hello, World!');

    let NewMovie = KindaObject.extend('Movie', '0.1.1', function() {
      this.setProperty('title', {
        get() {
          return this._title || 'Untitled';
        },
        set(title) {
          this._title = title.toUpperCase();
        }
      });
    });

    let MovieMixin = NewMovie.extend('MovieMixin');

    let Film = Movie.extend('Film', function() {
      this.include(MovieMixin); // Movie should be upgraded to NewMovie
    });

    let film = Film.create();
    assert.strictEqual(film.title, 'Untitled');
    film.title = 'Hello, World!';
    assert.strictEqual(film.title, 'HELLO, WORLD!');
  });
});
