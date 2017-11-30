export class ListResult<Result> {

  constructor(private _items: Result[],
              private _total: number,
              private readonly _offset: number,
              private readonly _limit: number) {
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

  public get isEmpty(): boolean {
    return this._total <= 0;
  }

  public get hasItems(): boolean {
    return this._total > 0;
  }

  public get hasBoundaries(): boolean {
    return this._offset > 0 || this._limit < Infinity;
  }

  public push(item: Result) {
    if (this._items) {
      this._items.push(item);
    } else {
      this._items = [item];
    }

    this._total++;
  }

  public unshift(item: Result) {
    if (this._items) {
      this._items.unshift(item);
    } else {
      this._items = [item];
    }

    this._total++;
  }

  public remove(item: Result) {
    if (this._items) {
      const index = this._items.indexOf(item);
      if (index >= 0) {
        this._items.splice(index, 1);
        this._total--;
      }
    }
  }

  public removeAt(index: number) {
    if (this._items && index >= 0 && index < this._items.length) {
      this._items.splice(index, 1);
      this._total--;
    }
  }
}
