var assert = require('chai').assert;
var expect = require('chai').expect;

var Sob = require('../dist/sob.js');

describe('Sob', function(){
  it('!== undefined', function(){
    expect(Sob).not.to.be.undefined;
  });
  it('new Sob()', function(){
    expect(new Sob()).to.be.object;
  });

  it('initials', function(){
    var sob = new Sob(function(){return cb});
    expect(sob._runCallback).to.be.function;
    expect(sob._completeCallback).to.be.undefined;
  });

  it('#run', function(){
    var cb = function(){};
    var sob = new Sob(function(){return cb});
    sob.run();
    expect(sob._completeCallback).to.eq(cb);
  });

});
