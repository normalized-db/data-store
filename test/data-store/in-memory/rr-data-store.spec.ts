import { assert } from 'chai';
import { DataStoreBuilder } from '../../../lib/index';
import * as Blog from '../../data/blog-post';
import * as User from '../../data/user';
import { assertThrowsAsync } from '../../utilities/async-throws';

describe('In-Memory Data-Store (RR)', async function () {

  it('Save', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put(User.USER1, 'user');

    assert.deepEqual(await ds.getData(), {
      'role': [
        User.reverseRole(User.ROLE1, [User.USER1])
      ],
      'user': [
        User.normalize(User.USER1)
      ]
    });

    await ds.put(User.USER3, 'user');
    await ds.put(User.ROLE1, 'role');
    await ds.put([User.USER2, User.USER3], 'user');

    assert.deepEqual(await ds.getData(), {
      'role': [
        User.reverseRole(User.ROLE1, [User.USER1]),
        User.reverseRole(User.ROLE2, [User.USER2, User.USER3])
      ],
      'user': [
        User.normalize(User.USER1),
        User.normalize(User.USER3),
        User.normalize(User.USER2)
      ]
    });
  });

  it('Save with generated keys', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .build();

    const item = {
      name: 'User',
      role: {
        label: 'Role'
      }
    };

    await ds.put(item, 'user');

    const result = await ds.getData();
    assert.isNotNull(result.role[0].id);
    assert.isNotNull(result.user[0].id);
  });

  it('Get all', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    let result = await ds.getAll('user');
    assert.deepEqual(result, [User.USER1, User.USER2, User.USER3]);

    result = await ds.getAll('user', 0);
    assert.deepEqual(result, [
      User.normalize(User.USER1),
      User.normalize(User.USER2),
      User.normalize(User.USER3)
    ]);

    await assertThrowsAsync(async () => await ds.getAll('invalid'), 'Type \'invalid\' is not defined');
  });

  it('Get all by keys', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    let result = await ds.getAllByKeys([User.USER1.id, User.USER3.id], 'user');
    assert.deepEqual(result, [User.USER1, User.USER3]);

    result = await ds.getAllByKeys([User.USER1.id, User.USER3.id], 'user', 0);
    assert.deepEqual(result, [
      User.normalize(User.USER1),
      User.normalize(User.USER3)
    ]);

    result = await ds.getAllByKeys([], 'user');
    assert.equal(result.length, 0);

    await assertThrowsAsync(async () => await ds.getAllByKeys([], 'invalid'), 'Type \'invalid\' is not defined');
  });

  it('Get', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    let result = await ds.getByKey(User.USER1.id, 'user');
    assert.deepEqual(result, User.USER1);

    result = await ds.getByKey(User.USER1.id, 'user', 0);
    assert.deepEqual(result, User.normalize(User.USER1));

    result = await ds.getByKey(User.USER2.id, 'user');
    assert.deepEqual(result, User.USER2);

    result = await ds.getByKey(User.USER3.id, 'user');
    assert.deepEqual(result, User.USER3);

    await ds.remove(User.USER1.id, 'user');
    result = await ds.getOrDefault(User.USER1.id, 'user');
    assert.isNull(result);

    await assertThrowsAsync(async () => await ds.getByKey(0, 'user'), 'Could not find \'user\' with key \'0\'');
    await assertThrowsAsync(async () => await ds.getByKey(0, 'invalid'), 'Type \'invalid\' is not defined');
  });

  it('Remove', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');
    let removedKeys = await ds.remove([User.USER1.id, User.USER3.id], 'user');

    assert.deepEqual(removedKeys, [User.USER1.id, User.USER3.id]);
    assert.deepEqual(await ds.getData(), {
      'role': [
        User.ROLE1,
        User.reverseRole(User.ROLE2, [User.USER2])
      ],
      'user': [
        {},
        User.normalize(User.USER2),
        {}
      ]
    });

    removedKeys = await ds.remove([User.USER2.id, User.USER3.id], 'user');
    assert.deepEqual(removedKeys, [User.USER2.id]);
    assert.deepEqual(await ds.getData(), {
      'role': [User.ROLE1, User.ROLE2],
      'user': [{}, {}, {}]
    });
  });

  it('Remove (cascaded)', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(Blog.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([Blog.POST1, Blog.POST2, Blog.POST3], 'article');

    const result = await ds.getData();
    assert.deepEqual(result, Blog.DATA_NORMALIZED_RR);

    await ds.remove(Blog.POST1.id, 'article');

    assert.deepEqual(await ds.getData(), {
      role: [
        Blog.withRevRef(Blog.ROLE2, 'user', ['mmuster'], true),
        Blog.withRevRef(Blog.ROLE1, 'user', ['timler42', 'alexk'], true),
        Blog.withRevRef(Blog.ROLE3, 'user', ['plustig'], true)
      ],
      user: Blog.normalizeAllUsers([
        Blog.withRevRef(Blog.USER_MMUSTER, 'article', [3], true),
        Blog.USER_TIMLER42,
        Blog.withRevRef(Blog.USER_ALEXK, 'comment', [2], true),
        Blog.withRevRef(Blog.USER_PLUSTIG, 'article', [2], true)
      ]),
      article: [{}, ...Blog.normalizeAllPosts([Blog.POST2, Blog.POST3])],
      comment: [
        {},
        {},
        ...Blog.normalizeAllComments([
            Blog.withRevRef(Blog.COMMENT3, 'article', [2], true)
          ]
        )
      ]
    });
  });

  it('Save to freed index', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2], 'user');
    await ds.remove(User.USER1.id, 'user');
    await ds.put(User.USER3, 'user');

    assert.deepEqual(await ds.getData(), {
      'role': [
        User.ROLE1,
        User.reverseRole(User.ROLE2, [User.USER2, User.USER3])
      ],
      'user': [
        User.normalize(User.USER3),
        User.normalize(User.USER2)
      ]
    });
  });

  it('Length / isEmpty', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    assert.isTrue(await ds.isEmpty('user'));
    assert.isTrue(await ds.isEmpty('role'));

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    assert.equal(await ds.count('user'), 3);
    assert.equal(await ds.count('role'), 2);
    assert.isNotTrue(await ds.isEmpty('user'));
    assert.isNotTrue(await ds.isEmpty('role'));

    await ds.remove(User.USER2.id, 'user');
    assert.equal(await ds.count('user'), 2);
    assert.equal(await ds.count('role'), 2);

    await ds.remove(User.USER3.id, 'user');
    assert.equal(await ds.count('user'), 1);
    assert.equal(await ds.count('role'), 2);
  });

  it('Keys', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    assert.deepEqual(await ds.getKeys('user'), [User.USER1.id, User.USER2.id, User.USER3.id]);
    assert.deepEqual(await ds.getKeys('role'), [User.ROLE1.id, User.ROLE2.id]);

    assert.isFalse(await ds.hasKey(0, 'user'));
    assert.isTrue(await ds.hasKey(User.USER1.id, 'user'));
    assert.isTrue(await ds.hasKey(User.USER2.id, 'user'));
    assert.isTrue(await ds.hasKey(User.USER3.id, 'user'));

    assert.isFalse(await ds.hasKey(0, 'role'));
    assert.isTrue(await ds.hasKey(User.ROLE1.id, 'role'));
    assert.isTrue(await ds.hasKey(User.ROLE2.id, 'role'));

    await ds.remove(User.USER2.id, 'user');
    assert.deepEqual(await ds.getKeys('user'), [User.USER1.id, User.USER3.id]);
    assert.deepEqual(await ds.getKeys('role'), [User.ROLE1.id, User.ROLE2.id]);

    assert.isFalse(await ds.hasKey(User.USER2.id, 'user'));
    assert.isTrue(await ds.hasKey(User.ROLE2.id, 'role'));

    await ds.remove(User.USER3.id, 'user');
    await ds.remove(User.USER1.id, 'user');
    await ds.remove(User.ROLE1.id, 'role');
    assert.deepEqual(await ds.getKeys('user'), []);
    assert.deepEqual(await ds.getKeys('role'), [User.ROLE2.id]);
  });

  it('Clear', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    assert.isNotTrue(await ds.isEmpty('user'));
    assert.isNotTrue(await ds.isEmpty('role'));

    await ds.clear('role');
    assert.isNotTrue(await ds.isEmpty('user'));
    assert.isTrue(await ds.isEmpty('role'));

    await ds.put([User.ROLE1], 'role');
    await ds.clear();
    assert.isTrue(await ds.isEmpty('user'));
    assert.isTrue(await ds.isEmpty('role'));
  });

  it('Get reverse', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    const reverseRole1 = await ds.getReverse(User.ROLE1.id, 'role', 'user');
    const reverseRole2 = await ds.getReverse(User.ROLE2.id, 'role', 'user');

    assert.deepEqual(reverseRole1, [User.USER1]);
    assert.deepEqual(reverseRole2, [User.USER2, User.USER3]);

    const emptyReverse = await ds.getReverse(User.ROLE2.id, 'role', 'foo');
    assert.isNotNull(emptyReverse);
    assert.equal(emptyReverse.length, 0);

    await assertThrowsAsync(
      async () => await ds.getReverse(0, 'role', 'user'),
      'Could not find \'role\' with key \'0\''
    );
  });

  it('Get reverse (first only)', async function () {
    const ds = await new DataStoreBuilder()
      .withSchemaConfig(User.SCHEMA)
      .withReverseReferences(true)
      .build();

    await ds.put([User.USER1, User.USER2, User.USER3], 'user');

    const reverseRole1 = await ds.getFirstReverse(User.ROLE1.id, 'role', 'user');
    const reverseRole2 = await ds.getFirstReverse(User.ROLE2.id, 'role', 'user');

    assert.deepEqual(reverseRole1, User.USER1);
    assert.deepEqual(reverseRole2, User.USER2);

    const emptyReverse = await ds.getFirstReverse(User.ROLE2.id, 'role', 'foo');
    assert.isNull(emptyReverse);

    await assertThrowsAsync(
      async () => await ds.getFirstReverse(0, 'role', 'user'),
      'Could not find \'role\' with key \'0\''
    );
  });
});
