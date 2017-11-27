export interface Command<T> {

  /**
   * Execute the command.
   *
   * @returns {Promise<boolean>}
   */
  execute(item: T): Promise<boolean>;
}
