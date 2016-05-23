// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('system/builder');

/** set update mode on context to replace content (preferred) */
SC.MODE_REPLACE = 'replace';

/** set update mode on context to append content */
SC.MODE_APPEND = 'append';

/** set update mode on context to prepend content */
SC.MODE_PREPEND = 'prepend';

/** list of numeric properties that should not have 'px' appended */
SC.NON_PIXEL_PROPERTIES = ['zIndex', 'fontWeight', 'opacity'];

/** a list of styles that get expanded into multiple properties, add more as you discover them */
SC.COMBO_STYLES = {
  WebkitTransition: ['WebkitTransitionProperty', 'WebkitTransitionDuration', 'WebkitTransitionDelay', 'WebkitTransitionTimingFunction']
};

/**
 @namespace

 A RenderContext is a builder that can be used to generate HTML for views or
 to update an existing element.  Rather than making changes to an element
 directly, you use a RenderContext to queue up changes to the element,
 finally applying those changes or rendering the new element when you are
 finished.

 You will not usually create a render context yourself but you will be passed
 a render context as the first parameter of your render() method on custom
 views.

 Render contexts are essentially arrays of strings.  You can add a string to
 the context by calling push().  You can retrieve the entire array as a
 single string using join().  This is basically the way the context is used
 for views.  You are passed a render context and expected to add strings of
 HTML to the context like a normal array.  Later, the context will be joined
 into a single string and converted into real HTML for display on screen.

 In addition to the core push and join methods, the render context also
 supports some extra methods that make it easy to build tags.

 context.begin() <-- begins a new tag context
 context.end() <-- ends the tag context...
 */
