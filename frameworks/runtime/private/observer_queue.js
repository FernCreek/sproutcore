// ==========================================================================
// Project:   SproutCore Costello - Property Observing Library
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('mixins/observable');
sc_require('system/set');

// ........................................................................
// OBSERVER QUEUE
//
// This queue is used to hold observers when the object you tried to observe
// does not exist yet.  This queue is flushed just before any property
// notification is sent.

/**
  @namespace

  The private ObserverQueue is used to maintain a set of pending observers.
  This allows you to setup an observer on an object before the object exists.

  Whenever the observer fires, the queue will be flushed to connect any
  pending observers.

  @private
  @since SproutCore 1.0
*/
SC.Observers = {

  queue: [],

  /**
   @private

   Attempt to add the named observer.  If the observer cannot be found, put
   it into a queue for later.
   
   @returns {Array} The tuple representing the property path of the observer that was added
  */
  addObserver: function(propertyPath, target, method, pathRoot) {
    var tuple, ret;

    // try to get the tuple for this.
    if (typeof propertyPath === "string") {
      tuple = SC.tupleForPropertyPath(propertyPath, pathRoot) ;
      ret = tuple;
    } else {
      tuple = propertyPath;
    }

    // if a tuple was found and is observable, add the observer immediately...
    if (tuple && tuple[0].addObserver) {
      tuple[0].addObserver(tuple[1],target, method) ;

    // otherwise, save this in the queue.
    } else {
      this.queue.push([propertyPath, target, method, pathRoot]) ;
    }
    
    return ret;
  },

  /**
    @private

    Remove the observer.  If it is already in the queue, remove it.  Also
    if already found on the object, remove that.

    @returns {Boolean} true if an observer was removed
  */
  removeObserver: function(propertyPath, target, method, pathRoot) {
    var idx, queue, tuple, item, newQueue, removed = false;

    tuple = SC.tupleForPropertyPath(propertyPath, pathRoot) ;
    if (tuple) {
      tuple[0].removeObserver(tuple[1], target, method) ;
      removed = true;
    }

    // tests show that the fastest way is to create a new array. On Safari,
    // it is fastest to set to null then loop over again to collapse, but for all other browsers
    // it is not. Plus, this code shouldn't get hit very often anyway (it may not ever get hit
    // for some apps).
    idx = this.queue.length;
    queue = this.queue;
    newQueue = [];
    while(--idx >= 0) {
      item = queue[idx];

      if (item[0] !== propertyPath || item[1] !== target || item[2] !== method || item[3] !== pathRoot) {
        newQueue.push(item);
      } else {
        removed = true;
      }
    }

    // even though performance probably won't be a problem, we are defensive about memory alloc.
    this.queue = newQueue;
    
    return removed;
  },

  /**
    @private

    Range Observers register here to indicate that they may potentially
    need to start observing.
  */
  addPendingRangeObserver: function(observer) {
    var ro = this.rangeObservers;
    if (!ro) ro = this.rangeObservers = SC.CoreSet.create();
    ro.add(observer);
    return this ;
  },

  _TMP_OUT: [],

  //@ifdef DEBUG
  _temporaryObservers: {},
  //@endif

  /**
    Flush the queue.  Attempt to add any saved observers.
  */
  flush: function(object) {
    // flush any observers that we tried to setup but didn't have a path yet
    var oldQueue = this.queue,
        queueLen = oldQueue.length,
        newQueue,
        i,
        item,
        tuple,
        chainedPath,
        firstChar,
        dotIdx,
        starIdx;

    if (oldQueue && queueLen > 0) {
      newQueue = (this.queue = []) ;

      for (i=0; i<queueLen; i++ ) {
        item = oldQueue[i];
        if ( !item ) continue;

        tuple = SC.tupleForPropertyPath( item[0], item[3] );
        // check if object is observable (yet) before adding an observer
        if( tuple && tuple[0].addObserver ) {
          tuple[0].addObserver( tuple[1], item[1], item[2] );
        } else {
          // Couldn't find the object, create a temporary observer that will hook up
          // the real observer when the object becomes available.
          if (item[0].length) {
            chainedPath = null;
            firstChar = item[0][0];
            if (firstChar === '.') {
              // '.some.property.path' => convert first '.' to '*'
              chainedPath = '*' + item[0].slice(1);
            } else if (firstChar !== '*') {
              // Can't deal with the case where the path already begins with '*'.
              // We can't hook up the observer, since if we could, we wouldn't need
              // to try to hook up the temporary observer.

              // Now handle paths with no leading '.' or '*'.
              if (item[3]) {
                // We have a root object, add '*' to the path.
                starIdx = item[0].indexOf('*');
                if (starIdx >= 0) {
                  // Path has a '*' in it, swap it for '.' and add a leading '*'.
                  chainedPath = '*' + item[0].slice(0, starIdx) + '.' + item[0].slice(starIdx + 1);
                } else {
                  // No '*' in path, add a leading '*'.
                  chainedPath = '*' + item[0];
                }
              } else {
                dotIdx = item[0].indexOf('.');
                starIdx = item[0].indexOf('*');
                if (dotIdx >= 0 && starIdx < 0) {
                  // We have a path with only '.'s in it. Convert the first '.' to '*'.
                  chainedPath = item[0].slice(0, dotIdx) + '*' + item[0].slice(dotIdx + 1);
                } else if (dotIdx >= 0 && starIdx > dotIdx) {
                  // We have a path with '.' followed by '*'.
                  // Replace first '.' with '*' and first '*' with '.'
                  chainedPath = item[0].slice(0, dotIdx) + '*' + item[0].slice(dotIdx + 1, starIdx - dotIdx - 1) + '.' + item[0].slice(starIdx + 1);
                }
              }
            }
            if (chainedPath) {
              tuple = SC.tupleForPropertyPath(chainedPath, item[3]);
              if (tuple && tuple[0].addObserver) {
                (function(tuple, item) {
                  //@ifdef DEBUG
                  var temporaryPath = chainedPath;
                  var temporaryObservers = SC.Observers._temporaryObservers;
                  temporaryObservers[temporaryPath] = (temporaryObservers[temporaryPath] || 0) + 1;
                  //@endif

                  tuple[0].addObserver(tuple[1], item[1], function tempObserver() {
                    var innerTuple = SC.tupleForPropertyPath( item[0], item[3] );
                    if (innerTuple && innerTuple[0].addObserver) {
                      //@ifdef DEBUG
                      if (--temporaryObservers[temporaryPath] === 0) {
                        delete temporaryObservers[temporaryPath];
                      }
                      //@endif

                      tuple[0].removeObserver(tuple[1], item[1], tempObserver);
                      innerTuple[0].addObserver(innerTuple[1], item[1], item[2]);
                    }
                  });
                })(tuple, item);
              } else {
                // Item not observable, fall back to old way.
                newQueue.push(item);
              }
            } else {
              // Could not construct a valid path for the temporary observer, fall back to the old way.
              newQueue.push(item);
            }
          }
        }
      }
    }

    // if this object needsRangeObserver then see if any pending range
    // observers need it.
    if ( object._kvo_needsRangeObserver ) {
      var set = this.rangeObservers,
          len = set ? set.get('length') : 0,
          out = this._TMP_OUT,
          ro;

      for ( i=0; i<len; i++ ) {
        ro = set[i]; // get the range observer
        if ( ro.setupPending(object) ) {
          out.push(ro); // save to remove later
        }
      }

      // remove any that have setup
      if ( out.length > 0 ) set.removeEach(out);
      out.length = 0; // reset
      object._kvo_needsRangeObserver = false ;
    }
  },

  /** @private */
  isObservingSuspended: 0,

  _pending: SC.CoreSet.create(),

  /** @private */
  objectHasPendingChanges: function(obj) {
    this._pending.add(obj) ; // save for later
  },

  /** @private */
  // temporarily suspends all property change notifications.
  suspendPropertyObserving: function() {
    this.isObservingSuspended++ ;
  },

  // resume change notifications.  This will call notifications to be
  // delivered for all pending objects.
  /** @private */
  resumePropertyObserving: function() {
    var pending ;
    if(--this.isObservingSuspended <= 0) {
      pending = this._pending ;
      this._pending = SC.CoreSet.create() ;

      var idx, len = pending.length;
      for(idx=0;idx<len;idx++) {
        pending[idx]._notifyPropertyObservers() ;
      }
      pending.clear();
      pending = null ;
    }
  }

} ;
