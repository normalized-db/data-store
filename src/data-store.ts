import { Depth, ISchema, NormalizedData, ValidKey } from '@normalized-db/core';
import { IDataStore } from './data-store-interface';
import { HistoryRange } from './model/history-range';
import { LogHistory } from './model/log-history';
import { Range } from './model/range';

export class DataStore implements IDataStore {

  constructor(protected readonly schema: ISchema,
              protected readonly implementation: IDataStore,
              protected readonly useReverseReferences: boolean = false) {
  }

  public getTypes(): Promise<string[]> {
    return Promise.resolve(this.schema.getTypes());
  }

  public getData(): Promise<NormalizedData> {
    return this.implementation.getData();
  }

  public getHistory<Key extends ValidKey, T>(type: string, range?: HistoryRange): Promise<LogHistory<Key, T>> {
    return this.implementation.getHistory<Key, T>(type, range);
  }

  public clearHistory(type: string, range?: HistoryRange): Promise<void> {
    return this.implementation.clearHistory(type, range);
  }

  public count(type: string): Promise<number> {
    return this.implementation.count(type);
  }

  public isEmpty(type: string): Promise<boolean> {
    return this.implementation.isEmpty(type);
  }

  public getKeys<Key extends ValidKey>(type: string, range?: Range): Promise<Key[]> {
    return this.implementation.getKeys<Key>(type, range);
  }

  public getInvertedKeys<Key extends ValidKey>(excludedKeys: Key[], type: string, range?: Range): Promise<Key[]> {
    return this.implementation.getInvertedKeys<Key>(excludedKeys, type, range);
  }

  public hasKey<Key extends ValidKey>(key: Key, type: string): Promise<boolean> {
    return this.implementation.hasKey<Key>(key, type);
  }

  public getAll<T>(type: string, depth?: number | Depth, range?: Range): Promise<T[]> {
    return this.implementation.getAll<T>(type, depth, range);
  }

  public getAllInverted<Key extends ValidKey, T>(excludedKeys: Key[],
                                                 type: string,
                                                 depth?: number | Depth,
                                                 range?: Range): Promise<T[]> {
    return this.implementation.getAllInverted<Key, T>(excludedKeys, type, depth, range);
  }

  public getAllByKeys<Key extends ValidKey, T>(keys: Key[],
                                               type: string,
                                               depth?: number | Depth,
                                               range?: Range): Promise<T[]> {
    return this.implementation.getAllByKeys<Key, T>(keys, type, depth, range);
  }

  public getByKey<Key extends ValidKey, T>(key: Key, type: string, depth?: number | Depth): Promise<T> {
    return this.implementation.getByKey<Key, T>(key, type, depth);
  }

  public async getLatestKey<Key extends ValidKey>(type: string): Promise<Key> {
    return this.implementation.getLatestKey<Key>(type);
  }

  public getOrDefault<Key extends ValidKey, T>(key: Key,
                                               type: string,
                                               defaultResult: T = null,
                                               depth?: number | Depth): Promise<T> {
    return this.implementation.getOrDefault(key, type, defaultResult, depth);
  }

  public async put<T>(data: T | T[], type: string): Promise<void> {
    await this.implementation.put(data, type);
  }

  public remove<Key extends ValidKey>(keys: Key | Key[], type: string): Promise<Key[]> {
    return this.implementation.remove(keys, type);
  }

  public getNested<Key extends ValidKey, T>(key: Key, type: string, field: string, depth?: number | Depth): Promise<T> {
    return this.implementation.getNested<Key, T>(key, type, field, depth);
  }

  public getAllNested<Key extends ValidKey, T>(key: Key,
                                               type: string,
                                               field: string,
                                               depth?: number | Depth,
                                               range?: Range): Promise<T[]> {
    return this.implementation.getAllNested<Key, T>(key, type, field, depth, range);
  }

  public getNestedFromArray<Key extends ValidKey, FieldKey extends ValidKey, T>(key: Key,
                                                                                type: string,
                                                                                field: string,
                                                                                fieldKey: FieldKey,
                                                                                depth?: number | Depth): Promise<T> {
    return this.implementation.getNestedFromArray<Key, FieldKey, T>(key, type, field, fieldKey, depth);
  }

  public getNestedInverted<Key extends ValidKey, T>(key: Key,
                                                    type: string,
                                                    field: string,
                                                    depth?: number | Depth,
                                                    range?: Range): Promise<T[]> {
    return this.implementation.getNestedInverted<Key, T>(key, type, field, depth, range);
  }

  public addNested<Key extends ValidKey, T>(key: Key, type: string, item: T, field: string): Promise<boolean> {
    return this.implementation.addNested<Key, T>(key, type, item, field);
  }

  public removeNested<Key extends ValidKey, T>(key: Key, type: string, nestedItem: T, field: string): Promise<boolean> {
    return this.implementation.removeNested<Key, T>(key, type, nestedItem, field);
  }

  public async getReverse<Key extends ValidKey, T>(key: Key,
                                                   type: string,
                                                   parentType: string,
                                                   depth?: number | Depth,
                                                   range?: Range): Promise<T[]> {
    if (this.useReverseReferences) {
      this.validateType(type);

      const item = await this.getByKey<Key, any>(key, type, 0);

      return '_refs' in item && parentType in item._refs
        ? await this.getAllByKeys<any, T>(Array.from(item._refs[parentType]), parentType, depth, range)
        : [];

    } else {
      throw new Error('This data prefix was not created with `useReverseReferences` set to `true` hence reverse ' +
        'relations cannot be resolved');
    }
  }

  public async getFirstReverse<Key extends ValidKey, T>(key: Key,
                                                        type: string,
                                                        parentType: string,
                                                        depth?: number | Depth): Promise<T> {
    if (this.useReverseReferences) {
      this.validateType(type);

      const item = await this.getByKey<Key, any>(key, type, 0);

      if ('_refs' in item && parentType in item._refs) {
        const it = item._refs[parentType].values().next();
        if (!it.done) {
          return await this.getByKey<ValidKey, T>(it.value, parentType, depth);
        }
      }

      return null;

    } else {
      throw new Error('This data prefix was not created with `useReverseReferences` set to `true` hence reverse ' +
        'relations cannot be resolved');
    }
  }

  public async clear(type?: string): Promise<void> {
    if (type) {
      await this.clearType(type);
    } else {
      await Promise.all(this.schema.getTypes().map(async t => await this.clearType(t)));
    }
  }

  protected async clearType(type: string): Promise<void> {
    await this.implementation.clear(type);
  }

  protected validateType(type: string) {
    if (!this.schema.hasType(type)) {
      throw new Error('Type \'' + type + '\' is not defined');
    }
  }
}
