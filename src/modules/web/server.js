import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { checkAndInitiateJob } from '../job/job.service.js';
import { getAssetStats } from '../perpetual-stats/perpetual-stats.service.js';

dayjs.extend(utc);

const app = new Hono();
app.use(cors());

// FixMe: migration run
import '../common/db/migrations/init.js';

// app.get('/perp-stats', async (c) => {
//     const { aa, fromDate, toDate } = c.req.query();
//
//     if (!aa) {
//         return c.body('AA address should be specified!', 400);
//     }
//
//     if (!fromDate || !toDate) {
//         return c.body('Date range should be specified!', 400);
//     }
//
//     const perpStats = await getPerpetualStats(aa, fromDate, toDate);
//
//     return c.json(perpStats);
// });

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
        .toISOString();
    const toDate = dayjs().toISOString();

    const perpStats = await getAssetStats(asset, fromDate, toDate, false);

    return c.json(perpStats);
});

app.get('/lastMonth', async (c) => {
    let { asset } = c.req.query();

    if (!asset) {
        return c.body('asset should be specified!', 400);
    }

    asset = asset.replace(/\s/g, '+');

    const fromDate = dayjs().subtract(30, 'day').toISOString();
    const toDate = dayjs().toISOString();

    const perpStats = await getAssetStats(asset, fromDate, toDate, true);

    return c.json(perpStats);
});

try {
    serve({
        fetch: app.fetch,
        port: process.env.WEB_PORT || 3000,
    });

    await checkAndInitiateJob();
} catch (error) {
    console.error('Error on application start: ', error);
}
