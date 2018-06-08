const { Providable } = require('../lifecycle/providable.js');
const { Rasbus } = require('@johntalton/rasbus');

class Gpio extends Providable {
  static from(config) {
    return new Gpio(config);
  }

  constructor(config) {
    super();
    this.config = config;
  }

  inject(name, client) {
    if(name === 'onoff') { return this.injectOnoff(client); }
    if(name === 'gpio-extention') { return this.injectMcp23(client); }
    return;
  }

  injectOnoff(client) {
    console.log('configuring pin with onoff');
    try {
      const gpio = new client.Gpio(
        this.config.pin,
        this.config.direction,
        this.config.edge,
        { activeLow: this.config.activeLow });

      const pin = Rasbus.gpio.adoptOnOff(gpio);
      return this.provides(this.config.name, pin);
    }
    catch(e) {
      console.log('err', e);
      // todo
    }
  }

  injectMcp23(client) {
    console.log('configuring pin with mcp23');
    return client.exportGpioFromExisting(this.config)
      .then(pin => this.provides(this.config.name, pin));
  }
}

module.exports = { Gpio };
