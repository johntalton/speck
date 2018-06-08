const { ClassSelector } = require('@johntalton/and-other-delights');

const { Providable } = require('../lifecycle/providable.js');

const { Gpio } = require('./gpio.js');
const { Mcp23Device } = require('./mcp23.js');
const { TcsDevice } = require('./tcs.js');
const { Mqtt } = require('./mqtt.js');

const fs = require('fs');
const Util = require('util');

const pfs = {
  readFile: Util.promisify(fs.readFile)
};

class RejectFrom {
  static from() { throw Error('Unknown Device from'); }
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

    return pfs.readFile(this.uri)
      .then(rawcfg => JSON.parse(rawcfg))
      .then(config => {
        return Promise.all(config.devices.map(device => {
          return this.add(ClassSelector.from(device.type)
            .on(type => type === 'gpio', Gpio)
            .on(type => type === 'mcp23', Mcp23Device)
            .on(type => type === 'tcs', TcsDevice)
            // .on(type => type === '', )
            .catch(RejectFrom)
            .from(device));
        }))
        .then(() => this.add(Mqtt.from(config.mqtt)));
      });
  }
}

module.exports = { Config };
