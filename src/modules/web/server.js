import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { checkAndInitiateJob } from "../job/job.service.js";
import { getPerpetualStats } from "../perpetual-stats/perpetual-stats.service.js";

const app = new Hono();

// FixMe: migration run
import "../common/db/migrations/init.js";

app.get("/perp-stats", async (c) => {
  const { aa, fromDate, toDate } = c.req.query();

  if (!aa) {
    return c.body("AA address should be specified!", 400);
  }

  if (!fromDate || !toDate) {
    return c.body("Date range should be specified!", 400);
  }

  const perpStats = await getPerpetualStats(aa, fromDate, toDate);

  return c.json(perpStats);
});

try {
  serve(app);

  await checkAndInitiateJob();
} catch (error) {
  console.error("Error on application start: ", error);
}
