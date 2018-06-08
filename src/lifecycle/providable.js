const { Engine } = require('./engine.js');

class Providable {
  static from() {
    throw Error('providable from');
  }

  constructor() {
    this.engine = null;
  }

  provides(name, client) {
    const provision = { state: 'birth', name: name, client: client };
    this.engine.emit('provides', provision);
  }

  inject(name, client) {
    throw Error('base inject');
  }

  add(injectable) {
    // tickle
    //console.log('emit tickle');
    this.engine.emit('tickle', injectable)
  }
}

module.exports = { Providable };
