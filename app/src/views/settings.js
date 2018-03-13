import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsNav from '../actions/nav';
import ActionsSettings from '../actions/settings';
import { Text, TextB } from '../components/text';
import Button from '../components/button';
import ComponentTextLine from '../components/textline';
import ComponentBackground from '../components/background';
import Github from '../components/github';
import { View, Linking } from 'react-native';
import { colors } from '../styles';
import store from '../store';
import { WALLET_TOOL_URL, BLOCK_EXPLORER_URL, VERSION } from '../config';
import moment from 'moment';

class Settings extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
      showSeed: false,
      deleteWallet: false,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(message) {
    this.setState({ flash: message });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 10000);
  }

  render() {
    const {
      settings: { aliceSeed, bobSeed, lastBackup, simpleMode, wholeNumbers },
    } = store;
    const { showSeed, deleteWallet, flash } = this.state;
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
        }}
      >
        {simpleMode && <ComponentBackground />}
        <Text style={{ alignSelf: 'flex-end' }}>v{VERSION}</Text>
        <TextB style={{ margin: 6, color: colors.green }}> {flash} </TextB>

        <View style={{ width: 360 }}>
          <Text style={{ alignSelf: 'center' }}>
            Last Backup: {lastBackup ? moment(lastBackup).fromNow() : 'Never'}
          </Text>
          <Button
            text={simpleMode ? 'Go Pro' : 'Go Easy'}
            color={colors.darkgray}
            onPress={() => ActionsSettings.toggleSimpleMode()}
          />
          {!simpleMode && (
            <Button
              text={wholeNumbers ? 'Show Satoshis' : 'Show Bitcoin'}
              color={colors.darkgray}
              onPress={() => ActionsSettings.flipWholeNumber()}
            />
          )}
          {!simpleMode && (
            <Button
              text="Open Wallet Tool"
              color={colors.darkgray}
              onPress={() => Linking.openURL(WALLET_TOOL_URL)}
            />
          )}
          {!simpleMode && (
            <Button
              text="Open Block Explorer"
              color={colors.darkgray}
              onPress={() => Linking.openURL(BLOCK_EXPLORER_URL)}
            />
          )}
          {/* <Button
            text="View the code on Github"
            color={colors.darkgray}
            onPress={() => Linking.openURL(GITHUB_URL)}
          /> */}
          <Button
            text="Backup Wallet"
            color={colors.darkgray}
            onPress={() => {
              ActionsSettings.copyBackup();
              this.flash('Copied Backup to Clipboard.');
            }}
          />
          <Button
            color={deleteWallet ? colors.red : colors.darkgray}
            text={
              deleteWallet
                ? 'Are you sure you want to reset wallet?'
                : 'Reset Wallet'
            }
            onPress={() => {
              if (deleteWallet) {
                ActionsNav.goWelcome();
              } else {
                ActionsSettings.copyBackup();
                this.flash('Copied Backup to Clipboard.');
                this.setState({ deleteWallet: true });
              }
            }}
          />
          <Button
            color={showSeed ? colors.red : colors.darkgray}
            text={showSeed ? 'Hide Wallet Seed' : 'Show Wallet Seed'}
            onPress={() => this.setState({ showSeed: !showSeed })}
          />
        </View>

        <View style={{ width: '100%', opacity: showSeed ? 1 : 0 }}>
          <Text>Public Wallet Seed</Text>
          <ComponentTextLine text={aliceSeed} />
          <Text>Private Wallet Seed</Text>
          <ComponentTextLine text={bobSeed} />
        </View>

        <View style={{ flex: 1 }} />
        <Github />
      </View>
    );
  }
}

export default observer(Settings);
