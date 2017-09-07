import { ValidKey } from '@normalized-db/core';
import { LogEntry } from '../../model/log-entry';

export declare type LoggingCallback<Key extends ValidKey, T> = (item: LogEntry<Key, T>) => Promise<void>;
