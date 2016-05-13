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
