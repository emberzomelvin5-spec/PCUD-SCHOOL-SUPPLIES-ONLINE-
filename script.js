/* ============================================================
   PCUD SUPPLIES HUB — script.js
   "Database" powered by localStorage
   ============================================================ */

/* ============================================================
   SECTION 1: DATABASE (localStorage)
   All data is stored here — acts as the database
   ============================================================ */

// --- Users Table ---
const DB_USERS    = 'pcud_users';
const DB_ORDERS   = 'pcud_orders';
const DB_PRODUCTS = 'pcud_products';
const DB_SESSION  = 'pcud_session';

function dbGetUsers()      { return JSON.parse(localStorage.getItem(DB_USERS)    || '[]'); }
function dbSaveUsers(data) { localStorage.setItem(DB_USERS,    JSON.stringify(data)); }

function dbGetOrders()      { return JSON.parse(localStorage.getItem(DB_ORDERS)   || '[]'); }
function dbSaveOrders(data) { localStorage.setItem(DB_ORDERS,   JSON.stringify(data)); }

function dbGetProducts()      { return JSON.parse(localStorage.getItem(DB_PRODUCTS) || 'null'); }
function dbSaveProducts(data) { localStorage.setItem(DB_PRODUCTS, JSON.stringify(data)); }

function dbGetSession()      { return JSON.parse(localStorage.getItem(DB_SESSION)  || 'null'); }
function dbSaveSession(data) { localStorage.setItem(DB_SESSION,  JSON.stringify(data)); }
function dbClearSession()    { localStorage.removeItem(DB_SESSION); }

/* ============================================================
   SECTION 2: SEED DATA (Default records on first load)
   ============================================================ */

// Default Products (16 items) — stock field added
const DEFAULT_PRODUCTS = [
  { id: 1,  name: 'Ballpen Blue',      price: 8,  cat: 'writing', em: '🖊️', stock: 50 },
  { id: 2,  name: 'Ballpen Black',     price: 8,  cat: 'writing', em: '✒️', stock: 50 },
  { id: 3,  name: 'Pencil #2',         price: 6,  cat: 'writing', em: '✏️', stock: 30 },
  { id: 4,  name: 'Highlighter',       price: 25, cat: 'writing', em: '🖍️', stock: 20 },
  { id: 5,  name: 'Permanent Marker',  price: 30, cat: 'writing', em: '🖊️', stock: 3  },
  { id: 6,  name: 'Notebook Big',      price: 55, cat: 'paper',   em: '📓', stock: 15 },
  { id: 7,  name: 'Notebook Small',    price: 35, cat: 'paper',   em: '📔', stock: 25 },
  { id: 8,  name: 'Pad Paper',         price: 18, cat: 'paper',   em: '📄', stock: 40 },
  { id: 9,  name: 'Index Cards',       price: 15, cat: 'paper',   em: '🗒️', stock: 0  },
  { id: 10, name: 'Bond Paper (10s)',  price: 12, cat: 'paper',   em: '📃', stock: 10 },
  { id: 11, name: 'Coloring Pens',     price: 75, cat: 'art',     em: '🎨', stock: 8  },
  { id: 12, name: 'Watercolor Set',    price: 95, cat: 'art',     em: '🖌️', stock: 5  },
  { id: 13, name: 'Ruler 30cm',        price: 20, cat: 'org',     em: '📏', stock: 0  },
  { id: 14, name: 'Folder',            price: 18, cat: 'org',     em: '📁', stock: 22 },
  { id: 15, name: 'Scotch Tape',       price: 15, cat: 'org',     em: '🧲', stock: 12 },
  { id: 16, name: 'Stapler',           price: 85, cat: 'org',     em: '🔩', stock: 4  },
];

// Default Users
const DEFAULT_USERS = [
  { id: 'admin',    name: 'Admin',        course: '',         role: 'admin',   pw: 'admin123' },
  { id: 'student1', name: 'Maria Santos', course: 'BSCPE-2A', role: 'student', pw: '1234'    },
];

