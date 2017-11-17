import { Depth, NormalizedData, ValidKey } from '@normalized-db/core';
import { HistoryRange } from './model/history-range';
import { LogHistory } from './model/log-history';
import { Range } from './model/range';

export interface IDataStore {

  getTypes(): Promise<string[]>;

  getData(): Promise<NormalizedData>;

  getHistory<Key extends ValidKey, T>(type: string, range?: HistoryRange): Promise<LogHistory<Key, T>>;

  clearHistory(type: string, range?: HistoryRange): Promise<void>;

  count(type: string): Promise<number>;

  isEmpty(type: string): Promise<boolean>;

  getKeys<Key extends ValidKey>(type: string, range?: Range): Promise<Key[]>;

  getInvertedKeys<Key extends ValidKey>(excludedKeys: Key[], type: string, range?: Range): Promise<Key[]>;

  hasKey<Key extends ValidKey>(key: Key, type: string): Promise<boolean>;

  getAll<T>(type: string, depth?: number | Depth, range?: Range): Promise<T[]>;

  getAllInverted<Key extends ValidKey, T>(excludedKeys: Key[],
                                          type: string,
                                          depth?: number | Depth,
                                          range?: Range): Promise<T[]>;

  getAllByKeys<Key extends ValidKey, T>(keys: Key[], type: string, depth?: number | Depth, range?: Range): Promise<T[]>;

  getByKey<Key extends ValidKey, T>(key: Key, type: string, depth?: number | Depth): Promise<T>;

  getLatestKey<Key extends ValidKey>(type: string): Promise<Key>;

  getOrDefault<Key extends ValidKey, T>(key: Key, type: string, defaultResult?: T, depth?: number | Depth): Promise<T>;

  put<T>(data: T | T[], type: string): Promise<void>;

  remove<Key extends ValidKey>(keys: Key | Key[], type: string): Promise<Key[]>;

  getNested<Key extends ValidKey, T>(key: Key, type: string, field: string, depth?: number | Depth): Promise<T>;

  getAllNested<Key extends ValidKey, T>(key: Key,
                                        type: string,
                                        field: string,
                                        depth?: number | Depth,
                                        range?: Range): Promise<T[]>;

  getNestedFromArray<Key extends ValidKey, FieldKey extends ValidKey, T>(key: Key,
                                                                         type: string,
                                                                         field: string,
                                                                         fieldKey: FieldKey,
                                                                         depth?: number | Depth): Promise<T>;

  getNestedInverted<Key extends ValidKey, T>(key: Key,
                                             type: string,
                                             field: string,
                                             depth?: number | Depth,
                                             range?: Range): Promise<T[]>;

  addNested<Key extends ValidKey, T>(key: Key, type: string, item: T, field: string): Promise<boolean>;

  removeNested<Key extends ValidKey, T>(key: Key, type: string, nestedItem: T, field: string): Promise<boolean>;

  clear(type?: string): Promise<void>;
}
