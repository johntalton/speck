
const mqtt = require('mqtt');

const { ConfigUtil } = require('@johntalton/and-other-delights');
const { Providable } = require('../lifecycle/providable.js');

const DEFAULT_RECONNECT_MS = 30 * 1000;

function blacklist(value) {
  return value;
}

class Mqtt extends Providable {
  static from(config) {
    return new Mqtt(config);
  }

  constructor(config) {
    super();
    this.config = config;
  }

  inject(name, client) {
    if(name !== 'life') { return Promise.resolve(); }

    const url = this.config.url !== undefined ? this.config.url : process.env.mqtturl;

    const reconnectPeriodMs = ConfigUtil.readTimeout(
      this.config.reconnectPeriodMs,
      this.config.reconnectPeriodS,
      DEFAULT_RECONNECT_MS);

    console.log('create mqtt client connection', blacklist(url), reconnectPeriodMs);
    this.client  = mqtt.connect(url, { reconnectPeriod: reconnectPeriodMs });
    this.client.on('connect', () => {
      this.provides(this.config.name, this);
    });
    this.client.on('reconnect', () => { console.log('reconnect'); });
    this.client.on('close', () => { console.log('close'); });
    this.client.on('offline', () => { console.log('offline'); });
    this.client.on('error', (error) => { console.log(error); throw Error('mqtt error: ' + error.toString()); });

    return Promise.resolve();
  }
}

module.exports = { Mqtt };
