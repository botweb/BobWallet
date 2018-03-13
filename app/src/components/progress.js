import React, { Component } from 'react';
import { Text } from '../components/text';
import { View, ProgressBar } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

// const StatesServer = {
//   join: '1/4: Waiting for Alices to Join',
//   blinding: '2/4: Collecting Bob Addresses',
//   outputs: '3/4: Verifying Bob Addresses',
//   signing: '4/4: Creating Final Transaction',
// };
// const StatesProgress = {
//   join: 0,
//   blinding: 1,
//   outputs: 2,
//   signing: 3,
// };
const StatesProgress = {
  unjoined: 0,
  joining: 0,
  joined: 1,
  blind: 2,
  blinding: 3,
  output: 4,
  signedtx: 5,
  senttx: 6,
};
const StatesClient = {
  unjoined: 'Not Joined',
  joining: 'Joining...',
  joined: 'Joined',
  blind: 'Blinding Bob Address',
  blinding: 'Sending Bob Address...',
  output: 'Sent Bob Address',
  signedtx: 'Signing Transaction...',
  senttx: 'Sent Transaction',
};

class ComponentProgress extends Component {
  render() {
    const { computedServerStatus, computedState } = store;
    const safeServerStatus = computedServerStatus || {};

    let progress = 0;
    if (safeServerStatus.alices !== 0 && computedServerStatus) {
      progress =
        (Math.min(safeServerStatus.alices, safeServerStatus.min_pool) +
          StatesProgress[computedState]) /
        (safeServerStatus.min_pool + (Object.keys(StatesClient).length - 2));
    }
    return (
      <View style={{ marginBottom: 10 }}>
        <ProgressBar
          progress={progress}
          style={{ borderRadius: 24, height: 30 }}
          trackColor={colors.darkgray}
          color={colors.green}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {safeServerStatus.state === 'join' ? (
            <Text style={{}}>{`${safeServerStatus.alices} of ${
              safeServerStatus.min_pool
            } Bobs Joined`}</Text>
          ) : (
            <Text style={{}}>{StatesClient[computedState]}</Text>
          )}
        </View>
      </View>
    );
  }
}

export default observer(ComponentProgress);
