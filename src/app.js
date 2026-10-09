const {
  CATEGORIES,
  ITEM_STATUS,
  ITEM_TYPES,
  LostFoundStore,
  STATUS_LABELS,
  STATUS_OPTIONS,
  TYPE_LABELS,
} = window.CampusStore;

const STORAGE_KEY = 'campus-lost-found-items-v1';
const routeTitles = { home: '首页', publish: '发布信息', mine: '我的发布' };

function seedData() {
  const now = Date.now();
  return [
    {
      id: 'seed-1',
      type: ITEM_TYPES.LOST,
      title: '丢失一张校园卡',
      category: '证件卡类',
      location: '图书馆一楼',
      date: '2026-10-08 08:40',
      description: '蓝色透明卡套，卡套中有一张白色借阅码。',
      contact: '微信：chen-lost-card（示例）',
      image: '',
      status: ITEM_STATUS.SEARCHING,
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'seed-2',
      type: ITEM_TYPES.FOUND,
      title: '捡到一把黑色雨伞',
      category: '生活用品',
      location: '紫金楼 A 区',
      date: '2026-10-07 21:10',
      description: '长柄伞，伞柄上有一条白绳。',
      contact: '手机号：138-0000-0000（示例）',
      image: '',
      status: ITEM_STATUS.HOLDING,
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'seed-3',
      type: ITEM_TYPES.LOST,
      title: '遗失白色保温杯',
      category: '生活用品',
      location: '第一食堂',
      date: '2026-10-06 12:20',
      description: '杯身有绿色植物贴纸，杯盖为深灰色。',
      contact: 'QQ：102402118（示例）',
      image: '',
      status: ITEM_STATUS.SEARCHING,
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'seed-4',
      type: ITEM_TYPES.FOUND,
      title: '拾到一副白色耳机',
      category: '电子产品',
      location: '教学楼东门',
      date: '2026-10-05 17:30',
      description: '白色蓝牙耳机盒，外侧贴有星星贴纸。',
      contact: '微信：found-earphone（示例）',
      image: '',
      status: ITEM_STATUS.RETURNED,
      createdAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
  ];
}

function readItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedData();
  } catch (error) {
    console.warn('读取本地数据失败，将使用示例数据。', error);
    return seedData();
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('保存本地数据失败。', error);
  }
}

const store = new LostFoundStore(readItems());
const state = {
  route: 'home',
  filters: { query: '', type: 'all', category: 'all', location: 'all' },
  pendingImage: '',
};

const elements = {
  views: document.querySelectorAll('.view'),
  navItems: document.querySelectorAll('.nav-item'),
  itemGrid: document.getElementById('item-grid'),
  emptyState: document.getElementById('empty-state'),
  resultCount: document.getElementById('result-count'),
  searchInput: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  filterType: document.getElementById('filter-type'),
  filterCategory: document.getElementById('filter-category'),
  filterLocation: document.getElementById('filter-location'),
  resetFilters: document.getElementById('reset-filters'),
  mineStats: document.getElementById('mine-stats'),
  myList: document.getElementById('my-list'),
  form: document.getElementById('publish-form'),
  formErrors: document.getElementById('form-errors'),
  imageInput: document.getElementById('image-input'),
  imagePreview: document.getElementById('image-preview'),
  previewImage: document.getElementById('preview-image'),
  removeImage: document.getElementById('remove-image'),
  detailModal: document.getElementById('detail-modal'),
  detailContent: document.getElementById('detail-content'),
  modalClose: document.getElementById('modal-close'),
  toast: document.getElementById('toast'),
};

function ensureStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) saveItems(store.items);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function iconFor(item) {
  if (item.category === '电子产品') return '♪';
  if (item.category === '证件卡类') return '卡';
  if (item.category === '书籍资料') return '书';
  if (item.title.includes('伞')) return '伞';
  if (item.title.includes('杯')) return '杯';
  return item.type === ITEM_TYPES.LOST ? '寻' : '拾';
}

