import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text } from '../components/text';
import { TouchableOpacity } from 'react-native';
import { colors } from '../styles';

class ComponentButton extends Component {
  render() {
    const { disabled, text, onPress, color, style } = this.props;

    return (
      <TouchableOpacity
        disabled={disabled}
        style={{
          margin: 6,
          borderRadius: 6,
          backgroundColor: disabled ? colors.darkgray : color || colors.red,
          ...style,
        }}
        onPress={() => onPress()}
      >
        <Text style={{ color: colors.white, textAlign: 'center', margin: 10 }}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }
}

ComponentButton.propTypes = {
  style: PropTypes.object,
  disabled: PropTypes.bool,
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  color: PropTypes.string,
};

export default ComponentButton;
