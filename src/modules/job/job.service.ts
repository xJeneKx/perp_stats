import { CronJob } from 'cron';
import { appConfig } from '../common/config/main.configuration.js';
import { getLastPerpStatDate, receiveAndSavePerpetualAAsResponses } from '../perpetual-stats/perpetual-stats.service';

const checkJobInitiationOnStart = async () => {
    const lastStatLogRowDate = await getLastPerpStatDate();
    
    if (lastStatLogRowDate) {
        return false;
    }

    const lastStatLogDate = new Date(lastStatLogRowDate);
    const now = new Date();

    const minutesUntilNextHour = 60 - now.getMinutes();

    const hoursFromLastJob = (now.getTime() - lastStatLogDate.getTime()) / (1000 * 60 * 60);

    return minutesUntilNextHour > 10 && hoursFromLastJob > 1;
};

export const checkAndInitiateJob = async () => {
    try {        
        new CronJob(
            appConfig.cronTime,
            receiveAndSavePerpetualAAsResponses,
            null,
            true
        );

        const initiateJobOnStart = await checkJobInitiationOnStart();

        if (initiateJobOnStart) {
            await receiveAndSavePerpetualAAsResponses();
        }
    } catch (error) {
        console.error('Job error: ', error);
    }
};
