export interface QueryRunner<Result> {

  execute(): Promise<Result[]>;
}
