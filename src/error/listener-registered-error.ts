export class ListenerRegisteredError extends Error {

  constructor() {
    super('Event listener is already registered');
  }
}
