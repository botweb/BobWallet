import store from '../store';
import { observe, action } from 'mobx';
import { DEFAULT_ROUTE, DEFAULT_TAB, DEFAULT_CHAIN } from '../config';

import Client from '../blindlink/client';
import Bitcoin from '../blindlink/bitcoin_bcoin';
const bitcoinUtils = new Bitcoin({
  CHAIN: DEFAULT_CHAIN,
  bcoin: window.bcoin,
});

// const Client = require('electron-rpc/client');
// const client = new Client();

class ActionsClient {
  constructor() {
    observe(store, 'loaded', () => {
      const { settings: { aliceSeed, bobSeed } } = store;
      if (aliceSeed && bobSeed) {
        this.initAlice({});
      }
    });

    setInterval(() => this.getRoundInfo(), 1000);
    this.autoJoin();
  }
  clearAlice() {
    this.disconnect();
    store.blindlinkClient = null;
    store.route = DEFAULT_ROUTE;
    store.routeTab = DEFAULT_TAB;
    store.clear();
    this.refreshAddresses();
  }

  autoJoin() {
    clearTimeout(this.tautoJoin);
    const { blindlinkClient, settings: { simpleMode } } = store;
    if (blindlinkClient && simpleMode) {
      store.blindlinkClient.setAutoJoin(9999);
    }
    this.tautoJoin = setTimeout(() => {
      this.autoJoin();
    }, 3000);
  }

  initAlice({
    aliceSeed = store.settings.aliceSeed,
    bobSeed = store.settings.bobSeed,
    aliceIndex = store.settings.aliceIndex,
    bobIndex = store.settings.bobIndex,
    changeIndex = store.settings.changeIndex,
  }) {
    const { settings: { serverAddress } } = store;

    store.blindlinkClient = new Client({
      CHAIN: DEFAULT_CHAIN,
      DISABLE_UTXO_FETCH: true,
      bitcoinUtils,
      aliceSeed,
      bobSeed,
      aliceIndex,
      bobIndex,
      changeIndex,
      serverAddress,
      callbackBalance: res => {
        store.addressBalances[res.address] = res.balance;
        store.saveAddressBalances();
      },
      callbackStateChange: () => this.getRoundInfo(),
      callbackError: () => this.getRoundInfo(),
      callbackRoundComplete: action(tx => {
        const {
          error,
          to,
          from,
          change,
          out,
          left,
          fees,
          serialized,
          bobs,
          txid,
          date,
        } = tx;
        const {
          blindlinkClient: { aliceIndex, bobIndex, changeIndex },
          settings: {
            successfulRounds,
            failedRounds,
            privateBalance,
            totalFees,
          },
        } = store;
        store.settings.aliceIndex = aliceIndex;
        store.settings.bobIndex = bobIndex;
        store.settings.changeIndex =
          changeIndex === undefined ? aliceIndex + 1 : changeIndex;
        if (tx && !tx.error) {
          // Update balances on our estimates
          const { addressBalances } = store;
          const toAmount = (addressBalances[to] || 0) + out;
          store.addressBalances[from] = 0; // Sent balance
          store.addressBalances[change] = (addressBalances[change] || 0) + left;
          store.addressBalances[to] = toAmount;
          store.saveAddressBalances();

          store.settings.successfulRounds = successfulRounds + 1;
          store.settings.privateBalance = privateBalance + toAmount;
          store.settings.totalFees = totalFees + fees;

          store.lastRawTx = {
            tx: serialized,
            txid,
          };
        } else {
          store.settings.failedRounds = failedRounds + 1;
        }
        store.save();
        this.getRoundInfo();
        this.refreshAddresses();

        store.completedRounds.unshift({
          error,
          to,
          from,
          change,
          out,
          fees,
          left,
          bobs,
          txid,
          date,
        });
        store.saveCompletedRounds();
      }),
      // disableTor: true,
      // torFetch: (url, params) => {
      //   return new Promise((resolve, reject) => {
      //     client.request('tor', { url, params }, (err, body) => {
      //       if (err) {
      //         reject(err);
      //       } else {
      //         resolve(body);
      //       }
      //     });
      //   });
      // },
      // newTorSession: () => {
      //   return new Promise((resolve, reject) => {
      //     client.request('newTorSession', err => {
      //       if (err) {
      //         reject(err);
      //       } else {
      //         resolve();
      //       }
      //     });
      //   });
      // },
    });
    store.settings.aliceSeed = store.blindlinkClient.aliceSeed;
    store.settings.bobSeed = store.blindlinkClient.bobSeed;
    store.settings.aliceIndex = store.blindlinkClient.aliceIndex;
    store.settings.bobIndex = store.blindlinkClient.bobIndex;
    store.settings.changeIndex = store.blindlinkClient.changeIndex;
    store.save();
    this.refreshAddresses();

    store.blindlinkClient.connect();
  }
  refreshAddresses() {
    const { blindlinkClient } = store;
    if (blindlinkClient) {
      store.roundAddresses = blindlinkClient.getAddresses();
    } else {
      return {};
    }
  }
  toggleAutoChange() {
    store.settings.disableAutoChange = !store.settings.disableAutoChange;
    store.save();
  }

  updateServer(address) {
    // store.settings.serverAddress = address.replace(/(http:\/\/.*)\//i, '$1');
    store.settings.serverAddress = address;
    store.save();
    if (store.blindlinkClient) {
      store.blindlinkClient.setServer(address);
    }
  }
  join(value) {
    store.blindlinkClient.setAutoJoin(value);
    if (value === 0) {
      store.blindlinkClient.unjoin();
    }
    this.getRoundInfo();
  }
  isValidSeed(seed) {
    return bitcoinUtils.isMnemonicValid(seed);
  }
  isValidXPub(key) {
    return bitcoinUtils.isXPubValid(key);
  }
  isInvalid(address) {
    return bitcoinUtils.isInvalid(address);
  }
  newMnemonic() {
    return bitcoinUtils.newMnemonic();
  }
  updateKeyIndexes({
    aliceIndex = store.settings.aliceIndex,
    bobIndex = store.settings.bobIndex,
    changeIndex = store.settings.changeIndex,
  }) {
    const { blindlinkClient, settings: { disableAutoChange } } = store;
    if (blindlinkClient) {
      blindlinkClient.updateKeyIndexes({
        aliceIndex,
        bobIndex,
        changeIndex: disableAutoChange ? changeIndex : undefined,
      });
      store.settings.changeIndex = blindlinkClient.changeIndex;
      store.settings.bobIndex = blindlinkClient.bobIndex;
      store.settings.aliceIndex = blindlinkClient.aliceIndex;
      store.save();
      this.refreshAddresses();
    }
  }
  toggleConnect() {
    const { blindlinkClient } = store;
    if (blindlinkClient) {
      if (blindlinkClient.serverConnect) {
        blindlinkClient.disconnect();
      } else {
        blindlinkClient.connect();
      }
      this.getRoundInfo();
    }
  }
  disconnect() {
    const { blindlinkClient } = store;
    if (blindlinkClient) {
      blindlinkClient.disconnect();
    }
  }
  getRoundInfo() {
    const { blindlinkClient } = store;
    store.roundInfo = blindlinkClient ? blindlinkClient.getRoundInfo() : null;
  }
}

export default new ActionsClient();
