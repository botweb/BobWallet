import { observe } from 'mobx';
import store from '../store';
import ActionsClient from './client';

class ActionsNav {
  constructor() {
    observe(store, 'loaded', () => {
      if (store.loaded) {
        if (!store.settings.aliceSeed || !store.settings.bobSeed) {
          this.goWelcome();
        } else {
          this.goHome();
        }
      }
    });
  }

  goWelcome() {
    ActionsClient.clearAlice();
    store.route = 'Welcome';
  }
  goRestoreWallet() {
    store.route = 'RestoreWallet';
  }
  goCreateWallet() {
    store.route = 'CreateWallet';
  }
  goHome() {
    store.route = 'Home';
  }
  goAlice() {
    store.settings.routeTab = 'Alice';
    store.save();
  }
  goAliceSimple() {
    store.settings.routeTab = 'AliceSimple';
    store.save();
  }
  goBob() {
    store.settings.routeTab = 'Bob';
    store.save();
  }
  goBobSimple() {
    store.settings.routeTab = 'BobSimple';
    store.save();
  }
  goJoin() {
    store.settings.routeTab = 'Join';
    store.save();
  }
  goSettings() {
    store.settings.routeTab = 'Settings';
    store.save();
  }
  goHelp() {
    store.settings.routeTab = 'Help';
    store.save();
  }
}

export default new ActionsNav();
