import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsNav from '../actions/nav';
import { TextB, Text } from '../components/text';
import Button from '../components/button';
import { View } from 'react-native';
import ComponentBackground from '../components/background';
import Github from '../components/github';
import { colors } from '../styles';

class Welcome extends Component {
  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          // justifyContent: 'center',
        }}
      >
        <ComponentBackground />
        <View style={{ flex: 1 }} />
        <TextB
          style={{ marginBottom: 10, fontSize: 30, fontFamily: 'Courier' }}
        >
          Welcome to Bob Wallet
        </TextB>
        <Text style={{ color: colors.gray, maxWidth: 500 }}>
          Bob Wallet was created to help preserve Bitcoins fungibility. Today it
          is easy to trace bitcoin transactions from address to address by
          simply using any public Block Explorer. Bob Wallet helps fix this. To
          start, you will create a Public and Private Wallet.
        </Text>
        <View style={{ height: 30 }} />
        <View style={{ flexDirection: 'row' }}>
          <Button
            color={colors.green}
            style={{ padding: 4, minWidth: 160 }}
            text="Create"
            onPress={() => ActionsNav.goCreateWallet()}
          />
          <Button
            color={colors.green}
            style={{ padding: 4, minWidth: 160 }}
            text="Restore"
            onPress={() => ActionsNav.goRestoreWallet()}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Github />
      </View>
    );
  }
}

export default observer(Welcome);
