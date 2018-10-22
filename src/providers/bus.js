const { Providable } = require('../lifecycle/providable.js');
const { Rasbus } = require('@johntalton/rasbus');

class Bus extends Providable {
  static from() {
    return new Bus();
  }

  inject(name, client) {
    if(name !== 'life') { return; }

    return Promise.all([
      this.provides('I\u00B2C', Rasbus.i2c),
      this.provides('\uD83D\uDD00 SPI', Rasbus.spi)
    ]);
  }
}

class Gpio extends Providable {
  static from(config) {
    return new Gpio(config);
  }

  constructor(config) {
    super();
    this.config = config;
  }

  inject(name, client) {
    if(name !== 'life') { return; }

    return Rasbus.gpio.exportGpio(this.config.pin, this.config)
      .then(gpio => this.provides(this.config.name, gpio));
  }
}

module.exports = { Bus, Gpio };
