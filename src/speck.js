const { Lifecycle } = require('./lifecycle/lifecycle.js');

const { Config } = require('./providers/config.js');
const { I2CBus } = require('./providers/i2c.js');
const { Onoff } = require('./providers/onoff.js');

Lifecycle.birth()
  .add(Config.from('speck.json'))
  .add(I2CBus.from())
  .add(Onoff.from())
  .death();

