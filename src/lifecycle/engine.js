const { EventEmitter } = require('events');

class Engine extends EventEmitter {
  constructor() {
    super();

    this.injectables = [];
    this.provisions = [];

    this.on('provides', provision => {
      if(provision.client === undefined) { throw Error('no client'); }

      console.log(' --- provides', provision.name);
      this.provisions.push(provision);

      Promise.all(this.injectables.map(inj => {
        console.log(provision.name, '->', inj.constructor.name)
        return inj.inject(provision.name, provision.client);
      }));
    });


    this.on('tickle', injectable => {
      console.log('ticklet injectable', injectable.constructor.name);
      injectable.engine = this;
      this.injectables.push(injectable);

      Promise.all(this.provisions.map(prov => {
        console.log(prov.name, '=>', injectable.constructor.name);
        injectable.inject(prov.name, prov.client);
      }));
    });
  }
}


module.exports = { Engine };
