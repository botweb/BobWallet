import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsNav from '../actions/nav';
import ActionsSettings from '../actions/settings';
import ActionsClient from '../actions/client';
import { Text, TextB } from '../components/text';
import Button from '../components/button';
import TextInput from '../components/textinput';
import ComponentBackground from '../components/background';
import { View } from 'react-native';
import { colors } from '../styles';

class RestoreWallet extends Component {
  constructor() {
    super();

    this.state = {
      error: '',
    };
  }

  render() {
    const { error } = this.state;
    return (
      <View
        style={{
          flex: 1,
          // alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ComponentBackground />
        {/* <TextB style={{ fontSize: 24 }}>Wallet Recovery</TextB> */}
        <Text style={{ fontSize: 20, alignSelf: 'center' }}>
          Paste your backup here
        </Text>
        <TextInput
          // placeholder="Paste your backup here"
          style={{ marginRight: 10, marginLeft: 10 }}
          onChangeText={async text => {
            const err = await ActionsSettings.setBackup(text);

            if (!err) {
              ActionsClient.initAlice({});
              ActionsNav.goHome();
            } else {
              this.setState({ error: err });
            }
          }}
        />
        <TextB style={{ color: colors.red, alignSelf: 'center' }}>
          {error}
        </TextB>

        <Button
          style={{ width: 120, alignSelf: 'center' }}
          text="Back"
          onPress={() => ActionsNav.goWelcome()}
        />
      </View>
    );
  }
}

export default observer(RestoreWallet);
