export interface CountQueryRunner {

  /**
   * Returns the total count of items in the given type. Any other configuration is ignored.
   *
   * @returns {Promise<number>}
   */
  execute(): Promise<number>;
}
