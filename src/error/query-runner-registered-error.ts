export class InvalidQueryRunnerRegistration extends Error {

  constructor(key: string, type: 'already-registered' | 'missing') {
    super(type === 'already-registered'
      ? `A query runner with "key ${key}" is already registered`
      : `No query runner with key "${key}" found`);
  }
}
