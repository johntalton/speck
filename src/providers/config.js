const { ClassSelector } = require('@johntalton/and-other-delights');

const { Providable } = require('../lifecycle/providable.js');

const { Gpio } = require('./bus.js');
const { Mcp23Device } = require('./mcp23.js');
const { BoschIEUDevice } = require('./boschieu.js');
const { TcsDevice } = require('./tcs.js');
const { Tca9548Device } = require('./tca9548.js');
const { Mqtt } = require('./mqtt.js');
const { LedDemo } = require('./leddemo.js');

const fs = require('fs');
const Util = require('util');

const pfs = {
  readFile: Util.promisify(fs.readFile)
};

class RejectFrom {
  static from(device) { throw Error('Unknown Device from: ' + device.type); }
}

class Config extends Providable {
  static from(uri) {
    return new Config(uri);
  }

  constructor(uri) {
    super();
    this.uri = uri;
  }

  inject(name, client) {
    if(name !== 'life') { return Promise.resolve(); }

    console.log('load from file', this.uri);
    return pfs.readFile(this.uri)
      .then(rawcfg => JSON.parse(rawcfg))
      .then(config => {
        return Promise.all(config.devices.map(device => {
          return this.add(ClassSelector.from(device.type)
            .on(type => type === 'gpio', Gpio)
            .on(type => type === 'mcp23', Mcp23Device)
            .on(type => type === 'tcs', TcsDevice)
            .on(type => type === 'tca9548', Tca9548Device)
            .on(type => type === 'boschieu', BoschIEUDevice)
            .on(type => type === 'ledDemo', LedDemo)
            // .on(type => type === '', )
            .catch(RejectFrom)
            .from(device));
        }))
        .then(() => {
          if(config.mqtt === undefined) { return Promise.resolve(); }
          if(config.mqtt.active === false) { return Promise.resolve(); }
          return this.add(Mqtt.from(config.mqtt));
        });
      });
  }
}

module.exports = { Config };
