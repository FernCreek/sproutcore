// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module, test, equals, context */

var context = null;

// ..........................................................
// safeContent()
//
module("SC.RenderContext#safeContent", {
  setup: function () {
    context = SC.RenderContext();
  },

  teardown: function() {
    context = null;
  }
});

test("should push a string onto the context", function () {
  context.safeContent("foo");
  equals(context.get(1), "foo", "foo was added to the context");
  equals(context.length, 2, "only foo was added to the context");
});

test("should push a list of strings onto the context", function () {
  context.safeContent("foo", "bar", "entry");
  equals(context.get(1), "foo", "foo was added to the context");
  equals(context.get(2), "bar", "bar was added to the context");
  equals(context.get(3), "entry", "entry was added to the context");
  equals(context.length, 4, "context has the correct length");
});

test("should push an escaped string onto the context", function () {
  context.safeContent("<b>foo</b>");
  equals(context.get(1), "&lt;b&gt;foo&lt;/b&gt;", "foo was added to the context");
  equals(context.length, 2, "only foo was added to the context");
});

test("should push a list of escaped strings onto the context", function () {
  context.safeContent("<b>foo</b>", "<b>bar</b>", "<b>entry</b>");
  equals(context.get(1), "&lt;b&gt;foo&lt;/b&gt;", "foo was added to the context");
  equals(context.get(2), "&lt;b&gt;bar&lt;/b&gt;", "bar was added to the context");
  equals(context.get(3), "&lt;b&gt;entry&lt;/b&gt;", "entry was added to the context");
  equals(context.length, 4, "context has the correct length");
});

// ..........................................................
// push()
//
module("SC.RenderContext#push", {
  setup: function() {
    context = SC.RenderContext();
  },

  teardown: function() {
    context = null;
  }
});

test("it should add the line to the strings and increase the length", function() {
  equals(context.length, 1, "precondition - length=");

  context.push("sample line");
  equals(context.length, 2, "length should increase");
  equals(context.get(1), "sample line", "line should be in strings array");
});

test("it should accept multiple parameters, pushing each one into strings", function() {

  equals(context.length, 1, "precondition - length=");

  context.push("line1", "line2", "line3");
  equals(context.length, 4, "should add 3 lines to strings");
  equals(context.get(1), "line1", "1st item");
  equals(context.get(2), "line2", "2nd item");
  equals(context.get(3), "line3", "3rd item");
});

test("it should return receiver", function() {
  equals(context.push("line1"), context, "return value");
});

test("pushing a line onto a subcontext, should update the length in the parent context as well", function() {
  context.push("line1", "line2");
  var len = context.length ;

  var c2 = context.begin().push("line3");
  ok(context.length > len, "length should have increased");
});

// ..........................................................
// text()
//
module("SC.RenderContext#text", {
  setup: function() {
    context = SC.RenderContext();
  },

  teardown: function() {
    context = null;
  }
});

test("should escape passed HTML before pushing", function() {
  context.text("<b>test me!</b>");
  equals(context.get(1),'&lt;b&gt;test me!&lt;/b&gt;', 'escaped');
});


