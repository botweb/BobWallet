import React, { Component } from 'react';
import { observer } from 'mobx-react';
import RestoreWallet from './restorewallet';
import CreateWallet from './createwallet';
import Welcome from './welcome';
import Home from './home';
import { View, Text } from 'react-native';
import { colors } from '../styles';
import store from '../store';

class Main extends Component {
  render() {
    const { route, loaded } = store;
    if (!loaded) return <View />;
    return (
      <View
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: colors.background,
        }}
      >
        {route === 'Welcome' ? (
          <Welcome />
        ) : route === 'CreateWallet' ? (
          <CreateWallet />
        ) : route === 'RestoreWallet' ? (
          <RestoreWallet />
        ) : route === 'Home' ? (
          <Home />
        ) : (
          <Text>Unknown View</Text>
        )}
      </View>
    );
  }
}

export default observer(Main);
