export class InvalidTypeError extends Error {

  constructor(type: string) {
    super(`Type "${type}" is not configured`);
  }
}
