(function(){
	var Sob = function(run, dispose){
		
		this.run = function(){
			this.active = true;
			run && run(this.onNext);
		}.bind(this);
		
		this.dispose = function(){
			this.active = false;
			dispose && dispose();
		}.bind(this);
		
		this._count = 0;
		this._subs = [];
	};
	
	Sob.prototype.onNext = function(){
		var args = Array.prototype.slice.call(arguments);
		this._count+=1;
		this._subs.forEach(function(sub){
			sub.apply(this, args);
		});
	};
	
	Sob.prototype.sub = function(fn){
		this._subs.push(fn);
		if(!this.active)
			this.run();
	};
	
	Sob.prototype.unsub = function(fn){
		this._subs.splice(this._subs.indexOf(fn), 1);
	};
	
	Sob.prototype.hasSubs = function(fn){
		return this._subs.length > 0;
	};
	
	var getSobForCb = function(that, cb){
		return new Sob(
			function(){
				that.sub(cb);
			},
			function(){
				that.unsub(cb);
			}
		);
	};
	
	
	Sob.prototype.map = function(fn){
		var that = this;
		var cb = function(data){
			sob.onNext(fn(data, sob._count, that));
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	Sob.prototype.filter = function(fn){
		var that = this;
		var cb = function(data){
			if(fn(data, sob._count, that))
				sob.onNext(data);
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	Sob.prototype.reduce = function(fn, acc){
		var that = this;
		var cb = function(data){
			acc = fn(acc, data, sob._count, that);
			sob.onNext(acc);
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	Sob.prototype.flatMap = function(fn){
		var that = this;
		var cb = function(obs){
			obs.sub(function(data){
				sob.onNext(fn(data));
			});
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	// Sob.prototype.concatMap = function(fn){
	// };
	
	Sob.prototype.zip = function(other, fn){
		var that = this;
		var sob = new Sob(
			function(){
				that.sub(cb1);
				other.sub(cb2);
			},
			function(){
				that.unsub(cb1);
				other.unsub(cb2);
			}
		);
		
		var thatVals = [];
		var otherVals = [];
		
		var onNext = function(){
			if(thatVals.length && otherVals.length)
			sob.onNext( fn(thatVals.shift(), otherVals.shift()) );
		};
		
		var cb1 = function(data){
			thatVals.push(data);
			onNext();
		};
		var cb2 = function(data){
			otherVals.push(data);
			onNext();
		};
		
		return sob;
	};
	
	Sob.prototype.merge = function(other){
		var that = this;
		var sob = new Sob(
			function(){
				that.sub(cb);
				other.sub(cb);
			},
			function(){
				that.unsub(cb);
				other.unsub(cb);
			}
		);
		var cb = function(data){
			sob.onNext(data);
		};

		return sob;
	};
	
	Sob.prototype.first = function(){
		var that = this;
		var cb = function(data){
			sob.onNext(data);
			sob.dispose();
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	Sob.prototype.buffer = function(size){
		var that = this;
		var buffer = [];
		size = size || 0;
		var cb = function(data){
			buffer.push(data);
			if(buffer.length === size){
				sob.onNext(Sob.fromArray(buffer.slice()));
				buffer.shift();
			}
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	Sob.prototype.delay = function(time){
		var that = this;
		var cb = function(data){
			setTimeout(function(){
				sob.onNext(data);
			}, time || 0);
		};
		var sob = getSobForCb(this, cb);
		return sob;
	};
	
	
	Sob.fromArray = function(arr){
		var sob = new Sob(
			function(){
				arr.forEach(function(item){
					sob.onNext(item);
				});
			},
			function(){
			}
		);
		
		return sob;
	};
	
	var getEventSob = function(obj, ev, on, off){
		var sob = new Sob(
			function(){
				obj[on](ev, cb);
			},
			function(){
				obj[off](ev, cb);
			}
		);
		var cb = function(){
			sob.onNext.apply(sob, Array.prototype.slice.call(arguments));
		};
		
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
			function(){
				itv = setInterval(function(){
					sob.onNext(sob._count);
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
			function(){
				itv = setTimeout(function(){
					sob.onNext(sob._count);
					sob.dispose();
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
			function(){
				promise.then(function(){
					sob.onNext();
				}).finally(function(){
					sob.dispose();
				});
			},
			function(){
				promise.cancel && promise.cancel();
			}
		);
		return sob;
	};
	
	if(typeof module!== 'undefined')
		module.exports = Sob;
	else if(typeof requirejs !== 'undefined')
		define('Sob', [], function(){ return Sob;});
	else 
		window.Sob = Sob;
	
})();