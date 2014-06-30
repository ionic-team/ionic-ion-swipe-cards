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
    /**
     * Push a new card onto the stack.
     */
    pushCard: function(card) {
      var self = this;

      this.cards.push(card);
      this.beforeCardShow(card);

      card.transitionIn(this.cardAnimation);
      setTimeout(function() {
        card.disableTransition(self.cardAnimation);
      }, this.cardPopInDuration + 100);
    },
    /**
     * Set up a new card before it shows.
     */
    beforeCardShow: function() {
      var nextCard = this.cards[this.cards.length-1];
      if(!nextCard) return;

      // Calculate the top left of a default card, as a translated pos
      var topLeft = window.innerHeight / 2 - this.maxHeight/2;

      var cardOffset = Math.min(this.cards.length, 3) * 5;

      // Move each card 5 pixels down to give a nice stacking effect (max of 3 stacked)
      nextCard.setPopInDuration(this.cardPopInDuration);
      nextCard.setZIndex(this.cards.length);
      nextCard.el.style.maxHeight  = (window.innerHeight / this.cards.length) + 'px';
    },
    /**
     * Pop a card from the stack
     */
    popCard: function(animate) {
      var card = this.cards.pop();
      if(animate) {
        card.swipe();
      }
      return card;
    }
  });

  var SwipeableCardView = ionic.views.View.inherit({
    /**
     * Initialize a card with the given options.
     */
    initialize: function(opts) {
      opts = ionic.extend({
      }, opts);

      ionic.extend(this, opts);

      this.el = opts.el;

      this.startX = this.startY = this.x = this.y = 0;

      this.flipped = false;
      
      this.gestureEnabled = true;

      this.bindEvents();
    },

    /**
     * Set the X position of the card.
     */
    setX: function(x) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + x + 'px,' + this.y + 'px, 0)';
      this.x = x;
      this.startX = x;
    },

    /**
     * Set the Y position of the card.
     */
    setY: function(y) {
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px,' + y + 'px, 0)';
      this.y = y;
      this.startY = y;
    },

    /**
     * Set the Z-Index of the card
     */
    setZIndex: function(index) {
      this.el.style.zIndex = index;
    },

    /**
     * Set the width of the card
     */
    setWidth: function(width) {
      this.el.style.width = width + 'px';
    },

    /**
     * Set the height of the card
     */
    setHeight: function(height) {
      this.el.style.height = height + 'px';
    },

    /**
     * Set the duration to run the pop-in animation
     */
    setPopInDuration: function(duration) {
      this.cardPopInDuration = duration;
    },

    /**
     * Transition in the card with the given animation class
     */
    transitionIn: function(animationClass) {
      var self = this;

      this.el.classList.add(animationClass + '-start');
      this.el.classList.add(animationClass);
      this.el.style.display = 'block';
      setTimeout(function() {
        self.el.classList.remove(animationClass + '-start');
      }, 100);
    },

    /**
     * Disable transitions on the card (for when dragging)
     */
    disableTransition: function(animationClass) {
      this.el.classList.remove(animationClass);
    },
    
    enableGesture: function(enable) {
      this.gestureEnabled = enable;
    },

    /**
     * Swipe a card out programtically
     */
    swipeRight: function() {
      this.enableGesture(false);
      this.transitionOut(false);
    },
    swipeLeft: function() {
      this.enableGesture(false);
      this.transitionOut(true);
    },

    /**
     * Fly the card out or animate back into resting position.
     */
    transitionOut: function(right) {
      var self = this;
      var rotateTo = (this.rotationAngle + (this.rotationDirection * 0.6)) || (Math.random() * 0.4);
      var duration = this.rotationAngle ? 0.2 : 0.5;
      this.el.style[TRANSITION] = '-webkit-transform '+duration+'s ease-in-out';
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + (right ? '-':'')+(window.innerWidth * 1.5) + 'px ,' + this.y + 'px, 0) rotate(' + rotateTo + 'rad)';
      !right && this.onSwipeLeft && this.onSwipeLeft();
      right && this.onSwipeRight && this.onSwipeRight();

      // Trigger destroy after card has swiped out
      setTimeout(function() {
        self.onDestroy && self.onDestroy();
      }, duration * 1000);
    },
    
    /**
     * Fly the card out or animate back into resting position.
     */
    transitionBack: function() {
      var self = this;
      var duration = this.rotationAngle ? 0.2 : 0.5;
      this.el.style[TRANSITION] = '-webkit-transform '+duration+'s ease-in-out';
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.startX + 'px ,' + this.startY + 'px, 0)';
      if(this.flipped) {
        this.el.style[ionic.CSS.TRANSFORM] += ' rotate'+((this.el.offsetWidth > this.el.offsetHeight) ? 'X':'Y')+'(180deg)';
      }

      // Trigger destroy after card has swiped out
      setTimeout(function() {
        self.el.style[TRANSITION] = 'none';
        self.el.style.zIndex = 9;
      }, duration * 1000);
    },

    /**
     * Bind drag events on the card.
     */
    bindEvents: function() {
      var self = this;
      
      ionic.onGesture('release', function(e) {
        window._rAF(function() { self._doTap(e) });
      }, this.el);
      
      ionic.onGesture('dragstart', function(e) {
        window._rAF(function() { self._doDragStart(e) });
      }, this.el);

      ionic.onGesture('drag', function(e) {
        window._rAF(function() { self._doDrag(e) });
      }, this.el);

      ionic.onGesture('dragend', function(e) {
        window._rAF(function() { self._doDragEnd(e) });
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
    
    _doTap: function(e) {
      if(this.gestureEnabled) {
      	var self = this;
        this.el.style[TRANSFORM_ORIGIN] = 'center center';
        this.el.style[TRANSITION] = '-webkit-transform 0.5s ease-in-out';
        if(!this.flipped) {
        	this.el.style[ionic.CSS.TRANSFORM] = 'rotate'+((this.el.offsetWidth > this.el.offsetHeight) ? 'X':'Y')+'(180deg)';
        	this.flipped = true;
        	setTimeout(function() {
        		for(var i = 0, elements = self.el.getElementsByClassName('front'); i < elements.length; i++) {
        			elements[i].style.display = 'none';
        		}
        		for(var i = 0, elements = self.el.getElementsByClassName('back'); i < elements.length; i++) {
        			elements[i].style.display = 'block';
        			elements[i].style[ionic.CSS.TRANSFORM] = 'rotate'+((self.el.offsetWidth > self.el.offsetHeight) ? 'X':'Y')+'(180deg)';
        		}
        		self.onFlipFront && self.onFlipFront();	
        	}, 250);
        } else {
        	this.el.style[ionic.CSS.TRANSFORM] = 'rotate'+((this.el.offsetWidth > this.el.offsetHeight) ? 'X':'Y')+'(0deg)';
        	this.flipped = false;
        	setTimeout(function() {
        		for(var i = 0, elements = self.el.getElementsByClassName('front'); i < elements.length; i++) {
        			elements[i].style.display = 'block';
        		}
        		for(var i = 0, elements = self.el.getElementsByClassName('back'); i < elements.length; i++) {
        			elements[i].style.display = 'none';
        		}
        		self.onFlipBack && self.onFlipBack();	
        	}, 250);
        }
      }
      this.enableGesture(true);
      
    },

    _doDragStart: function(e) {
      this.enableGesture(false);
      this.el.style[TRANSITION] = 'none';
      this.el.style.zIndex = 10;
      
      var width = this.el.offsetWidth;
      var point = window.innerWidth / 2 + this.rotationDirection * (width / 2)
      var distance = Math.abs(point - e.gesture.touches[0].pageX);

      this.touchDistance = distance * 10;
    },

    _doDrag: function(e) {
      var o = e.gesture.deltaX / 3;

      this.rotationAngle = Math.atan(o/this.touchDistance) * this.rotationDirection;

      this.x = this.startX + (e.gesture.deltaX);
      this.y = this.startY + (e.gesture.deltaY);
      this.el.style[ionic.CSS.TRANSFORM] = 'translate3d(' + this.x + 'px, ' + this.y  + 'px, 0) rotate(' + (this.rotationAngle || 0) + 'rad)';
      
      if(this.flipped) {
        this.el.style[ionic.CSS.TRANSFORM] += ' rotate'+((this.el.offsetWidth > this.el.offsetHeight) ? 'X':'Y')+'(180deg)';
      }
    },
    _doDragEnd: function(e) {
      if(Math.abs(this.x - this.startX) < 75) {
        this.transitionBack(e);
        this.el.style[TRANSITION] = '-webkit-transform 0.5s ease-in-out';
      } else {
        this.transitionOut(this.x < 0);
      }
    }
  });


  angular.module('ionic.contrib.ui.cards', ['ionic'])

  .directive('swipeCard', ['$timeout', '$rootScope', function($timeout, $rootScope) {
    return {
      restrict: 'E',
      template: '<div class="swipe-card" ng-transclude></div>',
      require: '^swipeCards',
      replace: true,
      transclude: true,
      scope: {
        onSwipeLeft: '&',
        onSwipeRight: '&',
        onFlipFront: '&',
        onFlipBack: '&',
        onDestroy: '&'
      },
      compile: function(element, attr) {
        return function($scope, $element, $attr, swipeCards) {
          var el = $element[0];

          // Instantiate our card view
          var swipeableCard = new SwipeableCardView({
            el: el,
            onSwipeLeft: function() {
              $timeout(function() {
        $rootScope.$emit('swipeCard.pop');
                $scope.onSwipeLeft();
              });
            },
            onSwipeRight: function() {
              $timeout(function() {
        $rootScope.$emit('swipeCard.pop');
                $scope.onSwipeRight();
              });
            },
            onFlipFront: function() {
              $timeout(function() {
                $scope.onFlipFront();
              });
            },
            onFlipBack: function() {
              $timeout(function() {
                $scope.onFlipBack();
              });
            },
            onDestroy: function() {
              $timeout(function() {
                $scope.onDestroy();
              });
            },
          });
          $scope.$parent.swipeCard = swipeableCard;

          swipeCards.pushCard(swipeableCard);

        }
      }
    }
  }])

  .directive('swipeCards', ['$rootScope', function($rootScope) {
    return {
      restrict: 'E',
      template: '<div class="swipe-cards" ng-transclude></div>',
      replace: true,
      transclude: true,
      scope: {},
      controller: function($scope, $element) {
        var swipeController = new SwipeableCardController({
        });

        $rootScope.$on('swipeCard.pop', function() {
          swipeController.popCard();
        });

        return swipeController;
      }
    }
  }])

  .factory('$ionicSwipeCardDelegate', ['$rootScope', function($rootScope) {
    return {
      swipeLeft: function($scope) {
        $rootScope.$emit('swipeCard.pop');
        $scope.$parent.swipeCard.swipeLeft();
      },
      swipeRight: function($scope) {
        $rootScope.$emit('swipeCard.pop');
        $scope.$parent.swipeCard.swipeRight();
      },
      getSwipebleCard: function($scope) {
        return $scope.$parent.swipeCard;
      }
    }
  }]);

})(window.ionic);