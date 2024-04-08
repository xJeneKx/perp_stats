import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { checkAndInitiateJob } from '../job/job.service.js';
import db from '../common/db/index.js';

const pool = db.getDbInstance();

const app = new Hono();

app.post('/perp-stats', async (c) => {
  const body = await c.req.json();

  if(!body.aa) {
    return c.body('AA address should be specified!', 400);
  }

  //ToDo: Make better query building based on only from or to value
  if(!body.from || !body.to) {
    return c.body('Date range should be specified!', 400);
  }
  
  //ToDo: Move to some perp stats service
  const perpStats = await pool.query(`
      SELECT aa, asset, price, created_at as date 
      FROM perp_stats
      WHERE aa = $1
        AND created_at > $2
        AND created_at < $3
  `, [body.aa, body.from, body.to]);
  
  return c.json(perpStats.rows);
})

try {
  serve(app);

  await checkAndInitiateJob();
} catch (error) {
  console.error('Error on application start: ', error)
}