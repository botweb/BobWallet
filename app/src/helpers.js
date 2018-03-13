import BigNumber from 'bignumber.js';
import FileSaver from 'file-saver';

export const formatSat = (amount, ticker, wholeNumber) => {
  if (typeof amount === 'undefined') {
    return 'Unknown Amount';
  }
  const num = new BigNumber(amount.toString());
  if (wholeNumber) {
    return `${num.dividedBy(100000000).toFormat(8)} ${ticker || ''}`;
  } else {
    return `${num.toFormat(0)} ${ticker || ''} Satoshis`;
  }
};

export const download = content => {
  var blob = new window.Blob([content], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, 'bob_backup.txt');
};
