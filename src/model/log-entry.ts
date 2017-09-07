import { ValidKey } from '@normalized-db/core';

export class NestedValue<Key extends ValidKey> {
  constructor(public readonly key: Key,
              public readonly nestedKey: ValidKey,
              public readonly field: string,
              public readonly type: string) {
  }
}

export class LogEntry<Key extends ValidKey, T> {

  public readonly id: number;

  constructor(public readonly store: string,
              public readonly action: 'create' | 'update' | 'remove' | 'addNested' | 'removedNested',
              public readonly key: Key,
              public readonly value: T | NestedValue<Key> = null,
              public readonly time: Date = new Date()) {
  }
}
