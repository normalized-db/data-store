import { ValidKey } from '@normalized-db/core';
import { LoggingCallback } from './logging-callback';

export class LoggingConfig {

  private static readonly DEFAULT_PREFIX = '_history';

  constructor(public readonly prefix: string = LoggingConfig.DEFAULT_PREFIX,
              public readonly preCallback?: LoggingCallback<ValidKey, any>,
              public isActive: boolean = false) {
  }
}
