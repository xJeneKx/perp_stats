import { Injectable, Logger } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheItem<any>>();
  
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    this.logger.debug(`Cache hit for key: ${key}`);
    return item.value as T;
  }
  
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
    });
    
    this.logger.debug(`Cache set for key: ${key}`);
  }
  
  async getOrSet<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    this.logger.debug(`Cache miss for key: ${key}, fetching data`);
    const value = await factory();
    this.set(key, value);
    return value;
  }
}