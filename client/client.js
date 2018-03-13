const BlindSignature = require('blind-signatures');

const SERVER_STATES = require('./server_states');
const CLIENT_STATES = require('./client_states');
const normalizeUrl = require('normalize-url');
const axios = require('axios');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CHECKIN_RATE = 10000;
const STATE_REFRESH_RATE = 2000;

// const tor = require('tor-request');
// tor.TorControlPort.password = 'somepassword';

class Client {
  constructor({
    serverAddress,
    serverConnect,
    disableTor,
    torFetch,
    mockFetch,
    newTorSession,

    callbackStateChange,
    callbackError,
    callbackRoundComplete,
    callbackBalance,

    willPayFees = true, // TODO: Add
    MAX_FEE = 20000,
    minDenomination = 100000, // TODO: Add

    aliceSeed,
    bobSeed,
    aliceIndex = 0,
    bobIndex = 0,
    changeIndex = 1,

    CHAIN = 'testnet',
    DISABLE_UTXO_FETCH = true,
    MAX_DELAY = 6000,
    FAKE_UTXOS,
    bitcoinUtils,
  }) {
    if (!aliceSeed) {
      throw new Error('Invalid alice seed');
    }
    if (!bobSeed) {
      bobSeed = aliceSeed;
    }
    if (!bitcoinUtils) {
      throw new Error('Missing bitcoinUtils parameter');
    }
    console.log(`Initialized new client`);
    this.bitcoinUtils = bitcoinUtils;
    this.CHAIN = CHAIN;
    this.DISABLE_UTXO_FETCH = !!DISABLE_UTXO_FETCH;
    this.FAKE_UTXOS = FAKE_UTXOS;
    this.MAX_DELAY = MAX_DELAY;
    this.MAX_FEE = MAX_FEE;
    this.callbackStateChange = callbackStateChange;
    this.callbackError = callbackError;
    this.callbackRoundComplete = callbackRoundComplete;
    this.callbackBalance = callbackBalance;
    this.serverAddress = serverAddress;
    this.aliceSeed = aliceSeed;
    this.disableTor = !!disableTor;
    this.torFetch = torFetch;
    this.mockFetch = mockFetch;
    this.newTorSession = newTorSession;
    this.serverConnect = !!serverConnect;
    this.roundState = CLIENT_STATES.unjoined;
    this.progress = 0;

    this.willPayFees = willPayFees;
    this.bobSeed = bobSeed;
    this.minDenomination = minDenomination;
    this.aliceIndex = aliceIndex;
    this.bobIndex = bobIndex;
    this.changeIndex = changeIndex;
    this.autoJoinRounds = 0;
    this.insufficientBalance = false;
    this.attemptedJoin = false;
    this.isJoined = false;
    this.updateKeyIndexes({});
  }
  setServer(serverAddress) {
    try {
      this.serverAddress = normalizeUrl(serverAddress);
    } catch (err) {
      this.serverAddress = serverAddress;
    }
    this.disconnect();
  }
  updateKeyIndexes({
    aliceIndex = this.aliceIndex,
    bobIndex = this.bobIndex,
    changeIndex,
  }) {
    const { aliceSeed, bobSeed } = this;
    this.aliceIndex = aliceIndex === '' ? 0 : aliceIndex;
    this.bobIndex = bobIndex === '' ? 0 : bobIndex;
    this.keys = this.bitcoinUtils.generateAddresses({
      aliceSeed,
      bobSeed,
      aliceIndex: this.aliceIndex,
      bobIndex: this.bobIndex,
      changeIndex: changeIndex === '' ? 0 : changeIndex,
    });
    this.changeIndex = this.keys.changeIndex;
    this.insufficientBalance = false;
    this.attemptedJoin = false;
  }
  async connect() {
    this.serverConnect = true;
    await this.refreshState();
  }
  async disconnect() {
    this.setAutoJoin(0);
    if (this.roundState !== CLIENT_STATES.unjoined) {
      await this.unjoin();
    }
    this.serverConnect = false;
    this.serverStatus = null;
    this.reset();
  }
  setState(state) {
    if (state === this.roundState) return; // Ignore
    this.roundState = state;
    this.progress = state / (Object.keys(CLIENT_STATES).length - 1);
    if (this.callbackStateChange) this.callbackStateChange(state);
  }
  getState() {
    const reverse = {};
    Object.keys(CLIENT_STATES).map(key => (reverse[CLIENT_STATES[key]] = key));
    return reverse[this.roundState];
  }
  reset() {
    this.parameters = null;
    this.serverError = null;
    this.roundError = null;
    this.isJoined = false;
    this.setState(CLIENT_STATES.unjoined);
  }
  getAddresses() {
    return this.keys;
  }
  getRoundInfo() {
    const {
      serverStatus,
      roundError,
      progress,
      autoJoinRounds,
      serverError,
      insufficientBalance,
      attemptedJoin,
      isJoined,
    } = this;
    const isConnected = !!serverStatus && !!this.serverConnect;
    const isConnecting = !this.serverStatus && !!this.serverConnect;
    const isDisconnected = !this.serverConnect;
    const isJoining = autoJoinRounds > 0;
    const isAutoJoining = autoJoinRounds > 1;
    return {
      isConnected,
      isConnecting,
      isDisconnected,
      serverError,
      roundError,
      progress,
      serverStatus,
      currentState: this.getState(),
      autoJoinRounds,
      isJoining,
      isAutoJoining,
      insufficientBalance,
      attemptedJoin,
      isJoined,
      // autoJoinRounds,
      // readyToMix,
      // readyToJoin,
    };
  }
  async setAutoJoin(value) {
    this.autoJoinRounds = value;
  }
  async join() {
    try {
      this.roundError = null;
      const res = await this.joinRound();
      this.insufficientBalance = false;
      this.attemptedJoin = true;
      this.checkin();
      if (this.callbackBalance) this.callbackBalance(res);
      return res;
    } catch (err) {
      console.log(err);
      this.setAutoJoin(0);
      this.setState(CLIENT_STATES.unjoined);
      if (err.message === 'Not enough Bitcoin in your Wallet') {
        this.insufficientBalance = true;
        this.attemptedJoin = true;
        if (this.callbackBalance && err.data) {
          this.callbackBalance(err.data);
        }
      }
      this.roundError = err;
      if (this.callbackError) this.callbackError(err);
    }
  }
  async unjoin() {
    try {
      this.roundError = null;
      await this.unjoinRound();
    } catch (err) {
      console.log(err);
      this.roundError = err;
      if (this.callbackError) this.callbackError(err);
    }
  }
  async blind() {
    try {
      this.roundError = null;
      await this.blindToAddress();
    } catch (err) {
      console.log(err);
      this.roundError = err;
      if (this.callbackError) this.callbackError(err);
    }
  }
  async output() {
    try {
      this.roundError = null;
      await this.sendToAddress();
    } catch (err) {
      console.log(err);
      this.setState(CLIENT_STATES.blind); // Retry
      this.roundError = err;
      if (this.callbackError) this.callbackError(err);
    }
  }
  async sign() {
    try {
      this.roundError = null;
      await this.getTx();
      await this.sendTx();
    } catch (err) {
      console.log(err);
      this.roundError = err;
      if (this.callbackError) this.callbackError(err);
    }
  }
  async checkBalance(address) {
    const uuid = this.parameters && this.parameters.uuid;
    const { utxos } = await this.fetchAPI(`/utxo`, {
      method: 'POST',
      body: {
        address,
        uuid,
      },
    });
    return utxos;
  }

