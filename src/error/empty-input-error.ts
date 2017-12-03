export class EmptyInputError extends Error {

  constructor(commandType: 'create' | 'update' | 'put' | 'remove') {
    super(`Cannot run a ${commandType}-command with a null-value`);
  }
}
