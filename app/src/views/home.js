import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { View } from 'react-native';
import ActionsNav from '../actions/nav';
import { Text, TextB } from '../components/text';
import ComponentTab from '../components/tab';
import store from '../store';
import Alice from './alice';
import Bob from './bob';
import BobSimple from './bobsimple';
import Settings from './settings';
import Help from './help';
import Join from './join';
import AliceSimple from './alicesimple';
import { colors } from '../styles';

class Home extends Component {
  render() {
    const { settings: { routeTab, simpleMode } } = store;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', margin: 20, marginBottom: 0 }}>
          {/* <ComponentTab
            text="Help"
            selected={routeTab === 'Help'}
            onPress={() => ActionsNav.goHelp()}
          /> */}
          {!!simpleMode && (
            <ComponentTab
              text="Public Wallet"
              selected={routeTab === 'AliceSimple'}
              onPress={() => ActionsNav.goAliceSimple()}
            />
          )}
          {!simpleMode && (
            <ComponentTab
              text="Public Wallet"
              selected={routeTab === 'Alice'}
              onPress={() => ActionsNav.goAlice()}
            />
          )}
          {!simpleMode && (
            <ComponentTab
              text="Join"
              selected={routeTab === 'Join'}
              onPress={() => ActionsNav.goJoin()}
            />
          )}
          {!simpleMode && (
            <ComponentTab
              text="Private Wallet"
              selected={routeTab === 'Bob'}
              onPress={() => ActionsNav.goBob()}
            />
          )}
          {!!simpleMode && (
            <ComponentTab
              text="Private Wallet"
              selected={routeTab === 'BobSimple'}
              onPress={() => ActionsNav.goBobSimple()}
            />
          )}
          <ComponentTab
            text="Settings"
            selected={routeTab === 'Settings'}
            onPress={() => ActionsNav.goSettings()}
          />
          <View
            style={{
              flex: 1,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.lightgray,
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <TextB style={{ fontSize: 32, fontFamily: 'Courier' }}>
              Bob Wallet
            </TextB>
            <View
              style={{
                position: 'absolute',
                top: 3,
                right: 1,
                padding: 2,
                borderRadius: 4,
                borderWidth: 0.5,
                borderColor: colors.gray,
                transform: [{ rotate: '16deg' }],
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'Courier' }}>Beta</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 20, marginRight: 20 }}>
          {routeTab === 'Alice' ? (
            <Alice />
          ) : routeTab === 'AliceSimple' ? (
            <AliceSimple />
          ) : routeTab === 'Bob' ? (
            <Bob />
          ) : routeTab === 'BobSimple' ? (
            <BobSimple />
          ) : routeTab === 'Join' ? (
            <Join />
          ) : routeTab === 'Settings' ? (
            <Settings />
          ) : routeTab === 'Help' ? (
            <Help />
          ) : (
            <Text>Unknown Tab</Text>
          )}
        </View>
      </View>
    );
  }
}

export default observer(Home);