  async refreshState() {
    clearTimeout(this.trefreshState);
    if (!this.serverConnect) return;
    try {
      const res = await this.fetchAPI(`/state`);
      res.lastUpdated = new Date();
      this.serverStatus = res;
      if (res && this.CHAIN !== res.chain) {
        this.disconnect();
        throw new Error(
          `Invalid chain: ${res.chain}. Looking for ${this.CHAIN}`
        );
      } else if (
        this.parameters &&
        this.parameters.preverify !== res.preverify
      ) {
        // Check for final round status
        const { round_id } = this.parameters;
        await this.verifyRound({ round_id });
        this.reset();
        this.autoJoinRounds--;
      } else if (
        this.roundState === CLIENT_STATES.joined &&
        res.state === SERVER_STATES.blinding
      ) {
        await this.blind();
      } else if (
        this.roundState === CLIENT_STATES.blind &&
        res.state === SERVER_STATES.outputs
      ) {
        this.setState(CLIENT_STATES.blinding);
        if (this.MAX_DELAY) {
          setTimeout(() => {
            this.output(); // Random delay for timing attack
          }, Math.random() * this.MAX_DELAY + STATE_REFRESH_RATE);
        } else {
          await this.output();
        }
      } else if (
        this.roundState === CLIENT_STATES.output &&
        res.state === SERVER_STATES.signing
      ) {
        await this.sign();
      } else if (
        this.autoJoinRounds > 0 &&
        this.roundState === CLIENT_STATES.unjoined &&
        res.state === SERVER_STATES.join
      ) {
        await this.join();
      }
      this.serverError = null;
      console.log('Updated server status');
    } catch (err) {
      console.log('Error refreshState', err);
      this.serverError = err;
      if (this.callbackError) this.callbackError(err);
    }
    this.trefreshState = setTimeout(() => {
      this.refreshState();
    }, STATE_REFRESH_RATE);
  }

