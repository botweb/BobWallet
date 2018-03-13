const Insight = require('bitcore-explorers').Insight;
const bitcoinMessage = require('bitcoinjs-message');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

class Bitcoin {
  constructor({
    CHAIN = 'testnet',
    USE_BCOIN = false,
    BCOIN_URI,
    BCOIN_APIKEY,
    BROADCAST_BCOIN = false,
    BROADCAST_BITCORE = true,
    bcoin,
    // tor,
  }) {
    // this.tor = tor;
    this.bcoin = bcoin;
    this.bcoin.set(CHAIN);
    this.CHAIN = CHAIN;
    this.BCOIN_URI = BCOIN_URI;
    this.BCOIN_APIKEY = BCOIN_APIKEY;
    this.USE_BCOIN = USE_BCOIN;
    this.BROADCAST_BCOIN = BROADCAST_BCOIN;
    this.BROADCAST_BITCORE = BROADCAST_BITCORE;

    if (USE_BCOIN) {
      // This opens a websocket connection which errors out some times
      // this.bcoinClient = new this.bcoin.http.Client({
      //   network: CHAIN,
      //   uri: BCOIN_URI,
      //   apiKey: BCOIN_APIKEY,
      // });
      // this.bcoinClient.open();

      this.bcoinRpc = new this.bcoin.http.RPCClient({
        network: CHAIN,
        uri: `http://${BCOIN_URI}`,
        apiKey: BCOIN_APIKEY,
      });
    }

    if (CHAIN === 'mainnet') {
      this.NETWORK = bitcoin.networks.bitcoin;
    } else {
      this.NETWORK = bitcoin.networks.testnet;
    }
    this.insight = new Insight(CHAIN);
  }

  newMnemonic(seed) {
    const mn = new this.bcoin.hd.Mnemonic({ phrase: seed });
    return mn.toString();
  }
  isMnemonicValid(seed) {
    if (!seed) return false;
    try {
      this.newMnemonic(seed);
      return true;
    } catch (err) {
      return false;
    }
  }
  isXPubValid(pubKey) {
    if (!pubKey) return false;
    try {
      const key = new this.bcoin.hd.fromBase58(pubKey);
      return !!key;
    } catch (err) {
      return false;
    }
  }
  isInvalid(address) {
    try {
      address = address.toString();
      const addr = new this.bcoin.primitives.Address.fromBase58(address);
      if (address !== addr.toBase58()) {
        throw new Error('Invalid');
      }
      return false;
    } catch (err) {
      return true;
    }
  }

