export class Range {

  constructor(public readonly offset?: number,
              public readonly limit?: number) {
  }

  public slice(data: any[]): any[] {
    return data.slice(this.offset, this.limit);
  }
}
