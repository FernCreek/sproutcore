// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals module test ok equals same people */

var object;

module("object.registerDependentKeys()", {  
  setup: function() {
    object = SC.Object.create({

        // normal properties
        firstName:  'John',
        lastName:   'Doe',
        observedValue: '',

        // computed property
        fullName: function() {
          return this.getEach('firstName','lastName').compact().join(' ');
        }.property(),

        // init to setup registerDependentKey...
        init: function() {
          sc_super();
          this.registerDependentKey('fullName', 'firstName', 'lastName');
        },

        //observer that should fire whenever the 'fullName' property changes
        fullNameDidChange:  function() {
          this.set('observedValue', this.get('fullName'));
        }.observes('fullName')
    });
  },

  teardown: function() {
    object.destroy();
    object = null;
  }
});


test("should indicate the registered property changes if the dependent key value changes", function() {
  // now, change the firstName...
  object.set('firstName', 'Jane');

  // since fullName is 'dependent' on firstName, then the observer for  
  // 'fullName' should fire here because you changed a dependent key.
  equals(object.get('observedValue'), 'Jane Doe');

  // now change the lastName
  object.set('lastName', 'Johnson');

  // again, fullName is 'dependent' on lastName, so observer for  
  // fullName should fire.
  equals(object.get('observedValue'), 'Jane Johnson');
});


test("should indicate the registered property changes if the dependent key value changes and change is within begin property loop ", function() {
  // Wrap the changes with begin property changes call
  object.beginPropertyChanges();
  
  // now, change the firstName & lastname...
  object.set('firstName', 'Jane');
  object.set('lastName', 'Johnson');
  
  // The observer for fullName should not have fired yet at this  
  // point because we are inside a propertyChange loop.
  equals(object.get('observedValue'), '');
  
  //End the property changes loop.
  object.endPropertyChanges();
  
  // now change the lastName
  object.set('lastName', 'Johnson');

  // again, fullName is 'dependent' on lastName, so observer for  
  // fullName should fire.
  equals(object.get('observedValue'), 'Jane Johnson');
});

module("object.registerDependentKeys() - property paths", {
  setup: function () {
    object = SC.Object.create({

      deeplyNestedPropertyCalled: 0,

      aNestedObject: SC.Object.create({
        a: SC.Object.create({
          b: SC.Object.create({
            c: SC.Object.create({
              d: 'This is aNestedObject.a.b.c.d'
            })
          })
        })
      }),

      deeplyNestedProperty: function() {
        this.incrementProperty('deeplyNestedPropertyCalled');
        return this.getPath('aNestedObject.a.b.c.d');
      }.property('aNestedObject.a.b.c.d').cacheable(),

      propertyChanged: function(target, key) {
        this.get(key);
      }.observes('deeplyNestedProperty')
    });
  },

  teardown: function () {
    object.destroy();
    object = null;
  }
});

test("should invalidate when deeply nested property changes", function () {
  object.setPath('aNestedObject.a.b.c.d', 'New value');
  equals(object.get('deeplyNestedPropertyCalled'), 1, 'property called once');
});

test("should invalidate when shallow nested property changes", function () {
  object.setPath('aNestedObject.a.b', SC.Object.create({
    c: SC.Object.create({
      d: 'This is a new value'
    })
  }));
  equals(object.get('deeplyNestedPropertyCalled'), 1, 'property called once');

  object.setPath('aNestedObject.a.b.c.d', 'Another new value');
  equals(object.get('deeplyNestedPropertyCalled'), 2, 'property called twice');
});

test("should properly deactivate property chains", function() {
  var chains;

  chains = object.get('aNestedObject')._chainsFor('a');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aNestedObject initially has 1 chain for "a"');

  chains = object.getPath('aNestedObject.a')._chainsFor('b');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aNestedObject.a initially has 1 chain for "b"');

  chains = object.getPath('aNestedObject.a.b')._chainsFor('c');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aNestedObject.a.b initially has 1 chain for "c"');

  chains = object.getPath('aNestedObject.a.b.c')._chainsFor('d');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aNestedObject.a.b.c initially has 1 chain for "d"');

  // Destroy the object, check that chains are gone.
  object.destroy();

  chains = object.get('aNestedObject')._chainsFor('a');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aNestedObject now has 0 chains for "a"');

  chains = object.getPath('aNestedObject.a')._chainsFor('b');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aNestedObject.a now has 0 chains for "b"');

  chains = object.getPath('aNestedObject.a.b')._chainsFor('c');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aNestedObject.a.b now has 0 chains for "c"');

  chains = object.getPath('aNestedObject.a.b.c')._chainsFor('d');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aNestedObject.a.b.c now has 0 chains for "d"');
});

