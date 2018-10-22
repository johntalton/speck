const { Lifecycle } = require('../');

const { Config, Bus } = require('../src/providers');

const path = process.argv[2] || 'speck.json';

Lifecycle.birth()
  .add(Config.from(path))
  .add(Bus.from())
  .death();