SC.RenderContext = SC.Builder.create({

  SELF_CLOSING: SC.CoreSet.create().addEach(['area', 'base', 'basefront', 'br', 'hr', 'input', 'img', 'link', 'meta']),

  /**
   When you create a context you should pass either a tag name or an element
   that should be used as the basis for building the context.  If you pass
   an element, then the element will be inspected for class names, styles
   and other attributes.  You can also call update() or replace() to
   modify the element with you context contents.

   If you do not pass any parameters, then we assume the tag name is 'div'.

   A second parameter, parentContext, is used internally for chaining.  You
   should never pass a second argument.

   @param {String|DOMElement} tagNameOrElement
   @returns {SC.RenderContext} receiver
   */
  init: function(tagNameOrElement, prevContext) {
    var strings, tagNameOrElementIsString;

    // if a prevContext was passed, setup with that first...
    if (prevContext) {
      this.prevObject = prevContext ;
      this.strings    = prevContext.strings ;
      this.offset     = prevContext.length + prevContext.offset ;
    }

    if (!this.strings) this.strings = [] ;

    // if tagName is string, just setup for rendering new tagName
    if (tagNameOrElement === undefined) {
      tagNameOrElement = 'div' ;
      tagNameOrElementIsString = YES ;
    }
    else if (tagNameOrElement === 'div'  ||  tagNameOrElement === 'label'  ||  tagNameOrElement === 'a') {
      // Fast path for common tags.
      tagNameOrElementIsString = YES ;
    }
    else if (SC.typeOf(tagNameOrElement) === SC.T_STRING) {
      tagNameOrElement = tagNameOrElement.toLowerCase() ;
      tagNameOrElementIsString = YES ;
    }

    if (tagNameOrElementIsString) {
      this._tagName     = tagNameOrElement ;
      this._needsTag    = YES ; // used to determine if end() needs to wrap tag
      this.needsContent = YES ;

      // increase length of all contexts to leave space for opening tag
      var c = this;
      while(c) { c.length++; c = c.prevObject; }

      this.strings.push(null);
      this._selfClosing = this.SELF_CLOSING.contains(tagNameOrElement);
    }
    else {
      this._elem        = tagNameOrElement ;
      this._needsTag    = NO ;
      this.length       = 0 ;
      this.needsContent = NO ;
    }
    return this ;
  },

  // ..........................................................
  // PROPERTIES
  //

  // NOTE: We store this as an actual array of strings so that browsers that
  // support dense arrays will use them.
  /**
   The current working array of strings.

   @property {Array}
   */
  strings: null,

  /**
   this initial offset into the strings array where this context instance
   has its opening tag.

   @property {Number}
   */
  offset: 0,

  /**
   the current number of strings owned by the context, including the opening
   tag.

   @property {Number}
   */
  length: 0,

  /**
   Specify the method that should be used to update content on the element.
   In almost all cases you want to replace the content.  Very carefully
   managed code (such as in CollectionView) can append or prepend content
   instead.

   You probably do not want to change this property unless you know what you
   are doing.

   @property {String}
   */
  updateMode: SC.MODE_REPLACE,

  /**
   YES if the context needs its content filled in, not just its outer
   attributes edited.  This will be set to YES anytime you push strings into
   the context or if you don't create it with an element to start with.
   */
  needsContent: NO,

  // ..........................................................
  // CORE STRING API
  //

  /**
   Returns the string at the designated index.  If you do not pass anything
   returns the string array.  This index is an offset from the start of the
   strings owned by this context.

   @param {Number} idx the index
   @returns {String|Array}
   */
  get: function(idx) {
    var strings = this.strings || [];
    return (idx === undefined) ? strings.slice(this.offset, this.length) : strings[idx+this.offset];
  },

  /**
   Adds a string to the render context for later joining. Note that you can
   pass multiple arguments to this method and each item will be pushed.
   This function is deprecated as it will never escape HTML special characters.
   You should use {@link safeContent} instead.

   @deprecated
   @param {...String} line - The line to push.
   @returns {SC.RenderContext} - The receiver
   */
  push: function (line) {
    var args = [false]; // prevent escaping to preserve old behavior
    var len = arguments.length, idx;

    for (idx = 0; idx < len; ++idx) {
      args.push(arguments[idx]);
    }

    return this.safeContent.apply(this, args);
  },

  /**
   Alias for {@link push}, so see its docs.
   @deprecated
   @param {...String} line - The line to push.
   @returns {SC.RenderContext} - The receiver
   */
  html: function (line) {
    return this.push.apply(this, arguments); // TODO_JA - verify that this works
  },

  /**
   Pushes all passed strings after escaping them. It is preferred that you use
   {@link safeContent} instead.

   @deprecated
   @param {...String} line The line to push.
   @returns {SC.RenderContext} receiver
   */
  text: function(line) {
    return this.safeContent.apply(this, arguments);
  },

  /**
   Accepts any number of strings and pushes them to this context. By
   default will escape each string. This can be controlled by passing
   a boolean as the first argument. This is the preferred method for
   adding content.

   @param {Boolean} [escape=true] - If the passed lines should be escaped
   @param {...String} line - The line to push.
   @returns {SC.RenderContext} - The receiver
   */
  safeContent: function (escape, line) {
    // first normalize the arguments
    var lines  = [];

    // handle escape default value
    if (SC.typeOf(escape) === SC.T_STRING) {
      lines.push(escape);
      escape = true;
    }

    // handle remaining arguments
    var len = arguments.length, idx;
    if (len > 1) {
      for (idx = 1; idx < len; ++idx) {
        lines.push(arguments[idx]);
      }
    }

    // ensure we have context's list of string
    if (!this.strings) {
      this.strings = [];
    }

    lines.forEach(function (line) {
      if (escape) {
        line = SC.RenderContext.escapeHTML(line);
      }
      this.strings.push(line);
    }, this);

    // adjust string length for context and all parents...
    var c = this;
    var lenOffset = lines.length;
    while(c) { c.length += lenOffset; c = c.prevObject; }

    this.needsContent = true;

    return this;
  },

  /**
   Joins the strings together, returning the result.  But first, this will
   end any open tags.

   @param {String} joinChar optional string to use in joins. def empty string
   @returns {String} joined string
   */
  join: function(joinChar) {
    // generate tag if needed...
    if (this._needsTag) this.end();

    var strings = this.strings;
    return strings ? strings.join(joinChar || '') : '' ;
  },

  // ..........................................................
  // GENERATING
  //

  /**
   Begins a new render context based on the passed tagName or element.
   Generate said context using end().

   @returns {SC.RenderContext} new context
   */
  begin: function(tagNameOrElement) {
    return SC.RenderContext(tagNameOrElement, this);
  },

  /**
   If the current context targets an element, this method returns the
   element.  If the context does not target an element, this method will
   render the context into an offscreen element and return it.

   @returns {DOMElement} the element
   */
  element: function() {
    return this._elem ? this._elem : SC.$(this.join())[0];
  },

  /**
   Removes an element with the passed id in the currently managed element.
   */
  remove: function(elementId) {
    if (!elementId) return ;

    var el, elem = this._elem ;
    if (!elem || !elem.removeChild) return ;

    el = document.getElementById(elementId) ;
    if (el) {
      el = elem.removeChild(el) ;
      el = null;
    }
  },

  /**
   If an element was set on this context when it was created, this method
   will actually apply any changes to the element itself.  If you have not
   written any inner html into the context, then the innerHTML of the
   element will not be changed, otherwise it will be replaced with the new
   innerHTML.

   Also, any attributes, id, classNames or styles you've set will be
   updated as well.  This also ends the editing context session and cleans
   up.

   @returns {SC.RenderContext} previous context or null if top
   */
  update: function() {
    var elem = this._elem,
      mode = this.updateMode,
      cq, value, factory, cur, next;

    this._innerHTMLReplaced = NO;

    if (!elem) {
      // throw "Cannot update context because there is no source element";
      return ;
    }

    cq = this.$();

    // replace innerHTML
    if (this.length>0) {
      this._innerHTMLReplaced = YES;
      if (mode === SC.MODE_REPLACE) {
        cq.html(this.join());
      } else {
        factory = elem.cloneNode(false);
        factory.innerHTML = this.join() ;
        cur = factory.firstChild ;
        while(cur) {
          next = cur.nextSibling ;
          elem.insertBefore(cur, next);
          cur = next ;
        }
        cur = next = factory = null ; // cleanup
      }
    }

    // attributes, styles, and class names will already have been set.

    // id="foo"
    if (this._idDidChange && (value = this._id)) {
      cq.attr('id', value);
    }

    // now cleanup element...
    elem = this._elem = null ;
    return this.prevObject || this ;
  },

  // these are temporary objects are reused by end() to avoid memory allocs.
  _DEFAULT_ATTRS: {},

  /**
   Ends the current tag editing context.  This will generate the tag string
   including any attributes you might have set along with a closing tag.

   The generated HTML will be added to the render context strings.  This will
   also return the previous context if there is one or the receiver.

   If you do not have a current tag, this does nothing.

   @returns {SC.RenderContext}
   */
  end: function() {
    // NOTE: If you modify this method, be careful to consider memory usage
    // and performance here.  This method is called frequently during renders
    // and we want it to be as fast as possible.

    // generate opening tag.

    // get attributes first.  Copy in className + styles...
    var tag = '', styleStr='', pair, joined, key , value,
      attrs = this._attrs, className = this._classNames,
      id = this._id, styles = this._styles, strings, selfClosing;

    // add tag to tag array
    tag = '<' + this._tagName ;

    // add any attributes...
    if (attrs || className || styles || id) {
      if (!attrs) attrs = this._DEFAULT_ATTRS ;
      if (id) attrs.id = id ;
      // old versions of safari (5.0)!!!! throw an error if we access
      // attrs.class. meh...
      if (className) attrs['class'] = className.join(' ');

      // add in styles.  note how we avoid memory allocs here to keep things
      // fast...
      if (styles) {
        for(key in styles) {
          if(!styles.hasOwnProperty(key)) continue ;
          value = styles[key];
          if (value === null || value === '') continue; // skip empty styles
          if (typeof value === SC.T_NUMBER && !SC.NON_PIXEL_PROPERTIES.contains(key)) value += "px";
          styleStr = styleStr + this._dasherizeStyleName(key)+": "+value + "; ";
        }
        attrs.style = styleStr;
      }

      // now convert attrs hash to tag array...
      tag = tag + ' '; // add space for joining0
      for(key in attrs) {
        if (!attrs.hasOwnProperty(key)) continue ;
        value = attrs[key];
        if (value === null) continue ; // skip empty attrs
        tag = tag + key + '="' + value + '" ';
      }

      // if we are using the DEFAULT_ATTRS temporary object, make sure we
      // reset.
      if (attrs === this._DEFAULT_ATTRS) {
        delete attrs.style;  delete attrs['class']; delete attrs.id;
      }

    }

    // this is self closing if there is no content in between and selfClosing
    // is not set to false.
    strings = this.strings;
    selfClosing = (this._selfClosing === NO) ? NO : (this.length === 1) ;
    tag = tag + (selfClosing ? ' />' : '>') ;

    strings[this.offset] = tag;

    // now generate closing tag if needed...
    if (!selfClosing) {
      strings.push('</' + this._tagName + '>');

      // increase length of receiver and all parents
      var c = this;
      while(c) { c.length++; c = c.prevObject; }
    }

    // if there was a source element, cleanup to avoid memory leaks
    this._elem = null;
    return this.prevObject || this ;
  },

  /**
   Generates a tag with the passed options.  Like calling context.begin().end().

   @param {String} tagName optional tag name.  default 'div'
   @param {Hash} opts optional tag options.  defaults to empty options.
   @returns {SC.RenderContext} receiver
   */
  tag: function(tagName, opts) {
    return this.begin(tagName, opts).end();
  },

  // ..........................................................
  // BASIC HELPERS
  //

  /**
   Reads outer tagName if no param is passed, sets tagName otherwise.

   @param {String} tagName pass to set tag name.
   @returns {String|SC.RenderContext} tag name or receiver
   */
  tagName: function(tagName) {
    if (tagName === undefined) {
      if (!this._tagName && this._elem) this._tagName = this._elem.tagName;
      return this._tagName;
    } else {
      this._tagName = tagName;
      this._tagNameDidChange = YES;
      return this ;
    }
  },

  /**
   Reads the outer tag id if no param is passed, sets the id otherwise.

   @private
   @param {String} [idName] - the id to set
   @returns {String|SC.RenderContext} - The id or the receiver
   */
  _idBase: function(idName) {
    if (idName === undefined) {
      if (!this._id && this._elem) this._id = this._elem.id;
      return this._id ;
    } else {
      this._id = idName;
      this._idDidChange = YES;
      return this;
    }
  },

  /**
   Getter/Setter for the id. Will unsafely set the id without escaping

   @deprecated
   @param {String} [idName] - The value to set the id as
   @returns {String|SC.RenderContext} - The id or the receiver
   */
  id: function (idName) {
    return this._idBase(idName);
  },

  /**
   Safe Getter/Setter for the id. Escapes the input if setting the id.

   @param {String} [idName] - The value to set the id as
   @param {Boolean} [escape=true] - If the new id should be escaped
   @returns {String|SC.RenderContext} - The id or the receiver
   */
  safeId: function (idName, escape) {
    escape = escape !== undefined ? escape : true;
    if (idName && !this._elem && escape) {
      idName = SC.RenderContext.escapeAttributeValue(idName);
    }
    return this._idBase(idName);
  },

  // ..........................................................
  // CSS CLASS NAMES SUPPORT
  //

  /**
   Returns the list of class names when we have no backing element.

   @returns {String[]} - The class names array
   @private
   */
  _getClassesNoElement: function () {
    // if there are no class names, create an empty array
    if (!this._classNames) {
      this._classNames = [];
    }

    return this._classNames;
  },

  /**
   Replaces our list of class names with the passed class names when we have no backing element.

   @param {String[]} classNames - The list of class names to add
   @param {Boolean} escape - If the class names should be escaped
   @private
   */
  _setClassesNoElement: function (classNames, escape) {
    this._classNames = [];

    var len, idx, val;
    for (idx = 0, len = classNames.length; idx < len; ++idx) {
      val = classNames[idx];
      if (escape) {
        val = SC.RenderContext.escapeAttributeValue(val);
      }
      this._classNames.push(val);
    }
  },

  /**
   Adds the passed class name to our list of class names.

   @param {String} className - The class name to add
   @private
   */
  _addClassNoElement: function (className) {
    var classes = this._getClassesNoElement();
    classes.push(className);
  },

  /**
   Removes the passed class name from our list of class names when we have no element.

   @param {String} className - The class name to remove
   @private
   */
  _removeClassNoElement: function (className) {
    var classes = this._getClassesNoElement();
    var idx = classes.indexOf(className);

    if (idx !== -1) {
      // if className is found, just null it out.  This will end up adding an
      // extra space to the generated HTML but it is faster than trying to
      // recompact the array.
      classes[idx] = null;
    }
  },

  /**
   Adds the pass class names to the current context.

   @param {String|String[]} classNames - The class name or an array of class names
   @param {Boolean} [escape=true] - If the class names should be escaped or not
   @returns {SC.RenderContext} - The receiver
   */
  safeAddClass: function (classNames, escape) {
    // normalize arguments
    if (SC.empty(classNames)) {
      return this;
    }

    escape = escape !== undefined ? escape : true;

    if (SC.typeOf(classNames) === SC.T_STRING) {
      classNames = [classNames];
    }

    var len = classNames.length, idx, $elem, entry;
    if (this._elem) {
      $elem = this.$();
      for (idx = 0; idx < len; ++idx) {
        $elem.addClass(classNames[idx]);
      }
    } else {
      for (idx = 0; idx < len; ++idx) {
        entry = classNames[idx];

        if (escape) {
          entry = SC.RenderContext.escapeAttributeValue(entry);
        }

        if (!this._hasClass(entry)) {
          this._addClassNoElement(entry);
        }
      }
    }

    return this;
  },

  /**
   Removes the specified className from the current tag.  This method has
   no effect if there is not an open tag.

   @param {String} className - The class to add
   @returns {SC.RenderContext} - The receiver
   */
  removeClass: function(className) {
    if (this._elem) {
      this.$().removeClass(className);
    } else {
      // remove the passed class & its escaped version, in case the user is always relying on us for escaping
      this._removeClassNoElement(className);
      this._removeClassNoElement(SC.RenderContext.escapeAttributeValue(className));
    }

    return this;
  },

  /**
   Returns if the outer tag current has the passed class name.

   @private
   @param {String} className - The class name to check
   @returns {Boolean} - If the outer tag has the passed class name
   */
  _hasClass: function(className) {
    var has;

    if (this._elem) {
      has = this.$().hasClass(className);
    } else {
      has = this._getClassesNoElement().indexOf(className) !== -1;
    }

    return has;
  },


  /**
   Returns if the outer tag current has the passed class name.

   @param {String} className - The class name to check, can be either escaped or unescaped
   @returns {Boolean} - If the outer tag has the passed class name
   */
  hasClass: function(className) {
    var has = this._hasClass(className);
    has = has || this._hasClass(SC.RenderContext.escapeAttributeValue(className));
    return has;
  },

  /**
   Gets all class names on the current context or replaces them with
   the passed array of class names.

   @param {String[]} [classNames] - The class names to set on the context
   @param {Boolean} [escape=true]
   @returns {String[]|SC.RenderContext} - classNames array or receiver
   */
  safeClassNames: function(classNames, escape) {
    var ret = this;

    escape = escape !== undefined ? escape : true;

    if (classNames) {
      if (this._elem) {
        this.resetClassNames();
        this.safeAddClass(classNames, escape);
      } else {
        this._setClassesNoElement(classNames, escape);
      }
    } else {
      if (this._elem) {
        ret = this.$().attr('class').split(' ');
      } else {
        ret = this._getClassesNoElement();
      }
    }

    return ret;
  },

  /**
   Removes all class names from the context.

   @returns {SC.RenderContext} - The receiver
   */
  resetClassNames: function() {
    if (this._elem) {
      this.$().removeClass();
    } else {
      this._setClassesNoElement([], false);
    }

    return this;
  },

  /**
   You can either pass a single class name and a boolean indicating whether
   the value should be added or removed, or you can pass an object with all
   the class names you want to add or remove with a boolean indicating
   whether they should be there or not.

   @param {String|Object} className - The class name or hash of classNames & booleans
   @param {Boolean} [shouldAdd] - If the className should be added or removed if a string
   @param {Boolean} [escape=true] - If the class names should be escaped
   @returns {SC.RenderContext} - The receiver
   */
  safeSetClass: function (className, shouldAdd, escape) {
    // normalize arguments

    escape = escape !== undefined ? escape : true;

    var tmp;
    if (SC.typeOf(className) === SC.T_STRING) {
      tmp = {};
      tmp[className] = !!shouldAdd;
      className = tmp;
    }

    var key, value;
    for(key in className) {
      if(className.hasOwnProperty(key)) {
        value = className[key];
        if (value) {
          this.safeAddClass(key, escape);
        } else {
          this.removeClass(key);
        }
      }
    }

    return this;
  },

  // ..........................................................
  // CSS CLASS NAMES SUPPORT - OLD DEPRECATED API
  //

  /**
   Adds the passed class names to the current context. This function
   is deprecated as it will never escape the class name. Use the
   safeAddClass function instead.

   @deprecated
   @param {String|String[]} nameOrClasses - The class name or an array of class names
   @returns {SC.RenderContext} - The receiver
   */
  addClass: function (nameOrClasses) {
    return this.safeAddClass(nameOrClasses, false);
  },

  /**
   Gets all class names on the current context or replaces them with
   the passed array of class names. This function is deprecated as it
   will never escape class names. Use safeClassNames instead.

   @deprecated
   @param {String[]} [classNames] - The class names to set on the context
   @returns {String[]|SC.RenderContext} - The classNames array or the receiver
   */
  classNames: function (classNames) {
    return this.safeClassNames(classNames, false);
  },

  /**
   You can either pass a single class name and a boolean indicating whether
   the value should be added or removed, or you can pass an object with all
   the class names you want to add or remove with a boolean indicating
   whether they should be there or not. This function is deprecated as it
   will never escape the passed in class names, use safeSetClass instead

   @deprecated
   @param {String|Object} className - The class name or hash of classNames & booleans
   @param {Boolean} [shouldAdd] - If the className should be added or removed if a string
   @returns {SC.RenderContext} - The receiver
   */
  setClass: function(className, shouldAdd) {
    return this.safeSetClass(className, shouldAdd, false);
  },

  // ..........................................................
  // CSS Styles Support
  //

  _STYLE_REGEX: /-?\s*([^:\s]+)\s*:\s*([^;]+)\s*;?/g,

  /**
   Retrieves or sets the current styles for the outer tag.  If you retrieve
   the styles hash to edit it, you must set the hash again in order for it
   to be applied to the element on rendering.

   Optionally you can also pass YES to the cloneOnModify param to cause the
   styles has to be cloned before it is edited.  This is useful if you want
   to start with a shared style hash and then optionally modify it for each
   context.

   @param {Hash} styles styles hash
   @param {Boolean} cloneOnModify
   @returns {Hash|SC.RenderContext} styles hash or receiver
   */
  styles: function(styles, cloneOnModify) {
    var attr, regex, match;
    if (styles === undefined) {

      // no styles are defined yet but we do have a source element.  Lazily
      // extract styles from element.
      if (!this._styles && this._elem) {
        // parse style...
        attr = this.$().attr('style');

        if (attr && (attr = attr.toString()).length>0) {
          // Ensure attributes are lower case for IE
          if(SC.browser.name === SC.BROWSER.ie) {
            attr = attr.toLowerCase();
          }
          styles = {};

          regex = this._STYLE_REGEX ;
          regex.lastIndex = 0;

          while(match = regex.exec(attr)) styles[this._camelizeStyleName(match[1])] = match[2];

          this._styles = styles;
          this._cloneStyles = NO;

        } else {
          this._styles = {};
        }

        // if there is no element or we do have styles, possibly clone them
        // before returning.
      } else {
        if (!this._styles) {
          this._styles = {};
        } else {
          if (this._cloneStyles) {
            this._styles = SC.clone(this._styles);
            this._cloneStyles = NO ;
          }
        }
      }

      return this._styles ;

      // set the styles if passed.
    } else {
      this._styles = styles ;
      this._cloneStyles = cloneOnModify || NO ;
      this._stylesDidChange = YES ;
      return this ;
    }
  },

  _deleteComboStyles: function(styles, key) {
    var comboStyles = SC.COMBO_STYLES[key],
      didChange = NO, tmp;

    if (comboStyles) {

      for (var idx=0, idxLen = comboStyles.length; idx < idxLen; idx++) {
        tmp = comboStyles[idx];
        if (styles[tmp]) {
          delete styles[tmp];
          didChange = YES;
        }
      }
    }
    return didChange;
  },

  /**
   Clears all of the tag's styles.
   @returns {SC.RenderContext} receiver
   */
  resetStyles: function() {
    this.styles({});
    return this;
  },

  /**
   Apply the passed styles to the tag.  You can pass either a single key
   value pair or a hash of styles.  Note that if you set a style on an
   existing element, it will replace any existing styles on the element.

   @param {String|Hash} nameOrStyles the style name or a hash of styles
   @param {String|Number} value style value if string name was passed
   @returns {SC.RenderContext} receiver
   */
  addStyle: function(nameOrStyles, value) {
    var key, didChange = NO, styles;

    if (this._elem) {
      // Temporary patch to support using null to clear CSS properties.
      // jQuery does not accept null values in the css function, so we
      // need to convert any nulls to ''. This is fixed on SC master,
      // so will become obsolete when we upgrade.
      if (typeof nameOrStyles === SC.T_STRING && value !== undefined) {
        if (value === null) {
          value = '';
        }
      } else {
        for (key in nameOrStyles) {
          if (!nameOrStyles.hasOwnProperty(key)) continue;
          if (nameOrStyles[key] === null) {
            nameOrStyles[key] = '';
          }
        }
      }
      this.$().css(nameOrStyles, value);
      return this;
    }

    // get the current hash of styles.  This will extract the styles and
    // clone them if needed.  This will get the actual styles hash so we can
    // edit it directly.
    styles = this.styles();

    // simple form
    if (typeof nameOrStyles === SC.T_STRING) {
      if (value === undefined) { // reader
        return styles[nameOrStyles];
      } else { // writer
        didChange = this._deleteComboStyles(styles, nameOrStyles);
        if (styles[nameOrStyles] !== value) {
          styles[nameOrStyles] = value ;
          didChange = YES ;
        }
        if (didChange) this._stylesDidChange = YES;
      }

      // bulk form
    } else {
      for(key in nameOrStyles) {
        if (!nameOrStyles.hasOwnProperty(key)) continue ;
        didChange = didChange || this._deleteComboStyles(styles, key);
        value = nameOrStyles[key];
        if (styles[key] !== value) {
          styles[key] = value;
          didChange = YES;
        }
      }
      if (didChange) this._stylesDidChange = YES ;
    }

    return this ;
  },

  /**
   Removes the named style from the style hash.

   Note that if you delete a style, the style will not actually be removed
   from the style hash.  Instead, its value will be set to null.

   @param {String} styleName
   @returns {SC.RenderContext} receiver
   */
  removeStyle: function(styleName) {
    if (this._elem) {
      this.$().css(styleName, '');
      return this;
    }

    // avoid case where no styles have been defined
    if (!this._styles) return this;

    // get styles hash.  this will clone if needed.
    var styles = this.styles();
    if (styles[styleName]) {
      styles[styleName] = null;
      this._stylesDidChange = YES ;
    }
  },

  // ..........................................................
  // ARBITRARY ATTRIBUTES SUPPORT
  //

  /**
   Accepts an attribute and its value to add to the context or an object of attributes & their values. This function
   should NOT be used to set the class or style attribute use their specific functions instead.

   @param {String|Object} nameOrAttrs - The attribute or an object of attributes & values to set on the context
   @param {String|Number} [value] - The value of the attribute to set
   @param {Boolean} [escape=true] - If the attribute values should be escaped
   @returns {SC.RenderContext} - The receiver
   */
  safeAttr: function (nameOrAttrs, value, escape) {
    // normalize arguments

    escape = escape !== undefined ? escape : true;

    var tmp;
    if (SC.typeOf(nameOrAttrs) === SC.T_STRING) {
      tmp = {};
      tmp[nameOrAttrs] = value;
      nameOrAttrs = tmp;
    }

    // validate input
    // @if (debug)
    if (nameOrAttrs.hasOwnProperty('class')) {
      SC.Logger.warn('Using attribute functions to set class. Should be using class functions instead.');
    }
    if (nameOrAttrs.hasOwnProperty('style')) {
      SC.Logger.warn('Using attribute functions to set style. Should be using style functions instead.');
    }
    // @endif

    var key, attrValue;
    if (this._elem) {
      this.$().attr(nameOrAttrs);
    } else {
      if (!this._attrs) {
        this._attrs = {};
      }

      for(key in nameOrAttrs) {
        if (nameOrAttrs.hasOwnProperty(key)) {
          attrValue = nameOrAttrs[key];
          if (escape) {
            attrValue = SC.RenderContext.escapeAttributeValue(attrValue);
          }

          this._attrs[key] = attrValue;
        }
      }
    }

    return this;
  },

  /**
   Removes the attribute with the passed name. This should NOT be used to reset styles or class names.

   @param {String} name - The name of the attribute to remove
   @returns {SC.RenderContext} - The receiver
   */
  removeAttr: function (name) {
    // validate input
    // @if (debug)
    if (name === 'class') {
      SC.Logger.warn('Using removeAttr to clear classes. Should be using class functions instead.');
    }
    if (name === 'style') {
      SC.Logger.warn('Using removeAttr to clear styles. Should be using style functions instead.');
    }
    // @endif

    if (this._elem) {
      this.$().removeAttr(name);
    } else if (this._attrs) {
      delete this._attrs[name];
    }

    return this;
  },

  // ..........................................................
  // ARBITRARY ATTRIBUTES SUPPORT - OLD DEPRECATED API
  //

  /**
   Accepts an attribute and its value to add to the context or an object of attributes & their values. This function
   is deprecated as it will never escape attribute values. Use safeAttr instead.

   @deprecated
   @param {String|Object} nameOrAttrs - The attr name or hash of attrs.
   @param {String} value - The attribute value if attribute name was passed
   @returns {SC.RenderContext} - The receiver
   */
  attr: function (nameOrAttrs, value) {
    return this.safeAttr(nameOrAttrs, value, false);
  },

  /**
   Convenience function to set the title attribute. This function will escape the attribute value. This function is
   deprecated. Use safeAttr instead

   @deprecated
   @param {String} value - The title attribute value
   @returns {SC.RenderContext} - The receiver
   */
  title: function (value) {
    return this.safeAttr('title', value);
  },

  //
  // COREQUERY SUPPORT
  //
  /**
   Returns a CoreQuery instance for the element this context wraps (if
   it wraps any). If a selector is passed, the CoreQuery instance will
   be for nodes matching that selector.

   Renderers may use this to modify DOM.
   @return {jQuery}
   */
  $: function(sel) {
    var ret, elem = this._elem;
    ret = !elem ? SC.$([]) : (sel === undefined) ? SC.$(elem) : SC.$(sel, elem);
    elem = null;
    return ret;
  },


  /** @private
   */
  _camelizeStyleName: function(name) {
    // IE wants the first letter lowercase so we can allow normal behavior
    var needsCap = name.match(/^-(webkit|moz|o)-/),
      camelized = SC.String.camelize(name);

    if (needsCap) {
      return camelized.substr(0,1).toUpperCase() + camelized.substr(1);
    } else {
      return camelized;
    }
  },

  /** @private
   Converts camelCased style names to dasherized forms
   */
  _dasherizeStyleName: function(name) {
    var dasherized = SC.String.dasherize(name);
    if (dasherized.match(/^(webkit|moz|ms|o)-/)) { dasherized = '-'+dasherized; }
    return dasherized;
  }

});

