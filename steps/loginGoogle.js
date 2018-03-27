'use strict';

module.exports.loginGoogle = function(email, password) {
  this.wait(20);
  this.seeInCurrentUrl('google.com');
  this.wait(2);
  this.click({name: 'identifier'});
  this.pressKey(email.split(''));
  this.click({id: 'identifierNext'});
  this.waitForVisible({name: 'password'}, 2);
  this.click({name: 'password'});
  this.pressKey(password.split(''));
  this.pressKey('Enter');
};
