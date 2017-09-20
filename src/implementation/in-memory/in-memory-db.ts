import {
  deepClone,
  Depth,
  ISchema,
  isNull,
  IStoreTargetItem,
  KeyMap,
  NormalizedData,
  Parent,
  Queue,
  UniqueKeyCallback,
  ValidKey
} from '@normalized-db/core';
import { Denormalizer, DenormalizerBuilder } from '@normalized-db/denormalizer';
import { Normalizer, NormalizerBuilder } from '@normalized-db/normalizer';
import { IDataStore } from '../../data-store-interface';
import { HistoryRange } from '../../model/history-range';
import { LogHistory } from '../../model/log-history';
import { Range } from '../../model/range';

export class InMemoryDb implements IDataStore {

  protected readonly data: NormalizedData = {};
  protected readonly keys: KeyMap = {};

  private readonly normalizer: Normalizer;
  private readonly denormalizer: Denormalizer;

  private readonly freeIndices: { [type: string]: Queue<number> } = {}; // saves indices of removed objects to preserve
                                                                        // indices in `#keys`

  constructor(private readonly schema: ISchema,
              private readonly uniqueKeyCallback?: UniqueKeyCallback) {
    this.normalizer = this.buildNormalizer().build;
    this.denormalizer = this.buildDenormalizer().build;

    this.schema.getTypes().forEach(type => this.freeIndices[type] = new Queue<number>());
  }

  public getTypes(): Promise<string[]> {
    return Promise.resolve(this.schema.getTypes());
  }

  public async getData(): Promise<NormalizedData> {
    return deepClone(this.data);
  }

  public getHistory<Key extends ValidKey, T>(type: string, range?: HistoryRange): Promise<LogHistory<Key, T>> {
    throw new Error('This data store does not implement a logging history');
  }

  public clearHistory(type: string, range?: HistoryRange): Promise<void> {
    throw new Error('This data store does not implement a logging history');
  }

  public async count(type: string): Promise<number> {
    this.validateType(type);

    const keys = this.keys[type];

    return isNull(keys) ? 0 : this.keys[type].size;
  }

  public async isEmpty(type: string): Promise<boolean> {
    const length = await this.count(type);
    return length === 0;
  }

  public async getKeys<Key extends ValidKey>(type: string, range?: Range): Promise<Key[]> {
    this.validateType(type);

    const keys = Array.from(this.keys[type].keys());
    return range ? range.slice(keys) : keys;
  }

  public async getInvertedKeys<Key extends ValidKey>(excludedKeys: Key[], type: string, range?: Range): Promise<Key[]> {
    this.validateType(type);

    const keys = Array.from(this.keys[type].keys())
      .filter(key => excludedKeys.indexOf(key) < 0);

    return range ? range.slice(keys) : keys;
  }

  public async hasKey<Key extends ValidKey>(key: Key, type: string): Promise<boolean> {
    this.validateType(type);

    return this.keys[type].has(key);
  }

  public getAll<T>(type: string, depth?: number | Depth, range?: Range): Promise<T[]> {
    return this.denormalizer.applyAll<T>(deepClone(this.data[type]), type, depth);
  }

  public async getAllInverted<Key extends ValidKey, T>(excludedKeys: Key[],
                                                       type: string,
                                                       depth?: number | Depth,
                                                       range?: Range): Promise<T[]> {
    const invertedKeys = await this.getInvertedKeys<Key>(excludedKeys, type, range);

    return this.getAllByKeys<Key, T>(invertedKeys, type);
  }

  public getAllByKeys<Key extends ValidKey, T>(keys: Key[],
                                               type: string,
                                               depth?: number | Depth,
                                               range?: Range): Promise<T[]> {
    this.validateType(type);

    return Promise.all(keys.map(async key => await this.getByKey<Key, T>(key, type, depth)));
  }

  public async getByKey<Key extends ValidKey, T>(key: Key, type: string, depth?: number | Depth): Promise<T> {
    this.validateType(type);

    const result = await this.getOrDefault<Key, T>(key, type, null, depth);
    if (!result) {
      throw new Error('Could not find \'' + type + '\' with key \'' + String(key) + '\'');
    }

    return result;
  }

  public async getLatestKey<Key extends ValidKey>(type: string): Promise<Key> {
    this.validateType(type);

    if (this.isEmpty(type)) {
      return null;
    } else {
      const config = this.schema.getConfig(type);
      return this.data[type][this.data[type].length - 1][config.key];
    }
  }

