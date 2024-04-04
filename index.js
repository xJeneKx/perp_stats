import odapp from "./src/services/ODappClient.js";
import { baseAAs } from "./src/config.js";
import { prepareMetaByAA } from "./src/services/perpService.js";

async function init() {
  const metaByAA = {};
  const baseMetaWithVars = await odapp.getAAsByBaseAAsWithVars(baseAAs);
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

  const result = [];
  for (let aa in metaByAA) {
    result.push(await prepareMetaByAA(metaByAA[aa]));
  }

  saveToDB(result);
}

init();

function saveToDB(result) {
  console.log(JSON.stringify(result, null, 2));
}
