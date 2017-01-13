// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/**
  This platform object allows you to conditionally support certain HTML5
  features.

  Rather than relying on the user agent, it detects whether the given elements
  and events are supported by the browser, allowing you to create much more
  robust apps.
*/
SC.platform = SC.Object.create({
  /**
    The size of scrollbars in this browser.

    @property
  */
  scrollbarSize: function() {
    var tester = document.createElement("DIV"),
        child;
    tester.innerHTML = "<div style='height:1px;'></div>";
    tester.style.cssText="position:absolute;width:100px;height:100px;overflow-y:visible;";

    child = tester.childNodes[0];
    document.body.appendChild(tester);
    var noScroller = child.innerWidth || child.clientWidth;
    tester.style.overflowY = 'scroll';
    var withScroller = child.innerWidth || child.clientWidth;
    document.body.removeChild(tester);

    return noScroller-withScroller;

  }.property().cacheable(),

  /**
    YES if the current browser supports pinch to zoom.

    @property {Boolean}
  */
  pinchToZoom:  SC.browser.os === SC.OS.ios,

  /**
    YES if the current browser supports the `placeholder` attribute in `input` elements.
  */
  input: {
    placeholder: ('placeholder' in document.createElement('input'))
  },

  /**
    A hash that contains properties that indicate support for new HTML5
    input attributes.

    For example, to test to see if the placeholder attribute is supported,
    you would verify that SC.platform.input.placeholder is YES.
  */
  input: function(attributes) {
    var ret = {},
        len = attributes.length,
        elem = document.createElement('input'),
        attr, idx;

    for (idx=0; idx < len; idx++) {
      attr = attributes[idx];

      ret[attr] = !!(attr in elem);
    }

    return ret;
  }(['autocomplete', 'readonly', 'list', 'size', 'required', 'multiple', 'maxlength',
      'pattern', 'min', 'max', 'step', 'placeholder']),

  /**
    YES if the application is currently running as a standalone application.

    For example, if the user has saved your web application to their home
    screen on an iPhone OS-based device, this property will be true.
    @property {Boolean}
  */
  standalone: !!navigator.standalone,


  /**
    Prefix for browser specific CSS attributes. Calculated later.
  */
  cssPrefix: null,

  /**
    Prefix for browser specific CSS attributes when used in the DOM. Calculated later.
  */
  domCSSPrefix: null,

  /**
    Whether the browser supports CSS transitions. Calculated later.
  */
  supportsCSSTransitions: NO,

  /**
    Whether the browser supports 2D CSS transforms. Calculated later.
  */
  supportsCSSTransforms: NO,

  /**
    Whether the browser understands 3D CSS transforms.
    This does not guarantee that the browser properly handles them.
    Calculated later.
  */
  understandsCSS3DTransforms: NO,

  /**
    Whether the browser can properly handle 3D CSS transforms. Calculated later.
  */
  supportsCSS3DTransforms: NO,

  /**
    Whether the browser can handle accelerated layers. While supports3DTransforms tells us if they will
    work in principle, sometimes accelerated layers interfere with things like getBoundingClientRect.
    Then everything breaks.
  */
  supportsAcceleratedLayers: NO,

  /**
    Whether the browser supports the hashchange event.
  */
  supportsHashChange: function() {
    // Code copied from Modernizr which copied code from YUI (MIT licenses)
    // documentMode logic from YUI to filter out IE8 Compat Mode which false positives
    return ('onhashchange' in window) && (document.documentMode === undefined || document.documentMode > 7);
  }(),

  /**
    Whether the browser supports HTML5 history.
  */
  supportsHistory: function() {
    return !!(window.history && window.history.pushState);
  }(),

  supportsCanvas: function() {
    return !!document.createElement('canvas').getContext;
  }(),

  supportsOrientationChange: ('onorientationchange' in window),

  /**
    Because iOS is slow to dispatch the window.onorientationchange event,
    we use the window size to determine the orientation on iOS devices.

    @property {Boolean}
    @default NO
  */
  windowSizeDeterminesOrientation: SC.browser.os === SC.OS.ios || !('onorientationchange' in window),

  /**
   * If PointerEvents are supported.
   * @property {Boolean}
   */
  supportsPointerEvents: !!window.PointerEvent

});

/* Calculate CSS Prefixes */

(function(){
  var userAgent = navigator.userAgent.toLowerCase();
  if ((/webkit/).test(userAgent)) {
    SC.platform.cssPrefix = 'webkit';
    SC.platform.domCSSPrefix = 'Webkit';
  } else if((/opera/).test( userAgent )) {
    SC.platform.cssPrefix = 'opera';
    SC.platform.domCSSPrefix = 'O';
  } else if(((/msie/).test( userAgent ) || (/trident/).test(userAgent)) && !(/opera/).test( userAgent )) {
    SC.platform.cssPrefix = 'ms';
    SC.platform.domCSSPrefix = 'ms';
  } else if((/mozilla/).test( userAgent ) && !(/(compatible|webkit)/).test( userAgent )) {
    SC.platform.cssPrefix = 'moz';
    SC.platform.domCSSPrefix = 'Moz';
  }
})();

/* Calculate transform support */

(function(){
  // a test element
  var el = document.createElement("div");

  // the css and javascript to test
  var css_browsers = ["-moz-", "-moz-", "-o-", "-ms-", "-webkit-"],
      test_browsers = ["moz", "Moz", "o", "ms", "webkit"];

  // prepare css
  var css = "", i = null, cssBrowser, iLen;
  for (i = 0, iLen = css_browsers.length; i < iLen; i++) {
    cssBrowser = css_browsers[i];
    css += cssBrowser + "transition:all 1s linear;";
    css += cssBrowser + "transform: translate(1px, 1px);";
    css += cssBrowser + "perspective: 500px;";
  }

  // set css text
  el.style.cssText = css;

  // test
  var testBrowser;
  for (i = 0, iLen=test_browsers.length; i < iLen; i++)
  {
    testBrowser = test_browsers[i];
    if (el.style[testBrowser + "TransitionProperty"] !== undefined) SC.platform.supportsCSSTransitions = YES;
    if (el.style[testBrowser + "Transform"] !== undefined) SC.platform.supportsCSSTransforms = YES;
    if (el.style[testBrowser + "Perspective"] !== undefined || el.style[testBrowser + "PerspectiveProperty"] !== undefined) {
      SC.platform.understandsCSS3DTransforms = YES;
      SC.platform.supportsCSS3DTransforms = YES;
    }
  }

  // unfortunately, we need a bit more to know FOR SURE that 3D is allowed
  try{
    if (window.media && window.media.matchMedium) {
      if (!window.media.matchMedium('(-webkit-transform-3d)')) SC.platform.supportsCSS3DTransforms = NO;
    } else if(window.styleMedia && window.styleMedia.matchMedium) {
      if (!window.styleMedia.matchMedium('(-webkit-transform-3d)')) SC.platform.supportsCSS3DTransforms = NO;
    }
  }catch(e){
    //Catch to support IE9 exception
    SC.platform.supportsCSS3DTransforms = NO;
  }

  // Unfortunately, this has to be manual, as I can't think of a good way to test it
  // webkit-only for now.
  if (SC.platform.supportsCSSTransforms && SC.platform.cssPrefix === "webkit") {
    SC.platform.supportsAcceleratedLayers = YES;
  }
})();
