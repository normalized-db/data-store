export type ReducerFunc<Input, Result> =
    (result: Result, item: Input, idx: number, array: Input[]) =>
        Result | Promise<Result>;
