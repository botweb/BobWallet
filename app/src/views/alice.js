import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Text, TextB } from '../components/text';
import ComponentAddress from '../components/address';
import ComponentHistory from '../components/history';
import ComponentSeparator from '../components/separator';
import ActionsClient from '../actions/client';
import { View, CheckBox } from 'react-native';
import { colors } from '../styles';
import store from '../store';

class Alice extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
      flashColor: null,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(message, color) {
    this.setState({ flash: message, flashColor: color || colors.green });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(
      () => this.setState({ flash: null, flashColor: colors.green }),
      4000
    );
  }
  render() {
    const { flash, flashColor } = this.state;
    const {
      lastRawTx,
      computedIsJoining,
      computedAliceHistory,
      roundAddresses: {
        fromAddress,
        changeAddress,
        fromDerive,
        changeDerive,
        fromPrivateWIF,
        changePrivateWIF,
      },
      addressBalances,
      settings: {
        aliceIndex,
        wholeNumbers,
        disableAutoChange,
        changeIndex,
        ticker,
        simpleMode,
      },
    } = store;

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TextB style={{ margin: 6, color: flashColor }}> {flash} </TextB>

        <ComponentAddress
          title="Send Bitcoin Here"
          simpleMode={simpleMode}
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
          address={fromAddress}
          privateKey={fromPrivateWIF}
          value={aliceIndex}
          derivePath={fromDerive}
          balance={addressBalances[fromAddress]}
          ticker={ticker}
          wholeNumbers={wholeNumbers}
          flashMessage={message => this.flash(message)}
          disableIncrementor={computedIsJoining}
        />

        {!simpleMode && (
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                selectable={false}
                style={{ color: colors.white, marginRight: 6, fontSize: 12 }}
              >
                Auto Change Address:
              </Text>
              <CheckBox
                color={colors.red}
                value={!disableAutoChange}
                onValueChange={() => {
                  ActionsClient.toggleAutoChange();
                  ActionsClient.updateKeyIndexes({
                    aliceIndex,
                  });
                }}
              />
              <Text
                style={{
                  color: disableAutoChange ? colors.background : colors.gray,
                  marginLeft: 6,
                  fontSize: 12,
                }}
              >
                {changeDerive}
              </Text>
            </View>
          </View>
        )}

        {disableAutoChange && (
          <ComponentAddress
            title="Change Address"
            onPressUp={() =>
              ActionsClient.updateKeyIndexes({
                changeIndex: parseInt(changeIndex, 10) + 1,
              })
            }
            onPressDown={() =>
              ActionsClient.updateKeyIndexes({
                changeIndex: parseInt(changeIndex, 10) - 1,
              })
            }
            onValueChange={text =>
              ActionsClient.updateKeyIndexes({ changeIndex: text })
            }
            address={changeAddress}
            privateKey={changePrivateWIF}
            value={changeIndex}
            derivePath={changeDerive}
            balance={addressBalances[changeAddress]}
            ticker={ticker}
            wholeNumbers={wholeNumbers}
            flashMessage={message => this.flash(message)}
            disableIncrementor={computedIsJoining}
          />
        )}
        <ComponentSeparator />
        <ComponentHistory
          completedRounds={computedAliceHistory}
          wholeNumbers={wholeNumbers}
          filterAddress={fromAddress}
          ticker={ticker}
          simpleMode={simpleMode}
          lastRawTx={lastRawTx}
          flashMessage={message => this.flash(message)}
        />
      </View>
    );
  }
}

export default observer(Alice);
