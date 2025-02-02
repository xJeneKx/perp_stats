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

export const readReservePriceAA = async (perpetualAA: string): Promise<string> => {
    const reservePriceAARows = await db.query(`SELECT reserve_price_aa FROM perp_reserve_price_aa WHERE perpetual_aa = ?;`, [perpetualAA]);
    
    return reservePriceAARows.length ? reservePriceAARows[0].reserve_price_aa : null;
}

export const savePerpetualReservePriceAA = async (perpetualAA: string, reservePriceAA: string): Promise<void> => {
    await db.query(`INSERT INTO perp_reserve_price_aa(perpetual_aa, reserve_price_aa) VALUES (?, ?);`, [perpetualAA, reservePriceAA]);
}

export const getLatestPerpetualAAMci = async (perpetualAA: string): Promise<number> => {
    const mciRows = db.query(`SELECT mci FROM perp_aa_mci WHERE perpetual_aa = ?;`, [perpetualAA]);

    return mciRows.length ? mciRows[0].mci : null;
}
