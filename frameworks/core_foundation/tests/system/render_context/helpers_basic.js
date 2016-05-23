// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test equals context ok same */

var context = null;

// ..........................................................
// safeId()
//
module("SC.RenderContext#safeId", {
  setup: function() {
    context = SC.RenderContext().safeId('\'foo\'');
    context._elem = false;
  }
});

test("safeId() returns the current escaped id for the tag", function() {
  equals(context.safeId(), '&#x27;foo&#x27;', 'get id');
});

test("safeId('bar') alters and escapes the current id", function() {
  context = context.safeId("\'bar\'");
  equals(context.safeId(), '&#x27;bar&#x27;', 'changed to bar');
});

test("safeId() gets the id off of the element", function() {
  context._id = false;
  context._elem = {
    id: 'bar'
  };
  equals(context.safeId(), 'bar', 'got the id off of the element');
});

// ..........................................................
// id()
// 
module("SC.RenderContext#id", {
  setup: function() {
    context = SC.RenderContext().id('foo') ;
  }
});

test("id() returns the current id for the tag", function() {
  equals(context.id(), 'foo', 'get id');
});

test("id(bar) alters the current id", function() {
  equals(context.id("bar"), context, "Returns receiver");
  equals(context.id(), 'bar', 'changed to bar');
});