  async checkin() {
    clearTimeout(this.trefreshCheckin);
    if (!this.serverConnect) return;
    if (this.roundState !== CLIENT_STATES.joined) return; // Only checkin when in join state
    try {
      const { fromAddress, uuid } = this.parameters;
      const { joined } = await this.fetchAPI('/checkin', {
        method: 'POST',
        body: {
          fromAddress,
          uuid,
        },
      });
      this.isJoined = !!joined;
      this.serverError = null;
      if (!joined && this.roundState !== CLIENT_STATES.unjoined) {
        this.setState(CLIENT_STATES.unjoined);
      }
      console.log('Checked in');
    } catch (err) {
      this.serverError = err;
      if (this.callbackError) this.callbackError(err);
    }
    this.trefreshCheckin = setTimeout(() => {
      this.checkin();
    }, CHECKIN_RATE);
  }
  async unjoinRound() {
    if (this.parameters && this.roundState === CLIENT_STATES.joined) {
      const { fromAddress, uuid } = this.parameters;
      await this.fetchAPI('/unjoin', {
        method: 'POST',
        body: {
          fromAddress,
          uuid,
        },
      });
      this.reset();
    } else {
      // Can not unjoin in this state
    }
  }
  async joinRound() {
    if (!this.serverStatus) throw new Error('Not connected');
    if (this.roundState !== CLIENT_STATES.unjoined) {
      throw new Error('Wrong state');
    }
    if (this.serverStatus.fees > this.MAX_FEE) {
      throw new Error(`Fees are greater than your max fee: ${this.MAX_FEE}`);
    }
    this.setState(CLIENT_STATES.joining);
    const { fromAddress, toAddress, changeAddress, fromPrivate } = this.keys;
    let myUtxos = this.FAKE_UTXOS || null;
    if (!myUtxos && !this.DISABLE_UTXO_FETCH) {
      try {
        myUtxos = this.bitcoinUtils.getUtxos(fromAddress);
      } catch (err) {
        // Ignore. Let the server fetch them
        console.log('Could not get utxos', err);
      }
    }

    const serverAddress = this.serverAddress;
    const { preverify, state } = this.serverStatus;
    if (!preverify) throw new Error('Missing preverify');
    if (state !== SERVER_STATES.join) {
      throw new Error(`Server is not in join state: ${state}`);
    }

    const {
      uuid,
      min_pool,
      max_pool,
      denomination,
      fees,
      E,
      N,
      utxos,
    } = await this.fetchAPI('/join', {
      method: 'POST',
      body: {
        fromAddress,
        changeAddress,
        utxos: myUtxos,
        verify: this.bitcoinUtils.signMessage(preverify, fromPrivate),
      },
    });
    if (fees > this.MAX_FEE) {
      this.unjoin();
      throw new Error(`Fees are greater than your max fee: ${this.MAX_FEE}`);
    }
    this.parameters = {
      preverify,
      uuid,
      toAddress,
      fromAddress,
      changeAddress,
      fromPrivate,
      min_pool,
      max_pool,
      denomination,
      fees,
      N,
      E,
      serverAddress,
      // myUtxos,
      utxos,
    };
    this.setState(CLIENT_STATES.joined);
    let balance;
    try {
      balance = this.bitcoinUtils.getUtxosBalance(utxos, fromAddress);
    } catch (err) {
      console.log('Balance error', err);
    }
    console.log(`1. ${fromAddress} Joined round`);
    return { balance, address: fromAddress };
  }

