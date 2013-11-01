// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals throws */

var content, controller, extra;

var TestObject = SC.Object.extend({
  title: "test",
  toString: function() { return "TestObject(%@)".fmt(this.get("title")); }
});

var ComplexTestObject = SC.Object.extend({
  firstName: null,
  lastName: null,
  toString: function() { return "TestObject(%@ %@)".fmt(this.get("firstName"), this.get('lastName')); }
});

// ..........................................................
// EMPTY
//

module("SC.ArrayController - array_case - EMPTY", {
  setup: function() {
    content = [];
    controller = SC.ArrayController.create({ content: content });
    extra = TestObject.create({ title: "FOO" });
  },

  teardown: function() {
    controller.destroy();
  }
});

test("state properties", function() {
  equals(controller.get("hasContent"), YES, 'c.hasContent');
  equals(controller.get("canRemoveContent"), YES, "c.canRemoveContent");
  equals(controller.get("canReorderContent"), YES, "c.canReorderContent");
  equals(controller.get("canAddContent"), YES, "c.canAddContent");
});

// addObject should append to end of array + notify observers on Array itself
test("addObject", function() {
  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  SC.run(function() { controller.addObject(extra); });

  same(content, [extra], 'addObject(extra) should work');
  equals(callCount, 1, 'should notify observer that content has changed');
  equals(content.get('length'), 1, 'should update length of controller');
});

test("removeObject", function() {
  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  SC.run(function() { controller.removeObject(extra); });

  same(content, [], 'removeObject(extra) should have no effect');
  equals(callCount, 0, 'should not notify observer since content did not change');
});

test("basic array READ operations", function() {
  equals(controller.get("length"), 0, 'length should be empty');
  equals(controller.objectAt(0), undefined, "objectAt() should return undefined");
});

test("basic array WRITE operations", function() {
  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  controller.replace(0,1,[extra]);

  same(content, [extra], 'should modify content');
  equals(callCount, 1, 'should notify observer that content has changed');
  equals(content.get('length'), 1, 'should update length of controller');
});

test("arrangedObjects", function() {
  equals(controller.get("arrangedObjects"), controller, 'c.arrangedObjects should return receiver');
});


// ..........................................................
// NON-EMPTY ARRAY
//

module("SC.ArrayController - array_case - NON-EMPTY", {
  setup: function() {
    content = "1 2 3 4 5".w().map(function(x) {
      return TestObject.create({ title: x });
    });

    controller = SC.ArrayController.create({ content: content });
    extra = TestObject.create({ title: "FOO" });
  },

  teardown: function() {
    controller.destroy();
  }
});

test("state properties", function() {
  equals(controller.get("hasContent"), YES, 'c.hasContent');
  equals(controller.get("canRemoveContent"), YES, "c.canRemoveContent");
  equals(controller.get("canReorderContent"), YES, "c.canReorderContent");
  equals(controller.get("canAddContent"), YES, "c.canAddContent");
});

// addObject should append to end of array + notify observers on Array itself
test("addObject", function() {
  var expected = content.slice();
  expected.push(extra);

  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  SC.run(function() { controller.addObject(extra); });

  same(content, expected, 'addObject(extra) should work');
  equals(callCount, 1, 'should notify observer that content has changed');
  equals(content.get('length'), expected.length, 'should update length of controller');
});

test("removeObject", function() {
  var expected = content.slice(), obj = expected[3];
  expected.removeObject(obj);

  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  SC.run(function() { controller.removeObject(obj); });

  same(content, expected, 'removeObject(extra) should remove object');
  equals(callCount, 1, 'should notify observer that content has changed');
  equals(content.get('length'), expected.length, 'should update length of controller');
});

test("basic array READ operations", function() {
  equals(controller.get("length"), content.length, 'length should be empty');

  var loc = content.length+1; // verify 1 past end as well
  while(--loc>=0) {
    equals(controller.objectAt(loc), content[loc], "objectAt(%@) should return same value at content[%@]".fmt(loc, loc));
  }
});

test("basic array WRITE operations", function() {
  var expected = content.slice();
  expected.replace(3,1,[extra]);

  var callCount = 0;
  controller.addObserver('[]', function() { callCount++; });

  controller.replace(3,1,[extra]);

  same(content, expected, 'should modify content');
  equals(callCount, 1, 'should notify observer that content has changed');
  equals(content.get('length'), expected.length, 'should update length of controller');
});

