/*jslint node: true */
"use strict";
import { checkDaemonAndNotify } from 'ocore/check_daemon.js';

checkDaemonAndNotify('node dist/main.js');