  async blindToAddress() {
    if (!this.serverStatus) throw new Error('Not connected');
    if (this.roundState !== CLIENT_STATES.joined) {
      throw new Error('Wrong state');
    }

    const { N, E, fromAddress, toAddress, uuid } = this.parameters;
    if (!N || !E || !toAddress) throw new Error('Invalid parameters');

    const { blinded, r } = BlindSignature.blind({
      message: toAddress,
      N,
      E,
    });
    const { signed, url } = await this.fetchAPI('/blinding', {
      method: 'POST',
      body: {
        fromAddress,
        uuid,
        toAddressBlinded: blinded.toString(),
      },
    });
    const unblinded = BlindSignature.unblind({ signed, N, r }).toString();
    const result = BlindSignature.verify({
      unblinded,
      N,
      E,
      message: toAddress,
    });
    if (!result) throw new Error('Signature did not verify');
    this.parameters.unblinded = unblinded;
    this.parameters.outputUrl = url;
    console.log(`2. ${fromAddress} Blinded output`);
    this.setState(CLIENT_STATES.blind);
  }

  async sendToAddress() {
    if (this.roundState !== CLIENT_STATES.blinding) {
      throw new Error('Wrong state');
    }
    const { unblinded, toAddress, outputUrl } = this.parameters;
    console.log(`3. ${toAddress} Sending toAddress`);
    await this.fetchAPI('/outputs', {
      baseUrl: outputUrl, // TODO: Enforce seperate URL?
      method: 'POST',
      body: {
        toAddress,
        unblinded,
      },
    });
    this.setState(CLIENT_STATES.output);
    console.log(`3. ${toAddress} Verified toAddress`);
  }

  async getTx() {
    if (this.roundState !== CLIENT_STATES.output) {
      throw new Error('Wrong state');
    }
    const {
      uuid,
      fromAddress,
      toAddress,
      changeAddress,
      fromPrivate,
      fees,
      denomination,
      min_pool,
      max_pool,
    } = this.parameters;
    const { alices, bobs, utxos } = await this.fetchAPI('/gettx', {
      method: 'POST',
      body: {
        uuid,
        fromAddress,
      },
    });
    console.log(`4. ${fromAddress} Got TX`);

    if (
      alices.length < min_pool ||
      alices.length > max_pool ||
      alices.length !== bobs.length
    ) {
      throw new Error('Invalid pool size');
    }
    // Make sure our addresses are in the pool
    this.bitcoinUtils.verifyTransaction({
      alices,
      bobs,
      fromAddress,
      changeAddress,
      toAddress,
    });
    const { tx, totalChange, totalFees } = this.bitcoinUtils.createTransaction({
      utxos,
      alices,
      bobs,
      fees,
      denomination,
      key: fromPrivate,
      fromAddress,
    });
    this.parameters.txSigned = tx;
    this.parameters.alices = alices.length;
    this.parameters.totalChange = totalChange;
    this.parameters.totalFees = totalFees;
    this.setState(CLIENT_STATES.signedtx);
    console.log(`5. ${fromAddress} Signed TX`);
  }

