import {
  Depth,
  ISchema,
  isNull,
  IStore,
  IStoreTargetItem,
  NormalizedData,
  Parent,
  UniqueKeyCallback,
  ValidKey
} from '@normalized-db/core';
import { DenormalizerBuilder } from '@normalized-db/denormalizer';
import { Normalizer, NormalizerBuilder } from '@normalized-db/normalizer';
import { Cursor, DB, default as DBFactory, ObjectStore, Transaction, UpgradeDB } from 'idb';
import { LoggingConfig } from '../../builder/model/logging-config';
import { IDataStore } from '../../data-store-interface';
import { HistoryRange } from '../../model/history-range';
import { LogEntry, NestedValue } from '../../model/log-entry';
import { LogHistory } from '../../model/log-history';
import { Range } from '../../model/range';

export class IndexedDb implements IDataStore {

  private static readonly MODE_READ = 'readonly';
  private static readonly MODE_READ_WRITE = 'readwrite';
  private static readonly MODE_VERSION_CHANGE = 'versionchange';

  private readonly normalizer: Normalizer;

  private db: DB;

  constructor(protected readonly schema: ISchema,
              protected readonly uniqueKeyCallback?: UniqueKeyCallback,
              protected readonly logging: LoggingConfig = new LoggingConfig()) {
    this.onUpgradeNeeded = this.onUpgradeNeeded.bind(this);
    this.fetchCallback = this.fetchCallback.bind(this);

    this.normalizer = this.buildNormalizer().build;
  }

  public async open(name: string, version: number, upgrade?: (UpgradeDB) => void): Promise<void> {
    this.db = await DBFactory.open(name, version, upgrade ? upgrade : this.onUpgradeNeeded);
  }

  public getLoggingStore(type: string): string {
    return this.logging.prefix + '_' + type;
  }

  public createLoggingStore(upgradeDb: UpgradeDB, type: string) {
    const loggingStore = upgradeDb.createObjectStore(this.getLoggingStore(type), {
      keyPath: 'id',
      autoIncrement: true
    });

    loggingStore.createIndex('time', 'time');
    loggingStore.createIndex('key', 'key');
  }

  public set isLoggingActive(isActive: boolean) {
    this.logging.isActive = isActive;
  }

  public get isLoggingActive(): boolean {
    return this.logging.isActive;
  }

  public async getHistory<Key extends ValidKey, T>(type: string, range?: HistoryRange): Promise<LogHistory<Key, T>> {
    const loggingStoreName = this.getLoggingStore(type);
    const objectStore = this.db.transaction(loggingStoreName).objectStore(loggingStoreName);
    const history = (range
      ? await objectStore.index('time').getAll(range.idbRange)
      : await objectStore.getAll()) as LogEntry<Key, T>[];

    return history.reduce((result, logEntry) => {
      result.add(logEntry);
      return result;
    }, new LogHistory<Key, T>());
  }

  public async clearHistory(type: string, range?: HistoryRange): Promise<void> {
    const loggingStoreName = this.getLoggingStore(type);
    const loggingStore = this.db.transaction(loggingStoreName, 'readwrite').objectStore(loggingStoreName);
    if (range) {
      loggingStore.iterateCursor(range.idbRange, cursor => {
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      });
    } else {
      await loggingStore.clear();
    }
  }

  public getTypes(): Promise<string[]> {
    return Promise.resolve(this.schema.getTypes());
  }

  public async getData(): Promise<NormalizedData> {
    const types = await this.getTypes();
    const transaction = this.read(...types);
    const result = {};
    await Promise.all(types.map(async type => result[type] = await transaction.objectStore(type).getAll()));

    return result;
  }

  public count(type: string): Promise<number> {
    this.validateType(type);

    return this.read(type)
      .objectStore(type)
      .count();
  }

  public async isEmpty(type: string): Promise<boolean> {
    return (await this.count(type)) === 0;
  }

