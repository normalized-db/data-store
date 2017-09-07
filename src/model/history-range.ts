import { isNull } from '@normalized-db/core';

export class HistoryRange {

  constructor(public readonly from?: Date, public readonly to: Date = new Date()) {
    if (isNull(this.from)) {
      this.from = new Date();
      this.from.setDate(this.from.getDate() - 1);
    }
  }

  public get idbRange(): IDBKeyRange {
    return IDBKeyRange.bound(this.from, this.to);
  }
}
