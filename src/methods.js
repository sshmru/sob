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
