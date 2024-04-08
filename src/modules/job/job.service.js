import { CronJob } from 'cron';
import { receiveAndSavePerpetualStats } from '../perpetual-stats/index.js'

export const checkAndInitiateJob = async () => {
  try {
    const job = new CronJob(
      '0 * * * * *',
      receiveAndSavePerpetualStats,
      null,
      true
    );

    const now = new Date();
    const minutesUntilNextHour = 60 - now.getMinutes();

    if(minutesUntilNextHour > 10) {
      await receiveAndSavePerpetualStats();
    }
  } catch (error) {
    console.error('Error on job initiation: ', error)
  }
};