  generateAddresses({
    aliceSeed,
    bobSeed,
    bobIndex = 0,
    aliceIndex = 0,
    changeIndex,
  }) {
    bobIndex = parseInt(bobIndex, 10);
    aliceIndex = parseInt(aliceIndex, 10);
    changeIndex =
      changeIndex === undefined ? aliceIndex + 1 : parseInt(changeIndex, 10);
    if (
      typeof bobIndex !== 'number' ||
      typeof aliceIndex !== 'number' ||
      typeof changeIndex !== 'number' ||
      isNaN(bobIndex) ||
      isNaN(aliceIndex) ||
      isNaN(changeIndex) ||
      bobIndex < 0 ||
      aliceIndex < 0 ||
      changeIndex < 0
    ) {
      throw new Error('Invalid indexes');
    }
    if (!aliceSeed || !bobSeed) {
      throw new Error('Invalid seeds');
    }
    const alice = new this.bcoin.hd.Mnemonic({ phrase: aliceSeed });
    const masterAlice = this.bcoin.hd.from(alice);

    let coinChain = 1; // Testnet default
    if (this.CHAIN === 'mainnet') {
      coinChain = 0;
    } else if (this.CHAIN === 'bitcoincash') {
      coinChain = 145;
    } else if (this.CHAIN === 'testnet') {
      coinChain = 1;
    }

    let toAddress;
    let toDerive;
    let toPrivateWIF;
    if (this.isMnemonicValid(bobSeed)) {
      const bob = new this.bcoin.hd.Mnemonic({ phrase: bobSeed });
      const masterBob = this.bcoin.hd.from(bob);
      toDerive = `m/44'/${coinChain}'/0'/${
        aliceSeed === bobSeed ? 1 : 0
      }/${bobIndex}`;
      const toKey = masterBob.derivePath(toDerive);
      const toKeyring = new this.bcoin.keyring(toKey.privateKey);
      toAddress = toKeyring.getAddress('base58');
      toPrivateWIF = toKeyring.getPrivateKey('base58');
    } else if (this.isXPubValid(bobSeed)) {
      const bob = new this.bcoin.hd.fromBase58(bobSeed);
      toDerive = `m/0/${bobIndex}`;
      const toKey = bob.derivePath(toDerive);
      const toKeyring = new this.bcoin.primitives.KeyRing.fromKey(
        toKey.publicKey
      );
      toAddress = toKeyring.getAddress('base58');
    } else if (!this.isInvalid(bobSeed)) {
      toAddress = bobSeed;
    } else {
      throw new Error('Invalid bob seed');
    }

    const fromDerive = `m/44'/${coinChain}'/0'/0/${aliceIndex}`;
    const changeDerive = `m/44'/${coinChain}'/0'/0/${changeIndex}`;
    const fromKey = masterAlice.derivePath(fromDerive); // TODO: Change depending on network
    const changeKey = masterAlice.derivePath(changeDerive); // TODO: Change depending on network
    const fromKeyring = new this.bcoin.keyring(fromKey.privateKey);
    const changeKeyring = new this.bcoin.keyring(changeKey.privateKey);
    const fromPrivateWIF = fromKeyring.getPrivateKey('base58');
    const changePrivateWIF = changeKeyring.getPrivateKey('base58');

    return {
      fromPrivate: fromKeyring,
      fromPrivateWIF,
      // toPrivate: toKeyring,
      // changePrivate: changeKeyring,
      fromAddress: fromKeyring.getAddress('base58'),
      // toAddress: toKeyring.getAddress('base58'),
      toAddress,
      toPrivateWIF,
      changePrivateWIF,
      changeAddress: changeKeyring.getAddress('base58'),
      fromDerive,
      toDerive,
      changeDerive,
      changeIndex,
    };
  }

  verifyMessage(message, address, signature) {
    return bitcoinMessage.verify(message, address, signature);
  }
  signMessage(message, key) {
    const keyWIF = key.getPrivateKey('base58');
    const keyPair = bitcoin.ECPair.fromWIF(keyWIF, this.NETWORK);
    const privateKey = keyPair.d.toBuffer(32);
    const signature = bitcoinMessage.sign(
      message,
      privateKey,
      keyPair.compressed
    );
    return signature.toString('base64');
  }
  getFakeUtxos({ address, txid, vout, satoshis }) {
    const utxos = [
      {
        address,
        txid,
        vout,
        satoshis,

        index: vout,
        value: satoshis,
        coinbase: false,
        version: 1,
        hash: txid,
        script: new this.bcoin.script().fromAddress(address),
        height: 1260734,
      },
    ];
    return utxos;
  }
  getUtxosBalance(utxos, address = null) {
    let balance = 0;
    utxos.map(utxo => {
      if (typeof utxo.value !== 'undefined' && utxo.value > 0) {
        if (utxo.address === address) {
          balance += utxo.value;
        }
      } else {
        throw new Error('Invalid utxo');
      }
      return true;
    });
    return balance;
  }

  getUtxos(address) {
    if (this.USE_BCOIN) {
      return this.getUtxosBcoin(address);
    } else {
      return this.getUtxosBitcore(address);
    }
  }

  getUtxosBitcore(address) {
    return new Promise((resolve, reject) => {
      this.insight.getUnspentUtxos(address, (err, utxos) => {
        if (err) {
          reject(err);
        } else {
          // console.log('Received utxos for', address, utxos);
          utxos = utxos.map(utxo => {
            const utxoObj = utxo.toObject();
            return {
              txid: utxoObj.txid,
              address: utxoObj.address,
              satoshis: utxo.satoshis,
              index: utxoObj.vout,
              value: utxo.satoshis,
              coinbase: false, // TODO: Verify this?
              version: 1,
              hash: utxoObj.txid,
              script: utxoObj.scriptPubKey,
              height: 1, // TODO: Set this some how?,
            };
          });
          resolve(utxos);
        }
      });
    });
  }
  getUtxosBcoin(address) {
    return new Promise((resolve, reject) => {
      axios({
        url: `/coin/address`,
        method: 'POST',
        baseURL: `http://x:${this.BCOIN_APIKEY}@${this.BCOIN_URI}`,
        data: {
          addresses: Array.isArray(address) ? address : [address],
        },
      })
        .then(res => resolve(res.data))
        .catch(reject);
    });

    // return new Promise((resolve, reject) => {
    //   this.bcoinClient
    //     .getCoinsByAddresses(Array.isArray(address) ? address : [address])
    //     .then(resolve)
    //     .catch(reject);
    // });
  }

