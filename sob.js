(function(){
	var Sob = function(run, complete){
		this._runCallback = run;
		this._completeCallback = complete;
		
		this.active = false;
		this._count = 0;
		this._subs = [];
		this.next = this.next.bind(this)
		this.error = this.error.bind(this)
		this.complete = this.complete.bind(this)
	};
	
	Sob.prototype.run = function(){
		var that = this;
		this.active = true;
		this._runCallback && this._runCallback.call(this, this.next, this.error, this.complete);
	};
	
	Sob.prototype.complete = function(){
		var args = Array.prototype.slice.call(arguments);
		var that = this;
		this.active = false;
		this._completeCallback && this._completeCallback.call(this);
		
		this._subs.forEach(function(sub){
			sub.onComplete.apply(this, args);
		});
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
	
	Sob.prototype.sub = function(obs){
		this._subs.push(obs);
		if(!this.active)
			this.run();
	};
	
	Sob.prototype.unsub = function(obs){
		this._subs.splice(this._subs.indexOf(obs), 1);
	};
	
	Sob.prototype.hasSubs = function(){
		return this._subs.length > 0;
	};
	
	
	/*factory functions*/
	
	
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
	
	var getEventSob = function(obj, ev, on, off){
		var cb = function(){
			sob.next.apply(sob, Array.prototype.slice.call(arguments));
		};
		var sob = new Sob(
			function(next, error, complete){
				obj[on](ev, cb);
			},
			function(){
				obj[off](ev, cb);
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
		var itv;
		var sob = new Sob(
			function(next, error, complete){
				itv = setInterval(function(){
					next(sob._count);
				}, time);
			},
			function(){
				clearInterval(itv);
			}
		);
		
		return sob;
	};
	
	Sob.fromTimeout = function(time){
		var itv;
		var sob = new Sob(
			function(next, error, complete){
				itv = setTimeout(function(){
					next(sob._count);
					complete();
				}, time);
			},
			function(){
				clearTimeout(itv);
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
				})
				promise.finally && promise.finally(function(){
					complere.apply(sob, Array.prototype.slice.call(arguments));
				});
			},
			function(){
				promise.cancel && promise.cancel();
			}
		);
		
		return sob;
	};
	
	
	/* methods */
	
	Sob.prototype.forEach = function(onNext, onError, onComplete){
		var that = this;
		var obs = {
			onNext: onNext ? onNext.bind(this) : function(){},
			onError: onError? onError.bind(this) : function(){},
			onComplete: onComplete? onComplete.bind(this) : function(){},
		};
		
		this.sub(obs);
	};
	
	
	var getSobForCb = function(that, obs){
		return new Sob(
			function(next, error, complete){
				that.sub(obs);
			},
			function(){
				that.unsub(obs);
			}
		);
	};
	
	Sob.prototype.map = function(fn){
		var that = this;
		var obs = {
			onNext: function(data){
				sob.next(fn(data, sob._count, that));
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	
	Sob.prototype.filter = function(fn){
		var that = this;
		var obs = {
			onNext: function(data){
				if(fn(data, sob._count, that))
					sob.next(data);
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	
	Sob.prototype.reduce = function(fn, acc){
		var that = this;

		var obs = {
			onNext: function(data){
				acc = fn(acc, data, sob._count, that);
				sob.next(acc);
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	
	Sob.prototype.flatMap = function(fn){
		var that = this;
		var sourceCompleted = false;
		var unfinishedCount = 0;
		var obs = {
			onNext: function(innerObs){
				innerObs.sub({
					onNext: function(data){
						sob.next(fn(data));
						unfinishedCount += 1;
					},
					onError: function(data){
						sob.error(fn(data));
					},
					onComplete: function(){
						unfinishedCount -= 1;
						if(sourceCompleted && unfinishedCount === 0)
							sob.complete();
					}
				});
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sourceCompleted = true;
				if(unfinishedCount === 0)
					sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	
	// Sob.prototype.concatMap = function(fn){
	// };
	
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
				that.sub(thatObs);
				other.sub(otherObs);
			},
			function(){
				that.unsub(thatObs);
				other.unsub(otherObs);
			}
		);
		
		return sob;
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
				that.sub(obs);
				other.sub(obs);
			},
			function(){
				that.unsub(obs);
				other.unsub(obs);
			}
		);

		return sob;
	};
	
	Sob.prototype.first = function(){
		var obs = {
			onNext: function(data){
				sob.next(data);
				sob.complete();
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, sob);
		return sob;
	};
	
	Sob.prototype.buffer = function(size){
		var that = this;
		var buffer = [];
		size = size || 0;
		var obs = {
			onNext: function(data){
				buffer.push(data);
				if(buffer.length === size){
					sob.next(Sob.fromArray(buffer.slice()));
					buffer.shift();
				}
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	
	Sob.prototype.delay = function(time){
		var that = this;
		var completed = false;
		var obs = {
			onNext: function(data){
				setTimeout(function(){
					sob.next(data);
					if(completed)
						sob.complete();
				}, time || 0);
			},
			onError: function(err){
				sob.error(err);
			},
			onComplete: function(){
				completed = true;
				sob.complete();
			}
		};
		
		var sob = getSobForCb(this, obs);
		return sob;
	};
	

	
	if(typeof module!== 'undefined')
		module.exports = Sob;
	else if(typeof requirejs !== 'undefined')
		define('Sob', [], function(){ return Sob;});
	else 
		window.Sob = Sob;
	
})();