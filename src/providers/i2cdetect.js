const { Providable } = require('../lifecycle/providable.js');

const FULL_FIRST = 0x00;
const FULL_LAST = 0x7F;

const SAFE_FIRST = 0x03;
const SAFE_LAST = 0x77;

const BUFFER_READ_LENGTH = 1;

class I2CDetect extends Providable {
  static from() {
    return new I2CDetect();
  }

  inject(name, client) {
    if(name !== 'I\u00B2CC') { return Promise.resolve(); }
    return I2CDetect.detect(client)
      .then(info => {
        //
      });
  }

  static detect(bus, client) {
    if(!validBus(bus)) { return Promise.resolve([]); }

    const first = SAFE_FIRST;
    const last = SAFE_LAST;
    const length = BUFFER_READ_LENGTH;

    const scanrange = I2CDetect.scanRange(first, last);
    return scanrange.map(address => {
      return client.init(bus, address)
        .then(device => {
          return device.readBuffer(length)
            .then(buf => { return [address]; })
            .catch(e => { return []; });
        });
    })
    .filter(addresseses => addresseses.length === 1)
    .map(addresseses => addresseses[0]) // grrr on not having .last/.first
    .map(addresses => {
      //
    });
  }
}

module.exports = { I2CDetect };
