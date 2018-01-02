export class EmptyInputError extends Error {

  constructor(commandType: 'create' | 'update' | 'set' | 'put' | 'remove') {
    super(`Cannot run a ${commandType}-command with a null-value`);
  }
}
