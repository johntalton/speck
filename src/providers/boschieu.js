
const { Providable } = require('../lifecycle/providable.js');
const { BoschIEU } = require('@johntalton/boschieu')

class BoschIEUDevice extends Providable {
  static from(config) {
    return new BoschIEUDevice(config);
  }

  constructor(config) {
    super();
    this.config = config;
  }

  inject(name, client) {
    if(name === this.config.bus.driver) {
      this.i2c = client;
      return this._setup();
    }

    return Promise.resolve();
  }

  _setup() {
    return this.i2c.init(...this.config.bus.id)
      .then(bus => {
        console.log('with bus', this.config.name);
        return BoschIEU.sensor(bus);
      })
      .catch(e => {
        console.log('boschieu setup error', e);
      })
  }

}

module.exports = { BoschIEUDevice };


