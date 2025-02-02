import { CronJob } from 'cron';
import { appConfig } from '../common/config/main.configuration.js';
import { receiveAndSavePerpetualAAsResponses } from '../perpetual-stats';
// import { getLastPerpStatDate } from '../perpetual-stats/perpetual-stats.service.js';

// ToDo: method to check if job should be initiated depending on last job date
// const checkJobInitiationOnStart = async () => {
//     const lastStatLogRowDate = await getLastPerpStatDate();
//
//     const lastStatLogDate = new Date(lastStatLogRowDate);
//     const now = new Date();
//
//     const minutesUntilNextHour = 60 - now.getMinutes();
//
//     const hoursFromLastJob = (now - lastStatLogDate) / (1000 * 60 * 60);
//
//     return minutesUntilNextHour > 10 && hoursFromLastJob > 1;
// };

export const checkAndInitiateJob = async () => {
    try {        
        new CronJob(
            appConfig.cronTime,
            receiveAndSavePerpetualAAsResponses,
            null,
            true
        );

        const initiateJobOnStart = true; //await checkJobInitiationOnStart();

        if (initiateJobOnStart) {
            console.log('Starting...');
            await receiveAndSavePerpetualAAsResponses();
        }
    } catch (error) {
        console.error('Job error: ', error);
    }
};
