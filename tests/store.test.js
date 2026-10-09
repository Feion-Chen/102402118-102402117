const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ITEM_STATUS,
  ITEM_TYPES,
  LostFoundStore,
  createItem,
  itemMatches,
  normalizeText,
  sortItems,
  validateItem,
} = require('../src/store.js');

const baseInput = {
  type: ITEM_TYPES.LOST,
  title: '蓝色校园卡',
  category: '证件卡类',
  location: '图书馆一楼',
  date: '2026-10-08 08:40',
  description: '外面有透明卡套',
  contact: '微信 test-contact',
};

test('T01 normalizeText 忽略大小写和空白', () => {
  assert.equal(normalizeText('  ABC 校园卡 '), 'abc校园卡');
});

test('T02 validateItem 能发现缺少物品名称', () => {
  const errors = validateItem({ ...baseInput, title: '' });
  assert.ok(errors.includes('请填写物品名称'));
});

test('T03 validateItem 能发现非法信息类型', () => {
  const errors = validateItem({ ...baseInput, type: 'unknown' });
  assert.ok(errors.includes('请选择寻物或招领类型'));
});

test('T04 createItem 默认设置正确的初始状态', () => {
  const lost = createItem(baseInput, { id: '1', now: '2026-10-08T00:00:00.000Z' });
  const found = createItem({ ...baseInput, type: ITEM_TYPES.FOUND }, { id: '2' });
  assert.equal(lost.status, ITEM_STATUS.SEARCHING);
  assert.equal(found.status, ITEM_STATUS.HOLDING);
});

test('T05 itemMatches 支持按物品名称搜索', () => {
  const item = createItem(baseInput, { id: '1' });
  assert.equal(itemMatches(item, { query: '校园卡' }), true);
  assert.equal(itemMatches(item, { query: '雨伞' }), false);
});

test('T06 itemMatches 支持多词跨字段搜索', () => {
  const item = createItem(baseInput, { id: '1' });
  assert.equal(itemMatches(item, { query: '透明 图书馆' }), true);
});

test('T07 itemMatches 支持类型、分类和地点组合筛选', () => {
  const item = createItem(baseInput, { id: '1' });
  assert.equal(itemMatches(item, { type: 'lost', category: '证件卡类', location: '图书馆一楼' }), true);
  assert.equal(itemMatches(item, { type: 'found' }), false);
});

test('T08 LostFoundStore.add 会新增并返回完整信息', () => {
  const store = new LostFoundStore();
  const item = store.add(baseInput, { id: 'new-1', now: '2026-10-08T00:00:00.000Z' });
  assert.equal(store.list().length, 1);
  assert.equal(store.getById('new-1').title, '蓝色校园卡');
  assert.equal(item.id, 'new-1');
});

test('T09 寻物状态可以更新为已找到', () => {
  const store = new LostFoundStore([createItem(baseInput, { id: '1' })]);
  const updated = store.updateStatus('1', ITEM_STATUS.FOUND);
  assert.equal(updated.status, ITEM_STATUS.FOUND);
});

test('T10 寻物信息不能设置为已归还', () => {
  const store = new LostFoundStore([createItem(baseInput, { id: '1' })]);
  assert.throws(() => store.updateStatus('1', ITEM_STATUS.RETURNED), /状态/);
});

test('T11 sortItems 按创建时间从新到旧排序', () => {
  const oldItem = createItem(baseInput, { id: 'old', now: '2026-10-01T00:00:00.000Z', createdAt: '2026-10-01T00:00:00.000Z' });
  const newItem = createItem(baseInput, { id: 'new', now: '2026-10-08T00:00:00.000Z', createdAt: '2026-10-08T00:00:00.000Z' });
  assert.deepEqual(sortItems([oldItem, newItem]).map((item) => item.id), ['new', 'old']);
});

test('T12 counts 正确统计全部信息和状态数量', () => {
  const store = new LostFoundStore([
    createItem(baseInput, { id: '1' }),
    createItem({ ...baseInput, type: ITEM_TYPES.FOUND }, { id: '2' }),
  ]);
  store.updateStatus('1', ITEM_STATUS.FOUND);
  const counts = store.counts();
  assert.equal(counts.total, 2);
  assert.equal(counts[ITEM_STATUS.FOUND], 1);
  assert.equal(counts[ITEM_STATUS.HOLDING], 1);
});

test('T13 空搜索条件不会过滤数据', () => {
  const item = createItem(baseInput, { id: '1' });
  assert.equal(itemMatches(item, { query: '', type: 'all', category: 'all', location: 'all' }), true);
});

test('T14 updateStatus 对不存在的 id 返回 null', () => {
  const store = new LostFoundStore();
  assert.equal(store.updateStatus('missing', ITEM_STATUS.FOUND), null);
});