test("arrangedObjects", function() {
  equals(controller.get("arrangedObjects"), controller, 'c.arrangedObjects should return receiver');
});

test("array orderBy using String", function(){
  var testController = SC.ArrayController.create({
    content: content,
    orderBy: 'title ASC'
  });

  equals(testController.get('firstSelectableObject'), content[0], 'first selectable object should be the first object in arrangedObjects');
  equals(testController.get('lastObject'), content[4], 'lastObject should be the last object in content');

  // Reorder the content
  testController.set('orderBy', 'title DESC');

  equals(testController.get('firstSelectableObject'), content[4], 'first selectable object should be the first object in arrangedObjects (changed order)');
  equals(testController.get('lastObject'), content[0], 'lastObject should be the first object in content (changed order)');
});


test("array orderBy using Array", function(){
  var complexContent,
      familyNames = "Keating Zane Alberts Keating Keating".w(),
      givenNames = "Travis Harold Brian Alvin Peter".w(),
      testController;

  complexContent = familyNames.map(function(x, i) {
    return ComplexTestObject.create({ lastName: x, firstName: givenNames.objectAt(i) });
  });

  testController = SC.ArrayController.create({
    content: complexContent
  });

  equals(testController.get('firstSelectableObject'), complexContent[0], 'first selectable object should be the first object in arrangedObjects');

  // Reorder the content
  testController.set('orderBy', ['lastName', 'firstName']); // Brian Alberts, Alvin Keating, Peter Keating, Travis Keating, Harold Zane
  equals(testController.get('firstSelectableObject'), complexContent[2], 'first selectable object should be the first object in arrangedObjects (changed order)');
  equals(testController.objectAt(1), complexContent[3], 'fourth content object should be the second object in arrangedObjects (changed order)');

  // Reorder the content
  testController.set('orderBy', ['lastName', 'firstName DESC']); // Brian Alberts, Travis Keating, Peter Keating, Alvin Keating,Harold Zane
  equals(testController.objectAt(3), complexContent[3], 'fourth content object should be the fourth object in arrangedObjects (changed order)');

});

test("array orderBy using function", function(){
  var testFunc = function(a,b){
    if(a.get('title') > b.get('title')) return -1;
    else if (a.get('title') == b.get('title')) return 0;
    else return 1;
  };
  var expected = content.slice();
  expected.sort(testFunc);

  var testController = SC.ArrayController.create({
    content: content,
    orderBy: testFunc
  });
  same(testController.get('arrangedObjects').toArray(), expected, 'arrangedObjects should be sortable by a custom function');
});

// ..........................................................
// ADD SPECIAL CASES HERE
//

test("verify length is correct in arrayObserver didChange method when orderBy is set", function () {
  content = [];
  controller = SC.ArrayController.create({
    content: content,
    orderBy: 'i haz your content!'
  });
  expect(2);

  controller.addArrayObservers({
    willChange: function () {
      equals(this.get('length'), 0, 'length should be 0');
    },

    didChange: function () {
      equals(this.get('length'), 1, 'length should be 1');
    }
  });

  content.pushObject(":{");
});

test("verify rangeObserver fires when content is deleted", function() {

  content = "1 2 3 4 5".w().map(function(x) {
    return TestObject.create({ title: x });
  });

  controller = SC.ArrayController.create({ content: content });

  var cnt = 0,
      observer = SC.Object.create({ method: function() { cnt++; } });

  controller.addRangeObserver(SC.IndexSet.create(0,2), observer, observer.method);

  SC.RunLoop.begin();
  content.replace(0, content.length, []);
  SC.RunLoop.end();

  equals(cnt, 1, 'range observer should have fired once');
});

test("should invalidate computed property once per changed key", function() {
  var setCalls = 0;
  var getCalls = 0;

  window.peopleController = SC.ArrayController.create({
    foo: YES,
    content: [SC.Object.create({name:'Juan'}),
              SC.Object.create({name:'Camilo'}),
              SC.Object.create({name:'Pinzon'}),
              SC.Object.create({name:'Señor'}),
              SC.Object.create({name:'Daaaaaale'})],

    fullNames: function(key, value) {
      if (value !== undefined) {
        setCalls++;
        this.setEach('name', value);
      } else {
        getCalls++;
      }

      return this.getEach('name').join(' ');
    }.property('@each.name').cacheable()
  });

  try {
    var peopleWatcher = SC.Object.create({
      namesBinding: 'peopleController.fullNames'
    });

    SC.run();
    SC.run(function() { peopleWatcher.set('names', 'foo bar baz'); });
    equals(setCalls, 1, "calls set once");
    // called six time: once on the binding connect,
    // and once for each item in the array (each one notifies the change).
    equals(getCalls, 6, "calls get six times");
  } finally {
    window.peopleController = undefined;
  }

});

