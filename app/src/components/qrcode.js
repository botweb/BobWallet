import React from 'react';
// import { format } from 'url';
import PropTypes from 'prop-types';
import qrImage from 'qr-image';

export const QRCode = ({ address }) => {
  if (!address) return <div />;
  // const bitcoinURL = format({ protocol: 'bitcoin:', host: address });
  const svg = qrImage.imageSync(address, { type: 'svg' });

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

QRCode.propTypes = {
  address: PropTypes.string,
};

export default QRCode;
