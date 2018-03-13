import React, { Component } from 'react';
import { TextB } from '../components/text';
import { View } from 'react-native';
import { colors } from '../styles';
import { observer } from 'mobx-react';
import store from '../store';

class ComponentErrors extends Component {
  render() {
    const { computedServerError, computedRoundError } = store;
    return (
      <View>
        {!!computedServerError && (
          <TextB style={{ alignSelf: 'center', color: colors.red }}>
            Error: {computedServerError.message}
          </TextB>
        )}
        <TextB style={{ alignSelf: 'center', color: colors.red }}>
          {computedRoundError ? `Error: ${computedRoundError.message}` : ' '}
        </TextB>
      </View>
    );
  }
}

export default observer(ComponentErrors);
