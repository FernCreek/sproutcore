sc_require('system/object');

/**
  @class
  @private

  SC._PropertyChain is used as the bookkeeping system for notifying the KVO
  system of changes to computed properties that contains paths as dependent
  keys.

  Each instance of SC._PropertyChain serves as a node in a linked list. One node
  is created for each property in the path, and stores a reference to the name
  of the property and the object to which it belongs. If that property changes,
  the SC._PropertyChain instance notifies its associated computed property to
  invalidate, then rebuilds the chain with the new value.

  To create a new chain, call SC._PropertyChain.createChain() with the target,
  path, and property to invalidate if any of the objects in the path change.

  For example, if you called createChain() with 'foo.bar.baz', it would
  create a linked list like this:

   ---------------------     ---------------------     ---------------------
  | property:     'foo' |   | property:     'bar' |   | property:     'baz' |
  | nextProperty: 'bar' |   | nextProperty: 'baz' |   | nextProperty: undef |
  | next:           ------->| next:           ------->| next:     undefined |
   ---------------------     ---------------------     ---------------------

  @extends SC.Object
  @since SproutCore 1.5
*/

SC._PropertyChain = SC.Object.extend(SC.Copyable,
/** @scope SC.Object.prototype */ {
  /**
    The object represented by this node in the chain.

    @property {Object}
  */
  object: null,

  /**
    The key on the previous object in the chain that contains the object
    represented by this node in the chain.

    @property {String}
  */
  property: null,

  /**
    The target object. This is the object passed to createChain(), and the
    object which contains the +toInvalidate+ property that will be invalidated
    if +property+ changes.

    @property {Object}
  */
  target: null,

  /**
    The property of +target+ to invalidate when +property+ changes.

    @property {String}
  */
  toInvalidate: null,

  /**
    The property key on +object+ that contains the object represented by the
    next node in the chain.

    @property {String}
  */
  nextProperty: null,

  /**
    Whether this node in the chain was preceded by '@each', meaning this property
    should be watched on every item in the enumerable.

    @property {Boolean}
  */
  isAtEach: false,

  /**
    Registers this segment of the chain with the object it represents.

    This should be called with the object represented by the previous node in
    the chain as the first parameter. If no previous object is provided, it will
    assume it is the root node in the chain and treat the target as the previous
    object.

    @param {Object} [newObject] The object in the chain to hook to.
  */
  activate: function(newObject) {
    var curObject = this.get('object'),
        property  = this.get('property'),
        isAtEach = this.get('isAtEach'),
        nextObject;

    // If no parameter is passed, assume we are the root in the chain
    // and look up property relative to the target, since dependent key
    // paths are always relative.
    if (!newObject) { newObject = this.get('target'); }

    if (curObject && curObject !== newObject) {
      this.deactivate();
    }
    this.set('object', newObject);

    // In the special case of @each, we treat the enumerable as the next
    // property so just skip registering it
    if (newObject) {
      if (isAtEach) {
        // We must explicitly call the array version of the function because we only want to use this
        // version if '@each' was used.
        SC.CoreArrayPropertyChainSupport.registerDependentKeyWithChain.call(newObject, property, this);
      } else {
        newObject.registerDependentKeyWithChain(property, this);
      }
    }

    // now - lookup the object for the next one...
    if (this.next && !isAtEach) {
      nextObject = newObject ? newObject.get(property) : undefined;
      if (nextObject) {
        this.next.activate(nextObject);
      }
    }

    return this;
  },

  /**
    Removes this segment of the chain from the object it represents. This is 
    usually called when the object represented by the previous segment in the 
    chain changes.
  */
  deactivate: function() {
    var object = this.get('object'),
        property = this.get('property'),
        isAtEach = this.get('isAtEach');

    // If the chain element is not associated with an object,
    // we don't need to deactivate anything.
    if (object) {
      if (isAtEach) {
        // We must explicitly call the array version of the function because we only want to use this
        // version if '@each' was used.
        SC.CoreArrayPropertyChainSupport.removeDependentKeyWithChain.call(object, property, this);
      } else {
        object.removeDependentKeyWithChain(property, this);
      }
    }
    if (this.next && !isAtEach) {
      this.next.deactivate();
    }
    return this;
  },

  /**
    Invalidates the +toInvalidate+ property of the +target+ object.
  */
  notifyPropertyDidChange: function() {
    var target = this.get('target'),
        toInvalidate = this.get('toInvalidate'),
        isAtEach = this.get('isAtEach'),
        curObj, newObj;

    // Tell the target of the chain to invalidate the property
    // that depends on this element of the chain
    target.propertyDidChange(toInvalidate);

    // If there are more dependent keys in the chain, we need
    // to invalidate them and set them up again.
    if (this.next && !isAtEach) {
      // Get the new value of the object associated with this node to pass to
      // activate().
      curObj = this.get('object');
      newObj = curObj ? curObj.get(this.get('property')) : undefined;
      if (newObj) {
        this.next.activate(newObj); // reactivate down the line
      }
    }
  },

  /**
    Implements SC.Copyable. This is required to prevent 'object' from being copied over,
    which would break @each property paths that go more than one level deep.
  */
  copy: function() {
    var ret = SC._PropertyChain.create({
      property: this.get('property'),
      target: this.get('target'),
      toInvalidate: this.get('toInvalidate'),
      nextProperty: this.get('nextProperty'),
      isAtEach: this.get('isAtEach')
    });
    if (this.next) {
      // Continue copying down the chain.
      ret.next = this.next.copy();
    }
    return ret;
  }

  // @if (debug)
  ,
  /**
    Returns a string representation of the chain segment.

    @returns {String}
  */
  toString: function() {
    return "SC._PropertyChain(target: %@, property: %@)".fmt(
      this.get('target'), this.get('property'));
  }
  // @endif
});

SC._PropertyChain.createChain = function(path, target, toInvalidate) {
  var parts = path.split('.'),
      len = parts.length,
      i,
      isRoot,
      isAtEach,
      property,
      nextProperty,
      node,
      root,
      tail;

  for (i = 0; i < len; ++i) {
    isRoot = (i === 0);
    isAtEach = (parts[i] === '@each');
    if (isAtEach) {
      // Skip over the @each string.
      i++;
    }

    property = parts[i];
    nextProperty = parts[i + 1];
    if (nextProperty === '@each') {
      // Skip over the @each string.
      nextProperty = parts[i + 2];
    }

    node = SC._PropertyChain.create({
      property: property,
      target: target,
      toInvalidate: toInvalidate,
      nextProperty: nextProperty,
      isAtEach: isAtEach
    });

    if (tail) {
      tail.next = node;
    }

    tail = node;

    if (isRoot) {
      root = node;
    }
  }

  return root;
};
