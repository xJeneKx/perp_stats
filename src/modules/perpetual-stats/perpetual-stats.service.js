import getParam from "../../utils/getParam.js";
import { getReservePrice } from "../../services/Prices.js";
import { adjustPrices } from "../../utils/adjustPrices.js";
import {
  getNotDefaultAssetsFromMeta,
  isBrokenPresale,
} from "../../utils/perpUtils.js";


async function getPriceByAssets(aa, assets, varsAndParams) {
  const { state: initialState } = varsAndParams;
  const priceByAsset = {};

  for (const asset of assets) {
    const state = structuredClone(initialState);
    const isAsset0 = state.asset0 === asset;
    const assetInfo = structuredClone(varsAndParams["asset_" + asset]);
    await adjustPrices(asset, assetInfo, state, structuredClone(varsAndParams));
    if (!isAsset0 && !assetInfo) continue;

    const reserve = state.reserve;
    if (!reserve) {
      priceByAsset[asset] = 0;
      continue;
    }

    const coef = state.coef;
    const supply = isAsset0 ? state.s0 : assetInfo.supply;
    const a = isAsset0 ? state.a0 : assetInfo.a;
    priceByAsset[asset] = (coef * coef * a * supply) / reserve;
  }

  return priceByAsset;
}

export async function prepareMetaByAA(metaByAA) {
  const assets = getNotDefaultAssetsFromMeta(metaByAA);
  const presalePeriod = getParam("presale_period", metaByAA);

  const reservePriceAA = metaByAA.reserve_price_aa;
  const { asset0, s0 } = metaByAA.state;

  const assetList = [asset0];
  const amountByAsset = { [asset0]: s0 };

  const reservePrice = await getReservePrice(reservePriceAA);

  const _assets = {};

  for (let asset of assets) {
    const m = metaByAA[`asset_${asset}`];
    if (m.presale && isBrokenPresale(m, presalePeriod)) {
      continue;
    }

    _assets[asset] = {
      ...m,
    };
  }

  for (let asset in _assets) {
    const { supply } = _assets[asset];
    if (!supply) continue;

    amountByAsset[asset] = supply;
    assetList.push(asset);
  }

  const r = await getPriceByAssets(metaByAA.aa, assetList, metaByAA);

  let asset0Price = 0;
  let ps = [];
  for (let asset in r) {
    const amount = amountByAsset[asset];
    const price = r[asset];

    let priceInUSD = amount * price * reservePrice;
    priceInUSD = +priceInUSD.toFixed(2);

    if (asset === asset0) {
      asset0Price = priceInUSD;
    } else {
      ps.push({ price: priceInUSD, asset });
    }
  }

  return {
    aa: metaByAA.aa,
    prices: [
      { price: reservePrice, asset: "reserve" },
      { price: asset0Price, asset: asset0 },
      ...ps,
    ],
  };
}
