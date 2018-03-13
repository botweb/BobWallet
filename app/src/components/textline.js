import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text } from '../components/text';
import { colors } from '../styles';
import { View } from 'react-native';

class ComponentTextLine extends Component {
  render() {
    const { text, style } = this.props;
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.darkgray,
          margin: 4,
          padding: 10,
          shadowRadius: 4,
          shadowOpacity: 0.3,
          shadowColor: colors.black,
          shadowOffset: { width: 1, height: 1 },
          ...style,
        }}
      >
        <Text style={{ fontSize: 20 }}>{text}</Text>
      </View>
    );
  }
}

ComponentTextLine.propTypes = {
  text: PropTypes.string,
  style: PropTypes.object,
};

export default ComponentTextLine;
