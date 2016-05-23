// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test equals context ok same */

var context = null;

// ..........................................................
// hasClass()
//
module("SC.RenderContext#hasClass", {
  setup: function() {
    context = SC.RenderContext();
    context._classNames = ['classA', '\'classC\'', '&#x27;classE&#x27;'];
  }
});

test("should return true if context classNames has class name", function () {
  equals(context.hasClass('classA'), true, 'should have classA');
  equals(context.hasClass('\'classC\''), true, 'should have \'classC\'');
  equals(context.hasClass('&#x27;classE&#x27;'), true, 'should have \'classE\'');
  equals(context.hasClass('\'classE\''), true, 'should have \'classE\'');
  equals(context.hasClass('\'classA\''), false, 'should not have \'classA\'');
});

test("should return true if a context(with a backing element) classNames has class name", function () {
  context._elem = true;
  context.$ = function() {
    return {
      hasClass: function(className) {
        return className === 'classG';
      }
    };
  };
  equals(context.hasClass('classG'), true, 'should have classG');
});

// ..........................................................
// removeClass()
//
module("SC.RenderContext#removeClass", {
  setup: function() {
    context = SC.RenderContext();
    context._classNames = ['classA', '\'classB\'', '&#x27;classC&#x27;'];
  }
});

test("should remove class if already in classNames array", function() {
  context.removeClass('classA');
  equals(context._classNames.indexOf('classA') === -1, true, "does not have classA");
  context.removeClass('classB');
  equals(context._classNames.indexOf('\'classB\'') !== -1, true, "still has \'classB\'");
  context.removeClass('\'classB\'');
  equals(context._classNames.indexOf('\'classB\'') === -1, true, "does not have \'classB\'");
  context.removeClass('\'classC\'');
  equals(context._classNames.indexOf('\'classC\'') === -1, true, "does not have \'classC\'");
});

test("should remove classes if the context has a backing element", function () {
  context._elem = true;
  context._elemClassNames = ["classD"];
  context.$ = function () {
    return {
      removeClass: function (className) {
        var idx = context._elemClassNames.indexOf(className);
        if(idx >= 0) {
          context._elemClassNames.splice(idx, 1);
        }
      }
    };
  };
  context.removeClass('classD');
  equals(context._elemClassNames.indexOf('classD') === -1, true, "does not have classD");
});

test('should return receiver', function() {
  equals(context.removeClass('foo'), context, 'receiver');
});

test("should do nothing if class name not in array", function() {
  context.removeClass('imaginary');
  same(context._classNames, ['classA', '\'classB\'', '&#x27;classC&#x27;'], 'did not change');
});

test("should do nothing if there are no class names", function() {
  context = context.begin();
  same(context.classNames(), [], 'precondition - no class names');

  context.removeClass('foo');
  same(context.classNames(), [], 'still no class names -- and no errors');
});

// ..........................................................
// safeAddClass
//
module("SC.RenderContext#safeAddClass", {
  setup: function() {
    context = SC.RenderContext();
  },
  teardown: function() {
    context = null;
  }
});

test("should add class name to class name array once", function() {
  context.safeAddClass('foo');
  context.safeAddClass('foo');
  equals(context._classNames[0], 'foo', 'foo added to class names');
  equals(context._classNames.length, 1, 'classNames has 1 entry');
});

test("should only add class names once", function() {
  context.safeAddClass(['foo', 'bar']);
  context.safeAddClass(['foo', 'bar']);
  equals(context._classNames[0], 'foo', 'foo added to class names');
  equals(context._classNames[1], 'bar', 'bar added to class names');
  equals(context._classNames.length, 2, 'classNames has 2 entries');
});

test("should add class name escaped to class name array once", function() {
  context.safeAddClass('\'foo\'');
  context.safeAddClass('\'foo\'');
  equals(context._classNames[0], '&#x27;foo&#x27;', 'foo escaped and added to class names');
  equals(context._classNames.length, 1, 'classNames has 1 entry');
});

test("should only add escaped class names once", function() {
  context.safeAddClass(['\'foo\'', '\'bar\'']);
  context.safeAddClass(['\'foo\'', '\'bar\'']);
  equals(context._classNames[0], '&#x27;foo&#x27;', 'foo added to class names');
  equals(context._classNames[1], '&#x27;bar&#x27;', 'bar added to class names');
  equals(context._classNames.length, 2, 'classNames has 2 entries');
});

module("SC.RenderContext#safeAddClassElement", {
  setup: function() {
    context = SC.RenderContext();
    context._elem = true;
    context._elemClassNames = [];
    context.$ = function () {
      return {
        addClass: function (classNames) {
          context._elemClassNames = context._elemClassNames.concat(classNames);
        }
      };
    };
  },
  teardown: function() {
    context = null;
  }
});

test("should add class name to the element", function() {
  context.safeAddClass('foo');
  equals(context._elemClassNames[0], 'foo', 'foo added to class names');
});

test("should add class names to the element", function() {
  context.safeAddClass(['foo', 'bar']);
  equals(context._elemClassNames[0], 'foo', 'foo added to class names');
  equals(context._elemClassNames[1], 'bar', 'bar added to class names');
});

// ..........................................................
// addClass()
//
module("SC.RenderContext#addClass", {
  setup: function() {
    context = SC.RenderContext().classNames(['foo']) ;
  }
});

test("should return receiver", function() {
  equals(context.addClass('foo'), context, "receiver");
});

test("should add class name to existing classNames array on currentTag", function() {
  context.addClass('bar');
  same(context.classNames(), ['foo', 'bar'], 'has classes');
});

test("should only add class name once - does nothing if name already in array", function() {
  same(context.classNames(), ['foo'], 'precondition - has foo classname');
  context.addClass('foo');
  same(context.classNames(), ['foo'], 'no change');
});

