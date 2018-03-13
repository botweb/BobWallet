import React from 'react';
import { View } from 'react-native';
import { colors } from '../styles';
import PropTypes from 'prop-types';

export const ComponentSeparator = ({ style }) => (
  <View
    style={{
      backgroundColor: colors.gray,
      height: 1,
      width: '100%',
      marginBottom: 10,
      marginTop: 10,
      ...style,
    }}
  />
);

ComponentSeparator.propTypes = {
  style: PropTypes.object,
};

export default ComponentSeparator;
