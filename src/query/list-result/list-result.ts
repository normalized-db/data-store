import { isNull, NdbDocument } from '@normalized-db/core';

export class ListResult<DbItem extends NdbDocument> {

  public static readonly DEFAULT_OFFSET = 0;
  public static readonly DEFAULT_LIMIT = Infinity;

  constructor(private readonly _items?: DbItem[],
              private _total?: number,
              private readonly _offset?: number,
              private readonly _limit?: number) {
    if (!this._items) {
      this._items = [];
    }

    if (isNull(this._total)) {
      this._total = this._items.length;
    }

    if (isNull(this._offset)) {
      this._offset = ListResult.DEFAULT_OFFSET;
    }

    if (isNull(this._limit)) {
      this._limit = ListResult.DEFAULT_LIMIT;
    }
  }

  public get items(): DbItem[] {
    return this._items;
  }

  public get first(): DbItem | null {
    return this.isEmpty ? null : this._items[0];
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
    return !this.hasItems;
  }

  public get hasItems(): boolean {
    return this._total > 0 && this._offset < this._total;
  }

  public get hasBoundaries(): boolean {
    return this._offset > 0 || this._limit < Infinity;
  }

  public push(item: DbItem): void {
    this._items.push(item);
    this._total++;
  }

  public unshift(item: DbItem): void {
    this._items.unshift(item);
    this._total++;
  }

  public remove(item: DbItem): void {
    const index = this._items.indexOf(item);
    if (index >= 0) {
      this._items.splice(index, 1);
      this._total--;
    }
  }

  public removeAt(index: number): void {
    if (index >= 0 && index < this._items.length) {
      this._items.splice(index, 1);
      this._total--;
    }
  }
}