  public async getOrDefault<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     defaultResult: T = null,
                                                     depth?: number | Depth): Promise<T> {
    this.validateType(type);

    const typeKeys = this.keys[type];
    if (!isNull(typeKeys) && typeKeys.has(key)) {
      const item = deepClone(this.data[type][typeKeys.get(key)]);
      if (depth && depth <= 0) {
        return item;
      } else {
        return await this.denormalizer.apply<T>(item, type, depth);
      }
    } else {
      return defaultResult;
    }
  }

  public async put<T>(data: T | T[], rootType: string): Promise<void> {
    const newData: NormalizedData = this.normalizer.apply(data, rootType);

    Object.keys(newData).forEach(type => {
      const config = this.schema.getConfig(type);
      const items = newData[type];

      if (type in this.data) {
        const typeKeys = this.keys[type];
        const typeResult = this.data[type];

        items.forEach(item => {
          const key = item[config.key];

          if (typeKeys.has(key)) {
            this.overrideItem(typeResult, typeKeys.get(key), item);

          } else {
            const typeFreeIndices = this.freeIndices[type];
            if (typeFreeIndices && !typeFreeIndices.isEmpty) {
              const index = typeFreeIndices.dequeue();
              typeKeys.set(key, index);
              typeResult[index] = item;
            } else {
              typeKeys.set(key, typeResult.length);
              typeResult.push(item);
            }
          }
        });

      } else {
        this.data[type] = items;
        this.keys[type] = new Map(items.map<[any, number]>((item, index) => [
          item[config.key],
          index
        ]));
      }
    });
  }

  public async remove<Key extends ValidKey>(keys: Key | Key[], type: string): Promise<Key[]> {
    this.validateType(type);

    const config = this.schema.getConfig(type);
    const typeKeys = this.keys[type];

    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    return keys.filter(key => typeKeys.has(key)).map(key => {
      const index = typeKeys.get(key);
      if (!isNull(config.targets)) {
        const item = this.data[type][index];
        const parent = new Parent(key, type);
        Object.keys(config.targets)
          .filter(field => field in item)
          .forEach(async field => await this.removeTarget(parent, item[field], config.targets[field]));
      }

      this.data[type][index] = {};
      this.freeIndices[type].enqueue(index);
      typeKeys.delete(key);

      return key;
    });
  }

  public async getNested<Key extends ValidKey, T>(key: Key,
                                                  type: string,
                                                  field: string,
                                                  depth?: number | Depth): Promise<T> {
    return null;
  }

  public async getAllNested<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     field: string,
                                                     depth?: number | Depth,
                                                     range?: Range): Promise<T[]> {
    return [];
  }

  public async getNestedFromArray<Key extends ValidKey, FieldKey extends ValidKey, T>(key: Key,
                                                                                      type: string,
                                                                                      field: string,
                                                                                      fieldKey: FieldKey,
                                                                                      depth?: number | Depth): Promise<T> {
    return null;
  }

  public async getNestedInverted<Key extends ValidKey, T>(key: Key,
                                                          type: string,
                                                          field: string,
                                                          depth?: number | Depth,
                                                          range?: Range): Promise<T[]> {
    return [];
  }

  public async addNested<Key extends ValidKey, T>(key: Key, type: string, item: T, field: string): Promise<void> {
    return null;
  }

  public async removeNested<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     nestedItem: T,
                                                     field: string): Promise<boolean> {
    return null;
  }

  public async clear(type?: string): Promise<void> {
    if (type) {
      await this.clearType(type);
    } else {
      this.schema.getTypes().forEach(async t => await this.clearType(t));
    }
  }

  protected overrideItem(typeResult: any[], index: number, item: any) {
    typeResult[index] = item;
  }

  protected async removeTarget(parent: Parent, key: ValidKey | ValidKey[], target: IStoreTargetItem): Promise<void> {
    if (target.cascadeRemoval === true) {
      await this.remove(key, target.type);
    }
  }

  protected async clearType(type: string): Promise<void> {
    this.validateType(type);

    if (this.keys[type]) {
      this.keys[type].clear();
    }

    if (this.data[type]) {
      this.data[type] = [];
    }

    this.freeIndices[type].clear();
  }

  protected buildNormalizer(): NormalizerBuilder {
    return new NormalizerBuilder()
      .withSchema(this.schema)
      .withUniqueKeyCallback(this.uniqueKeyCallback);
  }

  protected buildDenormalizer(): DenormalizerBuilder {
    return new DenormalizerBuilder()
      .withSchema(this.schema)
      .withNormalizedData(this.data)
      .withKeys(this.keys);
  }

  protected validateType(type: string) {
    if (!this.schema.hasType(type)) {
      throw new Error('Type \'' + type + '\' is not defined');
    }
  }
}
