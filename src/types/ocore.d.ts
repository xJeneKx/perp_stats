/**
 * Type definitions for ocore modules
 * This is a partial type definition to help TypeScript recognize ocore imports
 */

declare module 'ocore/light_wallet' {
  export function setLightVendorHost(hub: string): void;
}

declare module 'ocore/event_bus' {
  const eventBus: {
    on(eventName: string, callback: Function): void;
    once(eventName: string, callback: Function): void;
    removeListener(eventName: string, callback: Function): void;
  };

  export default eventBus;
}

declare module 'ocore/network' {
  export function initWitnessesIfNecessary(ws: any, callback: Function): void;
  export function addLightWatchedAa(aa: string, params: any, callback: Function): void;
  export function requestFromLightVendor(command: string, params: any, callback: Function): void;
}

declare module 'ocore/db' {
  export function takeConnectionFromPool(): Promise<any>;
  export function query(sql: string, params?: any[]): Promise<any[]>;
  export function close(): Promise<void>;
}
