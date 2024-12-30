import db from 'ocore/db.js';
import network from 'ocore/network.js';
import { appConfig } from '../common/config/main.configuration.js';

const getAAsFromBaseAAs = async () => {
    const result = await network.requestFromLightVendor(
        'light/get_aas_by_base_aas',
        {
            base_aas: appConfig.obyte.baseAAs,
        },
    );

    return result.map((v) => v.address);
}

const getAAResponses = async (aa) => {
    const latestMci = await db.query(`SELECT mci FROM perp_aa_mci WHERE aa_address = ?;`, [aa]);

    const params = {
        aa,
        order: 'ASC'
    }

    if (latestMci.length) {
        // @ts-ignore
        params.min_mci = latestMci[0].mci;
    }

    return network.requestFromLightVendor(
        'light/get_aa_responses',
        params,
    );
}

const saveAAResponses = async (responses) => {
    for (let aaResponse of responses) {
        const { response_unit, mci, aa_address, trigger_address, bounced, response, objResponseUnit, timestamp } = aaResponse;

        if (!response_unit) {
            continue;
        }

        await db.query(
            `INSERT OR IGNORE INTO perp_aa_responses(response_unit, mci, aa_address, trigger_address, bounced, response, object_response, timestamp) VALUES (?,?,?,?,?,?,?,?);`,
            [response_unit, mci, aa_address, trigger_address, bounced, JSON.stringify(response), JSON.stringify(objResponseUnit), timestamp]
        );
    }
}

const getAndSaveAAResponses = async (aa) => {
    const responses = await getAAResponses(aa);

    if (responses.length) {
        await saveAAResponses(responses);
    }
}

export const receiveAndSavePerpetualAAsResponses = async () => {
    const aas = await getAAsFromBaseAAs();

    const responsePromises = [];

    for (let i = 0; i < aas.length; i++) {
        responsePromises.push(getAndSaveAAResponses(aas[i]));
    }

    await Promise.all(responsePromises);
}

// import odapp from '../common/odapp-client/odapp-client.service.js';
// import { appConfig } from '../common/config/main.configuration.js';
// import {
//     prepareMetaByAA,
//     savePerpetualStatsToDb,
// } from './perpetual-stats.service.js';

// export const receiveAndSavePerpetualStats = async () => {
//     const metaByAA = {};
//     const baseMetaWithVars = await odapp.getAAsByBaseAAsWithVars(
//         appConfig.obyte.baseAAs
//     );
//     const stakingAAs = [];
//
//     for (const baseMeta of baseMetaWithVars) {
//         metaByAA[baseMeta.address] = {
//             aa: baseMeta.address,
//             ...baseMeta.definition[1].params,
//             ...baseMeta.stateVars,
//         };
//
//         stakingAAs.push(baseMeta.stateVars.staking_aa);
//     }
//
//     const [stakingDefs, stakingStateVars] = await Promise.all([
//         odapp.getDefinitions(stakingAAs),
//         odapp.getAAsStateVars(stakingAAs),
//     ]);
//
//     for (const aa in metaByAA) {
//         const meta = metaByAA[aa];
//         meta.stakingParams = stakingDefs[meta.staking_aa][1].params;
//         meta.stakingVars = stakingStateVars[meta.staking_aa];
//     }
//
//     const perpetualStats = [];
//     for (let aa in metaByAA) {
//         perpetualStats.push(await prepareMetaByAA(metaByAA[aa]));
//     }
//
//     await savePerpetualStatsToDb(perpetualStats);
// };
