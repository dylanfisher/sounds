// Smooth scroll

import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

App.pageLoad.push(function() {
  if ( location.hash.length > 1 ) {
    var hash = location.hash.substr(1);

    var $el = $('[name="' + hash + '"], #' + hash).first();

    if ( $el.attr('data-default-jump-link') != undefined ) return;

    // carousel modules can mess up spacing of page, so wait a second before scrolling
    setTimeout(function() {
      if ( $el.length ) App.scrollTo($el);
    }, 250);
  }
});

$(document).on('click', 'a[href*="#"]:not([href="#"])', function(e) {
  // If you want to disable the call to `e.preventDefault()` you can add a ` data-default-jump-link` attribute to the link.
  // This is good if e.g. you want to enable the default history behavior for jump links.
  // <a href="#jump-link" data-default-jump-link>the hash in this jump link get's added to the current URL as usual</a>

  var $target = $(e.target);

  if ( location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'' ) && location.hostname == this.hostname && location.search == this.search) {
    var target = $(this.hash);
    target = target.length ? target : $('[name=' + this.hash.slice(1) +']');

    if ( target.length ) {
      var offset = parseInt( $target.attr('data-smooth-scroll-offset') );
      App.scrollTo(target, offset);

      if ( $(this).attr('data-default-jump-link') == undefined ) {
        e.preventDefault();
      }
    }
  }
});

App.scrollTo = function(targetOrPosition, offset, callback) {
  var smoothScrollOffset = (offset || offset == 0) ? offset : 0;
  var duration = 1.5;
  var scrollTop;

  if ( isNaN(targetOrPosition) ) {
    if ( !targetOrPosition.length ) {
      console.warn('Can\'t find target to scroll to.', targetOrPosition);
      return;
    } else {
      scrollTop = targetOrPosition.offset().top - smoothScrollOffset;
    }
  } else {
    scrollTop = targetOrPosition;
  }

  gsap.to(window, {
    duration: duration,
    scrollTo: scrollTop,
    ease: 'power4.out',
    onComplete: function() {
      if ( callback ) callback();
    }
  });
};
