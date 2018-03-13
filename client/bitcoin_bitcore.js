const bitcore = require('bitcore-lib');
global._bitcore = undefined; // Hack: https://github.com/bitpay/bitcore-lib/issues/153
// const Message = require('bitcore-message');
const Message = require('./message');
global._bitcore = undefined; // Hack: https://github.com/bitpay/bitcore-lib/issues/153
const Insight = require('bitcore-explorers').Insight;
global._bitcore = undefined; // Hack: https://github.com/bitpay/bitcore-lib/issues/153
const Mnemonic = require('bitcore-mnemonic');

class Bitcoin {
  constructor(chain) {
    if (chain === 'mainnet') {
      this.NETWORK = bitcore.Networks.livenet;
    } else {
      this.NETWORK = bitcore.Networks.testnet;
    }
    this.insight = new Insight(this.NETWORK);
  }

  newMnemonic(seed) {
    if (seed && !this.isMnemonicValid(seed)) throw new Error('Invalid seed');
    const code = new Mnemonic(seed);
    return code.toString();
  }
  isMnemonicValid(seed) {
    return Mnemonic.isValid(seed);
  }
  isInvalid(address) {
    return !bitcore.Address.isValid(address);
  }

  generateAddresses(seed) {
    if (!this.isMnemonicValid(seed)) throw new Error('Invalid seed');
    const code = new Mnemonic(seed);
    const fromPrivate = code
      .toHDPrivateKey(null, this.NETWORK)
      .deriveChild(44, true)
      .deriveChild(1, true)
      .deriveChild(0, true)
      .deriveChild(0)
      .deriveChild(0); // .derive("m/0'/0'/0'");
    const toPrivate = code
      .toHDPrivateKey(null, this.NETWORK)
      .deriveChild(44, true)
      .deriveChild(1, true)
      .deriveChild(0, true)
      .deriveChild(0)
      .deriveChild(1);
    const changePrivate = code
      .toHDPrivateKey(null, this.NETWORK)
      .deriveChild(44, true)
      .deriveChild(1, true)
      .deriveChild(0, true)
      .deriveChild(0)
      .deriveChild(2);
    const fromAddress = fromPrivate.privateKey.toAddress().toString();
    const toAddress = toPrivate.privateKey.toAddress().toString();
    const changeAddress = changePrivate.privateKey.toAddress().toString();
    return {
      fromPrivate: fromPrivate.privateKey.toWIF(),
      toPrivate: toPrivate.privateKey.toWIF(),
      changePrivate: changePrivate.privateKey.toWIF(),
      fromAddress,
      toAddress,
      changeAddress,
    };
  }

  verifyMessage(message, address, verify) {
    const verified = new Message(message).verify(address, verify);
    return verified;
  }
  signMessage(message, key) {
    const privateKey = bitcore.PrivateKey.fromWIF(key);
    return Message(message).sign(privateKey);
  }
  getFakeUtxos({ address, txid, vout, satoshis }) {
    const addr = new bitcore.Address(address, this.NETWORK);
    const utxos = [
      {
        address,
        txid,
        vout,
        script: new bitcore.Script(addr).toHex(),
        satoshis,
      },
    ];
    return utxos;
  }

  getUtxos(address) {
    return new Promise((resolve, reject) => {
      this.insight.getUnspentUtxos(address, (err, utxos) => {
        if (err) {
          reject(err);
        } else {
          // console.log('Received utxos for', address, utxos);
          utxos = utxos.map(utxo => utxo.toObject());
          resolve(utxos);
        }
      });
    });
  }

  broadcastTx(serialized) {
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

  createTransaction({ alices, bobs, utxos, fees, denomination, key }) {
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

    utxos = utxos.map(utxo => new bitcore.Transaction.UnspentOutput(utxo));

    const tx = new bitcore.Transaction();
    let totalIn = 0;
    let totalOut = 0;

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
      if (this.isInvalid(utxo.address)) {
        throw new Error(`Invalid utxo address: ${utxo.address}`);
      }
      if (!aliceHash[utxo.address]) {
        throw new Error(`utxo does not match fromAddress: ${utxo.address}`);
      }
      return aliceHash[utxo.address].utxos.push(utxo);
    });
    alices = Object.keys(aliceHash).map(key => aliceHash[key]);

    alices.map(alice => {
      if (alice.utxos.length === 0) {
        throw new Error('Alice missing utxo');
      }
      const totalSatoshis = alice.utxos.reduce(
        (previous, utxo) => previous + utxo.satoshis,
        0
      );
      const change = totalSatoshis - denomination - fees * alice.utxos.length;
      totalIn += totalSatoshis;
      totalOut += change;
      tx.from(alice.utxos);
      return tx.to(alice.changeAddress, change);
    });
    bobs.map(bob => {
      totalOut += denomination;
      return tx.to(bob.toAddress, denomination);
    });
    tx.change('mixEyiH9dbRgGXc2cYhRAvXoZtKiBhDbiU'); // TODO: Add change address!
    // const fee = tx.getFee();
    // console.log('Fee', fee);
    const fee = fees * utxos.length;
    tx.fee(fee); // TODO: Add fees!

    tx.sort();

    // Sanity check
    totalOut += fee;
    if (totalIn !== totalOut) {
      console.log('Invalid inputs to outputs!', totalIn, totalOut);
      throw new Error('Invalid inputs to outputs!');
    }
    if (tx._getInputAmount() !== tx._getOutputAmount() + fee) {
      console.log(
        'Invalid inputs to outputs! (2)',
        fee,
        tx._getInputAmount(),
        tx._getOutputAmount()
      );
      throw new Error('Invalid inputs to outputs! (2)');
    }
    if (!tx.hasAllUtxoInfo()) {
      throw new Error('Transaction does not have all utxo info');
    }

    if (key) {
      tx.sign(key);
      console.log('Signed transaction');
    }
    return tx.toObject();
  }

  // Server only
  combineTxs({ tx, signedTxs }) {
    tx.hash = undefined;
    // Save signed inputs
    signedTxs.map(signedTx => {
      signedTx.inputs.map((input, index) => {
        const finalInput = tx.inputs[index];
        if (
          input.script &&
          input.scriptString &&
          !finalInput.script &&
          !finalInput.scriptString &&
          input.address === finalInput.address &&
          input.txId === finalInput.txId &&
          input.outputIndex === finalInput.outputIndex &&
          input.satoshis === finalInput.satoshis
        ) {
          // Signed
          finalInput.script = input.script;
          finalInput.scriptString = input.scriptString;
        }
        return true;
      });
    });

    const finalTx = new bitcore.Transaction(tx);
    if (finalTx.isFullySigned) {
      const serialized = finalTx.serialize();
      return { serialized, txid: finalTx.toObject().hash };
    } else {
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
      throw new Error('Out addresses are not in the pool! Aborting');
    }
    return fromAddresses;
  }
}

module.exports = Bitcoin;
