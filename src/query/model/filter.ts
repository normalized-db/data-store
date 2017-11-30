import { Predicate } from '../../model/predicate';

export class Filter<DbItem> {

  constructor(private readonly _predicate: Predicate<DbItem>,
              public readonly requiresNormalization: boolean = false) {
  }

  public test(item: DbItem): boolean {
    return this._predicate(item);
  }
}
