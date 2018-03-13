import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Text, TextB } from '../components/text';
import ActionsClient from '../actions/client';
import ActionsSettings from '../actions/settings';
import ComponentAddress from '../components/address';
import ComponentProgress from '../components/progress';
import ComponentErrors from '../components/errors';
import Spinner from '../components/spinner';
import Button from '../components/button';
import ComponentBackground from '../components/background';
import { View, Linking } from 'react-native';
import { colors } from '../styles';
import { TOR_URL, TESTNET_FAUCET_URL } from '../config';
import store from '../store';
import { formatSat } from '../helpers';

class AliceSimple extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(message) {
    this.setState({ flash: message });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 2000);
  }

  render() {
    const { flash } = this.state;

    const {
      roundAddresses: { fromAddress },
      computedBobBalance,
      computedServerStatus,
      computedIsConnected,
      computedSuccessfulRounds,
      computedInsufficientBalance,
      computedAttemptedJoin,
      computedRoundsLeft,
      computedLastUpdated,
      addressBalances,
      settings: { wholeNumbers, ticker, aliceIndex },
    } = store;
    const safeServerStatus = computedServerStatus || {};

    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <ComponentBackground />
        <TextB style={{ margin: 6, color: colors.green, alignSelf: 'center' }}>
          {' '}
          {flash}{' '}
        </TextB>

        {computedIsConnected &&
          computedAttemptedJoin &&
          computedInsufficientBalance && (
            <View
              style={{
                flex: 1,
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextB style={{ fontSize: 20, alignSelf: 'center' }}>
                Step 1:
              </TextB>
              <ComponentAddress
                title="Send Testnet Bitcoin Here to Start"
                simpleMode={true}
                onPressUp={() =>
                  ActionsClient.updateKeyIndexes({
                    aliceIndex: parseInt(aliceIndex, 10) + 1,
                  })
                }
                onPressDown={() =>
                  ActionsClient.updateKeyIndexes({
                    aliceIndex: parseInt(aliceIndex, 10) - 1,
                  })
                }
                onValueChange={text =>
                  ActionsClient.updateKeyIndexes({ aliceIndex: text })
                }
                value={aliceIndex}
                address={fromAddress}
                balance={addressBalances[fromAddress]}
                ticker={ticker}
                wholeNumbers={wholeNumbers}
                flashMessage={message => this.flash(message)}
                disableIncrementor={false}
              />
              <Button
                color={colors.green}
                text="Don't have any Testnet Bitcoin? Click here!"
                onPress={() => {
                  Linking.openURL(TESTNET_FAUCET_URL);
                }}
              />
              <Text
                style={{
                  marginTop: 60,
                  color: colors.gray,
                  textAlign: 'center',
                }}
              >
                Note: You will be depositing Bitcoin into your Public wallet and
                Bob Wallet will trustlessly move them to your Private wallet
                automatically.
              </Text>
              <Text
                style={{
                  color: colors.gray,
                  textAlign: 'center',
                }}
              >
                No one but you have access to your Bitcoins and they cannot be
                stolen.
              </Text>
            </View>
          )}
        {computedIsConnected &&
          !computedInsufficientBalance && (
            <View style={{ flex: 1, marginBottom: 10 }}>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {computedAttemptedJoin ? (
                  <TextB style={{ marginBottom: 6, fontSize: 16 }}>
                    You have joined!
                  </TextB>
                ) : (
                  <TextB style={{ marginBottom: 6, fontSize: 16 }}>
                    Joining Round...
                  </TextB>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <TextB style={{ fontSize: 20, color: colors.white }}>
                    {computedSuccessfulRounds}
                  </TextB>
                  <Text style={{ color: colors.gray, fontSize: 16 }}>
                    {' '}
                    Successful Rounds.
                  </Text>
                  {computedRoundsLeft !== false && (
                    <Text style={{ color: colors.gray, fontSize: 16 }}>
                      {' '}
                      {computedRoundsLeft} Rounds Left.
                    </Text>
                  )}
                </View>
                <Text
                  style={{ color: colors.gray, fontSize: 16, marginBottom: 6 }}
                >{`${formatSat(
                  addressBalances[fromAddress],
                  ticker,
                  wholeNumbers
                )} Public → ${formatSat(
                  computedBobBalance,
                  ticker,
                  wholeNumbers
                )} Private`}</Text>

                {computedServerStatus ? (
                  <Text style={{ marginTop: 60, color: colors.gray }}>
                    Note: Every successful round moves{' '}
                    {formatSat(
                      safeServerStatus.denomination,
                      ticker,
                      wholeNumbers
                    )}{' '}
                    of your Public Bitcoin into your Private Wallet.
                  </Text>
                ) : (
                  <Text style={{ marginTop: 60, color: colors.gray }}>
                    Note: Every successful round moves more of your Public
                    Bitcoin into your Private Wallet.
                  </Text>
                )}
                <Text
                  style={{
                    color: colors.gray,
                    marginTop: 6,
                  }}
                >
                  Private keys are NEVER sent to the server and cannot be
                  stolen.
                </Text>
                {computedServerStatus && (
                  <Text style={{ marginTop: 6, color: colors.gray }}>
                    Network fee per round:{' '}
                    {formatSat(safeServerStatus.fees, ticker, wholeNumbers)}
                  </Text>
                )}
              </View>
            </View>
          )}
        {!computedIsConnected && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextB style={{ fontSize: 16, color: colors.gray }}>
              Connecting...
            </TextB>
            <View style={{ height: 6 }} />
            <Spinner />
            <View style={{ height: 6 }} />
            <TextB style={{}}>
              Note: You must be using the Tor Browser in order to connect!
            </TextB>
            <View style={{ height: 6 }} />
            <Button
              text="Download Tor Here"
              onPress={() => Linking.openURL(TOR_URL)}
            />
            <Button
              color={colors.green}
              text="Copy Wallet Backup"
              onPress={() => {
                ActionsSettings.copyBackup();
                this.flash('Copied Wallet Backup.');
              }}
            />
          </View>
        )}

        <ComponentErrors />
        {computedServerStatus && (
          <Text
            style={{
              alignSelf: 'center',
              marginBottom: 10,
              color: colors.gray,
            }}
          >
            Last Updated: {computedLastUpdated} second{computedLastUpdated === 1
              ? ' ago '
              : 's ago'}
          </Text>
        )}
        {computedIsConnected &&
          !computedInsufficientBalance && <ComponentProgress />}
      </View>
    );
  }
}

export default observer(AliceSimple);
