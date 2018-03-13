import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ActionsSettings from '../actions/settings';
import ActionsNav from '../actions/nav';
import { Text, TextB } from '../components/text';
import ComponentSeparator from '../components/separator';
import Button from '../components/button';
import { View, Linking, Clipboard } from 'react-native';
import { colors } from '../styles';
import { TOR_URL, TESTNET_FAUCET_URL } from '../config';

class Help extends Component {
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
    return (
      <View
        style={{
          flex: 1,
          marginLeft: 20,
          marginRight: 20,
          alignItems: 'center',
          // justifyContent: 'center',
          // backgroundColor: 'white',
        }}
      >
        {/* <TextB style={{ color: 'black', fontSize: 32, fontFamily: 'Courier' }}>
          Bob Wallet
        </TextB> */}
        <TextB style={{ margin: 6, color: colors.green }}> {flash} </TextB>

        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center' }}>
            <TextB
              style={{ fontSize: 16, color: colors.gray, marginBottom: 6 }}
            >
              Simple Steps:
            </TextB>
            <Text style={{ fontSize: 16 }}>
              Open Bob Wallet in your Tor Browser
            </Text>
            <Text style={{ fontSize: 16 }}>↓</Text>
            <Text style={{ fontSize: 16 }}>
              Send Bitcoin to your Alice Wallet
            </Text>
            <Text style={{ fontSize: 16 }}>↓</Text>
            <Text style={{ fontSize: 16 }}>Join a round</Text>
            <Text style={{ fontSize: 16 }}>↓</Text>
            <Text style={{ fontSize: 16 }}>
              Receive Private Bitcoin in your Bob Wallet!
            </Text>
          </View>
          <ComponentSeparator />
          <TextB
            style={{
              alignSelf: 'center',
              fontSize: 16,
              color: colors.gray,
              marginBottom: 6,
            }}
          >
            Technical Steps:
          </TextB>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 1:</Text>
            <Button
              text="Download Tor"
              onPress={() => Linking.openURL(TOR_URL)}
            />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Download and install the Tor Browser.{' '}
              <TextB style={{ fontSize: 16 }}>You must use Tor!</TextB>
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 2:</Text>
            <Button
              text="Copy URL"
              onPress={() => {
                Clipboard.setString(window.location.href);
                this.flash('Copied URL to clipboard');
              }}
            />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Open the Tor Browser and paste in the URL
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 3:</Text>
            <Button
              text="Copy Backup"
              onPress={() => {
                ActionsSettings.copyBackup();
                this.flash('Copied backup to clipboard');
              }}
            />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              {'Select "Recover" and paste in the backup'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 4:</Text>
            <Button
              text="Get Bitcoins"
              onPress={() => {
                Linking.openURL(TESTNET_FAUCET_URL);
              }}
            />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Select the Alice tab and deposit Bitcoin
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 5:</Text>
            <Button text="Open Join Tab" onPress={() => ActionsNav.goJoin()} />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Select the Join tab and join a round
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 6:</Text>
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Wait for a round to start and complete...
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 10 }}>Step 7:</Text>
            <Button text="Open Bob Tab" onPress={() => ActionsNav.goBob()} />
            <Text style={{ fontSize: 16, marginRight: 10 }}>
              Bitcoin in your Bob Wallet!
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

export default observer(Help);
