import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import lightWallet from 'ocore/light_wallet.js';
import eventBus from 'ocore/event_bus.js';
import network from 'ocore/network.js';

import { checkAndInitiateJob } from '../job/job.service';

dayjs.extend(utc);

const app = new Hono();
app.use(cors());

// FixMe: migration run
import '../common/db/migrations/init';
import { appConfig } from '../common/config/main.configuration.js';
import { getPerpetualAssetStats } from '../perpetual-stats/perpetual-stats.service';

app.get('/lastWeek', async (c) => {
    let { asset, tzOffset } = c.req.query();
    const tzOffsetInHours = tzOffset ? Number(tzOffset) / 60 : 0;

    if (!asset) {
        return c.body('asset should be specified!', 400);
    }

    asset = asset.replace(/\s/g, '+');

    const fromDate = dayjs().utc()
        .subtract(7, 'day')
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0)
        .subtract(-tzOffsetInHours, 'hour')
        .unix();
    const toDate = dayjs().unix();

    const perpStats = await getPerpetualAssetStats(asset, fromDate, toDate);

    return c.json(perpStats);
});

app.get('/lastMonth', async (c) => {
    let { asset } = c.req.query();

    if (!asset) {
        return c.body('asset should be specified!', 400);
    }

    asset = asset.replace(/\s/g, '+');

    const fromDate = dayjs().subtract(30, 'day').unix();
    const toDate = dayjs().unix();

    const perpStats = await getPerpetualAssetStats(asset, fromDate, toDate);

    return c.json(perpStats);
});

const initiateObyteNetwork = async () => {
    return new Promise((resolve) => {
        lightWallet.setLightVendorHost(appConfig.obyte.hub);

        eventBus.once('connected', (ws) => {
            network.initWitnessesIfNecessary(ws, resolve);
        });
    })
}

(async () => {
    try {
        serve({
            fetch: app.fetch,
            port: appConfig.port,
        })

        await initiateObyteNetwork();

        await checkAndInitiateJob();
    } catch (error) {
        console.error('Error on application start: ', error);
    }
})();

