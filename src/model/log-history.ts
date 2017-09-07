import { ValidKey } from '@normalized-db/core';
import { LogEntry } from './log-entry';

export class LogHistory<Key extends ValidKey, T> {

  private readonly map: Map<Key, LogEntry<Key, T>[]> = new Map<Key, LogEntry<Key, T>[]>();

  public entries(key?: Key) {
    if (key) {
      return this.map.has(key) ? this.map.get(key) : [];
    } else {
      return this.map;
    }
  }

  public add(logEntry: LogEntry<Key, T>) {
    if (this.map.has(logEntry.key)) {
      this.map.get(logEntry.key).unshift(logEntry);
    } else {
      this.map.set(logEntry.key, [logEntry]);
    }
  }
}
