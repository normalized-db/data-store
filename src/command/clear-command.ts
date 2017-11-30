import { Command } from './command';

export interface ClearCommand extends Command<void> {

  /**
   * See `DataStore.clear(…)`
   *
   * @param {string|string[]} type
   * @returns {Promise<boolean>}
   */
  execute(type?: string | string[]): Promise<boolean>;
}
