(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CampusStore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
const ITEM_TYPES = Object.freeze({
  LOST: 'lost',
  FOUND: 'found',
});

const ITEM_STATUS = Object.freeze({
  SEARCHING: 'searching',
  FOUND: 'found',
  HOLDING: 'holding',
  RETURNED: 'returned',
});

const TYPE_LABELS = Object.freeze({
  [ITEM_TYPES.LOST]: '寻物',
  [ITEM_TYPES.FOUND]: '招领',
});

const STATUS_LABELS = Object.freeze({
  [ITEM_STATUS.SEARCHING]: '寻找中',
  [ITEM_STATUS.FOUND]: '已找到',
  [ITEM_STATUS.HOLDING]: '待认领',
  [ITEM_STATUS.RETURNED]: '已归还',
});

const STATUS_OPTIONS = Object.freeze({
  [ITEM_TYPES.LOST]: [ITEM_STATUS.SEARCHING, ITEM_STATUS.FOUND],
  [ITEM_TYPES.FOUND]: [ITEM_STATUS.HOLDING, ITEM_STATUS.RETURNED],
});

const CATEGORIES = Object.freeze([
  '证件卡类',
  '电子产品',
  '生活用品',
  '书籍资料',
  '其他',
]);

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function validateItem(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return ['信息内容不能为空'];
  }
  if (![ITEM_TYPES.LOST, ITEM_TYPES.FOUND].includes(input.type)) {
    errors.push('请选择寻物或招领类型');
  }
  if (!String(input.title ?? '').trim()) {
    errors.push('请填写物品名称');
  }
  if (!String(input.location ?? '').trim()) {
    errors.push('请填写地点');
  }
  if (!String(input.date ?? '').trim()) {
    errors.push('请选择日期或时间');
  }
  if (!String(input.contact ?? '').trim()) {
    errors.push('请填写联系方式');
  }
  return errors;
}

function createItem(input, options = {}) {
  const errors = validateItem(input);
  if (errors.length) {
    throw new Error(errors.join('；'));
  }

  const id = options.id ?? String(Date.now());
  const now = options.now ?? new Date().toISOString();
  return {
    id,
    type: input.type,
    title: String(input.title).trim(),
    category: String(input.category || '其他').trim(),
    location: String(input.location).trim(),
    date: String(input.date).trim(),
    description: String(input.description || '').trim(),
    contact: String(input.contact).trim(),
    image: String(input.image || ''),
    status: input.status || STATUS_OPTIONS[input.type][0],
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

function itemMatches(item, filters = {}) {
  const query = normalizeText(filters.query);
  if (query) {
    const haystack = normalizeText([
      item.title,
      item.category,
      item.location,
      item.description,
    ].join(' '));
    const tokens = String(filters.query).trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.every((token) => haystack.includes(normalizeText(token)))) {
      return false;
    }
  }
  if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
    return false;
  }
  if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
    return false;
  }
  if (filters.location && filters.location !== 'all' && item.location !== filters.location) {
    return false;
  }
  if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
    return false;
  }
  return true;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const left = Date.parse(a.createdAt || a.date || 0) || 0;
    const right = Date.parse(b.createdAt || b.date || 0) || 0;
    return right - left;
  });
}

class LostFoundStore {
  constructor(items = []) {
    this.items = items.map((item) => ({ ...item }));
  }

  add(input, options = {}) {
    const item = createItem(input, options);
    this.items.unshift(item);
    return item;
  }

  list(filters = {}) {
    return sortItems(this.items.filter((item) => itemMatches(item, filters)));
  }

  getById(id) {
    return this.items.find((item) => item.id === id) || null;
  }

  updateStatus(id, status) {
    const item = this.getById(id);
    if (!item) return null;
    if (!STATUS_OPTIONS[item.type].includes(status)) {
      throw new Error('该状态不适合当前信息类型');
    }
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  counts() {
    return this.items.reduce((result, item) => {
      result.total += 1;
      result[item.status] = (result[item.status] || 0) + 1;
      return result;
    }, { total: 0 });
  }
}
  return {
    CATEGORIES,
    ITEM_STATUS,
    ITEM_TYPES,
    LostFoundStore,
    STATUS_LABELS,
    STATUS_OPTIONS,
    TYPE_LABELS,
    createItem,
    itemMatches,
    normalizeText,
    sortItems,
    validateItem,
  };
});
