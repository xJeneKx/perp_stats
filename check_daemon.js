/*jslint node: true */
"use strict";
import { checkDaemonAndNotify } from 'ocore/check_daemon.js';

checkDaemonAndNotify('node src/modules/web/server.js');

