// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test equals context ok same same */

var context = null;
var nameOrAttr;



// ..........................................................
// safeAttr()
//
module("SC.RenderContext#safeAttr", {
  setup: function () {
    context = SC.RenderContext();
  }
});

test("should add passed in string to attributes", function() {
  context.safeAttr('bar', 'bar');
  equals(context._attrs.bar, 'bar', 'verify attr name');
});

test("should add and escape passed in string to attributes", function() {
  context.safeAttr('bar', '\'bar\'');
  equals(context._attrs.bar, '&#x27;bar&#x27;', 'verify escaped attr name');
});

test("should add passed in attrs on object to attributes", function() {
  context.safeAttr({ bar: 'bar'});
  equals(context._attrs.bar, 'bar', 'verify attr name');
});

test("should add and escape passed in attrs on object to attributes", function() {
  context.safeAttr({ bar: '\'bar\''});
  equals(context._attrs.bar, '&#x27;bar&#x27;', 'verify escaped attr name');
});

// ..........................................................
// safeAttr() with a fake element
//
module("SC.RenderContext#safeAttrWithElement", {
  setup: function() {
    context._elem = true;
    context.$ = function() {
      return {
        attr: function(attr) {
          nameOrAttr = attr;
        }
      };
    };
  }
});

test("should add passed in string to attributes", function() {
  context.safeAttr('bar', 'bar');
  equals(nameOrAttr.bar, 'bar', 'verify _elem\'s attr name');
});

test("should add and escape passed in string to attributes", function() {
  context.safeAttr('bar', '\'bar\'');
  equals(nameOrAttr.bar, '\'bar\'', 'verify _elem\'s escaped attr name');
});

test("should add passed in attrs on object to attributes", function() {
  context.safeAttr({ bar: 'bar'});
  equals(nameOrAttr.bar, 'bar', 'verify _elem\'s  attr name');
});

test("should add and escape passed in attrs on object to attributes", function() {
  context.safeAttr({ bar: '\'bar\''});
  equals(nameOrAttr.bar, '\'bar\'', 'verify _elem\'s escaped attr name');
});

// ..........................................................
// attr
// 
module("SC.RenderContext#attr", {
  setup: function() {
    context = SC.RenderContext().attr({ foo: 'foo' }) ;
  }
});

test("should add passed name to value", function() {
  context.attr('bar', 'bar');
  equals(context._attrs.bar, 'bar', 'verify attr name');
});

test("should replace passed name  value in attrs", function() {
  context.attr('foo', 'bar');
  equals(context._attrs.foo, 'bar', 'verify attr name');
});

test("should return receiver", function() {
  equals(context, context.attr('foo', 'bar'));
});

test("should create attrs hash if needed", function() {
  context = SC.RenderContext().begin();
  equals(context._attrs, null, 'precondition - has no attrs');
  
  context.attr('foo', 'bar');
  equals(context._attrs.foo, 'bar', 'has styles');
});

test("should assign all attrs if a hash is passed", function() {
  context.attr({ foo: 'bar', bar: 'bar' });
  same(context._attrs, { foo: 'bar', bar: 'bar' }, 'has same styles');
});