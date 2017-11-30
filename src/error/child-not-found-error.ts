import { isNull, ValidKey } from '@normalized-db/core';
import { Parent } from '../model/parent';

export class ChildNotFoundError extends Error {

  constructor(parent: Parent, key?: ValidKey) {
    super('Could not find child ' + (isNull(key) ? `with key "${key}"` : '') +
      ` in "${parent.type}.${parent.field}" from "${parent.key}"`);
  }
}
