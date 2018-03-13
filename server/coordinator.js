const BlindSignature = require('blind-signatures');
const SERVER_VERSION = require('../package.json').version;
const SERVER_STATES = require('../client/server_states');
const path = require('path');
let consoleLog = {
  info: (...msg) => console.log(...msg),
  warn: (...msg) => console.log(...msg),
  error: (...msg) => console.log(...msg),
  log: (...msg) => console.log(...msg),
};

const CHECKIN_TIMEOUT = 30 * 1000; // Assume user is out if they haven't checked in in 30 seconds
const CHECK_FOR_TIMEOUTS = 3 * 1000; // Every 3 seconds check if alice timed out
const ROUND_TIMEOUT = 60 * 1000; // If the round doesn't complete in 60 seconds reset it
const BLINDING_TIMEOUT = 30 * 1000;
const MAX_ROUND_HISTORY = 30;
const AUTO_START_DELAY = 30 * 1000;

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class Coordinator {
  constructor({
    bitcoinUtils,
    CHAIN = 'testnet',
    DISABLE_BROADCAST = false,
    DISABLE_UTXO_FETCH = false,
    DISABLE_BALANCE_CHECK = true,
    MIN_POOL = 2,
    MAX_POOL = 1000,
    OUTPUT_SAT = 100000,
    FEE_PER_INPUT = 1000,
    AUTO_START_ROUNDS = true,
    RSA_KEY_SIZE = 1024,
    OUTPUT_URL,
    LOG_TO_FILE = false,
  }) {
    if (LOG_TO_FILE) {
      consoleLog = require('simple-node-logger').createSimpleLogger({
        logFilePath: path.join(__dirname, '../logs/coordinator.log'),
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
      });
    }
    this.bitcoinUtils = bitcoinUtils;
    this.completedRounds = {};
    this.LOG_TO_FILE = LOG_TO_FILE;
    this.OUTPUT_URL = OUTPUT_URL;
    this.CHAIN = CHAIN;
    this.DISABLE_BROADCAST = DISABLE_BROADCAST;
    this.DISABLE_UTXO_FETCH = DISABLE_UTXO_FETCH;
    this.DISABLE_BALANCE_CHECK = DISABLE_BALANCE_CHECK;
    this.MIN_POOL = MIN_POOL;
    this.MAX_POOL = MAX_POOL;
    this.OUTPUT_SAT = OUTPUT_SAT;
    this.FEE_PER_INPUT = FEE_PER_INPUT;
    this.AUTO_START_ROUNDS = !!AUTO_START_ROUNDS;
    this.RSA_KEY_SIZE = RSA_KEY_SIZE;
    this.initRound();
  }
  getAlices() {
    return Object.keys(this.alices).map(key => this.alices[key]);
  }
  getBobs() {
    return Object.keys(this.bobs).map(key => this.bobs[key]);
  }
  exit() {
    clearTimeout(this.tcheck);
  }

  initRound() {
    clearTimeout(this.troundTimeout);
    clearTimeout(this.tblindingTimeout);
    clearTimeout(this.tautoStartRounds);
    this.tautoStartRounds = null;
    this.key = BlindSignature.keyGeneration({ b: this.RSA_KEY_SIZE });
    this.keyParameters = {
      N: this.key.keyPair.n.toString(),
      E: this.key.keyPair.e.toString(),
    };
    this.roundInfo = {
      chain: this.CHAIN,
      min_pool: this.MIN_POOL,
      max_pool: this.MAX_POOL,
      fees: this.FEE_PER_INPUT,
      denomination: this.OUTPUT_SAT,
      version: SERVER_VERSION,
      preverify: uuidv4(),
      autostart: this.AUTO_START_ROUNDS,
    };
    this.round_id = uuidv4();
    this.alices = {};
    this.bobs = {};
    this.blockRace = {};
    this.transaction = null;
    this.finalTransaction = null;
    this.roundState = SERVER_STATES.join;
    this.checkForInactive();
    consoleLog.info('-------------Started Round-------------');
  }

  state() {
    return {
      ...this.roundInfo,
      state: this.roundState,
      alices: this.getAlices().length,
      // bobs: this.getBobs().length,
    };
  }

  checkin({ fromAddress, uuid }) {
    let joined = false;
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (
      fromAddress &&
      uuid &&
      this.alices[fromAddress] &&
      this.alices[fromAddress].uuid === uuid
    ) {
      this.alices[fromAddress].checkinDate = new Date().getTime();
      joined = true;
    }

    return { joined };
  }

  checkForInactive() {
    clearTimeout(this.tcheck);
    this.tcheck = setTimeout(() => {
      if (this.roundState === SERVER_STATES.join) {
        // Check for user timeouts
        const alices = this.getAlices();
        alices.map(alice => {
          if (alice.checkinDate < new Date().getTime() - CHECKIN_TIMEOUT) {
            // Alice timed out
            consoleLog.info(`${alice.fromAddress} timed out`);
            delete this.alices[alice.fromAddress];
          }
        });
      }
      this.checkForInactive();
    }, CHECK_FOR_TIMEOUTS);
  }

  unjoin({ fromAddress, uuid }) {
    if (this.roundState !== SERVER_STATES.join) {
      return { ok: true };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (
      fromAddress &&
      uuid &&
      this.alices[fromAddress] &&
      this.alices[fromAddress].uuid === uuid
    ) {
      delete this.alices[fromAddress];
      consoleLog.info(`Unjoined Alice: ${fromAddress}`);
    } else {
      // return { error: 'Invalid alice' };
    }
    return { ok: true };
  }

  async join({ utxos, fromAddress, changeAddress, verify }) {
    if (
      this.bitcoinUtils.isInvalid(fromAddress) ||
      this.bitcoinUtils.isInvalid(changeAddress)
    ) {
      return { error: 'Invalid address' };
    }
    if (
      !this.bitcoinUtils.verifyMessage(
        this.roundInfo.preverify,
        fromAddress,
        verify
      )
    ) {
      return { error: 'Invalid key validation' };
    }
    if (this.blockRace[fromAddress]) {
      return { error: 'Too many requests' };
    }
    if (this.alices[fromAddress]) {
      return this.alices[fromAddress].joinResponse;
    }

    if (!this.DISABLE_UTXO_FETCH) {
      utxos = []; // Only accept server validated utxos
      this.blockRace[fromAddress] = true; // For race condition
      try {
        utxos = await this.bitcoinUtils.getUtxos(fromAddress);
        delete this.blockRace[fromAddress]; // For race condition
      } catch (err) {
        delete this.blockRace[fromAddress]; // For race condition
        consoleLog.error(`Could not get utxos for ${fromAddress}`, err);
        return { error: 'Could not get utxos' };
      }
    }

    // consoleLog.info('UTXOS', utxos);
    let balance;
    try {
      balance = this.bitcoinUtils.getUtxosBalance(utxos, fromAddress);
      if (
        isNaN(balance) ||
        balance <
          this.roundInfo.denomination + utxos.length * this.roundInfo.fees
      ) {
        throw new Error('Balance too low');
      }
    } catch (err) {
      // consoleLog.info('Not enough value', err.message);
      return {
        error: 'Not enough Bitcoin in your Wallet',
        address: fromAddress,
        balance,
      };
    }
    if (this.roundState !== SERVER_STATES.join) return { error: 'Wrong state' };
    if (this.getAlices().length >= this.roundInfo.max_pool) {
      return { error: 'Max participants' };
    }

    const uuid = uuidv4(); // Assign user a uuid
    const joinResponse = {
      ...this.roundInfo,
      uuid,
      N: this.keyParameters.N,
      E: this.keyParameters.E,
      utxos,
    };
    this.alices[fromAddress] = {
      fromAddress,
      changeAddress,
      utxos,
      uuid,
      joinDate: new Date().getTime(),
      checkinDate: new Date().getTime(),
      joinResponse,
    };

    const numAlices = this.getAlices().length;
    consoleLog.info(
      `1: #${numAlices} Participant joined ${fromAddress} with ${balance} SAT and ${
        utxos.length
      } inputs`
    );
    if (
      !this.tautoStartRounds &&
      numAlices >= this.MIN_POOL &&
      this.AUTO_START_ROUNDS
    ) {
      consoleLog.info(
        `Met Minimum Alices. Auto Starting Round in ${AUTO_START_DELAY /
          1000} seconds...`
      );
      clearTimeout(this.tautoStartRounds);
      this.tautoStartRounds = setTimeout(() => {
        clearTimeout(this.tautoStartRounds);
        this.tautoStartRounds = null;
        if (
          this.getAlices().length >= this.MIN_POOL &&
          this.roundState === SERVER_STATES.join
        ) {
          this.roundState = SERVER_STATES.blinding;
          clearTimeout(this.tblindingTimeout);
          this.tblindingTimeout = setTimeout(
            () => this.blindingTimeout(),
            BLINDING_TIMEOUT
          );
        } else {
          consoleLog.info('Not enough alices to start round');
        }
      }, AUTO_START_DELAY);
    }
    return joinResponse;
  }

  blinding({ fromAddress, uuid, toAddressBlinded }) {
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'You have not joined' };
    }
    if (
      !this.AUTO_START_ROUNDS &&
      this.roundState === SERVER_STATES.join &&
      this.getAlices().length >= this.roundInfo.min_pool
    ) {
      this.roundState = SERVER_STATES.blinding;
      clearTimeout(this.tblindingTimeout);
      this.tblindingTimeout = setTimeout(
        () => this.blindingTimeout(),
        BLINDING_TIMEOUT
      );
    }
    if (this.roundState !== SERVER_STATES.blinding) {
      return { error: 'Wrong state' };
    }
    if (this.alices[fromAddress].signed) {
      return { error: 'You have already blinded' };
    }
    const signed = BlindSignature.sign({
      blinded: toAddressBlinded,
      key: this.key,
    }).toString();
    this.alices[fromAddress].signed = true;
    if (this.getAlices().filter(alice => !alice.signed).length === 0) {
      // All alices signed. Next stage outputs
      clearTimeout(this.tblindingTimeout);
      this.roundState = SERVER_STATES.outputs;
      this.troundTimeout = setTimeout(() => this.roundTimeout(), ROUND_TIMEOUT);
    }
    return { signed, url: this.OUTPUT_URL };
  }

  outputs({ unblinded, toAddress }) {
    if (this.roundState !== SERVER_STATES.outputs) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(toAddress)) {
      return { error: 'Invalid address' };
    }
    if (this.bobs[toAddress]) {
      return { error: 'Already registered output address' };
    }
    if (this.getBobs().length >= this.getAlices().length) {
      return { error: 'Something went wrong' };
    }

    const result = BlindSignature.verify2({
      unblinded,
      message: toAddress,
      key: this.key,
    });
    if (!result) {
      consoleLog.warn(`2: Invalid signature ${toAddress}`);
      return { error: 'Invalid signature' };
    }

    this.bobs[toAddress] = {
      toAddress,
      // unblinded,
    };
    consoleLog.info(`2: Registered output address ${toAddress}`);

    const alices = this.getAlices();
    const bobs = this.getBobs();
    if (!this.transaction && alices.length === bobs.length) {
      const utxos = alices.reduce(
        (previous, alice) => previous.concat(alice.utxos),
        []
      );
      const fees = this.roundInfo.fees;
      const denomination = this.roundInfo.denomination;
      const { tx } = this.bitcoinUtils.createTransaction({
        utxos,
        alices,
        bobs,
        fees,
        denomination,
      });
      this.finalTransaction = tx;
      this.transaction = {
        alices: alices.map(alice => ({
          fromAddress: alice.fromAddress,
          changeAddress: alice.changeAddress,
        })),
        bobs: bobs.map(bob => ({
          toAddress: bob.toAddress,
        })),
        utxos,
      };
      this.roundState = SERVER_STATES.signing;
    }
    return { ok: true };
  }

  gettx({ fromAddress, uuid }) {
    if (this.roundState !== SERVER_STATES.signing) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'Not joined' };
    }
    if (this.alices[fromAddress].txReceived) {
      return { error: 'Already received tx' };
    }
    const transaction = this.transaction;
    if (transaction) {
      consoleLog.info(`3: Sent unsigned transaction to ${fromAddress}`);
      this.alices[fromAddress].txReceived = true;
      return transaction;
    } else {
      return { error: 'No TX' }; // Should not happen
    }
  }

  async txsignature({ fromAddress, uuid, txSigned }) {
    if (this.roundState !== SERVER_STATES.signing) {
      return { error: 'Wrong state' };
    }
    if (this.bitcoinUtils.isInvalid(fromAddress)) {
      return { error: 'Invalid address' };
    }
    if (!this.alices[fromAddress] || this.alices[fromAddress].uuid !== uuid) {
      return { error: 'Not joined' };
    }
    if (this.alices[fromAddress].txSigned) {
      return { error: 'Already signed' };
    }
    if (txSigned.inputs.length !== this.finalTransaction.inputs.length) {
      return { error: 'Inputs dont match' };
    }
    if (txSigned.outputs.length !== this.finalTransaction.outputs.length) {
      return { error: 'Outputs dont match' };
    }
    if (!txSigned) {
      return { error: 'No signed inputs' };
    }
    this.alices[fromAddress].txSigned = txSigned;
    consoleLog.info(`4: Received signed transaction for ${fromAddress}`);

    const round_id = this.round_id;
    const alices = this.getAlices();
    const bobs = this.getBobs();
    const numSigned = alices.reduce(
      (previous, alice) => (alice.txSigned ? previous + 1 : previous),
      0
    );
    if (
      numSigned === alices.length &&
      alices.length >= this.roundInfo.min_pool &&
      alices.length === bobs.length
    ) {
      setImmediate(async () => {
        try {
          const signedTxs = alices.map(alice => alice.txSigned);
          const { serialized, txid } = this.bitcoinUtils.combineTxs({
            tx: this.finalTransaction,
            signedTxs,
          });
          consoleLog.info(`Broadcasting transaction... ${serialized}`);
          if (!this.DISABLE_BROADCAST) {
            const txid = await this.bitcoinUtils.broadcastTx(serialized);
            consoleLog.info(`Broadcasted transaction! ${txid}`);
          }
          this.completedRounds[round_id] = {
            success: true,
            round_id,
            date: new Date().getTime(),
            response: {
              serialized,
              txid,
              bobs: bobs.length,
            },
          };
        } catch (err) {
          consoleLog.error('Error combining TX', err);
          // TODO: Blame game
          this.completedRounds[round_id] = {
            success: false,
            error: `Error creating final tx: ${err.message}`,
            round_id,
            date: new Date().getTime(),
          };
        }

        const completedRounds = Object.keys(this.completedRounds).map(
          key => this.completedRounds[key]
        );
        if (completedRounds.length > MAX_ROUND_HISTORY) {
          // Prune old completedRounds
          let oldest = { key: '', date: new Date().getTime() };
          completedRounds.map(round => {
            if (round.date < oldest.date) {
              oldest = {
                key: round.round_id,
                date: round.date,
              };
            }
          });
          if (oldest.key) {
            delete this.completedRounds[oldest.key];
            consoleLog.info(`Pruned old round history: ${oldest.key}`);
          }
        }
        this.initRound();
      });
    }
    return { round_id };
  }

  verify({ round_id }) {
    if (!round_id || !this.completedRounds[round_id]) {
      return { error: 'Invalid Round ID' };
    } else {
      if (this.completedRounds[round_id].success) {
        return { tx: this.completedRounds[round_id].response };
      } else {
        return { error: this.completedRounds[round_id].error };
      }
    }
  }

  async publicUtxo({ address, uuid }) {
    if (!this.DISABLE_BALANCE_CHECK) {
      // Allow user to only check balance once per round
      if (address.length <= 0 || address.length > 2) {
        return { error: 'Too many addresses' };
      }
      if (
        address.filter(addr => this.bitcoinUtils.isInvalid(addr)).length !== 0
      ) {
        return { error: 'Invalid address' };
      }
      let verified = false;
      let joinedRound = false;
      address.map(addr => {
        if (this.alices[addr] && this.alices[addr].uuid === uuid) {
          joinedRound = true;
          if (!this.alices[addr].checkedBalances) {
            verified = true;
            this.alices[addr].checkedBalances = true;
          }
        }
      });
      if (verified) {
        const utxos = await this.bitcoinUtils.getUtxos(address);
        return { utxos };
      }
      if (joinedRound && !verified) {
        return { error: 'Already checked balance' };
      } else {
        return { error: 'Must join round' };
      }
    } else {
      return { error: 'Disabled' };
    }
  }

  roundTimeout() {
    // TODO: Blame game
    consoleLog.warn('Round timed out');
    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'Round timed out',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }

  blindingTimeout() {
    consoleLog.warn('Blinding state timed out');
    // TODO: Just remove alices and keep going if over min?
    const round_id = this.round_id;
    this.completedRounds[round_id] = {
      success: false,
      error: 'Blinding state timed out',
      round_id,
      date: new Date().getTime(),
    };
    this.initRound();
  }

  async mockFetch(url, body) {
    body = body ? JSON.parse(JSON.stringify(body)) : undefined;
    // console.log(url, body);
    console.log(url);
    let res;
    if (url === '/state') {
      res = this.state();
    } else if (url === '/checkin') {
      res = this.checkin(body);
    } else if (url === '/join') {
      res = await this.join(body);
    } else if (url === '/unjoin') {
      res = this.unjoin(body);
    } else if (url === '/blinding') {
      res = this.blinding(body);
    } else if (url === '/outputs') {
      res = this.outputs(body);
    } else if (url === '/gettx') {
      res = this.gettx(body);
    } else if (url === '/txsignature') {
      res = await this.txsignature(body);
    } else if (url === '/verify') {
      res = await this.verify(body);
    } else if (url === '/utxo') {
      res = await this.publicUtxo(body);
    }
    res = JSON.parse(JSON.stringify(res));
    return res;
  }
  wait(delay) {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }
}

module.exports = Coordinator;
