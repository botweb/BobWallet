import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

export const Spinner = ({ style }) => {
  // eslint-disable-next-line react/no-danger
  return <View style={style} className="loader" />;
};

Spinner.propTypes = {
  style: PropTypes.object,
};

export default Spinner;
