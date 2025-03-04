import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lightWallet from 'ocore/light_wallet';
import eventBus from 'ocore/event_bus';
import { initWitnessesIfNecessary, addLightWatchedAa } from 'ocore/network';

@Injectable()
export class ObyteNetworkService implements OnModuleInit {
  private readonly logger = new Logger(ObyteNetworkService.name);
  private isFirstConnect = true;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Obyte network connection...');
    await this.initiateObyteNetwork();
  }

  private async initiateObyteNetwork(): Promise<void> {
    return new Promise<void>(resolve => {
      const hub = process.env.NETWORK === 'testnet' ? 'obyte.org/bb-test' : 'obyte.org/bb';
      this.logger.log(`Connecting to Obyte hub: ${hub}`);

      // Using lightWallet's setLightVendorHost which relies on conf.js being in the root directory
      lightWallet.setLightVendorHost(hub);

      eventBus.on('connected', async ws => {
        await this.initWitnesses(ws);

        if (this.isFirstConnect) {
          this.isFirstConnect = false;
          this.logger.log('Successfully connected to Obyte network');
          resolve();
          return;
        }

        this.logger.log('Reconnected to hub, resubscribing to AAs...');
        await this.handleReconnect();
      });
    });
  }

  private async initWitnesses(ws: any): Promise<void> {
    return new Promise<void>(resolve => {
      initWitnessesIfNecessary(ws, () => resolve());
    });
  }

  private async handleReconnect(): Promise<void> {
    const baseAAs = this.configService.get<string[]>('obyte.baseAAs', []);
    const aas = await this.getAAsFromBaseAAs(baseAAs);
    this.subscribeToAAs(aas);
  }

  async getAAsFromBaseAAs(baseAAs: string[]): Promise<string[]> {
    try {
      const result = await this.requestFromOcore('light/get_aas_by_base_aas', {
        base_aas: baseAAs,
      });
      return result.map((v: any) => v.address);
    } catch (error) {
      this.logger.error(`Failed to get AAs from base AAs: ${error.message}`);
      return [];
    }
  }

  subscribeToAAs(aas: string[]): void {
    for (const aa of aas) {
      addLightWatchedAa(aa, null, (err: any) => {
        if (err) {
          this.logger.error(`Failed to subscribe to AA ${aa}: ${err}`);
        } else {
          this.logger.log(`Subscribed to AA ${aa}`);
        }
      });
    }
  }

  async requestFromOcore(command: string, params?: any): Promise<any> {
    // This would normally use the request utility, simplified for this example
    const requestFromLightVendor = require('ocore/network').requestFromLightVendor;

    return new Promise((resolve, reject) => {
      requestFromLightVendor(command, params, (ws: any, request: any, response: any) => {
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response);
      });
    });
  }
}
