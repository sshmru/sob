(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sob = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Sob = require('./core.js');

Sob.prototype.zip = function(other, fn){
  var that = this;
  var thatVals = [];
  var otherVals = [];

  var onNext = function(){
    if(thatVals.length && otherVals.length)
      sob.next( fn(thatVals.shift(), otherVals.shift()) );
  };

  var thatObs = {
    onNext: function(data){
      thatVals.push(data);
      onNext();
    },
    onError: function(err){
      sob.error(err);
    },
    onComplete: function(){
      sob.complete();
    }
  };
  var otherObs = {
    onNext: function(data){
      otherVals.push(data);
      onNext();
    },
    onError: function(err){
      sob.error(err);
    },
    onComplete: function(){
      sob.complete();
    }
  };

  var sob = new Sob(
    function(next, error, complete){
      that.sub(thatObs.onNext, thatObs.onError, thatObs.onComplete);
      other.sub(otherObs.onNext, otherObs.onError, otherObs.onComplete);
    }
  );

  return sob;
};

Sob.zip = function(that, other,fn){
  return that.zip(other, fn);
};


Sob.prototype.merge = function(other){
  var that = this;
  var completeCount = 0;
  var obs = {
    onNext: function(data){
      sob.next(data);
    },
    onError: function(err){
      sob.error(err);
    },
    onComplete: function(){
      completeCount +=1;
      if(completeCount === 2)
        sob.complete();
    }
  };

  var sob = new Sob(
    function(){
      that.sub(obs.onNext, obs.onError, obs.onComplete);
      other.sub(obs.onNext, obs.onError, obs.onComplete);
    }
  );

  return sob;
};

Sob.merge = function(that, other,fn){
  return that.merge(other, fn);
};

},{"./core.js":2}],2:[function(require,module,exports){
var Sob = function(run){
  this._runCallback = run;

  this.active = false;
  this._count = 0;
  this._subs = [];
  this.next = this.next.bind(this);
  this.error = this.error.bind(this);
  this.complete = this.complete.bind(this);
};

Sob.prototype.run = function(){
  var that = this;
  this.active = true;
  if(this._runCallback)
    this._completeCallback = this._runCallback.call(this, this.next, this.error, this.complete);
};

Sob.prototype.complete = function(){
  var args = Array.prototype.slice.call(arguments);
  var that = this;
  this.active = false;
  this._completeCallback && this._completeCallback.call(this);

  this._subs.forEach(function(sub){
    sub.onComplete.apply(this, args);
  });
  this._subs.length = 0;
};

Sob.prototype.next = function(){
  var args = Array.prototype.slice.call(arguments);
  this._count += 1;
  this._subs.forEach(function(sub){
    sub.onNext.apply(this, args);
  });
};

Sob.prototype.error = function(){
  var args = Array.prototype.slice.call(arguments);
  this._count += 1;
  this._subs.forEach(function(sub){
    sub.onError.apply(this, args);
  });
};

Sob.prototype._sub = function(obs){
  this._subs.push(obs);
  if(!this.active)
    this.run();

  return this.unsub.bind(this, obs);
};

Sob.prototype.sub = function(onNext, onError, onComplete){
  var that = this;
  var obs = {
    onNext: onNext ? onNext.bind(this) : function(){},
    onError: onError? onError.bind(this) : function(){},
    onComplete: onComplete? onComplete.bind(this) : function(){},
  };

  return this._sub(obs);
};

Sob.prototype.unsub = function(obs){
  this._subs.splice(this._subs.indexOf(obs), 1);
};

Sob.prototype.hasSubs = function(){
  return this._subs.length > 0;
};

module.exports = Sob;

},{}],3:[function(require,module,exports){
var Sob = require('./core.js');
require('./methods.js');
require('./static_methods.js');
require('./combine_methods.js');
module.exports = Sob;

},{"./combine_methods.js":1,"./core.js":2,"./methods.js":4,"./static_methods.js":5}],4:[function(require,module,exports){
var Sob = require('./core.js');

Sob.prototype.forEach = Sob.prototype.sub;

Sob.prototype.connectObserver = function(n,e,c){
	var that = this;
	return new Sob(
		function(next, error, complete){
			that.sub(n,e,c);
		}
	);
};

Sob.prototype.map = function(fn){
	var that = this;
	var sob = this.connectObserver(
		function(data){
			sob.next(fn(data, sob._count, that));
		},
		function(err){
			sob.error(err);
		},
		function(){
			sob.complete();
		}
	);

	return sob;
};

Sob.prototype.filter = function(fn){
	var that = this;
	var sob = this.connectObserver(
		function(data){
			if(fn(data, sob._count, that))
				sob.next(data);
		},
		function(err){
			sob.error(err);
		},
		function(){
			sob.complete();
		}
	);

	return sob;
};

Sob.prototype.reduce = function(fn, acc){
	var that = this;

	var sob = this.connectObserver(
		function(data){
			acc = fn(acc, data, sob._count, that);
			sob.next(acc);
		},
		function(err){
			sob.error(err);
		},
		function(){
			sob.complete();
		}
	);

	return sob;
};

Sob.prototype.flatMap = function(fn){
	var that = this;
	var sourceCompleted = false;
	var unfinishedCount = 0;
	var sob = this.connectObserver(
		function(innerObs){
			innerObs.sub(
				function(data){
					sob.next(fn(data));
					unfinishedCount += 1;
				},
				function(data){
					sob.error(fn(data));
				},
				function(){
					unfinishedCount -= 1;
					if(sourceCompleted && unfinishedCount === 0)
						sob.complete();
				}
			);
		},
		function(err){
			sob.error(err);
		},
		function(){
			sourceCompleted = true;
			if(unfinishedCount === 0)
				sob.complete();
		}
	);

	return sob;
};

// Sob.prototype.concatMap = function(fn){
// };




Sob.prototype.first = function(){
	var sob = this.connectObserver(
		function(data){
			sob.next(data);
			sob.complete();
		},
		function(err){
			sob.error(err);
		},
		function(){
			sob.complete();
		}
	);

	return sob;
};

Sob.prototype.buffer = function(size){
	var that = this;
	var buffer = [];
	size = size || 0;
	var sob = this.connectObserver(
		function(data){
			buffer.push(data);
			if(buffer.length === size){
				sob.next(Sob.fromArray(buffer.slice()));
				buffer.shift();
			}
		},
		function(err){
			sob.error(err);
		},
		function(){
			sob.complete();
		}
	);

	return sob;
};

Sob.prototype.delay = function(time){
	var that = this;
	var completed = false;
	var sob = this.connectObserver(
		function(data){
			setTimeout(function(){
				sob.next(data);
				if(completed)
					sob.complete();
			}, time || 0);
		},
		function(err){
			sob.error(err);
		},
		function(){
			completed = true;
			sob.complete();
		}
	);

	return sob;
};

},{"./core.js":2}],5:[function(require,module,exports){
var Sob = require('./core.js');

Sob.fromArray = function(arr){
  var sob = new Sob(
    function(next, error, complete){
      arr.forEach(function(item){
        next(item);
      });
      complete();
    }
  );

  return sob;
};


Sob.repeat = function(value, times){
  var sob = new Sob(
    function(next, error, complete){
      for(var i = 0; i < times; i++){
        next(value);
      }
      complete();
    }
  );

  return sob;
};


var getEventSob = function(obj, ev, on, off){
  var cb = function(){
    sob.next.apply(sob, Array.prototype.slice.call(arguments));
  };
  var sob = new Sob(
    function(next, error, complete){
      obj[on](ev, cb);

      return function(){
        obj[off](ev, cb);
      };
    }
  );

  return sob;
};


Sob.fromDOMEvent = function(obj, ev){
  return getEventSob(obj, ev, 'addEventListener', 'removeEventListener');
};

Sob.fromEvent = function(obj, ev){
  return getEventSob(obj, ev, 'on', 'off');
};

Sob.fromInterval = function(time){
  var sob = new Sob(
    function(next, error, complete){
      var itv = setInterval(function(){
        next(sob._count);
      }, time);
      return function(){
        clearInterval(itv);
      };
    }
  );

  return sob;
};

Sob.fromTimeout = function(time){
  var itv;
  var sob = new Sob(
    function(next, error, complete){
      var timer = setTimeout(function(){
        next(sob._count);
        complete();
      }, time);
      return function(){
        clearTimeout(timer);
      };
    }
  );

  return sob;
};

Sob.fromPromise = function(promise){
  var itv;
  var sob = new Sob(
    function(next, error, complete){
      promise.then(function(){
        next.apply(sob, Array.prototype.slice.call(arguments));
      }).catch(function(){
        error.apply(sob, Array.prototype.slice.call(arguments));
      });
      promise.finally && promise.finally(function(){
        complere.apply(sob, Array.prototype.slice.call(arguments));
      });
      return function(){
        promise.cancel && promise.cancel();
      };
    }
  );

  return sob;
};

/* wrappers */

Sob.fromCallback = function(fn, ctx){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    return new Sob(
      function(next, error, complete){
        fn.apply(ctx, args.concat(function(){
          var innerArgs = Array.prototype.slice.call(arguments);
          next.apply(ctx, innerArgs);
        }));
      }
    );
  };
};

Sob.fromNodeCallback = function(fn, ctx){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    return new Sob(
      function(next, error, complete){
        fn.apply(ctx, args.concat(function(err){
          var innerArgs = Array.prototype.slice.call(arguments, 1);
          if(!err)
          next.apply(ctx, innerArgs);
          else
          error.apply(ctx, err);
        }));
      }
    );
  };
};

Sob.toAsync = function(fn, ctx){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    return Sob.fromTimeout(0).map(function(){
      return fn.apply(ctx, args);
    });
  };
};

},{"./core.js":2}]},{},[3])(3)
});