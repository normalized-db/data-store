import { ClearCommand } from './clear-command';
import { CreateCommand } from './create-command';
import { PutCommand } from './put-command';
import { RemoveCommand } from './remove-command';
import { UpdateCommand } from './update-command';

export interface CommandFactory {
  createCommand<Item>(type: string): CreateCommand<Item>;

  updateCommand<Item>(type: string): UpdateCommand<Item>;

  putCommand<Item>(type: string): PutCommand<Item>;

  removeCommand<Item>(type: string): RemoveCommand<Item>;

  clearCommand(): ClearCommand;
}
