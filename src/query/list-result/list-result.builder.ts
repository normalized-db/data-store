import { ListResult } from './list-result';

export class ListResultBuilder<Result> {

  protected _items: Result[];
  protected _total: number;
  protected _offset: number;
  protected _limit: number;

  public items(value: Result[]): ListResultBuilder<Result> {
    this._items = value;
    return this;
  }

  public total(value: number): ListResultBuilder<Result> {
    this._total = value;
    return this;
  }

  public offset(value: number): ListResultBuilder<Result> {
    this._offset = value;
    return this;
  }

  public limit(value: number): ListResultBuilder<Result> {
    this._limit = value;
    return this;
  }

  public build(): ListResult<Result> {
    return new ListResult(this._items, this._total, this._offset, this._limit);
  }
}
