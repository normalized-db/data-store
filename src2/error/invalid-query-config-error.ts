export class InvalidQueryConfigError extends Error {

  constructor(reason: string) {
    super(`The query config is invalid. ${reason}`);
  }
}