module("object.registerDependentKeys() - @each", {
  setup: function() {
    object = SC.Object.create({

      atEachPropertyCalled: 0,
      nestedAtEachPropertyCalled: 0,
      doubleNestedAtEachPropertyCalled: 0,
      bracketPropertyCalled: 0,
      lengthPropertyCalled: 0,

      anArray: [
        SC.Object.create({ name: 'Bob' }),
        SC.Object.create({ name: 'Tom' }),
        SC.Object.create({ name: 'Joe' })
      ],

      aNestedArray: [
        SC.Object.create({ firstName: 'Bob', o: SC.Object.create({ lastName: 'Smith' }) }),
        SC.Object.create({ firstName: 'Tom', o: SC.Object.create({ lastName: 'Jones' }) }),
        SC.Object.create({ firstName: 'Joe', o: SC.Object.create({ lastName: 'Flute' }) })
      ],

      aDoubleNestedArray: [
        SC.Object.create({ name: 'Bob', children: [
          SC.Object.create({ name: 'Nicky' }),
          SC.Object.create({ name: 'Timmy' })
        ]})
      ],

      atEachProperty: function() {
        this.incrementProperty('atEachPropertyCalled');
        return this.get('anArray').getEach('name');
      }.property('anArray.@each.name').cacheable(),

      nestedAtEachProperty: function() {
        this.incrementProperty('nestedAtEachPropertyCalled');
        var ret = [];
        this.get('aNestedArray').forEach(function(item) {
          ret.push(item.get('firstName') + item.getPath('o.lastName'));
        });
        return ret;
      }.property('aNestedArray.@each.o.lastName').cacheable(),

      doubleNestedAtEachProperty: function() {
        this.incrementProperty('doubleNestedAtEachPropertyCalled');
        var ret = [];
        this.get('aDoubleNestedArray').forEach(function(parent) {
          ret.push(parent.get('name') + '\'s children are: ' + parent.get('children').getEach('name').join(','));
        });
        return ret;
      }.property('aDoubleNestedArray.@each.children.@each.name').cacheable(),

      bracketProperty: function() {
        this.incrementProperty('bracketPropertyCalled');
        return this.getPath('anArray.length');
      }.property('anArray.[]').cacheable(),

      lengthProperty: function() {
        this.incrementProperty('lengthPropertyCalled');
        return this.getPath('anArray.length');
      }.property('anArray.length').cacheable(),

      propertyChanged: function(target, key) {
        this.get(key);
      }.observes('atEachProperty', 'nestedAtEachProperty', 'doubleNestedAtEachProperty', 'bracketProperty', 'lengthProperty')
    });
  },

  teardown: function() {
    object.destroy();
    object = null;
  }
});

test("should invalidate @each property when array item changes", function() {
  object.get('anArray').objectAt(0).set('name', 'New Name');
  equals(object.get('atEachPropertyCalled'), 1, 'atEachProperty called once');
});

test("should invalidate @each property when multiple array items change", function() {
  object.get('anArray').setEach('name', 'New Name');
  equals(object.get('atEachPropertyCalled'), 3, 'atEachProperty called three times');
});

test("should invalidate @each property when item added to array", function () {
  object.get('anArray').pushObject(SC.Object.create({ name: 'New item' }));
  equals(object.get('atEachPropertyCalled'), 1, 'atEachProperty called once');
});

test("should invalidate @each property when array is replaced", function() {
  object.set('anArray', [SC.Object.create({ name: 'One' }), SC.Object.create({ name: 'Two' })]);
  equals(object.get('atEachPropertyCalled'), 1, 'atEachProperty called once');
});

test("should invalidate nested @each property when array item changes", function() {
  object.get('aNestedArray').objectAt(0).set('o', SC.Object.create({ lastName: 'A new name' }));
  equals(object.get('nestedAtEachPropertyCalled'), 1, 'nestedAtEachProperty called once');
});

test("should invalidate nested @each property when object property changes", function() {
  object.get('aNestedArray').objectAt(0).get('o').set('lastName', 'A new name');
  equals(object.get('nestedAtEachPropertyCalled'), 1, 'nestedAtEachProperty called once');
});

test("should invalidate nested @each property when item added to array", function () {
  object.get('aNestedArray').pushObject(SC.Object.create({
    firstName: 'New item',
    o: SC.Object.create({ lastName: 'New Item' })
  }));
  equals(object.get('nestedAtEachPropertyCalled'), 1, 'nestedAtEachProperty called once');
});

test("should invalidate nested @each property when array is replaced", function() {
  object.set('aNestedArray', [
    SC.Object.create({ firstName: 'One', o: SC.Object.create({ lastName: 'ONE' }) }),
    SC.Object.create({ firstName: 'Two', o: SC.Object.create({ lastName: 'TWO' }) })
  ]);
  equals(object.get('nestedAtEachPropertyCalled'), 1, 'nestedAtEachProperty called once');
});

