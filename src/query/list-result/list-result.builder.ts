import { NdbDocument } from '@normalized-db/core';
import { ListResult } from './list-result';

export class ListResultBuilder<DbItem extends NdbDocument> {

  protected _items: DbItem[];
  protected _total: number;
  protected _offset: number;
  protected _limit: number;

  public items(value: DbItem[]): ListResultBuilder<DbItem> {
    this._items = value;
    return this;
  }

  public total(value: number): ListResultBuilder<DbItem> {
    this._total = value;
    return this;
  }

  public offset(value: number): ListResultBuilder<DbItem> {
    this._offset = value;
    return this;
  }

  public limit(value: number): ListResultBuilder<DbItem> {
    this._limit = value;
    return this;
  }

  public build(): ListResult<DbItem> {
    return new ListResult<DbItem>(this._items, this._total, this._offset, this._limit);
  }
}
