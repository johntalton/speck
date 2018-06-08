const { Providable } = require('../lifecycle/providable.js');

const rasbus = require('rasbus');

class I2CBus extends Providable {
  static from() {
    return new I2CBus();
  }

  inject(name, client) {
    if(name !== 'life') { return; }

    this.provides('I\u00B2C', rasbus.byname('i2cbus'));
  }
}

module.exports = { I2CBus };