/**
 css is an alias for addStyle().  This this object more CoreQuery like.
 */
SC.RenderContext.fn.css = SC.RenderContext.fn.addStyle;

(function() {
  var _escapeHTMLRegex = /[&<>]/g, _escapeHTMLMethod = function(match) {
    switch(match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      case '/': return '&#x2f;';
    }
  };

  var _escapeAttributeRegex = /[^A-Za-z0-9]/g, _escapeAttributeMethod = function (match) {
    var charCode = match.charCodeAt(0),
      value = match;

    // replaces all non-alphanumeric characters with an ASCII value less that 256 with their hex equivalent
    // This protects attribute values in single quotes, double quotes, or with unquoted attributes
    if (!SC.none(charCode) && charCode < 256) {
      value = '&#x%@;'.fmt(charCode.toString(16)); // generate &#xHH; e.g. ' => &#x27;
    }

    return value;
  };

  /**
   Helper method escapes the passed string to ensure HTML is displayed as
   plain text.  You should make sure you pass all user-entered data through
   this method to avoid errors.  You can also do this with the text() helper
   method on a render context.

   @param {String|Number} text value to escape
   @returns {String} string with all HTML values properly escaped
   */
  SC.RenderContext.escapeHTML = function(text) {
    if (!text) return '';
    if (SC.typeOf(text) === SC.T_NUMBER) { text = text.toString(); }
    return text.replace(_escapeHTMLRegex, _escapeHTMLMethod);
  };

  /**
   Helper method escapes the passed string to be safely set in an attribute.
   You should make sure you pass all user-entered data through
   this method or escapeHTML to avoid errors.

   @param {String|Number} value value to escape
   @returns {String} string with all HTML values properly escaped for setting as an attribute value
   */
  SC.RenderContext.escapeAttributeValue = function (value) {
    if (!value) return '';
    if (SC.typeOf(value) === SC.T_NUMBER) { value = value.toString(); }
    return value.replace(_escapeAttributeRegex, _escapeAttributeMethod);
  };
})();
