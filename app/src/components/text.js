import React from 'react';
import { Text as TextNative } from 'react-native';
import PropTypes from 'prop-types';
import { colors } from '../styles';

export const Text = ({ style, selectable, children }) => (
  <TextNative selectable={selectable} style={{ color: colors.white, ...style }}>
    {children}
  </TextNative>
);
Text.propTypes = {
  style: PropTypes.object,
  children: PropTypes.any,
  selectable: PropTypes.bool,
};

export const TextB = ({ style, selectable, children }) => (
  <TextNative
    selectable={selectable}
    style={{
      color: colors.white,
      fontWeight: 'bold',
      ...style,
    }}
  >
    {children}
  </TextNative>
);
TextB.propTypes = {
  style: PropTypes.object,
  children: PropTypes.any,
  selectable: PropTypes.bool,
};

export default Text;
