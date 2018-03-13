import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Text, TextB } from '../components/text';
import ComponentHistory from '../components/history';
import ComponentStats from '../components/stats';
import ComponentControls from '../components/controls';
import ComponentProgress from '../components/progress';
import ComponentSeparator from '../components/separator';
import ComponentErrors from '../components/errors';
import ComponentConnected from '../components/connected';
import { View } from 'react-native';
import { colors } from '../styles';
import store from '../store';

class Join extends Component {
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
      computedIsConnected,
      computedHistory,
      settings: { wholeNumbers, ticker, simpleMode },
    } = store;

    return (
      <View style={{ flex: 1, marginTop: 0 }}>
        <ComponentConnected />
        <TextB style={{ margin: 6, color: flashColor, alignSelf: 'center' }}>
          {' '}
          {flash}
        </TextB>

        <View style={{ alignSelf: 'center' }}>
          {computedIsConnected && (
            <Text
              style={{
                alignSelf: 'center',
                color: colors.gray,
                marginBottom: 10,
                fontSize: 12,
              }}
            >
              Note: Private keys are NEVER sent to the server and cannot be
              stolen.
            </Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              width: 635,
            }}
          >
            <ComponentControls />
            <ComponentStats />
          </View>
        </View>

        <ComponentSeparator />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <ComponentHistory
            completedRounds={computedHistory}
            wholeNumbers={wholeNumbers}
            flashMessage={msg => this.flash(msg)}
            ticker={ticker}
            lastRawTx={lastRawTx}
            simpleMode={simpleMode}
          />
        </View>
        <ComponentSeparator style={{ marginTop: 0 }} />
        <ComponentErrors />
        <ComponentProgress />
      </View>
    );
  }
}

export default observer(Join);
