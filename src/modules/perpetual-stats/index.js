import odapp from "../common/odapp-client/odapp-client.service.js";
import { appConfig } from "../common/config/main.configuration.js";
import { prepareMetaByAA } from "./perpetual-stats.service.js";

// FixMe: migration run
import "../common/db/migrations/init.js"

import db from '../common/db/index.js';

const pool = db.getDbInstance();

const savePerpetualStatsToDb = async (perpetualStats) => {
  const query = 'INSERT INTO perp_stats(aa, price, asset) VALUES ';

  const values = perpetualStats.map((perpetual) => {
    const aa = perpetual.aa;

    const perpetualAssetsPriceValues = [];
    for (const assetPrice of perpetual.prices) {
      perpetualAssetsPriceValues.push(`('${aa}',${assetPrice.price},'${assetPrice.asset}')`)
    }

    return perpetualAssetsPriceValues;
  })

  await pool.query(query + values.join(','));
}

export const receiveAndSavePerpetualStats = async () => {
  const metaByAA = {};
  const baseMetaWithVars = await odapp.getAAsByBaseAAsWithVars(appConfig.obyte.baseAAs);
  const stakingAAs = [];

  for (const baseMeta of baseMetaWithVars) {
    metaByAA[baseMeta.address] = {
      aa: baseMeta.address,
      ...baseMeta.definition[1].params,
      ...baseMeta.stateVars,
    };

    stakingAAs.push(baseMeta.stateVars.staking_aa);
  }

  const [stakingDefs, stakingStateVars] = await Promise.all([
    odapp.getDefinitions(stakingAAs),
    odapp.getAAsStateVars(stakingAAs),
  ]);

  for (const aa in metaByAA) {
    const meta = metaByAA[aa];
    meta.stakingParams = stakingDefs[meta.staking_aa][1].params;
    meta.stakingVars = stakingStateVars[meta.staking_aa];
  }

  const perpetualStats = [];
  for (let aa in metaByAA) {
    perpetualStats.push(await prepareMetaByAA(metaByAA[aa]));
  }

  await savePerpetualStatsToDb(perpetualStats);
}
