const { Providable } = require('../lifecycle/providable.js');

const {
  Mcp23Gpio,
  ConfigUtil,
  Util,
  ConsoleUtil
} = require('@johntalton/mcp23');

class Mcp23Device extends Providable {
  static from(config) {
    //console.log('mcp from', config);
    return new Mcp23Device(config);
  }

  constructor(config) {
    super();
    this.config = ConfigUtil.normalizeDevice(config);
    this.bus = undefined;
    this.intA = undefined;
    this.intB = undefined;
    this.status = 'init';
  }

  inject(name, client) {
    console.log('     injected into mcp23', name);
    if(name === 'I\u00B2C') { this.i2c = client; }
    if(name === this.config.interruptA) { this.intA = client; }
    if(name === this.config.interruptB) { this.intB = client; }

    // console.log('checking this', this);
    if(this.status !== 'up' && this.i2c !== undefined && this.intA !== undefined) {
      //
      this.status = 'up';
      console.log('we have it all ... now go go go');
      return this._setupWithRetry();
    }

    return Promise.resolve();
  }

  // -----------------------

  // @private
  _setupWithRetry() {
    return this._setup()
      .then(device => {
        this.device = device;
        return this._configure();
      });
  }

  // @private
  _setup() {
    return this.i2c.init(...this.config.bus.id)
      .then(bus => Mcp23Gpio.from(bus, { names: this.config.names }));
  }

  // @private
  _configure() {
    return Promise.resolve()
      .then(() => this._configureReset())
      .then(() => this._configureSniff())
      .then(() => this._configureProfile())
      .then(() => this._configureState())
      .then(effectiveExports => this._configureProvides(effectiveExports))
      .then(() => this._configureABInterruptHandlers())
  }

  // @privagte
  _configureABInterruptHandlers() {
    // todo add additional enablement pin for hardware reset

// taking action on gpio state, must be an active chip
// as soon as this start we could start handling interrupt.
// so we must have everthing up and rolling

    return Promise.all([
      this.intA.read(),
      this.intB.read()
    ])
    .then(([a, b]) => {
      const nexts = [];
      // todo a/b should be compaired with the Rasbus.gpio.HIGH
      // todo int AB should be writing Rasbus.gpio.HIGH
      if(a === 1) { console.log('initial read int A HIGH'); nexts.push(this._interruptA(false, 1)); }
      if(b === 1) { console.log('initial read int B HIGH'); nexts.push(this._interruptB(false, 1)); }
      return Promise.all(nexts);
    })
    .then(() => {
      this.intA.watch((err, value) => this._interruptA(err, value));
      this.intB.watch((err, value) => this._interruptB(err, value));
    });
  }

  // @provate
  _interruptA(err, value) {
    console.log('Device Mcp23 INT A', err, value);
    if(err) {
      console.log('suppresdsed error', err);
      return Promise.resolve(); // todo what to do
    }

    if(value === 0) { // todo Converter.LOW
      console.log('suppressed LOW', value);
      return Promise.resolve();
    }

    // handle valid high trigger
    return this.device.interruptA();
  }

  // @private
  _interruptB(err, value) {
    console.log('Device Mcp23 INT B', err, value);
    return this.device.interruptB();
  }

  // @private
  _configureReset() {
    if(!this.config.resetOnStart) {
      console.log('skip software reset');
      return Promise.resolve();
    }

    console.log('attempting software reset');
    return this.device.softwareReset();
  }

  // @private
  _configureSniff() {
    if(!this.config.sniffMode) {
      console.log('skip sniff mode (you are trusting)')
      return Promise.resolve();
    }

    console.log('attempting sniff mode');
    return this.device.sniffMode()
      //.then(guess => { console.log('sniff mode guess', guess); return guess; });
      .then(guess => this._configureUpdateMode(guess));
  }

  // @private
  _configureUpdateMode(guess) {
  // guess can be undefined indicating we skipped any sniffing
    // the profiles mode can be false or a mode
    // false would indicate that the current mode should be used
    const curPM = this.config.profile.mode;
    const curCM = this.device.mode;

    if(guess === undefined) {
      if(curPM !== false && curPM === curCM) {
        console.log('no guess, matched profile and client (best effort)');
        return;
      }

      if(curPM === false) {
        console.log('no guess, profile agnostic, assume client (no net)');
        return;
      }

      console.log('no guess, assuming from profile mode (hope you are right)');
      // update working mode
      console.log(' update client cache', guess);
      this.device.mode = curPM;
      return;
    }

    if(guess === curCM) {
      if(curPM === false) {
        console.log('guess matches client, profile is moder agnostic');
        return;
      }

     if(curPM === guess) {
        console.log('guess matches client and profile');
        return;
      }
      else {
        console.log('guess matches client, profile will overrite if set');
        return;
      }
    }

    if(curPM === false) {
      console.log('updating client from guess, profile is mode agnostic');
    }
    else {
      console.log('updating clinet from guess, profile will override if set')
    }

    // update working mode
    console.log(' update client cache', guess);
    this.device.mode = guess;
    return;
  }

