export class InvalidQueryRunnerStatusError extends Error {

  constructor(reason: string) {
    super(`Query runner is in a invalid state. ${reason}`);
  }
}
