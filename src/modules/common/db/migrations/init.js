import db from 'ocore/db.js';

(async ()=> {
    try {
        console.log('start init migration');

        await db.query(`
		CREATE TABLE IF NOT EXISTS perp_aa_responses (
			response_unit CHAR(44) NOT NULL PRIMARY KEY,
			mci INT NOT NULL,
			aa_address CHAR(32) NOT NULL,
			trigger_address CHAR(32) NOT NULL,
			bounced TINYINT NOT NULL,
			response TEXT NULL,
			object_response TEXT NULL,
			timestamp INT NOT NULL,
			creation_date INT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);

        await db.query(`
		CREATE TABLE IF NOT EXISTS perp_aa_mci (
			aa_address CHAR(32) NOT NULL PRIMARY KEY,
			mci INT NOT NULL
		);
	`);

        await db.query(`
		CREATE TRIGGER IF NOT EXISTS perp_aa_responses_after_insert
		AFTER INSERT ON perp_aa_responses
		FOR EACH ROW
		BEGIN
		  INSERT OR REPLACE INTO perp_aa_mci (aa_address, mci) VALUES (NEW.aa_address, NEW.mci);
		END;
	`);

        console.log('finished init migration');
    } catch (error) {
        console.error('Error on init migration: ', error);
    }
})()
