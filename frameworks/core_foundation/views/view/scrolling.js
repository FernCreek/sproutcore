/**
 * @file Contains members related to scrolling
 */

sc_require('views/view');

SC.View.reopen(/** @scope SC.View.prototype */ {

  /**
   * If touch scrolling is enabled on this view.
   * @type {Boolean}
   */
  touchScrollingEnabled: true,

  /**
   * Returns if touch scrolling should be allowed on this view.
   * Checks the touchScrollingEnabled property on this view and the
   * allowTouchScrolling property of our parent view.
   *
   * @returns {Boolean} See description
   */
  allowTouchScrolling: function () {
    var parentView = this.get('parentView');
    return this.get('touchScrollingEnabled') && (parentView ? parentView.get('allowTouchScrolling') : true);
  }.property('touchScrollingEnabled', 'parentView.allowTouchScrolling').cacheable()
});