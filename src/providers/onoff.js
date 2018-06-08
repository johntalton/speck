const { Providable } = require('../lifecycle/providable.js');

const onoff = require('onoff');

class Onoff extends Providable {
  static from() {
    return new Onoff();
  }

  inject(name, client) {
    if(name !== 'life') { return; }
    this.provides('onoff', onoff);
    return Promise.resolve()
  }
}

module.exports = { Onoff };