function formatDate(value) {
  if (!value) return '时间未填写';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

function statusClass(status) {
  if (status === ITEM_STATUS.FOUND) return 'found-status';
  return status;
}

function badge(type, status) {
  return '<span class="badge ' + type + '">' + TYPE_LABELS[type] + '</span>' +
    '<span class="badge ' + statusClass(status) + '">' + STATUS_LABELS[status] + '</span>';
}

function imageMarkup(item) {
  if (item.image) return '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">';
  return escapeHtml(iconFor(item));
}

function cardMarkup(item) {
  return '<article class="item-card" data-detail="' + escapeHtml(item.id) + '" tabindex="0" role="button">' +
    '<div class="item-image ' + item.type + '">' + imageMarkup(item) + '</div>' +
    '<div class="item-body">' +
      '<div class="item-topline"><h3>' + escapeHtml(item.title) + '</h3><div>' + badge(item.type, item.status) + '</div></div>' +
      '<p class="item-meta">' + escapeHtml(item.location) + ' · ' + escapeHtml(formatDate(item.date)) + '</p>' +
      '<p class="item-desc">' + escapeHtml(item.description || '暂无补充描述') + '</p>' +
    '</div>' +
  '</article>';
}

function refreshFilterOptions() {
  const categories = [...new Set([...CATEGORIES, ...store.items.map((item) => item.category)])];
  const locations = [...new Set(store.items.map((item) => item.location))].sort();
  elements.filterCategory.innerHTML = '<option value="all">全部分类</option>' +
    categories.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join('');
  elements.filterLocation.innerHTML = '<option value="all">全部地点</option>' +
    locations.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join('');
  elements.filterCategory.value = state.filters.category;
  elements.filterLocation.value = state.filters.location;
}

function renderStats() {
  const counts = store.counts();
  document.getElementById('stat-total').textContent = counts.total;
  document.getElementById('stat-lost').textContent = counts[ITEM_STATUS.SEARCHING] || 0;
  document.getElementById('stat-found').textContent = counts[ITEM_STATUS.HOLDING] || 0;
}

function renderHome() {
  const results = store.list(state.filters);
  elements.itemGrid.innerHTML = results.map(cardMarkup).join('');
  elements.resultCount.textContent = results.length + ' 条结果';
  elements.emptyState.classList.toggle('hidden', results.length > 0);
  elements.itemGrid.classList.toggle('hidden', results.length === 0);
}

function renderMine() {
  const counts = store.counts();
  elements.mineStats.innerHTML =
    '<div><strong>' + counts.total + '</strong><span>全部发布</span></div>' +
    '<div><strong>' + (counts[ITEM_STATUS.SEARCHING] || 0) + '</strong><span>寻找中</span></div>' +
    '<div><strong>' + (counts[ITEM_STATUS.RETURNED] || 0) + '</strong><span>已归还</span></div>';

  if (!store.items.length) {
    elements.myList.innerHTML = '<div class="empty-state"><h3>还没有发布信息</h3><p>点击“发布信息”创建第一条校园失物招领。</p></div>';
    return;
  }

  elements.myList.innerHTML = store.list().map((item) => {
    const nextStatus = STATUS_OPTIONS[item.type].find((status) => status !== item.status);
    return '<article class="my-card">' +
      '<div class="my-card-head"><h3>' + escapeHtml(item.title) + '</h3>' + badge(item.type, item.status) + '</div>' +
      '<p>' + escapeHtml(item.location) + ' · ' + escapeHtml(formatDate(item.date)) + '</p>' +
      '<div class="my-actions">' +
        '<button data-status-id="' + escapeHtml(item.id) + '" data-next-status="' + nextStatus + '">' + (nextStatus === ITEM_STATUS.FOUND ? '标记为已找到' : nextStatus === ITEM_STATUS.RETURNED ? '标记为已归还' : '重新设为寻找中') + '</button>' +
        '<button data-detail="' + escapeHtml(item.id) + '">查看详情</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

function renderAll() {
  refreshFilterOptions();
  renderStats();
  renderHome();
  renderMine();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove('show'), 1800);
}

function setRoute(route) {
  if (!routeTitles[route]) route = 'home';
  state.route = route;
  elements.views.forEach((view) => view.classList.toggle('active', view.id === 'view-' + route));
  elements.navItems.forEach((item) => item.classList.toggle('active', item.dataset.route === route));
  window.location.hash = route;
  if (route === 'mine') renderMine();
}

function openDetail(id) {
  const item = store.getById(id);
  if (!item) return;
  const nextStatus = STATUS_OPTIONS[item.type].find((status) => status !== item.status);
  elements.detailContent.innerHTML =
    '<div class="detail-hero ' + item.type + '">' + imageMarkup(item) + '</div>' +
    '<div class="detail-body">' +
      '<div>' + badge(item.type, item.status) + '</div>' +
      '<h2 id="detail-title">' + escapeHtml(item.title) + '</h2>' +
      '<p class="detail-time">发布于 ' + escapeHtml(formatDate(item.createdAt)) + '</p>' +
      '<div class="detail-grid">' +
        '<div><span>物品分类</span><b>' + escapeHtml(item.category) + '</b></div>' +
        '<div><span>地点</span><b>' + escapeHtml(item.location) + '</b></div>' +
        '<div><span>时间</span><b>' + escapeHtml(formatDate(item.date)) + '</b></div>' +
        '<div><span>当前状态</span><b>' + escapeHtml(STATUS_LABELS[item.status]) + '</b></div>' +
      '</div>' +
      '<h3>物品描述</h3><p class="detail-description">' + escapeHtml(item.description || '暂无补充描述') + '</p>' +
      '<div class="contact-bar"><div><span>联系方式</span><br><strong>' + escapeHtml(item.contact) + '</strong></div><button data-copy-contact="' + escapeHtml(item.id) + '">复制联系方式</button></div>' +
      '<div class="my-actions"><button data-status-id="' + escapeHtml(item.id) + '" data-next-status="' + nextStatus + '">更新状态</button></div>' +
    '</div>';
  elements.detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  elements.detailModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  return Promise.resolve();
}

function updateStatus(id, status) {
  const item = store.updateStatus(id, status);
  if (!item) return;
  saveItems(store.items);
  renderAll();
  if (!elements.detailModal.classList.contains('hidden')) openDetail(id);
  showToast('状态已更新为“' + STATUS_LABELS[status] + '”');
}

function resetFilters() {
  state.filters = { query: '', type: 'all', category: 'all', location: 'all' };
  elements.searchInput.value = '';
  elements.filterType.value = 'all';
  elements.filterCategory.value = 'all';
  elements.filterLocation.value = 'all';
  renderHome();
}

function updateFilters() {
  state.filters.query = elements.searchInput.value;
  state.filters.type = elements.filterType.value;
  state.filters.category = elements.filterCategory.value;
  state.filters.location = elements.filterLocation.value;
  renderHome();
}

function setDefaultDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  elements.form.elements.date.value = now.toISOString().slice(0, 16);
}

function categoryOptions() {
  elements.form.elements.category.innerHTML = CATEGORIES.map((value) => '<option>' + escapeHtml(value) + '</option>').join('');
}

elements.searchInput.addEventListener('input', updateFilters);
elements.filterType.addEventListener('change', updateFilters);
elements.filterCategory.addEventListener('change', updateFilters);
elements.filterLocation.addEventListener('change', updateFilters);
elements.clearSearch.addEventListener('click', () => {
  elements.searchInput.value = '';
  updateFilters();
});
elements.resetFilters.addEventListener('click', resetFilters);
elements.modalClose.addEventListener('click', closeDetail);
elements.detailModal.addEventListener('click', (event) => {
  if (event.target === elements.detailModal) closeDetail();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

document.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) {
    setRoute(routeButton.dataset.route);
    return;
  }
  const detailButton = event.target.closest('[data-detail]');
  if (detailButton) {
    openDetail(detailButton.dataset.detail);
    return;
  }
  const statusButton = event.target.closest('[data-status-id]');
  if (statusButton) {
    updateStatus(statusButton.dataset.statusId, statusButton.dataset.nextStatus);
    return;
  }
  const copyButton = event.target.closest('[data-copy-contact]');
  if (copyButton) {
    const item = store.getById(copyButton.dataset.copyContact);
    if (item) copyText(item.contact).then(() => showToast('联系方式已复制'));
  }
});

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const input = Object.fromEntries(formData.entries());
  input.image = state.pendingImage;
  try {
    const item = store.add(input, { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) });
    saveItems(store.items);
    elements.form.reset();
    state.pendingImage = '';
    elements.previewImage.src = '';
    elements.imagePreview.classList.add('hidden');
    elements.formErrors.classList.add('hidden');
    categoryOptions();
    setDefaultDate();
    renderAll();
    openDetail(item.id);
    showToast('发布成功，信息已保存到本机');
  } catch (error) {
    elements.formErrors.textContent = error.message;
    elements.formErrors.classList.remove('hidden');
    elements.formErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

elements.imageInput.addEventListener('change', () => {
  const file = elements.imageInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片不能超过 2 MB');
    elements.imageInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    state.pendingImage = String(reader.result || '');
    elements.previewImage.src = state.pendingImage;
    elements.imagePreview.classList.remove('hidden');
  });
  reader.readAsDataURL(file);
});

elements.removeImage.addEventListener('click', () => {
  state.pendingImage = '';
  elements.imageInput.value = '';
  elements.previewImage.src = '';
  elements.imagePreview.classList.add('hidden');
});

ensureStorage();
categoryOptions();
setDefaultDate();
renderAll();
setRoute(window.location.hash.replace('#', '') || 'home');

