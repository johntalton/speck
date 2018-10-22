const { ConfigUtil } = require('@johntalton/and-other-delights');

const { Providable } = require('../lifecycle/providable.js');
const { Tcs34725 } = require('@johntalton/tcs34725');

const DEFAULT_RETRY_MS = 10 * 1000;
const DEFAULT_POLL_MS = 30 * 1000;
const DEFAULT_FLASH_MS = 1000;

// todo this goes in the lib
class Tcs34725Util {
  static normalizeConfig(config) {
    return {
      ...config,
      //bus // todo refererence to bus injectable

      retryIntervalMs: ConfigUtil.readTimeout(config.retryIntervalMs, config.retryIntervalS, DEFAULT_RETRY_MS),
      poll: Tcs34725Util.normalizePoll(config.poll),
      step: Tcs34725Util.normalizeStep(config.step),

      clearInterruptOnStart: ConfigUtil.readBoolean(config.clearInterruptOnStart),
      profile: Tcs34725Util.normalizeProfile(config.profile),
    };
  }

  static normalizePoll(poll) {
    return {
      pollIntervalMs: ConfigUtil.readTimeout(poll.pollIntervalMs, poll.pollIntervalS, DEFAULT_POLL_MS),
      flashMs: ConfigUtil.readTimeout(poll.flashMs, poll.flashS, DEFAULT_FLASH_MS),
      status: ConfigUtil.readBoolean(poll.status, true),
      profile: ConfigUtil.readBoolean(poll.profile, true),
      skipData: ConfigUtil.readBoolean(poll.skipData)
      //cycleMultiplyer: validateMultiplyer)
    };
  }

  static normalizeStep(step) {
    return step; // todo
  }

  static normalizeProfile(profile) {
    return profile; // todo
  }
}

function delay(delayMs) {
  console.log('...create delay timer for', delayMs);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.log('...delay timer resolved');
      resolve(timer);
    }, delayMs);
  });
}

// todo class goes up into tcs
class LedUtil {
  static flash(led) {
    return LedUtil.onForDelay(led, 1000).then(() => LedUtil.ledOff(led));
  }

  static onForDelay(led, delayMs) {
    console.log('onForDelay');
    return led.write(1) // todo HIGH
      .then(() => delay(delayMs));
  }

  static ledOff(led) {
    return led.write(0); // todo LOW
  }
}


class TcsDevice extends Providable {
  static from(config) {
    return new TcsDevice(config);
  }

  constructor(config) {
    super();
    this.config = Tcs34725Util.normalizeConfig(config);
    this.i2c = undefined;
    this.led = undefined;
    this.interrupt = undefined;
    this.mqtt = undefined;
  }

  inject(name, client) {
    // i2c flash interrupt / MQTT
    console.log('TCS got', name);

    if(name === 'MQTT \uD83D\uDCE3') { return this.startStore(client); }
    else if(name === this.config.bus.driver) { this.i2c = client; }
    else if(name === this.config.led.name) { this.led = client; }
    else if(name === this.config.interrupt.name) { console.log('we got it'); this.interrupt = client; }
    //else { return Promise.resolve(); }

    console.log(this.status, this.i2c !== undefined, this.led !== undefined, this.interrupt !== undefined)
    if(this.status === 'up') { return Promise.resolve(); }
    if(this.i2c !== undefined && this.led !== undefined && this.interrupt !== undefined) {
      return this._setupWithRetry();
    }

    return Promise.resolve();
  }

  // -------------------------------

  startStore(client) {
    this.mqtt = client;

    if(this.status !== 'up') {
      console.log('TODO !!!!! we need our state machine', this.status);
      return Promise.resolve();
    }

    return Promise.all([this._startPoller(), this._startStepper()]);
  }

  _startPoller() {
    console.log('Starting the Poller up.');
    const pollIntervalMs = ConfigUtil.readTimeout(
      this.config.pollIntervalMs,
      this.config.pollIntervalS,
      DEFAULT_POLL_MS);

    console.log('setting up poll interval for ms', pollIntervalMs);
    this.poller = setInterval(() => this._poll(), pollIntervalMs);
  }

