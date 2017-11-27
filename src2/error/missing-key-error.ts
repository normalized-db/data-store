export class MissingKeyError extends Error {

  constructor(type: string, keyField: string) {
    super(`Key is missing in object of type ${type} (key-field ${keyField}`);
  }
}
