export class ListResult<Result> {

  constructor(protected readonly _items: Result[],
              protected readonly _total: number,
              protected readonly _offset: number,
              protected readonly _limit: number) {
  }

  public get items(): Result[] {
    return this._items;
  }

  public get total(): number {
    return this._total;
  }

  public get offset(): number {
    return this._offset;
  }

  public get limit(): number {
    return this._limit;
  }
}
