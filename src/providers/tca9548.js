const { Providable } = require('../lifecycle/providable.js');
const { Tca9548 } = require('@johntalton/tca9548');

class Tca9548Device extends Providable {
  static from(config) {
    return new Tca9548Device(config);
  }

  constructor(config) {
    super();
    this.config = config;
    this.i2c = undefined;
    this.reset = undefined;
  }

  inject(name, client) {
    if(name === this.config.bus.driver) {
      this.i2c = client;
      return this._setup();
    }
    else if(name === this.config.reset) {
      this.reset = client;
      console.log('tca reset control unimplmeneted');
      //return this._enableReset();
    }

    return Promise.resolve();
  }

  _setup() {
    console.log('setup tca9548 I2C Multiplexer');
    return this.i2c.init(...this.config.bus.id)
      .then(bus => Tca9548.from(bus)
        .then(device => this._configure(device))
        .catch(e => console.log('', e)))
      .catch(e => {
        console.log('error during i2c ', e)
      })
  }

  _configure(device) {
    console.log('configureing tca device', device);
    return this.provides(this.config.name, device);
  }
}

module.exports = { Tca9548Device };
