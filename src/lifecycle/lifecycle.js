const { Engine } = require('./engine.js');
const { Providable } = require('./providable.js');

class Lifecycle extends Providable {
  static birth() { return new Lifecycle(); }

  constructor() {
    super();
    this.engine = new Engine();
  }

  death() {
    this.provides('life', this.engine);
  }

  add(inj) {
    super.add(inj);
    return this;
  }
}

module.exports = { Lifecycle };
