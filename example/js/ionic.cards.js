(function(ionic) {

  // Get transform origin poly
  var d = document.createElement('div');
  var transformKeys = ['webkitTransformOrigin', 'transform-origin', '-webkit-transform-origin', 'webkit-transform-origin',
              '-moz-transform-origin', 'moz-transform-origin', 'MozTransformOrigin', 'mozTransformOrigin'];

  var TRANSFORM_ORIGIN = 'webkitTransformOrigin';
  for(var i = 0; i < transformKeys.length; i++) {
    if(d.style[transformKeys[i]] !== undefined) {
      TRANSFORM_ORIGIN = transformKeys[i];
      break;
    }
  }

  var transitionKeys = ['webkitTransition', 'transition', '-webkit-transition', 'webkit-transition',
              '-moz-transition', 'moz-transition', 'MozTransition', 'mozTransition'];
  var TRANSITION = 'webkitTransition';
  for(var i = 0; i < transitionKeys.length; i++) {
    if(d.style[transitionKeys[i]] !== undefined) {
      TRANSITION = transitionKeys[i];
      break;
    }
  }

  var SwipeableCardController = ionic.controllers.ViewController.inherit({
    initialize: function(opts) {
      this.cards = [];

      var ratio = window.innerWidth / window.innerHeight;

      this.maxWidth = window.innerWidth - (opts.cardGutterWidth || 0);
      this.maxHeight = opts.height || 300;
      this.cardGutterWidth = opts.cardGutterWidth || 10;
      this.cardPopInDuration = opts.cardPopInDuration || 400;
      this.cardAnimation = opts.cardAnimation || 'pop-in';
    },
    pushCard: function(card) {
      var self = this;

      this.cards.push(card);
      this.beforeCardShow(card);

      card.transitionIn(this.cardAnimation);
      setTimeout(function() {
        card.disableTransition(self.cardAnimation);
      }, this.cardPopInDuration + 100);
    },
    beforeCardShow: function() {
      var nextCard = this.cards[this.cards.length-1];
      if(!nextCard) return;

      // Calculate the top left of a default card, as a translated pos
      var topLeft = window.innerHeight / 2 - this.maxHeight/2;
      console.log(window.innerHeight, this.maxHeight);

      var cardOffset = Math.min(this.cards.length, 3) * 5;

      // Move each card 5 pixels down to give a nice stacking effect (max of 3 stacked)
      nextCard.setPopInDuration(this.cardPopInDuration);
      nextCard.setZIndex(this.cards.length);
    },
    popCard: function() {
      return this.cards.pop();
    }
  });

  var SwipeableCardView = ionic.views.View.inherit({
    initialize: function(opts) {
      opts = ionic.extend({
      }, opts);

      ionic.extend(this, opts);

      this.el = opts.el;

      this.startX = this.startY = this.x = this.y = 0;

      this.bindEvents();
    },

    setX: function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + x + 'px,' + this.y + 'px, 0)';
      this.x = x;
      this.startX = x;
    },

    setY: function(y) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px,' + y + 'px, 0)';
      this.y = y;
      this.startY = y;
    },

    setZIndex: function(index) {
      this.el.style.zIndex = index;
    },

    setWidth: function(width) {
      this.el.style.width = width + 'px';
    },
    setHeight: function(height) {
      this.el.style.height = height + 'px';
    },
    setPopInDuration: function(duration) {
      this.cardPopInDuration = duration;
    },

    transitionIn: function(animationClass) {
      var self = this;

      this.el.classList.add(animationClass + '-start');
      this.el.classList.add(animationClass);
      this.el.style.display = 'block';
      setTimeout(function() {
        self.el.classList.remove(animationClass + '-start');
      }, 100);
    },

    disableTransition: function(animationClass) {
      this.el.classList.remove(animationClass);
    },

    transitionOut: function() {
      var self = this;

      if(this.y < 0) {
        this.el.style[TRANSITION] = '-webkit-transform 0.2s ease-in-out';
        this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + ',' + (this.startY) + 'px, 0)';
        setTimeout(function() {
          self.el.style[TRANSITION] = 'none';
        }, 200);
      } else {
        // Fly out
        var rotateTo = this.rotationAngle + (this.rotationDirection * 0.6);
        this.el.style[TRANSITION] = '-webkit-transform 0.2s ease-in-out';
        this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + ',' + (window.innerHeight * 1.5) + 'px, 0) rotate(' + rotateTo + 'rad)';
        this.onSwipe && this.onSwipe();
      }
    },

    bindEvents: function() {
      var self = this;
      ionic.onGesture('dragstart', function(e) {
        var cx = window.innerWidth / 2;
        if(e.gesture.touches[0].pageX < cx) {
          self._transformOriginRight();
        } else {
          self._transformOriginLeft();
        }
        self._doDragStart(e);
      }, this.el);

      ionic.onGesture('drag', function(e) {
        window.rAF(function() { self._doDrag(e) });
      }, this.el);

      ionic.onGesture('dragend', function(e) {
        window.rAF(function() { self._doDragEnd(e) });
      }, this.el);
    },

    // Rotate anchored to the left of the screen
    _transformOriginLeft: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'left center';
      this.rotationDirection = 1;
    },

    _transformOriginRight: function() {
      this.el.style[TRANSFORM_ORIGIN] = 'right center';
      this.rotationDirection = -1;
    },

    _doDragStart: function(e) {
      var width = this.el.offsetWidth;
      var point = window.innerWidth / 2 + this.rotationDirection * (width / 2)
      var distance = Math.abs(point - e.gesture.touches[0].pageX);// - window.innerWidth/2);
      console.log(distance);

      this.touchDistance = distance * 10;

      console.log('Touch distance', this.touchDistance);//this.touchDistance, width);
    },

    _doDrag: function(e) {
      var o = e.gesture.deltaY / 3;

      this.rotationAngle = Math.atan(o/this.touchDistance) * this.rotationDirection;

      if(e.gesture.deltaY < 0) {
        this.rotationAngle = 0;
      }

      this.y = this.startY + (e.gesture.deltaY * 0.4);

      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px, ' + this.y  + 'px, 0) rotate(' + (this.rotationAngle || 0) + 'rad)';
    },
    _doDragEnd: function(e) {
      this.transitionOut(e);
    }
  });


  angular.module('ionic.contrib.ui.cards', ['ionic'])

  .directive('swipeCard', function() {
    return {
      restrict: 'E',
      template: '<div class="swipe-card" ng-transclude></div>',
      require: '^swipeCards',
      replace: true,
      transclude: true,
      scope: {
        onSwipe: '&'
      },
      compile: function(element, attr) {
        return function($scope, $element, $attr, swipeCards) {
          var el = $element[0];

          // Instantiate our card view
          var swipeableCard = new SwipeableCardView({
            el: el,
            onSwipe: function() {
            }
          });
          $scope.swipeableCard = swipeableCard;

          swipeCards.pushCard(swipeableCard);

        }
      }
    }
  })

  .directive('swipeCards', function() {
    return {
      restrict: 'E',
      template: '<div class="swipe-cards" ng-transclude></div>',
      replace: true,
      transclude: true,
      controller: function($scope, $element) {

        return new SwipeableCardController({
        });
      },
      link: function($scope, $element, $attr) {
      }
    }
  });

})(window.ionic);