module("SC.ArrayController - array_case - NON-EMPTY - firstObject, firstSelectableObject & lastObject", {
  setup: function() {
    content = "1 2 3 4 5 6 7 8 9 10".w().map(function(x) {
      return TestObject.create({ title: x });
    });

    controller = SC.ArrayController.create({
      content: content,
      firstObjectChanged: 0,
      lastObjectChanged: 0,
      propertyDidChange: function (key, value) {
        switch (key) {
        case 'firstObject':
        case 'lastObject':
          this[key + 'Changed']++;
          break;
        }
        return sc_super();
      },
      resetCallCounts: function () {
        this.firstObjectChanged = 0;
        this.lastObjectChanged = 0;
      }
    });
    extra = TestObject.create({ title: "FOO" });
  },

  teardown: function() {
    controller.destroy();
  }
});

test("The computed properties firstObject, firstSelectableObject & lastObject should update when content changes.", function(){
  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('firstSelectableObject'), content[0], 'firstSelectableObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');

  // Reorder the content
  var newObject = TestObject.create({ title: "BLAH" });
  controller.set('content', [newObject]);

  equals(controller.get('firstObject'), newObject, 'firstObject should be the new first object in content');
  equals(controller.get('firstSelectableObject'), newObject, 'firstSelectableObject should be the new first object in content');
  equals(controller.get('lastObject'), newObject, 'lastObject should be the new last object in content');
});

test("The computed properties firstObject, firstSelectableObject & lastObject should update when content items change.", function(){
  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('firstSelectableObject'), content[0], 'firstSelectableObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');

  // Change the items.
  var newObject = TestObject.create({ title: "BLAH" });
  controller.replace(0, 10, [newObject]);

  equals(controller.get('firstObject'), newObject, 'firstObject should be the new first object in content');
  equals(controller.get('firstSelectableObject'), newObject, 'firstSelectableObject should be the new first object in content');
  equals(controller.get('lastObject'), newObject, 'lastObject should be the new last object in content');
});

