var btn = document.querySelector('#btn');
var inp = document.querySelector('#inp');
var out = document.querySelector('#out');
var out2 = document.querySelector('#out2');

var out3 = document.querySelector('#out3');
var out4 = document.querySelector('#out4');


var Sob = (function(){
  var Sob = function(){
    this._count = 0;
    this._subs = [];
  };
  
  Sob.prototype.onNext = function(value){
    //console.log(value);
    this._count+=1;
    this._subs.forEach(function(sub){
      sub(value);
    });
  };
  
  Sob.prototype.sub = function(fn){
    if(!this.active)
      this.run();
    this._subs.push(fn);
  };
  
  Sob.prototype.unsub = function(fn){
    this._subs.splice(this._subs.indexOf(fn), 1)
  };
  
  Sob.prototype.hasSubs = function(fn){
    return this._subs.length > 0;
  };
  
  Sob.prototype.map = function(fn){
    var that = this;
    var sob = new Sob();
    var cb = function(data){
      sob.onNext(fn(data));
    };
    sob.run = function(){
      sob.active = true;
      that.sub(cb);
    };
    sob.dispose = function(){
      sob.active = false;
      that.unsub(cb);
    }
    return sob;
  };
  
  Sob.prototype.zip = function(other, fn){
    var that = this;
    var sob = new Sob();
    
    var thatVals = [];
    var otherVals = [];
    
    var onNext = function(){
      if(thatVals.length && otherVals.length)
        sob.onNext( fn(thatVals.shift(), otherVals.shift()) );
    }
    
    var cb1 = function(data){
      thatVals.push(data)
      onNext()
    };
    var cb2 = function(data){
      otherVals.push(data)
      onNext();
    };
    sob.run = function(){
      sob.active = true;
      that.sub(cb1);
      other.sub(cb2);
    };
    sob.dispose = function(){
      sob.active = false;
      that.unsub(cb1)
      other.unsub(cb2)
    }
    return sob;
  };
  
  Sob.prototype.first = function(){
    var that = this;
    var sob = new Sob();
    var cb = function(data){
      sob.onNext(data)
      sob.dispose();
    };
    sob.run = function(){
      sob.active = true;
      that.sub(cb);
    };
    sob.dispose = function(){
      sob.active = false;
      that.unsub(cb)
    }
    return sob;
  };
  
  
  Sob.fromDOMEvent = function(obj, ev){
    var sob = new Sob();
    var cb = function(){
      sob.onNext(Array.prototype.slice.call(arguments));
    };
    sob.run = function(){
      sob.active = true;
      obj.addEventListener(ev, cb);
    }
    sob.dispose = function(){
      sob.active = false;
      obj.removeEventListener(ev, cb);
    };
    return sob;
  };
  
  Sob.fromInterval = function(time){
    var sob = new Sob();
    var itv;
    sob.run = function(){
      sob.active = true;
      itv = setInterval(function(){
        sob.onNext(sob._count);
      }, time);

    }
    sob.dispose = function(){
      sob.active = false;
      clearInterval(itv);
    };
    return sob;
  };
  
  return Sob;
})();
