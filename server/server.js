const express = require('express');
const app = express();
const app2 = express();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const normalizeUrl = require('normalize-url');
const fs = require('fs');
// const tor = require('tor-request');
const simplelogger = require('simple-node-logger');

const LOG = false;
const INDEX_FILE = '../index.html';
const ADDRESS = '127.0.0.1';
const PORT = 8081;
const PORT2 = 8082;

// Default settings
let CONFIG = {
  USE_BCOIN: true,
  BCOIN_URI: 'localhost:18332',
  BCOIN_APIKEY: 'somepassword',
  LOG_TO_FILE: true,
  MIN_POOL: 2,
  MAX_POOL: 1000,
  SERVE_STATIC_APP: true,
  RSA_KEY_SIZE: 1024, // 2048?
  CHAIN: 'testnet',
  FEE_PER_INPUT: 10000,
  OUTPUT_SAT: 100000,
};
try {
  CONFIG = require('../config.json');
  console.log('Using config file config.json');
} catch (err) {
  console.log('Could not find config.json. Using defaults');
}
const {
  CHAIN,
  USE_BCOIN,
  BCOIN_URI,
  BCOIN_APIKEY,
  LOG_TO_FILE,
  MIN_POOL,
  MAX_POOL,
  SERVE_STATIC_APP,
  RSA_KEY_SIZE,
  FEE_PER_INPUT,
  OUTPUT_SAT,
} = CONFIG;

if (USE_BCOIN) {
  console.log('Using the local bcoin node', BCOIN_URI);
} else {
  console.log('Using the Bitcore Insight Explorer');
}

let consoleLog = {
  info: (...msg) => console.log(...msg),
  warn: (...msg) => console.log(...msg),
  error: (...msg) => console.log(...msg),
  log: (...msg) => console.log(...msg),
};
if (LOG_TO_FILE) {
  consoleLog = simplelogger.createSimpleLogger({
    logFilePath: path.join(__dirname, '../logs/server.log'),
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  });
}

const bcoin = require('bcoin');
// const Bitcoin = require('../client/bitcoin_bitcore').default;
const Bitcoin = require('../dist/client/bitcoin_bcoin').default;
const bitcoinUtils = new Bitcoin({
  bcoin,
  // tor,
  CHAIN,
  USE_BCOIN,
  BCOIN_URI,
  BCOIN_APIKEY,
  BROADCAST_BCOIN: true,
  BROADCAST_BITCORE: false,
});

let OUTPUT_URL;
try {
  OUTPUT_URL = fs.readFileSync(path.join(__dirname, '../hostname2'), 'utf8');
  OUTPUT_URL = normalizeUrl(OUTPUT_URL);
} catch (err) {
  OUTPUT_URL =
    process.argv.length > 2 ? normalizeUrl(process.argv[2]) : undefined;
}

let MAIN_URL;
try {
  MAIN_URL = fs.readFileSync(path.join(__dirname, '../hostname1'), 'utf8');
  MAIN_URL = normalizeUrl(MAIN_URL);
} catch (err) {
  // Ignore
}

const Coordinator = require('./coordinator');
const coordinator = new Coordinator({
  bitcoinUtils,
  CHAIN,
  OUTPUT_URL,
  MIN_POOL,
  MAX_POOL,
  RSA_KEY_SIZE,
  LOG_TO_FILE,
  FEE_PER_INPUT,
  OUTPUT_SAT,
});

app.use(cors());
app.use(compression());
app.use(bodyParser.json());

app.get('/state', (req, res) => {
  LOG && console.log('/parameters', req.query);
  res.json(coordinator.state(req.query));
});

app.post('/checkin', (req, res) => {
  LOG && console.log('/parameters', req.query);
  res.json(coordinator.checkin(req.body));
});

app.post('/join', async (req, res) => {
  LOG && console.log('/join', req.body);
  res.json(await coordinator.join(req.body));
});
app.post('/unjoin', async (req, res) => {
  LOG && console.log('/unjoin', req.body);
  res.json(coordinator.unjoin(req.body));
});
app.post('/blinding', (req, res) => {
  LOG && console.log('/blinding', req.body);
  res.json(coordinator.blinding(req.body));
});
if (!OUTPUT_URL) {
  app.post('/outputs', (req, res) => {
    LOG && console.log('/outputs', req.body);
    res.json(coordinator.outputs(req.body));
  });
}
app.post('/gettx', (req, res) => {
  LOG && console.log('/gettx', req.body);
  res.json(coordinator.gettx(req.body));
});
app.post('/txsignature', async (req, res) => {
  LOG && console.log('/txsignature', req.body);
  res.json(await coordinator.txsignature(req.body));
});
app.post('/utxo', async (req, res) => {
  LOG && console.log('/utxo', req.body);
  res.json(await coordinator.publicUtxo(req.body));
});
app.post('/verify', async (req, res) => {
  LOG && console.log('/verify', req.body);
  res.json(coordinator.verify(req.body));
});

// if (SERVE_STATIC_APP && PUBLIC_DIR) {
//   app.use('/', express.static(path.join(__dirname, PUBLIC_DIR)));
// }
if (SERVE_STATIC_APP && INDEX_FILE) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, INDEX_FILE), err => {
      !err && consoleLog.info('Sent index.html');
      !!err && consoleLog.error('Error sending index.html', err);
    });
  });
}

app.listen(PORT, ADDRESS, () =>
  consoleLog.info(`Listening on port ${PORT}. URL: ${MAIN_URL || 'Unknown'}`)
);

if (OUTPUT_URL) {
  // Used for a second onion route with a seperate address. TODO: Does this help?
  app2.use(cors());
  app2.use(compression());
  app2.use(bodyParser.json());
  app2.post('/outputs', (req, res) => {
    LOG && console.log('/outputs', req.body);
    res.json(coordinator.outputs(req.body));
  });
  app2.listen(PORT2, ADDRESS, () =>
    consoleLog.info(`Listening on port ${PORT2}. URL: ${OUTPUT_URL}`)
  );
}
