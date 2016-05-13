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

});