  // @private
  _configureProfile() {
    return this.device.profile()
      .then(profile => {
        console.log('initial device profile', ConsoleUtil.profileToString(profile));
        const [match, why] = this._configureValidateProfile(profile);

        if(!match && this.config.setProfileOnStart) { console.log('about to overrite profile -', why); }
        if(!match && !this.config.setProfileOnStart) { console.log('profile missmatch, no update (risky) -', why); }
        if(match && this.config.setProfileOnStart) { console.log('matching profile, redundent profile set'); }

        const force = true; // todo

        if(!this.config.setProfileOnStart) { return Promise.resolve(); }
        if(match && !force) { return Profile.resolve(); }
        return this.device.setProfile(this.config.profile)
          .then(() => this._configurePedanticValidateProfile())
      });
  }

  // @private
  _configureValidateProfile(activeProfile) {
    if(!this.config.validateProfileOnStart) {
      console.log('skipping profile validation');
      return [false, 'skipped'];
    }
    return Util.compairProfiles(this.config.profile, activeProfile);
  }

  // @private
  _configurePedanticValidateProfile() {
    const pedanticValidation = false;

    if(!pedanticValidation) {
      console.log('profile after set (no re-read, profile is config)', ConsoleUtil.profileToString(this.config.profile));
      return Promise.resolve();
    }

    return this.device.profile().then(profile => {
      const [match, why] = Util.compairProfiles(this.config.profile, profile);
      if(!match) { throw Error('pedantic validation missmatch: ' + why); }
      console.log('passed pedantic validation', ConsoleUtil.profileToString(profile));
    });
  }

  // @private
  _configureState() {
    return this.device.state()
      .then(state => {
        console.log('current state', ConsoleUtil.stateToString(state));
        const effectiveExports = this._configureProcessExports(state)
        return this._configureExports(state.gpios, effectiveExports);
      });
  }

  // @private
  _configureProcessExports(activeState) {
    if(this.config.validateExports === false) {
      console.log('skipping existing export validation (export config will washout existing)');
      return this.config.exports;
    }

    const effective = [];

    // our names should match as we inited via our names map.
    // thus we need to walk each and validate configuration
    // state includes all names, use it to iterate
    activeState.gpios.forEach(gpio => {
      // do we have an export for this
      const exp = Util.exportFor(gpio.pin, this.config.exports);
      if(exp === undefined) {
        // nothing exported
        if(!Util.isDefaultGpio(gpio)) {
          if(this.config.adoptExistingExports) {
            // add to effectiveExports
            console.log('chip has configured gpio that is not defined by exports (adopting on update)');
            effective.push(gpio); // todo missing name will cause error on provide
          }
          else {
            console.log('chip has configured gpio that is not defined by exports (no adopt, reseting on update)');
            console.log('old', gpio); // todod missing name will cause error on provide
          }
        }
      }
      else {
        // we have a defined export, if not configured, validate it matches
        if(Util.isDefaultGpio(gpio)) {
          console.log('chip has unconfigured gpio, exports defined new (semi-safe to add on update)');
          effective.push(exp);
        }
        else {
          const [match, why] = Util.matchGpios(gpio, exp);
          if(match) {
            console.log('happy day, gpio and export match');
            effective.push(exp);
          }
          else {
            if(true) {
              console.log(' !! gpio / export missmatch - pick export', exp.pin, why);
              effective.push(exp);
            }
            else {
              console.log('gpio / export missmatch - pick gpio', gpio.pin, why);
              effective.push(gpio); // todo missing name will cuase error on provide
            }
          }
        }
      }
    });

    //
    return effective;
  }

  // @private
  _configureExports(currentGpios, effectiveExports) {
    if(this.config.setExportsOnStart === false) {
      console.log('skiping export of gpio');
      return Promise.resolve(currentGpios.map(gpio => {
         const exp = Util.exportFor(gpio.pin, this.config.exports);
         // todo default check
         return exp;
      })
      .filter(exp => exp !== undefined));
    }

    console.log('configuring exports (this may be distruptive to attached io)');
    return this.device.exportAll(effectiveExports)
      .then(() => effectiveExports);
  }

  // @private
  _configureProvides(effectiveExports) {
    console.log('about to call provide on', effectiveExports);
    return Promise.all(effectiveExports.map(exp => {
      if(Util.isDefaultGpio(exp)) { return Promise.resolve(); }

      return this.device.exportGpioFromExisting(exp)
        .then(pin => this.provides(exp.name, pin));
    }));
  }
}

module.exports = { Mcp23Device };
