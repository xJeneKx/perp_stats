'use strict';
require('dotenv').config();

exports.bServeAsHub = false;
exports.bLight = true;

exports.WS_PROTOCOL = 'wss://';
exports.hub = process.env.NETWORK === 'testnet' ? 'obyte.org/bb-test' : 'obyte.org/bb';

console.log('ocore configuration loaded');
