import { NdbDocument } from '@normalized-db/core';
import { Predicate } from '../../model/predicate';

export class Filter<DbItem extends NdbDocument> {

  constructor(private readonly _predicate: Predicate<DbItem>,
              public readonly requiresDenormalization: boolean = false) {
  }

  public test(item: DbItem): boolean | Promise<boolean> {
    return this._predicate(item);
  }
}
