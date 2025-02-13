import network from 'ocore/network.js';
import eventBus from 'ocore/event_bus.js';
import {
    getAADefinition,
    getAAsFromBaseAAs,
    getJoint,
    getPerpetualAAHistoricalResponses,
    getReservePrice,
    getTriggerUnitData,
    requestAssetMetadataFromHub,
} from '../common/hub-api/hub-api.service';
import {
    getPerpetualAssetStatsByDate, getPerpetualLastStatsDate,
    savePerpAAPriceStatistic,
} from '../common/db/db';
import { AAResponse, AssetMetadata } from '../common/hub-api/hub-api.interface';

eventBus.on('aa_response', async (objResponse: AAResponse) => {
    if (objResponse?.response?.responseVars?.price) {
        await handleAAResponse(objResponse);
    }
});

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
};

const getDefinition = async (aa: string) => {
    const definitionResult = await getAADefinition(aa);

    return definitionResult[1];
};

const getAssetMetadata = async (asset: string): Promise<AssetMetadata> => {
    if (asset === 'base') {
        return {
            name: 'GBYTE',
            decimals: 9,
            asset,
        };
    }

    try {
        const assetMetadata = await requestAssetMetadataFromHub(asset);

        const jointResult = await getJoint(assetMetadata.metadata_unit);

        const metadata = jointResult.joint.unit.messages.find(
            (item) => item.app === 'data',
        );

        return { ...metadata.payload, asset };
    } catch (e) {
        return null;
    }
};

const handleAAResponse = async (objResponse: AAResponse) => {
    const perpetualAA = objResponse.aa_address;

    const perpetualAADefinition = await getDefinition(perpetualAA);

    const { reserve_price_aa: reservePriceAA, reserve_asset: reserveAsset } = perpetualAADefinition.params;

    const reserveAssetPrice = await getReservePrice(reservePriceAA);

    const triggerUnitData = await getTriggerUnitData(objResponse.trigger_unit);

    const reserveAssetMetadata = await getAssetMetadata(reserveAsset);

    const perpetualPrice = objResponse.response.responseVars.price * (reserveAssetPrice * 10 ** reserveAssetMetadata.decimals);

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

    await Promise.all(responsePromises);
};

export const getPerpetualAssetStats = async (asset: string, fromDate: number, toDate: number) => {
    return getPerpetualAssetStatsByDate(asset, fromDate, toDate);
}

export const getLastPerpStatDate = async (): Promise<string> => {
    const lastStatLogRowDate = await getPerpetualLastStatsDate();
    
    return lastStatLogRowDate[0]?.creation_date || '';
}