  _startStepper() {
    console.log('Start Stepper');
    return this.device.clearInterrupt()
      .then(() => this.interrupt.read())
      .then(value => {
        console.log('initial value of interrupt', value);
        this.interrupt.watch((err, value) => this._interruptWatch(err, value));
      });
  }

  // -------------------------------

  async _poll() {
    console.log('TCS Poll ...');

    // top level of poll function is syncrounous, and catches all errors

    // first, get any info before we read data, if configured
    await this._pollDeviceInfo()
      .then(dinfo => {
        // check results to see if all ok, if we bothered running anything
        if(dinfo.valid !== undefined && !dinfo.valid) {
          console.log('data integration not completed / not ready', config.name, dinfo);
          return Promise.resolve();
        }

        return this._pollPerformBeforeAll(dinfo)
          .then(() => dinfo); // pass along
      })
      .then(dinfo => {
        const swInterruptEnabled = true;

        // lastly if we skip data polls, then we are done, unless
        // software interrupts are on and there was a threshold violation
        // in which case a read is needed to capture state.
        const skipData = this.config.poll.skipData &&
          ((!swInterruptEnabled) || (swInterruptEnabled && !dinfo.thresholdViolation));

        if(skipData) { console.log('skip'); return Promise.resolve(); }

        // do that glorious data read
        return LedUtil.onForDelay(this.led, this.config.poll.flashMs)
          .then(() => this.device.data())
          .then(data => this._pollPerformAfterAll(dinfo, data)

            .then(() => { console.log('\n\t', dinfo, data); }))

          .finally(() => LedUtil.ledOff(this.led));
      })
      .catch(e => { console.log('poll error', this.config.name, e); });
  }

  _pollDeviceInfo() {
    // if nothing enbabled, just return
    if(this.config.poll.status === false && this.config.poll.profile === false) {
      console.log('skipping device info on poll');
      return Promise.resolve({});
    }

    // profile true overrides all (none case handled above)
    const full = this.config.poll.profile;
    if(full) {
      // full profile fetch
      return this.device.profile();
    }

    // not full is just status
    return this.device.status()
      .then(s => {
        return {
          valid: s.avalid,
          thresholdViolation: s.aint
        };
      });
  }

  _pollPerformBeforeMultiplyerRotate() {
    return Promise.resolve();
  }

  _pollPerformSoftwareAfterInterrupt(result, data) {
    if(result.thresholdViolation !== undefined) {
      // console.log('polled interrupt value', config.name, result.thresholdViolation);
      if(result.thresholdViolation === true) {
        //
        if(result.threshold === undefined) {
          return Promise.reject(Error('software interrupt skipped, no thresholdr'));
        }
        if(data === undefined) {
          return Promise.reject(Error('software interrupt skipped, no data'));
        }

        // handle from software interrupt
        console.log('software-interrupt handle threshold');
        return this.handleThreshold(result.threshold, data);
      }
    }
    return Promise.resolve(result);
  }

  _pollPerformBeforeAll(result) {
    return Promise.all([
      this._pollPerformBeforeMultiplyerRotate()
    ])
    .catch(e => { console.log('Error in Before action', e); });
  }

  _pollPerformAfterAll(result, data) {
    return Promise.all([
      this._pollPerformAfterSoftwareInterrupt(result, data)
    ])
    .catch(e => { console.log('Error in After action', e); });
  }

  // -------------------------------

  async _interruptWatch(err, value) {
    if(err) {
      console.log('error on interrupt callback', err);
      // todo teardown the client or reset or something?
      return;
    }

    console.log('Tcs device recived interrupt watch', value);
    if(value === 0) { // todo test LOW
      console.log('tcs watch handler suppressing LOW value');
      return;
    }

    // now go find out some information
    await Promise.all([
      this.device.threshold(),
      this.device.data()
    ])
      .then(([threshold, data]) => this.handleThreshold(threshold, data))
      .catch(e => {
        console.log('error in watch interrupt', e);
      });
  }


  // -------------------------------

  static _threshldDirection(threshold, value) {
    if(value > threshold.high) { return +1; }
    if(value < threshold.low) { return -1; }
    if(value === 0) { return 0; }
    throw Error('you shur about what ya doing?');
  }