  async broadcastTx(serialized) {
    // if (this.USE_BCOIN) {
    //   return this.broadcastTxBcoin(serialized);
    // } else {
    //   return this.broadcastTxBitcore(serialized);
    // }

    let txid1;
    let err1;
    if (this.BROADCAST_BCOIN) {
      try {
        txid1 = await this.broadcastTxBcoin(serialized);
      } catch (error) {
        console.log('Error broadcasting bcoin', error);
        if (typeof error === 'string') {
          err1 = new Error(error);
        } else {
          err1 = error;
        }
      }
    }

    let txid2;
    let err2;
    if (this.BROADCAST_BITCORE) {
      try {
        txid2 = await this.broadcastTxBitcore(serialized);
      } catch (error) {
        console.log('Error broadcasting bitcore', error);
        if (typeof error === 'string') {
          err2 = new Error(error);
        } else {
          err2 = error;
        }
      }
    }

    if (err2) {
      throw err2;
    } else if (err1) {
      throw err1;
    }

    return txid1 || txid2;
  }

  broadcastTxBitcore(serialized) {
    // // Insight does not work over tor :(
    // if (this.tor) {
    //   console.log('Broadcasting tx over tor');
    //   return new Promise((resolve, reject) => {
    //     let url;
    //     if (this.CHAIN === 'mainnet') {
    //       url = 'https://insight.bitpay.com/api/tx/send';
    //     } else {
    //       url = 'https://test-insight.bitpay.com/api/tx/send';
    //     }
    //     this.tor.request(
    //       url,
    //       {
    //         method: 'POST',
    //         body: JSON.stringify({
    //           rawtx: serialized,
    //         }),
    //         headers: {
    //           Accept: 'application/json',
    //           'Content-Type': 'application/json',
    //         },
    //       },
    //       (err, res, body) => {
    //         if (err || res.statusCode !== 200) {
    //           reject(err || body);
    //         }
    //         return resolve(JSON.parse(body).txid);
    //       }
    //     );
    //   });
    // } else {
    //
    // }

    return new Promise((resolve, reject) => {
      this.insight.broadcast(serialized, (err, txid) => {
        if (err) {
          reject(err);
        } else {
          resolve(txid);
        }
      });
    });
  }

  broadcastTxBcoin(serialized) {
    return new Promise((resolve, reject) => {
      this.bcoinRpc
        .execute('sendrawtransaction', [serialized])
        .then(resolve)
        .catch(reject);
    });
  }

