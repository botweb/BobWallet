import React, { Component } from 'react';
import { Text } from '../components/text';
import { observer } from 'mobx-react';
import ActionsClient from '../actions/client';
import TextInput from '../components/textinput';
import { colors } from '../styles';
import store from '../store';
import { View, CheckBox } from 'react-native';
import Button from '../components/button';

class ComponentControls extends Component {
  render() {
    const {
      computedIsConnected,
      computedIsConnecting,
      computedIsJoining,
      computedIsAutoJoining,
      settings: { serverAddress, simpleMode },
    } = store;

    return (
      <View style={{ flex: 1, marginRight: 10 }}>
        {!simpleMode && (
          <TextInput
            placeholder="Server address"
            value={serverAddress}
            onChangeText={text => ActionsClient.updateServer(text)}
          />
        )}
        {!simpleMode && (
          <Button
            color={
              computedIsConnecting || computedIsConnected
                ? colors.red
                : colors.green
            }
            text={
              computedIsConnecting || computedIsConnected
                ? 'Disconnect'
                : 'Connect'
            }
            onPress={() => ActionsClient.toggleConnect()}
          />
        )}
        {computedIsConnected && (
          <Button
            color={computedIsJoining ? colors.red : colors.green}
            text={computedIsJoining ? 'Stop' : 'Join Round'}
            onPress={() => ActionsClient.join(computedIsJoining > 0 ? 0 : 1)}
          />
        )}
        {!simpleMode &&
          computedIsConnected && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              <Text
                selectable={false}
                style={{
                  marginRight: 10,
                }}
              >
                Auto Join Rounds
              </Text>
              <CheckBox
                style={{ width: 24, height: 24 }}
                color={colors.red}
                value={computedIsAutoJoining}
                onValueChange={() =>
                  ActionsClient.join(
                    computedIsAutoJoining ? (computedIsJoining ? 1 : 0) : 9999
                  )
                }
              />
            </View>
          )}
      </View>
    );
  }
}

export default observer(ComponentControls);