// ..........................................................
//safeSetClass
//
module("SC.RenderContext#safeSetClass", {
  setup: function() {
    context = SC.RenderContext();
  },
  teardown: function() {
    context = null;
  }
});

test("should add, then remove a class from the context", function() {
  context.safeSetClass('foo', true);
  equals(context._classNames[0], 'foo', 'foo added to the context');
  context.safeSetClass('foo', false);
  equals(context._classNames[0], null, 'foo removed from the context');
});

test("should add, then remove classes from the context via object", function() {
  context.safeSetClass({
    'foo': true,
    'bar': true
  });
  equals(context._classNames[0], 'foo', 'foo added to the context');
  equals(context._classNames[1], 'bar', 'bar added to the context');

  context.safeSetClass({
    'foo': false,
    'bar': false
  });
  equals(context._classNames[0], null, 'foo removed from the context');
  equals(context._classNames[1], null, 'bar removed from the context');
});

test("should add, then remove an escaped class from the context", function() {
  context.safeSetClass('\'foo\'', true);
  equals(context._classNames[0], '&#x27;foo&#x27;', 'foo added to the context');
  context.safeSetClass('\'foo\'', false);
  equals(context._classNames[0], null, 'foo removed from the context');
});

test("should add, then remove escaped classes from the context via object", function() {
  context.safeSetClass({
    '\'foo\'': true,
    '\'bar\'': true
  });
  equals(context._classNames[0], '&#x27;foo&#x27;', 'foo added to the context');
  equals(context._classNames[1], '&#x27;bar&#x27;', 'bar added to the context');

  context.safeSetClass({
    '\'foo\'': false,
    '\'bar\'': false
  });
  equals(context._classNames[0], null, 'foo removed from the context');
  equals(context._classNames[1], null, 'bar removed from the context');
});

// ..........................................................
// setClass
//
module("SC.RenderContext#setClass", {
  setup: function() {
    context = SC.RenderContext().addClass('foo') ;
  }
});

test("should add named class if shouldAdd is YES", function() {
  ok(!context.hasClass("bar"), "precondition - does not have class bar");
  context.setClass("bar", YES);
  ok(context.hasClass("bar"), "now has bar");
});

test("should remove named class if shouldAdd is NO", function() {
  ok(context.hasClass("foo"), "precondition - has class foo");
  context.setClass("foo", NO);
  ok(!context.hasClass("foo"), "should not have foo ");
});

test("should return receiver", function() {
  equals(context, context.setClass("bar", YES), "returns receiver");
});

test("should add/remove all classes if a hash of class names is passed", function() {
  ok(context.hasClass("foo"), "precondition - has class foo");
  ok(!context.hasClass("bar"), "precondition - does not have class bar");

  context.setClass({ foo: NO, bar: YES });

  ok(context.hasClass("bar"), "now has bar");
  ok(!context.hasClass("foo"), "should not have foo ");
});

// ..........................................................
//safeClassNames
//
module("SC.RenderContext#safeSetClass", {
  setup: function() {
    context = SC.RenderContext();
  },
  teardown: function() {
    context = null;
  }
});

test("classNames sets the classNames", function() {
  context.safeClassNames(['foo', 'bar']);
  equals(context._classNames[0], 'foo', 'foo added to the context');
  equals(context._classNames[1], 'bar', 'bar added to the context');
});

test("classNames gets the classNames", function() {
  var names;
  context._classNames = ['foo', 'bar'];
  names = context.safeClassNames();
  equals(names[0], 'foo', 'got foo from the class names');
  equals(names[1], 'bar', 'got bar from the class names');
});

test("classNames sets the escaped classNames", function() {
  context.safeClassNames(['\'foo\'', '\'bar\'']);
  equals(context._classNames[0], '&#x27;foo&#x27;', 'foo added to the context');
  equals(context._classNames[1], '&#x27;bar&#x27;', 'bar added to the context');
});

// ..........................................................
//safeClassNames with a fake element
//
module("SC.RenderContext#safeSetClassElement", {
  setup: function() {
    context = SC.RenderContext();
    context._elem = true;
    context._elemClassNames = '';
    context.$ = function() {
      return {
        attr: function() {
          return context._elemClassNames;
        },
        addClass: function(className) {
          context._elemClassNames += className + ' ';
        },
        removeClass: function(){}
      };
    };
  },
  teardown: function() {
    context = null;
  }
});

test("classNames sets the element classNames", function() {
  context.safeClassNames(['foo', 'bar']);
  equals(context._elemClassNames, 'foo bar ', 'foo added to the context');
});

test("classNames gets the element classNames", function() {
  var names;
  context._elemClassNames = 'foo bar';
  names = context.safeClassNames();
  equals(names[0], 'foo', 'got foo from the class names');
  equals(names[1], 'bar', 'got bar from the class names');
});

// ..........................................................
// classNames()
//
module("SC.RenderContext#classNames", {
  setup: function() {
    context = SC.RenderContext() ;
  }
});

test("returns empty array if no current class names", function() {
  same(context.classNames(), [], 'classNames') ;
});

test("classNames(array) updates class names", function() {
  var cl = 'bar baz'.w();
  equals(context.classNames(cl), context, "returns receiver");
  same(context.classNames(), cl, 'class names');
});

test("returns classNames if set", function() {
  context.classNames('bar'.w());
  same(context.classNames(), ['bar'], 'classNames');
});

test("extracts class names from element on first retrieval", function() {
  var elem = document.createElement('div');
  SC.$(elem).attr('class', 'foo bar');
  context = SC.RenderContext(elem);

  var result = context.classNames();
  same(result, ['foo', 'bar'], 'extracted class names');
});