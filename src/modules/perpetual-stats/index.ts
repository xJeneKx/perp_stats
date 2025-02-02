import network from 'ocore/network.js';
import eventBus from 'ocore/event_bus.js';
import {
    executeGetter,
    getAADefinition,
    getAAsFromBaseAAs, 
    getPerpetualAAHistoricalResponses,
    getTriggerUnitData,
} from '../common/hub-api/hub-api.service';
import {
    readReservePriceAA,
    savePerpAAPriceStatistic,
    savePerpetualReservePriceAA,
} from '../common/db/db';
import { AAResponse } from '../common/hub-api/hub-api.interface';

const getAndSavePerpetualAAHistoricalResponses = async (perpetualAA: string) => {
    const perpetualAAResponses = await getPerpetualAAHistoricalResponses(perpetualAA);

    for (const perpetualAAResponse of perpetualAAResponses) {
        if (!perpetualAAResponse?.response?.responseVars?.price) {
            continue;
        }

        await handleAAResponse(perpetualAAResponse);
    }
};

const subscribeToPerpetualAAResponses = (perpetualAA: string) => {
    network.addLightWatchedAa(perpetualAA, null, console.log);

    eventBus.on('aa_response', async (objResponse: AAResponse)=> {
        if (objResponse?.response?.responseVars?.price) {
            console.log('Intercepted perpetual response with price');
            
            await handleAAResponse(objResponse);
        }
    });
};

const getReservePriceAA = async (perpetualAA: string): Promise<string> => {
    const reservePriceAA = await readReservePriceAA(perpetualAA);

    if (reservePriceAA) {
        return reservePriceAA;
    }

    const definitionResult = await getAADefinition(perpetualAA);

    const definitionReservePriceAA = definitionResult[1].params.reserve_price_aa;

    await savePerpetualReservePriceAA(perpetualAA, definitionReservePriceAA);

    return definitionReservePriceAA;
};

const getReservePrice = async (perpetualAA: string) => {
    const reservePriceAA = await getReservePriceAA(perpetualAA);

    return executeGetter(reservePriceAA, 'get_reserve_price');
};

const handleAAResponse = async (objResponse: AAResponse) => {
    const perpetualAA = objResponse.aa_address;

    const reservePrice = await getReservePrice(perpetualAA);

    const triggerUnitData = await getTriggerUnitData(objResponse.trigger_unit);

    const perpetualPrice = objResponse.response.responseVars.price * reservePrice;

    const priceStatisticParams = {
        perpetualAA,
        triggerUnit: objResponse.trigger_unit,
        mci: objResponse.mci,
        timestamp: objResponse.timestamp,
        price: perpetualPrice,
        asset: triggerUnitData.asset,
    };

    await savePerpAAPriceStatistic(priceStatisticParams);
};

export const receiveAndSavePerpetualAAsResponses = async () => {
    const perpetualAAs = await getAAsFromBaseAAs();

    const responsePromises = [];

    for (const perpetualAA of perpetualAAs) {
        subscribeToPerpetualAAResponses(perpetualAA);

        responsePromises.push(getAndSavePerpetualAAHistoricalResponses(perpetualAA));
    }

    // ToDo: Figure out parallel handling
    await Promise.all(responsePromises);
};
