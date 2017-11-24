import { assert } from 'chai';
import { Subscription } from 'rxjs/Subscription';
import { DataStoreBuilder, ObservedDataStore } from '../../../lib/index';
import * as User from '../../data/user';

describe('Input-Memory Data-Store (observed)', function () {

  let ds: ObservedDataStore;
  let subscription: Subscription;

  beforeEach(async function () {
    ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withObservers(true)
      .build() as ObservedDataStore;
  });

  afterEach(function () {
    if (subscription) {
      subscription.unsubscribe();
    }
  });

  it('Bulk Put', async function () {
    const data = [User.USER1, User.USER2, User.USER3];
    subscription = ds.onPut.subscribe(user => assert.deepEqual(user.data, data));
    await ds.put(data, 'user');
  });

  it('Put', async function () {
    const data = User.USER1;
    subscription = ds.onPut.subscribe(user => assert.deepEqual(user.data, [data]));
    await ds.put(data, 'user');
  });

  it('Bulk Remove', async function () {
    const data = [User.USER1, User.USER2, User.USER3];
    const keys = data.map(user => user.id);
    subscription = ds.onRemoved.subscribe(removedKeys => assert.deepEqual(removedKeys.data, keys));

    await ds.put(data, 'user');
    await ds.remove([0, ...keys, 999], 'user');
  });

  it('Remove', async function () {
    const data = User.USER1;
    subscription = ds.onRemoved.subscribe(user => assert.deepEqual(user.data, [data.id]));
    await ds.put(data, 'user');
    await ds.remove(data.id, 'user');
  });

  it('Clear specific prefix', async function () {
    const type = 'user';
    subscription = ds.onCleared.subscribe(clearedType => assert.equal(clearedType.type, type));
    await ds.clear(type);
  });

  it('Clear all', async function () {
    const types: string[] = [];
    subscription = ds.onCleared.subscribe(clearedType => types.push(clearedType.type));
    await ds.clear();

    assert.deepEqual(types, ['user', 'role']);
  });

});
