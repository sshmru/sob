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
