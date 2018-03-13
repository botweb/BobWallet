import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput } from 'react-native';
import { colors } from '../styles';

class ComponentTextInput extends Component {
  render() {
    const {
      value,
      onChangeText,
      placeholder,
      editable,
      style,
      textStyle,
      onSubmitEditing,
      onBlur,
    } = this.props;

    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.darkgray,
          margin: 4,
          shadowRadius: 4,
          shadowOpacity: 0.3,
          shadowColor: colors.black,
          shadowOffset: { width: 1, height: 1 },
          ...style,
        }}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          editable={editable}
          onChangeText={text => onChangeText && onChangeText(text)}
          onSubmitEditing={() => onSubmitEditing && onSubmitEditing()}
          onBlur={() => onBlur && onBlur()}
          style={{
            flex: 1,
            marginLeft: 16,
            fontSize: 18,
            height: 40,
            color: colors.white,
            ...textStyle,
          }}
        />
      </View>
    );
  }
}

ComponentTextInput.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  editable: PropTypes.bool,
  style: PropTypes.object,
  textStyle: PropTypes.object,
  onSubmitEditing: PropTypes.func,
  onBlur: PropTypes.func,
};

export default ComponentTextInput;