  static _calcNewThreshold() {}

  static _calcNewThreshldHalfSteps() {}

  static _calcNewThresholdJump() {}


  handleThreshold(threshold, data) {
    let direction = 0;
    if(data.raw.c > threshold.high) {
      direction = +1;
    } else if(data.raw.c < threshold.low) {
      direction = -1;
    } else { direction = 0; }

    // console.log('reconfigure thresholds', config.name, data.raw.c, threshold, direction);

    let first = Promise.resolve();
    let newt = threshold;
    if(direction !== 0) {
      // this is the working range, not the configrued range
      // this allows the system to continue working as expected
      // even when the profile is being configured externaly.
      const range = threshold.high - threshold.low;

      if(this.config.step.jump) {
        const step = Math.trunc(range / 2);
        // todo, this should actaully follow the step sizes
        // that the existing auto step bellow uses.  this current
        // impl is more of a 'center' around using existing range
        // which is a bit odd.  But the goal is to not have to walk
        // the entire threshold steps then this is a solution
        newt = { low: data.raw.c - step, high: data.raw.c + step, touched: true };
      } else {
        // standard mode is to walk the theshold steps
        // in the direction of our target. Can be usefull
        // for clients that expect all ranges traversed
        // (some client that have longer running times
        // - like day cycles - may not have been programed
        // to expect "jumps" in the ranges and thus this
        // compensates for that)
        const step = direction * Math.trunc(range / 2);
        const low = threshold.low + step;
        const high = threshold.high + step;
        newt = { low: low, high: high, touched: true };
      }

      // should be handled by above algos in smarter way, good safety
      if(newt.low < 0) { newt.low = 0; }
      if(newt.high < 0) { newt.low = 0; }
      if(newt.high > 0xFFFF) { newt.low = 0xFFFF; } // todo max thresh value

      // make fisrt our set call
      first = this.device.setThreshold(newt.low, newt.high);
    } else {
      console.log('direction Zero, odd as this is interrupt driven, quick mover?');
    }

    // after that, we just emit the change and clear
    return first.then(() => {

      console.log(' -------> step', newt, direction, data.raw.c);

      return this.device.clearInterrupt();
    });
  }


  // -------------------------------

  // @private
  _setupWithRetry() {
    console.log('## Tcs setup With Retry');
    return this._setup()
      .then(() => this._configure())
      .then(() => this.status = 'up')
      .catch(err => {
        // strat retry unless hard fail
        console.log('setup failure', err);
        this.retrytier = setInterval(() => this._retry(), this.config.retryIntervalMs);
      });
  }

  async _retry() {
    //
    await this._setup()
      .then(() => this._configure())
      .then(() => this.status = 'up')
      .catch(err => {
        console.log('retry setup faulure', err);
      });
  }

  // @private
  _setup() {
    return this.i2c.init(...this.config.bus.id)
      .then(bus => Tcs34725.init(bus))
      .then(device => this.device = device);
  }


  // @private
  _configure() {
    return Promise.resolve()
      .then(() => this._configureValidateId())
      .then(() => this._configureProfile())
      .then(() => this._configureClearInterrupt())
      .then(() => this._configureGpio())
  }

  // @private
  _configureGpio() {
    // no need to start watch or do anything with the led yet?

    //
    console.log('\t\tTEST Flash LED');
    return LedUtil.flash(this.led, 1000);
    //

    // todo real return promise
  }

  // @private
  _configureValidateId() {
    return this.device.id()
      .then(id => { if(id !== Tcs34725.CHIP_ID) { throw Error('invalid chip id: ' + id); } })
      .then(() => console.log('tcs device id ok'));
  }

  // @private
  _configureProfile() {
    const setProfileOnStart = true; // todo externalize
    if(!setProfileOnStart) { return Promise.resolve(); }

    console.log('setting profile', this.config.profile);
    return this.device.setProfile(this.config.profile);
  }

  // @private
  _configureClearInterrupt() {
    if(!this.config.clearIntOnStart) { return Promise.resolve(); }

    console.log('clearing interrupts on start');
    return this.device.clearInterrupt();
  }
}

module.exports = { TcsDevice };
