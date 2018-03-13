import store from '../store';
import { Clipboard } from 'react-native';
import { download } from '../helpers';
import { observable } from 'mobx';

class ActionsSettings {
  flipWholeNumber() {
    store.settings.wholeNumbers = !store.settings.wholeNumbers;
    store.save();
  }

  copyBackup(settings) {
    let string;
    if (settings) {
      settings.lastBackup = new Date().getTime();
      settings.version = store.settings.version;
      string = JSON.stringify({ settings });
    } else {
      store.settings.lastBackup = new Date().getTime();
      store.save();
      const { settings, completedRounds, addressBalances } = store;
      try {
        string = JSON.stringify({
          settings,
          completedRounds,
          addressBalances,
        });
      } catch (err) {
        console.log('Could not copy all data', err);
        try {
          string = JSON.stringify({
            settings,
            addressBalances,
          });
        } catch (err) {
          console.log('Could not copy all data', err);
          string = JSON.stringify({ settings });
        }
      }
    }
    Clipboard.setString(string);
    download(string);
    return string;
  }
  async setBackup(backup) {
    try {
      const parsed = JSON.parse(backup);
      const { settings, completedRounds, addressBalances } = parsed;
      if (!settings.aliceSeed || !settings.bobSeed) {
        throw new Error('Missing wallet seeds');
      }
      const keys = Object.keys(settings);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (typeof store.settings[key] !== 'undefined') {
          store.settings[key] = settings[key];
        }
      }
      store.save();
      store.completedRounds = observable(completedRounds || []);
      store.saveCompletedRounds();
      store.addressBalances = addressBalances || {};
      store.saveAddressBalances();
    } catch (err) {
      console.log('Error recovering backup', err);
      return err.message;
    }
  }
  toggleSimpleMode() {
    store.settings.simpleMode = !store.settings.simpleMode;
    store.save();
    if (store.settings.simpleMode && store.blindlinkClient) {
      store.settings.wholeNumbers = true;
      store.blindlinkClient.connect();
    } else {
      // store.blindlinkClient.setAutoJoin(0); // Stop?
    }
  }
}

export default new ActionsSettings();
