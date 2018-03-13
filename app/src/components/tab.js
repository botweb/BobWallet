import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';
import { colors } from '../styles';
import { TextB } from '../components/text';

class ComponentTab extends Component {
  render() {
    const { selected, text, onPress } = this.props;
    return (
      <TouchableOpacity
        style={{
          borderWidth: 0.5,
          // borderColor: colors.lightgray,
          // borderBottomColor: selected ? colors.background : colors.lightgray,
          paddingTop: 6,
          paddingBottom: 6,
          width: 100,
          backgroundColor: selected ? colors.background : colors.darkgray,
          borderTopColor: selected ? colors.lightgray : colors.background,
          borderLeftColor: selected ? colors.lightgray : colors.background,
          borderRightColor: selected ? colors.lightgray : colors.background,
          borderTopWidth: 0.5,
          borderLeftWidth: 0.5,
          borderRightWidth: 0.5,

          borderBottomColor: !selected ? colors.lightgray : colors.background,
          borderBottomWidth: 0.5,
          justifyContent: 'center',
        }}
        onPress={() => onPress && onPress()}
      >
        <TextB style={{ fontSize: 20, textAlign: 'center' }}>{text}</TextB>
      </TouchableOpacity>
    );
  }
}

ComponentTab.propTypes = {
  selected: PropTypes.bool,
  text: PropTypes.string,
  onPress: PropTypes.func,
};

export default ComponentTab;