  public getKeys<Key extends ValidKey>(type: string, range?: Range): Promise<Key[]> {
    this.validateType(type);

    return range
      ? this.iterateRangeCursor(type, range, true)
      : this.read(type).objectStore(type).getAllKeys();
  }

  public async getInvertedKeys<Key extends ValidKey>(excludedKeys: Key[], type: string, range?: Range): Promise<Key[]> {
    this.validateType(type);

    const keys = Array.from(await this.getKeys<Key>(type))
      .filter(key => excludedKeys.indexOf(key) < 0);

    return range ? range.slice(keys) : keys;
  }

  public async hasKey<Key extends ValidKey>(key: Key, type: string): Promise<boolean> {
    this.validateType(type);

    const cursor = await this.read(type)
      .objectStore(type)
      .openKeyCursor(key);

    return !isNull(cursor);
  }

  public async getAll<T>(type: string, depth?: number | Depth, range?: Range): Promise<T[]> {
    this.validateType(type);

    const data = range
      ? await this.iterateRangeCursor(type, range)
      : await this.read(type).objectStore(type).getAll();

    return await this.buildDenormalizer().build.applyAll<T>(data, type, depth);
  }

  public async getAllInverted<Key extends ValidKey, T>(excludedKeys: Key[],
                                                       type: string,
                                                       depth?: number | Depth,
                                                       range?: Range): Promise<T[]> {
    const invertedKeys = await this.getInvertedKeys<Key>(excludedKeys, type, range);

    return this.getAllByKeys<Key, T>(invertedKeys, type);
  }

  public async getAllByKeys<Key extends ValidKey, T>(keys: Key[],
                                                     type: string,
                                                     depth?: number | Depth,
                                                     range?: Range): Promise<T[]> {
    this.validateType(type);

    const rangedKeys = range ? range.slice(keys) : keys;
    const objectStore = this.read(type).objectStore(type);

    const data = [];
    await Promise.all(rangedKeys.map(async key => {
      const cursor = await objectStore.openCursor(key);
      if (cursor) {
        data.push(cursor.value);
      }
    }));

    return await this.buildDenormalizer().build.applyAll<T>(data, type, depth);
  }

  public async getByKey<Key extends ValidKey, T>(key: Key, type: string, depth?: number | Depth): Promise<T> {
    this.validateType(type);

    const cursor = await this.read(type)
      .objectStore(type)
      .openCursor(key);

    if (isNull(cursor) || isNull(cursor.value)) {
      this.notFound(type, key);
    }

    return await this.buildDenormalizer().build.apply<T>(cursor.value, type, depth);
  }

  public async getLatestKey<Key extends ValidKey>(type: string): Promise<Key> {
    this.validateType(type);

    const cursor = await this.read(type)
      .objectStore(type)
      .openCursor(null, 'prevunique');

    return cursor ? cursor.key as Key : null;
  }

