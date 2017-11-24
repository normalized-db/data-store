export class EmptyResultError extends Error {

  constructor() {
    super('Query returned an empty result');
  }
}