test("should invalidate double nested @each property when object property changes", function() {
  object.get('aDoubleNestedArray').objectAt(0).get('children').objectAt(0).set('name', 'Sarah');
  equals(object.get('doubleNestedAtEachPropertyCalled'), 1, 'doubleNestedAtEachProperty called once');
});

test("should invalidate double nested @each property when item added to first array", function() {
  object.get('aDoubleNestedArray').pushObject(SC.Object.create({
    name: 'John',
    children: [
      SC.Object.create({ name: 'Bill' })
    ]
  }));
  equals(object.get('doubleNestedAtEachPropertyCalled'), 1, 'doubleNestedAtEachProperty called once');
});

test("should invalidate double nested @each property when item added to second array", function() {
  object.get('aDoubleNestedArray').objectAt(0).get('children').pushObject(SC.Object.create({ name: 'Sarah'}));
  equals(object.get('doubleNestedAtEachPropertyCalled'), 1, 'doubleNestedAtEachProperty called once');
});

test("should invalidate '[]' property", function() {
  object.get('anArray').pushObject(SC.Object.create({ name: 'One more name' }));
  equals(object.get('bracketPropertyCalled'), 1, 'bracketProperty called once');
});

test("should invalidate non-@each property", function() {
  object.get('anArray').pushObject(SC.Object.create({ name: 'Another' }));
  equals(object.get('lengthPropertyCalled'), 1, 'lengthProperty called once');
});

test("should properly deactivate property chains", function() {
  var chains,
      clones;

  // anArray
  chains = object._chainsFor('anArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 3, 'object initially has 3 chains for "anArray"');

  chains = object.get('anArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'anArray initially has 1 enumerable property chain');

  object.get('anArray').forEach(function(item) {
    chains = item._chainsFor('name');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 1, 'items in anArray initially have 1 chain');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 1, 'items in anArray initially have 1 clone');
  });

  // aNestedArray
  chains = object._chainsFor('aNestedArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'object initially has 1 chain for "aNestedArray"');

  chains = object.get('aNestedArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aNestedArray initially has 1 enumerable property chain');

  object.get('aNestedArray').forEach(function(item) {
    chains = item._chainsFor('o');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 1, 'items in aNestedArray initially have 1 chain');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 1, 'items in aNestedArray initially have 1 clone');

    chains = item.get('o')._chainsFor('lastName');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 1, 'items o property in aNestedArray initially have 1 chain');
  });

  // aDoubleNestedArray
  chains = object._chainsFor('aDoubleNestedArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'object initially has 1 chain for "aDoubleNestedArray"');

  chains = object.get('aDoubleNestedArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'aDoubleNestedArray initially has 1 enumerable property chain');

  object.get('aDoubleNestedArray').forEach(function(item) {
    chains = item._chainsFor('children');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 1, 'items in aDoubleNestedArray initially have 1 chain');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 1, 'items in aDoubleNestedArray initially have 1 clone');

    chains = item.get('children')._kvo_enumerable_property_chains;
    ok(chains, 'chains not null');
    equals(chains.get('length'), 1, 'items children property in aDoubleNestedArray initially have 1 enumerable property chain');

    item.get('children').forEach(function(child) {
      chains = child._chainsFor('name');
      ok(chains, 'chains not null');
      equals(chains.get('length'), 1, 'items in children initially have 1 chain');

      clones = child._kvo_enumerable_property_clones;
      ok(clones, 'clones not null');
      equals(Object.keys(clones).length, 1, 'items in children initially have 1 clone');
    });
  });

  // anArray.[]
  chains = object.get('anArray')._chainsFor('[]');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'anArray initially has 1 chain for "[]"');

  // anArray.length
  chains = object.get('anArray')._chainsFor('length');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 1, 'anArray initially has 1 chain for "length"');

  // Destroy the object, check that chains are gone.
  object.destroy();

    // anArray
  chains = object._chainsFor('anArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'object now has 0 chains for "anArray"');

  chains = object.get('anArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'anArray now has 0 enumerable property chains');

  object.get('anArray').forEach(function(item) {
    chains = item._chainsFor('name');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 0, 'items in anArray now have 0 chains');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 0, 'items in anArray now have 0 clones');
  });

  // aNestedArray
  chains = object._chainsFor('aNestedArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'object now has 0 chains for "aNestedArray"');

  chains = object.get('aNestedArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aNestedArray now has 0 enumerable property chains');

  object.get('aNestedArray').forEach(function(item) {
    chains = item._chainsFor('o');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 0, 'items in aNestedArray now have 0 chains');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 0, 'items in aNestedArray now have 0 clones');

    chains = item.get('o')._chainsFor('lastName');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 0, 'items o property in aNestedArray now have 0 chains');
  });

  // aDoubleNestedArray
  chains = object._chainsFor('aDoubleNestedArray');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'object now has 0 chains for "aDoubleNestedArray"');

  chains = object.get('aDoubleNestedArray')._kvo_enumerable_property_chains;
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'aDoubleNestedArray now has 0 enumerable property chains');

  object.get('aDoubleNestedArray').forEach(function(item) {
    chains = item._chainsFor('children');
    ok(chains, 'chains not null');
    equals(chains.get('length'), 0, 'items in aDoubleNestedArray now have 0 chains');

    clones = item._kvo_enumerable_property_clones;
    ok(clones, 'clones not null');
    equals(Object.keys(clones).length, 0, 'items in aDoubleNestedArray now have 0 clones');

    chains = item.get('children')._kvo_enumerable_property_chains;
    ok(chains, 'chains not null');
    equals(chains.get('length'), 0, 'items children property in aDoubleNestedArray now have 0 enumerable property chains');

    item.get('children').forEach(function(child) {
      chains = child._chainsFor('name');
      ok(chains, 'chains not null');
      equals(chains.get('length'), 0, 'items in children now have 0 chains');

      clones = child._kvo_enumerable_property_clones;
      ok(clones, 'clones not null');
      equals(Object.keys(clones).length, 0, 'items in children now have 0 clones');
    });
  });

  // anArray.[]
  chains = object.get('anArray')._chainsFor('[]');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'anArray now has 0 chains for "[]"');

  // anArray.length
  chains = object.get('anArray')._chainsFor('length');
  ok(chains, 'chains not null');
  equals(chains.get('length'), 0, 'anArray now has 0 chains for "length"');
});

