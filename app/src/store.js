import { AsyncStorage } from 'react-native';
import { extendObservable, action, observable } from 'mobx';
import {
  DEFAULT_ROUTE,
  DEFAULT_TAB,
  SERVER,
  DEFAULT_TICKER,
  VERSION,
} from './config';

import ComputedServer from './computed/server';

class Store {
  constructor() {
    extendObservable(this, {
      loaded: false, // Is persistent data loaded
      route: DEFAULT_ROUTE,

      blindlinkClient: null,
      roundAddresses: {},
      roundInfo: null,
      lastRawTx: null,

      // Persistent data
      settings: {
        version: VERSION,
        routeTab: DEFAULT_TAB,

        simpleMode: true,
        aliceSeed: null,
        bobSeed: null,
        bobIndex: 0,
        aliceIndex: 0,
        changeIndex: 1,
        disableAutoChange: false,

        serverAddress: SERVER,
        wholeNumbers: true,
        ticker: DEFAULT_TICKER,

        lastBackup: null,
        successfulRounds: 0,
        failedRounds: 0,
        publicBalance: 0, // Unused
        privateBalance: 0,
        totalFees: 0,
      },
      completedRounds: observable([]),
      addressBalances: {},
    });

    ComputedServer(this);

    try {
      AsyncStorage.getItem('settings').then(
        action(stateString => {
          const state = JSON.parse(stateString);
          if (state) {
            const keys = Object.keys(state);
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              if (typeof this.settings[key] !== 'undefined') {
                this.settings[key] = state[key];
              }
            }
          }
          setTimeout(() => {
            console.log('Loaded initial state');
            this.loaded = true;
          }, 10);
        })
      );
    } catch (err) {
      console.log('Store load error', err);
      this.loaded = true;
    }

    try {
      AsyncStorage.getItem('completedRounds').then(stateString => {
        const state = JSON.parse(stateString);
        if (state) {
          this.completedRounds = observable(state);
        }
        console.log('Loaded initial roundsData');
      });
    } catch (err) {
      console.log('Store load roundsData error', err);
    }
    try {
      AsyncStorage.getItem('addressBalances').then(stateString => {
        const state = JSON.parse(stateString);
        if (state) {
          this.addressBalances = state;
        }
        console.log('Loaded initial addressBalances');
      });
    } catch (err) {
      console.log('Store load addressBalances error', err);
    }
  }

  save() {
    clearTimeout(this.tsave);
    this.tsave = setTimeout(() => {
      try {
        const state = JSON.stringify(this.settings);
        AsyncStorage.setItem('settings', state);
        console.log('Saved state');
      } catch (error) {
        console.log('Store Error', error);
      }
    }, 100);
  }
  saveCompletedRounds() {
    clearTimeout(this.tsaveCompletedRounds);
    this.tsaveCompletedRounds = setTimeout(() => {
      try {
        const state = JSON.stringify(this.completedRounds);
        AsyncStorage.setItem('completedRounds', state);
        console.log('Saved completedRounds');
      } catch (error) {
        console.log('Store completedRounds Error', error);
      }
    }, 100);
  }
  saveAddressBalances() {
    clearTimeout(this.tsaveAddressBalances);
    this.tsaveAddressBalances = setTimeout(() => {
      try {
        const state = JSON.stringify(this.addressBalances);
        AsyncStorage.setItem('addressBalances', state);
        console.log('Saved addressBalances');
      } catch (error) {
        console.log('Store addressBalances Error', error);
      }
    }, 100);
  }

  async clear() {
    console.log('!!!!!!!!!! CLEARING ALL PERSISTENT DATA !!!!!!!!!');
    await Object.keys(this.settings).map(key => (this.settings[key] = null));

    this.settings.serverAddress = SERVER;
    this.settings.bobIndex = 0;
    this.settings.aliceIndex = 0;
    this.settings.changeIndex = 1;
    this.settings.wholeNumbers = true;
    this.settings.disableAutoChange = false;
    this.settings.ticker = DEFAULT_TICKER;
    this.settings.simpleMode = true;
    this.settings.routeTab = DEFAULT_TAB;
    this.settings.version = VERSION;
    this.settings.successfulRounds = 0;
    this.settings.failedRounds = 0;
    this.settings.publicBalance = 0;
    this.settings.privateBalance = 0;
    this.settings.totalFees = 0;
    this.save();

    this.completedRounds = observable([]);
    this.saveCompletedRounds();
    this.addressBalances = {};
    this.saveAddressBalances();
  }
}

export default new Store();
