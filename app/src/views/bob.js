import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsClient from '../actions/client';
import { Text, TextB } from '../components/text';
import ComponentAddress from '../components/address';
import ComponentHistory from '../components/history';
import ComponentSeparator from '../components/separator';
import { View } from 'react-native';
import { colors } from '../styles';
import store from '../store';

class Bob extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.tflash);
  }
  flash(flash) {
    this.setState({ flash });
    clearTimeout(this.tflash);
    this.tflash = setTimeout(() => this.setState({ flash: null }), 4000);
  }
  render() {
    const { flash } = this.state;
    const {
      lastRawTx,
      computedIsJoining,
      computedBobHistory,
      addressBalances,
      roundAddresses: { toDerive, toAddress, toPrivateWIF },
      settings: { bobIndex, wholeNumbers, ticker, bobSeed },
    } = store;

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TextB style={{ margin: 6, color: colors.green }}> {flash} </TextB>

        <ComponentAddress
          privateAddress={true}
          title="Private Wallet"
          onPressUp={() =>
            ActionsClient.updateKeyIndexes({
              bobIndex: parseInt(bobIndex, 10) + 1,
            })
          }
          onPressDown={() =>
            ActionsClient.updateKeyIndexes({
              bobIndex: parseInt(bobIndex, 10) - 1,
            })
          }
          onValueChange={text =>
            ActionsClient.updateKeyIndexes({ bobIndex: text })
          }
          address={toAddress}
          privateKey={toPrivateWIF}
          value={bobIndex}
          derivePath={toDerive}
          balance={addressBalances[toAddress]}
          ticker={ticker}
          wholeNumbers={wholeNumbers}
          disableIncrementor={
            computedIsJoining || !ActionsClient.isInvalid(bobSeed)
          }
          flashMessage={message => this.flash(message)}
        />

        {computedBobHistory.length !== 0 && (
          <Text style={{ color: colors.gray, margin: 10, fontSize: 12 }}>
            Note: Balances are estimates. They are never directly checked to
            preserve privacy.
          </Text>
        )}
        <ComponentSeparator />
        <ComponentHistory
          completedRounds={computedBobHistory}
          wholeNumbers={wholeNumbers}
          filterAddress={toAddress}
          ticker={ticker}
          lastRawTx={lastRawTx}
          flashMessage={message => this.flash(message)}
        />
      </View>
    );
  }
}

export default observer(Bob);
