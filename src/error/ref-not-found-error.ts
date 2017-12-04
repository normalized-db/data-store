import { isNull, ValidKey } from '@normalized-db/core';

export class RefNotFoundError extends Error {

  constructor(refType: string, key?: ValidKey) {
    super(`Could not find reverse reference to "${refType}"` + (isNull(key) ? `with key "${key}"` : ''));
  }
}