  async sendTx() {
    if (this.roundState !== CLIENT_STATES.signedtx) {
      throw new Error('Invalid state');
    }
    const { fromAddress, txSigned, uuid } = this.parameters;
    const { round_id } = await this.fetchAPI('/txsignature', {
      method: 'POST',
      body: {
        txSigned,
        fromAddress,
        uuid,
      },
    });
    this.parameters.round_id = round_id;
    this.setState(CLIENT_STATES.senttx);
    console.log(`6. ${fromAddress} DONE! Sent TX`);
  }
  filterFinalParameters(
    {
      toAddress,
      fromAddress,
      changeAddress,
      denomination,
      totalChange,
      totalFees,
      serverAddress,
    },
    { txid, serialized, bobs }
  ) {
    return {
      to: toAddress,
      from: fromAddress,
      change: changeAddress,
      out: denomination,
      left: totalChange,
      fees: totalFees,
      serialized,
      bobs,
      txid,
      server: serverAddress,
      date: new Date().getTime(),
    };
  }
  async verifyRound({ round_id }) {
    if (this.roundState === CLIENT_STATES.unjoined) return; // Ingore if not joined
    try {
      if (!round_id) {
        throw new Error(`Round failed at state: ${this.getState()}`);
      }
      const { tx } = await this.fetchAPI('/verify', {
        method: 'POST',
        body: {
          round_id,
        },
      });
      const finalTx = this.filterFinalParameters(this.parameters, tx);
      this.aliceIndex = this.changeIndex;
      this.bobIndex++;
      this.changeIndex++;
      this.updateKeyIndexes({ changeIndex: this.changeIndex });
      if (this.callbackRoundComplete) this.callbackRoundComplete(finalTx);
      console.log(
        `7. ${round_id} Round completed successfully! (txid: ${finalTx.txid})`
      );
    } catch (err) {
      console.log(`7. ${round_id} Round error: ${err.message}`);
      const finalTx = this.filterFinalParameters(this.parameters, {});
      finalTx.error = err.message;
      // TODO: Enforce bob index incrementing? Could cause issues with traditional wallets not displaying balances after 5 empty addresses in a row
      // if (this.roundState >= CLIENT_STATES.blind) {
      //   this.bobIndex++; // Increment Bob address since the server may know it
      //   this.updateKeyIndexes({ changeIndex: this.changeIndex });
      // }
      if (this.callbackRoundComplete) this.callbackRoundComplete(finalTx);
    }
  }

  // torFetchNode(url, params) {
  //   new Promise((resolve, reject) => {
  //     tor.request(url, params, (err, res, body) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         try {
  //           resolve(JSON.parse(body));
  //         } catch (err) {
  //           reject(err);
  //         }
  //       }
  //     });
  //   });
  // }
  async fetchAPI(url, params = {}, retriesLeft = MAX_RETRIES) {
    if (!this.serverConnect) throw new Error('Disconnected');
    if (!this.mockFetch && !this.serverAddress)
      throw new Error('Empty server address');
    const fullUrl = `${params.baseUrl || this.serverAddress}${url}`;
    const options = {
      method: params.method || 'GET',
      body: params.body ? JSON.stringify(params.body) : undefined,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
    let res;
    try {
      if (this.mockFetch) {
        res = await this.mockFetch(url, params.body);
      } else if (!this.disableTor && this.torFetch) {
        res = await this.torFetch(fullUrl, options);
      } else if (
        !this.disableTor &&
        typeof window === 'undefined' &&
        this.torFetchNode
      ) {
        res = await this.torFetchNode(fullUrl, options);
        // } else {
        //   res = await fetch(fullUrl, options);
        //   res = await res.json();
      } else {
        const response = await axios({
          url,
          method: options.method,
          baseURL: params.baseUrl || this.serverAddress,
          data: params.body,
        });
        res = response.data;
      }
    } catch (err) {
      console.log('Fetch error', err);
      if (retriesLeft > 0) {
        await this.wait(RETRY_DELAY);
        res = await this.fetchAPI(url, params, retriesLeft - 1);
      } else {
        throw new Error(err.message);
      }
    }
    if (res.error) {
      const error = new Error(res.error);
      error.data = res;
      throw error;
    }
    return res;
  }
  wait(delay) {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }
}

export default Client;
