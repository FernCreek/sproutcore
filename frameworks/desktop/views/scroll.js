// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('views/scroller');

/** @class
  Implements a complete scroll view.  This class uses a manual implementation
  of scrollers in order to properly support clipping frames.

  Important Events:

    - contentView frame size changes (to autoshow/hide scrollbar - adjust scrollbar size)
    - horizontalScrollOffset change
    - verticalScrollOffsetChanges
    - scroll wheel events

  @extends SC.View
  @since SproutCore 1.0
*/
SC.ScrollView = SC.View.extend({
/** @scope SC.ScrollView.prototype */

  /**
    @type Array
    @default ['sc-scroll-view']
    @see SC.View#classNames
  */
  classNames: ['sc-scroll-view'],

  // ..........................................................
  // PROPERTIES
  //

  /**
    Walk like a duck

    @type Boolean
    @default YES
    @readOnly
  */
  isScrollable: YES,

  /**
    The content view you want the scroll view to manage. This will be assigned to the contentView of the clipView also.

    @type SC.View
    @default null
  */
  contentView: null,

  /**
    The horizontal alignment for non-filling content inside of the ScrollView. Possible values:

      - SC.ALIGN_LEFT
      - SC.ALIGN_RIGHT
      - SC.ALIGN_CENTER

    @type String
    @default SC.ALIGN_LEFT
  */
  horizontalAlign: SC.ALIGN_LEFT,

  /**
    The vertical alignment for non-filling content inside of the ScrollView. Possible values:

      - SC.ALIGN_TOP
      - SC.ALIGN_BOTTOM
      - SC.ALIGN_MIDDLE

    @type String
    @default SC.ALIGN_TOP
  */
  verticalAlign: SC.ALIGN_TOP,

  /**
    The current horizontal scroll offset. Changing this value will update both the contentView and the horizontal scroller, if there is one.

    @field
    @type Number
    @default 0
  */
  horizontalScrollOffset: function(key, value) {
    if (value !== undefined) {
      var minOffset = this.minimumHorizontalScrollOffset(),
          maxOffset = this.get('maximumHorizontalScrollOffset');
      this._scroll_horizontalScrollOffset = Math.max(minOffset,Math.min(maxOffset, value)) ;
    }

    return this._scroll_horizontalScrollOffset||0;
  }.property().cacheable(),

  /**
    The current vertical scroll offset.  Changing this value will update both the contentView and the vertical scroller, if there is one.

    @field
    @type Number
    @default 0
  */
  verticalScrollOffset: function(key, value) {
    if (value !== undefined) {
      var minOffset = this.get('minimumVerticalScrollOffset'),
          maxOffset = this.get('maximumVerticalScrollOffset');
      this._scroll_verticalScrollOffset = Math.max(minOffset,Math.min(maxOffset, value)) ;
    }

    return this._scroll_verticalScrollOffset||0;
  }.property().cacheable(),

  /** @private
    Calculates the maximum offset given content and container sizes, and the
    alignment.
  */
  maximumScrollOffset: function(contentSize, containerSize, align) {
    // if our content size is larger than or the same size as the container, it's quite
    // simple to calculate the answer. Otherwise, we need to do some fancy-pants
    // alignment logic (read: simple math)
    if (contentSize >= containerSize) return contentSize - containerSize;

    // alignment, yeah
    if (align === SC.ALIGN_LEFT || align === SC.ALIGN_TOP) {
      // if we left-align something, and it is smaller than the view, does that not mean
      // that it's maximum (and minimum) offset is 0, because it should be positioned at 0?
      return 0;
    } else if (align === SC.ALIGN_MIDDLE || align === SC.ALIGN_CENTER) {
      // middle align means the difference divided by two, because we want equal parts on each side.
      return 0 - Math.round((containerSize - contentSize) / 2);
    } else {
      // right align means the entire difference, because we want all that space on the left
      return 0 - (containerSize - contentSize);
    }
  },

  /** @private
    Calculates the minimum offset given content and container sizes, and the
    alignment.
  */
  minimumScrollOffset: function(contentSize, containerSize, align) {
    // if the content is larger than the container, we have no need to change the minimum
    // away from the natural 0 position.
    if (contentSize > containerSize) return 0;

    // alignment, yeah
    if (align === SC.ALIGN_LEFT || align === SC.ALIGN_TOP) {
      // if we left-align something, and it is smaller than the view, does that not mean
      // that it's maximum (and minimum) offset is 0, because it should be positioned at 0?
      return 0;
    } else if (align === SC.ALIGN_MIDDLE || align === SC.ALIGN_CENTER) {
      // middle align means the difference divided by two, because we want equal parts on each side.
      return 0 - Math.round((containerSize - contentSize) / 2);
    } else {
      // right align means the entire difference, because we want all that space on the left
      return 0 - (containerSize - contentSize);
    }
  },

  /**
    The maximum horizontal scroll offset allowed given the current contentView
    size and the size of the scroll view.  If horizontal scrolling is
    disabled, this will always return 0.

    @field
    @type Number
    @default 0
  */
  maximumHorizontalScrollOffset: function() {
    var view = this.get('contentView') ;
    var contentWidth = view ? view.get('frame').width : 0,
        calculatedWidth = view ? view.get('calculatedWidth') : 0;

    // The following code checks if there is a calculatedWidth (collections)
    // to avoid looking at the incorrect value calculated by frame.
    if (calculatedWidth) {
      contentWidth = view.calculatedWidth;
    }
    contentWidth *= this._scale;

    var containerWidth = this.get('containerView').get('frame').width ;

    // we still must go through minimumScrollOffset even if we can't scroll
    // because we need to adjust for alignment. So, just make sure it won't allow scrolling.
    if (!this.get('canScrollHorizontal')) contentWidth = Math.min(contentWidth, containerWidth);
    return this.maximumScrollOffset(contentWidth, containerWidth, this.get("horizontalAlign"));
  }.property(),

  /**
    The maximum vertical scroll offset allowed given the current contentView
    size and the size of the scroll view.  If vertical scrolling is disabled,
    this will always return 0 (or whatever alignment dictates).

    @field
    @type Number
    @default 0
  */
  maximumVerticalScrollOffset: function() {
    var view = this.get('contentView'),
        contentHeight = (view && view.get('frame')) ? view.get('frame').height : 0,
        calculatedHeight = view ? view.get('calculatedHeight') : 0;

    // The following code checks if there is a calculatedWidth (collections)
    // to avoid looking at the incorrect value calculated by frame.
    if(calculatedHeight){
      contentHeight = calculatedHeight;
    }
    contentHeight *= this._scale;

    var containerHeight = this.get('containerView').get('frame').height ;

    // we still must go through minimumScrollOffset even if we can't scroll
    // because we need to adjust for alignment. So, just make sure it won't allow scrolling.
    if (!this.get('canScrollVertical')) contentHeight = Math.min(contentHeight, containerHeight);
    return this.maximumScrollOffset(contentHeight, containerHeight, this.get("verticalAlign"));
  }.property(),


  /**
    The minimum horizontal scroll offset allowed given the current contentView
    size and the size of the scroll view.  If horizontal scrolling is
    disabled, this will always return 0 (or whatever alignment dictates).

    @field
    @type Number
    @default 0
  */
  minimumHorizontalScrollOffset: function() {
    var view = this.get('contentView') ;
    var contentWidth = view ? view.get('frame').width : 0,
        calculatedWidth = view ? view.get('calculatedWidth') : 0;
    // The following code checks if there is a calculatedWidth (collections)
    // to avoid looking at the incorrect value calculated by frame.
    if(calculatedWidth){
      contentWidth = calculatedWidth;
    }
    contentWidth *= this._scale;

    var containerWidth = this.get('containerView').get('frame').width ;

    // we still must go through minimumScrollOffset even if we can't scroll
    // because we need to adjust for alignment. So, just make sure it won't allow scrolling.
    if (!this.get('canScrollHorizontal')) contentWidth = Math.min(contentWidth, containerWidth);
    return this.minimumScrollOffset(contentWidth, containerWidth, this.get("horizontalAlign"));
  }.property(),

  /**
    The minimum vertical scroll offset allowed given the current contentView
    size and the size of the scroll view.  If vertical scrolling is disabled,
    this will always return 0 (or whatever alignment dictates).

    @field
    @type Number
    @default 0
  */
  minimumVerticalScrollOffset: function() {
    var view = this.get('contentView') ;
    var contentHeight = (view && view.get('frame')) ? view.get('frame').height : 0,
        calculatedHeight = view ? view.get('calculatedHeight') : 0;

    // The following code checks if there is a calculatedWidth (collections)
    // to avoid looking at the incorrect value calculated by frame.
    if(calculatedHeight){
      contentHeight = view.calculatedHeight;
    }
    contentHeight *= this._scale;

    var containerHeight = this.get('containerView').get('frame').height ;

    // we still must go through minimumScrollOffset even if we can't scroll
    // because we need to adjust for alignment. So, just make sure it won't allow scrolling.
    if (!this.get('canScrollVertical')) contentHeight = Math.min(contentHeight, containerHeight);
    return this.minimumScrollOffset(contentHeight, containerHeight, this.get("verticalAlign"));
  }.property(),


  /**
    Amount to scroll one vertical line.

    Used by the default implementation of scrollDownLine() and scrollUpLine().

    @type Number
    @default 20
  */
  verticalLineScroll: 20,

  /**
    Amount to scroll one horizontal line.

    Used by the default implementation of scrollLeftLine() and
    scrollRightLine().

    @type Number
    @default 20
  */
  horizontalLineScroll: 20,

  /**
    Amount to scroll one vertical page.

    Used by the default implementation of scrollUpPage() and scrollDownPage().

    @field
    @type Number
    @default value of frame.height
    @observes frame
  */
  verticalPageScroll: function() {
    return this.get('frame').height;
  }.property('frame'),

  /**
    Amount to scroll one horizontal page.

    Used by the default implementation of scrollLeftPage() and
    scrollRightPage().

    @field
    @type Number
    @default value of frame.width
    @observes frame
  */
  horizontalPageScroll: function() {
    return this.get('frame').width;
  }.property('frame'),


  // ..........................................................
  // SCROLLERS
  //

  /**
    YES if the view should maintain a horizontal scroller.   This property
    must be set when the view is created.

    @type Boolean
    @default YES
  */
  hasHorizontalScroller: YES,

  /**
    The horizontal scroller view class. This will be replaced with a view
    instance when the ScrollView is created unless hasHorizontalScroller is
    NO.

    @type SC.View
    @default SC.ScrollerView
  */
  horizontalScrollerView: SC.ScrollerView,

  /**
    YES if the horizontal scroller should be visible.  You can change this
    property value anytime to show or hide the horizontal scroller.  If you
    do not want to use a horizontal scroller at all, you should instead set
    hasHorizontalScroller to NO to avoid creating a scroller view in the
    first place.

    @type Boolean
    @default YES
  */
  isHorizontalScrollerVisible: YES,

  /**
    Returns YES if the view both has a horizontal scroller, the scroller is
    visible.

    @field
    @type Boolean
    @default YES
  */
  canScrollHorizontal: function() {
    return !!(this.get('hasHorizontalScroller') &&
      this.get('horizontalScrollerView') &&
      this.get('isHorizontalScrollerVisible')) ;
  }.property('isHorizontalScrollerVisible').cacheable(),

  /**
    If YES, the horizontal scroller will autohide if the contentView is
    smaller than the visible area.  You must set hasHorizontalScroller to YES
    for this property to have any effect.

    @type Boolean
    @default YES
  */
  autohidesHorizontalScroller: YES,

  /**
    YES if the view should maintain a vertical scroller.   This property must
    be set when the view is created.

    @type Boolean
    @default YES
  */
  hasVerticalScroller: YES,

  /**
    The vertical scroller view class. This will be replaced with a view
    instance when the ScrollView is created unless hasVerticalScroller is NO.

    @type SC.View
    @default SC.ScrollerView
  */
  verticalScrollerView: SC.ScrollerView,

  /**
    YES if the vertical scroller should be visible.  You can change this
    property value anytime to show or hide the vertical scroller.  If you do
    not want to use a vertical scroller at all, you should instead set
    hasVerticalScroller to NO to avoid creating a scroller view in the first
    place.

    @type Boolean
    @default YES
  */
  isVerticalScrollerVisible: YES,

  /**
    Returns YES if the view both has a horizontal scroller, the scroller is
    visible.

    @field
    @type Boolean
    @default YES
  */
  canScrollVertical: function() {
    return !!(this.get('hasVerticalScroller') &&
      this.get('verticalScrollerView') &&
      this.get('isVerticalScrollerVisible')) ;
  }.property('isVerticalScrollerVisible').cacheable(),

  /**
    If YES, the vertical scroller will autohide if the contentView is
    smaller than the visible area.  You must set hasVerticalScroller to YES
    for this property to have any effect.

    @type Boolean
    @default YES
  */
  autohidesVerticalScroller: YES,

  /**
    Use this property to set the 'bottom' offset of your vertical scroller,
    to make room for a thumb view or other accessory view. Default is 0.

    @type Number
    @default 0
  */
  verticalScrollerBottom: 0,

  /**
    Use to control the positioning of the vertical scroller. The content
    view will be automatically sized to meet the left edge of the vertical
    scroller, wherever it may be. This allows you to easily, for example,
    have “one pixel higher and one pixel lower” scroll bars that blend
    into their parent views.

    Example: { top: -1, bottom: -1, right: 0 }

    @type Hash
    @default null
  */
  verticalScrollerLayout: null,

  /**
    Use to control the positioning of the horizontal scroller. The content
    view will be automatically sized to meet the top edge of the
    horizontal scroller, wherever it may be.

    Example: { left: 0, bottom: 0, right: 0 }

    @type Hash
    @default null
  */
  horizontalScrollerLayout: null,

  // ..........................................................
  // CUSTOM VIEWS
  //

  /**
    The container view that will contain your main content view.  You can
    replace this property with your own custom subclass if you prefer.

    @type SC.ContainerView
    @default SC.ConainerView
  */
  containerView: SC.ContainerView.extend({}),


  // ..........................................................
  // METHODS
  //

  /**
    Scrolls the receiver to the specified x,y coordinate.  This should be the
    offset into the contentView you want to appear at the top-left corner of
    the scroll view.

    This method will contain the actual scroll based on whether the view
    can scroll in the named direction and the maximum distance it can
    scroll.

    If you only want to scroll in one direction, pass null for the other
    direction.  You can also optionally pass a Hash for the first parameter
    with x and y coordinates.

    @param {Number} x the x scroll location
    @param {Number} y the y scroll location
    @returns {SC.ScrollView} receiver
  */
  scrollTo: function(x,y) {
    // normalize params
    if (y===undefined && SC.typeOf(x) === SC.T_HASH) {
      y = x.y; x = x.x;
    }

    if (!SC.none(x)) {
      this.set('horizontalScrollOffset', x) ;
    }

    if (!SC.none(y)) {
      this.set('verticalScrollOffset', y) ;
    }

    return this ;
  },

  /**
    Scrolls the receiver in the horizontal and vertical directions by the
    amount specified, if allowed.  The actual scroll amount will be
    constrained by the current scroll view settings.

    If you only want to scroll in one direction, pass null or 0 for the other
    direction.  You can also optionally pass a Hash for the first parameter
    with x and y coordinates.

    @param {Number} x change in the x direction (or hash)
    @param {Number} y change in the y direction
    @returns {SC.ScrollView} receiver
  */
  scrollBy: function(x , y) {
    // normalize params
    if (y===undefined && SC.typeOf(x) === SC.T_HASH) {
      y = x.y; x = x.x;
    }

    // if null, undefined, or 0, pass null; otherwise just add current offset
    x = (x) ? this.get('horizontalScrollOffset')+x : null ;
    y = (y) ? this.get('verticalScrollOffset')+y : null ;
    return this.scrollTo(x,y) ;
  },

  /**
    Scroll the view to make the view's frame visible.  For this to make sense,
    the view should be a subview of the contentView.  Otherwise the results
    will be undefined.

    @param {SC.View} view view to scroll or null to scroll receiver visible
    @returns {Boolean} YES if scroll position was changed
  */
  scrollToVisible: function(view) {

    // if no view is passed, do default
    if (arguments.length === 0) return sc_super();

    var contentView = this.get('contentView') ;
    if (!contentView) return NO; // nothing to do if no contentView.

    // get the frame for the view - should work even for views with static
    // layout, assuming it has been added to the screen.
    var vf = view.get('frame');
    if (!vf) return NO; // nothing to do

    // convert view's frame to an offset from the contentView origin.  This
    // will become the new scroll offset after some adjustment.
    vf = contentView.convertFrameFromView(vf, view.get('parentView')) ;

    return this.scrollToRect(vf);
  },

  /**
    Scroll to the supplied rectangle.
    @param {Rect} rect Rectangle to scroll to.
    @returns {Boolean} YES if scroll position was changed.
  */
  scrollToRect: function(rect) {
    // find current visible frame.
    var vo = SC.cloneRect(this.get('containerView').get('frame')),
        origX,
        origY;

    vo.x = this.get('horizontalScrollOffset') ;
    vo.y = this.get('verticalScrollOffset') ;
    origX = vo.x;
    origY = vo.y;

    // if bottom edge is not visible, shift origin
    vo.y += Math.max(0, SC.maxY(rect) - SC.maxY(vo));
    vo.x += Math.max(0, SC.maxX(rect) - SC.maxX(vo));

    // if top edge is not visible, shift origin
    vo.y -= Math.max(0, SC.minY(vo) - SC.minY(rect));
    vo.x -= Math.max(0, SC.minX(vo) - SC.minX(rect));

    // scroll to that origin.
    if ((origX !== vo.x) || (origY !== vo.y)) {
      this.scrollTo(vo.x, vo.y);
      return YES ;
    } else {
      return NO;
    }
  },


  /**
    Scrolls the receiver down one or more lines if allowed.  If number of
    lines is not specified, scrolls one line.

    @param {Number} lines number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollDownLine: function(lines) {
    if (lines === undefined) lines = 1 ;
    return this.scrollBy(null, this.get('verticalLineScroll')*lines) ;
  },

  /**
    Scrolls the receiver up one or more lines if allowed.  If number of
    lines is not specified, scrolls one line.

    @param {Number} lines number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollUpLine: function(lines) {
    if (lines === undefined) lines = 1 ;
    return this.scrollBy(null, 0-this.get('verticalLineScroll')*lines) ;
  },

  /**
    Scrolls the receiver right one or more lines if allowed.  If number of
    lines is not specified, scrolls one line.

    @param {Number} lines number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollRightLine: function(lines) {
    if (lines === undefined) lines = 1 ;
    return this.scrollTo(this.get('horizontalLineScroll')*lines, null) ;
  },

  /**
    Scrolls the receiver left one or more lines if allowed.  If number of
    lines is not specified, scrolls one line.

    @param {Number} lines number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollLeftLine: function(lines) {
    if (lines === undefined) lines = 1 ;
    return this.scrollTo(0-this.get('horizontalLineScroll')*lines, null) ;
  },

  /**
    Scrolls the receiver down one or more page if allowed.  If number of
    pages is not specified, scrolls one page.  The page size is determined by
    the verticalPageScroll value.  By default this is the size of the current
    scrollable area.

    @param {Number} pages number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollDownPage: function(pages) {
    if (pages === undefined) pages = 1 ;
    return this.scrollBy(null, this.get('verticalPageScroll')*pages) ;
  },

  /**
    Scrolls the receiver up one or more page if allowed.  If number of
    pages is not specified, scrolls one page.  The page size is determined by
    the verticalPageScroll value.  By default this is the size of the current
    scrollable area.

    @param {Number} pages number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollUpPage: function(pages) {
    if (pages === undefined) pages = 1 ;
    return this.scrollBy(null, 0-(this.get('verticalPageScroll')*pages)) ;
  },

  /**
    Scrolls the receiver right one or more page if allowed.  If number of
    pages is not specified, scrolls one page.  The page size is determined by
    the verticalPageScroll value.  By default this is the size of the current
    scrollable area.

    @param {Number} pages number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollRightPage: function(pages) {
    if (pages === undefined) pages = 1 ;
    return this.scrollBy(this.get('horizontalPageScroll')*pages, null) ;
  },

  /**
    Scrolls the receiver left one or more page if allowed.  If number of
    pages is not specified, scrolls one page.  The page size is determined by
    the verticalPageScroll value.  By default this is the size of the current
    scrollable area.

    @param {Number} pages number of lines
    @returns {SC.ScrollView} receiver
  */
  scrollLeftPage: function(pages) {
    if (pages === undefined) pages = 1 ;
    return this.scrollBy(0-(this.get('horizontalPageScroll')*pages), null) ;
  },

  /** @private
    Adjusts the layout for the various internal views.  This method is called
    once when the scroll view is first configured and then anytime a scroller
    is shown or hidden.  You can call this method yourself as well to retile.

    You may also want to override this method to handle layout for any
    additional controls you have added to the view.
  */
  tile: function() {
    // get horizontal scroller/determine if we should have a scroller
    var hscroll = this.get('hasHorizontalScroller') ? this.get('horizontalScrollerView') : null ;
    var hasHorizontal = hscroll && this.get('isHorizontalScrollerVisible');

    // get vertical scroller/determine if we should have a scroller
    var vscroll = this.get('hasVerticalScroller') ? this.get('verticalScrollerView') : null ;
    var hasVertical = vscroll && this.get('isVerticalScrollerVisible') ;

    // get the containerView
    var clip = this.get('containerView') ;
    var clipLayout = { left: 0, top: 0 } ;
    var t, layout, vl, hl;

    var ht = ((hasHorizontal) ? hscroll.get('scrollbarThickness') : 0) ;
    var vt = (hasVertical) ?   vscroll.get('scrollbarThickness') : 0 ;

    if (hasHorizontal) {
      hl     = this.get('horizontalScrollerLayout');
      layout = {
        left: (hl ? hl.left : 0),
        bottom: (hl ? hl.bottom : 0),
        right: (hl ? hl.right + vt-1 : vt-1),
        height: ht
      };
      hscroll.set('layout', layout) ;
      clipLayout.bottom = layout.bottom + ht;
    } else {
      clipLayout.bottom = 0 ;
    }
    if (hscroll) hscroll.set('isVisible', hasHorizontal) ;

    if (hasVertical) {
      ht     = ht + this.get('verticalScrollerBottom') ;
      vl     = this.get('verticalScrollerLayout');
      layout = {
        top: (vl ? vl.top : 0),
        bottom: (vl ? vl.bottom + ht : ht),
        right: (vl ? vl.right : 0),
        width: vt
      };
      vscroll.set('layout', layout) ;
      clipLayout.right = layout.right + vt;
    } else {
      clipLayout.right = 0 ;
    }
    if (vscroll) vscroll.set('isVisible', hasVertical) ;

    clip.adjust(clipLayout) ;
  },

  /** @private
    Called whenever a scroller visibility changes.  Calls the tile() method.
  */
  scrollerVisibilityDidChange: function() {
    this.tile();
  }.observes('isVerticalScrollerVisible', 'isHorizontalScrollerVisible'),

  // ..........................................................
  // SCROLL WHEEL SUPPORT
  //

  /** @private */
  _scroll_wheelDeltaX: 0,

  /** @private */
  _scroll_wheelDeltaY: 0,

  /** @private */
  mouseWheel: function(evt) {
    var horizontalScrollOffset = this.get('horizontalScrollOffset'),
        maximumHorizontalScrollOffset = this.get('maximumHorizontalScrollOffset'),
        maximumVerticalScrollOffset = this.get('maximumVerticalScrollOffset'),
        shouldScroll = NO,
        verticalScrollOffset = this.get('verticalScrollOffset');

    // Only attempt to scroll if we are allowed to scroll in the direction and
    // have room to scroll in the direction.  Otherwise, ignore the event so
    // that an outer ScrollView may capture it.
    shouldScroll = ((this.get('canScrollHorizontal') &&
        (evt.wheelDeltaX < 0 && horizontalScrollOffset > 0) ||
        (evt.wheelDeltaX > 0 && horizontalScrollOffset < maximumHorizontalScrollOffset)) ||
        (this.get('canScrollVertical') &&
        (evt.wheelDeltaY < 0 && verticalScrollOffset > 0) ||
        (evt.wheelDeltaY > 0 && verticalScrollOffset < maximumVerticalScrollOffset)));

    if (shouldScroll) {
      this._scroll_wheelDeltaX += evt.wheelDeltaX;
      this._scroll_wheelDeltaY += evt.wheelDeltaY;

      this.invokeLater(this._scroll_mouseWheel, 10);
    }

    return shouldScroll;
  },

  /** @private */
  _scroll_mouseWheel: function() {
    this.scrollBy(this._scroll_wheelDeltaX, this._scroll_wheelDeltaY);
    if (SC.WHEEL_MOMENTUM && this._scroll_wheelDeltaY > 0) {
      this._scroll_wheelDeltaY = Math.floor(this._scroll_wheelDeltaY*0.950);
      this._scroll_wheelDeltaY = Math.max(this._scroll_wheelDeltaY, 0);
      this.invokeLater(this._scroll_mouseWheel, 10) ;
    } else if (SC.WHEEL_MOMENTUM && this._scroll_wheelDeltaY < 0){
      this._scroll_wheelDeltaY = Math.ceil(this._scroll_wheelDeltaY*0.950);
      this._scroll_wheelDeltaY = Math.min(this._scroll_wheelDeltaY, 0);
      this.invokeLater(this._scroll_mouseWheel, 10) ;
    } else {
      this._scroll_wheelDeltaY = 0;
      this._scroll_wheelDeltaX = 0;
    }
  },

  /*..............................................
    SCALING SUPPORT
  */

  /**
    Determines whether scaling is allowed.

    @type Boolean
    @default NO
  */
  canScale: NO,

  /** @private
    The current scale.
  */
  _scale: 1.0,

  /**
    @field
    @type Number
    @default 1.0
  */
  scale: function(key, value) {
    if (value !== undefined) {
      this._scale = Math.min(Math.max(this.get("minimumScale"), value), this.get("maximumScale"));
    }
    return this._scale;
  }.property().cacheable(),

  /**
    The minimum scale.

    @type Number
    @default 0.25
  */
  minimumScale: 0.25,

  /**
    The maximum scale.

    @type Number
    @default 2.0
  */
  maximumScale: 2.0,

  /**
    Whether to automatically determine the scale range based on the size of the content.

    @type Boolean
    @default NO
  */
  autoScaleRange: NO,

  /** @private */
  _scale_css: "",

  /** @private */
  updateScale: function(scale) {
    var contentView = this.get("contentView");
    if (!contentView) return;

    if (contentView.isScalable) {
      this.get("contentView").applyScale(scale);
      this._scale_css = "";
    } else {
      this._scale_css = "scale3d(" + scale + ", " + scale + ", 1)";
    }
  },


  // ..........................................................
  // Touch Support
  //

  /**
   * The last touch start event sent to this view or a child view.
   * @type {SC.Event}
   */
  _touchStartEvent: null,

  /**
   * The last touch drag event sent while this view is crolling.
   * @type {SC.Event}
   */
  _lastTouchDrag: null,


  /**
   * If we started touch scrolling.
   * @type {Boolean}
   */
  _didTouchScroll: false,

  /**
   * If touch scrolling was allowed when we tried to scroll.
   * @type {Boolean}
   */
  _scrollingIsAllowed: false,

  /**
   * Captures the touch start event to store a reference to the touch start event.
   *
   * @param {SC.Event} event - The touch start event
   * @returns {Boolean} Returns false as we want to allow this even to be processed
   */
  touchStartCapture: function (event) {
    this._touchStartEvent = event;
    return false;
  },

  /**
   * Listen for mouse down to ensure mouse down events are handled for touch input, this ensures we'll get a touch end
   * event if the user didn't press on a view.
   *
   * @param {SC.View} event - The mouse down event
   * @returns {Boolean} If we handled the event
   */
  mouseDown: function (event) {
    // If this is a touch event then no control in the scrollable area is going to handle it, handle it ourselves so
    // touchEnd/mouseUp events will be sent
    return event.isTouchEvent();
  },

  /**
   * Handles touch move events
   * @param {SC.Event} event - The touch event
   * @returns {Boolean} If the event was handled
   */
  touchesDragged: function (event) {
    var shouldScrollView = false;
    var scrollingAllowed = this._scrollingIsAllowed;
    var startScrolling = true;
    var touchStart = this._touchStartEvent;
    var verticalScrollOffset = this.get('verticalScrollOffset');
    var horizontalScrollOffset = this.get('horizontalScrollOffset');
    var maximumVerticalScrollOffset = this.get('maximumVerticalScrollOffset');
    var maximumHorizontalScrollOffset = this.get('maximumHorizontalScrollOffset');
    var deltaX, deltaY, targetView;

    if (touchStart && event) {

      // this is the first drag, check if we can scroll
      if (!this._lastTouchDrag) {
        targetView = event.getTargetView();
        scrollingAllowed = targetView ? targetView.get('allowTouchScrolling') : true;
      }

      if (scrollingAllowed) {
        // determine the change in scroll since the last event
        if (this._lastTouchDrag) {
          deltaX = event.pageX - this._lastTouchDrag.pageX;
          deltaY = event.pageY - this._lastTouchDrag.pageY;
        } else {
          deltaX = event.pageX - touchStart.pageX;
          deltaY = event.pageY - touchStart.pageY;

          // Only start scrolling once the touch has moved a little, needed for Edge which will send more move events
          startScrolling = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
        }

        if (startScrolling) {
          // check if we can scroll
          if (this.get('canScrollVertical')) {
            shouldScrollView = deltaY > 0 && verticalScrollOffset > 0 ||
              deltaY < 0 && verticalScrollOffset < maximumVerticalScrollOffset;
          }

          if (this.get('canScrollHorizontal') && !shouldScrollView) {
            shouldScrollView = deltaX > 0 && horizontalScrollOffset > 0 ||
              deltaX < 0 && horizontalScrollOffset < maximumHorizontalScrollOffset;
          }

          this._didTouchScroll = true;

          if (shouldScrollView) {
            // perform the scroll, reverse sign of delta since touch scrolling is backwards from mouse wheel scrolling
            this.scrollBy(deltaX * -1, deltaY * -1);
          }

          this._scrollingIsAllowed = scrollingAllowed;
          this._lastTouchDrag = event;
        }
      }
    }


    return shouldScrollView;
  },

  /**
   * Capture touch end events to cleanup once we have stopped scrolling.
   *
   * @param {SC.Event} event - The touch end event
   * @returns {Boolean} If we handled this event
   */
  touchEndCapture: function (event) {
    var didScroll = this._didTouchScroll;

    // Cleanup all known scroll views incase we did a touch scroll and in case we have nested scroll views
    this._cleanupAllScrollViews();

    // block other views from handling touch end if we scrolled, this prevents unexpected side effects of scrolling
    return didScroll;
  },

  /**
   * Capture mouse up events to cleanup once we have stopped scrolling. We need this listener in case no one handled
   * touchStart but someone did handle mouseDown. In that case the root responder will send mouseUp but never touchEnd.
   *
   * @param {SC.Event} event - The mouse up event
   * @returns {Boolean} If we handled the event
   */
  mouseUpCapture: function (event) {
    var didScroll = this._didTouchScroll;

    // Cleanup all known scroll views incase we did a touch scroll and in case we have nested scroll views
    this._cleanupAllScrollViews();

    // block other views from handling mouse up if we scrolled, this prevents unexpected side effects of scrolling
    return didScroll;
  },

  /**
   * Goes through all known scroll views and reset's their touch scrolling members. We need this clean up code in order
   * to properly reset after a touch scroll if it was within nested scroll views.
   *
   * @private
   */
  _cleanupAllScrollViews: function () {
    var scrollViewsMap = SC.ScrollView._scrollableViews;
    var scrollViewID, scrollView;

    if (scrollViewsMap) {
      for (scrollViewID in scrollViewsMap) {
        if (scrollViewsMap.hasOwnProperty(scrollViewID)) {
          scrollView = scrollViewsMap[scrollViewID];
          if (scrollView && scrollView._resetTouchMembers) {
            scrollView._resetTouchMembers();
          }
        }
      }
    }
  },

  /**
   * Resets state after touch scrolling.
   *
   * @private
   */
  _resetTouchMembers: function () {
    this._touchStartEvent = null;
    this._didTouchScroll = false;
    this._scrollingIsAllowed = false;
    this._lastTouchDrag = null;
  },

  /**
   * Called at the end of a drag, either successful or cancelled. Ensures there are no shine-through problems after a
   * drag.
   */
  cleanupAfterDrag: function () {
    this._resetTouchMembers();
  },

  // ..........................................................
  // INTERNAL SUPPORT
  //

  /** @private
    Instantiate scrollers & container views as needed.  Replace their classes
    in the regular properties.
  */
  createChildViews: function() {
    var childViews = [] , view;

    this.beginPropertyChanges();

    // create the containerView.  We must always have a container view.
    // also, setup the contentView as the child of the containerView...
    if (SC.none(view = this.containerView)) view = SC.ContainerView;

    view = this.createChildView(view, {
      contentView: this.contentView,
      isScrollContainer: YES,

      didCreateLayer: function() {
        var layer = this.get('layer');
        if (layer) {
          SC.Event.add(layer, 'scroll', this, this._maintainScroll);
        }
      },

      willDestroyLayer: function() {
        var layer = this.get('layer');
        if (layer) {
          SC.Event.remove(layer, 'scroll', this, this._maintainScroll);
        }
      },

      _maintainScroll: function(evt) {
        var $this = this.$(),
            pv = this.get('parentView'),
            scrollTop = $this.scrollTop() || 0,
            scrollLeft = $this.scrollLeft() || 0,
            verticalScrollOffset,
            horizontalScrollOffset;

        if (pv) {
          verticalScrollOffset = pv.get('verticalScrollOffset');
          horizontalScrollOffset = pv.get('horizontalScrollOffset');

          if (scrollTop !== verticalScrollOffset) {
            // Scroll event was not caused by changing verticalScrollOffset,
            // update to match.
            pv.set('verticalScrollOffset', scrollTop);
          }

          if (scrollLeft !== horizontalScrollOffset) {
            // Scroll event was not caused by changing horizontalScrollOffset,
            // update to match.
            pv.set('horizontalScrollOffset', scrollLeft);
          }
        }
      }
    });
    this.set('containerView', view);
    childViews.push(view);

    // and replace our own contentView...
    this.set('contentView', this.containerView.get('contentView'));

    // create a horizontal scroller view if needed...
    view = this.get("horizontalScrollerView");
    if (view) {
      if (this.get('hasHorizontalScroller')) {
        view = this.createChildView(view, {
          layoutDirection: SC.LAYOUT_HORIZONTAL,
          valueBinding: '*owner.horizontalScrollOffset'
        });
        this.set('horizontalScrollerView', view);
        childViews.push(view);
      } else this.set('horizontalScrollerView', null);
    }

    // create a vertical scroller view if needed...
    view = this.get("verticalScrollerView");
    if (view) {
      if (this.get('hasVerticalScroller')) {
        view = this.createChildView(view, {
          layoutDirection: SC.LAYOUT_VERTICAL,
          valueBinding: '*owner.verticalScrollOffset'
        });
        this.set('verticalScrollerView', view);
        childViews.push(view);
      } else this.set('verticalScrollerView', null);
    }

    // set childViews array.
    this.set('childViews', childViews);

    this.endPropertyChanges();

    this.tile(); // set up initial tiling
  },

  /** @private */
  init: function() {
    sc_super();

    // start observing initial content view.  The content view's frame has
    // already been setup in prepareDisplay so we don't need to call
    // viewFrameDidChange...
    this._scroll_contentView = this.get('contentView') ;
    var contentView = this._scroll_contentView ;

    if (contentView) {
      contentView.addObserver('frame', this, this.contentViewFrameDidChange);
      contentView.addObserver('calculatedWidth', this, this.contentViewFrameDidChange);
      contentView.addObserver('calculatedHeight', this, this.contentViewFrameDidChange);
    }

    if (this.get('isVisibleInWindow')) this._scsv_registerAutoscroll();

    SC.ScrollView.addScrollableView(this);
  },

  /**
   * Override to de-register this as an active scroll view.
   *
   * @returns {SC.Object} this
   */
  destroy: function () {
    SC.ScrollView.removeScrollableView(this);

    return sc_super();
  },

  /** @private
    Registers/deregisters view with SC.Drag for autoscrolling
  */
  _scsv_registerAutoscroll: function() {
    if (this.get('isVisibleInWindow')) SC.ScrollView.addScrollableView(this);
    else SC.ScrollView.removeScrollableView(this);
  }.observes('isVisibleInWindow'),

  /** @private
    Whenever the contentView is changed, we need to observe the content view's
    frame to be notified whenever it's size changes.
  */
  contentViewDidChange: function() {
    var newView = this.get('contentView'),
        oldView = this._scroll_contentView,
        frameObserver = this.contentViewFrameDidChange,
        layerObserver = this.contentViewLayerDidChange;

    if (newView !== oldView) {

      // stop observing old content view
      if (oldView) {
        oldView.removeObserver('calculatedWidth', this, this.contentViewFrameDidChange);
        oldView.removeObserver('calculatedHeight', this, this.contentViewFrameDidChange);
        oldView.removeObserver('frame', this, frameObserver);
        oldView.removeObserver('layer', this, layerObserver);
      }

      // update cache
      this._scroll_contentView = newView;
      if (newView) {
        newView.addObserver('frame', this, frameObserver);
        newView.addObserver('calculatedWidth', this, this.contentViewFrameDidChange);
        newView.addObserver('calculatedHeight', this, this.contentViewFrameDidChange);
        newView.addObserver('layer', this, layerObserver);
      }

      // replace container
      this.containerView.set('contentView', newView);

      this.contentViewFrameDidChange();
    }
  }.observes('contentView'),

  /** @private
    If we redraw after the initial render, we need to make sure that we reset
    the scrollTop/scrollLeft properties on the content view.  This ensures
    that, for example, the scroll views displays correctly when switching
    views out in a ContainerView.
  */
  render: function(context, firstTime) {
    this.invokeLast(this.adjustElementScroll);

    if (firstTime) {
      context.push('<div class="corner"></div>');
    }
    return sc_super();
  },

  /** @private */
  oldMaxHOffset: 0,

  /** @private */
  oldMaxVOffset: 0,

  /** @private
    Invoked whenever the contentView's frame changes.  This will update the
    scroller maximum and optionally update the scroller visibility if the
    size of the contentView changes.  We don't care about the origin since
    that is tracked separately from the offset values.

    @param {Boolean} force (optional)  Re-calculate everything even if the contentView’s frame didn’t change size
  */
  contentViewFrameDidChange: function(force) {
    var view   = this.get('contentView'),
        f      = (view) ? view.get('frame') : null,
        scale  = this._scale,
        width  = 0,
        height = 0,
        dim, dimWidth, dimHeight, calculatedWidth, calculatedHeight;

    // If no view has been set yet, or it doesn't have a frame,
    // we can avoid doing any work.
    if (!view || !f) { return; }

    width = view.get('calculatedWidth') || f.width || 0;
    height = view.get('calculatedHeight') || f.height || 0;

    width *= scale;
    height *= scale;

    // cache out scroll settings...
    if (!force && (width === this._scroll_contentWidth) && (height === this._scroll_contentHeight)) return ;
    this._scroll_contentWidth  = width;
    this._scroll_contentHeight = height;

    dim = this.getPath('containerView.frame');
    dimWidth = dim.width;
    dimHeight = dim.height;

    if (this.get('hasHorizontalScroller') && (view = this.get('horizontalScrollerView'))) {
      // decide if it should be visible or not
      if (this.get('autohidesHorizontalScroller')) {
        this.set('isHorizontalScrollerVisible', width > dimWidth);

        // re-check dimensions since a scrollbar visibility change could change them
        dim = this.getPath('containerView.frame');
        dimWidth = dim.width;
        dimHeight = dim.height;
      }
      view.setIfChanged('maximum', width-dimWidth) ;
      view.setIfChanged('proportion', dimWidth/width);
    }

    if (this.get('hasVerticalScroller') && (view = this.get('verticalScrollerView'))) {
      // decide if it should be visible or not
      if (this.get('autohidesVerticalScroller')) {
        this.set('isVerticalScrollerVisible', height > dimHeight);
      }
      view.setIfChanged('maximum', height-dimHeight) ;
      view.setIfChanged('proportion', dimHeight/height);
    }

    // If there is no vertical scroller and auto hiding is on, make
    // sure we are at the top if not already there
    if (!this.get('isVerticalScrollerVisible') && (this.get('verticalScrollOffset') !== 0) &&
       this.get('autohidesVerticalScroller')) {
      this.set('verticalScrollOffset', 0);
    }

    // Same thing for horizontal scrolling.
    if (!this.get('isHorizontalScrollerVisible') && (this.get('horizontalScrollOffset') !== 0) &&
       this.get('autohidesHorizontalScroller')) {
      this.set('horizontalScrollOffset', 0);
    }

    // This forces to recalculate the height of the frame when is at the bottom
    // of the scroll and the content dimension are smaller that the previous one
    var mxVOffSet   = this.get('maximumVerticalScrollOffset'),
        vOffSet     = this.get('verticalScrollOffset'),
        mxHOffSet   = this.get('maximumHorizontalScrollOffset'),
        hOffSet     = this.get('horizontalScrollOffset'),
        forceHeight = mxVOffSet < vOffSet,
        forceWidth  = mxHOffSet < hOffSet;
    if (forceHeight || forceWidth) {
      this.forceDimensionsRecalculation(forceWidth, forceHeight, vOffSet, hOffSet);
    }

    // send change notifications since they don't invalidate automatically
    this.notifyPropertyChange('maximumVerticalScrollOffset');
    this.notifyPropertyChange('maximumHorizontalScrollOffset');
  },

  /** @private
    If our frame changes, then we need to re-calculate the visibility of our
    scrollers, etc.
  */
  frameDidChange: function() {
    this.contentViewFrameDidChange(YES);
  }.observes('frame'),

  /** @private
    If the layer of the content view changes, we need to readjust the
    scrollTop and scrollLeft properties on the new DOM element.
  */
  contentViewLayerDidChange: function() {
    // Invalidate these cached values, as they're no longer valid
    if (this._verticalScrollOffset !== 0) this._verticalScrollOffset = -1;
    if (this._horizontalScrollOffset !== 0) this._horizontalScrollOffset = -1;
    this.invokeLast(this.adjustElementScroll);
  },

  /** @private
    Whenever the horizontal scroll offset changes, update the scrollers and
    edit the location of the contentView.
  */
  _scroll_horizontalScrollOffsetDidChange: function() {
    this.invokeLast(this.adjustElementScroll);
  }.observes('horizontalScrollOffset'),

  /** @private
    Whenever the vertical scroll offset changes, update the scrollers and
    edit the location of the contentView.
  */
  _scroll_verticalScrollOffsetDidChange: function() {
    this.invokeLast(this.adjustElementScroll);
  }.observes('verticalScrollOffset'),

  /** @private
    Called at the end of the run loop to actually adjust the scrollTop
    and scrollLeft properties of the container view.
  */
  adjustElementScroll: function() {
    var container = this.get('containerView'),
        content = this.get('contentView'),
        verticalScrollOffset = this.get('verticalScrollOffset'),
        horizontalScrollOffset = this.get('horizontalScrollOffset');

    // We notify the content view that its frame property has changed
    // before we actually update the scrollTop/scrollLeft properties.
    // This gives views that use incremental rendering a chance to render
    // newly-appearing elements before they come into view.
    if (content && content._viewFrameDidChange) {
      content._viewFrameDidChange();
    }

    if (container) {
      container = container.$()[0];

      if (container) {
        if (verticalScrollOffset !== this._verticalScrollOffset) {
          container.scrollTop = verticalScrollOffset;
          this._verticalScrollOffset = verticalScrollOffset;
        }

        if (horizontalScrollOffset !== this._horizontalScrollOffset) {
          container.scrollLeft = horizontalScrollOffset;
          this._horizontalScrollOffset = horizontalScrollOffset;
        }
      }
    }
  },

  /** @private */
  forceDimensionsRecalculation: function (forceWidth, forceHeight, vOffSet, hOffSet) {
    var oldScrollHOffset = hOffSet;
    var oldScrollVOffset = vOffSet;
    this.scrollTo(0,0);
    if(forceWidth && forceHeight){
      this.scrollTo(this.get('maximumHorizontalScrollOffset'), this.get('maximumVerticalScrollOffset'));
    }
    if(forceWidth && !forceHeight){
      this.scrollTo(this.get('maximumHorizontalScrollOffset'), oldScrollVOffset);
    }
    if(!forceWidth && forceHeight){
      this.scrollTo(oldScrollHOffset ,this.get('maximumVerticalScrollOffset'));
    }
  },

  /** @private */
  _scroll_verticalScrollOffset: 0,

  /** @private */
  _scroll_horizontalScrollOffset: 0

});

SC.ScrollView.mixin({
  /**
   * Map of all active scroll views. Used by SC.ScrollView & SC.Drag
   * @type {Object}
   */
  _scrollableViews: {},

  /**
   Register the view object as a scrollable view.  These views will
   auto-scroll during a drag.

   @param {SC.View} target The view that should be auto-scrolled
   */
  addScrollableView: function(target) {
    this._scrollableViews[SC.guidFor(target)] = target;
  },

  /**
   Remove the view object as a scrollable view.  These views will auto-scroll
   during a drag.

   @param {SC.View} target A previously registered scrollable view
   */
  removeScrollableView: function(target) {
    delete this._scrollableViews[SC.guidFor(target)];
  }
});