  createTransaction({
    alices,
    bobs,
    utxos,
    fees,
    denomination,
    key,
    fromAddress,
  }) {
    console.log('Constructing TX...');

    // Sanity check
    if (alices.length !== bobs.length) {
      throw new Error('Invalid number of inputs to outputs');
    }
    // Validate addresses
    alices.map(alice => {
      if (this.isInvalid(alice.fromAddress)) {
        throw new Error(`Invalid to address: ${alice.fromAddress}`);
      }
      if (this.isInvalid(alice.changeAddress)) {
        throw new Error(`Invalid to address: ${alice.changeAddress}`);
      }
      return true;
    });
    bobs.map(bob => {
      if (this.isInvalid(bob.toAddress)) {
        throw new Error(`Invalid to address: ${bob.toAddress}`);
      }
      return true;
    });

    utxos = utxos.map(utxo => {
      return new this.bcoin.primitives.Coin.fromJSON(utxo);
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalChange = 0;
    let totalFees = 0;

    // Assign utxos with from addresses
    const aliceHash = {};
    alices.map(alice => {
      return (aliceHash[alice.fromAddress] = {
        utxos: [],
        fromAddress: alice.fromAddress,
        changeAddress: alice.changeAddress,
      });
    });
    utxos.map(utxo => {
      const utxoObj = utxo.toJSON();
      if (this.isInvalid(utxoObj.address)) {
        throw new Error(`Invalid utxo address: ${utxoObj.address}`);
      }
      if (!aliceHash[utxoObj.address]) {
        throw new Error(`utxo does not match fromAddress: ${utxoObj.address}`);
      }
      return aliceHash[utxoObj.address].utxos.push(utxo);
    });
    alices = Object.keys(aliceHash).map(key => aliceHash[key]);

    const tx = new this.bcoin.primitives.MTX({
      changeAddress: 'mixEyiH9dbRgGXc2cYhRAvXoZtKiBhDbiU', // TODO: CHANGE!
    });
    alices.map(alice => {
      if (alice.utxos.length === 0) {
        throw new Error('Alice missing utxo');
      }
      const totalSatoshis = alice.utxos.reduce(
        (previous, utxo) => previous + parseInt(utxo.value),
        0
      );
      const aliceFees = fees * alice.utxos.length;
      const change = totalSatoshis - denomination - aliceFees;
      totalIn += totalSatoshis;
      totalOut += change;
      alice.utxos.map(utxo => tx.addCoin(utxo));
      if (change !== 0) {
        // Only add a change output when there is a non zero value
        tx.addOutput({ address: alice.changeAddress, value: change });
      }
      if (alice.fromAddress === fromAddress) {
        totalChange = change;
        totalFees = aliceFees;
      }
      return true;
    });
    bobs.map(bob => {
      totalOut += denomination;
      return tx.addOutput({ address: bob.toAddress, value: denomination });
    });
    // tx.change('mixEyiH9dbRgGXc2cYhRAvXoZtKiBhDbiU'); // TODO: Add change address!
    // const fee = tx.getFee();
    // console.log('Fee', fee);
    const fee = fees * utxos.length;
    // tx.fee(fee); // TODO: Add fees!

    tx.sortMembers();

    // Sanity check
    totalOut += fee;
    if (totalIn !== totalOut) {
      console.log('Invalid inputs to outputs!', totalIn, totalOut);
      throw new Error('Invalid inputs to outputs!');
    }
    if (tx.getFee() !== fee) {
      throw new Error('Invalid fee');
    }
    if (tx.getInputValue() !== tx.getOutputValue() + tx.getFee()) {
      throw new Error('Invalid inputs to outputs');
    }

    if (key) {
      tx.sign(key);
      console.log('Signed transaction');
    }
    return { tx: tx.toJSON(), totalChange, totalFees };
  }

  // Server only
  combineTxs({ tx, signedTxs }) {
    tx.hash = undefined; // ???
    tx.witnessHash = undefined; // ???
    signedTxs.map(signedTx => {
      signedTx.inputs.map((input, index) => {
        const finalInput = tx.inputs[index];
        if (
          input.script &&
          !finalInput.script &&
          input.coin.address === finalInput.coin.address &&
          input.prevout.hash === finalInput.prevout.hash &&
          input.prevout.index === finalInput.prevout.index &&
          input.coin.value === finalInput.coin.value
        ) {
          // Signed
          finalInput.script = input.script;
        }
        return true;
      });
      return true;
    });
    const finalTx1 = new this.bcoin.primitives.TX.fromJSON(tx);
    if (finalTx1.isSane() && finalTx1.isStandard()) {
      const serialized = finalTx1.toRaw().toString('hex');
      return { serialized, txid: finalTx1.txid() };
    } else {
      console.log('Error: combineTxs. Not sane or standard', tx);
      throw new Error('Not fully signed');
    }
  }

  // Client only
  verifyTransaction({ alices, bobs, fromAddress, changeAddress, toAddress }) {
    // Make sure our addresses are in the pool
    let verifyTo = false;
    let verifyFrom = false;
    let verifyChange = false;
    const fromAddresses = alices.map(alice => {
      if (alice.fromAddress === fromAddress) {
        verifyFrom = true;
      }
      if (alice.changeAddress === changeAddress) {
        verifyChange = true;
      }
      return alice.fromAddress;
    });
    bobs.map(bob => {
      if (bob.toAddress === toAddress) {
        verifyTo = true;
      }
      return true;
    });
    if (!verifyTo || !verifyFrom || !verifyChange) {
      throw new Error('All your addresses are not in the pool! Aborting');
    }
    return fromAddresses;
  }
}

export default Bitcoin;
