import { CreateCommand } from './create-command';
import { RemoveCommand } from './remove-command';
import { UpdateCommand } from './update-command';

export interface CommandFactory {
  createCommand<Item>(type: string): CreateCommand<Item>;

  updateCommand<Item>(type: string): UpdateCommand<Item>;

  putCommand<Item>(type: string): UpdateCommand<Item>;

  removeCommand<Item>(type: string): RemoveCommand<Item>;
}
