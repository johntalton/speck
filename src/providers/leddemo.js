const { Providable } = require('../lifecycle/providable.js');

class RequiresNamesProvidable extends Providable {
  constructor(namemap) {
    super();
    this.clients = new Map(Object.entries(namemap).map(([k, v]) => [k]));
    console.log('from name name client object', namemap, this.clients, )
  }

  ready() {
    return Promise.resolve();
  }

  byName(name) {
    return this.client.get(name);
  }

  inject(name, client) {
    console.log('required name inject ------------- ', name);
    console.log(this.clients);
    if(this.clients.has(name)) {
      console.log('require has name');
      this.clients.set(name, client);

      if(this.hasAll()) {
        return this.ready();
      }

      return Promise.resolve();
    }

    return Promise.resolve();
  }

  hasAll() {
    let all = true;
    this.clients.forEach((value, key) => {
      all = all & (value !== undefined);
    });
    return all;
  }

}

class LedDemo extends RequiresNamesProvidable {
  static from(config) { return new LedDemo(config); }

  constructor(config) {
    super({
      button: config.button,
      led: config.led
    });
    this.config = config;
  }

  ready() {
    const button = this.clients.get(this.config.button);
    const led = this.clients.get(this.config.led);

    console.log('ready - all clients avaialble');
    button.watch((err, value) => {
      console.log('button event', err, value);
      if(err) { console.log('button watch err', err); return; }
      return led.write(value); // todo use to high / low utility
    });

    return Promise.resolve();
  }
}

module.exports = { LedDemo };
