import db from 'ocore/db.js';

interface PriceStatisticParams {
    perpetualAA: string;
    triggerUnit: string;
    mci: number;
    timestamp: number;
    price: number;
    asset: string;
}

export const savePerpAAPriceStatistic = async (params: PriceStatisticParams): Promise<void> => {
    const {
        perpetualAA,
        mci,
        triggerUnit,
        price,
        asset,
        timestamp
    } = params;

    await db.query(
        `INSERT OR IGNORE INTO perp_price_history(perpetual_aa, mci, trigger_unit, price, asset, timestamp)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [perpetualAA, mci, triggerUnit, price, asset, timestamp],
    );
};

export const getLatestPerpetualAAMci = async (perpetualAA: string): Promise<number> => {
    const mciRows = db.query(`SELECT mci FROM perp_aa_mci WHERE perpetual_aa = ?;`, [perpetualAA]);

    return mciRows.length ? mciRows[0].mci : null;
}

export const getPerpetualAssetStatsByDate = async (asset: string, fromDate: number, toDate: number) => {
    return db.query(`SELECT mci FROM perp_price_history WHERE asset = ? AND timestamp BETWEEN ? AND ?;`, [asset, fromDate, toDate]);
}

export const getPerpetualLastStatsDate = async () => {
    return db.query(`SELECT creation_date FROM perp_price_history ORDER BY rowid DESC LIMIT 1`);
}
