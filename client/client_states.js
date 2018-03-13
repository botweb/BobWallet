const CLIENT_STATES = {
  unjoined: 0,
  joining: 1,
  joined: 2,
  blind: 3,
  blinding: 4,
  output: 5,
  signedtx: 6,
  senttx: 7,
};

module.exports = CLIENT_STATES;