// Seed database on first load
if (!dbGetProducts())       { dbSaveProducts(DEFAULT_PRODUCTS); }
if (!dbGetUsers().length)   { dbSaveUsers(DEFAULT_USERS); }

/* ============================================================
   SECTION 3: APP STATE (in-memory variables)
   ============================================================ */
let currentUser = null;   // logged-in user object
let cart        = [];     // current cart items
let currentCat  = 'all'; // active product category filter
let selectedPay = null;   // selected payment method

/* ============================================================
   SECTION 4: PAGE NAVIGATION
   ============================================================ */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  // Render page content when navigating
  if (pageId === 'page-store')    renderStore();
  if (pageId === 'page-cart')     renderCart();
  if (pageId === 'page-checkout') renderCheckoutSummary();
  if (pageId === 'page-orders')   renderMyOrders();
  if (pageId === 'page-admin')    renderAdminOrders();
}

/* ============================================================
   SECTION 5: AUTHENTICATION
   ============================================================ */

// LOGIN
function doLogin() {
  const id = document.getElementById('lid').value.trim();
  const pw = document.getElementById('lpw').value;
  const errEl = document.getElementById('lerr');

  if (!id || !pw) { showError(errEl, 'Please fill in all fields.'); return; }

  const user = dbGetUsers().find(u => u.id === id && u.pw === pw);
  if (!user)  { showError(errEl, 'Invalid ID or password. Try: student1 / 1234'); return; }

  errEl.classList.remove('show');
  loginUser(user);
}

// REGISTER
function doRegister() {
  const name   = document.getElementById('rname').value.trim();
  const id     = document.getElementById('rid').value.trim();
  const course = document.getElementById('rcourse').value.trim();
  const role   = document.getElementById('rrole').value;
  const pw     = document.getElementById('rpw').value;
  const pw2    = document.getElementById('rpw2').value;
  const errEl  = document.getElementById('rerr');

  if (!name || !id || !pw || !pw2) { showError(errEl, 'Please fill in all required fields.'); return; }
  if (pw !== pw2)  { showError(errEl, 'Passwords do not match.'); return; }
  if (pw.length < 4) { showError(errEl, 'Password must be at least 4 characters.'); return; }

  const users = dbGetUsers();
  if (users.find(u => u.id === id)) { showError(errEl, 'Student ID already registered.'); return; }

  // Save new user to database
  const newUser = { id, name, course, role, pw };
  users.push(newUser);
  dbSaveUsers(users);

  // Clear register form
  ['rname', 'rid', 'rcourse', 'rpw', 'rpw2'].forEach(fieldId => {
    document.getElementById(fieldId).value = '';
  });
  errEl.classList.remove('show');

  loginUser(newUser);
  showToast('🎉 Account created! Welcome, ' + newUser.name.split(' ')[0] + '!');
}

// ADMIN QUICK LOGIN — now hidden, triggered by secret modal only
function adminLogin() {
  const u = dbGetUsers().find(u => u.id === 'admin');
  if (u) loginUser(u);
}

// LOGIN USER — set session and navigate
function loginUser(user) {
  currentUser = user;
  dbSaveSession(user); // auto-login session

  cart = []; // reset cart on login
  updateCartBadge();

  if (user.role === 'admin') {
    showPage('page-admin');
  } else {
    document.getElementById('nav-av').textContent = user.name.charAt(0).toUpperCase();
    showPage('page-store');
  }
}

// LOGOUT
function doLogout() {
  currentUser = null;
  cart        = [];
  selectedPay = null;
  dbClearSession();
  updateCartBadge();

  // Clear login form
  document.getElementById('lid').value = '';
  document.getElementById('lpw').value = '';
  document.getElementById('lerr').classList.remove('show');

  showPage('page-login');
}

/* ============================================================
   SECTION 6: STORE — PRODUCTS
   ============================================================ */