test("should invalidate computed property once per changed key", function() {
  var setCalls = 0;
  var getCalls = 0;

  window.people = SC.Object.create({
    content: [SC.Object.create({name:'Juan'}),
              SC.Object.create({name:'Camilo'}),
              SC.Object.create({name:'Pinzon'})],

    fullName: function(key, value) {
      if (value !== undefined) {
        setCalls++;
        this.content.setEach('name', value);
      } else {
        getCalls++;
      }

      return this.content.getEach('name').join(' ');
    }.property('content.@each.name')
  });

  var peopleWatcher = SC.Object.create({
    nameBinding: 'window.people.fullName'
  });

  SC.run(function() { people.set('fullName', 'foo bar baz'); });
  equals(setCalls, 1, "calls set once");
  equals(getCalls, 3, "calls get three times");
});

test("should invalidate key when properties higher up in the chain change", function() {
  var notified = 0;
  
  var obj = SC.Object.create({
    contact: null,
    
    fullName: function(key, value) {
      return [this.getPath('contact.firstName'), this.getPath('contact.lastName')].join(' ');
    }.property('contact.firstName', 'contact.lastName').cacheable(),
    
    fullNameDidChange: function() {
      notified++;
    }.observes('fullName')
  });

  var johnDoe = SC.Object.create({ firstName: 'John', lastName: 'Doe' });
  var janeDoe = SC.Object.create({ firstName: 'Jane', lastName: 'Doe' });
  
  equals(notified, 0, 'should start empty');
  SC.run(function() {  obj.set('contact', johnDoe);  });
  equals(notified, 1, 'should notify once after set content=johnDoe');
  equals(obj.get('fullName'), 'John Doe', 'should get proper name');
  
  notified = 0;
  SC.run(function() { johnDoe.set('firstName', 'JOHNNY'); });
  equals(notified, 1, 'should notify again after set firstName=JOHNNY');
  equals(obj.get('fullName'), 'JOHNNY Doe', 'should get proper name');
  
  notified = 0;
  SC.run(function() { obj.set('contact', janeDoe); });
  equals(notified, 1, 'should notify again after set content=janeDoe');
  equals(obj.get('fullName'), 'Jane Doe', 'should get proper name');

  notified = 0;
  SC.run(function() { johnDoe.set('firstName', 'JON'); });
  equals(notified, 0, 'should NOT notify again after set johnDoe.firstName=JON (johnDoe is not current contact)');
  equals(obj.get('fullName'), 'Jane Doe', 'should get proper name while janeDoe is current');

  notified = 0;
  SC.run(function() { janeDoe.set('firstName', 'Janna'); });
  equals(notified, 1, 'should notify again after set janeDoe.firstName=Janna');
  equals(obj.get('fullName'), 'Janna Doe', 'should get proper name after firstname=Janna');  
});
