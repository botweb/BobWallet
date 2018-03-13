import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Text, TextB } from '../components/text';
import ComponentAddress from '../components/address';
import ComponentBackground from '../components/background';
import Button from '../components/button';
import { View, ScrollView } from 'react-native';
import { formatSat } from '../helpers';
import { colors } from '../styles';
import store from '../store';

class BobSimple extends Component {
  constructor() {
    super();
    this.state = {
      flash: null,
      showAddresses: false,
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
    const { flash, showAddresses } = this.state;
    const {
      computedSuccessfulRounds,
      computedBobBalance,
      completedRounds,
      addressBalances,
      settings: { wholeNumbers, ticker },
    } = store;

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <ComponentBackground />
        <TextB style={{ margin: 6, color: colors.green }}> {flash} </TextB>

        {completedRounds.length === 0 && (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TextB style={{ marginBottom: 6 }}>No Completed Rounds Yet.</TextB>
            <Text style={{ color: colors.gray }}>
              Send Bitcoin to the Public wallet to get started.
            </Text>
          </View>
        )}

        {completedRounds.length !== 0 && (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
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
                Successful Rounds
              </Text>
            </View>
            <Text style={{ color: colors.gray, fontSize: 16 }}>
              Private Wallet Balance:{' '}
              <Text style={{ color: colors.white }}>
                {formatSat(computedBobBalance, ticker, wholeNumbers)}
              </Text>
            </Text>
            {!showAddresses && (
              <Button
                style={{ margin: 10 }}
                text="Show Addresses"
                color={colors.green}
                onPress={() => this.setState({ showAddresses: !showAddresses })}
              />
            )}
            <Text
              style={{ color: colors.darkergray, fontSize: 12, marginTop: 6 }}
            >
              Note: Balances are estimates. They are never directly checked to
              preserve privacy.
            </Text>

            {showAddresses && (
              <ScrollView style={{ flex: 1 }}>
                {completedRounds.map((round, index) => {
                  const { to, date, error, bobs } = round;
                  if (error) {
                    return <View key={index} />;
                  }
                  return (
                    <ComponentAddress
                      key={index}
                      simpleMode={true}
                      privateAddress={true}
                      // title="Bob Address"
                      address={to}
                      // privateKey={toPrivateWIF}
                      balance={addressBalances[to]}
                      ticker={ticker}
                      wholeNumbers={wholeNumbers}
                      disableIncrementor={true}
                      flashMessage={message => this.flash(message)}
                      date={date}
                      bobs={bobs}
                    />
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  }
}

export default observer(BobSimple);
