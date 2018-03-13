import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, View } from 'react-native';
import TextInput from './textinput';
import { Text } from './text';
import { colors } from '../styles';

class ComponentArrow extends Component {
  render() {
    const {
      onPressUp,
      onPressDown,
      value,
      onValueChange,
      disabled,
    } = this.props;

    return (
      <View style={{ alignItems: 'center', marginLeft: 6, marginRight: 6 }}>
        <TouchableOpacity disabled={disabled} onPress={() => onPressUp()}>
          <View
            style={{
              width: 40,
              height: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: colors.darkgray,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: disabled ? colors.darkgray : colors.white }}>
              ^
            </Text>
          </View>
        </TouchableOpacity>
        <TextInput
          editable={!disabled}
          style={{
            marginTop: 0,
            marginBottom: 0,
            margin: 0,
            width: 40,
            borderTopWidth: 0.5,
            borderTopColor: colors.gray,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.gray,
          }}
          textStyle={{ height: 30, marginLeft: 0, textAlign: 'center' }}
          value={`${value}`}
          onChangeText={text => onValueChange(text.replace(/\D/g, ''))}
        />
        <TouchableOpacity
          disabled={value <= 0 || disabled}
          onPress={() => onPressDown()}
        >
          <View
            style={{
              width: 40,
              height: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: colors.darkgray,
              transform: [{ rotate: '180deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: value <= 0 || disabled ? colors.darkgray : colors.white,
              }}
            >
              ^
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

ComponentArrow.propTypes = {
  onPressUp: PropTypes.func,
  onPressDown: PropTypes.func,
  value: PropTypes.any,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default ComponentArrow;
