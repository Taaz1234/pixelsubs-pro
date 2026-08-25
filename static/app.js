/* =========================================================
   PixelSubs Pro - Logic & Interactivity v2.5
   With 100% Authentic Brand Vectors & Pixel-Perfect Circles
   ========================================================= */

const state = {
  subscriptions: [],
  currentCategory: 'all',
  currentSort: 'saving_eur',
  searchQuery: '',
  lastUpdated: '',
  favorites: JSON.parse(localStorage.getItem('pixelsubs_favs') || '[]'),
  calcSelected: JSON.parse(localStorage.getItem('pixelsubs_calc') || '["gamepass", "netflix", "spotify", "youtube", "chatgpt", "googleone"]'),
};

function getBrandLogo(sub, size = 36) {
  const iconId = sub.icon_id || sub.id;
  return `<img src="/icons/${iconId}.svg" width="${size}" height="${size}" alt="${sub.name}" class="brand-logo-img" onerror="this.onerror=null; this.src='https://api.iconify.design/logos:google-icon.svg';">`;
}

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const subsGrid = document.getElementById('subsGrid');
const loader = document.getElementById('loader');
const currentCategoryTitle = document.getElementById('currentCategoryTitle');
const resultsCount = document.getElementById('resultsCount');
const totalSubsCount = document.getElementById('totalSubsCount');
const favCountSpan = document.getElementById('favCount');
const calcSelectedCountSpan = document.getElementById('calcSelectedCount');
const sortSelect = document.getElementById('sortSelect');
const bannerUpdated = document.getElementById('bannerUpdated');

// Modals
const detailModal = document.getElementById('detailModal');
const detailModalContent = document.getElementById('detailModalContent');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');

const calcModal = document.getElementById('calcModal');
const closeCalcModalBtn = document.getElementById('closeCalcModalBtn');
const calcItemsList = document.getElementById('calcItemsList');
const calcTotalSpain = document.getElementById('calcTotalSpain');
const calcTotalOpt = document.getElementById('calcTotalOpt');
const calcTotalSaving = document.getElementById('calcTotalSaving');
const calcTotalSavingPct = document.getElementById('calcTotalSavingPct');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadSubscriptions();
  updateHeaderBadges();

  // Auto-refresco automático del frontend cada 5 minutos
  setInterval(() => {
    loadSubscriptions(false);
  }, 300000);
});

function setupEventListeners() {
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderGrid();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderGrid();
  });

  closeDetailModalBtn.addEventListener('click', closeDetailModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetailModal();
  });

  closeCalcModalBtn.addEventListener('click', closeCalcModal);
  calcModal.addEventListener('click', (e) => {
    if (e.target === calcModal) closeCalcModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeCalcModal();
    }
  });
}

function updateHeaderBadges() {
  favCountSpan.textContent = state.favorites.length;
  calcSelectedCountSpan.textContent = state.calcSelected.length;
}

// Trigger Auto Sync de Precios en Vivo
async function triggerAutoSync() {
  const syncBtn = document.getElementById('syncBtn');
  if (syncBtn) {
    syncBtn.classList.add('spinning');
    syncBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin text-emerald"></i> <span>Verificando...</span>';
  }
  showToast('🔄 Verificando precios de tiendas oficiales...', 'info');

  try {
    const res = await fetch('/api/subscriptions/auto-sync');
    if (!res.ok) throw new Error('Error en el servidor');
    const data = await res.json();
    state.subscriptions = data.subscriptions || [];
    state.lastUpdated = data.last_updated;
    lastUpdateSpan.textContent = state.lastUpdated;
    renderGrid();
    renderCategories();
    showToast('✅ ¡Precios de tiendas oficiales verificados en tiempo real!', 'success');
  } catch (err) {
    showToast('⚠️ No se pudo completar el auto-sync: ' + err.message, 'error');
  } finally {
    if (syncBtn) {
      syncBtn.classList.remove('spinning');
      syncBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate text-emerald"></i> <span>Auto-Sync</span>';
    }
  }
}

