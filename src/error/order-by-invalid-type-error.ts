export class OrderByInvalidTypeError extends Error {

  constructor(field: string, type: string) {
    super(`${field} was expected to be a number, string or Date but ${type} was found`);
  }
}
