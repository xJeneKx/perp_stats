import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as db from 'ocore/db';
import { PerpPriceDto } from './dto/perp-price.dto';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

@Injectable()
export class PerpPriceRepository {
  private readonly logger = new Logger(PerpPriceRepository.name);

  async savePrice(data: PerpPriceDto): Promise<boolean> {
    try {
      await db.query(
        `INSERT OR IGNORE INTO perp_price_history 
        (aa_address, mci, asset, not_for_use, price, price_from_response, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.aaAddress, data.mci, data.asset, data.notForUse ? 1 : 0, data.price, data.priceFromResponse, data.timestamp],
      );

      return true;
    } catch (error) {
      this.logger.error(`Error saving price data: ${error.message}`, error.stack);
      return false;
    }
  }

  async getLastMci(): Promise<number> {
    try {
      const rows = await db.query('SELECT mci as last_mci FROM perp_price_history ORDER BY mci DESC LIMIT 1');
      return rows[0]?.last_mci || 0;
    } catch (error) {
      this.logger.error(`Error getting last MCI: ${error.message}`, error.stack);
      return 0;
    }
  }

  async getLastWeekPrices(asset: string, tzOffset?: string): Promise<any[]> {
    try {
      const tzOffsetInHours = tzOffset ? Number(tzOffset) / 60 : 0;

      const startTimestamp = dayjs()
        .utc()
        .subtract(7, 'day')
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0)
        .subtract(-tzOffsetInHours, 'hour')
        .unix();

      const query = `
        SELECT 
          aa_address, mci, asset, not_for_use, price, price_from_response, timestamp
        FROM perp_price_history
          WHERE asset = ? AND timestamp >= ?
        ORDER BY timestamp ASC
      `;

      return await db.query(query, [asset, startTimestamp]);
    } catch (error) {
      this.logger.error(`Error getting last week's prices: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve last week price data');
    }
  }

  async getLastMonthPrices(asset: string): Promise<any[]> {
    try {
      const startTimestamp = dayjs().utc().subtract(30, 'day').unix();
      this.logger.log(`Getting last month prices for asset: ${asset} from timestamp: ${startTimestamp}`);

      const query = `
        SELECT 
          aa_address, mci, asset, not_for_use, price, price_from_response, timestamp
        FROM perp_price_history
        WHERE asset = ? 
        AND timestamp >= ?
        AND timestamp IN (
          SELECT MIN(timestamp)
          FROM perp_price_history
          WHERE asset = ?
          AND timestamp >= ?
          GROUP BY date(timestamp, 'unixepoch')
        )
        ORDER BY timestamp ASC
      `;

      this.logger.log(`Executing query for getLastMonthPrices`);
      const result = await db.query(query, [asset, startTimestamp, asset, startTimestamp]);

      this.logger.log(`getLastMonthPrices result type: ${typeof result},isArray: ${Array.isArray(result)}, length: ${result?.length || 0}`);

      if (!Array.isArray(result) && result) {
        this.logger.log(`Converting non-array result to array: ${JSON.stringify(result)}`);
        return [result];
      }

      return result || [];
    } catch (error) {
      this.logger.error(`Error getting last month's prices: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve last month price data');
    }
  }

  async getUniqNotSwapPyth(): Promise<string[]> {
    try {
      const rows = await db.query('SELECT DISTINCT aa_address FROM perp_price_history WHERE not_for_use = 0');
      return rows.map((row: { aa_address: string }) => row.aa_address);
    } catch (error) {
      this.logger.error(`Error getting unique not swap assets: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve unique not swap assets');
    }
  }

  async getAssetsByPyth(pyth: string): Promise<string[]> {
    try {
      const rows = await db.query('SELECT DISTINCT asset FROM perp_price_history WHERE aa_address = ?', [pyth]);
      return rows.map((row: { asset: string }) => row.asset);
    } catch (error) {
      this.logger.error(`Error getting assets by Pyth: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve assets by Pyth');
    }
  }

  async getLastPriceFromResponse(pyth: string, asset: string): Promise<number> {
    try {
      const rows = await db.query(
        `SELECT price_from_response FROM perp_price_history 
        WHERE aa_address = ? AND asset = ? 
        ORDER BY timestamp DESC LIMIT 1`,
        [pyth, asset],
      );
      return rows[0]?.price_from_response || 0;
    } catch (error) {
      this.logger.error(`Error getting last price from response for Pyth: ${pyth}, asset: ${asset}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve last price from response');
    }
  }

  async getTimestampByMci(mci: number): Promise<number> {
    try {
      const rows = await db.query('SELECT timestamp FROM perp_price_history WHERE mci = ? ORDER BY timestamp DESC LIMIT 1', [mci]);
      return rows[0]?.timestamp || 0;
    } catch (error) {
      this.logger.error(`Error getting timestamp by mci ${mci}: ${error.message}`, error.stack);
      return 0;
    }
  }

  async savePricesInBulk(records: PerpPriceDto[]): Promise<boolean> {
    if (records.length === 0) return true;
    const conn = await db.takeConnectionFromPool();
    try {
      await conn.query(`BEGIN TRANSACTION`);

      for (const data of records) {
        await conn.query(
          `INSERT OR IGNORE INTO perp_price_history 
          (aa_address, mci, asset, not_for_use, price, price_from_response, timestamp) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [data.aaAddress, data.mci, data.asset, data.notForUse ? 1 : 0, data.price, data.priceFromResponse, data.timestamp],
        );
      }

      await conn.query(`COMMIT`);
      this.logger.log(`Successfully saved ${records.length} price records in bulk`);
      return true;
    } catch (error) {
      await conn.query(`ROLLBACK`);
      this.logger.error(`Error saving prices in bulk: ${error.message}`, error.stack);
      return false;
    } finally {
      conn.release();
    }
  }
}