// Carga de Suscripciones
async function loadSubscriptions(forceRefresh = false) {
  showLoader(true);
  try {
    const url = forceRefresh ? '/api/subscriptions/refresh' : '/api/subscriptions';
    const res = await fetch(url);
    const data = await res.json();

    state.subscriptions = data.subscriptions || [];
    state.lastUpdated = data.last_updated || 'Hoy';

    bannerUpdated.innerHTML = `<i class="fa-solid fa-arrows-rotate text-green"></i> Actualizado: ${state.lastUpdated}`;
    totalSubsCount.textContent = state.subscriptions.length;

    renderGrid();
    updateCalculatorSummary();
  } catch (err) {
    console.error(err);
    subsGrid.innerHTML = `<div class="loader-container">Error al conectar con el microservidor.</div>`;
  } finally {
    showLoader(false);
  }
}

async function forceRefreshRates() {
  const btn = document.querySelector('.refresh-rates-btn');
  if (btn) btn.style.transform = 'rotate(360deg)';
  await loadSubscriptions(true);
}

// Filtrar Categoría
function filterCategory(cat) {
  state.currentCategory = cat;

  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.cat === cat);
  });

  const titles = {
    all: '<i class="fa-solid fa-list-check"></i> Todas las Suscripciones',
    Videojuegos: '<i class="fa-solid fa-gamepad text-green"></i> Videojuegos & Gaming',
    'Cine & Series': '<i class="fa-solid fa-film text-cyan"></i> Cine & Series en Streaming',
    'Música & Audio': '<i class="fa-solid fa-music text-gold"></i> Música & Podcasts HiFi',
    'Inteligencia Artificial': '<i class="fa-solid fa-robot text-purple"></i> Inteligencia Artificial & Nube',
    'Productividad & VPN': '<i class="fa-solid fa-shield-halved text-blue"></i> Productividad, Nube & VPN',
    favorites: '<i class="fa-solid fa-star text-gold"></i> Mis Suscripciones Favoritas'
  };

  currentCategoryTitle.innerHTML = titles[cat] || `<i class="fa-solid fa-tag"></i> ${cat}`;
  renderGrid();
}

// Ordenación
function handleSortChange() {
  state.currentSort = sortSelect.value;
  renderGrid();
}

