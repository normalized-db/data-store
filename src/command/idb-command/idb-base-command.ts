import { IdbContext } from '../../context/idb-context/idb-context';
import { BaseCommand } from '../base-command';
import { Command } from '../command';

export abstract class IdbBaseCommand<T> extends BaseCommand<T, IdbContext<any>> implements Command<T> {

  constructor(context: IdbContext<any>, type: string, typeIsOptional = false) {
    super(context, type, typeIsOptional);
  }
}
