import React, { Component } from 'react';
import { Image, View } from 'react-native';

class ComponentBackground extends Component {
  render() {
    return (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      >
        <Image
          pointerEvents="none"
          resizeMode="cover"
          style={{ flex: 1, opacity: 0.19 }}
          // defaultSource={{ uri: require('../images/background.jpg') }}
          defaultSource={{ uri: 'https://i.imgur.com/daDURSz.jpeg' }}
        />
      </View>
    );
  }
}
export default ComponentBackground;
