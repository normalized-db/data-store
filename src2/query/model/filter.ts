import { Predicate } from '../../model/predicate';

export class Filter<DbItem> {

  constructor(private readonly _predicate: Predicate<DbItem>,
              private readonly _requiresNormalization?: boolean) {
  }

  public test(item: DbItem): boolean {
    return this._predicate(item);
  }

  public requiresNormalization(): boolean {
    return this._requiresNormalization;
  }
}
