var Sob = (function(){
  var Sob = function(run, dispose){
    this.run = run;
    this.dispose = dispose;
    this._count = 0;
    this._subs = [];
  };
  
  Sob.prototype.onNext = function(value){
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
    this._subs.splice(this._subs.indexOf(fn), 1);
  };
  
  Sob.prototype.hasSubs = function(fn){
    return this._subs.length > 0;
  };
  
  Sob.prototype.map = function(fn){
    var that = this;
    var sob = new Sob(
      function(){
        sob.active = true;
        that.sub(cb);
      },
      function(){
        sob.active = false;
        that.unsub(cb);
      }
    );
    var cb = function(data){
      sob.onNext(fn(data));
    };

    return sob;
  };
  
  Sob.prototype.flatMap = function(fn){
    var that = this;
    var sob = new Sob(
      function(){
        sob.active = true;
        that.sub(cb);
      },
      function(){
        sob.active = false;
        that.unsub(cb);
      }
    );
    var cb = function(obs){
      obs.sub(function(data){
        sob.onNext(fn(data));
      });
    };

    return sob;
  };
  
  Sob.prototype.zip = function(other, fn){
    var that = this;
    var sob = new Sob(
      function(){
        sob.active = true;
        that.sub(cb1);
        other.sub(cb2);
      },
      function(){
        sob.active = false;
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
  
  Sob.prototype.first = function(){
    var that = this;
    var sob = new Sob(
      function(){
        sob.active = true;
        that.sub(cb);
      },
      function(){
        sob.active = false;
        that.unsub(cb);
      }
    );
    var cb = function(data){
      sob.onNext(data);
      sob.dispose();
    };

    return sob;
  };
  
  
  Sob.fromDOMEvent = function(obj, ev){
    var sob = new Sob(
      function(){
        sob.active = true;
        obj.addEventListener(ev, cb);
      },
      function(){
        sob.active = false;
        obj.removeEventListener(ev, cb);
      }
    );
    var cb = function(){
      sob.onNext(Array.prototype.slice.call(arguments));
    };

    return sob;
  };
  
  Sob.fromInterval = function(time){
    var sob = new Sob(
      function(){
        sob.active = true;
        itv = setInterval(function(){
          sob.onNext(sob._count);
        }, time);
      },
      function(){
        sob.active = false;
        clearInterval(itv);
      }
    );
    var itv;

    return sob;
  };
  
  Sob.fromTimeout = function(time){
    var sob = new Sob(
      function(){
        sob.active = true;
        itv = setTimeout(function(){
          sob.onNext(sob._count);
          sob.dispose();
        }, time);
      },
      function(){
        sob.active = false;
        clearTimeout(itv);
      }
    );
    var itv;

    return sob;
  };
  
  return Sob;
})();