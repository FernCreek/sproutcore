// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*global module test ok equals */
module("Render Context--Escaping Attribute Values");
test("Escaping Attribute Values", function() {
  var input = [];
  var output = [];

  input.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  output.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  input.push('abcdefghijklmnopqrstuvwxyz');
  output.push('abcdefghijklmnopqrstuvwxyz');
  input.push('0123456789');
  output.push('0123456789');

  input.push(',./;\'[]\\-=');
  output.push('&#x2c;&#x2e;&#x2f;&#x3b;&#x27;&#x5b;&#x5d;&#x5c;&#x2d;&#x3d;');
  input.push('<>?:"{}|_+');
  output.push('&#x3c;&#x3e;&#x3f;&#x3a;&#x22;&#x7b;&#x7d;&#x7c;&#x5f;&#x2b;');
  input.push('`~ !@#$%^&*()');
  output.push('&#x60;&#x7e;&#x20;&#x21;&#x40;&#x23;&#x24;&#x25;&#x5e;&#x26;&#x2a;&#x28;&#x29;');

  input.push('" onmouseover="alert(1)"');
  output.push('&#x22;&#x20;onmouseover&#x3d;&#x22;alert&#x28;1&#x29;&#x22;');
  input.push('\' onmouseover=\'alert(1)\'');
  output.push('&#x27;&#x20;onmouseover&#x3d;&#x27;alert&#x28;1&#x29;&#x27;');
  input.push('` onmouseover="alert(1)"');
  output.push('&#x60;&#x20;onmouseover&#x3d;&#x22;alert&#x28;1&#x29;&#x22;');
  
  for (var i = 0; i < input.length; ++i) {
    ok(SC.RenderContext.escapeAttributeValue(input[i]) === output[i], "Properly escapes attribute value " + input[i]);
  }
});

test("Should accept number argument", function() {
  var number = 123456789,
    numStr = number.toString();

  equals(numStr, SC.RenderContext.escapeAttributeValue(number), "Properly produces string when invoked with a number argument");
});
