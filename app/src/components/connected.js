import React, { Component } from 'react';
import { Text } from '../components/text';
import Spinner from '../components/spinner';
import { View } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

class ComponentConnected extends Component {
  render() {
    const {
      computedIsConnected,
      computedIsConnecting,
      computedIsDisconnected,
    } = store;
    return (
      <View
        style={{
          backgroundColor: computedIsConnected ? colors.green : colors.red,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        }}
      >
        {computedIsConnected && <Text>Connected</Text>}
        {computedIsConnecting && <Text>Connecting...</Text>}
        {computedIsConnecting && (
          <Spinner
            style={{
              marginLeft: 6,
              width: 20,
              height: 20,
              borderWidth: 4,
              borderTopWidth: 4,
            }}
            small={true}
          />
        )}
        {computedIsDisconnected && <Text>Disconnected</Text>}
      </View>
    );
  }
}

export default observer(ComponentConnected);
