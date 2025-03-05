import { Injectable, Logger } from '@nestjs/common';
import oDapp from 'odapp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OdappService {
  private readonly logger = new Logger(OdappService.name);
  private odapp: oDapp;

  constructor(private readonly configService: ConfigService) {
    const network = process.env.NETWORK || this.configService.get<string>('NETWORK');
    const endpoint = network === 'mainnet' ? 'https://dapp.obyte.org' : 'https://odapp-t.aa-dev.net';
    this.odapp = new oDapp(endpoint, true);
  }

  /**
   * Get information about AAs that use the given base AAs
   * @param baseAAs Array of base AA addresses
   * @returns Promise with AAs that use the given base AAs along with their vars
   */
  getAAsByBaseAAsWithVars(baseAAs: string[]) {
    return this.odapp.getAAsByBaseAAsWithVars(baseAAs);
  }

  /**
   * Get definitions for multiple AAs
   * @param aas Array of AA addresses
   * @returns Promise with definitions of the AAs
   */
  getDefinitions(aas: string[]) {
    return this.odapp.getDefinitions(aas);
  }

  /**
   * Get definition for a single AA
   * @param aa AA address
   * @returns Promise with definition of the AA
   */
  getDefinition(aa: string) {
    return this.odapp.getDefinition(aa);
  }

  /**
   * Get state variables for multiple AAs
   * @param aas Array of AA addresses
   * @returns Promise with state variables of the AAs
   */
  getAAsStateVars(aas: string[]) {
    return this.odapp.getAAsStateVars(aas);
  }

  /**
   * Get state variables for a single AA
   * @param aa AA address
   * @returns Promise with state variables of the AA
   */
  getAAStateVars(aa: string) {
    return this.odapp.getAAStateVars(aa);
  }

  /**
   * Get data feed values from oracles
   * @param oracles Array of oracle addresses
   * @param feedName Feed name
   * @returns Promise with data feed value
   */
  getDataFeed(oracles: string[], feedName: string) {
    return this.odapp.getDataFeed(oracles, feedName);
  }

  /**
   * Get metadata for assets
   * @param assets Array of asset IDs
   * @returns Promise with assets metadata
   */
  getAssetsMetadata(assets: string[]) {
    return this.odapp.getAssetsMetadata(assets);
  }

  /**
   * Get balances for addresses
   * @param addresses Array of addresses
   * @returns Promise with balances
   */
  getBalances(addresses: string[]) {
    return this.odapp.getBalances(addresses);
  }

  /**
   * Get the native odapp instance
   * This should be used only when absolutely necessary, for methods
   * that are not yet wrapped by this service
   */
  getNativeOdapp(): oDapp {
    return this.odapp;
  }
}