  public async getOrDefault<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     defaultResult: T = null,
                                                     depth?: number | Depth): Promise<T> {
    try {
      return await this.getByKey<Key, T>(key, type);
    } catch (error) {
      return defaultResult;
    }
  }

  public async put<T>(data: T | T[], rootType: string): Promise<void> {
    this.validateType(rootType);

    const normalizedData = this.normalizer.apply(data, rootType);

    const types = Object.keys(normalizedData);
    const transaction = this.write(types);
    types.forEach(async type => {
      if (this.isLoggingActive) {
        const config = this.schema.getConfig(type);
        const objectStore = transaction.objectStore(type);
        const loggingStore = transaction.objectStore(this.getLoggingStore(type));
        await Promise.all(normalizedData[type].map(async newValue => {
          let lastModified: Date = null;
          const key = newValue[config.key];
          const cursor = await objectStore.openCursor(key, 'nextunique');
          if ('lastModified' in config) {
            lastModified = this.getLastModified(config, newValue);
            if (cursor && cursor.value[config.lastModified].getTime() >= lastModified.getTime()) {
              await this.persistItem(objectStore, newValue, key, cursor); // due to _refs
              return;
            }
          }

          const logEntry = new LogEntry(type, cursor ? 'update' : 'create', key, newValue, lastModified);

          await this.callPreLog(logEntry); // allow the user to manipulate the entry / new value
          await this.persistItem(objectStore, logEntry.value, logEntry.key, cursor);
          await loggingStore.add(logEntry);
        }));

      } else {
        await this.persist(transaction.objectStore(type), normalizedData[type], type);
      }
    });

    await transaction.complete;
  }

  public async remove<Key extends ValidKey>(keys: Key | Key[], type: string): Promise<Key[]> {
    this.validateType(type);

    const config = this.schema.getConfig(type);
    const keysArray: Key[] = Array.isArray(keys) ? keys : [keys];

    const transaction = this.write(type);
    const objectStore = transaction.objectStore(type);
    const loggingStore = this.isLoggingActive ? transaction.objectStore(this.getLoggingStore(type)) : null;
    const removedKeys = [];
    keysArray.forEach(async key => {
      const cursor = await objectStore.openCursor(key);
      if (cursor) {
        if (!isNull(config.targets)) {
          const item = cursor.value;
          const parent = new Parent(key, type);
          Object.keys(config.targets)
            .filter(field => field in item)
            .forEach(async field => await this.removeTarget(parent, item[field], config.targets[field]));
        }

        if (this.isLoggingActive) {
          const logEntry = new LogEntry(type, 'remove', cursor.value[config.key]);
          await cursor.delete();
          await loggingStore.add(logEntry);
        } else {
          await cursor.delete();
        }

        removedKeys.push(key);
      }
    });

    await transaction.complete;

    return removedKeys;
  }

  public async getNested<Key extends ValidKey, T>(key: Key,
                                                  type: string,
                                                  field: string,
                                                  depth?: number | Depth): Promise<T> {
    const item = await this.getByKey<Key, any>(key, type, 0);
    if (field in item) {
      const targetItem = this.schema.getTargetItem(type, field);
      if (targetItem.isArray) {
        throw new Error('\'' + type + '#' + field + '\' is an array. Use `getAllNested` instead');
      }

      const targetConfig = this.schema.getTargetConfig(type, field);
      return await this.buildDenormalizer().build.applyKey<Key, T>(item[field], targetConfig.type, depth);
    } else {
      return null;
    }
  }

  public async getAllNested<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     field: string,
                                                     depth?: number | Depth,
                                                     range?: Range): Promise<T[]> {
    const item = await this.getByKey<Key, any>(key, type, 0);
    if (field in item) {
      const targetItem = this.schema.getTargetItem(type, field);
      if (!targetItem.isArray) {
        throw new Error('\'' + type + '#' + field + '\' is a single object. Use `getNested` instead');
      }

      const targetConfig = this.schema.getTargetConfig(type, field);
      const keys = range ? range.slice(item[field]) : item[field];
      return await this.buildDenormalizer().build.applyAllKeys<Key, T>(keys, targetConfig.type, depth);
    } else {
      return [];
    }
  }

  public async getNestedFromArray<Key extends ValidKey, FieldKey extends ValidKey, T>(key: Key,
                                                                                      type: string,
                                                                                      field: string,
                                                                                      fieldKey: FieldKey,
                                                                                      depth?: number | Depth): Promise<T> {
    const item = await this.getByKey<Key, any>(key, type, 0);
    if (field in item) {
      const targetItem = this.schema.getTargetItem(type, field);
      if (!targetItem.isArray) {
        throw new Error('\'' + type + '#' + field + '\' is an object. Use `getNested` instead');
      }

      const targetConfig = this.schema.getTargetConfig(type, field);
      return await this.buildDenormalizer().build.applyKey<Key, T>(
        item[field].find(itemKey => itemKey === fieldKey),
        targetConfig.type,
        depth
      );
    } else {
      return null;
    }
  }

  public async getNestedInverted<Key extends ValidKey, T>(key: Key,
                                                          type: string,
                                                          field: string,
                                                          depth?: number | Depth,
                                                          range?: Range): Promise<T[]> {
    const targetItem = this.schema.getTargetItem(type, field);
    const transaction = this.read(type, targetItem.type);
    const cursor = await transaction.objectStore(type).openCursor(key, 'nextunique');
    if (cursor) {
      const excludedKeys = targetItem.isArray ? cursor.value[field] : [cursor.value[field]];

      return this.getAllInverted<any, T>(excludedKeys, targetItem.type, depth, range);
    } else {
      this.notFound(type, key);
    }
  }

  public async addNested<Key extends ValidKey, T>(key: Key,
                                                  type: string,
                                                  nestedItem: T,
                                                  field: string): Promise<boolean> {
    try {
      const targetConfig = this.schema.getTargetConfig(type, field);
      await this.put<T>(nestedItem, targetConfig.type);

      let nestedKey = nestedItem[targetConfig.key];
      if (isNull(nestedKey)) {
        nestedItem[targetConfig.key] = nestedKey = await this.getLatestKey(targetConfig.type);
      }

      const transaction = await this.write(type);
      const cursor = await transaction.objectStore(type).openCursor(key);
      if (cursor) {
        const item = cursor.value;
        const targetItem = this.schema.getTargetItem(type, field);
        if (targetItem.isArray) {
          if (field in item) {
            item[field].push(nestedItem[targetConfig.key]);
          } else {
            item[field] = [];
          }
        } else {
          item[field] = nestedItem[targetConfig.key];
        }

        await cursor.update(item);

        if (this.isLoggingActive) {
          const nestedValue = new NestedValue<Key>(key, nestedKey, field, targetConfig.type);
          const logEntry = new LogEntry(type, 'addNested', key, nestedValue);
          await transaction.objectStore(this.getLoggingStore(type)).add(logEntry);
        }
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  public async removeNested<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     nestedItem: T,
                                                     field: string): Promise<boolean> {
    try {
      const targetConfig = this.schema.getTargetConfig(type, field);
      const nestedKey = nestedItem[targetConfig.key];

      const targetItem = this.schema.getTargetItem(type, field);
      if (targetItem.cascadeRemoval) {
        const removedKeys = await this.remove(nestedKey, targetItem.type);
        if (removedKeys.length !== 1) {
          return false;
        }
      } else {
        await this.persistRemoveNested(nestedKey, targetItem.type, new Parent(key, type));
      }

      const transaction = this.write(type);
      const cursor = await transaction.objectStore(type).openCursor(key);
      if (cursor) {
        const item = cursor.value;
        if (field in item) {
          const log = async () => {
            if (this.isLoggingActive) {
              const nestedValue = new NestedValue<Key>(key, nestedKey, field, targetItem.type);
              const logEntry = new LogEntry(type, 'removedNested', key, nestedValue);
              await transaction.objectStore(this.getLoggingStore(type)).add(logEntry);
            }
          };

          if (targetItem.isArray) {
            const index = item[field].findIndex(nk => nk === nestedKey);
            if (index >= 0) {
              item[field].splice(index, 1);
              await cursor.update(item);
              await log();
            }
          } else {
            item[field] = null;
            await cursor.update(item);
            await log();
          }
        }
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  public async clear(type?: string): Promise<void> {
    if (type) {
      this.validateType(type);

      if (this.isLoggingActive) {
        const transaction = this.write(type);
        await Promise.all([
          transaction.objectStore(type).clear(),
          transaction.objectStore(this.getLoggingStore(type)).clear()
        ]);
      } else {
        await this.write(type).objectStore(type).clear();
      }

    } else {
      await DBFactory.delete(this.db.name);
    }
  }

  protected buildNormalizer(): NormalizerBuilder {
    return new NormalizerBuilder()
      .withSchema(this.schema)
      .withUniqueKeyCallback(this.uniqueKeyCallback);
  }

  protected buildDenormalizer(): DenormalizerBuilder {
    return new DenormalizerBuilder()
      .withSchema(this.schema)
      .withFetchCallback(this.fetchCallback);
  }

  protected read(...storeNames: string[]): Transaction {
    return this.db.transaction(storeNames, IndexedDb.MODE_READ);
  }

  protected write(storeNames: string | string[]): Transaction {
    if (!this.isLoggingActive) {
      return this.db.transaction(storeNames, IndexedDb.MODE_READ_WRITE);
    } else if (Array.isArray(storeNames)) {
      const stores = storeNames.map(type => [type, this.getLoggingStore(type)])
        .reduce((result, type) => {
          result.push(...type);
          return result;
        }, []);
      return this.db.transaction(stores, IndexedDb.MODE_READ_WRITE);
    } else {
      return this.db.transaction(
        [storeNames, this.getLoggingStore(storeNames)],
        IndexedDb.MODE_READ_WRITE
      );
    }
  }

  protected async persist(objectStore: ObjectStore, data: any[], type: string): Promise<void> {
    const config = this.schema.getConfig(type);
    await Promise.all(data.map(async item => item[config.key] = await objectStore.put(item)));
  }

  protected async persistItem(objectStore: ObjectStore, item: any, key: ValidKey, cursor?: Cursor): Promise<void> {
    if (cursor) {
      await cursor.update(item);
    } else {
      await objectStore.put(item);
    }
  }

  protected async persistRemoveNested(key: ValidKey, type: string, parent: Parent): Promise<void> {
    // dummy
  }

  protected async removeTarget(parent: Parent, keys: ValidKey | ValidKey[], target: IStoreTargetItem): Promise<void> {
    if (target.cascadeRemoval === true) {
      await this.remove(keys, target.type);
    }
  }

  protected async iterateRangeCursor(type: string, range: Range, keyOnly: boolean = false): Promise<any[]> {
    const transaction = this.read(type);
    const data = [];
    let hasSkipped = false;
    let i = 0;
    transaction.objectStore(type).iterateCursor(cursor => {
      if (!cursor) {
        return;
      }

      if (range.offset > 0 && !hasSkipped) {
        cursor.advance(range.offset);
        hasSkipped = true;
        return;
      }

      data.push(keyOnly ? cursor.key : cursor.value);
      if (++i < range.limit) {
        cursor.continue();
      }
    });

    await transaction.complete;
    return data;
  }

  protected getLastModified(config: IStore, item: any): Date {
    if (config.lastModified in item) {
      return item[config.lastModified];
    } else {
      const now = new Date();
      item[config.lastModified] = now;
      return now;
    }
  }

  protected notFound(type: string, key: IDBValidKey) {
    throw new Error('Could not find \'' + type + '\' with key \'' + String(key) + '\'');
  }

  private onUpgradeNeeded(upgradeDb: UpgradeDB) {
    this.schema.getTypes().forEach(type => {
      this.createLoggingStore(upgradeDb, type);

      const config = this.schema.getConfig(type);
      upgradeDb.createObjectStore(type, { keyPath: config.key });
    });
  }

  private async fetchCallback(keys: ValidKey, type: string): Promise<any | any[]> {
    if (isNull(keys)) {
      return null;
    }

    if (Array.isArray(keys)) {
      const objectStore = this.read(type).objectStore(type);
      return Promise.all(keys.map(async key => await objectStore.getKey(key)));

    } else {
      return this.read(type)
        .objectStore(type)
        .get(keys);
    }
  }

  private async callPreLog(logEntry: LogEntry<ValidKey, any>): Promise<void> {
    if (this.logging.preCallback) {
      return await this.logging.preCallback(logEntry);
    }
  }

  private validateType(type: string) {
    if (!this.schema.hasType(type)) {
      throw new Error('Type \'' + type + '\' is not defined');
    }
  }
}
