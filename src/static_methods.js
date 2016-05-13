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