// Renderizado de Tarjetas
function renderGrid() {
  let filtered = [...state.subscriptions];

  if (state.currentCategory === 'favorites') {
    filtered = filtered.filter(s => state.favorites.includes(s.id));
  } else if (state.currentCategory !== 'all') {
    filtered = filtered.filter(s => s.category === state.currentCategory);
  }

  if (state.searchQuery) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(state.searchQuery) ||
      s.category.toLowerCase().includes(state.searchQuery) ||
      (s.notes || '').toLowerCase().includes(state.searchQuery)
    );
  }

  filtered.sort((a, b) => {
    if (state.currentSort === 'saving_eur') {
      return (b.yearly_saving || 0) - (a.yearly_saving || 0);
    } else if (state.currentSort === 'saving_pct') {
      const pctA = a.cheapest_region ? a.cheapest_region.saved_pct : 0;
      const pctB = b.cheapest_region ? b.cheapest_region.saved_pct : 0;
      return pctB - pctA;
    } else if (state.currentSort === 'cheapest_price') {
      const prA = a.cheapest_region ? a.cheapest_region.eur_price : a.spain_price;
      const prB = b.cheapest_region ? b.cheapest_region.eur_price : b.spain_price;
      return prA - prB;
    } else if (state.currentSort === 'spain_price') {
      return a.spain_price - b.spain_price;
    } else if (state.currentSort === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  resultsCount.textContent = `${filtered.length} servicios`;

  if (filtered.length === 0) {
    subsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-dark);"></i>
        <h3>No se encontraron suscripciones</h3>
        <p style="margin-top: 0.5rem;">Prueba con otra categoría o término de búsqueda.</p>
      </div>
    `;
    return;
  }

  subsGrid.innerHTML = filtered.map(sub => {
    const cheapest = sub.cheapest_region;
    const isFav = state.favorites.includes(sub.id);
    const inCalc = state.calcSelected.includes(sub.id);
    const brandImg = getBrandLogo(sub, 36);

    return `
      <div class="sub-card" onclick="openDetailModal('${sub.id}')">
        
        <!-- Acciones Rápidas (Favorito & Calculadora) -->
        <div class="card-top-actions">
          <button class="icon-action-btn fav-btn ${isFav ? 'active' : ''}" title="Guardar en Favoritos" onclick="toggleFavorite(event, '${sub.id}')">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
          </button>
          <button class="icon-action-btn basket-btn ${inCalc ? 'active' : ''}" title="Añadir a Calculadora de Ahorro" onclick="toggleCalcItem(event, '${sub.id}')">
            <i class="fa-solid fa-calculator"></i>
          </button>
        </div>

        <div class="sub-header-banner" style="background: linear-gradient(135deg, ${sub.color}25, #111827);">
          <img src="${sub.image}" class="bg-banner" alt="${sub.name}" onerror="this.style.display='none'">
          <span class="sub-badge-category">${sub.category}</span>
          <div class="sub-icon-badge">
            ${brandImg}
          </div>
        </div>

        <div class="sub-body">
          <h4 class="sub-title">${sub.name}</h4>
          
          <div class="sub-price-comparison">
            <div class="price-row-compare">
              <span class="label">🇪🇸 España (Oficial):</span>
              <span class="val-spain">${sub.spain_price.toFixed(2)}€ / mes</span>
            </div>
            <div class="price-row-compare">
              <span class="label">${cheapest ? cheapest.flag + ' ' + cheapest.region : 'Global'}:</span>
              <span class="val-cheapest">${cheapest ? cheapest.eur_price.toFixed(2) + '€ / mes' : '-'}</span>
            </div>
          </div>

          <div class="sub-saving-banner">
            <i class="fa-solid fa-piggy-bank"></i> Ahorras ${cheapest ? cheapest.saved_pct : 0}% (¡${sub.yearly_saving.toFixed(2)}€/año!)
          </div>

          <div class="card-footer-box">
            <span style="font-size: 0.78rem; color: var(--text-muted);">${(sub.notes || '').substring(0, 46)}...</span>
            <div class="card-btn">
              <span>Comparar</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal de Detalle Comparativo por Países
function openDetailModal(subId) {
  const sub = state.subscriptions.find(s => s.id === subId);
  if (!sub) return;

  const cheapest = sub.cheapest_region;
  const brandImg = getBrandLogo(sub, 52);
  detailModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  detailModalContent.innerHTML = `
    <div class="modal-header-hero">
      <div class="modal-logo-badge">
        ${brandImg}
      </div>
      <div class="modal-info">
        <h3 class="modal-title">${sub.name}</h3>
        <div class="modal-meta">
          <span class="meta-chip score"><i class="fa-solid fa-tag"></i> ${sub.category}</span>
          <span class="meta-chip"><i class="fa-solid fa-piggy-bank text-green"></i> Ahorro: ~${sub.yearly_saving.toFixed(2)}€ / año</span>
          <span class="meta-chip"><i class="fa-solid fa-arrows-rotate"></i> Actualizado: ${state.lastUpdated}</span>
        </div>
        <p class="modal-desc">${sub.notes}</p>
      </div>
    </div>

    ${cheapest && cheapest.saved_pct > 0 ? `
      <div class="best-region-banner">
        <div class="best-region-left">
          <h4><i class="fa-solid fa-trophy"></i> Mejor Precio Global</h4>
          <div class="best-region-name">
            <span class="flag-icon">${cheapest.flag}</span>
            <span>${cheapest.region}</span>
          </div>
        </div>
        <div class="best-region-right">
          <div class="best-price-highlight">${cheapest.eur_price.toFixed(2)}€ <span style="font-size: 0.9rem; font-weight: normal;">/ mes</span></div>
          <div class="savings-highlight">¡Ahorras un ${cheapest.saved_pct}% (${cheapest.saved_eur.toFixed(2)}€ menos al mes vs España)!</div>
        </div>
      </div>
    ` : ''}

    <h4 class="table-header-title"><i class="fa-solid fa-earth-americas"></i> Comparativa de Precios Oficiales por País</h4>
    <div class="regional-table-wrapper">
      <table class="regional-table">
        <thead>
          <tr>
            <th>País / Región</th>
            <th>Precio Moneda Local</th>
            <th>Precio Convertido en EUR (€)</th>
            <th>Ahorro vs España</th>
          </tr>
        </thead>
        <tbody>
          ${(sub.regional_prices || []).map(r => `
            <tr class="${r.region === cheapest.region && r.saved_pct > 0 ? 'cheapest-row' : ''} ${r.region.includes('España') ? 'spain-row' : ''}">
              <td>
                <div class="region-cell">
                  <span class="flag-icon">${r.flag}</span>
                  <span>${r.region}</span>
                  ${r.region.includes('España') ? '<span style="font-size: 0.75rem; color: var(--accent-blue); font-weight: 700;">(Oficial)</span>' : ''}
                </div>
              </td>
              <td style="font-family: var(--font-mono);">${r.local_amount.toFixed(2)} ${r.currency} / mes</td>
              <td style="font-family: var(--font-mono); font-weight: 700; color: ${r.region === cheapest.region ? 'var(--accent-green)' : 'var(--text-main)'};">
                ${r.eur_price.toFixed(2)}€ / mes
              </td>
              <td>
                ${r.saved_pct > 0 
                  ? `<span class="savings-badge">-${r.saved_pct}% (-${r.saved_eur.toFixed(2)}€/mes)</span>` 
                  : `<span class="savings-badge zero">-</span>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function closeDetailModal() {
  detailModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Calculadora de Cesta de Ahorro
function openCalculatorModal() {
  renderCalculatorList();
  updateCalculatorSummary();
  calcModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCalcModal() {
  calcModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function renderCalculatorList() {
  calcItemsList.innerHTML = state.subscriptions.map(sub => {
    const isSelected = state.calcSelected.includes(sub.id);
    const cheapest = sub.cheapest_region;
    const brandImg = getBrandLogo(sub, 24);

    return `
      <div class="calc-item-row ${isSelected ? 'selected' : ''}" onclick="toggleCalcRow('${sub.id}')">
        <div class="calc-item-left">
          <div class="calc-checkbox">
            ${isSelected ? '<i class="fa-solid fa-check"></i>' : ''}
          </div>
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); overflow: hidden;">
            ${brandImg}
          </div>
          <div>
            <div class="calc-item-name">${sub.name}</div>
            <div class="calc-item-category">${sub.category} &bull; España: ${sub.spain_price.toFixed(2)}€/mes</div>
          </div>
        </div>
        <div class="calc-item-price">
          <div style="color: var(--accent-green); font-weight: 700;">${cheapest ? cheapest.eur_price.toFixed(2) + '€' : '-'}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${cheapest ? cheapest.flag + ' ' + cheapest.region : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleCalcRow(id) {
  const idx = state.calcSelected.indexOf(id);
  if (idx >= 0) {
    state.calcSelected.splice(idx, 1);
  } else {
    state.calcSelected.push(id);
  }
  localStorage.setItem('pixelsubs_calc', JSON.stringify(state.calcSelected));
  updateHeaderBadges();
  renderCalculatorList();
  updateCalculatorSummary();
  renderGrid();
}

function toggleCalcItem(e, id) {
  e.stopPropagation();
  toggleCalcRow(id);
}

function updateCalculatorSummary() {
  let spainYearlyTotal = 0;
  let optYearlyTotal = 0;

  state.calcSelected.forEach(id => {
    const sub = state.subscriptions.find(s => s.id === id);
    if (sub) {
      spainYearlyTotal += sub.spain_yearly || (sub.spain_price * 12);
      optYearlyTotal += sub.cheapest_yearly || (sub.cheapest_region ? sub.cheapest_region.eur_price * 12 : sub.spain_price * 12);
    }
  });

  const savingYearly = Math.max(0, spainYearlyTotal - optYearlyTotal);
  const savingPct = spainYearlyTotal > 0 ? Math.round((savingYearly / spainYearlyTotal) * 100) : 0;

  calcTotalSpain.textContent = `${spainYearlyTotal.toFixed(2)}€ / año (${(spainYearlyTotal / 12).toFixed(2)}€/mes)`;
  calcTotalOpt.textContent = `${optYearlyTotal.toFixed(2)}€ / año (${(optYearlyTotal / 12).toFixed(2)}€/mes)`;
  calcTotalSaving.textContent = `${savingYearly.toFixed(2)}€ / año`;
  calcTotalSavingPct.textContent = `¡Ahorras un ${savingPct}% neto al año (${(savingYearly / 12).toFixed(2)}€ al mes)!`;
}

// Favoritos
function toggleFavorite(e, id) {
  e.stopPropagation();
  const idx = state.favorites.indexOf(id);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.push(id);
  }
  localStorage.setItem('pixelsubs_favs', JSON.stringify(state.favorites));
  updateHeaderBadges();
  renderGrid();
}

function showLoader(show) {
  loader.style.display = show ? 'block' : 'none';
  if (show) subsGrid.style.display = 'none';
  else subsGrid.style.display = 'grid';
}