function renderStore() {
  const products = dbGetProducts();
  const searchQ  = (document.getElementById('search-inp').value || '').toLowerCase();

  // Filter by category and search query
  const filtered = products.filter(p => {
    const matchCat    = currentCat === 'all' || p.cat === currentCat;
    const matchSearch = p.name.toLowerCase().includes(searchQ);
    return matchCat && matchSearch;
  });

  const grid = document.getElementById('prod-grid');

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">🔍</div>
        <p>No products found.</p>
        <small>Try a different search or category.</small>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const stock    = p.stock ?? 0;
    const outStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const stockBadge = outStock
      ? `<span class="stock-badge out">Out of Stock</span>`
      : lowStock
        ? `<span class="stock-badge low">⚠️ Low: ${stock} left</span>`
        : `<span class="stock-badge ok">✅ In Stock (${stock})</span>`;
    return `
    <div class="prod-card ${outStock ? 'out-of-stock' : ''}" style="animation-delay:${i * 0.04}s">
      <div class="prod-em">${p.em}</div>
      <div class="prod-name">${p.name}</div>
      <div class="prod-price">₱${p.price.toFixed(2)}</div>
      ${stockBadge}
      <button class="btn-atc" onclick="addToCart(${p.id})" ${outStock ? 'disabled' : ''}>${outStock ? 'Out of Stock' : '+ Add to Cart'}</button>
    </div>`;
  }).join('');

  // Update stats
  const myOrders = dbGetOrders().filter(o => o.userId === currentUser?.id);
  document.getElementById('s-prods').textContent  = products.length;
  document.getElementById('s-cart').textContent   = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById('s-orders').textContent = myOrders.length;
}

function setCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStore();
}

function filterProds() { renderStore(); }

/* ============================================================
   SECTION 7: CART
   ============================================================ */

function addToCart(productId) {
  const products = dbGetProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  const stock = product.stock ?? 0;
  if (stock <= 0) { showToast('❌ ' + product.name + ' is out of stock!'); return; }

  // Check if adding more than available stock
  const existing = cart.find(c => c.id === productId);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty >= stock) {
    showToast('⚠️ Only ' + stock + ' left in stock!');
    return;
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  showToast(product.em + ' ' + product.name + ' added to cart!');
  renderStore();
}

function updateCartBadge() {
  const total = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById('cart-badge').textContent = total;
}

function goCart() { showPage('page-cart'); }

function renderCart() {
  const listEl = document.getElementById('cart-list');
  const sumEl  = document.getElementById('cart-sum');

  if (!cart.length) {
    listEl.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">🛒</div>
        <p>Your cart is empty.</p>
        <small>Go back and add some products!</small>
      </div>`;
    sumEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-em">${item.em}</div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">₱${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="ci-ctrl">
        <button class="qbtn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qnum">${item.qty}</span>
        <button class="qbtn" onclick="changeQty(${item.id}, 1)">+</button>
        <button class="rem-btn" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>`).join('');

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  sumEl.innerHTML = `
    <div class="cart-sum">
      <div class="sum-row"><span>Subtotal</span><span>₱${subtotal.toFixed(2)}</span></div>
      <div class="sum-row"><span>Delivery</span><span style="color:var(--green);font-weight:700">FREE</span></div>
      <div class="sum-row total"><span>Total</span><span>₱${subtotal.toFixed(2)}</span></div>
      <br/>
      <button class="btn-main" onclick="showPage('page-checkout')">Proceed to Checkout →</button>
    </div>`;
}

function changeQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { updateCartBadge(); renderCart(); }
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  updateCartBadge();
  renderCart();
  showToast('Item removed from cart.');
}

/* ============================================================
   SECTION 8: CHECKOUT
   ============================================================ */

