export type MapFunc<Input, Result> =
  (item: Input, idx: number, array: Input[]) =>
    Result | Promise<Result>;