test("The computed properties firstObject & lastObject should update only when they have actually changed", function () {
  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');

  // Add one at beginning
  controller.resetCallCounts();
  controller.replace(0, 0, [TestObject.create({ title: 'NEW AT BEGINNING' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Remove one at beginning
  controller.resetCallCounts();
  controller.replace(0, 1, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Replace one at beginning
  controller.resetCallCounts();
  controller.replace(0, 1, [TestObject.create({ title: 'NEW AT BEGINNING' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Add two at beginning
  controller.resetCallCounts();
  controller.replace(0, 0, [TestObject.create({ title: 'NEW 1 AT BEGINNING' }), TestObject.create({ title: 'NEW 2 AT BEGINNING' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Remove two at beginning
  controller.resetCallCounts();
  controller.replace(0, 2, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Replace two at beginning with one
  controller.resetCallCounts();
  controller.replace(0, 2, [TestObject.create({ title: 'NEW AT BEGINNING' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Add one at end
  controller.resetCallCounts();
  controller.replace(content.length, 0, [TestObject.create({ title: 'NEW AT END' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Remove one at end
  controller.resetCallCounts();
  controller.replace(content.length - 1, 1, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Replace one at end
  controller.resetCallCounts();
  controller.replace(content.length - 1, 1, [TestObject.create({ title: 'NEW AT END' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Add two at end
  controller.resetCallCounts();
  controller.replace(content.length, 0, [TestObject.create({ title: 'NEW 1 AT END'}), TestObject.create({ title: 'NEW 2 AT END' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Remove two at end
  controller.resetCallCounts();
  controller.replace(content.length - 2, 2, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Replace two at end with one
  controller.resetCallCounts();
  controller.replace(content.length - 2, 2, [TestObject.create({ title: 'NEW IN MIDDLE' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // Remove one near end
  controller.resetCallCounts();
  controller.replace(content.length - 2, 1, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Replace one near end
  controller.resetCallCounts();
  controller.replace(content.length - 2, 1, [TestObject.create({ title: 'NEW IN MIDDLE' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Remove two near end
  controller.resetCallCounts();
  controller.replace(content.length - 3, 2, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Replace two near end with one
  controller.resetCallCounts();
  controller.replace(content.length - 3, 2, [TestObject.create({ title: 'NEW IN MIDDLE' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // Replace all
  controller.resetCallCounts();
  controller.replace(0, content.length, [TestObject.create({ title: 'REPLACE ALL' })]);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 1, 'firstObject invalidated');
  equals(controller.lastObjectChanged, 1, 'lastObject invalidated');

  // No-op at beginning
  controller.resetCallCounts();
  controller.replace(0, 0, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');

  // No-op at end
  controller.resetCallCounts();
  controller.replace(content.length, 0, []);

  equals(controller.get('firstObject'), content[0], 'firstObject should be the first object in content');
  equals(controller.get('lastObject'), content[content.length - 1], 'lastObject should be the last object in content');
  equals(controller.firstObjectChanged, 0, 'firstObject not invalidated');
  equals(controller.lastObjectChanged, 0, 'lastObject not invalidated');
});

module("SC.ArrayController - dependent keys with @each");

test("should invalidate property when property on any enumerable changes", function() {
  var inventory = [];
  var recomputed = 0;

  for (var idx = 0; idx < 20; idx++) {
    inventory.pushObject(SC.Object.create({
      price: 5
    }));
  }
  var restaurant = SC.ArrayController.create({
    content: inventory,

    totalCost: function() {
      recomputed++;
      return inventory.reduce(function(prev, item) {
        return prev+item.get('price');
      }, 0);
    }.property('@each.price').cacheable()
  });

  equals(restaurant.get('totalCost'), 100, "precond - computes cost of all items");
  inventory[0].set('price', 6);

  equals(restaurant.get('totalCost'), 101, "recalculates after dependent key on an enumerable item changes");
  inventory[19].set('price', 6);

  equals(restaurant.get('totalCost'), 102, "recalculates after dependent key on a different item changes");
  inventory.pushObject(SC.Object.create({
    price: 5
  }));
  equals(restaurant.get('totalCost'), 107, "recalculates after adding an item to the enumerable");

  var item = inventory.popObject();
  equals(restaurant.get('totalCost'), 102, "recalculates after removing an item from the enumerable");

  recomputed = 0;
  item.set('price', 0);
  equals(recomputed, 0, "does not recalculate after changing key on removed item");
});

test("should invalidate property when property of array item changes after content has changed", function() {
  var inventory = [];
  var recomputed = 0;

  for (var idx = 0; idx < 20; idx++) {
    inventory.pushObject(SC.Object.create({
      price: 5
    }));
  }
  var restaurant = SC.ArrayController.create({
    content: [],

    totalCost: function() {
      recomputed++;
      return inventory.reduce(function(prev, item) {
        return prev+item.get('price');
      }, 0);
    }.property('@each.price').cacheable()
  });

  restaurant.set('content', inventory);

  equals(restaurant.get('totalCost'), 100, "precond - computes cost of all items");
  inventory[0].set('price', 6);

  equals(restaurant.get('totalCost'), 101, "recalculates after dependent key on an enumerable item changes");
  inventory[19].set('price', 6);

  equals(restaurant.get('totalCost'), 102, "recalculates after dependent key on a different item changes");
  inventory.pushObject(SC.Object.create({
    price: 5
  }));
  equals(restaurant.get('totalCost'), 107, "recalculates after adding an item to the enumerable");

  var item = inventory.popObject();
  equals(restaurant.get('totalCost'), 102, "recalculates after removing an item from the enumerable");

  recomputed = 0;
  item.set('price', 0);
  equals(recomputed, 0, "does not recalculate after changing key on removed item");
});

// ..........................................................
// VERIFY SC.ARRAY COMPLIANCE
//

SC.ArraySuite.generate("SC.ArrayController", {
  newObject: function(amt) {
    if (amt === undefined || typeof amt === SC.T_NUMBER) {
      amt = this.expected(amt);
    }
    return SC.ArrayController.create({ content: amt });
  }
});