function renderCheckoutSummary() {
  const el       = document.getElementById('ck-summary');
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  el.innerHTML = cart.map(item => `
    <div class="ck-sum-item">
      <span>${item.em} ${item.name} ×${item.qty}</span>
      <span>₱${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('')
    + `<div class="ck-sum-total"><span>Total</span><span>₱${subtotal.toFixed(2)}</span></div>`;

  // Reset payment selection
  selectedPay = null;
  document.querySelectorAll('.pay-card').forEach(p => p.classList.remove('sel'));
  document.getElementById('gcash-box').classList.remove('show');
}

function selPay(type) {
  selectedPay = type;
  document.querySelectorAll('.pay-card').forEach(p => p.classList.remove('sel'));
  document.getElementById('pc-' + type).classList.add('sel');

  if (type === 'gcash') document.getElementById('gcash-box').classList.add('show');
  else                  document.getElementById('gcash-box').classList.remove('show');
}

function placeOrder() {
  // Validations
  if (!cart.length)    { showToast('⚠️ Your cart is empty!'); return; }
  if (!selectedPay)    { showToast('⚠️ Please select a payment method.'); return; }

  const note = document.getElementById('ck-note').value.trim();
  if (!note) { showToast('⚠️ Please enter your room number or pickup location.'); return; }

  // Build order object
  const orderId  = 'ORD-' + Date.now().toString().slice(-6);
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const newOrder = {
    id:       orderId,
    userId:   currentUser.id,
    userName: currentUser.name,
    items:    [...cart],
    total:    subtotal,
    payment:  selectedPay,
    note:     note,
    status:   'Processing',
    date:     new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  // Save order to database
  const orders = dbGetOrders();
  orders.push(newOrder);
  dbSaveOrders(orders);

  // Deduct stock for each ordered item
  const products = dbGetProducts();
  cart.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (prod) prod.stock = Math.max(0, (prod.stock ?? 0) - item.qty);
  });
  dbSaveProducts(products);

  // Reset cart and payment
  cart        = [];
  selectedPay = null;
  updateCartBadge();
  document.getElementById('ck-note').value = '';

  // Show confirmation
  document.getElementById('conf-msg').textContent =
    `Order #${orderId} received! Payment: ${newOrder.payment === 'gcash' ? 'GCash QR' : 'Cash on Pickup'}. Pickup/Delivery: ${note}.`;

  showPage('page-confirm');
  showToast('🎉 Order placed successfully!');
}

/* ============================================================
   SECTION 9: MY ORDERS
   ============================================================ */

function renderMyOrders() {
  const el     = document.getElementById('orders-wrap');
  const orders = dbGetOrders()
    .filter(o => o.userId === currentUser?.id)
    .reverse(); // newest first

  if (!orders.length) {
    el.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">📦</div>
        <p>No orders yet.</p>
        <small>Place your first order to see it here.</small>
      </div>`;
    return;
  }

  el.innerHTML = orders.map(o => `
    <div class="ord-card">
      <div class="ord-top">
        <span class="ord-id">${o.id}</span>
        <span class="ord-badge ${o.status.toLowerCase().replace(/ /g, '')}">${o.status}</span>
      </div>
      <div class="ord-items">${o.items.map(i => `${i.em} ${i.name} ×${i.qty}`).join(', ')}</div>
      <div class="ord-meta"><strong>₱${o.total.toFixed(2)}</strong> · ${o.date} · ${o.payment === 'gcash' ? '📱 GCash' : '💵 Cash'}</div>
      <div class="ord-meta" style="margin-top:4px">📍 ${o.note}</div>
    </div>`).join('');
}

/* ============================================================
   SECTION 10: ADMIN PANEL
   ============================================================ */

function aTab(tab, btn) {
  document.querySelectorAll('.adm-sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('adm-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');

  if (tab === 'orders')    renderAdminOrders();
  if (tab === 'products')  renderAdminProducts();
  if (tab === 'inquiries') renderAdminInquiries();
}

// --- Admin: All Orders ---
function renderAdminOrders() {
  const el     = document.getElementById('adm-ord-list');
  const orders = dbGetOrders().slice().reverse();

  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--muted)">No orders yet.</p>';
    return;
  }

  el.innerHTML = orders.map((o, i) => `
    <div class="adm-ord-card">
      <div class="adm-ord-top"><strong>${o.id}</strong><span>${o.date}</span></div>
      <div class="adm-det">👤 ${o.userName} &nbsp;·&nbsp; 💳 ${o.payment === 'gcash' ? 'GCash QR' : 'Cash on Pickup'}</div>
      <div class="adm-det">📍 ${o.note}</div>
      <div class="adm-det">${o.items.map(it => `${it.em} ${it.name} ×${it.qty}`).join(', ')}</div>
      <div class="adm-det"><strong>Total: ₱${o.total.toFixed(2)}</strong></div>
      <select class="status-sel" onchange="updateOrderStatus(${dbGetOrders().length - 1 - i}, this.value)">
        <option ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
        <option ${o.status === 'On the Way' ? 'selected' : ''}>On the Way</option>
        <option ${o.status === 'Delivered'  ? 'selected' : ''}>Delivered</option>
        <option ${o.status === 'Cancelled'  ? 'selected' : ''}>Cancelled</option>
      </select>
    </div>`).join('');
}

function updateOrderStatus(index, status) {
  const orders = dbGetOrders();
  const realIndex = orders.length - 1 - index;
  if (orders[realIndex]) {
    orders[realIndex].status = status;
    dbSaveOrders(orders);
    showToast('✅ Order status updated to: ' + status);
  }
}

// --- Admin: Products ---
function renderAdminProducts() {
  const el       = document.getElementById('adm-prod-list');
  const products = dbGetProducts();

  el.innerHTML = products.map(p => {
    const stock    = p.stock ?? 0;
    const outStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const stockColor = outStock ? 'var(--red)' : lowStock ? '#c49b00' : 'var(--green)';
    const stockLabel = outStock ? '❌ Out of Stock' : lowStock ? '⚠️ Low Stock' : '✅ In Stock';
    return `
    <div class="adm-prod-item">
      <span style="font-size:26px">${p.em}</span>
      <div class="info">
        <strong>${p.name}</strong>
        <span>₱${p.price} &nbsp;·&nbsp; ${p.cat} &nbsp;·&nbsp; <span style="color:${stockColor};font-weight:700">${stockLabel} (${stock})</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <input type="number" min="0" value="${stock}" id="stock-${p.id}"
          style="width:70px;padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;outline:none;"
          onkeydown="if(event.key==='Enter') updateStock(${p.id})"
        />
        <button class="btn-stock" onclick="updateStock(${p.id})">Update Stock</button>
        <button class="btn-del" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function updateStock(productId) {
  const input    = document.getElementById('stock-' + productId);
  const newStock = parseInt(input.value);
  if (isNaN(newStock) || newStock < 0) { showToast('⚠️ Enter a valid stock number.'); return; }

  const products = dbGetProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  product.stock = newStock;
  dbSaveProducts(products);
  renderAdminProducts();
  showToast('📦 Stock updated: ' + product.name + ' → ' + newStock + ' pcs');
}

function addProd() {
  const name  = document.getElementById('np-name').value.trim();
  const price = parseFloat(document.getElementById('np-price').value);
  const cat   = document.getElementById('np-cat').value;
  const em    = document.getElementById('np-em').value.trim() || '📦';
  const stock = parseInt(document.getElementById('np-stock').value) || 0;

  if (!name || isNaN(price)) {
    showToast('⚠️ Please fill in product name and price.');
    return;
  }

  const products = dbGetProducts();
  const newId    = Math.max(...products.map(p => p.id), 0) + 1;
  products.push({ id: newId, name, price, cat, em, stock });
  dbSaveProducts(products);

  // Clear form
  document.getElementById('np-name').value  = '';
  document.getElementById('np-price').value = '';
  document.getElementById('np-em').value    = '';
  document.getElementById('np-stock').value = '';

  renderAdminProducts();
  showToast('✅ Product "' + name + '" added with ' + stock + ' stock!');
}

function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  dbSaveProducts(dbGetProducts().filter(p => p.id !== productId));
  renderAdminProducts();
  showToast('🗑️ Product deleted.');
}

// --- Admin: Inquiries (Delivery Notes) ---
function renderAdminInquiries() {
  const el    = document.getElementById('adm-inq-list');
  const notes = dbGetOrders().filter(o => o.note).slice().reverse();

  if (!notes.length) {
    el.innerHTML = '<p style="color:var(--muted)">No delivery notes yet.</p>';
    return;
  }

  el.innerHTML = notes.map(o => `
    <div class="inq-card">
      <strong>${o.id} — ${o.userName}</strong>
      <p>📍 ${o.note} &nbsp;·&nbsp; ${o.date}</p>
    </div>`).join('');
}

/* ============================================================
   SECTION 11: TOAST NOTIFICATION
   ============================================================ */
let toastTimer;
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ============================================================
   SECTION 12: HELPERS
   ============================================================ */
function showError(el, message) {
  el.textContent = '⚠️ ' + message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

/* ============================================================
   SECTION 14: SECRET ADMIN ACCESS
   Hidden from students — only you know this shortcut!
   Shortcut: Ctrl + Shift + A  (on the Login page)
   ============================================================ */

function showAdminModal() {
  // Only show on login page
  if (!document.getElementById('page-login').classList.contains('active')) return;

  // Create modal if not existing
  if (document.getElementById('admin-modal')) {
    document.getElementById('admin-modal').style.display = 'flex';
    document.getElementById('adm-pw-inp').value = '';
    document.getElementById('adm-pw-inp').focus();
    document.getElementById('adm-modal-err').style.display = 'none';
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.innerHTML = `
    <div id="admin-modal-box">
      <div id="adm-modal-icon">🛠️</div>
      <h3>Admin Access</h3>
      <p>Enter your admin password to continue.</p>
      <div id="adm-modal-err"></div>
      <input type="password" id="adm-pw-inp" placeholder="Admin password" autocomplete="off"/>
      <div id="adm-modal-btns">
        <button id="adm-cancel-btn" onclick="closeAdminModal()">Cancel</button>
        <button id="adm-login-btn" onclick="submitAdminLogin()">Enter</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeAdminModal();
  });

  // Enter key submits
  document.getElementById('adm-pw-inp').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitAdminLogin();
  });

  setTimeout(() => document.getElementById('adm-pw-inp').focus(), 100);
}

function submitAdminLogin() {
  const pw    = document.getElementById('adm-pw-inp').value;
  const errEl = document.getElementById('adm-modal-err');
  const admin = dbGetUsers().find(u => u.id === 'admin');

  if (!pw) { showModalErr(errEl, 'Please enter the password.'); return; }
  if (!admin || pw !== admin.pw) {
    showModalErr(errEl, 'Incorrect password.');
    document.getElementById('adm-pw-inp').value = '';
    document.getElementById('adm-pw-inp').focus();
    return;
  }

  closeAdminModal();
  loginUser(admin);
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
}

function showModalErr(el, msg) {
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

// ---- Secret Keyboard Shortcut: Ctrl + Shift + A ----
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    showAdminModal();
  }
});

// ---- You can also change admin password here ----
// To change: go to Browser Console → type:
// changeAdminPassword('yournewpassword')
function changeAdminPassword(newPw) {
  if (!newPw || newPw.length < 4) { console.log('Password too short!'); return; }
  const users = dbGetUsers();
  const admin = users.find(u => u.id === 'admin');
  if (admin) {
    admin.pw = newPw;
    dbSaveUsers(users);
    console.log('✅ Admin password changed successfully!');
  }
}

/* ============================================================
   SECTION 15: AUTO-LOGIN (check session on page load)
   ============================================================ */
(function initApp() {
  const session = dbGetSession();
  if (!session) return;

  const user = dbGetUsers().find(u => u.id === session.id && u.pw === session.pw);
  if (user) loginUser(user);
})();