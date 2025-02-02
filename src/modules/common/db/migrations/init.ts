import db from 'ocore/db.js';

(async () => {
    try {
        console.log('[Migration]: Starting');

        await db.query(`
            CREATE TABLE IF NOT EXISTS perp_price_history
            (
                trigger_unit    CHAR(44) NOT NULL PRIMARY KEY,
                perpetual_aa    CHAR(32) NOT NULL,
                mci             INT      NOT NULL,
                price           INT      NOT NULL,
                asset    CHAR(44) NOT NULL,
                timestamp       INT      NOT NULL,
                creation_date   INT      NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS perp_aa_mci
            (
                perpetual_aa CHAR(32) NOT NULL PRIMARY KEY,
                mci        INT      NOT NULL
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS perp_reserve_price_aa
            (
                perpetual_aa     CHAR(32) NOT NULL PRIMARY KEY,
                reserve_price_aa CHAR(32) NOT NULL
            );
        `);

        await db.query(`
            CREATE TRIGGER IF NOT EXISTS perp_aa_responses_after_insert
            AFTER INSERT ON perp_price_history
            FOR EACH ROW
            BEGIN
              INSERT OR REPLACE INTO perp_aa_mci (perpetual_aa, mci) VALUES (NEW.perpetual_aa, NEW.mci);
            END;
	    `);

        console.log('[Migration]: Finished');
    } catch (error) {
        console.error('[Migration]: Error', error);
    }
})();
