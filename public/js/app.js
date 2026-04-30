
// --- SECURITY UTILS ---
window.escapeHTML = function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ===== Medical ERP - Main App =====
let currentUser = null;
let isArabic = localStorage.getItem('namaLang') === 'ar' ? true : (localStorage.getItem('namaLang') === 'en' ? false : false);
let currentPage = 0;
let facilityType = 'hospital';
const FACILITY_ALLOWED = {
  hospital: null, // null = all allowed
  health_center: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 20, 21, 30, 33, 34, 35, 41, 42],
  clinic: [0, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 20, 30, 34, 42]
};

const tr = (en, ar) => isArabic ? ar : en;

// Navigation items with hierarchical grouping
const NAV_ITEMS = [
  { icon: '📊', en: 'Dashboard', ar: 'لوحة التحكم' },
  { icon: '🏥', en: 'Reception', ar: 'الاستقبال' },
  { icon: '📅', en: 'Appointments', ar: 'المواعيد' },
  { icon: '👨‍⚕️', en: 'Doctor Station', ar: 'محطة الطبيب' },
  { icon: '🔬', en: 'Laboratory', ar: 'المختبر' },
  { icon: '📡', en: 'Radiology', ar: 'الأشعة' },
  { icon: '💊', en: 'Pharmacy', ar: 'الصيدلية' },
  { icon: '🏢', en: 'HR', ar: 'الموارد البشرية' },
  { icon: '💰', en: 'Finance', ar: 'المالية' },
  { icon: '🛡️', en: 'Insurance', ar: 'التأمين' },
  { icon: '📦', en: 'Inventory', ar: 'المخازن' },
  { icon: '👩‍⚕️', en: 'Nursing', ar: 'التمريض' },
  { icon: '🪑', en: 'Waiting Queue', ar: 'قائمة الانتظار' },
  { icon: '💳', en: 'Patient Accounts', ar: 'حسابات المرضى' },
  { icon: '📋', en: 'Reports', ar: 'التقارير' },
  { icon: '✉️', en: 'Messaging', ar: 'الرسائل' },
  { icon: '📂', en: 'Catalog', ar: 'الأصناف' },
  { icon: '📤', en: 'Dept Requests', ar: 'طلبات الأقسام' },
  { icon: '🏥', en: 'Surgery & Pre-Op', ar: 'العمليات وما قبلها' },
  { icon: '🩸', en: 'Blood Bank', ar: 'بنك الدم' },
  { icon: '📜', en: 'Consent Forms', ar: 'الإقرارات' },
  { icon: '🚨', en: 'Emergency', ar: 'الطوارئ' },
  { icon: '🛏️', en: 'Inpatient ADT', ar: 'التنويم' },
  { icon: '🫀', en: 'ICU', ar: 'العناية المركزة' },
  { icon: '🧹', en: 'CSSD', ar: 'التعقيم المركزي' },
  { icon: '🍽️', en: 'Dietary', ar: 'التغذية' },
  { icon: '🦠', en: 'Infection Control', ar: 'مكافحة العدوى' },
  { icon: '📊', en: 'Quality', ar: 'الجودة' },
  { icon: '🔧', en: 'Maintenance', ar: 'الصيانة' },
  { icon: '🚑', en: 'Transport', ar: 'نقل المرضى' },
  { icon: '📁', en: 'Medical Records', ar: 'السجلات الطبية' },
  { icon: '💊', en: 'Clinical Pharmacy', ar: 'الصيدلية السريرية' },
  { icon: '🏋️', en: 'Rehabilitation', ar: 'إعادة التأهيل' },
  { icon: '📱', en: 'Patient Portal', ar: 'بوابة المرضى' },
  { icon: '🧾', en: 'ZATCA E-Invoice', ar: 'فوترة إلكترونية' },
  { icon: '📹', en: 'Telemedicine', ar: 'الطب عن بعد' },
  { icon: '🔬', en: 'Pathology', ar: 'علم الأمراض' },
  { icon: '🤝', en: 'Social Work', ar: 'الخدمة الاجتماعية' },
  { icon: '🏛️', en: 'Mortuary', ar: 'خدمة الوفيات' },
  { icon: '🎓', en: 'CME', ar: 'التعليم الطبي' },
  { icon: '💎', en: 'Cosmetic Surgery', ar: 'جراحة التجميل' },
  { icon: '🤰', en: 'OB/GYN', ar: 'النساء والتوليد' },
  { icon: '⚙️', en: 'Settings', ar: 'الإعدادات' },
  { icon: '🩺', en: 'Consultation', ar: 'الكشف' },
  { icon: '🏢', en: 'Departments Catalog', ar: 'دليل الأقسام' },
  { icon: '🛣️', en: 'Clinical Pathways', ar: 'المسارات السريرية' },
  { icon: '🔬', en: 'Academic & Research', ar: 'البحث الأكاديمي' },
  { icon: '🖥️', en: 'APP SERVER Portal', ar: 'بوابة التطبيقات' }
];

// ===== 3-Level Hierarchical Navigation (Epic/Cerner-grade) =====
// Structure: Section (L0) → Group (L1) → Items (L2) → Sub-items (L3)
const NAV_SECTIONS = [
  { en: 'CLINICAL', ar: 'السريري' },
  { en: 'OPERATIONS', ar: 'العمليات' },
  { en: 'ADMIN & FINANCE', ar: 'الإدارة والمالية' },
  { en: 'SYSTEM', ar: 'النظام' }
];

const NAV_GROUPS = [
  // ── SECTION 0: CLINICAL ──
  { section: 0, en: 'Dashboard', ar: 'لوحة التحكم', icon: '📊', items: [0], open: true },
  { section: 0, en: 'Patient Flow', ar: 'تدفق المرضى', icon: '🏥', items: [1, 2, 12, 43], open: true,
    l3: { 1: [{en:'Walk-in',ar:'بدون موعد'},{en:'Scheduled',ar:'بموعد'}], 2: [{en:'Calendar',ar:'التقويم'},{en:'No-show',ar:'الغياب'}] } },
  { section: 0, en: 'Clinical Station', ar: 'المحطة السريرية', icon: '🩺', items: [3, 20, 21, 23], open: true,
    l3: { 3: [{en:'CPOE Orders',ar:'الأوامر الطبية'},{en:'Progress Notes',ar:'ملاحظات التقدم'},{en:'Drug Alerts',ar:'تنبيهات الأدوية'}] } },
  { section: 0, en: 'Nursing', ar: 'التمريض', icon: '👩‍⚕️', items: [11],
    l3: { 11: [{en:'Vitals',ar:'العلامات الحيوية'},{en:'Flowsheets',ar:'أوراق المتابعة'},{en:'Pain & GCS',ar:'الألم والوعي'},{en:'I/O Balance',ar:'الداخل والخارج'}] } },
  { section: 0, en: 'Emergency & ICU', ar: 'الطوارئ والعناية', icon: '🚨', items: [21, 23] },

  // ── SECTION 1: OPERATIONS ──
  { section: 1, en: 'Laboratory', ar: 'المختبر', icon: '🔬', items: [4],
    l3: { 4: [{en:'New Orders',ar:'طلبات جديدة'},{en:'Results',ar:'النتائج'},{en:'Catalog',ar:'الكتالوج'},{en:'Pending',ar:'قيد الانتظار'}] } },
  { section: 1, en: 'Radiology', ar: 'الأشعة', icon: '📡', items: [5],
    l3: { 5: [{en:'Orders',ar:'الطلبات'},{en:'Images',ar:'الصور'},{en:'Reports',ar:'التقارير'}] } },
  { section: 1, en: 'Pharmacy', ar: 'الصيدلية', icon: '💊', items: [6, 31, 16],
    l3: { 6: [{en:'Dispense Queue',ar:'صرف الأدوية'},{en:'Stock',ar:'المخزون'},{en:'Drug Interactions',ar:'التداخلات'}] } },
  { section: 1, en: 'Pathology', ar: 'علم الأمراض', icon: '🔬', items: [36] },
  { section: 1, en: 'Surgery Center', ar: 'مركز العمليات', icon: '🏥', items: [18, 19, 24, 40],
    l3: { 18: [{en:'Schedule',ar:'الجدول'},{en:'Pre-Op',ar:'ما قبل العملية'},{en:'Tracking',ar:'التتبع'}] } },
  { section: 1, en: 'Blood Bank', ar: 'بنك الدم', icon: '🩸', items: [19] },
  { section: 1, en: 'Support Services', ar: 'الخدمات المساندة', icon: '🔧', items: [25, 26, 24, 28, 29, 32],
    l3: { 25: [{en:'Menu Plans',ar:'الوجبات'}], 26: [{en:'Surveillance',ar:'المراقبة'},{en:'Reports',ar:'التقارير'}] } },

  // ── SECTION 2: ADMIN & FINANCE ──
  { section: 2, en: 'Finance', ar: 'المالية', icon: '💰', items: [8, 13, 34],
    l3: { 8: [{en:'Invoices',ar:'الفواتير'},{en:'Payments',ar:'المدفوعات'},{en:'Revenue',ar:'الإيرادات'}], 34: [{en:'E-Invoicing',ar:'الفوترة الإلكترونية'},{en:'ZATCA Reports',ar:'تقارير زاتكا'}] } },
  { section: 2, en: 'Insurance', ar: 'التأمين', icon: '🛡️', items: [9],
    l3: { 9: [{en:'Companies',ar:'الشركات'},{en:'NPHIES',ar:'نفيس'},{en:'Claims',ar:'المطالبات'},{en:'Eligibility',ar:'الأهلية'}] } },
  { section: 2, en: 'Human Resources', ar: 'الموارد البشرية', icon: '🏢', items: [7],
    l3: { 7: [{en:'Employees',ar:'الموظفين'},{en:'Attendance',ar:'الحضور'},{en:'Payroll',ar:'الرواتب'}] } },
  { section: 2, en: 'Inventory', ar: 'المخازن', icon: '📦', items: [10, 17],
    l3: { 10: [{en:'Stock',ar:'المخزون'},{en:'Purchase Orders',ar:'أوامر الشراء'},{en:'Dept Requests',ar:'طلبات الأقسام'}] } },
  { section: 2, en: 'Reports', ar: 'التقارير', icon: '📋', items: [14, 27, 30],
    l3: { 14: [{en:'Daily Reports',ar:'التقارير اليومية'},{en:'Statistics',ar:'الإحصائيات'},{en:'Export',ar:'تصدير'}] } },

  // ── SECTION 3: SYSTEM ──
  { section: 3, en: 'Digital Health', ar: 'الصحة الرقمية', icon: '📱', items: [33, 35, 47],
    l3: { 35: [{en:'Video Consult',ar:'استشارة مرئية'}] } },
  { section: 3, en: 'Compliance', ar: 'الامتثال', icon: '🇸🇦', items: [34],
    l3: { 34: [{en:'ZATCA P2',ar:'زاتكا'},{en:'NPHIES',ar:'نفيس'},{en:'Wasfaty',ar:'وصفتي'},{en:'Yaqeen',ar:'يقين'}] } },
  { section: 3, en: 'Quality & Safety', ar: 'الجودة والسلامة', icon: '📊', items: [26, 27, 44, 39],
    l3: { 27: [{en:'KPIs',ar:'مؤشرات الأداء'},{en:'Accreditation',ar:'الاعتماد'}] } },
  { section: 3, en: 'Settings', ar: 'الإعدادات', icon: '⚙️', items: [42, 46, 15, 38] },
];

// ===== INIT =====
(async function init() {
  try {
    const data = await API.get('/api/auth/me');
    currentUser = data.user;
  } catch {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);

  // Load saved theme + facility type
  try {
    const s = await API.get('/api/settings');
    if (s.theme) { document.documentElement.setAttribute('data-theme', s.theme); document.getElementById('themeSelect').value = s.theme; }
    if (s.facility_type) facilityType = s.facility_type;
  } catch { }

  buildNav();
  setupEvents();

  // Hash-based routing: restore page from URL hash
  const hashPage = parseInt(location.hash.replace('#page/', ''));
  navigateTo(!isNaN(hashPage) && hashPage >= 0 ? hashPage : 0);

  // Listen for hash changes (browser back/forward)
  window.addEventListener('hashchange', () => {
    const p = parseInt(location.hash.replace('#page/', ''));
    if (!isNaN(p) && p !== currentPage) navigateTo(p);
  });

  // Language: set direction
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  // Set initial toggle button text
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = isArabic ? '🌐 EN' : '🌐 عربي';
  // Update all shell elements to match language
  updateShellLanguage();
})();

function buildNav() {
  const nav = document.getElementById('navList');
  const userPerms = currentUser?.permissions ? currentUser.permissions.split(',') : [];
  const isAdmin = currentUser?.role === 'Admin';
  const allowed = FACILITY_ALLOWED[facilityType];
  const openGroups = JSON.parse(localStorage.getItem('namaNavGroups') || '{}');

  let html = '';
  let lastSection = -1;

  NAV_GROUPS.forEach((group, gi) => {
    // Filter items visible to this user
    const visibleItems = group.items.filter(i => {
      const hasPerm = isAdmin || i === 0 || userPerms.includes(i.toString());
      if (!hasPerm) return false;
      if (allowed && !allowed.includes(i)) return false;
      return true;
    });
    if (!visibleItems.length) return;

    // Render Section Title (L0) when section changes
    if (group.section !== undefined && group.section !== lastSection) {
      lastSection = group.section;
      const sec = NAV_SECTIONS[group.section];
      if (sec) {
        html += `<div class="sidebar-section-title">${tr(sec.en, sec.ar)}</div>`;
      }
    }

    const isOpen = openGroups[gi] !== undefined ? openGroups[gi] : (group.open || visibleItems.includes(currentPage));
    const hasActive = visibleItems.includes(currentPage);

    // L1: Group Header
    html += `<div class="nav-group${isOpen ? ' open' : ''}${hasActive ? ' has-active' : ''}" data-group="${gi}" style="animation-delay:${gi * 30}ms">
      <div class="nav-group-header" data-group="${gi}">
        <span class="nav-group-icon">${group.icon}</span>
        <span class="nav-group-label">${tr(group.en, group.ar)}</span>
        <span class="nav-group-arrow">▸</span>
      </div>
      <div class="nav-group-items" style="${isOpen ? '' : 'max-height:0;overflow:hidden'}">
        ${visibleItems.map(i => {
          const item = NAV_ITEMS[i];
          if (!item) return '';
          const l3Items = group.l3 && group.l3[i] ? group.l3[i] : null;
          let l3Html = '';
          if (l3Items) {
            l3Html = `<div class="nav-l3-container" style="${i === currentPage ? '' : 'max-height:0;overflow:hidden'}">
              ${l3Items.map(sub => `<div class="nav-l3-item" data-page="${i}"><span class="nav-l3-label">${tr(sub.en, sub.ar)}</span></div>`).join('')}
            </div>`;
          }
          return `<div class="nav-item${i === currentPage ? ' active' : ''}${l3Items ? ' has-children' : ''}" data-page="${i}">
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${tr(item.en, item.ar)}</span>
          </div>${l3Html}`;
        }).join('')}
      </div>
    </div>`;
  });

  nav.innerHTML = html;

  // Group toggle (L1)
  nav.querySelectorAll('.nav-group-header').forEach(el => {
    el.addEventListener('click', () => {
      const g = el.closest('.nav-group');
      const gi = el.dataset.group;
      g.classList.toggle('open');
      const items = g.querySelector('.nav-group-items');
      if (g.classList.contains('open')) {
        items.style.maxHeight = items.scrollHeight + 'px';
        setTimeout(() => items.style.maxHeight = '', 300);
      } else {
        items.style.maxHeight = items.scrollHeight + 'px';
        requestAnimationFrame(() => { items.style.maxHeight = '0'; items.style.overflow = 'hidden'; });
      }
      const saved = JSON.parse(localStorage.getItem('namaNavGroups') || '{}');
      saved[gi] = g.classList.contains('open');
      localStorage.setItem('namaNavGroups', JSON.stringify(saved));
    });
  });

  // Page navigation (L2)
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(parseInt(el.dataset.page));
      // Expand L3 if exists
      const l3 = el.nextElementSibling;
      if (l3 && l3.classList.contains('nav-l3-container')) {
        if (l3.style.maxHeight === '0px' || !l3.style.maxHeight) {
          l3.style.maxHeight = l3.scrollHeight + 'px';
          setTimeout(() => l3.style.maxHeight = '', 300);
        }
      }
    });
  });

  // L3 sub-item click (navigate to parent page)
  nav.querySelectorAll('.nav-l3-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateTo(parseInt(el.dataset.page));
    });
  });
}


// Add notification bell to header
const headerR = document.querySelector('.header-right') || document.querySelector('.header');
if (headerR) {
  const bellSpan = document.createElement('span');
  bellSpan.id = 'notifBell';
  bellSpan.style.cssText = 'cursor:pointer;font-size:20px;position:relative;margin-left:12px;margin-right:12px';
  bellSpan.innerHTML = '🔔';
  headerR.prepend(bellSpan);
}

function setupEvents() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await API.post('/api/auth/logout');
    window.location.href = '/login.html';
  });
  document.getElementById('themeSelect').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    API.put('/api/settings', { theme: e.target.value }).catch(() => { });
  });
  document.getElementById('langToggleBtn').addEventListener('click', () => {
    isArabic = !isArabic;
    localStorage.setItem('namaLang', isArabic ? 'ar' : 'en');
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
    // Update toggle button text
    document.getElementById('langToggleBtn').textContent = isArabic ? '🌐 EN' : '🌐 عربي';
    updateShellLanguage();
    buildNav();
    navigateTo(currentPage);
  });
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  });
  document.getElementById('globalSearch').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const txt = e.target.value.trim();
      if (!txt) return;
      const res = await API.get('/api/patients?search=' + encodeURIComponent(txt));
      let html = `<div id="searchResultPopup" class="card" style="position:absolute;top:60px;right:20px;width:700px;z-index:1000;box-shadow:0 10px 30px rgba(0,0,0,0.5)">
               <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                 <strong>🔍 ${tr('Search Results', 'نتائج البحث')} (${res.length})</strong>
                 <button class="btn btn-danger btn-sm" onclick="document.getElementById('searchResultPopup').remove()">❌</button>
               </div>
               <div style="max-height:400px;overflow-y:auto">
                 ${makeTable(
        [tr('File#', 'رقم الملف'), tr('Name', 'الاسم'), tr('National ID', 'الهوية'), tr('Phone', 'الجوال'), tr('Dept', 'القسم')],
        res.map(p => ({ cells: [p.file_number, isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar), p.national_id, p.phone, p.department] }))
      )}
               </div>
            </div>`;
      const old = document.getElementById('searchResultPopup');
      if (old) old.remove();
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div.firstElementChild);
    }
  });
  // Set initial search placeholder based on language
  const searchBox = document.getElementById('globalSearch');
  if (searchBox) searchBox.placeholder = isArabic ? 'بحث بالاسم، الهوية، الجوال، رقم الملف...' : 'Search by name, ID, phone, file number...';

  // Sidebar nav search filter
  const navSearchInput = document.createElement('input');
  navSearchInput.type = 'text';
  navSearchInput.className = 'form-input';
  navSearchInput.placeholder = isArabic ? '🔍 بحث في القوائم...' : '🔍 Filter menu...';
  navSearchInput.style.cssText = 'margin:8px 12px;width:calc(100% - 24px);font-size:12px;padding:8px 12px;border-radius:8px;background:var(--shell-glass);border:1px solid var(--shell-glass-border);color:var(--text)';
  const navList = document.getElementById('navList');
  if (navList && !document.getElementById('navFilterInput')) {
    navSearchInput.id = 'navFilterInput';
    navList.insertBefore(navSearchInput, navList.firstChild);
    navSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.nav-group').forEach(g => {
        const items = g.querySelectorAll('.nav-item');
        let anyMatch = false;
        items.forEach(it => {
          const match = !q || it.textContent.toLowerCase().includes(q);
          it.style.display = match ? '' : 'none';
          if (match) anyMatch = true;
        });
        g.style.display = anyMatch || !q ? '' : 'none';
        if (q && anyMatch) g.classList.add('open');
      });
    });
  }
}

// ===== UPDATE SHELL LANGUAGE =====
// Updates all static HTML elements that are hardcoded in index.html
function updateShellLanguage() {
  // Sidebar title & subtitle
  const sidebarTitle = document.querySelector('.sidebar-title');
  if (sidebarTitle) sidebarTitle.textContent = isArabic ? 'المركز الطبي' : 'Medical Center';
  const sidebarSubtitle = document.querySelector('.sidebar-subtitle');
  if (sidebarSubtitle) sidebarSubtitle.textContent = isArabic ? 'Medical Center' : 'Medical ERP';

  // Search placeholder
  const searchBox = document.getElementById('globalSearch');
  if (searchBox) searchBox.placeholder = isArabic ? 'بحث بالاسم، الهوية، الجوال، رقم الملف...' : 'Search by name, ID, phone, file number...';

  // Logout button tooltip
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.title = isArabic ? 'تسجيل الخروج' : 'Logout';

  // Theme select options
  const themeNames = [
    { ar: '🔵 أزرق داكن', en: '🔵 Dark Blue' },
    { ar: '🟢 أخضر داكن', en: '🟢 Dark Green' },
    { ar: '🟣 بنفسجي', en: '🟣 Purple' },
    { ar: '🔴 أحمر', en: '🔴 Red' },
    { ar: '🟡 ذهبي', en: '🟡 Gold' },
    { ar: '⬜ فاتح كلاسيك', en: '⬜ Light Classic' },
    { ar: '🔷 فاتح أزرق', en: '🔷 Light Blue' },
    { ar: '🟩 فاتح أخضر', en: '🟩 Light Green' }
  ];
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.title = isArabic ? 'اختر السمة' : 'Choose Theme';
    Array.from(themeSelect.options).forEach((opt, i) => {
      if (themeNames[i]) opt.textContent = isArabic ? themeNames[i].ar : themeNames[i].en;
    });
  }

  // Language toggle button tooltip
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.title = isArabic ? 'تغيير اللغة' : 'Change Language';

  // Page title
  const pageTitle = document.querySelector('title');
  if (pageTitle) pageTitle.textContent = isArabic ? 'المركز الطبي - Medical ERP' : 'Medical ERP';
}

async function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach((el, i) => el.classList.toggle('active', i === page));
  const item = NAV_ITEMS[page];
  document.getElementById('headerTitle').textContent = tr(item.en, item.ar);

  // Hash routing — update URL without reload
  if (location.hash !== '#page/' + page) history.replaceState(null, '', '#page/' + page);

  // Breadcrumb — find which NAV_GROUPS section/group contains this page
  const bc = document.getElementById('breadcrumb');
  if (bc) {
    const sectionNames = [
      { en: 'Clinical', ar: 'السريري' },
      { en: 'Operations', ar: 'العمليات' },
      { en: 'Admin & Finance', ar: 'الإدارة والمالية' },
      { en: 'System', ar: 'النظام' }
    ];
    let crumb = tr('Home', 'الرئيسية');
    const grp = NAV_GROUPS.find(g => g.items && g.items.includes(page));
    if (grp) {
      const sec = sectionNames[grp.section] || sectionNames[0];
      crumb += ` / ${tr(sec.en, sec.ar)} / ${tr(grp.en, grp.ar)}`;
    }
    bc.textContent = crumb;
  }

  // Close sidebar on mobile after navigation
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  await loadPage(page);
}

function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = `toast toast-${type} show`;
  t.innerHTML = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function makeTable(headers, rows, actions) {
  if (!rows.length) return `<div class="empty-state"><div class="empty-icon">📭</div><p>${tr('No data found', 'لا توجد بيانات')}</p></div>`;
  let html = '<table class="data-table"><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.cells.forEach(c => html += `<td>${c}</td>`);
    if (actions) html += `<td>${actions(row)}</td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function badge(text, type) { return `<span class="badge badge-${type}">${text}</span>`; }

function statusBadge(status) {
  const map = { Waiting: 'warning', 'With Doctor': 'success', Confirmed: 'success', Pending: 'warning', Approved: 'success', Rejected: 'danger', Active: 'success', 'On Leave': 'info', Cancelled: 'danger', Completed: 'success', Requested: 'info', Done: 'success', Available: 'success', Reserved: 'warning', Used: 'info', Expired: 'danger', Compatible: 'success', Incompatible: 'danger', Signed: 'success', Dispensed: 'success', Scheduled: 'info', 'In Progress': 'warning' };
  return badge(status, map[status] || 'info');
}

// ===== PRINT UTILITY =====
window.printDocument = function (title, content, options = {}) {
  const rtl = isArabic ? 'dir="rtl"' : '';
  const w = window.open('', '_blank', 'width=800,height=600');
  if (!w) { showToast(tr('Please allow pop-ups to print', 'يرجى السماح بالنوافذ المنبثقة للطباعة'), 'error'); return; }
  const showHeader = options.showHeader !== false;
  w.document.write(`<!DOCTYPE html><html ${rtl}><head><meta charset="utf-8"><title>${title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:20px;color:#333;font-size:13px;direction:${isArabic ? 'rtl' : 'ltr'}}
      .header{text-align:center;border-bottom:3px double #1a5276;padding-bottom:12px;margin-bottom:16px}
      .header h1{font-size:22px;color:#1a5276;margin-bottom:4px}
      .header p{font-size:11px;color:#666}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:12px}
      .info-grid div{padding:4px 8px;background:#f8f9fa;border-radius:4px}
      .info-grid strong{color:#1a5276}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#1a5276;color:#fff;padding:8px 10px;text-align:${isArabic ? 'right' : 'left'};font-size:12px}
      td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:12px}
      tr:nth-child(even){background:#f8f9fa}
      .total-row{font-weight:700;font-size:14px;background:#e8f4fd!important}
      .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#999}
      .signature{display:flex;justify-content:space-between;margin-top:40px}
      .signature div{text-align:center;min-width:150px;border-top:1px solid #333;padding-top:4px;font-size:11px}
      @media print{body{padding:10px} .no-print{display:none!important}}
    </style></head><body>
    ${showHeader ? '<div class="header"><h1>' + (options.companyName || 'المركز الطبي — Medical Center') + '</h1><p>' + (options.companyInfo || 'المركز الطبي | Medical Center Hospital') + '</p></div><h2 style="text-align:center;color:#1a5276;margin-bottom:16px">' + title + '</h2>' : ''}
    ${content}
    <div class="footer">${tr('Printed on', 'طُبع بتاريخ')}: ${new Date().toLocaleString('ar-SA')} | ${tr('Medical ERP', 'المركز الطبي')}</div>
    <button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:10px 24px;background:#1a5276;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ ${tr('Print', 'طباعة')}</button>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

window.printInvoice = async function (id) {
  try {
    const data = await API.get('/api/print/invoice/' + id);
    const inv = data.invoice;
    const content = `<div class="info-grid">
      <div><strong>${tr('Invoice #', 'فاتورة رقم')}:</strong> ${inv.invoice_number || inv.id}</div>
      <div><strong>${tr('Date', 'التاريخ')}:</strong> ${inv.created_at?.split('T')[0]}</div>
      <div><strong>${tr('Patient', 'المريض')}:</strong> ${inv.patient_name}</div>
      <div><strong>${tr('Payment', 'الدفع')}:</strong> ${inv.payment_method || '-'}</div>
    </div>
    <table><thead><tr><th>${tr('Description', 'الوصف')}</th><th>${tr('Amount', 'المبلغ')}</th><th>${tr('VAT', 'ضريبة')}</th><th>${tr('Total', 'الإجمالي')}</th></tr></thead>
    <tbody><tr><td>${inv.description || inv.service_type}</td><td>${inv.amount} SAR</td><td>${inv.vat_amount || 0} SAR</td><td>${inv.total} SAR</td></tr>
    <tr class="total-row"><td colspan="3">${tr('Grand Total', 'المجموع الكلي')}</td><td>${inv.total} SAR</td></tr></tbody></table>
    <div class="signature"><div>${tr('Cashier', 'أمين الصندوق')}</div><div>${tr('Patient Signature', 'توقيع المريض')}</div></div>`;
    printDocument(tr('Tax Invoice', 'فاتورة ضريبية'), content);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

window.printLabReport = async function (id) {
  try {
    const data = await API.get('/api/print/lab-report/' + id);
    const content = `<div class="info-grid">
      <div><strong>${tr('Patient', 'المريض')}:</strong> ${data.patient?.name_ar || data.patient?.name_en || '-'}</div>
      <div><strong>${tr('File #', 'رقم الملف')}:</strong> ${data.patient?.file_number || '-'}</div>
      <div><strong>${tr('Test', 'الفحص')}:</strong> ${data.order?.description}</div>
      <div><strong>${tr('Date', 'التاريخ')}:</strong> ${data.order?.created_at?.split('T')[0]}</div>
    </div>
    <table><thead><tr><th>${tr('Test', 'الفحص')}</th><th>${tr('Result', 'النتيجة')}</th><th>${tr('Normal Range', 'المعدل الطبيعي')}</th><th>${tr('Status', 'الحالة')}</th></tr></thead>
    <tbody>${(data.results || []).map(r => `<tr style="${r.is_abnormal ? 'color:#e74c3c;font-weight:700' : ''}"><td>${r.test_name || '-'}</td><td>${r.result_value || '-'}</td><td>${r.normal_range || '-'}</td><td>${r.is_abnormal ? '⚠️ ' + tr('Abnormal', 'غير طبيعي') : '✅ ' + tr('Normal', 'طبيعي')}</td></tr>`).join('')}</tbody></table>
    <div class="signature"><div>${tr('Lab Technician', 'فني المختبر')}</div><div>${tr('Doctor', 'الطبيب')}</div></div>`;
    printDocument(tr('Lab Report', 'تقرير مختبر'), content);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== EXPORT UTILITY =====
window.exportCSV = function (filename, headers, rows) {
  const BOM = '\uFEFF';
  const csv = BOM + headers.join(',') + '\n' + rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename + '.csv'; a.click();
  showToast(tr('Exported!', 'تم التصدير'));
};
window.exportTableCSV = function (filename) {
  const table = document.querySelector('#pageContent table');
  if (!table) return showToast(tr('No table found', 'لا يوجد جدول'), 'error');
  const headers = [...table.querySelectorAll('th')].map(h => h.textContent);
  const rows = [...table.querySelectorAll('tbody tr')].map(r => [...r.querySelectorAll('td')].map(c => c.textContent.trim()));
  exportCSV(filename, headers, rows);
};


// ===== CONSENT FORMS =====
async function renderConsentForms(el) {
  const content = el;

  const visits = await API.get('/api/visits').catch(() => []);
  const consentTypes = [
    { id: 'general', en: 'General Consent', ar: 'موافقة عامة', icon: '📋' },
    { id: 'surgery', en: 'Surgical Consent', ar: 'موافقة جراحية', icon: '🏥' },
    { id: 'anesthesia', en: 'Anesthesia Consent', ar: 'موافقة تخدير', icon: '💉' },
    { id: 'blood', en: 'Blood Transfusion', ar: 'نقل دم', icon: '🩸' },
    { id: 'discharge', en: 'Against Medical Advice', ar: 'خروج ضد النصيحة', icon: '🚪' },
    { id: 'procedures', en: 'Procedures Consent', ar: 'موافقة إجراءات', icon: '⚕️' },
  ];

  content.innerHTML = `
    <h2>${tr('Consent Forms', 'نماذج الموافقة')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">
      ${consentTypes.map(t => '<div class="card" style="padding:20px;text-align:center;cursor:pointer;transition:transform 0.2s" onclick="printConsentForm(\'' + t.id + '\',\'' + t.en + '\',\'' + t.ar + '\')" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'"><div style="font-size:36px;margin-bottom:8px">' + t.icon + '</div><h4 style="margin:0">' + tr(t.en, t.ar) + '</h4><p style="margin:4px 0 0;font-size:11px;color:#666">' + tr('Click to generate', 'اضغط لإنشاء') + '</p></div>').join('')}
    </div>
    <div class="card" style="padding:20px">
      <h4 style="margin:0 0 12px">${tr('Generate Consent for Patient', 'إنشاء نموذج موافقة لمريض')}</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end">
        <div class="form-group"><label>${tr('Patient Name', 'اسم المريض')}</label><input class="form-input" id="cfPatient"></div>
        <div class="form-group"><label>${tr('MRN', 'رقم الملف')}</label><input class="form-input" id="cfMRN"></div>
        <div class="form-group"><label>${tr('Consent Type', 'نوع الموافقة')}</label>
          <select class="form-input" id="cfType">${consentTypes.map(t => '<option value="' + t.id + '">' + tr(t.en, t.ar) + '</option>').join('')}</select></div>
        <button class="btn btn-primary" onclick="generateConsent()">🖨️ ${tr('Generate & Print', 'إنشاء وطباعة')}</button>
      </div>
    </div>`;

  window.printConsentForm = (type, en, ar) => {
    const patientName = document.getElementById('cfPatient')?.value || '_______________';
    const mrn = document.getElementById('cfMRN')?.value || '___________';
    const now = new Date().toLocaleDateString('ar-SA');
    const body = '<div style="text-align:center;border-bottom:3px double #1a5276;padding-bottom:16px;margin-bottom:20px"><h1 style="color:#1a5276;margin:0">المركز الطبي — Medical Center</h1><p style="color:#666;margin:4px 0">' + tr('Consent Form', 'نموذج موافقة') + '</p></div>' +
      '<h2 style="text-align:center;color:#1a5276;margin-bottom:20px">' + tr(en, ar) + '</h2>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px"><div><strong>' + tr('Patient', 'المريض') + ':</strong> ' + patientName + '</div><div><strong>' + tr('MRN', 'رقم الملف') + ':</strong> ' + mrn + '</div><div><strong>' + tr('Date', 'التاريخ') + ':</strong> ' + now + '</div></div>' +
      '<div style="border:1px solid #ddd;padding:20px;border-radius:8px;margin-bottom:20px;min-height:200px"><p>' + tr('I, the undersigned, hereby consent to...', 'أنا الموقع أدناه أوافق على...') + '</p><br><p style="color:#999;font-size:12px">' + tr('Patient has been informed about the procedure, risks, and alternatives.', 'تم إبلاغ المريض بالإجراء والمخاطر والبدائل.') + '</p></div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:60px"><div style="text-align:center;min-width:200px;border-top:1px solid #333;padding-top:8px">' + tr('Patient Signature', 'توقيع المريض') + '</div><div style="text-align:center;min-width:200px;border-top:1px solid #333;padding-top:8px">' + tr('Doctor Signature', 'توقيع الطبيب') + '</div><div style="text-align:center;min-width:200px;border-top:1px solid #333;padding-top:8px">' + tr('Witness', 'الشاهد') + '</div></div>';
    printDocument(tr(en, ar), body);
  };
  window.generateConsent = () => {
    const type = document.getElementById('cfType').value;
    const ct = consentTypes.find(t => t.id === type);
    if (ct) window.printConsentForm(type, ct.en, ct.ar);
  };

}

let _signCtx = null, _signDrawing = false;
function initSignaturePad() {
  const canvas = document.getElementById('signaturePad');
  if (!canvas) return;
  _signCtx = canvas.getContext('2d');
  _signCtx.strokeStyle = '#000';
  _signCtx.lineWidth = 2;
  _signCtx.lineCap = 'round';

  canvas.addEventListener('mousedown', e => { _signDrawing = true; _signCtx.beginPath(); _signCtx.moveTo(e.offsetX, e.offsetY); });
  canvas.addEventListener('mousemove', e => { if (_signDrawing) { _signCtx.lineTo(e.offsetX, e.offsetY); _signCtx.stroke(); } });
  canvas.addEventListener('mouseup', () => _signDrawing = false);
  canvas.addEventListener('mouseleave', () => _signDrawing = false);
  // Touch support
  canvas.addEventListener('touchstart', e => { e.preventDefault(); _signDrawing = true; const r = canvas.getBoundingClientRect(); _signCtx.beginPath(); _signCtx.moveTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if (_signDrawing) { const r = canvas.getBoundingClientRect(); _signCtx.lineTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); _signCtx.stroke(); } });
  canvas.addEventListener('touchend', () => _signDrawing = false);
}

function clearSignature() {
  const canvas = document.getElementById('signaturePad');
  if (canvas && _signCtx) _signCtx.clearRect(0, 0, canvas.width, canvas.height);
}

async function loadConsentText() {
  const id = document.getElementById('consentTemplate')?.value;
  const area = document.getElementById('consentTextArea');
  if (!id) { area.style.display = 'none'; return; }
  try {
    const t = await API.get('/api/consent/templates/' + id);
    document.getElementById('consentTitle').textContent = t.title_ar;
    document.getElementById('consentBody').textContent = isArabic ? t.body_text_ar : t.body_text;
    area.style.display = 'block';
    // Show witness section if required
    document.getElementById('witnessSection').style.display = t.requires_witness ? 'block' : 'none';
    clearSignature();
    setTimeout(() => initSignaturePad(), 50);
  } catch (e) { showToast(tr('Error loading form', 'خطأ في تحميل الإقرار'), 'error'); }
}

window.loadConsentText = loadConsentText;
window.clearSignature = clearSignature;

async function submitConsent() {
  const patientId = document.getElementById('consentPatient')?.value;
  const templateId = document.getElementById('consentTemplate')?.value;
  const canvas = document.getElementById('signaturePad');
  if (!patientId) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  if (!templateId) return showToast(tr('Select consent form', 'اختر الإقرار'), 'error');
  // Check if canvas has content
  const sigData = canvas.toDataURL('image/png');
  const emptyCanvas = document.createElement('canvas');
  emptyCanvas.width = canvas.width; emptyCanvas.height = canvas.height;
  if (sigData === emptyCanvas.toDataURL('image/png')) return showToast(tr('Please sign the form', 'الرجاء التوقيع على الإقرار'), 'error');

  const patientSelect = document.getElementById('consentPatient');
  const patientName = patientSelect.options[patientSelect.selectedIndex]?.text || '';

  try {
    await API.post('/api/consent/sign', {
      template_id: templateId,
      patient_id: patientId,
      patient_name: patientName.split(' (')[0],
      signature_data: sigData,
      witness_name: document.getElementById('witnessName')?.value || '',
      doctor_name: document.getElementById('consentDoctor')?.value || '',
      procedure_details: document.getElementById('consentProcedure')?.value || ''
    });
    showToast(tr('Consent signed!', 'تم التوقيع على الإقرار!'));
    renderConsentForms(document.getElementById('pageContent'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
}
window.submitConsent = submitConsent;

window.viewSignedConsent = async function (id) {
  try {
    const consents = await API.get('/api/consent/recent');
    const c = consents.find(x => x.id === id);
    if (!c) return;
    const tmpl = await API.get('/api/consent/templates/' + c.template_id);
    let html = '<div style="direction:rtl;text-align:right">' +
      '<h3 style="margin-bottom:12px;color:var(--primary)">' + (tmpl.title_ar || c.title) + '</h3>' +
      '<div style="white-space:pre-wrap;line-height:2;font-size:14px;padding:12px;background:var(--hover);border-radius:8px;max-height:300px;overflow-y:auto;margin-bottom:16px">' + tmpl.body_text_ar + '</div>' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:12px">' +
      '<div><strong>' + tr('Patient', 'المريض') + ':</strong> ' + c.patient_name + '</div>' +
      '<div><strong>' + tr('Doctor', 'الطبيب') + ':</strong> ' + (c.doctor_name || c.created_by) + '</div>' +
      '<div><strong>' + tr('Date', 'التاريخ') + ':</strong> ' + new Date(c.signed_at || c.created_at).toLocaleString('ar-SA') + '</div>' +
      (c.witness_name ? '<div><strong>' + tr('Witness', 'الشاهد') + ':</strong> ' + c.witness_name + '</div>' : '') +
      '</div>';
    if (c.signature_data) html += '<div style="margin-top:12px"><strong>' + tr('Signature', 'التوقيع') + ':</strong><br><img src="' + c.signature_data + '" style="max-width:300px;border:1px solid var(--border);border-radius:4px;margin-top:4px"></div>';
    html += '</div>';
    showModal(tr('Signed Consent', 'الإقرار الموقع'), html);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

window.printSignedConsent = async function (id) {
  try {
    const consents = await API.get('/api/consent/recent');
    const c = consents.find(x => x.id === id);
    if (!c) return;
    const tmpl = await API.get('/api/consent/templates/' + c.template_id);
    let html = '<div style="direction:rtl;text-align:right;font-family:Arial,sans-serif">' +
      '<div style="text-align:center;margin-bottom:20px"><h2>مركز المركز الطبي</h2><h3 style="color:#1a56db">' + tmpl.title_ar + '</h3></div>' +
      '<div style="white-space:pre-wrap;line-height:2.2;font-size:14px;margin-bottom:20px">' + tmpl.body_text_ar + '</div>' +
      (c.procedure_details ? '<div style="margin-bottom:16px;padding:8px;border:1px solid #ccc;border-radius:4px"><strong>تفاصيل الإجراء:</strong> ' + c.procedure_details + '</div>' : '') +
      '<div style="margin-top:30px;display:flex;justify-content:space-between">' +
      '<div><strong>اسم المريض:</strong> ' + c.patient_name + '</div>' +
      '<div><strong>التاريخ:</strong> ' + new Date(c.signed_at || c.created_at).toLocaleDateString('ar-SA') + '</div>' +
      '</div>' +
      '<div style="margin-top:10px"><strong>الطبيب:</strong> ' + (c.doctor_name || '-') + '</div>' +
      (c.witness_name ? '<div style="margin-top:10px"><strong>الشاهد:</strong> ' + c.witness_name + '</div>' : '') +
      '<div style="margin-top:20px"><strong>التوقيع:</strong><br>' +
      (c.signature_data ? '<img src="' + c.signature_data + '" style="max-width:250px;margin-top:4px">' : '_______________') + '</div>' +
      '</div>';
    printDocument(tmpl.title_ar, html, { showHeader: false });
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};



// ===== OB/GYN DEPARTMENT PAGE =====
async function renderOBGYN(el) {
  let stats = { activePregnancies: 0, highRisk: 0, dueThisWeek: 0, deliveredThisMonth: 0 };
  try { stats = await API.get('/api/obgyn/stats'); } catch (e) { }
  const patients = await API.get('/api/patients');
  let patOpts = patients.map(p => '<option value="' + p.id + '" data-name="' + (p.name_ar || p.name_en) + '">' + (p.name_ar || p.name_en) + ' (' + p.file_number + ')</option>').join('');

  el.innerHTML = '<div class="page-title">🤰 ' + tr('OB/GYN Department', 'قسم النساء والتوليد') + '</div>' +
    '<div class="stats-grid">' +
    '<div class="stat-card" style="--stat-color:#ec4899"><div class="stat-label">' + tr('Active Pregnancies', 'حمل نشط') + '</div><div class="stat-value">' + stats.activePregnancies + '</div></div>' +
    '<div class="stat-card" style="--stat-color:#ef4444"><div class="stat-label">' + tr('High Risk', 'عالي الخطورة') + '</div><div class="stat-value">' + stats.highRisk + '</div></div>' +
    '<div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">' + tr('Due This Week', 'ولادة هذا الأسبوع') + '</div><div class="stat-value">' + stats.dueThisWeek + '</div></div>' +
    '<div class="stat-card" style="--stat-color:#22c55e"><div class="stat-label">' + tr('Delivered This Month', 'ولادات هذا الشهر') + '</div><div class="stat-value">' + stats.deliveredThisMonth + '</div></div>' +
    '</div>' +

    '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">📋 ' + tr('New Pregnancy Record', 'سجل حمل جديد') + '</h3>' +
    '<div class="form-grid" style="gap:10px">' +
    '<div class="form-group"><label>' + tr('Patient', 'المريضة') + '</label><select id="obPatient" class="form-control"><option value="">' + tr('-- Select --', '-- اختري --') + '</option>' + patOpts + '</select></div>' +
    '<div class="form-group"><label>' + tr('LMP (Last Menstrual Period)', 'آخر دورة شهرية') + '</label><input type="date" id="obLMP" class="form-control"></div>' +
    '<div class="form-group"><label>G (Gravida)</label><input type="number" id="obGravida" class="form-control" value="1" min="1"></div>' +
    '<div class="form-group"><label>P (Para)</label><input type="number" id="obPara" class="form-control" value="0" min="0"></div>' +
    '<div class="form-group"><label>A (Abortions)</label><input type="number" id="obAbort" class="form-control" value="0" min="0"></div>' +
    '<div class="form-group"><label>' + tr('Blood Group', 'فصيلة الدم') + '</label><select id="obBlood" class="form-control"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>' +
    '<div class="form-group"><label>Rh</label><select id="obRh" class="form-control"><option>Positive</option><option>Negative</option></select></div>' +
    '<div class="form-group"><label>' + tr('Risk Level', 'مستوى الخطورة') + '</label><select id="obRisk" class="form-control"><option value="Low">' + tr('Low', 'منخفض') + '</option><option value="Medium">' + tr('Medium', 'متوسط') + '</option><option value="High">' + tr('High', 'عالي') + '</option></select></div>' +
    '<div class="form-group"><label>' + tr('Previous C-Sections', 'قيصريات سابقة') + '</label><input type="number" id="obPrevCS" class="form-control" value="0" min="0"></div>' +
    '<div class="form-group"><label>' + tr('Chronic Conditions', 'أمراض مزمنة') + '</label><input id="obChronic" class="form-control" placeholder="' + tr('DM, HTN, etc', 'سكري، ضغط...') + '"></div>' +
    '<div class="form-group"><label>' + tr('Allergies', 'حساسية') + '</label><input id="obAllergy" class="form-control"></div>' +
    '<div class="form-group"><label>' + tr('Attending Doctor', 'الطبيب المعالج') + '</label><input id="obDoctor" class="form-control" value="' + (currentUser?.display_name || '') + '"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="createPregnancy()" style="margin-top:12px">✅ ' + tr('Create Record', 'إنشاء السجل') + '</button></div>' +

    '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">📊 ' + tr('Active Pregnancies', 'الحالات النشطة') + '</h3><div id="obActiveList">' + tr('Loading...', 'جاري التحميل...') + '</div></div>' +

    '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">🧪 ' + tr('Lab Panels', 'حزم الفحوصات') + '</h3><div id="obLabPanels">' + tr('Loading...', 'جاري التحميل...') + '</div></div>';

  // Load active pregnancies
  try {
    const preg = await API.get('/api/obgyn/pregnancies?status=Active');
    const list = document.getElementById('obActiveList');
    if (preg.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">' + tr('No active pregnancies', 'لا توجد حالات نشطة') + '</p>'; }
    else {
      let html = '<table class="data-table"><thead><tr><th>' + tr('Patient', 'المريضة') + '</th><th>GPAL</th><th>' + tr('EDD', 'تاريخ الولادة المتوقع') + '</th><th>' + tr('Risk', 'الخطورة') + '</th><th>' + tr('Doctor', 'الطبيب') + '</th><th>' + tr('Actions', 'إجراءات') + '</th></tr></thead><tbody>';
      preg.forEach(p => {
        const riskColor = p.risk_level === 'High' ? '#ef4444' : p.risk_level === 'Medium' ? '#f59e0b' : '#22c55e';
        html += '<tr><td>' + p.patient_name + '</td><td>G' + p.gravida + 'P' + p.para + 'A' + p.abortions + 'L' + p.living_children + '</td><td>' + (p.edd || '-') + '</td><td><span style="color:' + riskColor + ';font-weight:700">' + p.risk_level + '</span></td><td>' + (p.attending_doctor || '-') + '</td><td><button class="btn btn-sm" onclick="showAntenatalForm(' + p.id + ',' + p.patient_id + ')">📋 ' + tr('Antenatal', 'متابعة') + '</button></td></tr>';
      });
      html += '</tbody></table>';
      list.innerHTML = html;
    }
  } catch (e) { document.getElementById('obActiveList').innerHTML = '<p style="color:red">Error loading</p>'; }

  // Load lab panels
  try {
    const panels = await API.get('/api/obgyn/lab-panels');
    let ph = '<div style="display:grid;gap:8px">';
    panels.forEach(p => {
      ph += '<div style="padding:12px;border-radius:8px;background:var(--hover);border-right:3px solid #ec4899"><strong>' + p.panel_name_ar + '</strong> (' + p.trimester + ')<br><small style="color:var(--text-muted)">' + p.tests + '</small></div>';
    });
    ph += '</div>';
    document.getElementById('obLabPanels').innerHTML = ph;
  } catch (e) { }
}

window.createPregnancy = async () => {
  const patSel = document.getElementById('obPatient');
  const pid = patSel.value;
  if (!pid) return showToast(tr('Select patient', 'اختري مريضة'), 'error');
  const lmp = document.getElementById('obLMP').value;
  if (!lmp) return showToast(tr('Enter LMP date', 'أدخلي تاريخ آخر دورة'), 'error');
  try {
    await API.post('/api/obgyn/pregnancies', {
      patient_id: pid,
      patient_name: patSel.options[patSel.selectedIndex]?.dataset?.name || '',
      lmp, gravida: parseInt(document.getElementById('obGravida').value) || 1,
      para: parseInt(document.getElementById('obPara').value) || 0,
      abortions: parseInt(document.getElementById('obAbort').value) || 0,
      blood_group: document.getElementById('obBlood').value,
      rh_factor: document.getElementById('obRh').value,
      risk_level: document.getElementById('obRisk').value,
      previous_cs: parseInt(document.getElementById('obPrevCS').value) || 0,
      chronic_conditions: document.getElementById('obChronic').value,
      allergies: document.getElementById('obAllergy').value,
      attending_doctor: document.getElementById('obDoctor').value
    });
    showToast(tr('Pregnancy record created!', 'تم إنشاء سجل الحمل!'));
    navigateTo(currentPage);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

window.showAntenatalForm = async (pregId, patientId) => {
  const visits = await API.get('/api/obgyn/antenatal/' + pregId);
  let vRows = visits.map(v => '<tr><td>' + v.visit_number + '</td><td>' + (v.gestational_age || '-') + '</td><td>' + v.blood_pressure + '</td><td>' + v.fetal_heart_rate + '</td><td>' + v.weight + 'kg</td><td>' + (v.risk_flags || '✅') + '</td></tr>').join('');

  let html = '<h4 style="margin-bottom:8px">' + tr('Previous Visits', 'الزيارات السابقة') + '</h4>' +
    (visits.length ? '<table class="data-table" style="margin-bottom:16px"><thead><tr><th>#</th><th>GA</th><th>BP</th><th>FHR</th><th>Wt</th><th>Flags</th></tr></thead><tbody>' + vRows + '</tbody></table>' : '<p style="color:var(--text-muted);margin-bottom:16px">' + tr('No visits yet', 'لا زيارات') + '</p>') +
    '<h4 style="margin-bottom:8px">' + tr('New Visit', 'زيارة جديدة') + '</h4>' +
    '<div class="form-grid" style="gap:8px">' +
    '<div class="form-group"><label>GA (weeks)</label><input id="antGA" class="form-control" placeholder="e.g. 28+3"></div>' +
    '<div class="form-group"><label>Weight (kg)</label><input type="number" id="antWt" class="form-control" step="0.1"></div>' +
    '<div class="form-group"><label>BP</label><input id="antBP" class="form-control" placeholder="120/80"></div>' +
    '<div class="form-group"><label>Systolic</label><input type="number" id="antSys" class="form-control"></div>' +
    '<div class="form-group"><label>Diastolic</label><input type="number" id="antDia" class="form-control"></div>' +
    '<div class="form-group"><label>FHR</label><input type="number" id="antFHR" class="form-control" placeholder="110-160"></div>' +
    '<div class="form-group"><label>Fundal Height</label><input type="number" id="antFH" class="form-control" step="0.5"></div>' +
    '<div class="form-group"><label>Hb</label><input type="number" id="antHb" class="form-control" step="0.1"></div>' +
    '<div class="form-group"><label>Presentation</label><select id="antPres" class="form-control"><option>Cephalic</option><option>Breech</option><option>Transverse</option></select></div>' +
    '<div class="form-group"><label>Edema</label><select id="antEdema" class="form-control"><option>None</option><option>Mild +</option><option>Moderate ++</option><option>Severe +++</option></select></div>' +
    '</div>' +
    '<div class="form-group" style="margin-top:8px"><label>Complaints</label><textarea id="antComp" class="form-control" rows="2"></textarea></div>' +
    '<div class="form-group"><label>Plan</label><textarea id="antPlan" class="form-control" rows="2"></textarea></div>' +
    '<button class="btn btn-primary" onclick="saveAntenatal(' + pregId + ',' + patientId + ')" style="margin-top:8px">💾 ' + tr('Save Visit', 'حفظ الزيارة') + '</button>';
  showModal(tr('Antenatal Visit', 'زيارة متابعة الحمل') + ' #' + pregId, html);
};

window.saveAntenatal = async (pregId, patientId) => {
  const bp = document.getElementById('antBP').value;
  try {
    await API.post('/api/obgyn/antenatal', {
      pregnancy_id: pregId, patient_id: patientId,
      gestational_age: document.getElementById('antGA').value,
      weight: parseFloat(document.getElementById('antWt').value) || 0,
      blood_pressure: bp,
      systolic: parseInt(document.getElementById('antSys').value) || (bp ? parseInt(bp.split('/')[0]) : 0),
      diastolic: parseInt(document.getElementById('antDia').value) || (bp ? parseInt(bp.split('/')[1]) : 0),
      fetal_heart_rate: parseInt(document.getElementById('antFHR').value) || 0,
      fundal_height: parseFloat(document.getElementById('antFH').value) || 0,
      hemoglobin: parseFloat(document.getElementById('antHb').value) || 0,
      fetal_presentation: document.getElementById('antPres').value,
      edema: document.getElementById('antEdema').value,
      complaints: document.getElementById('antComp').value,
      plan: document.getElementById('antPlan').value
    });
    showToast(tr('Visit saved!', 'تم حفظ الزيارة!'));
    document.querySelector('.modal-overlay')?.remove();
    navigateTo(currentPage);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};


// ===== PAGE LOADER =====
async function loadPage(page) {
  const el = document.getElementById('pageContent');
  el.style.animation = 'none'; el.offsetHeight; el.style.animation = '';
  const pages = [renderDashboard, renderReception, renderAppointments, renderDoctor, renderLab, renderRadiology, renderPharmacy, renderHR, renderFinance, renderInsurance, renderInventory, renderNursing, renderWaitingQueue, renderPatientAccounts, renderReports, renderMessaging, renderCatalog, renderDeptRequests, renderSurgery, renderBloodBank, renderConsentForms, renderEmergency, renderInpatient, renderICU, renderCSSD, renderDietary, renderInfectionControl, renderQuality, renderMaintenance, renderTransport, renderMedicalRecords, renderClinicalPharmacy, renderRehabilitation, renderPatientPortal, renderZATCA, renderTelemedicine, renderPathology, renderSocialWork, renderMortuary, renderCME, renderCosmeticSurgery, renderOBGYN, renderSettings, renderConsultation, renderDepartmentsCatalog, renderClinicalPathways, renderAcademicResearch, renderAppServerPortal];
  if (pages[page]) await pages[page](el);
  else el.innerHTML = `<div class="page-title">${NAV_ITEMS[page]?.icon} ${tr(NAV_ITEMS[page]?.en, NAV_ITEMS[page]?.ar)}</div><div class="card"><p>${tr('Coming soon...', 'قريباً...')}</p></div>`;
}

// ===== NEW BLUEPRINT MODULES =====
async function renderDepartmentsCatalog(el) {
  let deps = [];
  try { deps = await API.get('/api/departments'); } catch(e){}
  const coeCount = deps.filter(d => d.is_center_of_excellence).length;

  el.innerHTML = '<div class="page-title">🏢 ' + tr('Departments Catalog', 'دليل الأقسام') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      '<div class="card" style="padding:16px;text-align:center;background:#e8f4fd"><h3 style="margin:0;color:#1a5276">' + deps.length + '</h3><p style="margin:4px 0 0;font-size:12px">' + tr('Total Departments', 'إجمالي الأقسام') + '</p></div>' +
      '<div class="card" style="padding:16px;text-align:center;background:#fff8e1"><h3 style="margin:0;color:#f57f17">' + coeCount + '</h3><p style="margin:4px 0 0;font-size:12px">' + tr('Centers of Excellence', 'مراكز التميز') + '</p></div>' +
    '</div>' +
    '<div class="card" style="padding:20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
        '<h4 style="margin:0">' + tr('Departments Directory', 'دليل الأقسام') + '</h4>' +
        '<button class="btn btn-primary" onclick="showAddDeptModal()">+ ' + tr('Add Department', 'إضافة قسم') + '</button>' +
      '</div>' +
      makeTable([tr('Department Name', 'اسم القسم'), tr('Head of Department', 'رئيس القسم'), tr('Center of Excellence', 'مركز تميز')],
      deps.map(d => ({ cells: [isArabic ? (d.name_ar || d.name_en) : (d.name_en || d.name_ar), d.head_of_department || '-', d.is_center_of_excellence ? '⭐ ' + tr('Yes', 'نعم') : '-'] }))) +
    '</div>';

  window.showAddDeptModal = () => {
    const html = '<div class="form-group"><label>' + tr('Name (English)', 'الاسم (إنجليزي)') + '</label><input id="dNameEn" class="form-input"></div>' +
                 '<div class="form-group"><label>' + tr('Name (Arabic)', 'الاسم (عربي)') + '</label><input id="dNameAr" class="form-input"></div>' +
                 '<div class="form-group"><label>' + tr('Head of Dept', 'رئيس القسم') + '</label><input id="dHead" class="form-input"></div>' +
                 '<div class="form-group"><label><input type="checkbox" id="dCoe"> ' + tr('Center of Excellence', 'مركز تميز') + '</label></div>' +
                 '<button class="btn btn-primary w-full" onclick="saveDept()">💾 ' + tr('Save', 'حفظ') + '</button>';
    showModal(tr('Add Department', 'إضافة قسم'), html);
  };
  
  window.saveDept = async () => {
    try {
      await API.post('/api/departments', { name_en: document.getElementById('dNameEn').value, name_ar: document.getElementById('dNameAr').value, head_of_department: document.getElementById('dHead').value, is_center_of_excellence: document.getElementById('dCoe').checked ? 1 : 0 });
      showToast(tr('Department Added!', 'تمت إضافة القسم!'));
      document.querySelector('.modal-overlay')?.remove();
      navigateTo(currentPage);
    } catch(e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
  };
}

async function renderClinicalPathways(el) {
  let pathways = [];
  try { pathways = await API.get('/api/clinical_pathways'); } catch(e){}

  el.innerHTML = '<div class="page-title">🛣️ ' + tr('Clinical Pathways', 'المسارات السريرية') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">' +
      '<div class="card" style="padding:20px">' +
        '<h4 style="margin-bottom:12px">' + tr('Add Pathway', 'إضافة مسار') + '</h4>' +
        '<div class="form-group"><label>' + tr('Disease/Condition', 'الحالة المرضية') + '</label><input id="cpName" class="form-input"></div>' +
        '<div class="form-group"><label>' + tr('Department', 'القسم') + '</label><input id="cpDept" class="form-input"></div>' +
        '<div class="form-group"><label>' + tr('Treatment Steps', 'خطوات العلاج') + '</label><textarea id="cpSteps" class="form-input" rows="4"></textarea></div>' +
        '<button class="btn btn-primary w-full" onclick="savePathway()">💾 ' + tr('Save Pathway', 'حفظ المسار') + '</button>' +
      '</div>' +
      '<div class="card" style="padding:20px">' +
        '<h4 style="margin-bottom:12px">' + tr('Active Pathways', 'المسارات النشطة') + '</h4>' +
        makeTable([tr('Condition', 'الحالة'), tr('Dept', 'القسم'), tr('Created By', 'المنشئ'), tr('Date', 'التاريخ')],
        pathways.map(p => ({ cells: [p.disease_name, p.department, p.created_by, new Date(p.created_at).toLocaleDateString('ar-SA')] }))) +
      '</div>' +
    '</div>';

  window.savePathway = async () => {
    try {
      await API.post('/api/clinical_pathways', { disease_name: document.getElementById('cpName').value, department: document.getElementById('cpDept').value, steps: document.getElementById('cpSteps').value });
      showToast(tr('Pathway saved!', 'تم حفظ المسار!'));
      navigateTo(currentPage);
    } catch(e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
  };
}

async function renderAcademicResearch(el) {
  let programs = [];
  let trials = [];
  try { 
      programs = await API.get('/api/academic/programs'); 
      trials = await API.get('/api/academic/trials');
  } catch(e){}
  
  el.innerHTML = '<div class="page-title">🔬 ' + tr('Academic & Research', 'البحث الأكاديمي') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      '<div class="card" style="padding:20px;border-top:4px solid #8e44ad">' +
        '<h4>🎓 ' + tr('Fellowship Programs', 'برامج الزمالة') + '</h4>' +
        '<p style="font-size:24px;font-weight:bold;margin:8px 0;color:#8e44ad">' + programs.length + '</p>' +
        '<p style="font-size:12px;color:var(--text-muted)">' + tr('Active Training Programs', 'برامج تدريبية نشطة') + '</p>' +
      '</div>' +
      '<div class="card" style="padding:20px;border-top:4px solid #2980b9">' +
        '<h4>🧪 ' + tr('Clinical Trials', 'التجارب السريرية') + '</h4>' +
        '<p style="font-size:24px;font-weight:bold;margin:8px 0;color:#2980b9">' + trials.length + '</p>' +
        '<p style="font-size:12px;color:var(--text-muted)">' + tr('Ongoing Research Studies', 'دراسات بحثية مستمرة') + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
          '<h4 style="margin:0">' + tr('Programs Directory', 'دليل البرامج') + '</h4>' +
          '<button class="btn btn-primary btn-sm" onclick="showAddProgramModal()">+ ' + tr('Add Program', 'إضافة برنامج') + '</button>' +
      '</div>' +
      makeTable([tr('Program Name', 'اسم البرنامج'), tr('Director', 'المدير'), tr('Status', 'الحالة')],
      programs.map(p => ({ cells: [p.program_name, p.director || '-', badge(p.status || 'Active', 'success')] }))) + 
    '</div>' +
    '<div class="card" style="padding:20px;margin-top:16px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
          '<h4 style="margin:0">' + tr('Clinical Trials', 'التجارب السريرية') + '</h4>' +
          '<button class="btn btn-primary btn-sm" onclick="showAddTrialModal()">+ ' + tr('Add Trial', 'إضافة تجربة') + '</button>' +
      '</div>' +
      makeTable([tr('Trial Name', 'اسم التجربة'), tr('Phase', 'المرحلة'), tr('PI Name', 'الباحث الرئيسي'), tr('Status', 'الحالة')],
      trials.map(t => ({ cells: [t.trial_name, t.phase || '-', t.pi_name || '-', statusBadge(t.status || 'Active')] }))) +
    '</div>';

    window.showAddProgramModal = () => {
        const html = '<div class="form-group"><label>' + tr('Program Name', 'اسم البرنامج') + '</label><input id="apName" class="form-input"></div>' +
                     '<div class="form-group"><label>' + tr('Director', 'المدير') + '</label><input id="apDir" class="form-input"></div>' +
                     '<div class="form-group"><label>' + tr('Start Date', 'تاريخ البدء') + '</label><input type="date" id="apStart" class="form-input"></div>' +
                     '<div class="form-group"><label>' + tr('End Date', 'تاريخ الانتهاء') + '</label><input type="date" id="apEnd" class="form-input"></div>' +
                     '<button class="btn btn-primary w-full" onclick="saveProgram()">💾 ' + tr('Save', 'حفظ') + '</button>';
        showModal(tr('Add Program', 'إضافة برنامج'), html);
    };
    window.saveProgram = async () => {
        try {
            await API.post('/api/academic/programs', { program_name: document.getElementById('apName').value, director: document.getElementById('apDir').value, start_date: document.getElementById('apStart').value, end_date: document.getElementById('apEnd').value });
            showToast(tr('Program Added!', 'تمت إضافة البرنامج!'));
            document.querySelector('.modal-overlay')?.remove(); navigateTo(currentPage);
        } catch(e) { showToast('Error', 'error'); }
    };
    window.showAddTrialModal = () => {
        const html = '<div class="form-group"><label>' + tr('Trial Name', 'اسم التجربة') + '</label><input id="atName" class="form-input"></div>' +
                     '<div class="form-group"><label>' + tr('Phase', 'المرحلة') + '</label><select id="atPhase" class="form-input"><option>Phase 1</option><option>Phase 2</option><option>Phase 3</option><option>Phase 4</option></select></div>' +
                     '<div class="form-group"><label>' + tr('PI Name', 'الباحث الرئيسي') + '</label><input id="atPI" class="form-input"></div>' +
                     '<div class="form-group"><label>' + tr('IRB Approval', 'رقم الموافقة') + '</label><input id="atIRB" class="form-input"></div>' +
                     '<button class="btn btn-primary w-full" onclick="saveTrial()">💾 ' + tr('Save', 'حفظ') + '</button>';
        showModal(tr('Add Clinical Trial', 'إضافة تجربة سريرية'), html);
    };
    window.saveTrial = async () => {
        try {
            await API.post('/api/academic/trials', { trial_name: document.getElementById('atName').value, phase: document.getElementById('atPhase').value, pi_name: document.getElementById('atPI').value, status: 'Active', irb_approval: document.getElementById('atIRB').value });
            showToast(tr('Trial Added!', 'تمت إضافة التجربة!'));
            document.querySelector('.modal-overlay')?.remove(); navigateTo(currentPage);
        } catch(e) { showToast('Error', 'error'); }
    };
}

// ===== DASHBOARD =====


// ===== MEDICAL REPORT / SICK LEAVE =====
window.showMedicalReportForm = (type) => {
  const patientId = document.getElementById('drPatient')?.value || window._selectedPatientId;
  if (!patientId) return showToast(tr('Select patient first', 'اختر مريض أولاً'), 'error');
  const patientName = document.getElementById('drPatient')?.selectedOptions[0]?.text || window._selectedPatientName || '';

  const typeLabels = {
    sick_leave: { en: 'Sick Leave', ar: 'إجازة مرضية' },
    medical_report: { en: 'Medical Report', ar: 'تقرير طبي' },
    fitness: { en: 'Fitness Certificate', ar: 'شهادة لياقة' },
  };
  const label = typeLabels[type] || typeLabels.medical_report;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = '<div style="background:var(--bg-card,#fff);border-radius:16px;padding:24px;width:550px;max-height:90vh;overflow-y:auto;direction:rtl">' +
    '<h3 style="margin:0 0 16px;color:var(--primary)">' + (isArabic ? label.ar : label.en) + '</h3>' +
    '<div class="form-group"><label>' + tr('Patient', 'المريض') + '</label><input class="form-input" value="' + patientName + '" readonly></div>' +
    '<div class="form-group"><label>' + tr('Diagnosis', 'التشخيص') + '</label><input class="form-input" id="mrDiagnosis" placeholder="' + tr('Diagnosis', 'التشخيص') + '"></div>' +
    '<div class="form-group"><label>' + tr('ICD Code', 'رمز ICD') + '</label><input class="form-input" id="mrICD" placeholder="e.g. J06.9"></div>' +
    (type === 'sick_leave' ?
      '<div style="display:flex;gap:12px">' +
      '<div class="form-group" style="flex:1"><label>' + tr('From', 'من') + '</label><input type="date" class="form-input" id="mrFrom"></div>' +
      '<div class="form-group" style="flex:1"><label>' + tr('To', 'إلى') + '</label><input type="date" class="form-input" id="mrTo"></div>' +
      '<div class="form-group" style="flex:1"><label>' + tr('Days', 'أيام') + '</label><input type="number" class="form-input" id="mrDays" min="1"></div>' +
      '</div>' : '') +
    (type === 'fitness' ?
      '<div class="form-group"><label>' + tr('Fitness Status', 'حالة اللياقة') + '</label>' +
      '<select class="form-input" id="mrFitness"><option value="fit">' + tr('Fit', 'لائق') + '</option><option value="unfit">' + tr('Unfit', 'غير لائق') + '</option><option value="conditional">' + tr('Conditional', 'مشروط') + '</option></select></div>' : '') +
    '<div class="form-group"><label>' + tr('Notes', 'ملاحظات') + '</label><textarea class="form-input" id="mrNotes" rows="3"></textarea></div>' +
    '<div style="display:flex;gap:12px;margin-top:16px">' +
    '<button class="btn btn-primary" onclick="saveMedicalReport(\'' + type + '\', ' + patientId + ', \'' + patientName.replace(/'/g, '') + '\')" style="flex:1">💾 ' + tr('Save & Print', 'حفظ وطباعة') + '</button>' +
    '<button class="btn btn-secondary" onclick="this.closest(\'.modal-overlay\').remove()" style="flex:1">' + tr('Cancel', 'إلغاء') + '</button>' +
    '</div></div>';
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

window.saveMedicalReport = async (type, patientId, patientName) => {
  try {
    const data = {
      patient_id: patientId,
      patient_name: patientName,
      report_type: type,
      diagnosis: document.getElementById('mrDiagnosis')?.value || '',
      icd_code: document.getElementById('mrICD')?.value || '',
      start_date: document.getElementById('mrFrom')?.value || null,
      end_date: document.getElementById('mrTo')?.value || null,
      duration_days: document.getElementById('mrDays')?.value || null,
      notes: document.getElementById('mrNotes')?.value || '',
      fitness_status: document.getElementById('mrFitness')?.value || null,
    };

    const result = await API.post('/api/medical-reports', data);
    document.querySelector('.modal-overlay')?.remove();
    showToast(tr('Report saved!', 'تم حفظ التقرير!'));

    // Print the report
    printMedicalReport(result, type);
  } catch (e) { console.error('Medical report error:', e); showToast(e?.message || tr('Error saving report', 'خطأ في حفظ التقرير'), 'error'); }
};

window.printMedicalReport = (report, type) => {
  const typeLabels = { sick_leave: { ar: 'إجازة مرضية', en: 'Sick Leave Certificate' }, medical_report: { ar: 'تقرير طبي', en: 'Medical Report' }, fitness: { ar: 'شهادة لياقة طبية', en: 'Fitness Certificate' } };
  const label = typeLabels[type] || typeLabels.medical_report;

  let html = '<div style="font-family:Arial;padding:40px;direction:rtl;text-align:right;line-height:2">';
  html += '<div style="text-align:center;border-bottom:2px solid #1a73e8;padding-bottom:16px;margin-bottom:24px">';
  html += '<h2 style="color:#1a73e8;margin:0">المركز الطبي - Medical Center</h2>';
  html += '<p style="margin:4px 0;color:#666">المملكة العربية السعودية</p>';
  html += '</div>';
  html += '<h3 style="text-align:center;background:#f0f6ff;padding:12px;border-radius:8px;margin:20px 0">' + label.ar + ' / ' + label.en + '</h3>';
  html += '<table style="width:100%;margin:16px 0;border-collapse:collapse">';
  html += '<tr><td style="padding:8px;font-weight:bold;width:30%">رقم التقرير:</td><td style="padding:8px">' + (report.report_number || '') + '</td></tr>';
  html += '<tr><td style="padding:8px;font-weight:bold">اسم المريض:</td><td style="padding:8px">' + (report.patient_name || '') + '</td></tr>';
  html += '<tr><td style="padding:8px;font-weight:bold">التشخيص:</td><td style="padding:8px">' + (report.diagnosis || '') + '</td></tr>';
  if (report.icd_code) html += '<tr><td style="padding:8px;font-weight:bold">رمز ICD:</td><td style="padding:8px">' + report.icd_code + '</td></tr>';
  if (type === 'sick_leave') {
    html += '<tr><td style="padding:8px;font-weight:bold">من تاريخ:</td><td style="padding:8px">' + (report.start_date || '') + '</td></tr>';
    html += '<tr><td style="padding:8px;font-weight:bold">إلى تاريخ:</td><td style="padding:8px">' + (report.end_date || '') + '</td></tr>';
    html += '<tr><td style="padding:8px;font-weight:bold">عدد الأيام:</td><td style="padding:8px">' + (report.duration_days || '') + ' ' + (isArabic ? 'يوم' : 'days') + '</td></tr>';
  }
  if (type === 'fitness') {
    const statusAr = { fit: 'لائق طبياً', unfit: 'غير لائق', conditional: 'لائق بشروط' };
    html += '<tr><td style="padding:8px;font-weight:bold">الحالة:</td><td style="padding:8px;font-weight:bold;color:' + (report.fitness_status === 'fit' ? 'green' : 'red') + '">' + (statusAr[report.fitness_status] || '') + '</td></tr>';
  }
  if (report.notes) html += '<tr><td style="padding:8px;font-weight:bold">ملاحظات:</td><td style="padding:8px">' + report.notes + '</td></tr>';
  html += '</table>';
  html += '<div style="margin-top:40px;display:flex;justify-content:space-between">';
  html += '<div style="text-align:center"><p>_______________</p><p>توقيع الطبيب</p><p style="font-weight:bold">' + (report.doctor || '') + '</p></div>';
  html += '<div style="text-align:center"><p>_______________</p><p>ختم المنشأة</p></div>';
  html += '</div>';
  html += '<p style="text-align:center;margin-top:24px;font-size:11px;color:#999">تاريخ الإصدار: ' + new Date().toLocaleDateString('ar-SA') + ' | Report #' + (report.report_number || '') + '</p>';
  html += '</div>';

  printDocument(label.ar, html, { showHeader: false });
};

// ===== DRUG INTERACTION CHECK =====
window.checkDrugInteractions = async (drugs) => {
  try {
    if (!drugs || drugs.length < 2) return;
    const result = await API.post('/api/drug-interactions/check', { drugs });
    if (result.interactions && result.interactions.length > 0) {
      let alertHtml = '<div style="background:#fff3f3;border:2px solid #ff4444;border-radius:12px;padding:16px;direction:rtl">';
      alertHtml += '<h4 style="color:#cc0000;margin:0 0 12px">⚠️ ' + tr('Drug Interactions Found!', 'تم العثور على تعارضات دوائية!') + '</h4>';
      result.interactions.forEach(i => {
        const color = i.severity === 'critical' ? '#cc0000' : i.severity === 'high' ? '#ff6600' : '#ff9900';
        alertHtml += '<div style="margin:8px 0;padding:8px;background:#fff;border-right:4px solid ' + color + ';border-radius:4px">';
        alertHtml += '<strong>' + i.drugs.join(' ↔ ') + '</strong><br>';
        alertHtml += '<span style="color:' + color + '">[' + i.severity.toUpperCase() + '] ' + (isArabic ? i.message_ar : i.message_en) + '</span>';
        alertHtml += '</div>';
      });
      alertHtml += '</div>';

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';
      modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:500px;max-height:80vh;overflow-y:auto">' +
        alertHtml +
        '<div style="display:flex;gap:12px;margin-top:16px">' +
        '<button class="btn btn-danger" onclick="this.closest(\'.modal-overlay\')?.remove();this.parentElement.parentElement.parentElement.remove()" style="flex:1;background:#cc0000;color:#fff">🚫 ' + tr('Cancel Prescription', 'إلغاء الوصفة') + '</button>' +
        '<button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1">⚠️ ' + tr('Continue Anyway', 'متابعة رغم التحذير') + '</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }
  } catch (e) { console.error('Interaction check failed:', e); }
};

// ===== ALLERGY CHECK =====
window.checkAllergyBeforePrescribe = async (patientId, drugs) => {
  try {
    if (!patientId || !drugs || drugs.length === 0) return true;
    const result = await API.post('/api/allergy-check', { patient_id: patientId, drugs });
    if (result.alerts && result.alerts.length > 0) {
      let alertHtml = '<div style="background:#ffe0e0;border:3px solid #ff0000;border-radius:12px;padding:20px;direction:rtl">';
      alertHtml += '<h3 style="color:#cc0000;margin:0 0 12px">🚨 ' + tr('ALLERGY ALERT!', 'تحذير حساسية!') + '</h3>';
      alertHtml += '<p style="margin:0 0 12px">' + tr('Patient allergies:', 'حساسية المريض:') + ' <strong style="color:#cc0000">' + result.patient_allergies + '</strong></p>';
      result.alerts.forEach(a => {
        alertHtml += '<div style="margin:8px 0;padding:10px;background:#fff;border-right:5px solid #ff0000;border-radius:4px">';
        alertHtml += '<strong style="color:#cc0000">💊 ' + a.drug + '</strong><br>';
        alertHtml += '<span>' + (isArabic ? a.message_ar : a.message_en) + '</span>';
        alertHtml += '</div>';
      });
      alertHtml += '</div>';

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(200,0,0,0.3);z-index:9999;display:flex;align-items:center;justify-content:center';
      modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:500px">' +
        alertHtml +
        '<div style="margin-top:16px;text-align:center">' +
        '<button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#cc0000;color:#fff;width:100%;padding:12px">❌ ' + tr('Understood - Review Prescription', 'مفهوم - مراجعة الوصفة') + '</button>' +
        '</div></div>';
      document.body.appendChild(modal);
      return false;
    }
    return true;
  } catch (e) { return true; }
};




// ===== APPOINTMENT CHECK-IN (Receptionist) =====
window.checkInPatient = async (appointmentId) => {
  try {
    const result = await API.put('/api/appointments/' + appointmentId + '/checkin', {});
    showToast(tr('Patient checked in! Added to waiting queue.', 'تم تسجيل وصول المريض! تمت إضافته لقائمة الانتظار') + ' ✅');
    // Refresh the page
    if (typeof renderAppointments === 'function') {
      const el = document.getElementById('mainContent');
      if (el) renderAppointments(el);
    }
  } catch (e) { showToast(tr('Check-in failed', 'فشل تسجيل الوصول'), 'error'); }
};

window.markNoShow = async (appointmentId) => {
  if (!confirm(tr('Mark this patient as No-Show?', 'تحديد المريض كمتغيب؟'))) return;
  try {
    await API.put('/api/appointments/' + appointmentId + '/noshow', {});
    showToast(tr('Marked as No-Show', 'تم التحديد كمتغيب') + ' ⚠️');
    if (typeof renderAppointments === 'function') {
      const el = document.getElementById('mainContent');
      if (el) renderAppointments(el);
    }
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== NEXT PATIENT (Doctor) =====
window.callNextPatient = async () => {
  try {
    const result = await API.get('/api/doctor/next-patient');
    if (!result.hasNext) {
      showToast(tr('No patients waiting', 'لا يوجد مرضى بالانتظار') + ' ✅', 'info');
      return;
    }

    // Show patient info modal
    const p = result.patient || {};
    const v = result.vitals || {};
    const q = result.queue || {};

    let modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = '<div style="background:var(--bg-card,#fff);border-radius:16px;padding:28px;width:600px;direction:rtl;max-height:90vh;overflow-y:auto">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h3 style="margin:0;color:var(--primary)">🔔 ' + tr('Next Patient', 'المريض التالي') + '</h3>' +
      '<span style="background:#e3f2fd;padding:4px 12px;border-radius:20px;font-size:14px">⏳ ' + result.waiting_count + ' ' + tr('waiting', 'بالانتظار') + '</span>' +
      '</div>' +
      '<div style="background:#f8f9fa;border-radius:12px;padding:16px;margin-bottom:16px">' +
      '<h4 style="margin:0 0 8px;font-size:18px">' + (p.name_ar || p.name_en || q.patient_name || '') + '</h4>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px">' +
      '<span>📁 ' + tr('MRN:', 'الملف:') + ' <strong>' + (p.mrn || p.file_number || '') + '</strong></span>' +
      '<span>🎂 ' + tr('Age:', 'العمر:') + ' <strong>' + (p.age || '') + '</strong></span>' +
      '<span>📱 ' + tr('Phone:', 'الجوال:') + ' <strong>' + (p.phone || '') + '</strong></span>' +
      '<span>🆔 ' + tr('ID:', 'الهوية:') + ' <strong>' + (p.national_id || '') + '</strong></span>' +
      (p.allergies ? '<span style="grid-column:1/-1;color:#cc0000;font-weight:bold">⚠️ ' + tr('Allergies:', 'حساسية:') + ' ' + p.allergies + '</span>' : '') +
      (p.chronic_diseases ? '<span style="grid-column:1/-1;color:#e65100">🏥 ' + tr('Chronic:', 'أمراض مزمنة:') + ' ' + p.chronic_diseases + '</span>' : '') +
      '</div></div>' +
      (v.blood_pressure || v.temperature || v.pulse ?
        '<div style="background:#e8f5e9;border-radius:12px;padding:12px;margin-bottom:16px">' +
        '<h5 style="margin:0 0 8px">' + tr('Latest Vitals', 'العلامات الحيوية') + '</h5>' +
        '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:14px">' +
        (v.blood_pressure ? '<span>🩺 BP: <strong>' + v.blood_pressure + '</strong></span>' : '') +
        (v.temperature ? '<span>🌡️ T: <strong>' + v.temperature + '°C</strong></span>' : '') +
        (v.pulse ? '<span>❤️ P: <strong>' + v.pulse + '</strong></span>' : '') +
        (v.spo2 ? '<span>🫁 SpO₂: <strong>' + v.spo2 + '%</strong></span>' : '') +
        (v.weight ? '<span>⚖️ W: <strong>' + v.weight + 'kg</strong></span>' : '') +
        '</div></div>' : '') +
      '<div style="display:flex;gap:12px">' +
      '<button class="btn btn-primary" onclick="selectPatientFromQueue(' + (p.id || 'null') + ');this.closest(\'div\').parentElement.remove()" style="flex:2;padding:12px">✅ ' + tr('Start Consultation', 'بدء الاستشارة') + '</button>' +
      '<button class="btn btn-secondary" onclick="this.closest(\'div\').parentElement.remove()" style="flex:1">❌ ' + tr('Skip', 'تخطي') + '</button>' +
      '</div></div>';
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  } catch (e) { showToast(tr('Error loading next patient', 'خطأ'), 'error'); console.error(e); }
};

window.selectPatientFromQueue = (patientId) => {
  if (!patientId) return;
  const select = document.getElementById('drPatient');
  if (select) {
    select.value = patientId;
    select.dispatchEvent(new Event('change'));
    showToast(tr('Patient loaded!', 'تم تحميل المريض!'));
  }
};

// ===== TRIAGE (Nursing) =====
window.showTriageForm = (patientId, patientName) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = '<div style="background:var(--bg-card,#fff);border-radius:16px;padding:24px;width:450px;direction:rtl">' +
    '<h3 style="margin:0 0 16px;color:var(--primary)">🏥 ' + tr('Triage Assessment', 'تصنيف المريض') + '</h3>' +
    '<p style="margin:0 0 12px;font-weight:bold">' + (patientName || '') + '</p>' +
    '<div class="form-group"><label>' + tr('Triage Level', 'مستوى الفرز') + '</label>' +
    '<select class="form-input" id="triageLevel">' +
    '<option value="5" style="background:#4caf50;color:#fff">5 - ' + tr('Non-Urgent', 'غير طارئ') + '</option>' +
    '<option value="4" style="background:#2196f3;color:#fff">4 - ' + tr('Less Urgent', 'أقل إلحاحاً') + '</option>' +
    '<option value="3" selected style="background:#ff9800;color:#fff">3 - ' + tr('Urgent', 'مستعجل') + '</option>' +
    '<option value="2" style="background:#ff5722;color:#fff">2 - ' + tr('Emergency', 'طوارئ') + '</option>' +
    '<option value="1" style="background:#d50000;color:#fff">1 - ' + tr('Resuscitation', 'إنعاش') + '</option>' +
    '</select></div>' +
    '<div class="form-group"><label>' + tr('Pain Score (0-10)', 'مقياس الألم (0-10)') + '</label>' +
    '<div style="display:flex;align-items:center;gap:12px">' +
    '<input type="range" id="painScore" min="0" max="10" value="0" style="flex:1" oninput="document.getElementById(\'painValue\').textContent=this.value">' +
    '<span id="painValue" style="font-size:24px;font-weight:bold;width:30px;text-align:center">0</span>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#999"><span>😊 ' + tr('No Pain', 'لا ألم') + '</span><span>😖 ' + tr('Worst Pain', 'أسوأ ألم') + '</span></div></div>' +
    '<div class="form-group"><label>' + tr('Chief Complaint', 'الشكوى الرئيسية') + '</label>' +
    '<input class="form-input" id="chiefComplaint" placeholder="' + tr('Main reason for visit', 'سبب الزيارة الرئيسي') + '"></div>' +
    '<button class="btn btn-primary" onclick="saveTriageData(' + patientId + ')" style="width:100%;padding:12px">💾 ' + tr('Save Triage', 'حفظ التصنيف') + '</button>' +
    '</div>';
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

window.saveTriageData = async (patientId) => {
  try {
    await API.post('/api/nursing/triage', {
      patient_id: patientId,
      triage_level: document.getElementById('triageLevel')?.value,
      pain_score: document.getElementById('painScore')?.value,
      chief_complaint: document.getElementById('chiefComplaint')?.value,
    });
    document.querySelector('[style*="position:fixed"][style*="z-index:9999"]')?.remove();
    showToast(tr('Triage saved!', 'تم حفظ التصنيف!') + ' ✅');
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== DUPLICATE APPOINTMENT CHECK =====
window.checkDuplicateAppointment = async (patientId, date, doctor) => {
  try {
    const result = await API.post('/api/appointments/check-duplicate', { patient_id: patientId, date, doctor });
    if (result.duplicate) {
      showToast(tr('Warning: Patient already has appointment with this doctor on this date!', 'تحذير: المريض لديه موعد مسبق مع نفس الطبيب بنفس التاريخ!') + ' ⚠️', 'warning');
      return true;
    }
    return false;
  } catch (e) { return false; }
};



window.loadMyQueue = async () => {
  try {
    const queue = await API.get('/api/doctor/my-queue');
    if (!queue || queue.length === 0) {
      showToast(tr('No patients in your queue', 'لا يوجد مرضى في طابورك'), 'info');
      return;
    }
    let html = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center">' +
      '<div style="background:var(--bg-card,#fff);border-radius:16px;padding:24px;width:500px;direction:rtl;max-height:80vh;overflow-y:auto">' +
      '<h3 style="margin:0 0 16px">📋 ' + tr('My Queue', 'طابوري') + ' (' + queue.length + ')</h3>';
    queue.forEach((q, i) => {
      const isActive = q.status === 'In Progress';
      html += '<div style="padding:12px;margin:8px 0;background:' + (isActive ? '#e8f5e9' : '#f5f5f5') + ';border-radius:8px;border-right:4px solid ' + (isActive ? '#4caf50' : '#ccc') + ';cursor:pointer" onclick="selectPatientFromQueue(' + q.patient_id + ');this.closest(\'[style*=position]\').remove()">' +
        '<div style="display:flex;justify-content:space-between"><strong>' + (i + 1) + '. ' + (q.patient_name || '') + '</strong><span style="font-size:12px;color:#666">' + (q.check_in_time ? new Date(q.check_in_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '') + '</span></div>' +
        '<span style="font-size:12px;color:' + (isActive ? '#2e7d32' : '#999') + '">' + (isActive ? '🟢 ' + tr('In Progress', 'جاري') : '⏳ ' + tr('Waiting', 'بالانتظار')) + '</span>' +
        '</div>';
    });
    html += '<button class="btn btn-secondary" onclick="this.closest(\'[style*=position]\').remove()" style="width:100%;margin-top:12px">' + tr('Close', 'إغلاق') + '</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};



// ===== CSV EXPORT UTILITY =====
window.exportToCSV = (data, filename) => {
  if (!data || data.length === 0) { showToast(tr('No data to export', 'لا توجد بيانات للتصدير'), 'info'); return; }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  data.forEach(row => {
    csvRows.push(headers.map(h => {
      let val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
      val = val.replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) val = '"' + val + '"';
      return val;
    }).join(','));
  });
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (filename || 'export') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(tr('Exported successfully!', 'تم التصدير بنجاح!') + ' 📥');
};

// ===== RECEIPT PRINT =====
window.printReceipt = (invoice) => {
  if (!invoice) return;
  let h = '<div style="font-family:Arial;width:300px;margin:0 auto;padding:20px;direction:rtl;text-align:right">';
  h += '<div style="text-align:center;border-bottom:2px dashed #333;padding-bottom:12px;margin-bottom:12px">';
  h += '<h3 style="margin:0">المركز الطبي</h3><p style="margin:2px 0;font-size:12px">Medical Center</p>';
  h += '<p style="margin:2px 0;font-size:11px;color:#666">المملكة العربية السعودية</p>';
  h += '</div>';
  h += '<p style="margin:4px 0;font-size:13px"><strong>' + tr('Receipt', 'إيصال') + '</strong></p>';
  h += '<p style="margin:4px 0;font-size:12px">' + tr('Invoice #:', 'رقم الفاتورة:') + ' ' + (invoice.invoice_number || invoice.id || '') + '</p>';
  h += '<p style="margin:4px 0;font-size:12px">' + tr('Patient:', 'المريض:') + ' ' + (invoice.patient_name || '') + '</p>';
  h += '<p style="margin:4px 0;font-size:12px">' + tr('Date:', 'التاريخ:') + ' ' + new Date(invoice.created_at || Date.now()).toLocaleDateString('ar-SA') + '</p>';
  h += '<div style="border-top:1px dashed #999;border-bottom:1px dashed #999;padding:8px 0;margin:8px 0">';
  h += '<p style="margin:4px 0;font-size:12px">' + tr('Service:', 'الخدمة:') + ' ' + (invoice.description || invoice.service_type || '') + '</p>';
  h += '<p style="margin:4px 0;font-size:14px;font-weight:bold">' + tr('Total:', 'المجموع:') + ' ' + parseFloat(invoice.total || 0).toFixed(2) + ' ' + tr('SAR', 'ريال') + '</p>';
  if (invoice.vat_amount && parseFloat(invoice.vat_amount) > 0) {
    h += '<p style="margin:4px 0;font-size:11px;color:#666">' + tr('Includes VAT:', 'شامل الضريبة:') + ' ' + parseFloat(invoice.vat_amount).toFixed(2) + '</p>';
  }
  if (invoice.amount_paid) {
    h += '<p style="margin:4px 0;font-size:12px">' + tr('Paid:', 'المدفوع:') + ' ' + parseFloat(invoice.amount_paid).toFixed(2) + '</p>';
  }
  if (invoice.balance_due && parseFloat(invoice.balance_due) > 0) {
    h += '<p style="margin:4px 0;font-size:12px;color:#cc0000">' + tr('Balance:', 'المتبقي:') + ' ' + parseFloat(invoice.balance_due).toFixed(2) + '</p>';
  }
  h += '<p style="margin:4px 0;font-size:12px">' + tr('Payment:', 'طريقة الدفع:') + ' ' + (invoice.payment_method || 'Cash') + '</p>';
  h += '</div>';
  h += '<p style="text-align:center;font-size:10px;color:#999;margin-top:12px">' + tr('Thank you for your visit', 'شكراً لزيارتكم') + '</p>';
  h += '<p style="text-align:center;font-size:10px;color:#999">www.nama-medical.com</p>';
  h += '</div>';

  const w = window.open('', '_blank', 'width=350,height=500');
  w.document.write('<html><head><title>' + tr('Receipt', 'إيصال') + '</title></head><body style="margin:0">' + h + '<script>setTimeout(()=>{window.print();},300);<\/script></body></html>');
  w.document.close();
};

// ===== PASSWORD CHANGE =====
window.showChangePassword = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = '<div style="background:var(--bg-card,#fff);border-radius:16px;padding:28px;width:400px;direction:rtl">' +
    '<h3 style="margin:0 0 20px;color:var(--primary)">🔑 ' + tr('Change Password', 'تغيير كلمة المرور') + '</h3>' +
    '<div class="form-group"><label>' + tr('Current Password', 'كلمة المرور الحالية') + '</label><input type="password" class="form-input" id="cpCurrent"></div>' +
    '<div class="form-group"><label>' + tr('New Password', 'كلمة المرور الجديدة') + '</label><input type="password" class="form-input" id="cpNew" placeholder="' + tr('Min 6 characters', '6 أحرف على الأقل') + '"></div>' +
    '<div class="form-group"><label>' + tr('Confirm New', 'تأكيد الجديدة') + '</label><input type="password" class="form-input" id="cpConfirm"></div>' +
    '<div style="display:flex;gap:12px;margin-top:16px">' +
    '<button class="btn btn-primary" onclick="submitChangePassword()" style="flex:1">💾 ' + tr('Save', 'حفظ') + '</button>' +
    '<button class="btn btn-secondary" onclick="this.closest(\'[style*=position]\').remove()" style="flex:1">' + tr('Cancel', 'إلغاء') + '</button>' +
    '</div></div>';
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

window.submitChangePassword = async () => {
  const current = document.getElementById('cpCurrent')?.value;
  const newPw = document.getElementById('cpNew')?.value;
  const confirm = document.getElementById('cpConfirm')?.value;
  if (!current || !newPw) return showToast(tr('Fill all fields', 'أكمل جميع الحقول'), 'error');
  if (newPw !== confirm) return showToast(tr('Passwords do not match', 'كلمات المرور غير متطابقة'), 'error');
  if (newPw.length < 6) return showToast(tr('Min 6 characters', '6 أحرف على الأقل'), 'error');
  try {
    await API.put('/api/auth/change-password', { current_password: current, new_password: newPw });
    document.querySelector('[style*="position:fixed"][style*="z-index:9999"]')?.remove();
    showToast(tr('Password changed!', 'تم تغيير كلمة المرور!') + ' ✅');
  } catch (e) {
    showToast(e.message || tr('Error', 'خطأ'), 'error');
  }
};

// ===== DATABASE BACKUP =====
window.startBackup = async () => {
  showToast(tr('Creating backup...', 'جاري إنشاء النسخة الاحتياطية...') + ' ⏳');
  try {
    const response = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error('Backup failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nama_backup_' + new Date().toISOString().slice(0, 10) + '.sql';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast(tr('Backup downloaded!', 'تم تحميل النسخة الاحتياطية!') + ' ✅');
  } catch (e) { showToast(tr('Backup failed', 'فشل النسخ الاحتياطي'), 'error'); }
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  // Don't trigger if user is typing in input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    if (e.key === 'Escape') e.target.blur();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'k': // Search
        e.preventDefault();
        const searchInput = document.querySelector('.search-box input') || document.querySelector('input[type="search"]') || document.querySelector('#globalSearch');
        if (searchInput) { searchInput.focus(); searchInput.select(); }
        break;
      case 'n': // New patient → go to reception
        e.preventDefault();
        if (typeof navigateTo === 'function') navigateTo(1);
        break;
      case 'p': // Print current page
        e.preventDefault();
        window.print();
        break;
    }
  }

  // Escape → close any modal
  if (e.key === 'Escape') {
    const modal = document.querySelector('[style*="position:fixed"][style*="z-index:9999"]');
    if (modal) modal.remove();
  }

  // Number keys 1-9 for quick nav (Alt+number)
  if (e.altKey && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const pageIdx = parseInt(e.key) - 1;
    if (typeof navigateTo === 'function') navigateTo(pageIdx);
  }
});



window.toggleCalendarView = async () => {
  const existing = document.getElementById('calendarGrid');
  if (existing) { existing.remove(); document.getElementById('calToggleBtn').textContent = '📅 ' + tr('Calendar View', 'عرض التقويم'); return; }
  document.getElementById('calToggleBtn').textContent = '📋 ' + tr('List View', 'عرض القائمة');

  try {
    const appts = await API.get('/api/appointments');
    const today = new Date();
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    const dayNames = isArabic ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

    let html = '<div id="calendarGrid" style="margin-top:12px;overflow-x:auto">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed">';
    html += '<thead><tr><th style="width:60px;padding:8px;background:#f0f6ff;border:1px solid #e0e0e0">' + tr('Time', 'الوقت') + '</th>';
    days.forEach((d, i) => {
      const isToday = d.toDateString() === today.toDateString();
      html += '<th style="padding:8px;background:' + (isToday ? '#1a73e8;color:#fff' : '#f0f6ff') + ';border:1px solid #e0e0e0;font-weight:' + (isToday ? 'bold' : 'normal') + '">' + dayNames[i] + '<br><span style="font-size:11px">' + d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }) + '</span></th>';
    });
    html += '</tr></thead><tbody>';

    hours.forEach(h => {
      html += '<tr>';
      html += '<td style="padding:4px 8px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;text-align:center">' + (h < 10 ? '0' : '') + h + ':00</td>';
      days.forEach(d => {
        const dateStr = d.toISOString().slice(0, 10);
        const hourAppts = appts.filter(a => {
          const aDate = (a.appt_date || a.date || '').substring(0, 10);
          const aTime = a.appt_time || a.time || '';
          const aHour = parseInt(aTime.split(':')[0]);
          return aDate === dateStr && aHour === h;
        });
        html += '<td style="padding:2px;border:1px solid #e0e0e0;vertical-align:top;height:50px">';
        hourAppts.forEach(a => {
          const statusColor = a.status === 'Cancelled' ? '#ffcdd2' : a.status === 'Checked-In' ? '#c8e6c9' : a.status === 'No-Show' ? '#ffe0b2' : '#e3f2fd';
          html += '<div style="background:' + statusColor + ';border-radius:4px;padding:2px 4px;margin:1px 0;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" title="' + (a.patient_name || '') + ' - ' + (a.doctor_name || a.doctor || '') + '">' +
            (a.patient_name || '').split(' ')[0] + ' <span style="color:#666">' + (a.doctor_name || a.doctor || '').split(' ').slice(-1)[0] + '</span></div>';
        });
        html += '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    const table = document.querySelector('.data-table') || document.querySelector('table');
    if (table) table.insertAdjacentHTML('beforebegin', html);
    else {
      const content = document.getElementById('mainContent');
      if (content) content.insertAdjacentHTML('beforeend', html);
    }
  } catch (e) { console.error('Calendar error:', e); }
};


window.exportPatients = async () => {
  try { const data = await API.get('/api/patients'); exportToCSV(data, 'patients'); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.exportInvoices = async () => {
  try { const data = await API.get('/api/invoices'); exportToCSV(data, 'invoices'); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.exportAppointments = async () => {
  try { const data = await API.get('/api/appointments'); exportToCSV(data, 'appointments'); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};



// ===== LANGUAGE TOGGLE =====
window.toggleLanguage = () => {
  isArabic = !isArabic;
  localStorage.setItem('namaLang', isArabic ? 'ar' : 'en');
  // Update document direction
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  document.body.style.direction = isArabic ? 'rtl' : 'ltr';
  document.body.style.textAlign = isArabic ? 'right' : 'left';
  // Rebuild sidebar navigation in new language
  if (typeof buildNav === 'function') buildNav();
  // Update header text if exists
  const headerTitle = document.querySelector('.header h1, .app-title, .logo-text');
  if (headerTitle) headerTitle.textContent = isArabic ? 'المركز الطبي' : 'Medical Center';
  // Re-render current page content
  if (typeof navigateTo === 'function') navigateTo(currentPage);
  // Update the lang button text
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = isArabic ? '🌐 EN' : '🌐 عربي';
};

// ===== MOBILE LANGUAGE PROMPT =====
window.showMobileLangPrompt = () => {
  // Only show on mobile if no lang preference saved
  const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile || localStorage.getItem('namaLang')) return;

  const prompt = document.createElement('div');
  prompt.id = 'mobileLangPrompt';
  prompt.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;padding:16px 20px;z-index:99999;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,0.3);animation:slideUp 0.4s ease';
  prompt.innerHTML = '<span style="font-size:15px;font-weight:500">Choose Language / اختر اللغة</span>' +
    '<button onclick="setLang(\'en\')" style="padding:8px 20px;border:2px solid #fff;border-radius:8px;background:transparent;color:#fff;font-size:14px;font-weight:bold;cursor:pointer">🇬🇧 English</button>' +
    '<button onclick="setLang(\'ar\')" style="padding:8px 20px;border:2px solid #fff;border-radius:8px;background:rgba(255,255,255,0.2);color:#fff;font-size:14px;font-weight:bold;cursor:pointer">🇸🇦 عربي</button>';
  document.body.appendChild(prompt);

  // Add slide-up animation
  const style = document.createElement('style');
  style.textContent = '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}';
  document.head.appendChild(style);
};

window.setLang = (lang) => {
  localStorage.setItem('namaLang', lang);
  isArabic = lang === 'ar';
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.documentElement.lang = isArabic ? 'ar' : 'en';
  document.body.style.direction = isArabic ? 'rtl' : 'ltr';
  document.body.style.textAlign = isArabic ? 'right' : 'left';
  const prompt = document.getElementById('mobileLangPrompt');
  if (prompt) prompt.remove();
  if (typeof buildNav === 'function') buildNav();
  if (typeof navigateTo === 'function') navigateTo(currentPage);
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = isArabic ? '🌐 EN' : '🌐 عربي';
};



window.sendDirectRad = async () => {
  const patientId = document.getElementById('drPatient')?.value || window._selectedPatientId;
  if (!patientId) return showToast(tr('Select patient first', 'اختر مريض أولاً'), 'error');
  const patientName = document.getElementById('drPatient')?.selectedOptions[0]?.text || window._selectedPatientName || '';
  const examType = document.getElementById('radDirectType')?.value || '';
  const details = document.getElementById('radDirectDesc')?.value || '';
  const priority = document.getElementById('radDirectPriority')?.value || 'routine';
  try {
    await API.post('/api/radiology/orders', { patient_id: patientId, patient_name: patientName, exam_type: examType, details: details, priority: priority, status: 'Pending' });
    showToast(tr('Radiology order sent!', 'تم إرسال طلب الأشعة!'));
    document.getElementById('radDirectType') && (document.getElementById('radDirectType').value = '');
    document.getElementById('radDirectDesc') && (document.getElementById('radDirectDesc').value = '');
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

async function renderDashboard(el) {
  const [s, enhanced] = await Promise.all([
    API.get('/api/dashboard/stats'),
    API.get('/api/dashboard/enhanced').catch(() => ({}))
  ]);
  // Schedule chart rendering after HTML is set
  setTimeout(() => renderDashboardCharts(el, enhanced), 50);
  let topDrHtml = '';
  if (enhanced.topDoctors && enhanced.topDoctors.length) {
    topDrHtml = enhanced.topDoctors.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--hover);border-radius:8px;margin:4px 0">
      <span>👨‍⚕️ <strong>${d.display_name || tr('Unknown', 'غير معروف')}</strong> <span class="badge badge-info" style="font-size:10px">${d.patients} ${tr('patients', 'مريض')}</span></span>
      <span style="font-weight:600;color:var(--accent)">${Number(d.revenue).toLocaleString()} SAR</span>
    </div>`).join('');
  }
  let revTypeHtml = '';
  if (enhanced.revenueByType && enhanced.revenueByType.length) {
    const typeIcons = { 'File Opening': '📁', 'Lab Test': '🔬', 'Radiology': '📡', 'Consultation': '🩺', 'Pharmacy': '💊', 'Appointment': '📅' };
    revTypeHtml = enhanced.revenueByType.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--hover);border-radius:8px;margin:4px 0">
      <span>${typeIcons[r.service_type] || '📄'} ${r.service_type} <span class="badge badge-info" style="font-size:10px">${r.cnt}</span></span>
      <span style="font-weight:600">${Number(r.total).toLocaleString()} SAR</span>
    </div>`).join('');
  }
  el.innerHTML = `
    <div class="page-title">📊 ${tr('System Dashboard', 'لوحة التحكم')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#60a5fa"><span class="stat-icon">👥</span><div class="stat-label">${tr('Patients', 'المرضى')}</div><div class="stat-value">${s.patients}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><span class="stat-icon">💵</span><div class="stat-label">${tr('Revenue', 'الإيرادات')}</div><div class="stat-value">${Number(s.revenue).toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><span class="stat-icon">⏳</span><div class="stat-label">${tr('Waiting', 'بانتظار')}</div><div class="stat-value">${s.waiting}</div></div>
      <div class="stat-card" style="--stat-color:#f87171"><span class="stat-icon">📄</span><div class="stat-label">${tr('Pending Claims', 'مطالبات معلقة')}</div><div class="stat-value">${s.pendingClaims}</div></div>
      <div class="stat-card" style="--stat-color:#a78bfa"><span class="stat-icon">📅</span><div class="stat-label">${tr("Today's Appts", 'مواعيد اليوم')}</div><div class="stat-value">${enhanced.todayAppts || s.todayAppts}</div></div>
      <div class="stat-card" style="--stat-color:#38bdf8"><span class="stat-icon">👨‍💼</span><div class="stat-label">${tr('Employees', 'الموظفين')}</div><div class="stat-value">${s.employees}</div></div>
    </div>
    <div class="stats-grid" style="margin-top:16px">
      <div class="stat-card" style="--stat-color:#22c55e"><span class="stat-icon">💰</span><div class="stat-label">${tr("Today's Revenue", 'إيراد اليوم')}</div><div class="stat-value">${Number(enhanced.todayRevenue || 0).toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><span class="stat-icon">📈</span><div class="stat-label">${tr('Monthly Revenue', 'إيراد الشهر')}</div><div class="stat-value">${Number(enhanced.monthRevenue || 0).toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#ef4444"><span class="stat-icon">⚠️</span><div class="stat-label">${tr('Unpaid', 'غير مدفوع')}</div><div class="stat-value">${Number(enhanced.unpaidTotal || 0).toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#8b5cf6"><span class="stat-icon">🔬</span><div class="stat-label">${tr('Pending Lab', 'مختبر معلق')}</div><div class="stat-value">${enhanced.pendingLab || 0}</div></div>
      <div class="stat-card" style="--stat-color:#06b6d4"><span class="stat-icon">📡</span><div class="stat-label">${tr('Pending Rad', 'أشعة معلقة')}</div><div class="stat-value">${enhanced.pendingRad || 0}</div></div>
      <div class="stat-card" style="--stat-color:#ec4899"><span class="stat-icon">💊</span><div class="stat-label">${tr('Pending Rx', 'وصفات معلقة')}</div><div class="stat-value">${enhanced.pendingRx || 0}</div></div>
    </div>
    <div class="grid-equal" style="margin-top:16px">
      <div class="card">
        <div class="card-title">🏆 ${tr('Top Doctors (This Month)', 'أفضل الأطباء (هذا الشهر)')}</div>
        ${topDrHtml || `<div class="empty-state"><p>${tr('No data yet', 'لا توجد بيانات')}</p></div>`}
      </div>
      <div class="card">
        <div class="card-title">📊 ${tr('Revenue by Service Type', 'الإيرادات حسب نوع الخدمة')}</div>
        ${enhanced.revenueByType && enhanced.revenueByType.length ? (() => {
      const maxRev = Math.max(...enhanced.revenueByType.map(r => Number(r.total)));
      const typeIcons = { 'File Opening': '📁', 'Lab Test': '🔬', 'Radiology': '📡', 'Consultation': '🩺', 'Pharmacy': '💊', 'Appointment': '📅' };
      const colors = ['#3b82f6', '#4ade80', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      return enhanced.revenueByType.map((r, i) => `<div style="margin:8px 0">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span>${typeIcons[r.service_type] || '📄'} ${r.service_type} (${r.cnt})</span>
              <span style="font-weight:600">${Number(r.total).toLocaleString()} SAR</span>
            </div>
            <div style="background:var(--hover);border-radius:8px;height:22px;overflow:hidden">
              <div style="height:100%;width:${Math.round(Number(r.total) / maxRev * 100)}%;background:${colors[i % colors.length]};border-radius:8px;transition:width 1s ease"></div>
            </div>
          </div>`).join('');
    })() : `<div class="empty-state"><p>${tr('No data yet', 'لا توجد بيانات')}</p></div>`}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-title">⚡ ${tr('Quick Actions', 'إجراءات سريعة')}</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">
        <button class="btn" onclick="navigateTo(1)">🏥 ${tr('Reception', 'الاستقبال')}</button>
        <button class="btn" onclick="navigateTo(2)">📅 ${tr('Appointments', 'المواعيد')}</button>
        <button class="btn" onclick="navigateTo(4)">🔬 ${tr('Lab', 'المختبر')}</button>
        <button class="btn" onclick="navigateTo(6)">💊 ${tr('Pharmacy', 'الصيدلية')}</button>
        <button class="btn" onclick="navigateTo(14)">📋 ${tr('Reports', 'التقارير')}</button>
        <button class="btn" onclick="navigateTo(8)">💰 ${tr('Finance', 'المالية')}</button>
      </div>
    </div>`;

  loadDashboardCharts();
}

// === DASHBOARD CHARTS (Chart.js) ===
function renderDashboardCharts(el, enhanced) {
  try {
    const revData = enhanced.revenueByType || [];
    if (revData.length === 0 || typeof Chart === 'undefined') return;
    const chartRow = document.createElement('div');
    chartRow.className = 'grid-equal';
    chartRow.style.marginTop = '16px';
    const leftCard = document.createElement('div');
    leftCard.className = 'card';
    leftCard.innerHTML = '<div class="card-title">\u{1F4CA} ' + tr('Revenue by Service', '\u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a \u062d\u0633\u0628 \u0627\u0644\u062e\u062f\u0645\u0629') + '</div><div style="max-height:280px;display:flex;justify-content:center"><canvas id="dashDoughnut"></canvas></div>';
    const rightCard = document.createElement('div');
    rightCard.className = 'card';
    rightCard.innerHTML = '<div class="card-title">\u{1F4C8} ' + tr('Revenue Breakdown', '\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a') + '</div><div style="max-height:280px"><canvas id="dashBar"></canvas></div>';
    chartRow.appendChild(leftCard);
    chartRow.appendChild(rightCard);
    el.appendChild(chartRow);
    const labels = revData.map(r => r.service_type);
    const values = revData.map(r => parseFloat(r.total) || 0);
    const clrs = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
    new Chart(document.getElementById('dashDoughnut'), { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: clrs.slice(0, labels.length), borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Tajawal', size: 11 }, padding: 10 } } } } });
    new Chart(document.getElementById('dashBar'), { type: 'bar', data: { labels, datasets: [{ label: tr('Revenue', 'الإيراد'), data: values, backgroundColor: clrs.slice(0, labels.length), borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  } catch (e) { console.log('Chart error:', e); }
}

// === CRITICAL LAB VALUE DEFINITIONS ===
const CRITICAL_LAB_VALUES = {
  'Hemoglobin': { low: 7.0, high: 20.0, unit: 'g/dL' },
  'Platelets': { low: 50, high: 1000, unit: 'x10³/µL' },
  'WBC': { low: 2.0, high: 30.0, unit: 'x10³/µL' },
  'Potassium': { low: 2.5, high: 6.5, unit: 'mEq/L' },
  'Sodium': { low: 120, high: 160, unit: 'mEq/L' },
  'Glucose': { low: 40, high: 500, unit: 'mg/dL' },
  'Creatinine': { low: 0, high: 10.0, unit: 'mg/dL' },
  'Troponin': { low: 0, high: 0.04, unit: 'ng/mL' },
  'INR': { low: 0, high: 5.0, unit: '' },
  'Lactate': { low: 0, high: 4.0, unit: 'mmol/L' }
};
window.checkCriticalLabValue = (testName, resultText) => {
  const numMatch = resultText.match(/[\d.]+/);
  if (!numMatch) return null;
  const val = parseFloat(numMatch[0]);
  for (const [key, range] of Object.entries(CRITICAL_LAB_VALUES)) {
    if (testName.toLowerCase().includes(key.toLowerCase())) {
      if (val < range.low) return { test: key, value: val, status: 'CRITICALLY LOW', range };
      if (val > range.high) return { test: key, value: val, status: 'CRITICALLY HIGH', range };
    }
  }
  return null;
};

// === DRUG ALLERGY CHECK ===
window.checkDrugAllergy = async (patientId, drugName) => {
  try {
    const patients = await API.get('/api/patients');
    const patient = patients.find(p => p.id == patientId);
    if (!patient || !patient.allergies) return false;
    const allergies = patient.allergies.toLowerCase().split(/[,،;]+/).map(a => a.trim());
    const drug = drugName.toLowerCase();
    for (const allergy of allergies) {
      if (allergy && (drug.includes(allergy) || allergy.includes(drug))) {
        return allergy;
      }
    }
    return false;
  } catch { return false; }
};

// === PATIENT STATEMENT (Printable Account) ===
window.printPatientStatement = async (patientId) => {
  try {
    const account = await API.get('/api/patients/' + patientId + '/account');
    const p = account.patient;
    const invoices = account.invoices || [];
    let rows = invoices.map(inv =>
      '<tr><td>' + (inv.created_at ? new Date(inv.created_at).toLocaleDateString('ar-SA') : '-') +
      '</td><td>' + (inv.description || inv.service_type || '-') +
      '</td><td>' + (inv.total || 0) + ' SAR</td><td>' +
      (inv.paid ? '\u2705 ' + tr('Paid', 'مدفوع') : '\u26A0\uFE0F ' + tr('Unpaid', 'غير مدفوع')) + '</td></tr>'
    ).join('');
    const content = '<div style="text-align:center;margin-bottom:20px"><h2>\u{1F3E5} ' + tr('Medical Center', 'المركز الطبي') + '</h2><div style="margin-bottom:8px"><button class="btn btn-sm" onclick="exportPatients()" style="background:#e0f7fa;color:#00838f">📥 ${tr("Export CSV","تصدير CSV")}</button></div><h3>' + tr('Patient Financial Statement', 'كشف حساب المريض') + '</h3></div>' +
      '<table style="width:100%;margin-bottom:15px"><tr><td><strong>' + tr('Name', 'الاسم') + ':</strong> ' + (p.name_ar || p.name_en) + '</td><td><strong>MRN:</strong> ' + (p.mrn || p.file_number) + '</td></tr>' +
      '<tr><td><strong>' + tr('ID', 'الهوية') + ':</strong> ' + (p.national_id || '-') + '</td><td><strong>' + tr('Phone', 'الجوال') + ':</strong> ' + (p.phone || '-') + '</td></tr></table>' +
      '<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse"><thead><tr style="background:#f0f0f0"><th>' + tr('Date', 'التاريخ') + '</th><th>' + tr('Description', 'الوصف') + '</th><th>' + tr('Amount', 'المبلغ') + '</th><th>' + tr('Status', 'الحالة') + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div style="margin-top:20px;padding:10px;background:#f9f9f9;border-radius:8px"><strong>' + tr('Total Billed', 'إجمالي المبالغ') + ':</strong> ' + (account.totalBilled || 0) + ' SAR | <strong>' + tr('Total Paid', 'المدفوع') + ':</strong> ' + (account.totalPaid || 0) + ' SAR | <strong style="color:' + (account.balance > 0 ? 'red' : 'green') + '">' + tr('Balance', 'الرصيد') + ':</strong> ' + (account.balance || 0) + ' SAR</div>';
    printDocument(tr('Patient Statement', 'كشف حساب المريض'), content);
  } catch (e) { showToast(tr('Error loading statement', 'خطأ في تحميل الكشف'), 'error'); }
};

// === DIAGNOSIS TEMPLATES ===
let _diagTemplatesCache = null;
window.loadDiagTemplates = async () => {
  try {
    const templates = await API.get('/api/diagnosis-templates');
    _diagTemplatesCache = templates;
    const sel = document.getElementById('drDiagTemplate');
    if (!sel) return;
    sel.innerHTML = '<option value="">' + tr('-- Select Template --', '-- اختر قالب --') + '</option>';
    for (const [specialty, items] of Object.entries(templates)) {
      const group = document.createElement('optgroup');
      group.label = specialty;
      items.forEach((t, idx) => {
        const opt = document.createElement('option');
        opt.value = specialty + '|' + idx;
        opt.textContent = (isArabic ? t.name_ar : t.name) + ' [' + t.icd + ']';
        group.appendChild(opt);
      });
      sel.appendChild(group);
    }
    showToast(tr('Templates loaded!', 'تم تحميل القوالب!'));
  } catch (e) { showToast(tr('Error loading templates', 'خطأ في تحميل القوالب'), 'error'); }
};
window.applyDiagTemplate = () => {
  const val = document.getElementById('drDiagTemplate')?.value;
  if (!val || !_diagTemplatesCache) return;
  const [specialty, idx] = val.split('|');
  const t = _diagTemplatesCache[specialty]?.[parseInt(idx)];
  if (!t) return;
  document.getElementById('drDiag').value = isArabic ? t.name_ar : t.name;
  document.getElementById('drSymp').value = t.symptoms || '';
  document.getElementById('drIcd').value = t.icd || '';
  document.getElementById('drNotes').value = t.treatment || '';
};

// === PHARMACY LOW STOCK ALERTS ===
window.showPharmacyStockAlerts = async () => {
  try {
    const lowStock = await API.get('/api/pharmacy/low-stock');
    if (lowStock.length === 0) { showToast(tr('All stock levels OK!', 'جميع المخزونات بحالة جيدة!')); return; }
    let html = '<div style="max-height:400px;overflow-y:auto">';
    lowStock.forEach(d => {
      const pct = d.min_stock_level > 0 ? Math.round((d.stock_qty / d.min_stock_level) * 100) : 0;
      const color = d.stock_qty <= 0 ? '#dc2626' : d.stock_qty <= 5 ? '#f59e0b' : '#eab308';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin:4px 0;border-radius:8px;border-right:4px solid ' + color + ';background:var(--hover)">' +
        '<div><strong>' + d.drug_name + '</strong>' + (d.category ? '<br><small>' + d.category + '</small>' : '') + '</div>' +
        '<div style="text-align:center"><span style="font-size:20px;font-weight:700;color:' + color + '">' + d.stock_qty + '</span><br><small>' + tr('of', 'من') + ' ' + (d.min_stock_level || 10) + ' min</small></div></div>';
    });
    html += '</div>';
    showModal(tr('Low Stock Alerts', 'تنبيهات المخزون المنخفض') + ' (' + lowStock.length + ')', html);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// === P&L REPORT VIEWER ===
window.renderPnlReport = async (fromDate, toDate) => {
  try {
    let url = '/api/reports/pnl';
    if (fromDate && toDate) url += '?from=' + fromDate + '&to=' + toDate;
    const data = await API.get(url);
    const el = document.getElementById('pnlResult');
    if (!el) return;
    let typeRows = data.byType.map(t =>
      '<tr><td>' + (t.service_type || '-') + '</td><td>' + t.cnt + '</td><td style="font-weight:600">' + Number(t.total).toLocaleString() + ' SAR</td></tr>'
    ).join('');
    el.innerHTML = '<div class="stats-grid" style="margin-bottom:16px">' +
      '<div class="stat-card" style="--stat-color:#22c55e"><div class="stat-label">' + tr('Total Revenue', 'إجمالي الإيراد') + '</div><div class="stat-value">' + Number(data.totalRevenue).toLocaleString() + '</div></div>' +
      '<div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">' + tr('Collected', 'المحصل') + '</div><div class="stat-value">' + Number(data.totalCollected).toLocaleString() + '</div></div>' +
      '<div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">' + tr('Discounts', 'الخصومات') + '</div><div class="stat-value">' + Number(data.totalDiscounts).toLocaleString() + '</div></div>' +
      '<div class="stat-card" style="--stat-color:#ef4444"><div class="stat-label">' + tr('Uncollected', 'غير محصل') + '</div><div class="stat-value">' + Number(data.totalUncollected).toLocaleString() + '</div></div>' +
      '<div class="stat-card" style="--stat-color:#64748b"><div class="stat-label">' + tr('Est. Costs', 'تكاليف تقديرية') + '</div><div class="stat-value">' + Number(data.estimatedCosts).toLocaleString() + '</div></div>' +
      '<div class="stat-card" style="--stat-color:' + (data.netProfit >= 0 ? '#10b981' : '#ef4444') + '"><div class="stat-label">' + tr('Net Profit', 'صافي الربح') + '</div><div class="stat-value">' + Number(data.netProfit).toLocaleString() + '</div></div>' +
      '</div><table class="data-table"><thead><tr><th>' + tr('Service', 'الخدمة') + '</th><th>' + tr('Count', 'العدد') + '</th><th>' + tr('Revenue', 'الإيراد') + '</th></tr></thead><tbody>' + typeRows + '</tbody></table>';
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// === SHOW MODAL HELPER ===
window.showModal = (title, content) => {
  let modal = document.getElementById('genericModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'genericModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
    modal.innerHTML = '<div style="background:var(--card-bg,#fff);border-radius:16px;padding:24px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)"><div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:16px"><h3 id="genericModalTitle" style="margin:0"></h3><button onclick="this.closest(\'#genericModal\').style.display=\'none\'" style="border:none;background:none;font-size:20px;cursor:pointer">\u2715</button></div><div id="genericModalBody"></div></div>';
    document.body.appendChild(modal);
  }
  document.getElementById('genericModalTitle').textContent = title;
  document.getElementById('genericModalBody').innerHTML = content;
  modal.style.display = 'flex';
};

async function renderReception(el) {
  const [patients, doctors] = await Promise.all([API.get('/api/patients'), API.get('/api/employees?role=Doctor')]);
  const depts = ['العيادة العامة', 'الباطنية', 'الأطفال', 'العظام', 'الجلدية', 'الأنف والأذن', 'العيون', 'الأسنان', 'الطوارئ'];
  const deptsEn = ['General Clinic', 'Internal Medicine', 'Pediatrics', 'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Dental', 'Emergency'];
  const maxFile = patients.length ? Math.max(...patients.map(p => p.file_number || 1000)) + 1 : 1001;

  el.innerHTML = `
    <div class="page-title">🏥 ${tr('Reception', 'الاستقبال')}</div>
    <div class="split-layout">
      <div class="card">
        <div class="card-title">📝 ${tr('New Patient File', 'ملف مريض جديد')}</div>
        <div class="form-group mb-12"><label>${tr('File No.', 'رقم الملف')}</label><input class="form-input form-input-readonly" value="${maxFile}" readonly id="rFileNum"></div>
        <div class="form-group mb-12"><label>${tr('Full Name (Arabic)', 'الاسم بالعربية')}</label><input class="form-input" id="rNameAr" placeholder="${tr('Enter Arabic name', 'ادخل الاسم بالعربية')}"></div>
        <div class="form-group mb-12"><label>${tr('Full Name (English)', 'الاسم بالإنجليزية')}</label><input class="form-input" id="rNameEn" placeholder="${tr('Enter English name', 'ادخل الاسم بالإنجليزية')}"></div>
        <div class="form-group mb-12"><label>${tr('National ID', 'رقم الهوية')}</label><input class="form-input" id="rNatId"></div>
        <div class="form-group mb-12"><label>${tr('Phone', 'الجوال')}</label><input class="form-input" id="rPhone" placeholder="05XXXXXXXX"></div>
        <div class="form-group mb-12"><label>${tr('Nationality', 'الجنسية')}</label><select class="form-input" id="rNationality">
          <option value="سعودي">🇸🇦 ${tr('Saudi', 'سعودي')}</option>
          <option value="يمني">🇾🇪 ${tr('Yemeni', 'يمني')}</option>
          <option value="إماراتي">🇦🇪 ${tr('Emirati', 'إماراتي')}</option>
          <option value="كويتي">🇰🇼 ${tr('Kuwaiti', 'كويتي')}</option>
          <option value="بحريني">🇧🇭 ${tr('Bahraini', 'بحريني')}</option>
          <option value="قطري">🇶🇦 ${tr('Qatari', 'قطري')}</option>
          <option value="عماني">🇴🇲 ${tr('Omani', 'عماني')}</option>
          <option value="عراقي">🇮🇶 ${tr('Iraqi', 'عراقي')}</option>
          <option value="أردني">🇯🇴 ${tr('Jordanian', 'أردني')}</option>
          <option value="سوري">🇸🇾 ${tr('Syrian', 'سوري')}</option>
          <option value="لبناني">🇱🇧 ${tr('Lebanese', 'لبناني')}</option>
          <option value="فلسطيني">🇵🇸 ${tr('Palestinian', 'فلسطيني')}</option>
          <option value="مصري">🇪🇬 ${tr('Egyptian', 'مصري')}</option>
          <option value="سوداني">🇸🇩 ${tr('Sudanese', 'سوداني')}</option>
          <option value="ليبي">🇱🇾 ${tr('Libyan', 'ليبي')}</option>
          <option value="تونسي">🇹🇳 ${tr('Tunisian', 'تونسي')}</option>
          <option value="جزائري">🇩🇿 ${tr('Algerian', 'جزائري')}</option>
          <option value="مغربي">🇲🇦 ${tr('Moroccan', 'مغربي')}</option>
          <option value="موريتاني">🇲🇷 ${tr('Mauritanian', 'موريتاني')}</option>
          <option value="صومالي">🇸🇴 ${tr('Somali', 'صومالي')}</option>
          <option value="جيبوتي">🇩🇯 ${tr('Djiboutian', 'جيبوتي')}</option>
          <option value="جزر القمر">🇰🇲 ${tr('Comoran', 'جزر القمر')}</option>
          <option value="تركي">🇹🇷 ${tr('Turkish', 'تركي')}</option>
          <option value="إيراني">🇮🇷 ${tr('Iranian', 'إيراني')}</option>
          <option value="أفغاني">🇦🇫 ${tr('Afghan', 'أفغاني')}</option>
          <option value="باكستاني">🇵🇰 ${tr('Pakistani', 'باكستاني')}</option>
          <option value="هندي">🇮🇳 ${tr('Indian', 'هندي')}</option>
          <option value="بنغلاديشي">🇧🇩 ${tr('Bangladeshi', 'بنغلاديشي')}</option>
          <option value="سريلانكي">🇱🇰 ${tr('Sri Lankan', 'سريلانكي')}</option>
          <option value="نيبالي">🇳🇵 ${tr('Nepali', 'نيبالي')}</option>
          <option value="فلبيني">🇵🇭 ${tr('Filipino', 'فلبيني')}</option>
          <option value="إندونيسي">🇮🇩 ${tr('Indonesian', 'إندونيسي')}</option>
          <option value="ماليزي">🇲🇾 ${tr('Malaysian', 'ماليزي')}</option>
          <option value="تايلاندي">🇹🇭 ${tr('Thai', 'تايلاندي')}</option>
          <option value="فيتنامي">🇻🇳 ${tr('Vietnamese', 'فيتنامي')}</option>
          <option value="ميانماري">🇲🇲 ${tr('Myanmar', 'ميانماري')}</option>
          <option value="صيني">🇨🇳 ${tr('Chinese', 'صيني')}</option>
          <option value="ياباني">🇯🇵 ${tr('Japanese', 'ياباني')}</option>
          <option value="كوري">🇰🇷 ${tr('Korean', 'كوري')}</option>
          <option value="أمريكي">🇺🇸 ${tr('American', 'أمريكي')}</option>
          <option value="كندي">🇨🇦 ${tr('Canadian', 'كندي')}</option>
          <option value="مكسيكي">🇲🇽 ${tr('Mexican', 'مكسيكي')}</option>
          <option value="برازيلي">🇧🇷 ${tr('Brazilian', 'برازيلي')}</option>
          <option value="أرجنتيني">🇦🇷 ${tr('Argentine', 'أرجنتيني')}</option>
          <option value="كولومبي">🇨🇴 ${tr('Colombian', 'كولومبي')}</option>
          <option value="بريطاني">🇬🇧 ${tr('British', 'بريطاني')}</option>
          <option value="فرنسي">🇫🇷 ${tr('French', 'فرنسي')}</option>
          <option value="ألماني">🇩🇪 ${tr('German', 'ألماني')}</option>
          <option value="إيطالي">🇮🇹 ${tr('Italian', 'إيطالي')}</option>
          <option value="إسباني">🇪🇸 ${tr('Spanish', 'إسباني')}</option>
          <option value="برتغالي">🇵🇹 ${tr('Portuguese', 'برتغالي')}</option>
          <option value="هولندي">🇳🇱 ${tr('Dutch', 'هولندي')}</option>
          <option value="بلجيكي">🇧🇪 ${tr('Belgian', 'بلجيكي')}</option>
          <option value="سويسري">🇨🇭 ${tr('Swiss', 'سويسري')}</option>
          <option value="نمساوي">🇦🇹 ${tr('Austrian', 'نمساوي')}</option>
          <option value="سويدي">🇸🇪 ${tr('Swedish', 'سويدي')}</option>
          <option value="نرويجي">🇳🇴 ${tr('Norwegian', 'نرويجي')}</option>
          <option value="دانماركي">🇩🇰 ${tr('Danish', 'دانماركي')}</option>
          <option value="فنلندي">🇫🇮 ${tr('Finnish', 'فنلندي')}</option>
          <option value="بولندي">🇵🇱 ${tr('Polish', 'بولندي')}</option>
          <option value="روسي">🇷🇺 ${tr('Russian', 'روسي')}</option>
          <option value="أوكراني">🇺🇦 ${tr('Ukrainian', 'أوكراني')}</option>
          <option value="روماني">🇷🇴 ${tr('Romanian', 'روماني')}</option>
          <option value="يوناني">🇬🇷 ${tr('Greek', 'يوناني')}</option>
          <option value="أسترالي">🇦🇺 ${tr('Australian', 'أسترالي')}</option>
          <option value="نيوزيلندي">🇳🇿 ${tr('New Zealander', 'نيوزيلندي')}</option>
          <option value="جنوب أفريقي">🇿🇦 ${tr('South African', 'جنوب أفريقي')}</option>
          <option value="نيجيري">🇳🇬 ${tr('Nigerian', 'نيجيري')}</option>
          <option value="كيني">🇰🇪 ${tr('Kenyan', 'كيني')}</option>
          <option value="إثيوبي">🇪🇹 ${tr('Ethiopian', 'إثيوبي')}</option>
          <option value="أوغندي">🇺🇬 ${tr('Ugandan', 'أوغندي')}</option>
          <option value="تانزاني">🇹🇿 ${tr('Tanzanian', 'تانزاني')}</option>
          <option value="غاني">🇬🇭 ${tr('Ghanaian', 'غاني')}</option>
          <option value="سنغالي">🇸🇳 ${tr('Senegalese', 'سنغالي')}</option>
          <option value="كاميروني">🇨🇲 ${tr('Cameroonian', 'كاميروني')}</option>
          <option value="تشادي">🇹🇩 ${tr('Chadian', 'تشادي')}</option>
          <option value="مالي">🇲🇱 ${tr('Malian', 'مالي')}</option>
          <option value="إريتري">🇪🇷 ${tr('Eritrean', 'إريتري')}</option>
          <option value="أذربيجاني">🇦🇿 ${tr('Azerbaijani', 'أذربيجاني')}</option>
          <option value="أوزبكي">🇺🇿 ${tr('Uzbek', 'أوزبكي')}</option>
          <option value="كازاخي">🇰🇿 ${tr('Kazakh', 'كازاخي')}</option>
          <option value="تركمانستاني">🇹🇲 ${tr('Turkmen', 'تركمانستاني')}</option>
          <option value="قرغيزي">🇰🇬 ${tr('Kyrgyz', 'قرغيزي')}</option>
          <option value="طاجيكي">🇹🇯 ${tr('Tajik', 'طاجيكي')}</option>
          <option value="أخرى">🌍 ${tr('Other', 'أخرى')}</option>
        </select></div>
        <div class="form-group mb-12"><label>${tr('Gender', 'الجنس')}</label><select class="form-input" id="rGender">
          <option value="ذكر">👨 ${tr('Male', 'ذكر')}</option>
          <option value="أنثى">👩 ${tr('Female', 'أنثى')}</option>
        </select></div>
        <div class="flex gap-16 mb-12" style="flex-wrap:wrap">
          <div class="form-group" style="flex:3;min-width:220px"><label>${tr('DOB (Gregorian)', 'تاريخ الميلاد (ميلادي)')}</label>
            <div class="flex gap-4">
              <select class="form-input" id="rGregDay" style="flex:0.8"><option value="">${tr('Day', 'يوم')}</option>${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select>
              <select class="form-input" id="rGregMonth" style="flex:1.5"><option value="">${tr('Month', 'شهر')}</option>
                <option value="1">${tr('January', 'يناير')}</option><option value="2">${tr('February', 'فبراير')}</option><option value="3">${tr('March', 'مارس')}</option>
                <option value="4">${tr('April', 'أبريل')}</option><option value="5">${tr('May', 'مايو')}</option><option value="6">${tr('June', 'يونيو')}</option>
                <option value="7">${tr('July', 'يوليو')}</option><option value="8">${tr('August', 'أغسطس')}</option><option value="9">${tr('September', 'سبتمبر')}</option>
                <option value="10">${tr('October', 'أكتوبر')}</option><option value="11">${tr('November', 'نوفمبر')}</option><option value="12">${tr('December', 'ديسمبر')}</option>
              </select>
              <select class="form-input" id="rGregYear" style="flex:1"><option value="">${tr('Year', 'سنة')}</option>${Array.from({ length: 97 }, (_, i) => `<option value="${2026 - i}">${2026 - i}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-group" style="flex:3;min-width:220px"><label>${tr('DOB (Hijri)', 'تاريخ الميلاد (هجري)')}</label>
            <div class="flex gap-4">
              <select class="form-input" id="rHijriDay" style="flex:0.8"><option value="">${tr('Day', 'يوم')}</option>${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select>
              <select class="form-input" id="rHijriMonth" style="flex:1.5"><option value="">${tr('Month', 'شهر')}</option>
                <option value="1">محرم</option><option value="2">صفر</option><option value="3">ربيع الأول</option><option value="4">ربيع الثاني</option>
                <option value="5">جمادى الأولى</option><option value="6">جمادى الثانية</option><option value="7">رجب</option><option value="8">شعبان</option>
                <option value="9">رمضان</option><option value="10">شوال</option><option value="11">ذو القعدة</option><option value="12">ذو الحجة</option>
              </select>
              <select class="form-input" id="rHijriYear" style="flex:1"><option value="">${tr('Year', 'سنة')}</option>${Array.from({ length: 101 }, (_, i) => `<option value="${1350 + i}">${1350 + i}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-group" style="flex:1;min-width:70px"><label>${tr('Age', 'العمر')}</label><input class="form-input form-input-readonly" id="rAge" readonly></div>
        </div>

        <div style="background:var(--hover);padding:12px;border-radius:8px;margin-bottom:12px">
          <h4 style="margin:0 0 8px;font-size:13px;color:var(--accent)">🏥 ${tr('Medical Information', 'المعلومات الطبية')}</h4>
          <div class="flex gap-8 mb-8" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:120px"><label>${tr('Blood Type', 'فصيلة الدم')}</label>
              <select class="form-input" id="rBloodType">
                <option value="">--</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div class="form-group" style="flex:2;min-width:200px"><label>⚠️ ${tr('Allergies', 'الحساسية')}</label><input class="form-input" id="rAllergies" placeholder="${tr('Drug allergies, food allergies...', 'حساسية أدوية، طعام...')}"></div>
            <div class="form-group" style="flex:2;min-width:200px"><label>🩺 ${tr('Chronic Diseases', 'الأمراض المزمنة')}</label><input class="form-input" id="rChronicDiseases" placeholder="${tr('Diabetes, Hypertension, Asthma...', 'سكري، ضغط، ربو...')}"></div>
          </div>
          <div class="flex gap-8 mb-8" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:150px"><label>🆘 ${tr('Emergency Contact Name', 'اسم جهة الطوارئ')}</label><input class="form-input" id="rEmergencyName"></div>
            <div class="form-group" style="flex:1;min-width:120px"><label>📞 ${tr('Emergency Phone', 'هاتف الطوارئ')}</label><input class="form-input" id="rEmergencyPhone" type="tel"></div>
            <div class="form-group" style="flex:2;min-width:200px"><label>📍 ${tr('Address', 'العنوان')}</label><input class="form-input" id="rAddress"></div>
          </div>
        </div>

        <div style="background:var(--hover);padding:12px;border-radius:8px;margin-bottom:12px">
          <h4 style="margin:0 0 8px;font-size:13px;color:var(--accent)">🏢 ${tr('Insurance Information', 'معلومات التأمين')}</h4>
          <div class="flex gap-8" style="flex-wrap:wrap">
            <div class="form-group" style="flex:2;min-width:180px"><label>${tr('Insurance Company', 'شركة التأمين')}</label><input class="form-input" id="rInsuranceCompany" placeholder="${tr('e.g. Bupa, Tawuniya, MedGulf...', 'مثال: بوبا، التعاونية...')}"></div>
            <div class="form-group" style="flex:1;min-width:140px"><label>${tr('Policy Number', 'رقم البوليصة')}</label><input class="form-input" id="rInsurancePolicyNo"></div>
            <div class="form-group" style="flex:1;min-width:120px"><label>${tr('Class', 'الفئة')}</label>
              <select class="form-input" id="rInsuranceClass">
                <option value="">--</option>
                <option value="VIP">VIP</option>
                <option value="A">A (Gold)</option>
                <option value="B">B (Silver)</option>
                <option value="C">C (Bronze)</option>
              </select>
            </div>
          </div>
        </div>

        <button class="btn btn-primary w-full" id="rSaveBtn" style="height:44px;font-size:15px">💾 ${tr('Save & Generate File', 'حفظ وإنشاء ملف')}</button>
      </div>
    </div>
    <div class="card mt-16">
      <div class="card-title">📋 ${tr('Patient Queue', 'قائمة المرضى')}</div>
      <input class="search-filter" id="rSearch" placeholder="${tr('Search by name, ID, phone, file#...', 'بحث بالاسم، الهوية، الجوال، رقم الملف...')}">
      <div id="rTable"></div>
    </div>
    <div class="card mt-16" id="pendingPaymentCard">
      <div class="card-title">💳 ${tr('Pending Payment Orders (Lab / Radiology)', 'طلبات فحوصات بانتظار السداد (مختبر / أشعة)')}</div>
      <div id="pendingPaymentTable"></div>
    </div>
    <div id="editPatientModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center">
      <div style="background:#fff;padding:30px;border-radius:16px;width:550px;max-width:90%;max-height:85vh;overflow-y:auto;direction:rtl">
        <h3 style="margin-bottom:16px">✏️ ${tr('Edit Patient', 'تعديل بيانات المريض')}</h3>
        <input type="hidden" id="editPId">
        <div class="form-grid" style="gap:12px">
          <div><label>${tr('Name (Arabic)', 'الاسم بالعربية')}</label><input id="editPNameAr" class="form-control"></div>
          <div><label>${tr('Name (English)', 'الاسم بالإنجليزية')}</label><input id="editPNameEn" class="form-control"></div>
          <div><label>${tr('National ID', 'رقم الهوية')}</label><input id="editPNatId" class="form-control"></div>
          <div><label>${tr('Phone', 'الجوال')}</label><input id="editPPhone" class="form-control"></div>
          <div><label>${tr('Nationality', 'الجنسية')}</label><input id="editPNationality" class="form-control"></div>
          <div><label>${tr('DOB', 'تاريخ الميلاد')}</label><input id="editPDob" type="date" class="form-control"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary" onclick="saveEditPatient()" style="flex:1">💾 ${tr('Save', 'حفظ')}</button>
          <button class="btn" onclick="document.getElementById('editPatientModal').style.display='none'" style="flex:1">❌ ${tr('Cancel', 'إلغاء')}</button>
        </div>
      </div>
    </div>
    <div id="newInvoiceModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center">
      <div style="background:#fff;padding:30px;border-radius:16px;width:450px;max-width:90%;direction:rtl">
        <h3 style="margin-bottom:16px">🧾 ${tr('New Service Invoice', 'فاتورة خدمة جديدة')}</h3>
        <input type="hidden" id="invPId">
        <input type="hidden" id="invPName">
        <p id="invPLabel" style="font-weight:700;margin-bottom:12px"></p>
        <div class="form-grid" style="gap:12px">
          <div><label>${tr('Service Type', 'نوع الخدمة')}</label><select id="invServiceType" class="form-control" onchange="var v=this.value==='\u0643\u0634\u0641';document.getElementById('invDeptRow').style.display=v?'block':'none';document.getElementById('invDoctorRow').style.display=v?'block':'none'">
            <option value="كشف">🩺 ${tr('Consultation', 'كشف')}</option>
            <option value="مختبر">🧪 ${tr('Laboratory', 'مختبر')}</option>
            <option value="أشعة">📷 ${tr('Radiology', 'أشعة')}</option>
            <option value="إجراء">🏥 ${tr('Procedure', 'إجراء')}</option>
            <option value="أدوية">💊 ${tr('Medications', 'أدوية')}</option>
            <option value="عملية">🩸 ${tr('Surgery', 'عملية')}</option>
            <option value="تمريض">👩‍⚕️ ${tr('Nursing', 'تمريض')}</option>
            <option value="أخرى">📋 ${tr('Other', 'أخرى')}</option>
          </select></div>
          <div id="invDeptRow"><label>${tr('Department', 'القسم')}</label><select id="invDept" class="form-control">
            ${depts.map((d, i) => `<option value="${isArabic ? d : deptsEn[i]}">${isArabic ? d : deptsEn[i]}</option>`).join('')}
          </select></div>
          <div id="invDoctorRow"><label>${tr('Doctor', 'الطبيب')}</label><select id="invDoctor" class="form-control">
            <option value="">${tr('Select Doctor', 'اختر الطبيب')}</option>
            ${(doctors || []).map(d => `<option value="${d.name}">${d.name}</option>`).join('')}
          </select></div>
          <div><label>${tr('Description', 'الوصف')}</label><input id="invDescription" class="form-control" placeholder="${tr('Service details', 'تفاصيل الخدمة')}"></div>
          <div><label>${tr('Amount (SAR)', 'المبلغ (ر.س)')}</label><input id="invAmount" type="number" step="0.01" class="form-control" placeholder="0.00"></div>
          <div class="flex gap-8" style="flex-wrap:wrap">
            <div style="flex:1"><label>🏷️ ${tr('Discount (SAR)', 'الخصم (ر.س)')}</label><input id="invDiscount" type="number" step="0.01" class="form-control" placeholder="0" value="0"></div>
            <div style="flex:2"><label>${tr('Discount Reason', 'سبب الخصم')}</label><input id="invDiscountReason" class="form-control" placeholder="${tr('e.g. Staff, Insurance, Coupon...', 'مثال: موظف، تأمين، كوبون...')}"></div>
          </div>
          <div><label>${tr('Payment Method', 'طريقة السداد')}</label><select id="invPayMethod" class="form-control">
            <option value="كاش">💵 ${tr('Cash', 'كاش')}</option>
            <option value="صرافة">💳 ${tr('Card/POS', 'صرافة')}</option>
            <option value="تحويل بنكي">🏦 ${tr('Bank Transfer', 'تحويل بنكي')}</option>
            <option value="تابي">🔵 ${tr('Tabby', 'تابي')}</option>
            <option value="تمارا">🟣 ${tr('Tamara', 'تمارا')}</option>
          </select></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary" onclick="confirmNewInvoice()" style="flex:1">✅ ${tr('Create Invoice', 'إنشاء فاتورة')}</button>
          <button class="btn" onclick="document.getElementById('newInvoiceModal').style.display='none'" style="flex:1">❌ ${tr('Cancel', 'إلغاء')}</button>
        </div>
      </div>
    </div>`;

  renderPatientTable(patients);
  loadPendingPaymentOrders();

  // Arabic to English transliteration (improved)
  const commonNames = {
    'محمد': 'Mohammed', 'أحمد': 'Ahmed', 'علي': 'Ali', 'عبدالله': 'Abdullah', 'عبد الله': 'Abdullah',
    'عبدالرحمن': 'Abdulrahman', 'عبد الرحمن': 'Abdulrahman', 'عبدالعزيز': 'Abdulaziz', 'عبد العزيز': 'Abdulaziz',
    'عبدالملك': 'Abdulmalik', 'عبد الملك': 'Abdulmalik', 'عبدالرحيم': 'Abdulrahim', 'عبد الرحيم': 'Abdulrahim',
    'فهد': 'Fahad', 'سعود': 'Saud', 'خالد': 'Khalid', 'سلطان': 'Sultan', 'تركي': 'Turki',
    'سعد': 'Saad', 'نايف': 'Naif', 'بندر': 'Bandar', 'فيصل': 'Faisal', 'سلمان': 'Salman',
    'ناصر': 'Nasser', 'صالح': 'Saleh', 'يوسف': 'Yousef', 'إبراهيم': 'Ibrahim', 'ابراهيم': 'Ibrahim',
    'حسن': 'Hassan', 'حسين': 'Hussein', 'عمر': 'Omar', 'عثمان': 'Othman', 'طلال': 'Talal',
    'ماجد': 'Majed', 'وليد': 'Waleed', 'مشعل': 'Mishal', 'منصور': 'Mansour', 'سارة': 'Sarah',
    'نورة': 'Noura', 'فاطمة': 'Fatimah', 'عائشة': 'Aisha', 'مريم': 'Mariam', 'هند': 'Hind',
    'لطيفة': 'Latifah', 'منيرة': 'Munirah', 'هيا': 'Haya', 'لمياء': 'Lamia', 'ريم': 'Reem',
    'دانة': 'Dana', 'لين': 'Leen', 'جواهر': 'Jawaher', 'بدور': 'Badoor', 'العنزي': 'Al-Anzi',
    'الشمري': 'Al-Shammari', 'الحربي': 'Al-Harbi', 'القحطاني': 'Al-Qahtani', 'الغامدي': 'Al-Ghamdi',
    'الدوسري': 'Al-Dosari', 'المطيري': 'Al-Mutairi', 'الزهراني': 'Al-Zahrani', 'العتيبي': 'Al-Otaibi',
    'السبيعي': 'Al-Subaie', 'الرشيدي': 'Al-Rashidi', 'البلوي': 'Al-Balawi', 'الجهني': 'Al-Juhani',
    'السعدي': 'Al-Saadi', 'المالكي': 'Al-Malki'
  };
  const arToEn = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'dh',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'ah', 'ى': 'a',
    'ء': "'", 'ؤ': 'o', 'ئ': 'e', 'ّ': '', 'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ْ': '', 'ً': '', 'ٌ': '', 'ٍ': ''
  };
  document.getElementById('rNameAr').addEventListener('input', (e) => {
    const words = e.target.value.trim().split(/\s+/);
    const result = words.map(word => {
      // Check common names first
      if (commonNames[word]) return commonNames[word];
      // Handle ال prefix
      let prefix = '';
      let w = word;
      if (w.startsWith('ال') && w.length > 2) {
        prefix = 'Al-';
        w = w.substring(2);
      }
      let trans = '';
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (arToEn[ch] !== undefined) {
          trans += arToEn[ch];
        } else if (ch.match(/[a-zA-Z0-9]/)) {
          trans += ch;
        }
      }
      if (trans.length > 0) {
        trans = trans.charAt(0).toUpperCase() + trans.slice(1);
      }
      return prefix + trans;
    }).filter(w => w.length > 0).join(' ');
    document.getElementById('rNameEn').value = result;
  });

  // Date conversion helpers
  const gToH = (g) => {
    try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(g).replace(/هـ/g, '').trim(); } catch (e) { return ''; }
  };
  const hToG = (hY, hM, hD) => {
    // Proper Hijri to Gregorian conversion using tabular Islamic calendar
    const a = Math.floor((11 * hY + 3) / 30);
    const b = Math.floor(hY / 100);
    const c = Math.floor(hY - 100 * b);
    const d = Math.floor(b / 4);
    const e1 = Math.floor((8 * (b + 1)) / 25) - 1;
    // Calculate Julian Day Number from Hijri date
    const jd = Math.floor(29.5001 * (hM - 1 + 12 * (hY - 1))) + hD + 1948439.5 - Math.floor((3 * (Math.floor((hY - 1) / 100) + 1)) / 4) + Math.floor((hY - 1) / 100) - Math.floor((hY - 1) / 400);
    // Simpler and more reliable method: iterate from a known epoch
    // Hijri epoch: July 16, 622 CE (Julian) = July 19, 622 CE (Gregorian)
    const hijriEpoch = 1948439.5; // Julian Day for 1/1/1 Hijri
    const monthDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    // Leap year adds 1 day to month 12
    const isLeapYear = (y) => (11 * y + 14) % 30 < 11;
    let totalDays = 0;
    for (let y = 1; y < hY; y++) {
      totalDays += isLeapYear(y) ? 355 : 354;
    }
    for (let m = 1; m < hM; m++) {
      totalDays += monthDays[m - 1];
    }
    if (hM === 12 && isLeapYear(hY)) totalDays += 0; // already counted
    totalDays += hD - 1;
    // Hijri epoch in JavaScript Date: July 19, 622 CE
    const epochMs = new Date(622, 6, 19).getTime();
    const gDate = new Date(epochMs + totalDays * 86400000);
    // Fix JS Date quirk for years < 100
    if (gDate.getFullYear() < 100) gDate.setFullYear(gDate.getFullYear());
    const age = Math.abs(new Date(Date.now() - gDate.getTime()).getUTCFullYear() - 1970);
    const y = gDate.getFullYear();
    const m = String(gDate.getMonth() + 1).padStart(2, '0');
    const day = String(gDate.getDate()).padStart(2, '0');
    return { gDate: `${y}-${m}-${day}`, age };
  };

  // Gregorian dropdowns -> convert to Hijri
  const gregChange = () => {
    const gY = parseInt(document.getElementById('rGregYear').value);
    const gM = parseInt(document.getElementById('rGregMonth').value);
    const gD = parseInt(document.getElementById('rGregDay').value);
    if (!gY || !gM || !gD) return;
    const dob = new Date(gY, gM - 1, gD);
    const diff = Date.now() - dob.getTime();
    document.getElementById('rAge').value = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    const hStr = gToH(dob);
    if (hStr) {
      const parts = hStr.replace(/[^0-9/]/g, '').split('/');
      if (parts.length === 3) {
        document.getElementById('rHijriDay').value = parseInt(parts[0]);
        document.getElementById('rHijriMonth').value = parseInt(parts[1]);
        document.getElementById('rHijriYear').value = parseInt(parts[2]);
      }
    }
  };
  document.getElementById('rGregYear').addEventListener('change', gregChange);
  document.getElementById('rGregMonth').addEventListener('change', gregChange);
  document.getElementById('rGregDay').addEventListener('change', gregChange);

  // Hijri dropdowns -> convert to Gregorian
  const hijriChange = () => {
    const hY = parseInt(document.getElementById('rHijriYear').value);
    const hM = parseInt(document.getElementById('rHijriMonth').value);
    const hD = parseInt(document.getElementById('rHijriDay').value);
    if (!hY || !hM || !hD) return;
    const res = hToG(hY, hM, hD);
    // Populate Gregorian dropdowns
    const gd = new Date(res.gDate);
    document.getElementById('rGregDay').value = gd.getDate();
    document.getElementById('rGregMonth').value = gd.getMonth() + 1;
    document.getElementById('rGregYear').value = gd.getFullYear();
    document.getElementById('rAge').value = res.age;
  };
  document.getElementById('rHijriYear').addEventListener('change', hijriChange);
  document.getElementById('rHijriMonth').addEventListener('change', hijriChange);
  document.getElementById('rHijriDay').addEventListener('change', hijriChange);

  document.getElementById('rSaveBtn').addEventListener('click', async () => {
    const nameAr = document.getElementById('rNameAr').value.trim();
    const nameEn = document.getElementById('rNameEn').value.trim();
    if (!nameAr && !nameEn) { showToast(tr('Enter patient name', 'ادخل اسم المريض'), 'error'); return; }
    try {
      await API.post('/api/patients', {
        name_ar: nameAr, name_en: nameEn,
        national_id: document.getElementById('rNatId').value,
        nationality: document.getElementById('rNationality').value,
        gender: document.getElementById('rGender').value,
        phone: document.getElementById('rPhone').value,
        blood_type: document.getElementById('rBloodType').value,
        allergies: document.getElementById('rAllergies').value,
        chronic_diseases: document.getElementById('rChronicDiseases').value,
        emergency_contact_name: document.getElementById('rEmergencyName').value,
        emergency_contact_phone: document.getElementById('rEmergencyPhone').value,
        address: document.getElementById('rAddress').value,
        insurance_company: document.getElementById('rInsuranceCompany').value,
        insurance_policy_number: document.getElementById('rInsurancePolicyNo').value,
        insurance_class: document.getElementById('rInsuranceClass').value,
        dob: (document.getElementById('rGregYear').value && document.getElementById('rGregMonth').value && document.getElementById('rGregDay').value) ? `${document.getElementById('rGregYear').value}-${String(document.getElementById('rGregMonth').value).padStart(2, '0')}-${String(document.getElementById('rGregDay').value).padStart(2, '0')}` : '',
        dob_hijri: (document.getElementById('rHijriYear').value && document.getElementById('rHijriMonth').value && document.getElementById('rHijriDay').value) ? `${document.getElementById('rHijriYear').value}/${String(document.getElementById('rHijriMonth').value).padStart(2, '0')}/${String(document.getElementById('rHijriDay').value).padStart(2, '0')}` : ''
      });
      showToast(tr('Patient saved!', 'تم حفظ المريض!'));
      await navigateTo(1);
    } catch (e) { showToast(tr('Error saving patient', 'خطأ في حفظ المريض'), 'error'); }
  });

  document.getElementById('rSearch').addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('#rTable tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(txt) ? '' : 'none';
    });
  });
}

function renderPatientTable(patients) {
  const headers = [tr('MRN/File#', 'رقم الملف'), tr('Name', 'الاسم'), tr('ID', 'الهوية'), tr('Phone', 'الجوال'), tr('Blood', 'فصيلة'), tr('Insurance', 'التأمين'), tr('Date/Time', 'التاريخ/الوقت'), tr('Status', 'الحالة'), tr('Actions', 'إجراءات')];
  const rows = patients.map(p => ({
    cells: [
      p.mrn || p.file_number,
      `${p.gender === 'ذكر' ? '👨' : '👩'} ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}${p.allergies ? ' <span style="color:#ef4444;font-weight:700" title="' + p.allergies + '">⚠️</span>' : ''}`,
      p.national_id,
      p.phone,
      p.blood_type ? `<span class="badge" style="background:#dc2626;color:#fff;font-size:10px">${p.blood_type}</span>` : '-',
      p.insurance_company ? `<span style="font-size:11px">${p.insurance_company}${p.insurance_class ? ' (' + p.insurance_class + ')' : ''}</span>` : '-',
      p.created_at ? new Date(p.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '-',
      statusBadge(p.status)
    ],
    id: p.id, raw: p
  }));
  document.getElementById('rTable').innerHTML = makeTable(headers, rows, (row) =>
    `<button class="btn btn-sm" onclick="editPatient(${row.id})" title="${tr('Edit', 'تعديل')}">✏️</button> <button class="btn btn-sm btn-success" onclick="showNewInvoiceModal(${row.id},'${(row.raw.name_ar || row.raw.name_en || '').replace(/'/g, "\\'")}')" title="${tr('Invoice', 'فاتورة')}">🧾</button> <button class="btn btn-danger btn-sm" onclick="deletePatient(${row.id})" title="${tr('Delete', 'حذف')}">🗑</button>`
  );
}

window.deletePatient = async (id) => {
  if (!confirm(tr('Delete this patient and all records?', 'حذف هذا المريض وجميع سجلاته؟'))) return;
  try {
    await API.del(`/api/patients/${id}`);
    showToast(tr('Patient deleted', 'تم حذف المريض'));
    await navigateTo(1);
  } catch (e) { showToast(tr('Error deleting', 'خطأ في الحذف'), 'error'); }
};

window.editPatient = async function (id) {
  try {
    const patients = await API.get('/api/patients');
    const p = patients.find(x => x.id === id);
    if (!p) return showToast(tr('Patient not found', 'المريض غير موجود'), 'error');
    document.getElementById('editPId').value = id;
    document.getElementById('editPNameAr').value = p.name_ar || '';
    document.getElementById('editPNameEn').value = p.name_en || '';
    document.getElementById('editPNatId').value = p.national_id || '';
    document.getElementById('editPPhone').value = p.phone || '';
    document.getElementById('editPNationality').value = p.nationality || '';
    document.getElementById('editPDob').value = p.dob || '';
    document.getElementById('editPatientModal').style.display = 'flex';
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveEditPatient = async function () {
  const id = document.getElementById('editPId').value;
  try {
    await API.put('/api/patients/' + id, {
      name_ar: document.getElementById('editPNameAr').value,
      name_en: document.getElementById('editPNameEn').value,
      national_id: document.getElementById('editPNatId').value,
      phone: document.getElementById('editPPhone').value,
      nationality: document.getElementById('editPNationality').value,
      dob: document.getElementById('editPDob').value
    });
    document.getElementById('editPatientModal').style.display = 'none';
    showToast(tr('Patient updated!', 'تم تحديث بيانات المريض!'));
    await navigateTo(1);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.showNewInvoiceModal = function (id, name) {
  document.getElementById('invPId').value = id;
  document.getElementById('invPName').value = name;
  document.getElementById('invPLabel').textContent = name;
  document.getElementById('invDescription').value = '';
  document.getElementById('invAmount').value = '';
  if (document.getElementById('invDiscount')) document.getElementById('invDiscount').value = '0';
  if (document.getElementById('invDiscountReason')) document.getElementById('invDiscountReason').value = '';
  document.getElementById('newInvoiceModal').style.display = 'flex';
};
window.confirmNewInvoice = async function () {
  const id = document.getElementById('invPId').value;
  const name = document.getElementById('invPName').value;
  const amount = parseFloat(document.getElementById('invAmount').value);
  const serviceType = document.getElementById('invServiceType').value;
  const discount = parseFloat(document.getElementById('invDiscount')?.value) || 0;
  const discountReason = document.getElementById('invDiscountReason')?.value || '';
  if (!amount || amount <= 0) return showToast(tr('Enter amount', 'ادخل المبلغ'), 'error');
  if (discount > amount) return showToast(tr('Discount cannot exceed amount', 'الخصم لا يمكن أن يتجاوز المبلغ'), 'error');
  try {
    let desc = document.getElementById('invDescription').value;
    if (serviceType === 'كشف') {
      const dept = document.getElementById('invDept').value;
      const doctor = document.getElementById('invDoctor').value;
      const parts = [dept, doctor, desc].filter(x => x);
      desc = parts.join(' - ');
      await API.put('/api/patients/' + id, { department: dept });
    }
    const finalAmount = amount - discount;
    await API.post('/api/invoices', {
      patient_id: id, patient_name: name,
      total: finalAmount,
      description: desc + (discount > 0 ? ' (خصم: ' + discount + ' SAR' + (discountReason ? ' - ' + discountReason : '') + ')' : ''),
      service_type: serviceType,
      payment_method: document.getElementById('invPayMethod').value,
      discount: discount,
      discount_reason: discountReason
    });
    document.getElementById('newInvoiceModal').style.display = 'none';
    showToast(tr('Invoice created!', 'تم إنشاء الفاتورة!') + (discount > 0 ? ' (' + tr('Discount', 'خصم') + ': ' + discount + ')' : ''));
    await navigateTo(1);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== APPOINTMENTS =====
async function renderAppointments(el) {
  const [appts, emps] = await Promise.all([API.get('/api/appointments'), API.get('/api/employees?role=Doctor')]);
  const patients = await API.get('/api/patients');
  el.innerHTML = `
    <div class="page-title">📅 ${tr('Appointments', 'المواعيد')}</div>
    <div class="split-layout">
      <div class="card">
        <div class="card-title">📝 ${tr('Book Appointment', 'حجز موعد')}</div>
        <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><select class="form-input" id="aPatient"><option value="">${tr('Select patient', 'اختر مريض')}</option>${patients.map(p => `<option value="${p.name_en}" data-pid="${p.id}">${isArabic ? p.name_ar : p.name_en} (#${p.file_number})</option>`).join('')}</select></div>
        <div class="form-group mb-12"><label>${tr('Doctor', 'الطبيب')}</label><select class="form-input" id="aDoctor"><option value="">${tr('Select doctor', 'اختر طبيب')}</option>${emps.map(d => `<option>${d.name}</option>`).join('')}</select></div>
        <div class="form-group mb-12"><label>${tr('Date', 'التاريخ')}</label><input class="form-input" type="date" id="aDate" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group mb-12"><label>${tr('Time', 'الوقت')}</label><input class="form-input" type="time" id="aTime" value="${new Date().toTimeString().slice(0, 5)}"></div>
        <div class="form-group mb-12"><label>${tr('Notes', 'ملاحظات')}</label><input class="form-input" id="aNotes"></div>
        <div class="form-group mb-16"><label>${tr('Appointment Fee', 'رسوم الموعد')}</label><input class="form-input" id="aFee" type="number" value="0" placeholder="0.00"></div>
        <button class="btn btn-primary w-full" onclick="bookAppt()" style="height:44px">📅 ${tr('Book', 'حجز')}</button>
      </div>
      <div class="card">
        <div class="card-title">📋 ${tr('Appointments List', 'قائمة المواعيد')}</div>
        <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'aTable')">
        <div id="aTable">${makeTable(
    [tr('Patient', 'المريض'), tr('Doctor', 'الطبيب'), tr('Dept', 'القسم'), tr('Date', 'التاريخ'), tr('Time', 'الوقت'), tr('Status', 'الحالة'), tr('Delete', 'حذف')],
    appts.map(a => ({ cells: [a.patient_name, a.doctor_name, a.department, a.appt_date, a.appt_time, statusBadge(a.status)], id: a.id })),
    (row) => `<button class="btn btn-sm" onclick="checkInPatient(${row.id})" title="${tr('Check-in', 'تسجيل وصول')}" style="background:#e8f5e9;color:#2e7d32;margin:0 2px">✅</button><button class="btn btn-sm" onclick="markNoShow(${row.id})" title="${tr('No-Show', 'متغيب')}" style="background:#fff3e0;color:#e65100;margin:0 2px">⚠️</button><button class="btn btn-danger btn-sm" onclick="delAppt(${row.id})" style="margin:0 2px">🗑</button>`
  )}</div>
      </div>
    </div>`;
}
window.bookAppt = async () => {
  const pSelect = document.getElementById('aPatient');
  const pName = pSelect.value;
  const pId = pSelect.options[pSelect.selectedIndex]?.dataset?.pid || '';
  if (!pName) { showToast(tr('Select patient', 'اختر مريض'), 'error'); return; }
  try {
    await API.post('/api/appointments', { patient_name: pName, patient_id: pId, doctor_name: document.getElementById('aDoctor').value, department: '', appt_date: document.getElementById('aDate').value, appt_time: document.getElementById('aTime').value, notes: document.getElementById('aNotes').value, fee: parseFloat(document.getElementById('aFee').value) || 0 });
    showToast(tr('Appointment booked!', 'تم حجز الموعد!'));
    await navigateTo(2);
  } catch (e) { showToast(tr('Error booking', 'خطأ في الحجز'), 'error'); }
};
window.delAppt = async (id) => {
  if (!confirm(tr('Delete this appointment?', 'حذف هذا الموعد؟'))) return;
  try { await API.del(`/api/appointments/${id}`); showToast(tr('Deleted', 'تم الحذف')); await navigateTo(2); }
  catch (e) { showToast(tr('Error deleting', 'خطأ في الحذف'), 'error'); }
};
window.filterTable = (input, tableId) => {
  const txt = input.value.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(r => r.style.display = r.textContent.toLowerCase().includes(txt) ? '' : 'none');
};

// ===== DOCTOR STATION =====
async function renderDoctor(el) {
  const patients = await API.get('/api/patients');
  const records = await API.get('/api/medical/records');
  const drugs = await API.get('/api/pharmacy/drugs');
  const allServices = await API.get('/api/medical/services');
  // Get current user specialty
  const currentUser = await API.get('/api/auth/me');
  const drSpecialty = (currentUser.user && currentUser.user.speciality) || '';
  const filteredServices = drSpecialty ? allServices.filter(s => s.specialty === drSpecialty) : allServices;
  // Group services by category for display
  const svcCategories = {};
  filteredServices.forEach(s => { if (!svcCategories[s.category]) svcCategories[s.category] = []; svcCategories[s.category].push(s); });
  el.innerHTML = `
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px; color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
      <div>
        <h2 style="margin: 0 0 8px; font-size: 20px;">🚀 ${tr('Adaptive Doctor Station (v3.0)', 'محطة الطبيب التكيفية (الإصدار الثالث)')}</h2>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">${tr('A next-generation, glassmorphism UI featuring intelligent filtering, smart diagnoses, and digital consent.', 'واجهة زجاجية عصرية تدعم الفلترة الذكية للتشخيصات والتحاليل وإقرارات التوقيع الإلكتروني.')}</p>
      </div>
      <button onclick="window.launchAdaptiveUI()" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
        ${tr('Launch Adaptive UI', 'تشغيل المحطة التكيفية')}
      </button>
    </div>
    <div class="page-title">👨‍⚕️ ${tr('Doctor Station', 'محطة الطبيب')}</div>
    <div class="split-layout">
      <div>
        <div class="card mb-16">
          <div class="card-title">📝 ${tr('Select Patient', 'اختيار المريض')}</div>
          <select class="form-input w-full" id="drPatient" onchange="loadPatientInfo()">
            <option value="">${tr('-- Select --', '-- اختر مريض --')}</option>
            ${patients.map(p => `<option value="${p.id}">${p.file_number} - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)} (${statusText(p.status)})</option>`).join('')}
          </select>
          <div id="drPatientInfo" class="mt-16"></div>
        </div>
        <div class="card mb-16">
          <div class="card-title">🩺 ${tr('Diagnosis & Notes', 'التشخيص والملاحظات')}</div>
          <div class="form-group mb-8"><label>📋 ${tr('Quick Diagnosis Template', 'قالب تشخيص سريع')}</label>
            <div class="flex gap-8">
              <select class="form-input" id="drDiagTemplate" style="flex:1" onchange="applyDiagTemplate()">
                <option value="">${tr('-- Select Template --', '-- اختر قالب --')}</option>
              </select>
              <button class="btn btn-sm" onclick="loadDiagTemplates()" style="white-space:nowrap">📥 ${tr('Load', 'تحميل')}</button>
            </div>
          </div>
          <div class="form-group mb-12"><label>${tr('Diagnosis', 'التشخيص')}</label><input class="form-input" id="drDiag"></div>
          <div class="form-group mb-12"><label>${tr('Symptoms', 'الأعراض')}</label><input class="form-input" id="drSymp"></div>
          <div class="form-group mb-12"><label>${tr('ICD-10', 'رمز التشخيص')}</label><input class="form-input" id="drIcd"></div>
          <div class="form-group mb-16"><label>${tr('Notes', 'ملاحظات')}</label><textarea class="form-input form-textarea" id="drNotes"></textarea></div>
          <button class="btn btn-primary w-full" onclick="saveMedRecord()" style="height:44px">💾 ${tr('Save Record', 'حفظ السجل')}</button>
        </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn btn-sm" onclick="showMedicalReportForm('sick_leave')" style="flex:1;background:#fff3e0;border:1px solid #ff9800;color:#e65100;min-width:120px">🏥 ${tr('Sick Leave', 'إجازة مرضية')}</button>
            <button class="btn btn-sm" onclick="showMedicalReportForm('medical_report')" style="flex:1;background:#e3f2fd;border:1px solid #1565c0;color:#1565c0;min-width:120px">📋 ${tr('Med Report', 'تقرير طبي')}</button>
            <button class="btn btn-sm" onclick="showMedicalReportForm('fitness')" style="flex:1;background:#e8f5e9;border:1px solid #2e7d32;color:#2e7d32;min-width:120px">✅ ${tr('Fitness', 'شهادة لياقة')}</button>
          </div>
        <div class="card mb-16">
          <div class="card-title">🏥 ${tr('Procedures / Services Performed', 'الإجراءات / الخدمات المنفذة')} ${drSpecialty ? `<span class="badge badge-info" style="font-size:11px;
margin-right:8px">${drSpecialty}</span>` : ''}</div>
          <div class="form-group mb-12"><label>${tr('Search Procedures', 'ابحث عن إجراء')}</label>
            <input class="form-input" id="drSvcSearch" placeholder="${tr('Type to search...', 'اكتب للبحث...')}" autocomplete="off" oninput="filterDrServices()">
            <div id="drSvcDropdown" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;display:none;margin-top:4px;background:var(--card)"></div>
          </div>
          <div id="drSvcTags" class="flex gap-8" style="flex-wrap:wrap;margin-bottom:12px"></div>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">${tr('Available categories', 'التصنيفات المتاحة')}: <strong>${Object.keys(svcCategories).join(', ') || tr('All', 'الكل')}</strong></div>
          <button class="btn btn-success w-full" onclick="billDrProcedures()" id="drBillBtn" style="height:40px;margin-top:8px">💵 ${tr('Bill Selected Procedures', 'فوتر الإجراءات المختارة')}</button>
          <input type="hidden" id="drSvcData" value='${JSON.stringify(filteredServices)}'>
        </div>
        <div class="card mb-16">
          <div class="form-group mb-12"><label>${tr('Test Type', 'نوع الفحص')}</label>
            <select class="form-input" id="drLabType">
              <optgroup label="${tr('Hematology', 'أمراض الدم')}">
                <option>CBC (Complete Blood Count)</option>
                <option>ESR (Erythrocyte Sedimentation Rate)</option>
                <option>Coagulation Profile (PT, PTT, INR)</option>
                <option>Blood Film / Reticulocyte Count</option>
                <option>Hemoglobin Electrophoresis</option>
                <option>G6PD Deficiency Test</option>
                <option>Sickle Cell Test</option>
                <option>Bleeding Time / Clotting Time</option>
                <option>D-Dimer</option>
              </optgroup>
              <optgroup label="${tr('Biochemistry', 'الكيمياء الحيوية')}">
                <option>Comprehensive Metabolic Panel (CMP)</option>
                <option>Basic Metabolic Panel (BMP)</option>
                <option>Fasting Blood Sugar (FBS)</option>
                <option>Random Blood Sugar (RBS)</option>
                <option>Oral Glucose Tolerance Test (OGTT)</option>
                <option>HbA1c (Glycated Hemoglobin)</option>
                <option>Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)</option>
                <option>Renal Profile (Urea, Creatinine, Electrolytes: Na, K, Cl)</option>
                <option>Liver Function Test (LFT: ALT, AST, ALP, Total/Direct Bilirubin, Albumin, Total Protein)</option>
                <option>Cardiac Enzymes (Troponin T/I, CK-MB, CK-Total, LDH)</option>
                <option>Uric Acid</option>
                <option>Calcium / Phosphorus / Magnesium</option>
                <option>Iron Profile (Serum Iron, TIBC, Ferritin, Transferrin)</option>
                <option>Vitamin D3 (25-OH Cholecalciferol)</option>
                <option>Vitamin B12 / Folate</option>
                <option>Amylase / Lipase</option>
                <option>Serum Osmolality</option>
              </optgroup>
              <optgroup label="${tr('Hormones & Endocrinology', 'الهرمونات والغدد')}">
                <option>Thyroid Profile (TSH, Free T3, Free T4, Total T3, Total T4)</option>
                <option>Fertility Hormones (FSH, LH, Prolactin, Testosterone (Free/Total), Estradiol E2, Progesterone)</option>
                <option>Beta-hCG (Pregnancy Test - Blood Qualitative/Quantitative)</option>
                <option>Cortisol (AM/PM)</option>
                <option>Insulin (Fasting/Random)</option>
                <option>Parathyroid Hormone (PTH)</option>
                <option>Growth Hormone (GH)</option>
                <option>ACTH</option>
                <option>C-Peptide</option>
                <option>Anti-Mullerian Hormone (AMH)</option>
                <option>Aldosterone / Renin</option>
                <option>DHEA-S (Dehydroepiandrosterone Sulfate)</option>
                <option>17-OH Progesterone</option>
                <option>Calcitonin</option>
              </optgroup>
              <optgroup label="${tr('Immunology & Serology', 'المناعة والأمصال')}">
                <option>CRP (C-Reactive Protein - Qualitative/Quantitative)</option>
                <option>Rheumatoid Factor (RF)</option>
                <option>Anti-CCP (Anti-Cyclic Citrullinated Peptide)</option>
                <option>ANA (Anti-Nuclear Antibody) / Anti-dsDNA</option>
                <option>ANCA (Anti-Neutrophil Cytoplasmic Antibody)</option>
                <option>Anti-Scl-70 / Anti-Centromere</option>
                <option>ASO Titer</option>
                <option>Hepatitis Profile (HBsAg, HBsAb, HCV Ab, HAV IgM/IgG)</option>
                <option>HIV 1 & 2 Abs/Ag</option>
                <option>VDRL / RPR (Syphilis)</option>
                <option>Widal Test (Typhoid)</option>
                <option>Brucella (Abortus/Melitensis)</option>
                <option>Dengue NS1 Ag / IgM / IgG</option>
                <option>Toxoplasmosis (IgG/IgM)</option>
                <option>Rubella (IgG/IgM)</option>
                <option>Cytomegalovirus CMV (IgG/IgM)</option>
                <option>Herpes Simplex Virus HSV 1/2 (IgG/IgM)</option>
                <option>EBV (Epstein-Barr Virus)</option>
                <option>Celiac Disease Panel (Anti-tTG, Anti-Endomysial)</option>
                <option>Food Allergy Panel (IgE)</option>
                <option>Inhalant Allergy Panel (IgE)</option>
                <option>Flow Cytometry (Immunophenotyping / CD4 Count)</option>
              </optgroup>
              <optgroup label="${tr('Microbiology & Parasitology', 'الأحياء الدقيقة والطفيليات')}">
                <option>Urine Analysis (Routine & Microscopic)</option>
                <option>Urine Culture & Sensitivity</option>
                <option>Stool Analysis (Routine & Microscopic)</option>
                <option>Stool Culture</option>
                <option>Stool Occult Blood</option>
                <option>H. Pylori (Ag in Stool / Ab in Blood)</option>
                <option>Throat Swab Culture</option>
                <option>Sputum Culture & AFB (Tuberculosis)</option>
                <option>Wound/Pus Swab Culture</option>
                <option>Blood Culture (Aerobic/Anaerobic)</option>
                <option>Ear/Eye/Nasal Swab Culture</option>
                <option>High Vaginal Swab (HVS) Culture</option>
                <option>Urethral Swab Culture</option>
                <option>Fungal Culture (Skin/Nail/Hair)</option>
                <option>Malaria Film</option>
                <option>QuantiFERON-TB Gold / TB Spot</option>
                <option>Chlamydia trachomatis (PCR/Ag)</option>
                <option>Neisseria Gonorrhoeae (PCR/Culture)</option>
                <option>CSF Analysis (Cell Count, Protein, Glucose)</option>
                <option>Synovial Fluid Analysis</option>
                <option>Semen Analysis (Spermogram)</option>
              </optgroup>
              <optgroup label="${tr('Tumor Markers', 'دلالات الأورام')}">
                <option>PSA (Prostate Specific Antigen - Total/Free)</option>
                <option>CEA (Carcinoembryonic Antigen)</option>
                <option>CA 125 (Ovarian)</option>
                <option>CA 15-3 (Breast)</option>
                <option>CA 19-9 (Pancreatic/GI)</option>
                <option>AFP (Alpha-Fetoprotein)</option>
                <option>Beta-2 Microglobulin</option>
                <option>Thyroglobulin</option>
              </optgroup>
              <optgroup label="${tr('Molecular Diagnostics / PCR', 'التشخيص الجزيئي / PCR')}">
                <option>COVID-19 PCR</option>
                <option>HCV RNA PCR (Quantitative)</option>
                <option>HBV DNA PCR (Quantitative)</option>
                <option>HIV RNA PCR (Quantitative)</option>
                <option>Respiratory Pathogen Panel (PCR)</option>
                <option>HPV DNA Typing</option>
              </optgroup>
              <optgroup label="${tr('Histopathology / Cytology', 'علم الأنسجة والخلايا')}">
                <option>Pap Smear</option>
                <option>Biopsy Specimen Examination</option>
                <option>FNAC (Fine Needle Aspiration Cytology)</option>
                <option>Fluid Cytology (Pleural, Ascitic, CSF)</option>
              </optgroup>
              <optgroup label="${tr('Blood Bank / Transfusion', 'بنك الدم / نقل الدم')}">
                <option>Blood Group (ABO) & Rh Typing</option>
                <option>Crossmatch (Major & Minor)</option>
                <option>Direct Coombs Test (DAT)</option>
                <option>Indirect Coombs Test (IAT)</option>
                <option>Antibody Screening Panel</option>
                <option>Cold Agglutinins</option>
              </optgroup>
              <optgroup label="${tr('Blood Gas & Electrolytes', 'غازات الدم والشوارد')}">
                <option>Arterial Blood Gas (ABG)</option>
                <option>Venous Blood Gas (VBG)</option>
                <option>Lactate (Lactic Acid)</option>
                <option>Ionized Calcium</option>
                <option>Methemoglobin / Carboxyhemoglobin</option>
              </optgroup>
              <optgroup label="${tr('Therapeutic Drug Monitoring', 'مراقبة مستوى الأدوية')}">
                <option>Digoxin Level</option>
                <option>Phenytoin (Dilantin) Level</option>
                <option>Valproic Acid Level</option>
                <option>Carbamazepine Level</option>
                <option>Lithium Level</option>
                <option>Vancomycin Level (Trough/Peak)</option>
                <option>Gentamicin / Amikacin Level</option>
                <option>Theophylline Level</option>
                <option>Methotrexate Level</option>
                <option>Tacrolimus / Cyclosporine Level</option>
              </optgroup>
              <optgroup label="${tr('Special Chemistry', 'كيمياء متخصصة')}">
                <option>Protein Electrophoresis (SPEP)</option>
                <option>Immunoglobulins (IgA, IgG, IgM, IgE)</option>
                <option>Complement C3 / C4</option>
                <option>Ammonia Level</option>
                <option>Homocysteine</option>
                <option>Ceruloplasmin / Copper</option>
                <option>Lactate Dehydrogenase (LDH)</option>
                <option>Haptoglobin</option>
                <option>Procalcitonin (PCT)</option>
                <option>BNP / NT-proBNP</option>
                <option>Fibrinogen</option>
                <option>Anti-Xa (Heparin) Assay</option>
                <option>Cystatin C</option>
                <option>Microalbumin (Urine)</option>
                <option>24hr Urine Protein / Creatinine Clearance</option>
                <option>Serum Free Light Chains (Kappa/Lambda)</option>
              </optgroup>
              <optgroup label="${tr('Toxicology & Trace Elements', 'السموم والعناصر الدقيقة')}">
                <option>Myoglobin</option>
                <option>Vitamin A (Retinol)</option>
                <option>Zinc Level</option>
                <option>Selenium Level</option>
                <option>Lead Level (Blood)</option>
                <option>Mercury Level (Blood)</option>
                <option>Urine Drug Screen (UDS)</option>
                <option>Serum Ethanol (Alcohol) Level</option>
                <option>Acetaminophen (Paracetamol) Level</option>
                <option>Salicylate (Aspirin) Level</option>
              </optgroup>
              <optgroup label="${tr('Other', 'أخرى')}">
                <option>${tr('Other Specific Test (Specify in details)', 'فحص آخر (حدد في التفاصيل)')}</option>
              </optgroup>
            </select>
          </div>
          <div class="form-group mb-12"><label>${tr('Details', 'التفاصيل')}</label><input class="form-input" id="drLabDesc"></div>
          <button class="btn btn-success w-full" onclick="sendToLab()">🔬 ${tr('Send to Lab', 'تحويل للمختبر')}</button>
        </div>
        <div class="card mb-16">
          <div class="card-title">📡 ${tr('Refer to Radiology', 'تحويل للأشعة')}</div>
          <div class="form-group mb-12"><label>${tr('Scan Type', 'نوع الأشعة')}</label>
            <select class="form-input" id="drRadType">
              <optgroup label="${tr('X-Ray', 'الأشعة السينية')}">
                <option>X-Ray Chest (PA/LAT)</option>
                <option>X-Ray Abdomen (Erect/Supine)</option>
                <option>X-Ray KUB (Kidney, Ureter, Bladder)</option>
                <option>X-Ray Cervical Spine (AP/LAT/Open Mouth)</option>
                <option>X-Ray Thoracic Spine</option>
                <option>X-Ray Lumbar Spine (AP/LAT)</option>
                <option>X-Ray Pelvis (AP)</option>
                <option>X-Ray Skull / Facial Bones / PNS</option>
                <option>X-Ray Shoulder / Clavicle</option>
                <option>X-Ray Arm (Humerus/Radius/Ulna)</option>
                <option>X-Ray Hand / Wrist</option>
                <option>X-Ray Hip/Femur</option>
                <option>X-Ray Knee (AP/LAT/Skyline)</option>
                <option>X-Ray Ankle / Foot</option>
                <option>X-Ray Bone Age</option>
              </optgroup>
              <optgroup label="${tr('Ultrasound', 'الموجات فوق الصوتية / السونار')}">
                <option>Ultrasound Abdomen (Whole)</option>
                <option>Ultrasound Pelvis (Transabdominal/Transvaginal)</option>
                <option>Ultrasound Abdomen & Pelvis</option>
                <option>Ultrasound KUB / Prostate</option>
                <option>Ultrasound Thyroid / Neck</option>
                <option>Ultrasound Breast</option>
                <option>Ultrasound Scrotum / Testicular</option>
                <option>Obstetric Ultrasound (1st Trimester/Viability)</option>
                <option>Obstetric Ultrasound (Anomaly Scan 2nd Trimester)</option>
                <option>Obstetric Ultrasound (Growth 3rd Trimester)</option>
                <option>Folliculometry (Ovulation Tracking)</option>
                <option>Ultrasound Soft Tissue / Swelling</option>
                <option>Doppler Ultrasound - Carotid</option>
                <option>Doppler Ultrasound - Lower Limb Venous (DVT)</option>
                <option>Doppler Ultrasound - Lower Limb Arterial</option>
                <option>Doppler Ultrasound - Renal Artery</option>
                <option>Doppler Ultrasound - Obstetrics / Umbilical Artery</option>
                <option>Echocardiogram (Echo - Heart)</option>
              </optgroup>
              <optgroup label="${tr('CT Scan', 'الأشعة المقطعية')}">
                <option>CT Brain / Head (Without Contrast)</option>
                <option>CT Brain / Head (With Contrast)</option>
                <option>CT PNS (Paranasal Sinuses)</option>
                <option>CT Neck (With Contrast)</option>
                <option>CT Chest (HRCT) Without Contrast</option>
                <option>CT Chest / Lungs (With Contrast)</option>
                <option>CT Abdomen & Pelvis (Without Contrast - Triphasic)</option>
                <option>CT Abdomen & Pelvis (With Contrast)</option>
                <option>CT KUB (Stone Protocol - Non Contrast)</option>
                <option>CT Urography (With Contrast)</option>
                <option>CT Cervical Spine</option>
                <option>CT Lumbar Spine</option>
                <option>CT Angiography - Pulmonary (CTPA)</option>
                <option>CT Angiography - Brain</option>
                <option>CT Angiography - Aorta / Lower Limbs</option>
                <option>CT Virtual Colonoscopy</option>
              </optgroup>
              <optgroup label="${tr('MRI', 'الرنين المغناطيسي')}">
                <option>MRI Brain (Without Contrast)</option>
                <option>MRI Brain (With Contrast)</option>
                <option>MRI Pituitary Fossa</option>
                <option>MRI Cervical Spine</option>
                <option>MRI Thoracic Spine</option>
                <option>MRI Lumbar Spine</option>
                <option>MRI Whole Spine</option>
                <option>MRI Pelvis (Male/Female)</option>
                <option>MRI Prostate (Multiparametric)</option>
                <option>MRI Shoulder Joint</option>
                <option>MRI Knee Joint</option>
                <option>MRI Ankle / Wrist Joint</option>
                <option>MRI Abdomen</option>
                <option>MRCP (Magnetic Resonance Cholangiopancreatography)</option>
                <option>MR Venography (MRV)</option>
                <option>MRA (Magnetic Resonance Angiography) - Brain</option>
              </optgroup>
              <optgroup label="${tr('Specialized Imaging & Scans', 'تصوير متخصص والمناظير')}">
                <option>Mammogram (Bilateral/Unilateral)</option>
                <option>DEXA Scan (Bone Density)</option>
                <option>Fluoroscopy - Barium Swallow</option>
                <option>Fluoroscopy - Barium Meal / Follow Through</option>
                <option>Fluoroscopy - Barium Enema</option>
                <option>Fluoroscopy - HSG (Hysterosalpingography)</option>
                <option>Fluoroscopy - IVP (Intravenous Pyelogram)</option>
                <option>Panoramic Dental X-Ray (OPG)</option>
                <option>Cephalometric X-Ray</option>
                <option>CBCT (Cone Beam CT for Dentistry)</option>
                <option>PET Scan (Positron Emission Tomography)</option>
              </optgroup>
              <optgroup label="${tr('Cardiology & Neuro', 'قلب وأعصاب وأجهزة أخرى')}">
                <option>ECG (Electrocardiogram)</option>
                <option>Holter Monitor (24/48 Hours)</option>
                <option>Ambulatory Blood Pressure Monitoring (ABPM)</option>
                <option>Treadmill Stress Test (TMT)</option>
                <option>EEG (Electroencephalogram)</option>
                <option>EMG (Electromyography) / NCS</option>
                <option>Spirometry / Lung Function Test</option>
                <option>Upper GI Endoscopy (OGD)</option>
                <option>Colonoscopy</option>
              </optgroup>
              <optgroup label="${tr('Other', 'أخرى')}">
                <option>${tr('Other Scan (Specify in details)', 'تصوير آخر (حدد في التفاصيل)')}</option>
              </optgroup>
            </select>
          </div>
          <div class="form-group mb-12"><label>${tr('Details', 'التفاصيل')}</label><input class="form-input" id="drRadDesc"></div>
          <button class="btn btn-success w-full" onclick="sendToRad()">📡 ${tr('Send to Radiology', 'تحويل للأشعة')}</button>
        </div>
        <div class="card mb-16">
          <div class="card-title">💊 ${tr('Write Prescription', 'كتابة وصفة')}</div>
          <div class="form-group mb-12"><label>${tr('Medication', 'الدواء')}</label>
            <input list="drugsDataList" class="form-input" id="drRxDrug" placeholder="${tr('Type to search medication...', 'ابحث عن اسم الدواء...')}" autocomplete="off">
            <datalist id="drugsDataList">
              ${drugs.map(d => `<option value="${d.drug_name}">`).join('')}
              <option value="${tr('Other', 'أخرى')}">
            </datalist>
          </div>
          <div class="flex gap-8 mb-12" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:140px"><label>${tr('Dosage', 'الجرعة')}</label><input class="form-input" id="drRxDose" placeholder="${tr('e.g. 500mg', 'مثلاً 500مج')}"></div>
            <div class="form-group" style="flex:0.6;min-width:90px"><label>${tr('Qty/Day', 'الكمية/يوم')}</label><input class="form-input" id="drRxQty" type="number" min="1" value="1"></div>
          </div>
          <div class="flex gap-8 mb-12" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:160px"><label>${tr('Frequency', 'التكرار')}</label>
              <select class="form-input" id="drRxFreq"><option>×1 ${tr('daily', 'يومياً')}</option><option>×2 ${tr('daily', 'يومياً')}</option><option>×3 ${tr('daily', 'يومياً')}</option><option>×4 ${tr('daily', 'يومياً')}</option><option>${tr('Every 8 hours', 'كل 8 ساعات')}</option><option>${tr('Every 12 hours', 'كل 12 ساعة')}</option><option>${tr('As needed', 'عند الحاجة')}</option><option>${tr('Before meals', 'قبل الأكل')}</option><option>${tr('After meals', 'بعد الأكل')}</option><option>${tr('Before sleep', 'قبل النوم')}</option></select>
            </div>
            <div class="form-group" style="flex:0.8;min-width:120px"><label>${tr('Duration', 'المدة')}</label><input class="form-input" id="drRxDur" placeholder="${tr('e.g. 7 days', 'مثلاً 7 أيام')}"></div>
          </div>
          <button class="btn btn-primary w-full" onclick="sendRx()" id="drRxBtn">💊 ${tr('Issue Prescription → Pharmacy', 'إصدار وصفة → الصيدلية')}</button>
          <div id="ddiAlert" style="display:none;margin-top:12px;padding:14px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);animation:alertPulse 2s infinite">
            <div style="font-weight:700;color:#ef4444;font-size:13px">⚠️ ${tr('DRUG INTERACTION WARNING', 'تحذير: تداخل دوائي')}</div>
            <div id="ddiMessage" style="font-size:12px;color:var(--text);margin-top:6px"></div>
            <button class="btn btn-sm btn-danger" onclick="document.getElementById('ddiAlert').style.display='none'" style="margin-top:8px">✓ ${tr('Acknowledge', 'إقرار')}</button>
          </div>
        </div>
        <div class="card mb-16" style="border:1px solid rgba(139,92,246,0.2)">
          <div class="card-title" style="color:#8b5cf6;border-bottom-color:rgba(139,92,246,0.15)">🧠 ${tr('Smart CPOE — Order Sets', 'الأوامر الذكية — باقات جاهزة')}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:12px" id="cpoeOrderSets">
            <button class="btn" onclick="applyCPOESet('dka')" style="height:auto;padding:10px;flex-direction:column;gap:2px;border-color:rgba(239,68,68,0.2)">
              <span style="font-size:20px">🩸</span><span style="font-weight:700;font-size:12px">DKA</span><span style="font-size:10px;color:var(--text-dim)">${tr('Diabetic Ketoacidosis','الحماض الكيتوني')}</span>
            </button>
            <button class="btn" onclick="applyCPOESet('sepsis')" style="height:auto;padding:10px;flex-direction:column;gap:2px;border-color:rgba(245,158,11,0.2)">
              <span style="font-size:20px">🦠</span><span style="font-weight:700;font-size:12px">Sepsis</span><span style="font-size:10px;color:var(--text-dim)">${tr('Sepsis Protocol','بروتوكول الإنتان')}</span>
            </button>
            <button class="btn" onclick="applyCPOESet('chest_pain')" style="height:auto;padding:10px;flex-direction:column;gap:2px;border-color:rgba(59,130,246,0.2)">
              <span style="font-size:20px">💔</span><span style="font-weight:700;font-size:12px">ACS</span><span style="font-size:10px;color:var(--text-dim)">${tr('Acute Coronary','متلازمة شريانية')}</span>
            </button>
            <button class="btn" onclick="applyCPOESet('pneumonia')" style="height:auto;padding:10px;flex-direction:column;gap:2px;border-color:rgba(34,197,94,0.2)">
              <span style="font-size:20px">🫁</span><span style="font-weight:700;font-size:12px">CAP</span><span style="font-size:10px;color:var(--text-dim)">${tr('Pneumonia','ذات الرئة')}</span>
            </button>
          </div>
          <div id="cpoeSetPreview" style="display:none;padding:14px;border-radius:12px;background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.1)">
            <div id="cpoeSetName" style="font-weight:700;color:#8b5cf6;margin-bottom:8px"></div>
            <div id="cpoeSetItems" style="font-size:12px"></div>
            <button class="btn btn-primary" onclick="executeCPOESet()" style="margin-top:10px">⚡ ${tr('Execute All Orders', 'تنفيذ جميع الأوامر')}</button>
          </div>
        </div>
        <div class="card mb-16">
          <div class="card-title">📋 ${tr('Medical Certificate', 'التقارير الطبية')}</div>
          <div class="form-group mb-12"><label>${tr('Certificate Type', 'نوع التقرير')}</label>
            <select class="form-input" id="drCertType">
              <option value="sick_leave">🩺 ${tr('Sick Leave', 'إجازة مرضية')}</option>
              <option value="medical_report">📄 ${tr('Medical Report', 'تقرير طبي')}</option>
              <option value="fitness">✅ ${tr('Fitness Certificate', 'شهادة لياقة')}</option>
            </select>
          </div>
          <div class="form-group mb-12"><label>${tr('Diagnosis/Reason', 'التشخيص/السبب')}</label><input class="form-input" id="drCertDiag"></div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>${tr('From', 'من')}</label><input class="form-input" type="date" id="drCertFrom" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group" style="flex:1"><label>${tr('To', 'إلى')}</label><input class="form-input" type="date" id="drCertTo"></div>
            <div class="form-group" style="flex:0.5"><label>${tr('Days', 'أيام')}</label><input class="form-input" type="number" id="drCertDays" value="1" min="1"></div>
          </div>
          <div class="form-group mb-12"><label>${tr('Notes', 'ملاحظات')}</label><input class="form-input" id="drCertNotes"></div>
          <button class="btn btn-primary w-full" onclick="issueCertificate()">📋 ${tr('Issue Certificate', 'إصدار التقرير')}</button>
        </div>
        <div class="card mb-16">
          <div class="card-title">🔄 ${tr('Referral to Department', 'تحويل لقسم آخر')}</div>
          <div class="form-group mb-12"><label>${tr('To Department', 'إلى القسم')}</label>
            <select class="form-input" id="drRefDept">
              <option>الباطنية</option><option>الأطفال</option><option>العظام</option><option>الجلدية</option>
              <option>الأنف والأذن</option><option>العيون</option><option>الأسنان</option><option>النساء والولادة</option>
              <option>المخ والأعصاب</option><option>القلب</option><option>المسالك البولية</option><option>الطوارئ</option><option>الجراحة</option>
            </select>
          </div>
          <div class="form-group mb-12"><label>${tr('Reason', 'السبب')}</label><input class="form-input" id="drRefReason"></div>
          <div class="form-group mb-12"><label>${tr('Urgency', 'الأولوية')}</label>
            <select class="form-input" id="drRefUrg">
              <option value="Normal">🟢 ${tr('Normal', 'عادي')}</option>
              <option value="Urgent">🟠 ${tr('Urgent', 'عاجل')}</option>
              <option value="Emergency">🔴 ${tr('Emergency', 'طارئ')}</option>
            </select>
          </div>
          <button class="btn btn-warning w-full" onclick="sendReferral()">🔄 ${tr('Send Referral', 'إرسال التحويل')}</button>
        </div>
        <div class="card mb-16">
          <div class="card-title">📅 ${tr('Schedule Follow-up', 'جدولة متابعة')}</div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>${tr('Date', 'التاريخ')}</label><input class="form-input" type="date" id="drFollowDate"></div>
            <div class="form-group" style="flex:1"><label>${tr('Time', 'الوقت')}</label><input class="form-input" type="time" id="drFollowTime" value="09:00"></div>
          </div>
          <div class="form-group mb-12"><label>${tr('Notes', 'ملاحظات')}</label><input class="form-input" id="drFollowNotes"></div>
          <button class="btn btn-info w-full" onclick="scheduleFollowup()">📅 ${tr('Book Follow-up', 'حجز موعد متابعة')}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 ${tr('Medical Records', 'السجلات الطبية')}</div>
        <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'drTable')">
        <div id="drTable">${makeTable([tr('Patient', 'المريض'), tr('Diagnosis', 'التشخيص'), tr('Symptoms', 'الأعراض'), tr('Date/Time', 'التاريخ/الوقت')], records.map(r => ({ cells: [r.patient_name || '', r.diagnosis, r.symptoms, r.visit_date ? new Date(r.visit_date).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''] })))}</div>
      </div>
    </div>`;
}
function statusText(s) { return s === 'Waiting' ? tr('Waiting', 'بالانتظار') : s === 'With Doctor' ? tr('With Doctor', 'مع الطبيب') : tr('Done', 'منتهي'); }
window.loadPatientInfo = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { document.getElementById('drPatientInfo').innerHTML = ''; return; }
  try {
    await API.put(`/api/patients/${pid}`, { status: 'With Doctor' });
    const p = (await API.get('/api/patients')).find(x => x.id == pid);
    const vitals = await API.get(`/api/nursing/vitals/${pid}`).catch(() => []);
    const account = await API.get(`/api/patients/${pid}/account`).catch(() => null);
    const v = vitals.length > 0 ? vitals[0] : null;
    let vitalsHtml = '';
    if (v) {
      vitalsHtml = `<div style="margin-top:12px;padding:12px;border:1px solid var(--border-color,#e5e7eb);border-radius:10px;background:var(--card-bg,#fff)">
        <div style="font-weight:600;margin-bottom:8px;font-size:13px">🌡️ ${tr('Vitals from Nursing', 'العلامات الحيوية من التمريض')} <span style="font-weight:400;font-size:11px;color:var(--text-dim)">${v.created_at ? new Date(v.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:12px">
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">🩸 ${tr('BP', 'الضغط')}<br><strong>${v.bp || '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">🌡️ ${tr('Temp', 'حرارة')}<br><strong>${v.temp ? v.temp + '°' : '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">❤️ ${tr('Pulse', 'نبض')}<br><strong>${v.pulse || '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">💨 ${tr('O2', 'أكسجين')}<br><strong>${v.o2_sat ? v.o2_sat + '%' : '-'}</strong></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:12px;margin-top:6px">
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">💪 ${tr('Weight', 'وزن')}<br><strong>${v.weight ? v.weight + ' kg' : '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">📏 ${tr('Height', 'طول')}<br><strong>${v.height ? v.height + ' cm' : '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">🩸 ${tr('Sugar', 'سكر')}<br><strong>${v.blood_sugar || '-'}</strong></div>
          <div style="background:var(--bg-secondary,#f8f9fa);padding:6px;border-radius:6px;text-align:center">🌬️ ${tr('Resp', 'تنفس')}<br><strong>${v.respiratory_rate || '-'}</strong></div>
        </div>
        ${v.allergies ? `<div style="margin-top:6px"><span class="badge badge-danger">⚠️ ${tr('Allergies', 'حساسية')}: ${v.allergies}</span></div>` : ''}
        ${v.chronic_diseases ? `<div style="margin-top:4px"><span class="badge badge-warning">🏥 ${tr('Chronic', 'أمراض مزمنة')}: ${v.chronic_diseases}</span></div>` : ''}
        ${v.current_medications ? `<div style="margin-top:4px"><span class="badge badge-info">💊 ${tr('Medications', 'أدوية')}: ${v.current_medications}</span></div>` : ''}
      </div>`;
    }
    // Build patient history timeline
    let historyHtml = '';
    if (account) {
      const events = [];
      (account.records || []).forEach(r => events.push({ type: 'record', icon: '🩺', color: '#6366f1', label: tr('Visit/Diagnosis', 'زيارة/تشخيص'), detail: `${r.diagnosis || '-'}${r.symptoms ? ' | ' + r.symptoms : ''}${r.doctor_name ? ' | 👨‍⚕️ ' + r.doctor_name : ''}`, date: r.visit_date || r.created_at }));
      (account.labOrders || []).forEach(o => events.push({ type: 'lab', icon: '🔬', color: '#f59e0b', label: tr('Lab', 'مختبر'), detail: `${o.order_type} ${o.status === 'Done' ? '✅' : '⏳'} ${o.results ? '| ' + o.results.substring(0, 80) : ''}`, date: o.created_at }));
      (account.radOrders || []).forEach(o => events.push({ type: 'rad', icon: '📡', color: '#0ea5e9', label: tr('Radiology', 'أشعة'), detail: `${o.order_type} ${o.status === 'Done' ? '✅' : '⏳'}`, date: o.created_at }));
      (account.prescriptions || []).forEach(rx => events.push({ type: 'rx', icon: '💊', color: '#10b981', label: tr('Prescription', 'وصفة'), detail: `${rx.drug_name || rx.medication || '-'} | ${rx.dosage || ''} ${rx.frequency || ''}`, date: rx.created_at }));
      (account.invoices || []).forEach(inv => events.push({ type: 'inv', icon: '🧾', color: '#8b5cf6', label: tr('Invoice', 'فاتورة'), detail: `${inv.description || inv.service_type || '-'} | ${inv.total || 0} ${tr('SAR', 'ر.س')} ${inv.paid ? '✅' : '⏳'}`, date: inv.created_at }));
      events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      if (events.length > 0) {
        historyHtml = `<div style="margin-top:12px;padding:12px;border:1px solid var(--border-color,#e5e7eb);border-radius:10px;background:var(--card-bg,#fff);max-height:350px;overflow-y:auto">
          <div style="font-weight:600;margin-bottom:10px;font-size:14px">📜 ${tr('Patient Full History', 'السجل الكامل للمريض')} (${events.length})</div>
          ${events.map(e => `<div style="display:flex;gap:10px;padding:8px;margin:4px 0;border-radius:8px;border-right:4px solid ${e.color};background:var(--hover,#f8f9fa);font-size:12px;align-items:flex-start">
            <span style="font-size:18px;min-width:24px">${e.icon}</span>
            <div style="flex:1"><strong style="color:${e.color}">${e.label}</strong><div style="margin-top:2px;color:var(--text)">${e.detail}</div></div>
            <span style="color:var(--text-dim);font-size:11px;white-space:nowrap">${e.date ? new Date(e.date).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
          </div>`).join('')}
        </div>`;
      }
    }
    document.getElementById('drPatientInfo').innerHTML = `<div class="flex gap-8 mt-16" style="flex-wrap:wrap;align-items:center"><span class="badge badge-info">📁 ${p.mrn || p.file_number}</span><span class="badge badge-warning">🎂 ${tr('Age', 'العمر')}: ${p.age || '?'}</span>${p.blood_type ? `<span class="badge" style="background:#dc2626;color:#fff;font-weight:700">🩸 ${p.blood_type}</span>` : ''}<span class="badge badge-success">📞 ${p.phone}</span><span class="badge badge-purple">🆔 ${p.national_id}</span>${p.gender ? `<span class="badge" style="background:${p.gender === 'ذكر' ? '#3b82f6' : '#ec4899'};color:#fff">${p.gender === 'ذكر' ? '👨' : '👩'} ${p.gender}</span>` : ''}${p.insurance_company ? `<span class="badge" style="background:#0d9488;color:#fff">🏢 ${p.insurance_company}${p.insurance_class ? ' (' + p.insurance_class + ')' : ''}</span>` : ''}<span class="badge" style="background:#0ea5e9;color:#fff">📅 ${tr('Visit', 'الزيارة')}: ${new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span><button class="btn btn-sm btn-primary" onclick="viewPatientResults(${p.id})">📋 ${tr('View Lab & Radiology Results', 'استعراض نتائج الفحوصات والأشعة')}</button><button class="btn btn-sm" onclick="dischargePatient(${p.id})" style="margin-right:auto;background:#dc3545;color:#fff;font-weight:600">🚪 ${tr('Patient Done', 'المريض طلع')}</button></div>${p.allergies ? `<div style="margin-top:8px;padding:10px;background:#fef2f2;border:2px solid #ef4444;border-radius:8px;font-size:13px;font-weight:600;color:#dc2626">⚠️ <strong>${tr('ALLERGIES', 'حساسية')}:</strong> </div>` : ''}${p.chronic_diseases ? `<div style="margin-top:6px;padding:8px;background:#fefce8;border:1px solid #facc15;border-radius:8px;font-size:12px;color:#854d0e">🩺 <strong>${tr('Chronic Diseases', 'أمراض مزمنة')}:</strong> </div>` : ''}${vitalsHtml}${historyHtml}<div id="drResultsPanel"></div>`;
  } catch (e) { }
};
window.dischargePatient = async (pid) => {
  try {
    await API.put(`/api/patients/${pid}`, { status: 'Done' });
    showToast(tr('Patient discharged!', 'تم خروج المريض! ✅'), 'success');
    document.getElementById('drPatientInfo').innerHTML = `<div class="badge badge-success" style="font-size:14px;padding:12px 20px;margin-top:12px">✅ ${tr('Patient discharged successfully', 'تم خروج المريض بنجاح')}</div>`;
    document.getElementById('drPatient').value = '';
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.viewPatientResults = async (pid) => {
  try {
    const data = await API.get(`/api/patients/${pid}/results`);
    const p = data.patient;
    let html = `<div class="card mt-16" style="border:2px solid var(--accent)">
          <div class="card-title">📋 ${tr('Results for', 'نتائج')} ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</div>`;
    // Lab Results
    if (data.labOrders.length > 0) {
      html += `<div class="mb-16"><h4 style="color:var(--accent);margin:0 0 8px">🔬 ${tr('Lab Results', 'نتائج المختبر')} (${data.labOrders.length})</h4>`;
      data.labOrders.forEach(o => {
        html += `<div style="padding:10px;margin:6px 0;background:var(--hover);border-radius:8px;border-right:4px solid ${o.status === 'Done' ? '#4ade80' : '#f59e0b'}">
                  <div class="flex gap-8" style="flex-wrap:wrap;align-items:center"><strong>${o.order_type}</strong> ${statusBadge(o.status)} <span style="color:var(--text-dim);font-size:12px">${o.created_at ? new Date(o.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span></div>
                  ${o.results ? `<div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;font-size:13px;white-space:pre-wrap">${o.results}</div>` : `<div style="margin-top:4px;color:var(--text-dim);font-size:12px">${tr('No results yet', 'لا توجد نتائج بعد')}</div>`}
                </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="mb-16" style="color:var(--text-dim)">🔬 ${tr('No lab orders', 'لا توجد فحوصات مختبر')}</div>`;
    }
    // Radiology Results
    if (data.radOrders.length > 0) {
      html += `<div class="mb-16"><h4 style="color:var(--accent);margin:0 0 8px">📡 ${tr('Radiology Results', 'نتائج الأشعة')} (${data.radOrders.length})</h4>`;
      data.radOrders.forEach(o => {
        html += `<div style="padding:10px;margin:6px 0;background:var(--hover);border-radius:8px;border-right:4px solid ${o.status === 'Done' ? '#4ade80' : '#f59e0b'}">
                  <div class="flex gap-8" style="flex-wrap:wrap;align-items:center"><strong>${o.order_type}</strong> ${statusBadge(o.status)} <span style="color:var(--text-dim);font-size:12px">${o.created_at ? new Date(o.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span></div>
                  ${o.results ? `<div style="margin-top:8px">${renderRadResults(o.results)}</div>` : `<div style="margin-top:4px;color:var(--text-dim);font-size:12px">${tr('No results yet', 'لا توجد نتائج بعد')}</div>`}
                </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="mb-16" style="color:var(--text-dim)">📡 ${tr('No radiology orders', 'لا توجد أشعة')}</div>`;
    }
    html += `</div>`;
    document.getElementById('drResultsPanel').innerHTML = html;
  } catch (e) { showToast(tr('Error loading results', 'خطأ في تحميل النتائج'), 'error'); }
};
window.saveMedRecord = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  try {
    await API.post('/api/medical/records', { patient_id: pid, diagnosis: document.getElementById('drDiag').value, symptoms: document.getElementById('drSymp').value, icd10_codes: document.getElementById('drIcd').value, notes: document.getElementById('drNotes').value });
    showToast(tr('Record saved!', 'تم حفظ السجل!'));
    await navigateTo(3);
  } catch (e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
};
window.sendToLab = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  try {
    await API.post('/api/lab/orders', { patient_id: pid, order_type: document.getElementById('drLabType').value, description: document.getElementById('drLabDesc').value });
    showToast(tr('Sent to Reception for payment → then Lab', 'تم الإرسال للاستقبال للسداد ← ثم المختبر'), 'success');
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.sendToRad = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  try {
    await API.post('/api/radiology/orders', { patient_id: pid, order_type: document.getElementById('drRadType').value, description: document.getElementById('drRadDesc').value });
    showToast(tr('Sent to Reception for payment → then Radiology', 'تم الإرسال للاستقبال للسداد ← ثم الأشعة'), 'success');
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.sendRx = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const drugName = document.getElementById('drRxDrug').value;
  // Check drug allergy before prescribing
  const allergyMatch = await checkDrugAllergy(pid, drugName);
  if (allergyMatch) {
    const proceed = confirm('⚠️🚨 ' + tr('ALLERGY ALERT! Patient is allergic to: ', 'تنبيه حساسية! المريض لديه حساسية من: ') + allergyMatch.toUpperCase() + '\n\n' + tr('Drug: ', 'الدواء: ') + drugName + '\n\n' + tr('Do you want to proceed anyway?', 'هل تريد المتابعة رغم ذلك؟'));
    if (!proceed) return;
  }
  try {
    const qty = document.getElementById('drRxQty')?.value || '1';
    await API.post('/api/prescriptions', { patient_id: pid, medication_name: drugName, dosage: document.getElementById('drRxDose').value, quantity_per_day: qty, frequency: document.getElementById('drRxFreq').value, duration: document.getElementById('drRxDur').value });
    showToast(tr('Prescription sent to Pharmacy!', 'تم إرسال الوصفة للصيدلية!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.issueCertificate = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const pSelect = document.getElementById('drPatient');
  const pName = pSelect.options[pSelect.selectedIndex]?.text?.split(' - ')[1]?.split(' (')[0] || '';
  try {
    await API.post('/api/medical/certificates', {
      patient_id: pid, patient_name: pName,
      cert_type: document.getElementById('drCertType').value,
      diagnosis: document.getElementById('drCertDiag').value,
      start_date: document.getElementById('drCertFrom').value,
      end_date: document.getElementById('drCertTo').value,
      days: parseInt(document.getElementById('drCertDays').value) || 1,
      notes: document.getElementById('drCertNotes').value
    });
    showToast(tr('Certificate issued!', 'تم إصدار التقرير!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.sendReferral = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const pSelect = document.getElementById('drPatient');
  const pName = pSelect.options[pSelect.selectedIndex]?.text?.split(' - ')[1]?.split(' (')[0] || '';
  try {
    await API.post('/api/referrals', {
      patient_id: pid, patient_name: pName,
      to_department: document.getElementById('drRefDept').value,
      reason: document.getElementById('drRefReason').value,
      urgency: document.getElementById('drRefUrg').value
    });
    showToast(tr('Referral sent!', 'تم إرسال التحويل!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.scheduleFollowup = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const followDate = document.getElementById('drFollowDate').value;
  if (!followDate) { showToast(tr('Select date', 'اختر التاريخ'), 'error'); return; }
  const pSelect = document.getElementById('drPatient');
  const pName = pSelect.options[pSelect.selectedIndex]?.text?.split(' - ')[1]?.split(' (')[0] || '';
  try {
    await API.post('/api/appointments/followup', {
      patient_id: pid, patient_name: pName,
      appt_date: followDate,
      appt_time: document.getElementById('drFollowTime').value,
      notes: document.getElementById('drFollowNotes').value
    });
    showToast(tr('Follow-up booked!', 'تم حجز موعد المتابعة!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== CPOE ORDER SETS & DDI CHECK =====
const CPOE_SETS = {
  dka: { name: 'DKA Protocol', nameAr: 'بروتوكول الحماض الكيتوني', orders: [
    { type:'lab', name:'CBC + BMP + ABG + HbA1c + Ketones' },
    { type:'med', name:'Normal Saline 0.9%', dose:'1000ml IV bolus, then 250ml/hr' },
    { type:'med', name:'Insulin Regular', dose:'0.1 units/kg/hr IV drip' },
    { type:'med', name:'Potassium Chloride 20mEq', dose:'in each liter of IV fluid' },
    { type:'lab', name:'BG monitoring q1h, BMP q4h' },
    { type:'order', name:'Continuous cardiac monitoring + I/O chart' }
  ]},
  sepsis: { name: 'Sepsis Bundle (Hour-1)', nameAr: 'بروتوكول الإنتان', orders: [
    { type:'lab', name:'Blood Culture x2, CBC, Lactate, CRP, Procalcitonin' },
    { type:'med', name:'Normal Saline 0.9%', dose:'30ml/kg IV bolus within 1hr' },
    { type:'med', name:'Piperacillin-Tazobactam 4.5g', dose:'IV q8h (start within 1hr)' },
    { type:'med', name:'Vasopressor (Norepinephrine)', dose:'if MAP<65 after fluids' },
    { type:'lab', name:'Repeat Lactate if initial >2 mmol/L' },
    { type:'order', name:'Foley catheter + hourly urine output' }
  ]},
  chest_pain: { name: 'ACS Protocol (MONA)', nameAr: 'متلازمة الشريان التاجي', orders: [
    { type:'lab', name:'Troponin I (stat + q3h x3), CBC, BMP, PT/INR, Lipid Panel' },
    { type:'med', name:'Aspirin 300mg', dose:'PO stat (chewed)' },
    { type:'med', name:'Clopidogrel 300mg', dose:'PO loading dose' },
    { type:'med', name:'Heparin 60 units/kg', dose:'IV bolus then 12 units/kg/hr' },
    { type:'med', name:'Nitroglycerin 0.4mg', dose:'SL q5min x3 (hold if SBP<90)' },
    { type:'rad', name:'ECG stat + q15min, Chest X-Ray, Echo' }
  ]},
  pneumonia: { name: 'CAP Protocol', nameAr: 'ذات الرئة المكتسبة', orders: [
    { type:'lab', name:'CBC, CRP, Procalcitonin, Blood Culture, Sputum Culture' },
    { type:'med', name:'Ceftriaxone 1g', dose:'IV q24h' },
    { type:'med', name:'Azithromycin 500mg', dose:'IV/PO q24h' },
    { type:'med', name:'Paracetamol 1g', dose:'IV/PO q6h PRN for fever' },
    { type:'rad', name:'Chest X-Ray PA + Lateral' },
    { type:'order', name:'O2 therapy to maintain SpO2 ≥ 94%' }
  ]}
};

window.applyCPOESet = function(setId) {
  const set = CPOE_SETS[setId]; if (!set) return;
  const preview = document.getElementById('cpoeSetPreview');
  document.getElementById('cpoeSetName').textContent = `⚡ ${isArabic ? set.nameAr : set.name}`;
  const icons = { lab:'🔬', med:'💊', rad:'📡', order:'📋' };
  document.getElementById('cpoeSetItems').innerHTML = set.orders.map(o =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:16px">${icons[o.type]||'📋'}</span>
      <span style="flex:1;font-weight:600">${escapeHTML(o.name)}</span>
      ${o.dose ? `<span style="color:var(--text-dim);font-size:11px">${escapeHTML(o.dose)}</span>` : ''}
    </div>`
  ).join('');
  preview.style.display = 'block';
  preview.dataset.setId = setId;
};

window.executeCPOESet = async function() {
  const pid = document.getElementById('drPatient')?.value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const setId = document.getElementById('cpoeSetPreview')?.dataset?.setId;
  const set = CPOE_SETS[setId]; if (!set) return;
  try {
    await API.post('/api/clinical/cpoe/order-sets/apply', { patient_id: pid, set_name: setId, orders: set.orders });
    showToast(`✅ ${tr('Order Set applied!', 'تم تطبيق الباقة!')} — ${set.orders.length} ${tr('orders', 'أمر')}`, 'success');
    document.getElementById('cpoeSetPreview').style.display = 'none';
  } catch(e) {
    // Fallback: send individual prescriptions for med orders
    let count = 0;
    for (const o of set.orders.filter(x => x.type === 'med')) {
      try { await API.post('/api/prescriptions', { patient_id: pid, medication_name: o.name, dosage: o.dose, frequency: 'As ordered', duration: 'As needed' }); count++; } catch(ex) {}
    }
    showToast(`💊 ${count} ${tr('prescriptions sent', 'وصفات أُرسلت')}`, count ? 'success' : 'error');
  }
};

// Drug-Drug Interaction Check on prescription input
(function setupDDICheck() {
  document.addEventListener('change', async function(e) {
    if (e.target?.id !== 'drRxDrug') return;
    const pid = document.getElementById('drPatient')?.value;
    const drug = e.target.value;
    if (!pid || !drug) return;
    try {
      const result = await API.post('/api/clinical/drug-interaction-check', { patient_id: pid, new_drug: drug });
      if (result && result.interactions && result.interactions.length > 0) {
        const alertEl = document.getElementById('ddiAlert');
        const msgEl = document.getElementById('ddiMessage');
        msgEl.innerHTML = result.interactions.map(i =>
          `<div style="margin-bottom:4px">❌ <strong>${escapeHTML(i.drug1||drug)}</strong> ↔ <strong>${escapeHTML(i.drug2||'')}</strong>: ${escapeHTML(i.severity||'')} — ${escapeHTML(i.description||i.message||'')}</div>`
        ).join('');
        alertEl.style.display = 'block';
      }
    } catch(ex) { /* DDI endpoint may not exist yet — silent fail */ }
  });
})();
let selectedServices = [];
window.filterDrServices = () => {
  const q = document.getElementById('drSvcSearch').value.toLowerCase().trim();
  const dd = document.getElementById('drSvcDropdown');
  if (!q || q.length < 1) { dd.style.display = 'none'; return; }
  const svcs = JSON.parse(document.getElementById('drSvcData').value || '[]');
  const matches = svcs.filter(s => s.name_en.toLowerCase().includes(q) || s.name_ar.includes(q) || s.category.toLowerCase().includes(q)).slice(0, 15);
  if (!matches.length) { dd.innerHTML = `<div style="padding:10px;color:var(--text-dim)">${tr('No results', 'لا توجد نتائج')}</div>`; dd.style.display = 'block'; return; }
  dd.innerHTML = matches.map(s => `<div onclick="addDrService(${s.id},'${s.name_en.replace(/'/g, "\\'")}','${s.name_ar.replace(/'/g, "\\'")}',${s.price},'${s.category}')" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background='var(--hover)'" onmouseout="this.style.background=''">
    <span><strong>${isArabic ? s.name_ar : s.name_en}</strong> <small style="color:var(--text-dim)">${s.category}</small></span>
    <span style="color:var(--accent);font-weight:600">${s.price} ${tr('SAR', 'ر.س')}</span>
  </div>`).join('');
  dd.style.display = 'block';
};
window.addDrService = (id, nameEn, nameAr, price, cat) => {
  if (selectedServices.find(s => s.id === id)) return;
  selectedServices.push({ id, nameEn, nameAr, price, cat });
  document.getElementById('drSvcSearch').value = '';
  document.getElementById('drSvcDropdown').style.display = 'none';
  renderSvcTags();
};
window.removeDrService = (id) => {
  selectedServices = selectedServices.filter(s => s.id !== id);
  renderSvcTags();
};
function renderSvcTags() {
  const c = document.getElementById('drSvcTags');
  if (!selectedServices.length) { c.innerHTML = `<span style="color:var(--text-dim);font-size:13px">${tr('No procedures selected', 'لم يتم اختيار إجراءات')}</span>`; return; }
  const total = selectedServices.reduce((s, x) => s + x.price, 0);
  c.innerHTML = selectedServices.map(s => `<span class="badge badge-info" style="font-size:12px;padding:6px 10px">${isArabic ? s.nameAr : s.nameEn} (${s.price} ${tr('SAR', 'ر.س')}) <span onclick="removeDrService(${s.id})" style="cursor:pointer;margin-right:4px;font-weight:bold">\u2715</span></span>`).join('') +
    `<span class="badge badge-success" style="font-size:12px;padding:6px 10px;margin-right:auto">\ud83d\udcb0 ${tr('Total', 'الإجمالي')}: ${total} ${tr('SAR', 'ر.س')}</span>`;
}
window.billDrProcedures = async () => {
  const pid = document.getElementById('drPatient').value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  if (!selectedServices.length) { showToast(tr('Select procedures first', 'اختر الإجراءات أولاً'), 'error'); return; }
  try {
    const result = await API.post('/api/medical/bill-procedures', { patient_id: pid, services: selectedServices });
    showToast(`${tr('Billed successfully', 'تم إصدار الفاتورة')}: ${result.totalBilled} ${tr('SAR', 'ر.س')}`);
    selectedServices = [];
    renderSvcTags();
  } catch (e) { showToast(tr('Error billing', 'خطأ في الفوترة'), 'error'); }
};

// ===== LAB =====
// ===== LAB NORMAL RANGES (Gender-Specific: m=male, f=female) =====
const LAB_NORMAL_RANGES = {
  'CBC (Complete Blood Count)': {
    m: 'WBC: 4.5-11.0 ×10³/µL | RBC: 4.5-5.5 ×10⁶/µL | Hgb: 13.5-17.5 g/dL | Hct: 38-50% | Platelets: 150-400 ×10³/µL | MCV: 80-100 fL | MCH: 27-33 pg',
    f: 'WBC: 4.5-11.0 ×10³/µL | RBC: 4.0-5.0 ×10⁶/µL | Hgb: 12.0-16.0 g/dL | Hct: 36-44% | Platelets: 150-400 ×10³/µL | MCV: 80-100 fL | MCH: 27-33 pg'
  },
  'ESR (Erythrocyte Sedimentation Rate)': { m: '0-15 mm/hr', f: '0-20 mm/hr' },
  'Coagulation Profile (PT, PTT, INR)': 'PT: 11-13.5 sec | INR: 0.8-1.2 | PTT (aPTT): 25-35 sec',
  'Blood Film / Reticulocyte Count': 'Reticulocyte: 0.5-2.5%',
  'Hemoglobin Electrophoresis': 'HbA: 95-98% | HbA2: 1.5-3.5% | HbF: <2%',
  'G6PD Deficiency Test': 'Normal: 4.6-13.5 U/g Hb',
  'Sickle Cell Test': 'Negative (Normal)',
  'Bleeding Time / Clotting Time': 'Bleeding Time: 2-7 min | Clotting Time: 4-10 min',
  'D-Dimer': '<0.5 µg/mL (or <500 ng/mL)',
  'Comprehensive Metabolic Panel (CMP)': 'Glucose: 70-100 mg/dL | BUN: 7-20 mg/dL | Creatinine: 0.6-1.2 mg/dL | Na: 136-145 mEq/L | K: 3.5-5.0 mEq/L | Cl: 98-106 mEq/L | CO2: 23-29 mEq/L | Ca: 8.5-10.5 mg/dL | Total Protein: 6.0-8.3 g/dL | Albumin: 3.5-5.5 g/dL | Bilirubin(T): 0.1-1.2 mg/dL | ALP: 44-147 IU/L | ALT: 7-56 IU/L | AST: 10-40 IU/L',
  'Basic Metabolic Panel (BMP)': 'Glucose: 70-100 mg/dL | BUN: 7-20 mg/dL | Creatinine: 0.6-1.2 mg/dL | Na: 136-145 | K: 3.5-5.0 | Cl: 98-106 | CO2: 23-29 mEq/L | Ca: 8.5-10.5 mg/dL',
  'Fasting Blood Sugar (FBS)': 'Normal: 70-100 mg/dL (3.9-5.6 mmol/L) | Pre-diabetes: 100-125 | Diabetes: ≥126',
  'Random Blood Sugar (RBS)': 'Normal: <140 mg/dL (7.8 mmol/L) | Diabetes: ≥200',
  'Oral Glucose Tolerance Test (OGTT)': 'Fasting: <100 | 1hr: <180 | 2hr: <140 mg/dL | Diabetes 2hr: ≥200',
  'HbA1c (Glycated Hemoglobin)': 'Normal: <5.7% | Pre-diabetes: 5.7-6.4% | Diabetes: ≥6.5%',
  'Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)': { m: 'Total Cholesterol: <200 | LDL: <100 | HDL: >40 mg/dL | Triglycerides: <150 | VLDL: 5-40', f: 'Total Cholesterol: <200 | LDL: <100 | HDL: >50 mg/dL | Triglycerides: <150 | VLDL: 5-40' },
  'Renal Profile (Urea, Creatinine, Electrolytes: Na, K, Cl)': { m: 'BUN: 7-20 | Creatinine: 0.7-1.3 mg/dL | eGFR: >90 | Na: 136-145 | K: 3.5-5.0 | Cl: 98-106', f: 'BUN: 7-20 | Creatinine: 0.6-1.1 mg/dL | eGFR: >90 | Na: 136-145 | K: 3.5-5.0 | Cl: 98-106' },
  'Liver Function Test (LFT: ALT, AST, ALP, Total/Direct Bilirubin, Albumin, Total Protein)': { m: 'ALT: 7-56 | AST: 10-40 | ALP: 44-147 | GGT: 8-61 IU/L | Bilirubin(T): 0.1-1.2 | Direct: 0-0.3 | Albumin: 3.5-5.5 | Protein: 6.0-8.3', f: 'ALT: 7-45 | AST: 10-35 | ALP: 44-147 | GGT: 5-36 IU/L | Bilirubin(T): 0.1-1.2 | Direct: 0-0.3 | Albumin: 3.5-5.5 | Protein: 6.0-8.3' },
  'Cardiac Enzymes (Troponin T/I, CK-MB, CK-Total, LDH)': { m: 'Troponin I: <0.04 ng/mL | CK-Total: 39-308 IU/L | CK-MB: <25 | LDH: 140-280 | BNP: <100 pg/mL', f: 'Troponin I: <0.04 ng/mL | CK-Total: 26-192 IU/L | CK-MB: <25 | LDH: 140-280 | BNP: <100 pg/mL' },
  'Uric Acid': { m: '3.4-7.0 mg/dL', f: '2.4-6.0 mg/dL' },
  'Calcium / Phosphorus / Magnesium': 'Ca: 8.5-10.5 mg/dL | Ionized Ca: 4.5-5.6 mg/dL | Phosphorus: 2.5-4.5 mg/dL | Magnesium: 1.7-2.2 mg/dL',
  'Iron Profile (Serum Iron, TIBC, Ferritin, Transferrin)': { m: 'Serum Iron: 65-175 µg/dL | TIBC: 250-370 | Ferritin: 12-300 ng/mL | Transferrin Sat: 20-50%', f: 'Serum Iron: 50-170 µg/dL | TIBC: 250-370 | Ferritin: 12-150 ng/mL | Transferrin Sat: 20-50%' },
  'Vitamin D3 (25-OH Cholecalciferol)': 'Deficient: <20 ng/mL | Insufficient: 20-29 | Sufficient: 30-100 | Toxic: >100 ng/mL',
  'Vitamin B12 / Folate': 'B12: 200-900 pg/mL | Folate: 2.7-17.0 ng/mL',
  'Amylase / Lipase': 'Amylase: 28-100 U/L | Lipase: 0-160 U/L',
  'Serum Osmolality': '275-295 mOsm/kg',
  'Thyroid Profile (TSH, Free T3, Free T4, Total T3, Total T4)': 'TSH: 0.27-4.2 mIU/L | Free T4: 0.93-1.7 ng/dL | Free T3: 2.0-4.4 pg/mL | Total T4: 5.1-14.1 µg/dL | Total T3: 80-200 ng/dL',
  'Fertility Hormones (FSH, LH, Prolactin, Testosterone (Free/Total), Estradiol E2, Progesterone)': { m: 'FSH: 1.5-12.4 | LH: 1.7-8.6 mIU/mL | Prolactin: 4-15 ng/mL | Testosterone: 270-1070 ng/dL | Free Testosterone: 8.7-25.1 pg/mL | Estradiol: 10-40 pg/mL', f: 'FSH(follicular): 3.5-12.5 | LH(follicular): 2.4-12.6 mIU/mL | Prolactin: 4-23 ng/mL | Testosterone: 15-70 ng/dL | Estradiol(follicular): 12.5-166 pg/mL | Progesterone(luteal): 1.8-24 ng/mL' },
  'Beta-hCG (Pregnancy Test - Blood Qualitative/Quantitative)': { m: 'Normal: <2 mIU/mL', f: 'Non-pregnant: <5 mIU/mL | Pregnant: >25 mIU/mL' },
  'Cortisol (AM/PM)': 'AM (6-8am): 6.2-19.4 µg/dL | PM (4pm): 2.3-11.9 µg/dL',
  'Insulin (Fasting/Random)': 'Fasting: 2.6-24.9 µIU/mL',
  'Parathyroid Hormone (PTH)': '15-65 pg/mL',
  'Growth Hormone (GH)': { m: '0-5 ng/mL', f: '0-10 ng/mL' },
  'ACTH': 'AM: 10-60 pg/mL',
  'C-Peptide': '0.5-2.0 ng/mL (fasting)',
  'Anti-Mullerian Hormone (AMH)': { m: '1.4-14.0 ng/mL', f: 'Reproductive: 1.0-10.0 ng/mL | Low reserve: <1.0 | High (PCOS): >10' },
  'CRP (C-Reactive Protein - Qualitative/Quantitative)': 'Normal: <3 mg/L | Mild inflammation: 3-10 | Moderate: 10-100 | Severe: >100',
  'Rheumatoid Factor (RF)': 'Normal: <14 IU/mL',
  'ANA (Anti-Nuclear Antibody) / Anti-dsDNA': 'ANA: Negative (<1:40) | Anti-dsDNA: <30 IU/mL',
  'ASO Titer': 'Adults: <200 IU/mL | Children: <100 IU/mL',
  'Hepatitis Profile (HBsAg, HBsAb, HCV Ab, HAV IgM/IgG)': 'HBsAg: Negative | HBsAb: >10 mIU/mL (immune) | HCV Ab: Negative | HAV IgM: Negative',
  'HIV 1 & 2 Abs/Ag': 'Negative (Non-reactive)',
  'VDRL / RPR (Syphilis)': 'Non-reactive (Negative)',
  'Widal Test (Typhoid)': 'O & H Titers: <1:80 (Normal)',
  'Brucella (Abortus/Melitensis)': 'Titer: <1:80 (Negative)',
  'Toxoplasmosis (IgG/IgM)': 'IgG: <1.0 IU/mL (Negative) | IgM: Negative',
  'Rubella (IgG/IgM)': 'IgG: >10 IU/mL (Immune) | IgM: Negative',
  'Cytomegalovirus CMV (IgG/IgM)': 'IgG: Negative (<6 AU/mL) | IgM: Negative',
  'Herpes Simplex Virus HSV 1/2 (IgG/IgM)': 'IgG: <0.9 (Negative) | IgM: Negative',
  'EBV (Epstein-Barr Virus)': 'VCA IgM: Negative | VCA IgG: Negative | EBNA: Negative',
  'Celiac Disease Panel (Anti-tTG, Anti-Endomysial)': 'Anti-tTG IgA: <4 U/mL (Negative) | Anti-Endomysial: Negative',
  'Food Allergy Panel (IgE)': 'Total IgE: <100 IU/mL (Adults) | Specific IgE: <0.35 kU/L per allergen',
  'Inhalant Allergy Panel (IgE)': 'Total IgE: <100 IU/mL | Specific IgE: Class 0 (<0.35 kU/L)',
  'Urine Analysis (Routine & Microscopic)': 'pH: 4.6-8.0 | Specific Gravity: 1.005-1.030 | Protein: Negative | Glucose: Negative | Blood: Negative | WBC: 0-5/HPF | RBC: 0-2/HPF | Bacteria: None',
  'Urine Culture & Sensitivity': 'Negative: <10,000 CFU/mL | Positive: ≥100,000 CFU/mL',
  'Stool Analysis (Routine & Microscopic)': 'Color: Brown | Consistency: Formed | Occult Blood: Negative | WBC: None | RBC: None | Parasites: None',
  'Stool Culture': 'No pathogenic organisms',
  'Stool Occult Blood': 'Negative',
  'H. Pylori (Ag in Stool / Ab in Blood)': 'Stool Ag: Negative | Serum Ab: Negative',
  'Throat Swab Culture': 'Normal Flora | No Group A Strep',
  'Sputum Culture & AFB (Tuberculosis)': 'Culture: Normal flora | AFB Smear: Negative',
  'Wound/Pus Swab Culture': 'No pathogenic growth',
  'Blood Culture (Aerobic/Anaerobic)': 'No growth after 5 days',
  'PSA (Prostate Specific Antigen - Total/Free)': { m: 'Total PSA: <4.0 ng/mL | Free/Total ratio: >25%', f: 'N/A (خاص بالذكور)' },
  'CEA (Carcinoembryonic Antigen)': 'Non-smoker: <2.5 ng/mL | Smoker: <5.0 ng/mL',
  'CA 125 (Ovarian)': '<35 U/mL',
  'CA 15-3 (Breast)': '<30 U/mL',
  'CA 19-9 (Pancreatic/GI)': '<37 U/mL',
  'AFP (Alpha-Fetoprotein)': '<10 ng/mL (Adults)',
  'Beta-2 Microglobulin': '0.8-2.2 mg/L',
  'Thyroglobulin': '1.5-38.5 ng/mL (pre-thyroidectomy)',
  'COVID-19 PCR': 'Negative (Not Detected)',
  'HCV RNA PCR (Quantitative)': 'Not Detected (<15 IU/mL)',
  'HBV DNA PCR (Quantitative)': 'Not Detected (<10 IU/mL)',
  'HIV RNA PCR (Quantitative)': 'Not Detected (<20 copies/mL)',
  'Respiratory Pathogen Panel (PCR)': 'Negative for all targets',
  'HPV DNA Typing': 'Negative (No high-risk HPV detected)',
  'Pap Smear': 'NILM (Negative for Intraepithelial Lesion or Malignancy)',
  'Malaria Film': 'No parasites seen',
  // Blood Bank
  'Blood Group (ABO) & Rh Typing': 'A/B/AB/O | Rh+ or Rh-',
  'Crossmatch (Major & Minor)': 'Compatible (No agglutination)',
  'Direct Coombs Test (DAT)': 'Negative',
  'Indirect Coombs Test (IAT)': 'Negative',
  'Antibody Screening Panel': 'Negative (No clinically significant antibodies)',
  'Cold Agglutinins': 'Titer: <1:64',
  // Blood Gas
  'Arterial Blood Gas (ABG)': 'pH: 7.35-7.45 | pCO2: 35-45 mmHg | pO2: 80-100 mmHg | HCO3: 22-26 mEq/L | BE: -2 to +2 | O2 Sat: 95-100%',
  'Venous Blood Gas (VBG)': 'pH: 7.31-7.41 | pCO2: 41-51 mmHg | HCO3: 22-26 mEq/L',
  'Lactate (Lactic Acid)': 'Venous: 0.5-2.2 mmol/L | Arterial: 0.5-1.6 mmol/L | Critical: >4 mmol/L',
  'Ionized Calcium': '4.5-5.6 mg/dL (1.12-1.40 mmol/L)',
  'Methemoglobin / Carboxyhemoglobin': 'MetHb: <1.5% | COHb: Non-smoker: <2%, Smoker: <10%',
  // TDM
  'Digoxin Level': 'Therapeutic: 0.8-2.0 ng/mL | Toxic: >2.0',
  'Phenytoin (Dilantin) Level': 'Therapeutic: 10-20 µg/mL | Toxic: >20',
  'Valproic Acid Level': 'Therapeutic: 50-100 µg/mL | Toxic: >100',
  'Carbamazepine Level': 'Therapeutic: 4-12 µg/mL | Toxic: >12',
  'Lithium Level': 'Therapeutic: 0.6-1.2 mEq/L | Toxic: >1.5',
  'Vancomycin Level (Trough/Peak)': 'Trough: 10-20 µg/mL | Peak: 20-40 µg/mL',
  'Gentamicin / Amikacin Level': 'Gentamicin - Trough: <2 | Peak: 5-10 µg/mL | Amikacin - Trough: <10 | Peak: 20-30',
  'Theophylline Level': 'Therapeutic: 10-20 µg/mL | Toxic: >20',
  'Methotrexate Level': '24hr: <10 µmol/L | 48hr: <1 | 72hr: <0.1',
  'Tacrolimus / Cyclosporine Level': 'Tacrolimus: 5-20 ng/mL | Cyclosporine: 100-300 ng/mL (varies by transplant)',
  // Special Chemistry
  'Protein Electrophoresis (SPEP)': 'Albumin: 3.5-5.5 g/dL | Alpha-1: 0.1-0.3 | Alpha-2: 0.6-1.0 | Beta: 0.7-1.2 | Gamma: 0.7-1.6 g/dL',
  'Immunoglobulins (IgA, IgG, IgM, IgE)': 'IgG: 700-1600 mg/dL | IgA: 70-400 | IgM: 40-230 | IgE: <100 IU/mL',
  'Complement C3 / C4': 'C3: 90-180 mg/dL | C4: 10-40 mg/dL',
  'Ammonia Level': '15-45 µg/dL (11-32 µmol/L)',
  'Homocysteine': '5-15 µmol/L | High risk: >15',
  'Ceruloplasmin / Copper': 'Ceruloplasmin: 20-35 mg/dL | Serum Copper: 70-155 µg/dL | Wilson Disease: Ceruloplasmin <20',
  'Lactate Dehydrogenase (LDH)': '140-280 IU/L',
  'Haptoglobin': { m: '30-200 mg/dL', f: '30-200 mg/dL' },
  'Procalcitonin (PCT)': 'Normal: <0.1 ng/mL | Bacterial unlikely: <0.25 | Likely: 0.25-0.5 | Severe sepsis: >2.0',
  'BNP / NT-proBNP': 'BNP: <100 pg/mL (no HF) | NT-proBNP: <300 pg/mL (<50y), <900 (50-75y), <1800 (>75y)',
  'Fibrinogen': '200-400 mg/dL',
  'Anti-Xa (Heparin) Assay': 'LMWH prophylaxis: 0.2-0.5 IU/mL | Treatment: 0.5-1.0 | UFH: 0.3-0.7',
  'Cystatin C': '0.6-1.0 mg/L',
  'Microalbumin (Urine)': 'Normal: <30 mg/day | Microalbuminuria: 30-300 | Macroalbuminuria: >300',
  'Serum Free Light Chains (Kappa/Lambda)': 'Kappa: 3.3-19.4 mg/L | Lambda: 5.7-26.3 | Ratio: 0.26-1.65',
  '24hr Urine Protein / Creatinine Clearance': { m: 'Protein: <150 mg/24hr | Creatinine Clearance: 97-137 mL/min', f: 'Protein: <150 mg/24hr | Creatinine Clearance: 88-128 mL/min' },
  // Immunology additions
  'Anti-CCP (Anti-Cyclic Citrullinated Peptide)': 'Negative: <20 U/mL | Positive: ≥20',
  'ANCA (Anti-Neutrophil Cytoplasmic Antibody)': 'Negative (<1:20) | c-ANCA & p-ANCA',
  'Anti-Scl-70 / Anti-Centromere': 'Negative (<1.0 U) | Anti-Scl-70: Scleroderma | Anti-Centromere: CREST',
  'Dengue NS1 Ag / IgM / IgG': 'NS1 Ag: Negative | IgM: Negative | IgG: Negative',
  'Flow Cytometry (Immunophenotyping / CD4 Count)': 'CD4: 500-1500 cells/µL | CD4/CD8 ratio: 1.0-3.0',
  // Microbiology additions
  'QuantiFERON-TB Gold / TB Spot': 'Negative (<0.35 IU/mL) | Borderline: 0.35-0.50 | Positive: ≥0.35',
  'Chlamydia trachomatis (PCR/Ag)': 'Not Detected (Negative)',
  'Neisseria Gonorrhoeae (PCR/Culture)': 'Not Detected (Negative)',
  'CSF Analysis (Cell Count, Protein, Glucose)': 'WBC: 0-5/µL | RBC: 0 | Protein: 15-45 mg/dL | Glucose: 40-70 mg/dL | Opening pressure: 6-20 cmH2O',
  'Synovial Fluid Analysis': 'Color: Clear/Yellow | WBC: <200/µL | Crystals: None | Culture: No growth',
  'Semen Analysis (Spermogram)': { m: 'Volume: 1.5-5 mL | Count: ≥15 million/mL | Total: ≥39 million | Motility: ≥40% | Morphology: ≥4% normal | pH: 7.2-8.0', f: 'N/A' },
  // Hormones additions
  'Aldosterone / Renin': 'Aldosterone (upright): 7-30 ng/dL | Renin (upright): 0.5-4.0 ng/mL/hr | Ratio: <30',
  'DHEA-S (Dehydroepiandrosterone Sulfate)': { m: '80-560 µg/dL (varies by age)', f: '35-430 µg/dL (varies by age)' },
  'Calcitonin': { m: '<8.4 pg/mL', f: '<5.0 pg/mL' },
  '17-OH Progesterone': { m: '0.5-2.1 ng/mL', f: 'Follicular: 0.2-1.0 | Luteal: 1.0-4.0 ng/mL' },
  // Toxicology & Trace Elements
  'Myoglobin': { m: '28-72 ng/mL', f: '25-58 ng/mL' },
  'Vitamin A (Retinol)': '30-65 µg/dL (1.05-2.27 µmol/L)',
  'Zinc Level': '60-120 µg/dL (9.2-18.4 µmol/L)',
  'Selenium Level': '70-150 µg/L',
  'Lead Level (Blood)': 'Normal: <5 µg/dL | Action: ≥5 | Toxic: >70',
  'Mercury Level (Blood)': 'Normal: <10 µg/L | At risk: 10-50 | Toxic: >50',
  'Urine Drug Screen (UDS)': 'Negative for all classes (Amphetamines, Barbiturates, Benzodiazepines, Cannabinoids, Cocaine, Opiates)',
  'Serum Ethanol (Alcohol) Level': 'Negative: 0 | Legal limit: <80 mg/dL | Lethal: >400 mg/dL',
  'Acetaminophen (Paracetamol) Level': 'Therapeutic: 10-30 µg/mL | Toxic (4hr): >150 µg/mL',
  'Salicylate (Aspirin) Level': 'Therapeutic: 15-30 mg/dL | Toxic: >30 | Lethal: >60'
};
window.getLabNormalRange = (testName, gender) => {
  let entry = LAB_NORMAL_RANGES[testName];
  if (!entry) { for (const key in LAB_NORMAL_RANGES) { if (testName.includes(key) || key.includes(testName)) { entry = LAB_NORMAL_RANGES[key]; break; } } }
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  const g = (gender || '').trim();
  if (g === 'ذكر' || g === 'Male' || g === 'male' || g === 'M') return '👨 ' + (entry.m || '');
  if (g === 'أنثى' || g === 'Female' || g === 'female' || g === 'F') return '👩 ' + (entry.f || '');
  return '👨 ' + entry.m + '\n👩 ' + entry.f;

  // Auto-load diagnosis templates on page render
  setTimeout(() => { if (document.getElementById("drDiagTemplate")) loadDiagTemplates(); }, 500);
};

async function renderLab(el) {
  const [orders, patients] = await Promise.all([API.get('/api/lab/orders'), API.get('/api/patients')]);
  el.innerHTML = `<div class="page-title">🔬 ${tr('Laboratory', 'المختبر')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">${tr('Pending', 'بالانتظار')}</div><div class="stat-value">${orders.filter(o => o.status === 'Requested').length}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">${tr('In Progress', 'قيد العمل')}</div><div class="stat-value">${orders.filter(o => o.status === 'In Progress').length}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><div class="stat-label">${tr('Completed', 'مكتمل')}</div><div class="stat-value">${orders.filter(o => o.status === 'Done').length}</div></div>
    </div>
    <div class="split-layout">
      <div class="card" style="flex:1">
        <div class="card-title">➕ ${tr('Direct Lab Order', 'إنشاء طلب فحص')}</div>
        <div class="form-group mb-12"><label>${tr('Select Patient (Optional)', 'اختر مريض (اختياري)')}</label>
          <select class="form-input" id="labPatientId"><option value="">--</option>${patients.map(p => `<option value="${p.id}">${p.name_ar || p.name_en}</option>`).join('')}</select>
        </div>
        <div class="form-group mb-12"><label>${tr('Test Name', 'اسم التحليل')}</label>
          <select class="form-input" id="labDirectType">
            <optgroup label="${tr('Hematology', 'أمراض الدم')}">
              <option>CBC (Complete Blood Count)</option>
              <option>ESR (Erythrocyte Sedimentation Rate)</option>
              <option>Coagulation Profile (PT, PTT, INR)</option>
              <option>Blood Film / Reticulocyte Count</option>
              <option>Hemoglobin Electrophoresis</option>
              <option>G6PD Deficiency Test</option>
              <option>Sickle Cell Test</option>
              <option>Bleeding Time / Clotting Time</option>
              <option>D-Dimer</option>
            </optgroup>
            <optgroup label="${tr('Biochemistry', 'الكيمياء الحيوية')}">
              <option>Comprehensive Metabolic Panel (CMP)</option>
              <option>Basic Metabolic Panel (BMP)</option>
              <option>Fasting Blood Sugar (FBS)</option>
              <option>Random Blood Sugar (RBS)</option>
              <option>Oral Glucose Tolerance Test (OGTT)</option>
              <option>HbA1c (Glycated Hemoglobin)</option>
              <option>Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)</option>
              <option>Renal Profile (Urea, Creatinine, Electrolytes: Na, K, Cl)</option>
              <option>Liver Function Test (LFT: ALT, AST, ALP, Total/Direct Bilirubin, Albumin, Total Protein)</option>
              <option>Cardiac Enzymes (Troponin T/I, CK-MB, CK-Total, LDH)</option>
              <option>Uric Acid</option>
              <option>Calcium / Phosphorus / Magnesium</option>
              <option>Iron Profile (Serum Iron, TIBC, Ferritin, Transferrin)</option>
              <option>Vitamin D3 (25-OH Cholecalciferol)</option>
              <option>Vitamin B12 / Folate</option>
              <option>Amylase / Lipase</option>
              <option>Serum Osmolality</option>
            </optgroup>
            <optgroup label="${tr('Hormones & Endocrinology', 'الهرمونات والغدد')}">
              <option>Thyroid Profile (TSH, Free T3, Free T4, Total T3, Total T4)</option>
              <option>Fertility Hormones (FSH, LH, Prolactin, Testosterone (Free/Total), Estradiol E2, Progesterone)</option>
              <option>Beta-hCG (Pregnancy Test - Blood Qualitative/Quantitative)</option>
              <option>Cortisol (AM/PM)</option>
              <option>Insulin (Fasting/Random)</option>
              <option>Parathyroid Hormone (PTH)</option>
              <option>Growth Hormone (GH)</option>
              <option>ACTH</option>
              <option>C-Peptide</option>
              <option>Anti-Mullerian Hormone (AMH)</option>
              <option>Aldosterone / Renin</option>
              <option>DHEA-S (Dehydroepiandrosterone Sulfate)</option>
              <option>17-OH Progesterone</option>
              <option>Calcitonin</option>
            </optgroup>
            <optgroup label="${tr('Immunology & Serology', 'المناعة والأمصال')}">
              <option>CRP (C-Reactive Protein - Qualitative/Quantitative)</option>
              <option>Rheumatoid Factor (RF)</option>
              <option>Anti-CCP (Anti-Cyclic Citrullinated Peptide)</option>
              <option>ANA (Anti-Nuclear Antibody) / Anti-dsDNA</option>
              <option>ANCA (Anti-Neutrophil Cytoplasmic Antibody)</option>
              <option>Anti-Scl-70 / Anti-Centromere</option>
              <option>ASO Titer</option>
              <option>Hepatitis Profile (HBsAg, HBsAb, HCV Ab, HAV IgM/IgG)</option>
              <option>HIV 1 & 2 Abs/Ag</option>
              <option>VDRL / RPR (Syphilis)</option>
              <option>Widal Test (Typhoid)</option>
              <option>Brucella (Abortus/Melitensis)</option>
              <option>Dengue NS1 Ag / IgM / IgG</option>
              <option>Toxoplasmosis (IgG/IgM)</option>
              <option>Rubella (IgG/IgM)</option>
              <option>Cytomegalovirus CMV (IgG/IgM)</option>
              <option>Herpes Simplex Virus HSV 1/2 (IgG/IgM)</option>
              <option>EBV (Epstein-Barr Virus)</option>
              <option>Celiac Disease Panel (Anti-tTG, Anti-Endomysial)</option>
              <option>Food Allergy Panel (IgE)</option>
              <option>Inhalant Allergy Panel (IgE)</option>
              <option>Flow Cytometry (Immunophenotyping / CD4 Count)</option>
            </optgroup>
            <optgroup label="${tr('Microbiology & Parasitology', 'الأحياء الدقيقة والطفيليات')}">
              <option>Urine Analysis (Routine & Microscopic)</option>
              <option>Urine Culture & Sensitivity</option>
              <option>Stool Analysis (Routine & Microscopic)</option>
              <option>Stool Culture</option>
              <option>Stool Occult Blood</option>
              <option>H. Pylori (Ag in Stool / Ab in Blood)</option>
              <option>Throat Swab Culture</option>
              <option>Sputum Culture & AFB (Tuberculosis)</option>
              <option>Wound/Pus Swab Culture</option>
              <option>Blood Culture (Aerobic/Anaerobic)</option>
              <option>Ear/Eye/Nasal Swab Culture</option>
              <option>High Vaginal Swab (HVS) Culture</option>
              <option>Urethral Swab Culture</option>
              <option>Fungal Culture (Skin/Nail/Hair)</option>
              <option>Malaria Film</option>
              <option>QuantiFERON-TB Gold / TB Spot</option>
              <option>Chlamydia trachomatis (PCR/Ag)</option>
              <option>Neisseria Gonorrhoeae (PCR/Culture)</option>
              <option>CSF Analysis (Cell Count, Protein, Glucose)</option>
              <option>Synovial Fluid Analysis</option>
              <option>Semen Analysis (Spermogram)</option>
            </optgroup>
            <optgroup label="${tr('Tumor Markers', 'دلالات الأورام')}">
              <option>PSA (Prostate Specific Antigen - Total/Free)</option>
              <option>CEA (Carcinoembryonic Antigen)</option>
              <option>CA 125 (Ovarian)</option>
              <option>CA 15-3 (Breast)</option>
              <option>CA 19-9 (Pancreatic/GI)</option>
              <option>AFP (Alpha-Fetoprotein)</option>
              <option>Beta-2 Microglobulin</option>
              <option>Thyroglobulin</option>
            </optgroup>
            <optgroup label="${tr('Molecular Diagnostics / PCR', 'التشخيص الجزيئي / PCR')}">
              <option>COVID-19 PCR</option>
              <option>HCV RNA PCR (Quantitative)</option>
              <option>HBV DNA PCR (Quantitative)</option>
              <option>HIV RNA PCR (Quantitative)</option>
              <option>Respiratory Pathogen Panel (PCR)</option>
              <option>HPV DNA Typing</option>
            </optgroup>
            <optgroup label="${tr('Histopathology / Cytology', 'علم الأنسجة والخلايا')}">
              <option>Pap Smear</option>
              <option>Biopsy Specimen Examination</option>
              <option>FNAC (Fine Needle Aspiration Cytology)</option>
              <option>Fluid Cytology (Pleural, Ascitic, CSF)</option>
            </optgroup>
            <optgroup label="${tr('Blood Bank / Transfusion', 'بنك الدم / نقل الدم')}">
              <option>Blood Group (ABO) & Rh Typing</option>
              <option>Crossmatch (Major & Minor)</option>
              <option>Direct Coombs Test (DAT)</option>
              <option>Indirect Coombs Test (IAT)</option>
              <option>Antibody Screening Panel</option>
              <option>Cold Agglutinins</option>
            </optgroup>
            <optgroup label="${tr('Blood Gas & Electrolytes', 'غازات الدم والشوارد')}">
              <option>Arterial Blood Gas (ABG)</option>
              <option>Venous Blood Gas (VBG)</option>
              <option>Lactate (Lactic Acid)</option>
              <option>Ionized Calcium</option>
              <option>Methemoglobin / Carboxyhemoglobin</option>
            </optgroup>
            <optgroup label="${tr('Therapeutic Drug Monitoring', 'مراقبة مستوى الأدوية')}">
              <option>Digoxin Level</option>
              <option>Phenytoin (Dilantin) Level</option>
              <option>Valproic Acid Level</option>
              <option>Carbamazepine Level</option>
              <option>Lithium Level</option>
              <option>Vancomycin Level (Trough/Peak)</option>
              <option>Gentamicin / Amikacin Level</option>
              <option>Theophylline Level</option>
              <option>Methotrexate Level</option>
              <option>Tacrolimus / Cyclosporine Level</option>
            </optgroup>
            <optgroup label="${tr('Special Chemistry', 'كيمياء متخصصة')}">
              <option>Protein Electrophoresis (SPEP)</option>
              <option>Immunoglobulins (IgA, IgG, IgM, IgE)</option>
              <option>Complement C3 / C4</option>
              <option>Ammonia Level</option>
              <option>Homocysteine</option>
              <option>Ceruloplasmin / Copper</option>
              <option>Lactate Dehydrogenase (LDH)</option>
              <option>Haptoglobin</option>
              <option>Procalcitonin (PCT)</option>
              <option>BNP / NT-proBNP</option>
              <option>Fibrinogen</option>
              <option>Anti-Xa (Heparin) Assay</option>
              <option>Cystatin C</option>
              <option>Microalbumin (Urine)</option>
              <option>24hr Urine Protein / Creatinine Clearance</option>
              <option>Serum Free Light Chains (Kappa/Lambda)</option>
            </optgroup>
            <optgroup label="${tr('Toxicology & Trace Elements', 'السموم والعناصر الدقيقة')}">
              <option>Myoglobin</option>
              <option>Vitamin A (Retinol)</option>
              <option>Zinc Level</option>
              <option>Selenium Level</option>
              <option>Lead Level (Blood)</option>
              <option>Mercury Level (Blood)</option>
              <option>Urine Drug Screen (UDS)</option>
              <option>Serum Ethanol (Alcohol) Level</option>
              <option>Acetaminophen (Paracetamol) Level</option>
              <option>Salicylate (Aspirin) Level</option>
            </optgroup>
            <optgroup label="${tr('Other', 'أخرى')}">
              <option>${tr('Other Specific Test (Specify in details)', 'فحص آخر (حدد في التفاصيل)')}</option>
            </optgroup>
          </select>
        </div>
        <div class="form-group mb-12"><label>${tr('Details', 'التفاصيل')}</label><input class="form-input" id="labDirectDesc"></div>
        <button class="btn btn-success w-full" onclick="sendDirectLab()">🔬 ${tr('Direct Lab Order', 'طلب مباشر')}</button>
      </div>
      <div class="flex-column" style="flex:2">
        <div class="card mb-16">
          <div class="card-title">📊 ${tr('Barcode Scanner', 'قارئ الباركود')}</div>
          <div class="flex gap-8"><input class="form-input" id="labBarcodeInput" placeholder="${tr('Scan barcode or enter order ID...', 'امسح الباركود أو ادخل رقم الطلب...')}" style="flex:3" onkeydown="if(event.key==='Enter')scanLabBarcode()"><button class="btn btn-primary" onclick="scanLabBarcode()" style="flex:1">🔍 ${tr('Search', 'بحث')}</button></div>
          <div id="labScanResult" class="mt-16"></div>
        </div>
        <div class="card">
          <div class="card-title">📋 ${tr('Lab Orders', 'طلبات المختبر')}</div>
          <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'labT')">
          <div id="labT"><div class="table-wrapper"><table class="data-table"><thead><tr>
            <th>${tr('Barcode', 'الباركود')}</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Type', 'النوع')}</th><th>${tr('Normal Range', 'المعدل الطبيعي')}</th><th>${tr('Status', 'الحالة')}</th><th>${tr('Date', 'التاريخ')}</th><th>${tr('Report & Results', 'التقرير والنتائج')}</th><th>${tr('Actions', 'إجراءات')}</th>
          </tr></thead><tbody>
          ${orders.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-dim)">📭 ${tr('No orders', 'لا توجد طلبات')}</td></tr>` : orders.map(o => {
    const pt = patients.find(p => p.id == o.patient_id);
    const nRange = getLabNormalRange(o.order_type, pt ? pt.gender : ''); return `<tr>
            <td><svg id="labBC${o.id}" class="barcode-svg"></svg><br><button class="btn btn-sm btn-info" onclick="printLabBarcode(${o.id}, '${(o.patient_name || '').replace(/'/g, '\\')}', '${(o.order_type || '').replace(/'/g, '\\')}')" style="margin-top:4px;font-size:11px">🖨️ ${tr('Print', 'طباعة')}</button></td>
            <td>${o.patient_name || ''}</td><td>${o.order_type}</td>
            <td style="font-size:11px;max-width:200px;color:var(--text-dim);white-space:pre-wrap">${nRange || '-'}</td>
            <td>${statusBadge(o.status)}</td><td>${o.created_at ? new Date(o.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}</td>
            <td>${o.status === 'Done' && o.results ? `<div style="max-width:200px;padding:6px 10px;background:var(--hover);border-radius:6px;font-size:12px;white-space:pre-wrap">${o.results}</div>` : o.status !== 'Requested' ? `<textarea class="form-input form-textarea" id="labRpt${o.id}" rows="2" placeholder="${tr('Write report...', 'اكتب التقرير...')}" style="min-height:60px;font-size:12px">${o.results || ''}</textarea><button class="btn btn-sm btn-primary mt-8" onclick="saveLabReport(${o.id})">💾 ${tr('Save', 'حفظ')}</button>` : `<span style="color:var(--text-dim)">—</span>`}</td>
            <td>${o.status !== 'Done' ? `<button class="btn btn-sm btn-success" onclick="updateLabStatus(${o.id},'${o.status === 'Requested' ? 'In Progress' : 'Done'}')">▶ ${o.status === 'Requested' ? tr('Start', 'بدء') : tr('Complete', 'إتمام')}</button>` : `<span class="badge badge-success">✅</span>`}</td>
          </tr>`;
  }).join('')}
          </tbody></table></div></div>
        </div>
      </div>
    </div>`;
  setTimeout(() => { orders.forEach(o => { try { JsBarcode('#labBC' + o.id, 'LAB-' + o.id + '-' + (o.patient_name || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8), { format: 'CODE128', width: 1.2, height: 35, fontSize: 9, displayValue: true, margin: 2, textMargin: 1 }); } catch (e) { } }); }, 100);
}
window.printLabBarcode = (orderId, patientName, testType) => {
  const svgEl = document.getElementById('labBC' + orderId);
  if (!svgEl) { showToast(tr('Barcode not found', 'الباركود غير موجود'), 'error'); return; }
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const printWin = window.open('', '_blank', 'width=450,height=350');
  printWin.document.write(`<!DOCTYPE html><html><head><title>Lab Barcode</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;text-align:center;padding:20px;margin:0}
    .label{border:2px solid #333;border-radius:10px;padding:20px;display:inline-block;min-width:300px}
    .clinic{font-size:16px;font-weight:bold;color:#1e40af;margin-bottom:8px}
    .patient{font-size:14px;margin:8px 0;color:#333}
    .test{font-size:13px;color:#666;margin:4px 0}
    .date{font-size:11px;color:#999;margin-top:8px}
    @media print{body{padding:5px}.label{border:2px solid #000}}
    </style></head><body>
    <div class="label">
      <div class="clinic">المركز الطبي - Medical Center</div>
      <div style="margin:10px 0">${svgData}</div>
      <div class="patient">👤 ${patientName}</div>
      <div class="test">🔬 ${testType}</div>
      <div class="date">📅 ${new Date().toLocaleDateString('en-CA')}</div>
    </div>
    <script>setTimeout(()=>{window.print();},300);<\/script></body></html>`);
  printWin.document.close();
};
window.updateLabStatus = async (id, status) => {
  try { await API.put(`/api/lab/orders/${id}`, { status }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(4); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveLabReport = async (id) => {
  const rpt = document.getElementById('labRpt' + id).value.trim();
  if (!rpt) { showToast(tr('Write the report first', 'اكتب التقرير أولاً'), 'error'); return; }
  try {
    // Get test name for critical value check
    const orderRow = document.getElementById('labRpt' + id)?.closest('tr') || document.getElementById('labRpt' + id)?.closest('.card');
    const testName = orderRow?.querySelector('td')?.textContent || orderRow?.querySelector('.badge')?.textContent || '';
    const critical = checkCriticalLabValue(testName, rpt);
    if (critical) {
      alert('🚨🔴 ' + tr('CRITICAL VALUE ALERT!', 'تنبيه قيمة حرجة!') + '\n\n' + critical.test + ': ' + critical.value + ' ' + (critical.range.unit || '') + '\n' + tr('Status: ', 'الحالة: ') + critical.status + '\n' + tr('Normal range: ', 'المعدل الطبيعي: ') + critical.range.low + ' - ' + critical.range.high + ' ' + (critical.range.unit || '') + '\n\n' + tr('Please notify the attending physician immediately!', 'يرجى إبلاغ الطبيب المعالج فوراً!'));
    }
    await API.put(`/api/lab/orders/${id}`, { results: rpt });
    showToast(critical ? tr('⚠️ Report saved - CRITICAL VALUE!', '⚠️ تم حفظ التقرير - قيمة حرجة!') : tr('Report saved!', 'تم حفظ التقرير!'), critical ? 'error' : 'success');
    await navigateTo(4);
  }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.sendDirectLab = async () => {
  try {
    await API.post('/api/lab/orders/direct', { patient_id: document.getElementById('labPatientId')?.value || '', order_type: document.getElementById('labDirectType').value, description: document.getElementById('labDirectDesc')?.value || '' });
    showToast(tr('Lab order created!', 'تم إنشاء الطلب!')); await navigateTo(4);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
async function loadPendingPaymentOrders() {
  try {
    const orders = await API.get('/api/orders/pending-payment');
    const container = document.getElementById('pendingPaymentTable');
    if (!container) return;
    if (!orders.length) {
      container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-dim)">✅ ${tr('No pending payment orders', 'لا توجد طلبات بانتظار السداد')}</div>`;
      return;
    }
    container.innerHTML = `<div class="table-wrapper"><table class="data-table"><thead><tr>
      <th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('File #', 'رقم الملف')}</th>
      <th>${tr('Dept', 'القسم')}</th><th>${tr('Test/Scan', 'الفحص/الأشعة')}</th>
      <th>${tr('Details', 'التفاصيل')}</th><th>${tr('Date', 'التاريخ')}</th>
      <th>${tr('Action', 'إجراء')}</th>
    </tr></thead><tbody>
    ${orders.map(o => `<tr style="background:${o.is_radiology ? '#fef9c3' : '#dbeafe'}">
      <td>${o.id}</td>
      <td><strong>${o.patient_name || o.name_en || ''}</strong></td>
      <td>${o.file_number || ''}</td>
      <td>${o.is_radiology ? `<span class="badge badge-warning">📡 ${tr('Radiology', 'أشعة')}</span>` : `<span class="badge badge-info">🔬 ${tr('Lab', 'مختبر')}</span>`}</td>
      <td>${o.order_type || ''}</td>
      <td>${o.description || ''}</td>
      <td>${o.created_at?.split('T')[0] || ''}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="approveOrderPayment(${o.id}, '${(o.patient_name || o.name_en || '').replace(/'/g, "\\'")}', '${(o.order_type || '').replace(/'/g, "\\'")}', ${o.is_radiology})">
          💵 ${tr('Pay & Approve', 'سداد وتحويل')}
        </button>
      </td>
    </tr>`).join('')}
    </tbody></table></div>`;
  } catch (e) { console.error(e); }
}
window.approveOrderPayment = async (orderId, patientName, testType, isRad) => {
  const deptName = isRad ? tr('Radiology', 'الأشعة') : tr('Lab', 'المختبر');
  const price = prompt(`${tr('Enter price for', 'أدخل سعر')} "${testType}" ${tr('for patient', 'للمريض')} ${patientName}:\n(${tr('Enter 0 for free', 'أدخل 0 لو مجاني')})`);
  if (price === null) return;
  const priceNum = parseFloat(price) || 0;
  const payMethod = priceNum > 0 ? (prompt(`${tr('Payment method', 'طريقة السداد')}:\n1 = ${tr('Cash', 'كاش')}\n2 = ${tr('Card/POS', 'شبكة')}\n3 = ${tr('Transfer', 'تحويل')}`) || '1') : '1';
  const methods = { '1': 'Cash', '2': 'Card', '3': 'Transfer' };
  try {
    await API.put(`/api/orders/${orderId}/approve-payment`, { price: priceNum, payment_method: methods[payMethod] || 'Cash' });
    showToast(`✅ ${tr('Paid & sent to', 'تم السداد والتحويل إلى')} ${deptName}!`, 'success');
    loadPendingPaymentOrders();
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.scanLabBarcode = async () => {
  const code = document.getElementById('labBarcodeInput').value.trim(); if (!code) return;
  const m = code.match(/LAB-(\d+)/); const oid = m ? m[1] : code;
  try {
    const orders = await API.get('/api/lab/orders'); const o = orders.find(x => x.id == oid);
    document.getElementById('labScanResult').innerHTML = o ? `<div class="card" style="border:2px solid var(--accent);margin-top:12px"><div class="card-title">🔍 ${tr('Order Found', 'تم العثور على الطلب')} #${o.id}</div><div class="flex gap-8" style="flex-wrap:wrap"><span class="badge badge-info">👤 </span><span class="badge badge-purple">🔬 ${o.order_type}</span>${statusBadge(o.status)}</div>${getLabNormalRange(o.order_type) ? `<div style="margin-top:8px;padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:11px">📊 <strong>${tr('Normal Range', 'المعدل الطبيعي')}:</strong> ${getLabNormalRange(o.order_type)}</div>` : ''}${o.results ? `<div class="mt-16" style="padding:12px;background:var(--hover);border-radius:8px"><strong>${tr('Report:', 'التقرير:')}</strong><br><pre style="white-space:pre-wrap;margin:4px 0 0">${o.results}</pre></div>` : ''}</div>` : `<div class="badge badge-danger mt-16">${tr('Order not found', 'الطلب غير موجود')}</div>`;
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== RADIOLOGY =====
// Helper: parse results for image tags and render them
function renderRadResults(results) {
  if (!results) return '';
  const parts = results.split('\n');
  let html = '';
  parts.forEach(p => {
    const imgMatch = p.match(/\[IMG:(.*?)\]/);
    if (imgMatch) {
      html += `<a href="${imgMatch[1]}" target="_blank"><img src="${imgMatch[1]}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;border:2px solid var(--border);cursor:pointer;margin:2px" title="${tr('Click to enlarge', 'اضغط للتكبير')}"></a>`;
    } else if (p.trim()) {
      html += `<div style="font-size:12px;color:var(--text)">${p}</div>`;
    }
  });
  return html;
}
async function renderRadiology(el) {
  const [orders, patients] = await Promise.all([API.get('/api/radiology/orders'), API.get('/api/patients')]);
  el.innerHTML = `<div class="page-title">📡 ${tr('Radiology', 'الأشعة')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">${tr('Pending', 'بالانتظار')}</div><div class="stat-value">${orders.filter(o => o.status === 'Requested').length}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">${tr('In Progress', 'قيد العمل')}</div><div class="stat-value">${orders.filter(o => o.status === 'In Progress').length}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><div class="stat-label">${tr('Completed', 'مكتمل')}</div><div class="stat-value">${orders.filter(o => o.status === 'Done').length}</div></div>
    </div>
    <div class="split-layout">
      <div class="card" style="flex:1">
        <div class="card-title">➕ ${tr('Direct Radiology Order', 'إنشاء طلب أشعة')}</div>
        <div class="form-group mb-12"><label>${tr('Select Patient (Optional)', 'اختر مريض (اختياري)')}</label>
          <select class="form-input" id="radPatientId"><option value="">--</option>${patients.map(p => `<option value="${p.id}">${p.name_ar || p.name_en}</option>`).join('')}</select>
        </div>
        <div class="form-group mb-12"><label>${tr('Scan Type', 'نوع الأشعة')}</label>
          <select class="form-input" id="radDirectType">
            <optgroup label="${tr('X-Ray', 'الأشعة السينية')}">
              <option>X-Ray Chest (PA/LAT)</option>
              <option>X-Ray Abdomen (Erect/Supine)</option>
              <option>X-Ray KUB (Kidney, Ureter, Bladder)</option>
              <option>X-Ray Cervical Spine (AP/LAT/Open Mouth)</option>
              <option>X-Ray Thoracic Spine</option>
              <option>X-Ray Lumbar Spine (AP/LAT)</option>
              <option>X-Ray Pelvis (AP)</option>
              <option>X-Ray Skull / Facial Bones / PNS</option>
              <option>X-Ray Shoulder / Clavicle</option>
              <option>X-Ray Arm (Humerus/Radius/Ulna)</option>
              <option>X-Ray Hand / Wrist</option>
              <option>X-Ray Hip/Femur</option>
              <option>X-Ray Knee (AP/LAT/Skyline)</option>
              <option>X-Ray Ankle / Foot</option>
              <option>X-Ray Bone Age</option>
            </optgroup>
            <optgroup label="${tr('Ultrasound', 'الموجات فوق الصوتية / السونار')}">
              <option>Ultrasound Abdomen (Whole)</option>
              <option>Ultrasound Pelvis (Transabdominal/Transvaginal)</option>
              <option>Ultrasound Abdomen & Pelvis</option>
              <option>Ultrasound KUB / Prostate</option>
              <option>Ultrasound Thyroid / Neck</option>
              <option>Ultrasound Breast</option>
              <option>Ultrasound Scrotum / Testicular</option>
              <option>Obstetric Ultrasound (1st Trimester/Viability)</option>
              <option>Obstetric Ultrasound (Anomaly Scan 2nd Trimester)</option>
              <option>Obstetric Ultrasound (Growth 3rd Trimester)</option>
              <option>Folliculometry (Ovulation Tracking)</option>
              <option>Ultrasound Soft Tissue / Swelling</option>
              <option>Doppler Ultrasound - Carotid</option>
              <option>Doppler Ultrasound - Lower Limb Venous (DVT)</option>
              <option>Doppler Ultrasound - Lower Limb Arterial</option>
              <option>Doppler Ultrasound - Renal Artery</option>
              <option>Doppler Ultrasound - Obstetrics / Umbilical Artery</option>
              <option>Echocardiogram (Echo - Heart)</option>
            </optgroup>
            <optgroup label="${tr('CT Scan', 'الأشعة المقطعية')}">
              <option>CT Brain / Head (Without Contrast)</option>
              <option>CT Brain / Head (With Contrast)</option>
              <option>CT PNS (Paranasal Sinuses)</option>
              <option>CT Neck (With Contrast)</option>
              <option>CT Chest (HRCT) Without Contrast</option>
              <option>CT Chest / Lungs (With Contrast)</option>
              <option>CT Abdomen & Pelvis (Without Contrast - Triphasic)</option>
              <option>CT Abdomen & Pelvis (With Contrast)</option>
              <option>CT KUB (Stone Protocol - Non Contrast)</option>
              <option>CT Urography (With Contrast)</option>
              <option>CT Cervical Spine</option>
              <option>CT Lumbar Spine</option>
              <option>CT Angiography - Pulmonary (CTPA)</option>
              <option>CT Angiography - Brain</option>
              <option>CT Angiography - Aorta / Lower Limbs</option>
              <option>CT Virtual Colonoscopy</option>
            </optgroup>
            <optgroup label="${tr('MRI', 'الرنين المغناطيسي')}">
              <option>MRI Brain (Without Contrast)</option>
              <option>MRI Brain (With Contrast)</option>
              <option>MRI Pituitary Fossa</option>
              <option>MRI Cervical Spine</option>
              <option>MRI Thoracic Spine</option>
              <option>MRI Lumbar Spine</option>
              <option>MRI Whole Spine</option>
              <option>MRI Pelvis (Male/Female)</option>
              <option>MRI Prostate (Multiparametric)</option>
              <option>MRI Shoulder Joint</option>
              <option>MRI Knee Joint</option>
              <option>MRI Ankle / Wrist Joint</option>
              <option>MRI Abdomen</option>
              <option>MRCP (Magnetic Resonance Cholangiopancreatography)</option>
              <option>MR Venography (MRV)</option>
              <option>MRA (Magnetic Resonance Angiography) - Brain</option>
            </optgroup>
            <optgroup label="${tr('Specialized Imaging & Scans', 'تصوير متخصص والمناظير')}">
              <option>Mammogram (Bilateral/Unilateral)</option>
              <option>DEXA Scan (Bone Density)</option>
              <option>Fluoroscopy - Barium Swallow</option>
              <option>Fluoroscopy - Barium Meal / Follow Through</option>
              <option>Fluoroscopy - Barium Enema</option>
              <option>Fluoroscopy - HSG (Hysterosalpingography)</option>
              <option>Fluoroscopy - IVP (Intravenous Pyelogram)</option>
              <option>Panoramic Dental X-Ray (OPG)</option>
              <option>Cephalometric X-Ray</option>
              <option>CBCT (Cone Beam CT for Dentistry)</option>
              <option>PET Scan (Positron Emission Tomography)</option>
            </optgroup>
            <optgroup label="${tr('Cardiology & Neuro', 'قلب وأعصاب وأجهزة أخرى')}">
              <option>ECG (Electrocardiogram)</option>
              <option>Holter Monitor (24/48 Hours)</option>
              <option>Ambulatory Blood Pressure Monitoring (ABPM)</option>
              <option>Treadmill Stress Test (TMT)</option>
              <option>EEG (Electroencephalogram)</option>
              <option>EMG (Electromyography) / NCS</option>
              <option>Spirometry / Lung Function Test</option>
              <option>Upper GI Endoscopy (OGD)</option>
              <option>Colonoscopy</option>
            </optgroup>
            <optgroup label="${tr('Other', 'أخرى')}">
              <option>${tr('Other Scan (Specify in details)', 'تصوير آخر (حدد في التفاصيل)')}</option>
            </optgroup>
          </select>
        </div>
        <div class="form-group mb-12"><label>${tr('Details', 'التفاصيل')}</label><input class="form-input" id="radDirectDesc"></div>
        <button class="btn btn-success w-full" onclick="sendDirectRad()">📡 ${tr('Send to Radiology', 'إنشاء الطلب')}</button>
      </div>
      <div class="flex-column" style="flex:2">
        <div class="card mb-16">
          <div class="card-title">📊 ${tr('Barcode Scanner', 'قارئ الباركود')}</div>
          <div class="flex gap-8"><input class="form-input" id="radBarcodeInput" placeholder="${tr('Scan barcode or enter order ID...', 'امسح الباركود أو ادخل رقم الطلب...')}" style="flex:3" onkeydown="if(event.key==='Enter')scanRadBarcode()"><button class="btn btn-primary" onclick="scanRadBarcode()" style="flex:1">🔍 ${tr('Search', 'بحث')}</button></div>
          <div id="radScanResult" class="mt-16"></div>
        </div>
        <div class="card">
          <div class="card-title">📋 ${tr('Radiology Orders', 'طلبات الأشعة')}</div>
          <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'radT')">
          <div id="radT"><div class="table-wrapper"><table class="data-table"><thead><tr>
            <th>${tr('Barcode', 'الباركود')}</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Type', 'النوع')}</th><th>${tr('Status', 'الحالة')}</th><th>${tr('Date', 'التاريخ')}</th><th>${tr('Report & Images', 'التقرير والصور')}</th><th>${tr('Actions', 'إجراءات')}</th>
          </tr></thead><tbody>
          ${orders.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-dim)">📭 ${tr('No orders', 'لا توجد طلبات')}</td></tr>` : orders.map(o => `<tr>
            <td><svg id="radBC${o.id}" class="barcode-svg"></svg></td>
            <td>${o.patient_name || ''}</td><td>${o.order_type}</td>
            <td>${statusBadge(o.status)}</td><td>${o.created_at?.split('T')[0] || ''}</td>
            <td>
              ${o.status === 'Done' ? `<div style="max-width:250px">${renderRadResults(o.results)}</div>` :
      o.status !== 'Requested' ? `
                <textarea class="form-input form-textarea" id="radRpt${o.id}" rows="2" placeholder="${tr('Write report...', 'اكتب التقرير...')}" style="min-height:50px;font-size:12px">${(o.results || '').replace(/\[IMG:.*?\]\n?/g, '')}</textarea>
                <div class="flex gap-8 mt-8">
                  <button class="btn btn-sm btn-primary" onclick="saveRadReport(${o.id})">💾 ${tr('Save', 'حفظ')}</button>
                  <label class="btn btn-sm btn-success" style="cursor:pointer">📷 ${tr('Upload Image', 'رفع صورة')}<input type="file" accept="image/*" style="display:none" onchange="uploadRadImage(${o.id}, this)"></label>
                </div>
                <div class="mt-8">${renderRadResults(o.results)}</div>` : `<span style="color:var(--text-dim)">—</span>`}
            </td>
            <td>${o.status !== 'Done' ? `<button class="btn btn-sm btn-success" onclick="updateRadStatus(${o.id},'${o.status === 'Requested' ? 'In Progress' : 'Done'}')">▶ ${o.status === 'Requested' ? tr('Start', 'بدء') : tr('Complete', 'إتمام')}</button>` : `<span class="badge badge-success">✅</span>`}</td>
          </tr>`).join('')}
          </tbody></table></div></div>
        </div>
      </div>
    </div>`;
  setTimeout(() => { orders.forEach(o => { try { JsBarcode('#radBC' + o.id, 'RAD-' + o.id + '-' + (o.patient_name || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8), { format: 'CODE128', width: 1.2, height: 35, fontSize: 9, displayValue: true, margin: 2, textMargin: 1 }); } catch (e) { } }); }, 100);
}
window.updateRadStatus = async (id, status) => {
  try { await API.put(`/api/radiology/orders/${id}`, { status }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(5); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveRadReport = async (id) => {
  const rpt = document.getElementById('radRpt' + id).value.trim();
  if (!rpt) { showToast(tr('Write the report first', 'اكتب التقرير أولاً'), 'error'); return; }
  try { await API.put(`/api/radiology/orders/${id}`, { result: rpt }); showToast(tr('Report saved!', 'تم حفظ التقرير!')); await navigateTo(5); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.uploadRadImage = async (id, input) => {
  if (!input.files[0]) return;
  const fd = new FormData();
  fd.append('image', input.files[0]);
  try {
    const res = await fetch(`/api/radiology/orders/${id}/upload`, { method: 'POST', body: fd, credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/login.html'; return; }
    const data = await res.json();
    if (data.success) { showToast(tr('Image uploaded!', 'تم رفع الصورة!')); await navigateTo(5); }
    else showToast(tr('Upload failed', 'فشل الرفع'), 'error');
  } catch (e) { showToast(tr('Error uploading', 'خطأ في الرفع'), 'error'); }
};
window.scanRadBarcode = async () => {
  const code = document.getElementById('radBarcodeInput').value.trim(); if (!code) return;
  const m = code.match(/RAD-(\d+)/); const oid = m ? m[1] : code;
  try {
    const orders = await API.get('/api/radiology/orders'); const o = orders.find(x => x.id == oid);
    document.getElementById('radScanResult').innerHTML = o ? `<div class="card" style="border:2px solid var(--accent);margin-top:12px"><div class="card-title">🔍 ${tr('Order Found', 'تم العثور على الطلب')} #${o.id}</div><div class="flex gap-8" style="flex-wrap:wrap"><span class="badge badge-info">👤 </span><span class="badge badge-purple">📡 ${o.order_type}</span>${statusBadge(o.status)}</div>${o.results ? `<div class="mt-16">${renderRadResults(o.results)}</div>` : ''}</div>` : `<div class="badge badge-danger mt-16">${tr('Order not found', 'الطلب غير موجود')}</div>`;
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== PHARMACY =====
async function renderPharmacy(el) {
  const [drugs, queue] = await Promise.all([API.get('/api/pharmacy/drugs'), API.get('/api/pharmacy/queue')]);
  // Helper to find drug price from catalog
  const findDrugPrice = (medName) => {
    if (!medName) return 0;
    const d = drugs.find(x => x.drug_name && medName.toLowerCase().includes(x.drug_name.toLowerCase()));
    return d ? (d.selling_price || 0) : 0;
  };
  el.innerHTML = `<div class="page-title">💊 ${tr('Pharmacy', 'الصيدلية')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">${tr('Pending Prescriptions', 'وصفات بالانتظار')}</div><div class="stat-value">${queue.filter(q => q.status === 'Pending').length}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><div class="stat-label">${tr('Dispensed Today', 'تم صرفها')}</div><div class="stat-value">${queue.filter(q => q.status === 'Dispensed').length}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">${tr('Total Drugs', 'إجمالي الأدوية')}</div><div class="stat-value">${drugs.length}</div></div>
    </div>
    <div class="card mb-16"><div class="card-title">📜 ${tr('Prescription Queue', 'قائمة الوصفات')}</div>
    <div id="rxQueue"><div class="table-wrapper"><table class="data-table"><thead><tr>
      <th>${tr('Barcode', 'الباركود')}</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Prescription', 'الوصفة')}</th><th>${tr('Price', 'السعر')}</th><th>${tr('Status', 'الحالة')}</th><th>${tr('Date', 'التاريخ')}</th><th>${tr('Actions', 'إجراءات')}</th>
    </tr></thead><tbody>
    ${queue.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-dim)">📭 ${tr('No prescriptions', 'لا توجد وصفات')}</td></tr>` : queue.map(q => {
    // Use individual columns if available, fallback to text parsing
    const txt = q.prescription_text || '';
    let parts = txt.includes(' | ') ? txt.split(' | ') : txt.split(' - ');
    const med = (q.medication_name && q.medication_name.trim()) || parts[0] || '';
    const dose = (q.dosage && q.dosage.trim()) || parts[1] || '';
    const qty = (q.quantity_per_day && q.quantity_per_day !== '1' && q.quantity_per_day.trim()) || '1';
    const freq = (q.frequency && q.frequency.trim()) || parts[2] || '';
    const dur = (q.duration && q.duration.trim()) || parts[3] || '';
    const autoPrice = q.price > 0 ? q.price : findDrugPrice(med);
    return `<tr>
        <td><svg id="rxBC${q.id}" class="barcode-svg"></svg><br>
          <button class="btn btn-sm btn-info" onclick="printRxLabel(${q.id}, '${(q.patient_name || '').replace(/'/g, "\\'")}', '${(q.age || '').toString().replace(/'/g, "\\'")}', '${(q.department || '').replace(/'/g, "\\'")}', '${med.replace(/'/g, "\\'")}', '${dose.replace(/'/g, "\\'")}', '${qty.toString().replace(/'/g, "\\'")}', '${freq.replace(/'/g, "\\'")}', '${dur.replace(/'/g, "\\'")}')" style="margin-top:4px;font-size:11px">🖨️ ${tr('Print Label', 'طباعة')}</button>
        </td>
        <td><strong>${q.patient_name || '#' + q.patient_id}</strong>${q.age ? '<br><small>🎂 ' + q.age + '</small>' : ''}${q.department ? '<br><small>🏥 ' + q.department + '</small>' : ''}</td>
        <td style="color:var(--accent);font-weight:600">${q.doctor || q.doctor_name || '—'}</td>
        <td><strong>${med}</strong>${dose ? '<br>💊 ' + dose : ''}${freq ? '<br>🔄 ' + freq : ''}${dur ? '<br>📅 ' + dur : ''}</td>
        <td style="font-weight:bold;color:var(--accent)">${autoPrice > 0 ? autoPrice + ' ' + tr('SAR', 'ر.س') : '-'}</td>
        <td>${statusBadge(q.status)}</td>
        <td>${q.created_at?.split('T')[0] || ''}</td>
        <td>${q.status === 'Pending' ? `<button class="btn btn-sm btn-success" onclick="showDispensePanel(${q.id}, '${(q.patient_name || '').replace(/'/g, "\\'")}', '${med.replace(/'/g, "\\'")}', '${dose.replace(/'/g, "\\'")}', '${qty.toString().replace(/'/g, "\\'")}', '${freq.replace(/'/g, "\\'")}', '${dur.replace(/'/g, "\\'")}', ${q.patient_id || 0}, ${autoPrice}, '${(q.age || '').toString().replace(/'/g, "\\'")}', '${(q.department || '').replace(/'/g, "\\'")}')">💵 ${tr('Dispense & Sell', 'صرف وبيع')}</button>` : `<button class="btn btn-sm btn-info" onclick="printPharmacyInvoice(${q.id}, '${(q.patient_name || '').replace(/'/g, "\\'")}', '${med.replace(/'/g, "\\'")}', '${dose.replace(/'/g, "\\'")}', '${freq.replace(/'/g, "\\'")}', '${dur.replace(/'/g, "\\'")}', ${q.price || 0}, '${(q.payment_method || '').replace(/'/g, "\\'")}')">🧾 ${tr('Print Invoice', 'طباعة فاتورة')}</button>`}</td>
      </tr>`;
  }).join('')}
    </tbody></table></div></div>
    <div id="dispensePanel" style="display:none"></div>
    </div>
    <div class="card mb-16"><div class="card-title">💊 ${tr('Drug Catalog', 'قائمة الأدوية')}</div>
    <div class="flex gap-8 mb-12"><input class="form-input" id="phName" placeholder="${tr('Drug name', 'اسم الدواء')}" style="flex:2"><input class="form-input" id="phPrice" placeholder="${tr('Price', 'السعر')}" type="number" style="flex:1"><input class="form-input" id="phStock" placeholder="${tr('Stock', 'المخزون')}" type="number" style="flex:1"><button class="btn btn-primary" onclick="addDrug()">➕</button></div>
    <input class="search-filter" placeholder="${tr('Search drugs...', 'بحث في الأدوية...')}" oninput="filterTable(this,'phTable')">
    <div id="phTable">${makeTable([tr('Name', 'الاسم'), tr('Category', 'التصنيف'), tr('Price', 'السعر'), tr('Stock', 'المخزون')], drugs.map(d => ({ cells: [d.drug_name, d.category, d.selling_price, d.stock_qty] })))}</div></div>`;
  // Generate barcodes for prescriptions
  setTimeout(() => { queue.forEach(q => { try { JsBarcode('#rxBC' + q.id, 'RX-' + q.id, { format: 'CODE128', width: 1.2, height: 35, fontSize: 9, displayValue: true, margin: 2, textMargin: 1 }); } catch (e) { } }); }, 100);
}
window.printRxLabel = (rxId, patientName, age, dept, med, dose, qty, freq, dur) => {
  const svgEl = document.getElementById('rxBC' + rxId);
  const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : '';
  // Clean dose field from embedded qty if present
  const pureDose = dose.replace(/\s*\(×\d+\)/, '').trim();
  const w = window.open('', '_blank', 'width=520,height=500');
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Rx Label</title>
<style>
@page{size:80mm auto;margin:3mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:10px;direction:rtl;font-size:13px}
.label{border:2px solid #333;border-radius:10px;padding:14px;max-width:420px;margin:0 auto}
.clinic{font-size:15px;font-weight:bold;color:#1a365d;text-align:center;margin-bottom:8px;border-bottom:2px solid #1a365d;padding-bottom:6px}
.barcode-area{text-align:center;margin:8px 0;direction:ltr}
.info-grid{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:12px;margin:8px 0;padding:8px;background:#f7f8fa;border-radius:8px}
.info-grid .lk{font-weight:700;color:#1a365d;white-space:nowrap}
.med-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}
.med-table th{background:#1a365d;color:#fff;padding:5px 4px;text-align:center;font-size:10px}
.med-table td{border:1px solid #ccc;padding:5px 4px;text-align:center;font-weight:600}
.footer{text-align:center;font-size:10px;color:#999;margin-top:8px;border-top:1px dashed #ccc;padding-top:6px}
.no-print{text-align:center;margin-bottom:12px}
@media print{.no-print{display:none!important}body{padding:2px}}
</style></head><body>
<div class="no-print">
  <button onclick="window.print()" style="padding:10px 30px;font-size:14px;background:#1a365d;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ طباعة / Print</button>
  <button onclick="window.close()" style="padding:10px 20px;font-size:14px;background:#dc3545;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:8px">✕</button>
</div>
<div class="label">
  <div class="clinic">💊 المركز الطبي — الصيدلية<br><small style="font-size:11px;color:#666">Medical Center — Pharmacy</small></div>
  <div class="barcode-area">${svgData}</div>
  <div class="info-grid">
    <span class="lk">👤 المريض / Patient:</span><span>${patientName}</span>
    <span class="lk">🎂 العمر / Age:</span><span>${age || '-'}</span>
    <span class="lk">🏥 القسم / Dept:</span><span>${dept || '-'}</span>
    <span class="lk">📅 التاريخ / Date:</span><span>${new Date().toLocaleDateString('ar-SA')}</span>
  </div>
  <table class="med-table">
    <thead><tr>
      <th>💊 الدواء<br>Drug</th>
      <th>📏 الجرعة<br>Dose</th>
      <th>💊 الكمية/يوم<br>Qty/Day</th>
      <th>🔄 المرات<br>Freq</th>
      <th>📅 الأيام<br>Days</th>
    </tr></thead>
    <tbody><tr>
      <td style="font-size:12px;color:#4338ca">${med}</td>
      <td>${pureDose || '-'}</td>
      <td style="font-size:14px;font-weight:bold;color:#e74c3c">${qty}</td>
      <td>${freq || '-'}</td>
      <td>${dur || '-'}</td>
    </tr></tbody>
  </table>
  <div class="footer">Rx #${rxId} | ${new Date().toLocaleDateString('en-CA')} | المركز الطبي</div>
</div>
<script>setTimeout(()=>{window.print();},400);<\\/script>
</body></html>`);
  w.document.close();
};
window.showDispensePanel = (id, patientName, med, dose, qty, freq, dur, patientId, autoPrice, age, dept) => {
  const panel = document.getElementById('dispensePanel');
  panel.style.display = 'block';
  panel.innerHTML = `<div class="card mt-16" style="border:2px solid var(--accent);background:var(--hover)">
    <div class="card-title">💵 ${tr('Confirm Dispense & Sale', 'تأكيد الصرف والبيع')} — RX-${id}</div>
    <div class="flex gap-16" style="flex-wrap:wrap;align-items:flex-end">
      <div style="flex:1;min-width:150px">
        <div style="font-size:13px;margin-bottom:4px"><strong>👤 ${tr('Patient', 'المريض')}:</strong> ${patientName}</div>
        <div style="font-size:13px"><strong>💊 ${tr('Drug', 'الدواء')}:</strong> ${med} ${dose ? '— ' + dose : ''}</div>
        <div style="font-size:13px"><strong>📦 ${tr('Qty/Day', 'الكمية/يوم')}:</strong> ${qty} | <strong>🔄</strong> ${freq} | <strong>📅</strong> ${dur}</div>
      </div>
      <div class="form-group" style="flex:0.5;min-width:120px">
        <label>${tr('Price', 'السعر')} (${tr('SAR', 'ر.س')})</label>
        <input class="form-input" id="dispPrice" type="number" value="${autoPrice}" min="0" step="0.5" style="font-size:16px;font-weight:bold;text-align:center">
      </div>
      <div class="form-group" style="flex:1;min-width:250px">
        <label>${tr('Payment Method', 'طريقة السداد')}</label>
        <div class="flex gap-16" style="margin-top:6px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px"><input type="radio" name="dispPay" value="Cash" checked style="width:18px;height:18px;accent-color:var(--accent,#6c5ce7)"> 💵 ${tr('Cash', 'كاش')}</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px"><input type="radio" name="dispPay" value="Card" style="width:18px;height:18px;accent-color:var(--accent,#6c5ce7)"> 💳 ${tr('POS/Card', 'شبكة')}</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px"><input type="radio" name="dispPay" value="Transfer" style="width:18px;height:18px;accent-color:var(--accent,#6c5ce7)"> 🏦 ${tr('Transfer', 'تحويل')}</label>
        </div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-success" onclick="confirmDispense(${id}, '${patientName.replace(/'/g, "\\'")}', '${med.replace(/'/g, "\\'")}', '${dose.replace(/'/g, "\\'")}', '${qty.toString().replace(/'/g, "\\'")}', '${freq.replace(/'/g, "\\'")}', '${dur.replace(/'/g, "\\'")}', ${patientId}, '${(age || '').toString().replace(/'/g, "\\'")}', '${(dept || '').replace(/'/g, "\\'")}')">✅ ${tr('Confirm & Print', 'تأكيد وطباعة')}</button>
        <button class="btn btn-danger" onclick="document.getElementById('dispensePanel').style.display='none'">✕ ${tr('Cancel', 'إلغاء')}</button>
      </div>
    </div>
  </div>`;
  panel.scrollIntoView({ behavior: 'smooth' });
};
window.confirmDispense = async (id, patientName, med, dose, qty, freq, dur, patientId, age, dept) => {
  const priceNum = parseFloat(document.getElementById('dispPrice').value) || 0;
  const payMethod = document.querySelector('input[name="dispPay"]:checked')?.value || 'Cash';
  try {
    await API.put(`/api/pharmacy/queue/${id}`, { status: 'Dispensed', price: priceNum, payment_method: payMethod, patient_id: patientId });
    // Auto-create invoice for pharmacy sale
    if (priceNum > 0) {
      try { await API.post('/api/invoices', { patient_id: patientId, patient_name: patientName, total: priceNum, description: med + (dose ? ' ' + dose : '') + ' - ' + freq + ' - ' + dur, service_type: 'Pharmacy', payment_method: payMethod }); } catch (ie) { console.log('Invoice error:', ie); }
    }
    showToast(`✅ ${tr('Dispensed & sold!', 'تم الصرف والبيع!')} ${priceNum > 0 ? priceNum + ' ' + tr('SAR', 'ر.س') : tr('Free', 'مجاني')}`, 'success');
    // Auto-print barcode label with all doctor data
    printRxLabel(id, patientName, age, dept, med, dose, qty, freq, dur);
    // Auto-print invoice
    setTimeout(() => { printPharmacyInvoice(id, patientName, med, dose, freq, dur, priceNum, payMethod); }, 800);
    setTimeout(() => navigateTo(6), 1200);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.printPharmacyInvoice = (rxId, patientName, med, dose, freq, dur, price, payMethod) => {
  const w = window.open('', '_blank', 'width=500,height=600');
  const payAr = payMethod === 'Card' ? 'شبكة' : payMethod === 'Transfer' ? 'تحويل' : 'كاش';
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Pharmacy Invoice</title>
<style>
@page{size:80mm auto;margin:3mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:10px;direction:rtl;font-size:13px}
.inv{border:2px solid #333;border-radius:10px;padding:16px;max-width:400px;margin:0 auto}
.header{text-align:center;border-bottom:2px solid #1a365d;padding-bottom:8px;margin-bottom:10px}
.header h2{color:#1a365d;margin:0;font-size:16px}
.header small{color:#666;font-size:11px}
.row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px dotted #ddd}
.row .k{font-weight:700;color:#1a365d}
.med-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
.med-tbl th{background:#1a365d;color:#fff;padding:6px;text-align:center}
.med-tbl td{border:1px solid #ccc;padding:6px;text-align:center;font-weight:600}
.total-box{background:#eef2ff;border:2px solid #6366f1;border-radius:8px;padding:10px;text-align:center;margin:10px 0;font-size:16px;font-weight:bold;color:#4338ca}
.footer{text-align:center;font-size:10px;color:#999;margin-top:10px;border-top:1px dashed #ccc;padding-top:6px}
.no-print{text-align:center;margin-bottom:12px}
@media print{.no-print{display:none!important}body{padding:2px}}
</style></head><body>
<div class="no-print">
  <button onclick="window.print()" style="padding:10px 30px;font-size:14px;background:#1a365d;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ طباعة / Print</button>
  <button onclick="window.close()" style="padding:10px 20px;font-size:14px;background:#dc3545;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:8px">✕</button>
</div>
<div class="inv">
  <div class="header"><h2>🏥 المركز الطبي — فاتورة صيدلية</h2><div style="margin-bottom:12px"><button class="btn btn-sm" onclick="toggleCalendarView()" id="calToggleBtn" style="background:#e3f2fd;color:#1565c0">📅 ${tr("Calendar View", "عرض التقويم")}</button></div><div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><button class="btn btn-primary" onclick="callNextPatient()" style="padding:8px 20px;font-size:15px;animation:pulse 2s infinite">🔔 ${tr("Next Patient", "المريض التالي")}</button><button class="btn btn-sm" onclick="loadMyQueue()" style="background:#e3f2fd;color:#1565c0">📋 ${tr("My Queue", "طابوري")}</button></div><small>Medical Center — Pharmacy Invoice</small></div>
  <div class="row"><span class="k">📄 رقم الفاتورة:</span><span>RX-${rxId}</span></div>
  <div class="row"><span class="k">👤 المريض:</span><span>${patientName}</span></div>
  <div class="row"><span class="k">📅 التاريخ:</span><span>${new Date().toLocaleDateString('ar-SA')} — ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></div>
  <table class="med-tbl">
    <thead><tr><th>💊 الدواء</th><th>📏 الجرعة</th><th>🔄 المرات/يوم</th><th>📅 الأيام</th></tr></thead>
    <tbody><tr><td>${med}</td><td>${dose || '-'}</td><td>${freq || '-'}</td><td>${dur || '-'}</td></tr></tbody>
  </table>
  <div class="total-box">💰 الإجمالي: ${price || 0} ر.س</div>
  <div class="row"><span class="k">💳 طريقة الدفع:</span><span>${payAr} (${payMethod || 'Cash'})</span></div>
  <div class="row"><span class="k">✅ الحالة:</span><span style="color:green;font-weight:bold">مدفوع — Paid</span></div>
  <div class="footer">المركز الطبي | ${new Date().toLocaleDateString('en-CA')} | شكراً لكم</div>
</div>
<script>setTimeout(()=>{window.print();},400);<\\/script>
</body></html>`);
  w.document.close();
};
window.addDrug = async () => {
  const name = document.getElementById('phName').value.trim();
  if (!name) { showToast(tr('Enter drug name', 'ادخل اسم الدواء'), 'error'); return; }
  try {
    await API.post('/api/pharmacy/drugs', { drug_name: name, selling_price: document.getElementById('phPrice').value, stock_qty: document.getElementById('phStock').value });
    showToast(tr('Drug added!', 'تمت الإضافة!'));
    await navigateTo(6);
  } catch (e) { showToast(tr('Error adding', 'خطأ في الإضافة'), 'error'); }
};

// ===== HR =====
async function renderHR(el) {
  const emps = await API.get('/api/employees');
  el.innerHTML = `<div class="page-title">🏢 ${tr('Human Resources', 'الموارد البشرية')}</div>
    <div class="card mb-16"><div class="card-title">👥 ${tr('Employees', 'الموظفين')}</div>
    <div class="flex gap-8 mb-12">
      <input class="form-input" id="hrNameAr" placeholder="${tr('Arabic name', 'الاسم بالعربية')}" style="flex:1.5">
      <input class="form-input" id="hrNameEn" placeholder="${tr('English name', 'الاسم بالإنجليزية')}" style="flex:1.5">
      <select class="form-input" id="hrRole" style="flex:1"><option>Staff</option><option>Doctor</option><option>Nurse</option><option>Admin</option><option>Receptionist</option></select>
      <select class="form-input" id="hrDept" style="flex:1.5">
        <option value="" data-ar="بدون قسم">-- ${tr('Department', 'القسم')} --</option>
        <optgroup label="${tr('Medical Departments', 'الأقسام الطبية')}">
          <option value="General Practice" data-ar="الطب العام">${tr('General Practice', 'الطب العام')}</option>
          <option value="Dentistry" data-ar="طب الأسنان">${tr('Dentistry', 'طب الأسنان')}</option>
          <option value="Endocrinology & Diabetes" data-ar="الغدد الصماء والسكري">${tr('Endocrinology & Diabetes', 'الغدد الصماء والسكري')}</option>
          <option value="Pediatrics" data-ar="طب الأطفال">${tr('Pediatrics', 'طب الأطفال')}</option>
          <option value="Orthopedics" data-ar="جراحة العظام">${tr('Orthopedics', 'جراحة العظام')}</option>
          <option value="Dermatology" data-ar="الجلدية">${tr('Dermatology', 'الجلدية')}</option>
          <option value="ENT" data-ar="الأنف والأذن والحنجرة">${tr('ENT', 'الأنف والأذن والحنجرة')}</option>
          <option value="Ophthalmology" data-ar="العيون">${tr('Ophthalmology', 'العيون')}</option>
          <option value="Cardiology" data-ar="القلب">${tr('Cardiology', 'القلب')}</option>
          <option value="Internal Medicine" data-ar="الباطنية">${tr('Internal Medicine', 'الباطنية')}</option>
          <option value="Obstetrics & Gynecology" data-ar="النساء والولادة">${tr('Obstetrics & Gynecology', 'النساء والولادة')}</option>
          <option value="Neurology" data-ar="المخ والأعصاب">${tr('Neurology', 'المخ والأعصاب')}</option>
          <option value="Psychiatry" data-ar="الطب النفسي">${tr('Psychiatry', 'الطب النفسي')}</option>
        </optgroup>
        <optgroup label="${tr('Other Departments', 'أقسام أخرى')}">
          <option value="Radiology" data-ar="الأشعة">${tr('Radiology', 'الأشعة')}</option>
          <option value="Laboratory" data-ar="المختبر">${tr('Laboratory', 'المختبر')}</option>
          <option value="Administration" data-ar="الإدارة">${tr('Administration', 'الإدارة')}</option>
          <option value="Reception" data-ar="الاستقبال">${tr('Reception', 'الاستقبال')}</option>
          <option value="Pharmacy" data-ar="الصيدلية">${tr('Pharmacy', 'الصيدلية')}</option>
        </optgroup>
      </select>
      <input class="form-input" id="hrSalary" placeholder="${tr('Salary', 'الراتب')}" type="number" style="flex:1">
      <button class="btn btn-primary" onclick="addEmp()">➕</button>
    </div>
    <div class="flex gap-8 mb-12" id="hrCommRow" style="display:none">
      <select class="form-input" id="hrCommType" style="flex:1">
        <option value="percentage">💰 ${tr('Commission %', 'عمولة %')}</option>
        <option value="fixed">💰 ${tr('Fixed per Patient', 'مبلغ ثابت/مريض')}</option>
      </select>
      <input class="form-input" id="hrCommValue" placeholder="${tr('Commission Value', 'قيمة العمولة')}" type="number" step="0.5" value="0" style="flex:1">
    </div>
    <div id="hrTable">${makeTable([tr('Name', 'الاسم'), tr('Role', 'الوظيفة'), tr('Department', 'القسم'), tr('Salary', 'الراتب'), tr('Commission', 'العمولة'), tr('Status', 'الحالة'), tr('Delete', 'حذف')], emps.map(e => ({ cells: [isArabic ? e.name_ar : e.name_en, e.role, isArabic ? e.department_ar : e.department_en, e.salary?.toLocaleString(), e.role === 'Doctor' ? `${e.commission_value || 0}${e.commission_type === 'percentage' ? '%' : ' SAR'}` : '-', statusBadge(e.status)], id: e.id })), r => `<button class="btn btn-danger btn-sm" onclick="delEmp(${r.id})">🗑</button>`)}</div></div>`;
  // Show/hide commission row when role changes
  const hrRoleEl = document.getElementById('hrRole');
  const showCommRow = () => { document.getElementById('hrCommRow').style.display = hrRoleEl.value === 'Doctor' ? 'flex' : 'none'; };
  hrRoleEl.addEventListener('change', showCommRow);
  showCommRow(); // Check on page load
}
window.addEmp = async () => {
  const nameEn = document.getElementById('hrNameEn').value.trim();
  const nameAr = document.getElementById('hrNameAr').value.trim();
  const deptSel = document.getElementById('hrDept');
  const opt = deptSel.options[deptSel.selectedIndex];

  if (!nameEn && !nameAr) { showToast(tr('Enter employee name', 'ادخل اسم الموظف'), 'error'); return; }
  try {
    const role = document.getElementById('hrRole').value;
    const commType = role === 'Doctor' ? (document.getElementById('hrCommType')?.value || 'percentage') : 'percentage';
    const commValue = role === 'Doctor' ? (parseFloat(document.getElementById('hrCommValue')?.value) || 0) : 0;
    await API.post('/api/employees', {
      name_ar: nameAr,
      name_en: nameEn,
      role,
      department_en: deptSel.value,
      department_ar: opt ? (opt.getAttribute('data-ar') || '') : '',
      salary: document.getElementById('hrSalary').value,
      commission_type: commType,
      commission_value: commValue
    });
    showToast(tr('Employee added!', 'تمت الإضافة!'));
    await navigateTo(7);
  } catch (e) { showToast(tr('Error adding', 'خطأ في الإضافة'), 'error'); }
};
window.delEmp = async (id) => {
  if (!confirm(tr('Delete this employee?', 'حذف هذا الموظف؟'))) return;
  try { await API.del(`/api/employees/${id}`); showToast(tr('Deleted', 'تم الحذف')); await navigateTo(7); }
  catch (e) { showToast(tr('Error deleting', 'خطأ في الحذف'), 'error'); }
};

// ===== FINANCE =====
async function renderFinance(el) {
  const content = el;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  content.innerHTML = `
    <h2>${tr('Finance', 'المالية')}</h2>
    <div class="card" style="padding:16px;margin-bottom:16px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label style="font-weight:600">${tr('Date Range:', 'الفترة:')}</label>
        <input type="date" class="form-input" id="finFrom" value="${monthStart}" style="width:auto">
        <span>→</span>
        <input type="date" class="form-input" id="finTo" value="${today}" style="width:auto">
        <button class="btn btn-primary btn-sm" onclick="loadFinance()">🔍 ${tr('Filter', 'فلترة')}</button>
        <button class="btn btn-sm" onclick="exportToCSV(window._finInvoices||[],'finance')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
        <button class="btn btn-sm" onclick="window.print()" style="background:#f3e5f5;color:#7b1fa2">🖨️ ${tr('Print', 'طباعة')}</button>
      </div>
    </div>
    <div id="finStats"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
      <div class="card" style="padding:20px"><h4 style="margin:0 0 12px">${tr('Revenue Trend', 'منحنى الإيرادات')}</h4><canvas id="finRevenueChart" height="200"></canvas></div>
      <div class="card" style="padding:20px"><h4 style="margin:0 0 12px">${tr('By Service', 'حسب الخدمة')}</h4><canvas id="finServiceChart" height="200"></canvas></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Recent Invoices', 'الفواتير الأخيرة')}</h4>
        <div id="finTable"></div>
      </div>
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h4 style="margin:0">${tr('Procedure Costing', 'تكاليف الإجراءات')}</h4>
            <button class="btn btn-primary btn-sm" onclick="showAddCostModal()">+ ${tr('Add Cost', 'إضافة تكلفة')}</button>
        </div>
        <div id="costsTable"></div>
      </div>
    </div>`;
  loadFinance();

  window.showAddCostModal = () => {
      const html = '<div class="form-group"><label>' + tr('Procedure Name', 'اسم الإجراء') + '</label><input id="fcName" class="form-input"></div>' +
                   '<div class="form-group"><label>' + tr('Department', 'القسم') + '</label><input id="fcDept" class="form-input"></div>' +
                   '<div class="form-group"><label>' + tr('Base Cost (SAR)', 'التكلفة الأساسية') + '</label><input type="number" id="fcBase" class="form-input" value="0"></div>' +
                   '<div class="form-group"><label>' + tr('Consumables Cost (SAR)', 'تكلفة المستهلكات') + '</label><input type="number" id="fcConsum" class="form-input" value="0"></div>' +
                   '<button class="btn btn-primary w-full" onclick="saveProcedureCost()">💾 ' + tr('Save', 'حفظ') + '</button>';
      showModal(tr('Add Procedure Cost', 'إضافة تكلفة إجراء'), html);
  };
  window.saveProcedureCost = async () => {
      try {
          await API.post('/api/finance/procedure-costs', { procedure_name: document.getElementById('fcName').value, department: document.getElementById('fcDept').value, base_cost: document.getElementById('fcBase').value, consumables_cost: document.getElementById('fcConsum').value });
          showToast(tr('Cost Added!', 'تمت إضافة التكلفة!'));
          document.querySelector('.modal-overlay')?.remove(); navigateTo(currentPage);
      } catch(e) { showToast('Error', 'error'); }
  };

  window.loadFinance = async () => {
    const from = document.getElementById('finFrom')?.value || '';
    const to = document.getElementById('finTo')?.value || '';
    try {
      const data = await API.get('/api/finance/summary?from=' + from + '&to=' + to);
      const statsEl = document.getElementById('finStats');
      if (statsEl) {
        statsEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
          '<div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,#e8f5e9,#c8e6c9)"><h2 style="margin:0;color:#2e7d32">' + parseFloat(data.revenue || 0).toLocaleString() + '</h2><p style="margin:4px 0 0;color:#666">' + tr('Total Revenue', 'إجمالي الإيرادات') + ' (' + tr('SAR', 'ريال') + ')</p></div>' +
          '<div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,#e3f2fd,#bbdefb)"><h2 style="margin:0;color:#1565c0">' + parseFloat(data.paid || 0).toLocaleString() + '</h2><p style="margin:4px 0 0;color:#666">' + tr('Collected', 'المحصّل') + '</p></div>' +
          '<div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,#fce4ec,#f8bbd0)"><h2 style="margin:0;color:#c62828">' + parseFloat(data.unpaid || 0).toLocaleString() + '</h2><p style="margin:4px 0 0;color:#666">' + tr('Outstanding', 'المتبقي') + '</p></div>' +
          '<div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,#fff3e0,#ffe0b2)"><h2 style="margin:0;color:#e65100">' + (data.count || 0) + '</h2><p style="margin:4px 0 0;color:#666">' + tr('Invoice Count', 'عدد الفواتير') + '</p></div></div>';
      }
      // Revenue chart
      if (typeof Chart !== 'undefined' && data.daily?.length > 0) {
        const revCtx = document.getElementById('finRevenueChart');
        if (revCtx) { Chart.getChart(revCtx)?.destroy(); new Chart(revCtx, { type: 'line', data: { labels: data.daily.map(d => new Date(d.day).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })), datasets: [{ label: tr('Revenue', 'إيرادات'), data: data.daily.map(d => parseFloat(d.amount)), borderColor: '#1a73e8', backgroundColor: 'rgba(26,115,232,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } }); }
        const svcCtx = document.getElementById('finServiceChart');
        if (svcCtx && data.byService?.length > 0) { Chart.getChart(svcCtx)?.destroy(); new Chart(svcCtx, { type: 'doughnut', data: { labels: data.byService.map(s => s.service), datasets: [{ data: data.byService.map(s => parseFloat(s.amount)), backgroundColor: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#ff6d01', '#46bdc6', '#7baaf7', '#f07b72', '#fcd04f', '#71c287'] }] }, options: { responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } } }); }
      }
      // Load invoices and procedure costs
      const [invoices, costs] = await Promise.all([
        API.get('/api/invoices').catch(() => []),
        API.get('/api/finance/procedure-costs').catch(() => [])
      ]);
      window._finInvoices = invoices;
      const ft = document.getElementById('finTable');
      if (ft && invoices.length) {
        createTable(ft, 'finTbl',
          [tr('#', '#'), tr('Patient', 'المريض'), tr('Amount', 'المبلغ'), tr('Status', 'الحالة')],
          invoices.slice(0, 50).map(i => ({ cells: [i.invoice_number || i.id, i.patient_name || '', parseFloat(i.total || 0).toFixed(2) + ' ' + tr('SAR', 'ريال'), statusBadge(i.paid ? 'Paid' : 'Unpaid')], id: i.id }))
        );
      }
      const ct = document.getElementById('costsTable');
      if (ct) {
        ct.innerHTML = makeTable(
          [tr('Procedure', 'الإجراء'), tr('Department', 'القسم'), tr('Total Cost', 'التكلفة الإجمالية')],
          costs.map(c => ({ cells: [c.procedure_name, c.department, '<strong style="color:#d32f2f">' + c.total_cost + ' SAR</strong>'] }))
        );
      }
    } catch (e) { console.error(e); }
  };

}
window.generateInvoice = async () => {
  const pid = document.getElementById('invPatient').value;
  const desc = document.getElementById('invDesc').value.trim();
  const amt = parseFloat(document.getElementById('invAmt').value) || 0;
  if (!desc || !amt) { showToast(tr('Enter description and amount', 'ادخل الوصف والمبلغ'), 'error'); return; }
  try {
    await API.post('/api/invoices/generate', { patient_id: pid, items: [{ description: desc, amount: amt }] });
    showToast(tr('Invoice issued!', 'تم إصدار الفاتورة!'));
    await navigateTo(8);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.payInvoice = async (id) => {
  try { await API.put(`/api/invoices/${id}/pay`, { payment_method: 'Cash' }); showToast(tr('Paid!', 'تم الدفع!')); await navigateTo(8); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.performDailyClose = async function () {
  try {
    const result = await API.post('/api/finance/daily-close', {
      opening_balance: document.getElementById('dcOpen').value || 0,
      closing_balance: document.getElementById('dcClose').value || 0,
      notes: document.getElementById('dcNotes').value
    });
    showToast(tr('Day closed! Variance: ' + result.variance + ' SAR', 'تم الإغلاق! الفرق: ' + result.variance + ' ر.س'));
    navigateTo(8);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== INSURANCE =====
async function renderInsurance(el) {
  const [claims, companies, policies] = await Promise.all([
    API.get('/api/insurance/claims'),
    API.get('/api/insurance/companies').catch(() => []),
    API.get('/api/insurance/policies').catch(() => [])
  ]);
  const approved = claims.filter(c => c.status === 'Approved').reduce((s, c) => s + (c.claim_amount || 0), 0);
  const pending = claims.filter(c => c.status === 'Pending').reduce((s, c) => s + (c.claim_amount || 0), 0);
  el.innerHTML = `<div class="page-title">🛡️ ${tr('Insurance Management', 'إدارة التأمين')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">${tr('Total Claims', 'إجمالي المطالبات')}</div><div class="stat-value">${claims.length}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><div class="stat-label">${tr('Approved', 'معتمدة')}</div><div class="stat-value">${approved.toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-label">${tr('Pending', 'معلقة')}</div><div class="stat-value">${pending.toLocaleString()} SAR</div></div>
      <div class="stat-card" style="--stat-color:#8b5cf6"><div class="stat-label">${tr('Companies', 'شركات التأمين')}</div><div class="stat-value">${companies.length}</div></div>
    </div>
    <div class="grid-equal">
      <div class="card">
        <div class="card-title">➕ ${tr('New Insurance Claim', 'مطالبة تأمين جديدة')}</div>
        <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="insPatient" placeholder="${tr('Patient name', 'اسم المريض')}"></div>
        <div class="form-group mb-12"><label>${tr('Insurance Company', 'شركة التأمين')}</label>
          <select class="form-input" id="insCompany">
            <option value="Bupa Arabia">Bupa Arabia</option>
            <option value="Tawuniya">Tawuniya</option>
            <option value="MedGulf">MedGulf</option>
            <option value="Alrajhi Takaful">Alrajhi Takaful</option>
            <option value="CCHI">CCHI</option>
            <option value="AXA">AXA</option>
            <option value="Walaa">Walaa</option>
            ${companies.map(c => `<option value="${c.name_en || c.name_ar}">${c.name_en || c.name_ar}</option>`).join('')}
          </select></div>
        <div class="form-group mb-12"><label>${tr('Claim Amount', 'مبلغ المطالبة')}</label><input class="form-input" id="insAmount" type="number" placeholder="0.00"></div>
        <button class="btn btn-primary w-full" onclick="addClaim()">📤 ${tr('Submit Claim', 'إرسال المطالبة')}</button>
      </div>
      <div class="card">
        <div class="card-title">🏢 ${tr('Insurance Companies', 'شركات التأمين')}</div>
        <div class="flex gap-8 mb-12">
          <input class="form-input" id="insCoNameAr" placeholder="${tr('Arabic name', 'الاسم بالعربية')}" style="flex:1">
          <input class="form-input" id="insCoNameEn" placeholder="${tr('English name', 'الاسم بالإنجليزية')}" style="flex:1">
          <button class="btn btn-primary" onclick="addInsCompany()">➕</button>
        </div>
        ${makeTable([tr('Name (AR)', 'الاسم بالعربية'), tr('Name (EN)', 'الاسم بالإنجليزية')], companies.map(c => ({ cells: [c.name_ar, c.name_en] })))}
      </div>
    </div>
    <div class="card">
      <div class="card-title">📄 ${tr('Insurance Claims', 'المطالبات')}</div>
      <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'insClaimsT')">
      <div id="insClaimsT">${makeTable(
    [tr('Patient', 'المريض'), tr('Company', 'الشركة'), tr('Amount', 'المبلغ'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', 'إجراءات')],
    claims.map(c => ({ cells: [c.patient_name, c.insurance_company, c.claim_amount + ' SAR', statusBadge(c.status), c.created_at?.split('T')[0] || ''], id: c.id, status: c.status })),
    (row) => row.status === 'Pending' ? `<div class="flex gap-4"><button class="btn btn-sm btn-success" onclick="updateClaim(${row.id},'Approved')">✅</button><button class="btn btn-sm btn-danger" onclick="updateClaim(${row.id},'Rejected')">❌</button></div>` : `<span class="badge badge-${row.status === 'Approved' ? 'success' : 'danger'}">${row.status}</span>`
  )}</div></div>`;
}
window.addClaim = async () => {
  const name = document.getElementById('insPatient').value.trim();
  if (!name) { showToast(tr('Enter patient name', 'ادخل اسم المريض'), 'error'); return; }
  try {
    await API.post('/api/insurance/claims', { patient_name: name, insurance_company: document.getElementById('insCompany').value, claim_amount: parseFloat(document.getElementById('insAmount').value) || 0 });
    showToast(tr('Claim submitted!', 'تم إرسال المطالبة!')); await navigateTo(9);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.updateClaim = async (id, status) => {
  try { await API.put(`/api/insurance/claims/${id}`, { status }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(9); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addInsCompany = async () => {
  const ar = document.getElementById('insCoNameAr').value.trim();
  const en = document.getElementById('insCoNameEn').value.trim();
  if (!ar && !en) { showToast(tr('Enter company name', 'ادخل اسم الشركة'), 'error'); return; }
  try {
    await API.post('/api/insurance/companies', { name_ar: ar, name_en: en });
    showToast(tr('Company added!', 'تمت الإضافة!')); await navigateTo(9);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== INVENTORY =====
async function renderInventory(el) {
  const content = el;

  const items = await API.get('/api/inventory').catch(() => []);
  const lowStock = items.filter(i => parseInt(i.quantity || 0) <= parseInt(i.reorder_level || 10));
  content.innerHTML = `
    <h2>${tr('Inventory', 'المخزون')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${items.length}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Total Items', 'إجمالي الأصناف')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:${lowStock.length > 0 ? '#fce4ec' : '#e8f5e9'}"><h3 style="margin:0;color:${lowStock.length > 0 ? '#c62828' : '#2e7d32'}">${lowStock.length}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Low Stock', 'مخزون منخفض')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${items.length - lowStock.length}</h3><p style="margin:4px 0 0;font-size:13px">${tr('OK Stock', 'مخزون كافي')}</p></div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <input class="form-input" id="invSearch" placeholder="${tr('Search items...', 'بحث في الأصناف...')}" style="max-width:300px" oninput="filterInvTable()">
      <button class="btn btn-sm" onclick="exportToCSV(window._invData||[],'inventory')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
      ${lowStock.length > 0 ? '<button class="btn btn-sm" onclick="showLowStock()" style="background:#fce4ec;color:#c62828;animation:pulse 2s infinite">⚠️ ' + tr('Low Stock Alert', 'تنبيه مخزون', '') + ' (' + lowStock.length + ')</button>' : ''}
    </div>
    <div id="invTableDiv"></div>`;

  window._invData = items;
  const it = document.getElementById('invTableDiv');
  if (it && items.length) {
    createTable(it, 'invTbl',
      [tr('Name', 'الاسم'), tr('Category', 'الفئة'), tr('Qty', 'الكمية'), tr('Reorder', 'إعادة الطلب'), tr('Unit', 'الوحدة'), tr('Status', 'الحالة')],
      items.map(i => {
        const isLow = parseInt(i.quantity || 0) <= parseInt(i.reorder_level || 10);
        return { cells: [i.name, i.category || '', '<span style="font-weight:bold;color:' + (isLow ? '#c62828' : '#2e7d32') + '">' + (i.quantity || 0) + '</span>', i.reorder_level || 10, i.unit || '', isLow ? '<span style="color:#c62828;font-weight:bold">⚠️ ' + tr('Low', 'منخفض') + '</span>' : '<span style="color:#2e7d32">✅</span>'], id: i.id };
      })
    );
  }

  window.filterInvTable = () => {
    const txt = (document.getElementById('invSearch')?.value || '').toLowerCase();
    document.querySelectorAll('#invTbl tbody tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(txt) ? '' : 'none');
  };
  window.showLowStock = () => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    const lowItems = (window._invData || []).filter(i => parseInt(i.quantity || 0) <= parseInt(i.reorder_level || 10));
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:500px;direction:rtl;max-height:80vh;overflow:auto"><h3 style="margin:0 0 16px;color:#c62828">⚠️ ' + tr('Low Stock Items', 'أصناف مخزونها منخفض') + ' (' + lowItems.length + ')</h3>' + lowItems.map(i => '<div style="padding:10px;margin:4px 0;background:#fce4ec;border-radius:8px;display:flex;justify-content:space-between"><strong>' + i.name + '</strong><span style="color:#c62828;font-weight:bold">' + i.quantity + ' / ' + (i.reorder_level || 10) + '</span></div>').join('') + '<button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()" style="width:100%;margin-top:16px">' + tr('Close', 'إغلاق') + '</button></div>';
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  };

}
window.addInvItem = async () => {
  const name = document.getElementById('invName').value.trim();
  if (!name) { showToast(tr('Enter item name', 'ادخل اسم الصنف'), 'error'); return; }
  try {
    await API.post('/api/inventory/items', {
      item_name: name,
      item_code: document.getElementById('invCode').value,
      category: document.getElementById('invCat').value,
      cost_price: parseFloat(document.getElementById('invCost').value) || 0,
      stock_qty: parseInt(document.getElementById('invQty').value) || 0,
      min_qty: parseInt(document.getElementById('invMin').value) || 5
    });
    showToast(tr('Item added!', 'تمت الإضافة!'));
    await navigateTo(10);
  } catch (e) { showToast(tr('Error adding', 'خطأ في الإضافة'), 'error'); }
};

// ===== SIMPLE MODULE PAGES =====
let nurseTab = 'vitals';
async function renderNursing(el) {
  const patients = await API.get('/api/patients');
  const vitals = await API.get('/api/nursing/vitals').catch(() => []);
  const emarOrders = await API.get('/api/emar/orders').catch(() => []);
  const carePlans = await API.get('/api/nursing/care-plans').catch(() => []);
  const assessments = await API.get('/api/nursing/assessments').catch(() => []);
  el.innerHTML = `
    <div class="page-title">👩‍⚕️ ${tr('Nursing Station', 'محطة التمريض')}</div>
    <div class="tab-bar">
      <button class="tab-btn ${nurseTab === 'vitals' ? 'active' : ''}" onclick="nurseTab='vitals';navigateTo(11)">🌡️ ${tr('Vitals', 'العلامات الحيوية')}</button>
      <button class="tab-btn ${nurseTab === 'emar' ? 'active' : ''}" onclick="nurseTab='emar';navigateTo(11)">💉 ${tr('eMAR', 'إعطاء الأدوية')}</button>
      <button class="tab-btn ${nurseTab === 'careplans' ? 'active' : ''}" onclick="nurseTab='careplans';navigateTo(11)">📋 ${tr('Care Plans', 'خطط الرعاية')}</button>
      <button class="tab-btn ${nurseTab === 'assess' ? 'active' : ''}" onclick="nurseTab='assess';navigateTo(11)">📊 ${tr('Assessments', 'التقييمات')}</button>
    </div>`;
  if (nurseTab === 'emar') {
    el.innerHTML += `<div class="card"><h3>💉 ${tr('Electronic Medication Administration Record', 'سجل إعطاء الأدوية الإلكتروني')}</h3>
    ${emarOrders.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Medication', 'الدواء'), tr('Dose', 'الجرعة'), tr('Route', 'الطريقة'), tr('Frequency', 'التكرار'), tr('Status', 'الحالة'), tr('Actions', 'إجراءات')],
      emarOrders.map(o => ({
        cells: [o.patient_name, o.medication, o.dose, o.route, o.frequency, statusBadge(o.status),
        `<button class="btn btn-sm btn-success" onclick="administerMed(${o.id},${o.patient_id},'${o.medication}','${o.dose}')">💉 ${tr('Give', 'إعطاء')}</button>`
        ]
      }))
    ) : `<div class="empty-state"><p>${tr('No active orders', 'لا توجد أوامر نشطة')}</p></div>`}
    </div>`;
  } else if (nurseTab === 'careplans') {
    el.innerHTML += `<div class="card"><h3>📋 ${tr('Nursing Care Plans', 'خطط الرعاية التمريضية')}</h3>
    <button class="btn btn-primary" onclick="nurseTab='newplan';navigateTo(11)" style="margin-bottom:12px">➕ ${tr('New Plan', 'خطة جديدة')}</button>
    ${carePlans.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Diagnosis', 'التشخيص'), tr('Priority', 'الأولوية'), tr('Goals', 'الأهداف'), tr('Status', 'الحالة')],
      carePlans.map(c => ({ cells: [c.patient_name, c.diagnosis, c.priority === 'High' ? '🔴 ' + tr('High', 'عالية') : c.priority === 'Low' ? '🟢 ' + tr('Low', 'منخفضة') : '🟡 ' + tr('Medium', 'متوسطة'), c.goals?.substring(0, 60) || '-', statusBadge(c.status)] }))
    ) : `<div class="empty-state"><p>${tr('No care plans', 'لا توجد خطط رعاية')}</p></div>`}
    </div>`;
  } else if (nurseTab === 'assess') {
    el.innerHTML += `<div class="card"><h3>📊 ${tr('Nursing Assessments', 'التقييمات التمريضية')}</h3>
    ${assessments.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Type', 'النوع'), tr('Fall Risk', 'خطر السقوط'), tr('Braden', 'Braden'), tr('Pain', 'ألم'), tr('GCS', 'GCS'), tr('Nurse', 'الممرض'), tr('Shift', 'الوردية')],
      assessments.map(a => ({
        cells: [a.patient_name, a.assessment_type,
        `<span style="color:${a.fall_risk_score >= 45 ? '#ef4444' : a.fall_risk_score >= 25 ? '#f59e0b' : '#22c55e'}">${a.fall_risk_score}</span>`,
        `<span style="color:${a.braden_score <= 12 ? '#ef4444' : a.braden_score <= 18 ? '#f59e0b' : '#22c55e'}">${a.braden_score}/23</span>`,
        `<span style="color:${a.pain_score >= 7 ? '#ef4444' : a.pain_score >= 4 ? '#f59e0b' : '#22c55e'}">${a.pain_score}/10</span>`,
        a.gcs_score + '/15', a.nurse, a.shift
        ]
      }))
    ) : `<div class="empty-state"><p>${tr('No assessments', 'لا توجد تقييمات')}</p></div>`}
    </div>`;
  } else if (nurseTab === 'newplan') {
    el.innerHTML += `<div class="card"><h3>➕ ${tr('New Care Plan', 'خطة رعاية جديدة')}</h3>
    <div class="form-grid">
      <div><label>${tr('Patient', 'المريض')}</label><select id="cpPatientN" class="form-input">${patients.map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.file_number} - ${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Priority', 'الأولوية')}</label><select id="cpPriorityN" class="form-input"><option value="Low">${tr('Low', 'منخفضة')}</option><option value="Medium" selected>${tr('Medium', 'متوسطة')}</option><option value="High">${tr('High', 'عالية')}</option></select></div>
      <div style="grid-column:1/-1"><label>${tr('Diagnosis', 'التشخيص')}</label><input id="cpDiagN" class="form-input"></div>
      <div style="grid-column:1/-1"><label>${tr('Goals', 'الأهداف')}</label><textarea id="cpGoalsN" class="form-input" rows="2"></textarea></div>
      <div style="grid-column:1/-1"><label>${tr('Interventions', 'التدخلات')}</label><textarea id="cpIntN" class="form-input" rows="2"></textarea></div>
    </div>
    <button class="btn btn-primary" onclick="saveCarePlan()" style="margin-top:8px">💾 ${tr('Save', 'حفظ')}</button></div>`;
  } else {
    el.innerHTML += `<div class="split-layout">
      <div>
        <div class="card mb-16">
          <div class="card-title">🌡️ ${tr('Record Patient Vitals', 'تسجيل العلامات الحيوية')}</div>
          <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><select class="form-input" id="nsPatient"><option value="">${tr('-- Select --', '-- اختر مريض --')}</option>${patients.map(p => `<option value="${p.id}" data-name="">${p.file_number} - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</option>`).join('')}</select></div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>🩸 ${tr('Blood Pressure', 'ضغط الدم')}</label><input class="form-input" id="nsBp" placeholder="120/80"></div>
            <div class="form-group" style="flex:1"><label>🌡️ ${tr('Temp (°C)', 'الحرارة')}</label><input class="form-input" id="nsTemp" type="number" step="0.1" placeholder="37.0"></div>
          </div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>❤️ ${tr('Pulse (bpm)', 'النبض')}</label><input class="form-input" id="nsPulse" type="number" placeholder="75"></div>
            <div class="form-group" style="flex:1"><label>💨 ${tr('O2 Sat (%)', 'الأكسجين')}</label><input class="form-input" id="nsO2" type="number" placeholder="98"></div>
          </div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>💪 ${tr('Weight (kg)', 'الوزن')}</label><input class="form-input" id="nsWeight" type="number" step="0.1" placeholder="70.5"></div>
            <div class="form-group" style="flex:1"><label>📏 ${tr('Height (cm)', 'الطول')}</label><input class="form-input" id="nsHeight" type="number" placeholder="170"></div>
          </div>
          <div class="flex gap-8 mb-12">
            <div class="form-group" style="flex:1"><label>🌬️ ${tr('Respiratory Rate', 'معدل التنفس')}</label><input class="form-input" id="nsResp" type="number" placeholder="18"></div>
            <div class="form-group" style="flex:1"><label>🩸 ${tr('Blood Sugar', 'السكر')}</label><input class="form-input" id="nsSugar" type="number" placeholder="100"></div>
          </div>
        </div>
        <div class="card mb-16">
          <div class="card-title">📋 ${tr('Medical History', 'التاريخ المرضي')}</div>
          <div class="form-group mb-12"><label>🏥 ${tr('Chronic Diseases', 'الأمراض المزمنة')}</label><textarea class="form-input form-textarea" id="nsChronic" placeholder="${tr('e.g. Diabetes, Hypertension, Asthma...', 'مثلاً: سكري، ضغط، ربو...')}"></textarea></div>
          <div class="form-group mb-12"><label>💊 ${tr('Current Medications', 'الأدوية الحالية')}</label><textarea class="form-input form-textarea" id="nsMeds" placeholder="${tr('e.g. Metformin 500mg, Aspirin 100mg...', 'مثلاً: ميتفورمين 500مج، أسبرين 100مج...')}"></textarea></div>
          <div class="form-group mb-12"><label>⚠️ ${tr('Allergies', 'الحساسية')}</label><textarea class="form-input form-textarea" id="nsAllergies" placeholder="${tr('e.g. Penicillin, Peanuts, Latex...', 'مثلاً: بنسلين، فول سوداني، لاتكس...')}"></textarea></div>
          <div class="form-group mb-16"><label>📝 ${tr('Notes / Triage', 'ملاحظات / فرز')}</label><textarea class="form-input form-textarea" id="nsNotes"></textarea></div>
          <button class="btn btn-primary w-full" style="height:44px" onclick="saveVitals()">💾 ${tr('Save Vitals & Send to Doctor', 'حفظ وإرسال للطبيب')}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 ${tr('Recent Vitals Registry', 'سجل العلامات الحيوية')}</div>
        <input class="search-filter" id="nsSearch" placeholder="${tr('Search...', 'بحث...')}">
        <div id="nsTable">${vitals.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><p>${tr('No data found', 'لا توجد بيانات')}</p></div>` : vitals.map(v => `
          <div class="card mb-12" style="padding:12px;border:1px solid var(--border-color,#e5e7eb);border-radius:10px;background:var(--card-bg,#fff)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:14px">👤 ${v.patient_name || v.patient_id}</strong>
              <span style="font-size:12px;color:var(--text-muted,#999)">📅 ${v.created_at?.split('T')[0] || ''}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:13px">
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">🩸 ${tr('BP', 'الضغط')}<br><strong>${v.bp || '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">🌡️ ${tr('Temp', 'حرارة')}<br><strong>${v.temp ? v.temp + '°' : '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">❤️ ${tr('Pulse', 'نبض')}<br><strong>${v.pulse || '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">💨 ${tr('O2', 'أكسجين')}<br><strong>${v.o2_sat ? v.o2_sat + '%' : '-'}</strong></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:13px;margin-top:6px">
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">💪 ${tr('Weight', 'وزن')}<br><strong>${v.weight ? v.weight + ' kg' : '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">📏 ${tr('Height', 'طول')}<br><strong>${v.height ? v.height + ' cm' : '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">🌬️ ${tr('Resp', 'تنفس')}<br><strong>${v.respiratory_rate || '-'}</strong></div>
              <div style="background:var(--bg-secondary,#f8f9fa);padding:6px 8px;border-radius:6px;text-align:center">🩸 ${tr('Sugar', 'سكر')}<br><strong>${v.blood_sugar || '-'}</strong></div>
            </div>
            ${v.allergies ? `<div style="margin-top:6px"><span class="badge badge-danger">⚠️ ${v.allergies}</span></div>` : ''}
            ${v.chronic_diseases ? `<div style="margin-top:4px;font-size:12px;color:var(--text-muted,#888)">🏥 ${v.chronic_diseases}</div>` : ''}
          </div>
        `).join('')}</div>
      </div>
    </div>`;
    // Search filter for vitals cards
    document.getElementById('nsSearch')?.addEventListener('input', (e) => {
      const txt = e.target.value.toLowerCase();
      document.querySelectorAll('#nsTable .card').forEach(c => {
        c.style.display = c.textContent.toLowerCase().includes(txt) ? '' : 'none';
      });
    });
  }
}

window.saveVitals = async () => {
  const sel = document.getElementById('nsPatient');
  const pid = sel.value;
  if (!pid) { showToast(tr('Select patient first', 'اختر المريض أولاً'), 'error'); return; }
  const pname = sel.options[sel.selectedIndex].getAttribute('data-name');
  try {
    await API.post('/api/nursing/vitals', {
      patient_id: pid, patient_name: pname,
      bp: document.getElementById('nsBp').value,
      temp: parseFloat(document.getElementById('nsTemp').value) || 0,
      weight: parseFloat(document.getElementById('nsWeight').value) || 0,
      height: parseFloat(document.getElementById('nsHeight').value) || 0,
      pulse: parseInt(document.getElementById('nsPulse').value) || 0,
      o2_sat: parseInt(document.getElementById('nsO2').value) || 0,
      respiratory_rate: parseInt(document.getElementById('nsResp').value) || 0,
      blood_sugar: parseInt(document.getElementById('nsSugar').value) || 0,
      chronic_diseases: document.getElementById('nsChronic').value,
      current_medications: document.getElementById('nsMeds').value,
      allergies: document.getElementById('nsAllergies').value,
      notes: document.getElementById('nsNotes').value
    });
    showToast(tr('Vitals recorded and patient routed to doctor!', 'تم تسجيل العلامات الحيوية وتحويل المريض!'));
    await navigateTo(11);
  } catch (e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
};
window.administerMed = async function (orderId, patientId, med, dose) {
  const time = new Date().toTimeString().substring(0, 5);
  await API.post('/api/emar/administrations', { emar_order_id: orderId, patient_id: patientId, medication: med, dose: dose, scheduled_time: time, status: 'Given' });
  showToast(tr('Medication administered', 'تم إعطاء الدواء')); navigateTo(11);
};
window.saveCarePlan = async function () {
  const sel = document.getElementById('cpPatientN');
  const patient_name = sel.options[sel.selectedIndex].dataset.name;
  await API.post('/api/nursing/care-plans', { patient_id: sel.value, patient_name, diagnosis: document.getElementById('cpDiagN').value, priority: document.getElementById('cpPriorityN').value, goals: document.getElementById('cpGoalsN').value, interventions: document.getElementById('cpIntN').value });
  showToast(tr('Care plan saved', 'تم الحفظ')); nurseTab = 'careplans'; navigateTo(11);
};

async function renderWaitingQueue(el) {
  const content = el;

  const [patients, appointments] = await Promise.all([
    API.get('/api/queue/patients').catch(() => []),
    API.get('/api/appointments').catch(() => [])
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => (a.appt_date || a.date || '').includes(today));

  // Group by doctor
  const byDoctor = {};
  patients.forEach(p => { const d = p.doctor || p.doctor_name || tr('Unassigned', 'غير محدد'); if (!byDoctor[d]) byDoctor[d] = []; byDoctor[d].push(p); });

  content.innerHTML = `
    <h2>${tr('Waiting Queue', 'قائمة الانتظار')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${patients.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('In Queue', 'في الانتظار')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${todayAppts.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Today Appointments', 'مواعيد اليوم')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${Object.keys(byDoctor).length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Active Doctors', 'أطباء نشطون')}</p></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h4 style="margin:0">${tr('Queue by Doctor', 'الطابور حسب الطبيب')}</h4>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:12px;color:#666" id="queueTimer">⏱️ ${tr('Auto-refresh: 30s', 'تحديث تلقائي: 30 ثانية')}</span>
        <button class="btn btn-sm" onclick="navigateTo(currentPage)" style="background:#e3f2fd;color:#1565c0">🔄 ${tr('Refresh', 'تحديث')}</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:16px">
      ${Object.entries(byDoctor).map(([doc, pts]) => '<div class="card" style="padding:16px"><h4 style="margin:0 0 8px;color:#1565c0">👨‍⚕️ ' + doc + ' <span style="font-size:12px;color:#666">(' + pts.length + ')</span></h4>' + pts.map((p, i) => '<div style="padding:8px;margin:4px 0;border-radius:8px;background:' + (i === 0 ? '#e8f5e9' : '#f5f5f5') + ';display:flex;justify-content:space-between;align-items:center"><span>' + (i + 1) + '. ' + (p.patient_name || p.name || '') + '</span><span style="font-size:11px;color:#666">' + ((p.queue_number || '') || '#' + (i + 1)) + '</span></div>').join('') + '</div>').join('')}
      ${Object.keys(byDoctor).length === 0 ? '<div class="card" style="padding:40px;text-align:center;color:#999;grid-column:1/-1">' + tr('No patients in queue', 'لا يوجد مرضى في الانتظار') + '</div>' : ''}
    </div>`;

  // Auto-refresh every 30 seconds
  if (window._queueInterval) clearInterval(window._queueInterval);
  window._queueInterval = setInterval(() => { if (currentPage === NAV_ITEMS.findIndex(n => n.en === 'Waiting Queue')) navigateTo(currentPage); }, 30000);

}
window.callPatient = async function (id) {
  await API.put('/api/patients/' + id, { status: 'With Doctor' });
  showToast(tr('Patient called', 'تم مناداة المريض'));
  navigateTo(12);
};


async function renderPatientAccounts(el) {

  content.innerHTML = `
    <h2>${tr('Patient Accounts', 'حسابات المرضى')}</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <input class="form-input" id="paSearch" placeholder="${tr('Search patient (name/MRN)...', 'بحث بالاسم أو رقم الملف...')}" style="max-width:300px" oninput="searchPatientAccounts()">
      <button class="btn btn-sm" onclick="exportToCSV(window._paData||[],'patient_accounts')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
    </div>
    <div id="paResults"></div>`;
  searchPatientAccounts();

  window.searchPatientAccounts = async () => {
    const search = document.getElementById('paSearch')?.value || '';
    const patients = await API.get('/api/patients?search=' + encodeURIComponent(search));
    const el = document.getElementById('paResults');
    if (!el) return;
    if (!patients.length) { el.innerHTML = '<p style="color:#999;text-align:center;padding:40px">' + tr('No patients found', 'لم يتم العثور على مرضى') + '</p>'; return; }

    let invoiceData = [];
    try { invoiceData = await API.get('/api/invoices'); } catch (e) { }

    window._paData = patients.map(p => {
      const pInvoices = invoiceData.filter(i => i.patient_id === p.id);
      const totalBilled = pInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
      const totalPaid = pInvoices.filter(i => i.paid).reduce((s, i) => s + parseFloat(i.total || 0), 0);
      return { ...p, total_billed: totalBilled.toFixed(2), total_paid: totalPaid.toFixed(2), balance: (totalBilled - totalPaid).toFixed(2), invoice_count: pInvoices.length };
    });

    createTable(el, 'paTable',
      [tr('MRN', 'الملف'), tr('Name', 'الاسم'), tr('Phone', 'الجوال'), tr('Invoices', 'فواتير'), tr('Billed', 'المفوتر'), tr('Paid', 'المدفوع'), tr('Balance', 'الرصيد')],
      window._paData.map(p => ({
        cells: [p.mrn || p.file_number, isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar), p.phone, p.invoice_count,
        p.total_billed + ' ' + tr('SAR', 'ريال'), p.total_paid + ' ' + tr('SAR', 'ريال'),
        '<span style="color:' + (parseFloat(p.balance) > 0 ? '#cc0000;font-weight:bold' : '#2e7d32') + '">' + p.balance + ' ' + tr('SAR', 'ريال') + '</span>'],
        id: p.id
      })),
      (row) => `<button class="btn btn-sm" onclick="viewPatientInvoices(${row.id})" style="background:#e3f2fd;color:#1565c0">📋 ${tr('Invoices', 'الفواتير')}</button>`
    );
  };

  window.viewPatientInvoices = async (pid) => {
    const invoices = await API.get('/api/invoices?patient_id=' + pid);
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    let rows = invoices.map(i => '<tr><td style="padding:6px;border-bottom:1px solid #eee">' + (i.invoice_number || i.id) + '</td><td style="padding:6px;border-bottom:1px solid #eee">' + (i.description || i.service_type || '') + '</td><td style="padding:6px;border-bottom:1px solid #eee">' + parseFloat(i.total || 0).toFixed(2) + '</td><td style="padding:6px;border-bottom:1px solid #eee"><span style="color:' + (i.paid ? '#2e7d32' : '#cc0000') + '">' + (i.paid ? tr('Paid', 'مدفوع') : tr('Unpaid', 'غير مدفوع')) + '</span></td></tr>').join('');
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:600px;direction:rtl;max-height:80vh;overflow:auto"><h3 style="margin:0 0 16px">' + tr('Patient Invoices', 'فواتير المريض') + '</h3><table style="width:100%"><thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:right">#</th><th style="padding:8px;text-align:right">' + tr('Service', 'الخدمة') + '</th><th style="padding:8px;text-align:right">' + tr('Amount', 'المبلغ') + '</th><th style="padding:8px;text-align:right">' + tr('Status', 'الحالة') + '</th></tr></thead><tbody>' + rows + '</tbody></table><button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()" style="margin-top:16px;width:100%">' + tr('Close', 'إغلاق') + '</button></div>';
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  };

}
window.loadPatientAccount = async () => {
  const pid = document.getElementById('paPatient').value;
  if (!pid) return;
  try {
    const data = await API.get(`/api/billing/summary/${pid}`);
    const pInfo = await API.get(`/api/patients/${pid}/account`);
    const p = pInfo.patient;
    // Build billing breakdown by service type
    let breakdownHtml = '';
    const typeIcons = { 'File Opening': '📁', 'Lab Test': '🔬', 'Radiology': '📡', 'Consultation': '🩺', 'Pharmacy': '💊', 'Appointment': '📅', 'Medical Services': '🏥', 'Other': '📄' };
    const typeNames = { 'File Opening': tr('File Opening', 'فتح ملف'), 'Lab Test': tr('Lab Tests', 'فحوصات المختبر'), 'Radiology': tr('Radiology', 'الأشعة'), 'Consultation': tr('Consultation', 'الكشفية'), 'Pharmacy': tr('Pharmacy/Drugs', 'الصيدلية/الأدوية'), 'Appointment': tr('Appointments', 'المواعيد'), 'Medical Services': tr('Medical Services', 'خدمات طبية') };
    for (const [type, info] of Object.entries(data.byType)) {
      breakdownHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--hover);border-radius:8px;margin:6px 0">
        <span>${typeIcons[type] || '📄'} <strong>${typeNames[type] || type}</strong> <span class="badge badge-info" style="font-size:11px">${info.count}</span></span>
        <span style="font-weight:600">${info.total.toLocaleString()} ${tr('SAR', 'ر.س')}</span>
      </div>`;
    }
    document.getElementById('paResult').innerHTML = `
        <div class="card mb-16">
          <div class="card-title">👤 ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)} - #${p.file_number}</div>
          <div class="stats-grid">
            <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-label">${tr('Total Billed', 'إجمالي الفواتير')}</div><div class="stat-value">${data.totalBilled.toLocaleString()} SAR</div></div>
            <div class="stat-card" style="--stat-color:#4ade80"><div class="stat-label">${tr('Total Paid', 'المدفوع')}</div><div class="stat-value">${data.totalPaid.toLocaleString()} SAR</div></div>
            <div class="stat-card" style="--stat-color:${data.balance > 0 ? '#f87171' : '#4ade80'}"><div class="stat-label">${tr('Balance Due', 'المتبقي')}</div><div class="stat-value">${data.balance.toLocaleString()} SAR</div></div>
          </div>
        </div>
        <div class="card mb-16">
          <div class="card-title">📊 ${tr('Billing Breakdown', 'تفصيل الفوترة')}</div>
          ${breakdownHtml || `<div class="empty-state"><p>${tr('No billing data', 'لا توجد فوترة')}</p></div>`}
        </div>
        <div class="card mb-16"><div class="card-title">🧾 ${tr('All Invoices', 'جميع الفواتير')} (${data.invoices.length})</div>
        ${makeTable([tr('Type', 'النوع'), tr('Description', 'الوصف'), tr('Amount', 'المبلغ'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', 'إجراءات')],
      data.invoices.map(i => ({ cells: [i.service_type || '', i.description || '', `${i.total} SAR`, i.paid ? badge(tr('Paid', 'مدفوع'), 'success') : badge(tr('Unpaid', 'غير مدفوع'), 'danger'), i.created_at?.split('T')[0] || ''], id: i.id, paid: i.paid })),
      (row) => !row.paid ? `<button class="btn btn-sm btn-success" onclick="payInvoicePA(${row.id})">💵 ${tr('Pay', 'تسديد')}</button>` : `<span class="badge badge-success">✅</span>`
    )}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="printPatientStatement(${pid})">🖨️ ${tr('Print Statement', 'طباعة كشف الحساب')}</button>
          <button class="btn" onclick="exportTableCSV('patient_account')">📥 ${tr('Export CSV', 'تصدير CSV')}</button>
        </div>`;
  } catch (e) { showToast(tr('Error loading account', 'خطأ في تحميل الحساب'), 'error'); }
};
window.payInvoicePA = async (id) => {
  try { await API.put(`/api/invoices/${id}/pay`, { payment_method: 'Cash' }); showToast(tr('Paid!', 'تم الدفع!')); loadPatientAccount(); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

async function renderReports(el) {
  const content = el;

  content.innerHTML = `
    <h2>${tr('Reports', 'التقارير')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:20px">
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('patients')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">👥</div>
        <h4 style="margin:0 0 4px">${tr('Patient Report', 'تقرير المرضى')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('All registered patients', 'جميع المرضى المسجلين')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('invoices')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">💰</div>
        <h4 style="margin:0 0 4px">${tr('Financial Report', 'التقرير المالي')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Revenue and invoices', 'الإيرادات والفواتير')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('appointments')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">📅</div>
        <h4 style="margin:0 0 4px">${tr('Appointments Report', 'تقرير المواعيد')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Bookings and attendance', 'الحجوزات والحضور')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('lab')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">🔬</div>
        <h4 style="margin:0 0 4px">${tr('Lab Report', 'تقرير المختبر')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Test orders and results', 'الطلبات والنتائج')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('pharmacy')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">💊</div>
        <h4 style="margin:0 0 4px">${tr('Pharmacy Report', 'تقرير الصيدلية')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Dispensing and stock', 'الصرف والمخزون')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('inventory')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">📦</div>
        <h4 style="margin:0 0 4px">${tr('Inventory Report', 'تقرير المخزون')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Stock levels and low items', 'مستويات المخزون')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('radiology')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">📡</div>
        <h4 style="margin:0 0 4px">${tr('Radiology Report', 'تقرير الأشعة')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Imaging orders and results', 'طلبات الأشعة والنتائج')}</p>
      </div>
      <div class="card" style="padding:20px;cursor:pointer;transition:transform 0.2s" onclick="genReport('medical_history')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:36px;margin-bottom:8px">📁</div>
        <h4 style="margin:0 0 4px">${tr('Medical History', 'السجل الطبي')}</h4>
        <p style="margin:0;font-size:13px;color:#666">${tr('Previous reports, tests & prescriptions', 'التقارير والفحوصات والوصفات السابقة')}</p>
      </div>
    </div>
    <div id="reportOutput" class="card" style="padding:20px;display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h4 id="reportTitle" style="margin:0"></h4>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="exportToCSV(window._reportData||[],'report')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export CSV', 'تصدير CSV')}</button>
          <button class="btn btn-sm" onclick="window.print()" style="background:#f3e5f5;color:#7b1fa2">🖨️ ${tr('Print', 'طباعة')}</button>
        </div>
      </div>
      <div id="reportTable"></div>
    </div>`;

  window.genReport = async (type) => {
    const output = document.getElementById('reportOutput');
    const title = document.getElementById('reportTitle');
    const table = document.getElementById('reportTable');
    if (!output || !table) return;
    output.style.display = '';

    try {
      let data, headers, rows;
      switch (type) {
        case 'patients':
          data = await API.get('/api/patients');
          title.textContent = tr('Patient Report', 'تقرير المرضى') + ' (' + data.length + ')';
          headers = [tr('MRN', 'الملف'), tr('Name', 'الاسم'), tr('Phone', 'الجوال'), tr('ID', 'الهوية'), tr('Nationality', 'الجنسية'), tr('Registered', 'التسجيل')];
          rows = data.map(p => ({ cells: [p.mrn || p.file_number, isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar), p.phone, p.national_id, p.nationality, p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SA') : ''], id: p.id }));
          break;
        case 'invoices':
          data = await API.get('/api/invoices');
          title.textContent = tr('Financial Report', 'التقرير المالي') + ' (' + data.length + ')';
          headers = [tr('#', '#'), tr('Patient', 'المريض'), tr('Service', 'الخدمة'), tr('Amount', 'المبلغ'), tr('Paid', 'مدفوع'), tr('Date', 'التاريخ')];
          rows = data.map(i => ({ cells: [i.invoice_number || i.id, i.patient_name, i.description || i.service_type, parseFloat(i.total || 0).toFixed(2), i.paid ? '✅' : '❌', i.created_at ? new Date(i.created_at).toLocaleDateString('ar-SA') : ''], id: i.id }));
          break;
        case 'appointments':
          data = await API.get('/api/appointments');
          title.textContent = tr('Appointments Report', 'تقرير المواعيد') + ' (' + data.length + ')';
          headers = [tr('Patient', 'المريض'), tr('Doctor', 'الطبيب'), tr('Department', 'القسم'), tr('Date', 'التاريخ'), tr('Time', 'الوقت'), tr('Status', 'الحالة')];
          rows = data.map(a => ({ cells: [a.patient_name, a.doctor_name || a.doctor, a.department, a.appt_date || a.date, a.appt_time || a.time, statusBadge(a.status)], id: a.id }));
          break;
        case 'lab':
          data = await API.get('/api/lab/orders');
          title.textContent = tr('Lab Report', 'تقرير المختبر') + ' (' + data.length + ')';
          headers = [tr('Patient', 'المريض'), tr('Test', 'الفحص'), tr('Doctor', 'الطبيب'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')];
          rows = data.map(l => ({ cells: [l.patient_name, l.test_name || l.test_type, l.doctor, statusBadge(l.status), l.created_at ? new Date(l.created_at).toLocaleDateString('ar-SA') : ''], id: l.id }));
          break;
        case 'pharmacy':
          data = await API.get('/api/pharmacy/prescriptions');
          title.textContent = tr('Pharmacy Report', 'تقرير الصيدلية') + ' (' + data.length + ')';
          headers = [tr('Patient', 'المريض'), tr('Medication', 'الدواء'), tr('Doctor', 'الطبيب'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')];
          rows = data.map(p => ({ cells: [p.patient_name, p.medication || p.drug_name, p.doctor, statusBadge(p.status), p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SA') : ''], id: p.id }));
          break;
        case 'inventory':
          data = await API.get('/api/inventory');
          title.textContent = tr('Inventory Report', 'تقرير المخزون') + ' (' + data.length + ')';
          headers = [tr('Item', 'الصنف'), tr('Category', 'الفئة'), tr('Qty', 'الكمية'), tr('Reorder', 'إعادة الطلب'), tr('Unit', 'الوحدة'), tr('Status', 'الحالة')];
          rows = data.map(i => ({ cells: [i.name, i.category, i.quantity, i.reorder_level || 10, i.unit, parseInt(i.quantity) <= parseInt(i.reorder_level || 10) ? '<span style="color:#cc0000;font-weight:bold">⚠️ ' + tr('Low', 'منخفض') + '</span>' : '<span style="color:#2e7d32">✅ ' + tr('OK', 'جيد') + '</span>'], id: i.id }));
          break;
        case 'radiology':
          data = await API.get('/api/lab/orders');
          data = data.filter(o => o.order_type === 'Radiology' || o.test_type === 'Radiology');
          title.textContent = tr('Radiology Report', 'تقرير الأشعة') + ' (' + data.length + ')';
          headers = [tr('Patient', 'المريض'), tr('Exam', 'الفحص'), tr('Doctor', 'الطبيب الطالب'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')];
          rows = data.map(r => ({ cells: [r.patient_name, r.test_name || r.test_type, r.doctor || '—', statusBadge(r.status), r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : ''], id: r.id }));
          break;
        case 'medical_history':
          const [labH, rxH, apptH] = await Promise.all([
            API.get('/api/lab/orders').catch(() => []),
            API.get('/api/pharmacy/prescriptions').catch(() => []),
            API.get('/api/appointments').catch(() => [])
          ]);
          // Merge all into single timeline
          const allRecords = [];
          labH.forEach(l => allRecords.push({ type: '🔬 ' + tr('Lab', 'مختبر'), patient: l.patient_name, detail: l.test_name || l.test_type, doctor: l.doctor || '—', status: l.status, date: l.created_at }));
          rxH.forEach(p => allRecords.push({ type: '💊 ' + tr('Pharmacy', 'صيدلية'), patient: p.patient_name, detail: p.medication || p.drug_name, doctor: p.doctor || '—', status: p.status, date: p.created_at }));
          apptH.forEach(a => allRecords.push({ type: '📅 ' + tr('Visit', 'زيارة'), patient: a.patient_name, detail: a.department || a.speciality || '', doctor: a.doctor_name || a.doctor || '—', status: a.status, date: a.appt_date || a.created_at }));
          allRecords.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          data = allRecords;
          title.textContent = tr('Medical History', 'السجل الطبي') + ' (' + data.length + ')';
          headers = [tr('Type', 'النوع'), tr('Patient', 'المريض'), tr('Detail', 'التفاصيل'), tr('Doctor', 'الطبيب'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')];
          rows = allRecords.map((r, i) => ({ cells: [r.type, r.patient, r.detail, r.doctor, statusBadge(r.status), r.date ? new Date(r.date).toLocaleDateString('ar-SA') : ''], id: i }));
          break;
      }
      window._reportData = data;
      createTable(table, 'rptTbl', headers, rows);
    } catch (e) { table.innerHTML = '<p style="color:#cc0000">' + tr('Error loading report', 'خطأ في تحميل التقرير') + '</p>'; }
  };

}

let msgTab = 'inbox';
async function renderMessaging(el) {
  const content = el;

  const messages = await API.get('/api/messages').catch(() => []);
  const users = await API.get('/api/users').catch(() => []);
  const myId = window.currentUser?.id;
  const inbox = messages.filter(m => m.to_user_id == myId);
  const sent = messages.filter(m => m.from_user_id == myId);
  const unread = inbox.filter(m => !m.read_at).length;

  content.innerHTML = `
    <h2>${tr('Messaging', 'الرسائل')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${inbox.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Inbox', 'الوارد')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:${unread > 0 ? '#fce4ec' : '#e8f5e9'}"><h3 style="margin:0;color:${unread > 0 ? '#c62828' : '#2e7d32'}">${unread}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Unread', 'غير مقروءة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${sent.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Sent', 'المرسلة')}</p></div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn btn-primary" onclick="showComposeModal()">✏️ ${tr('Compose', 'رسالة جديدة')}</button>
      <button class="btn btn-sm msgTab" onclick="showMsgTab('inbox')" style="background:#1a73e8;color:#fff">${tr('Inbox', 'الوارد')}</button>
      <button class="btn btn-sm msgTab" onclick="showMsgTab('sent')" style="background:#e0e0e0;color:#333">${tr('Sent', 'المرسلة')}</button>
    </div>
    <div id="msgInbox" class="card" style="padding:16px"></div>
    <div id="msgSent" class="card" style="padding:16px;display:none"></div>`;

  // Render inbox
  const ib = document.getElementById('msgInbox');
  if (ib) { ib.innerHTML = inbox.length ? inbox.map(m => '<div style="padding:12px;margin:4px 0;border-radius:8px;background:' + (m.read_at ? '#fff' : '#e3f2fd') + ';cursor:pointer;border-left:4px solid ' + (m.read_at ? '#ccc' : '#1a73e8') + '" onclick="readMsg(' + m.id + ')"><div style="display:flex;justify-content:space-between"><strong>' + (m.from_name || tr('System', 'النظام')) + '</strong><span style="font-size:11px;color:#666">' + (m.created_at ? new Date(m.created_at).toLocaleString('ar-SA') : '') + '</span></div><p style="margin:4px 0 0;font-size:13px;color:#666">' + (m.subject || m.content || '').substring(0, 80) + '</p></div>').join('') : '<p style="text-align:center;color:#999">' + tr('No messages', 'لا توجد رسائل') + '</p>'; }

  const st = document.getElementById('msgSent');
  if (st) { st.innerHTML = sent.length ? sent.map(m => '<div style="padding:12px;margin:4px 0;border-radius:8px;background:#f5f5f5;border-left:4px solid #4caf50"><div style="display:flex;justify-content:space-between"><strong>→ ' + (m.to_name || '') + '</strong><span style="font-size:11px;color:#666">' + (m.created_at ? new Date(m.created_at).toLocaleString('ar-SA') : '') + '</span></div><p style="margin:4px 0 0;font-size:13px;color:#666">' + (m.subject || m.content || '').substring(0, 80) + '</p></div>').join('') : '<p style="text-align:center;color:#999">' + tr('No sent messages', 'لا توجد رسائل مرسلة') + '</p>'; }

  window.showMsgTab = (tab) => { document.getElementById('msgInbox').style.display = tab === 'inbox' ? '' : 'none'; document.getElementById('msgSent').style.display = tab === 'sent' ? '' : 'none'; };
  window.readMsg = async (id) => { try { await API.put('/api/messages/' + id + '/read', {}); const m = messages.find(x => x.id === id); if (m) { const modal = document.createElement('div'); modal.className = 'modal-overlay'; modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center'; modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:500px;max-height:80vh;overflow:auto"><h3 style="margin:0 0 8px">' + (m.subject || tr('Message', 'رسالة')) + '</h3><p style="color:#666;font-size:12px;margin:0 0 16px">' + tr('From', 'من') + ': ' + (m.from_name || '') + ' — ' + (m.created_at ? new Date(m.created_at).toLocaleString('ar-SA') : '') + '</p><div style="padding:12px;background:#f5f5f5;border-radius:8px;white-space:pre-wrap">' + (m.content || '') + '</div><button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()" style="width:100%;margin-top:16px">' + tr('Close', 'إغلاق') + '</button></div>'; document.body.appendChild(modal); modal.onclick = e => { if (e.target === modal) modal.remove(); } } } catch (e) { } };
  window.showComposeModal = () => {
    const modal = document.createElement('div'); modal.className = 'modal-overlay'; modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:500px"><h3 style="margin:0 0 16px">✏️ ' + tr('New Message', 'رسالة جديدة') + '</h3><div class="form-group"><label>' + tr('To', 'إلى') + '</label><select class="form-input" id="msgTo">' + users.map(u => '<option value="' + u.id + '">' + u.display_name + '</option>').join('') + '</select></div><div class="form-group"><label>' + tr('Subject', 'الموضوع') + '</label><input class="form-input" id="msgSubject"></div><div class="form-group"><label>' + tr('Message', 'الرسالة') + '</label><textarea class="form-input" id="msgContent" rows="4"></textarea></div><div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="sendMessage()" style="flex:1">📤 ' + tr('Send', 'إرسال') + '</button><button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1">' + tr('Cancel', 'إلغاء') + '</button></div></div>';
    document.body.appendChild(modal); modal.onclick = e => { if (e.target === modal) modal.remove(); };
  };
  window.sendMessage = async () => { try { await API.post('/api/messages', { to_user_id: document.getElementById('msgTo').value, subject: document.getElementById('msgSubject').value, content: document.getElementById('msgContent').value }); document.querySelector('.modal-overlay')?.remove(); showToast(tr('Message sent!', 'تم إرسال الرسالة!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };

}
window.sendMsg = async function () {
  const receiver_id = document.getElementById('msgTo').value;
  const subject = document.getElementById('msgSubject').value;
  const body = document.getElementById('msgBody').value;
  const priority = document.getElementById('msgPriority').value;
  if (!subject) return showToast(tr('Subject required', 'الموضوع مطلوب'), 'error');
  await API.post('/api/messages', { receiver_id, subject, body, priority });
  showToast(tr('Message sent', 'تم الإرسال')); msgTab = 'sent'; navigateTo(15);
};
window.markRead = async function (id) { await API.put('/api/messages/' + id + '/read', {}); navigateTo(15); };
window.deleteMsg = async function (id) { if (confirm(tr('Delete?', 'حذف؟'))) { await API.delete('/api/messages/' + id); navigateTo(15); } };

// ===== SETTINGS =====
let settingsUsersList = [];
let editingUserId = null;



async function loadDashboardCharts() {
  try {
    if (typeof Chart === 'undefined') return;
    const data = await API.get('/api/dashboard/charts');

    // Revenue trend line chart
    const revCtx = document.getElementById('revenueChart');
    if (revCtx && data.revenueTrend) {
      new Chart(revCtx, {
        type: 'line',
        data: {
          labels: data.revenueTrend.map(d => new Date(d.day).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })),
          datasets: [{
            label: isArabic ? 'الإيرادات' : 'Revenue',
            data: data.revenueTrend.map(d => parseFloat(d.revenue)),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26,115,232,0.1)',
            fill: true, tension: 0.4, pointRadius: 3
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    }

    // Department pie chart
    const deptCtx = document.getElementById('deptChart');
    if (deptCtx && data.byDepartment && data.byDepartment.length > 0) {
      const colors = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#ff6d01', '#46bdc6', '#7baaf7', '#f07b72', '#fcd04f', '#71c287'];
      new Chart(deptCtx, {
        type: 'doughnut',
        data: {
          labels: data.byDepartment.map(d => d.dept),
          datasets: [{ data: data.byDepartment.map(d => parseInt(d.count)), backgroundColor: colors.slice(0, data.byDepartment.length) }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
      });
    }

    // Top doctors bar chart
    const docCtx = document.getElementById('doctorChart');
    if (docCtx && data.topDoctors && data.topDoctors.length > 0) {
      new Chart(docCtx, {
        type: 'bar',
        data: {
          labels: data.topDoctors.map(d => d.doctor?.split(' ').slice(0, 2).join(' ') || ''),
          datasets: [{ label: isArabic ? 'مرضى' : 'Patients', data: data.topDoctors.map(d => parseInt(d.patients)), backgroundColor: '#34a853', borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }

    // Payment methods pie
    const payCtx = document.getElementById('paymentChart');
    if (payCtx && data.paymentMethods && data.paymentMethods.length > 0) {
      new Chart(payCtx, {
        type: 'pie',
        data: {
          labels: data.paymentMethods.map(d => d.method),
          datasets: [{ data: data.paymentMethods.map(d => parseFloat(d.total)), backgroundColor: ['#34a853', '#1a73e8', '#fbbc04', '#ea4335', '#ff6d01'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    }

  } catch (e) { console.error('Charts load error:', e); }
}


async function renderSettings(el) {
  const content = el;

  content.innerHTML = `
    <h2>${tr('Settings', 'الإعدادات')}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 16px">🏥 ${tr('Hospital Information', 'معلومات المستشفى')}</h4>
        <div class="form-group"><label>${tr('Hospital Name (AR)', 'اسم المستشفى (عربي)')}</label><input class="form-input" id="setNameAr" value="المركز الطبي"></div>
        <div class="form-group"><label>${tr('Hospital Name (EN)', 'اسم المستشفى (إنجليزي)')}</label><input class="form-input" id="setNameEn" value="Medical Center"></div>
        <div class="form-group"><label>${tr('Phone', 'الهاتف')}</label><input class="form-input" id="setPhone"></div>
        <div class="form-group"><label>${tr('Email', 'البريد')}</label><input class="form-input" id="setEmail"></div>
        <div class="form-group"><label>${tr('Address', 'العنوان')}</label><textarea class="form-input" id="setAddress" rows="2"></textarea></div>
        <div class="form-group"><label>${tr('CR Number', 'سجل تجاري')}</label><input class="form-input" id="setCR"></div>
        <div class="form-group"><label>${tr('VAT Number', 'رقم ضريبي')}</label><input class="form-input" id="setVAT"></div>
        <button class="btn btn-primary w-full" onclick="showToast(tr('Settings saved!','تم حفظ الإعدادات!'))">💾 ${tr('Save', 'حفظ')}</button>
      </div>
      <div>
        <div class="card" style="padding:20px;margin-bottom:16px">
          <h4 style="margin:0 0 16px">🎨 ${tr('Appearance', 'المظهر')}</h4>
          <div class="form-group"><label>${tr('Language', 'اللغة')}</label>
            <select class="form-input" onchange="setLang(this.value)"><option value="en" ${!isArabic ? 'selected' : ''}>English</option><option value="ar" ${isArabic ? 'selected' : ''}>العربية</option></select></div>
          <div class="form-group"><label>${tr('Theme', 'السمة')}</label>
            <select class="form-input" id="setTheme" onchange="if(typeof changeTheme==='function')changeTheme(this.value)">
              <option value="light-blue">${tr('Light Blue', 'فاتح أزرق')}</option>
              <option value="dark">${tr('Dark', 'داكن')}</option>
              <option value="green">${tr('Green', 'أخضر')}</option>
            </select></div>
        </div>
        <div class="card" style="padding:20px;margin-bottom:16px">
          <h4 style="margin:0 0 16px">🔔 ${tr('Notifications', 'الإشعارات')}</h4>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input type="checkbox" checked> ${tr('Lab results ready', 'نتائج المختبر جاهزة')}</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input type="checkbox" checked> ${tr('New appointments', 'مواعيد جديدة')}</label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><input type="checkbox" checked> ${tr('Low inventory alerts', 'تنبيه مخزون منخفض')}</label>
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox"> ${tr('Email notifications', 'إشعارات بريد')}</label>
        </div>
        <div class="card" style="padding:20px">
          <h4 style="margin:0 0 16px">🛡️ ${tr('System', 'النظام')}</h4>
          <p style="font-size:13px;color:#666;margin-bottom:8px">${tr('Version', 'الإصدار')}: 3.0.0</p>
          <p style="font-size:13px;color:#666;margin-bottom:8px">${tr('Database', 'قاعدة البيانات')}: PostgreSQL</p>
          <p style="font-size:13px;color:#666">${tr('Server', 'الخادم')}: Node.js / Express</p>
        </div>
      </div>
    </div>`;

}
window.saveSettings = async () => {
  try {
    await API.put('/api/settings', { company_name_ar: document.getElementById('sNameAr').value, company_name_en: document.getElementById('sNameEn').value, tax_number: document.getElementById('sTax').value, cr_number: document.getElementById('sCr').value, phone: document.getElementById('sPhone').value, address: document.getElementById('sAddr').value });
    showToast(tr('Settings saved!', 'تم حفظ الإعدادات!'));
  } catch (e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
};
window.addOrUpdateUser = async () => {
  const username = document.getElementById('suUser').value.trim();
  const password = document.getElementById('suPass').value.trim();

  if (!username) { showToast(tr('Enter username', 'ادخل المستخدم'), 'error'); return; }
  if (!editingUserId && !password) { showToast(tr('Enter password for new user', 'ادخل كلمة المرور للمستخدم الجديد'), 'error'); return; }

  try {
    const role = document.getElementById('suRole').value;
    const spec = role === 'Doctor' ? document.getElementById('suSpec').value : '';
    const perms = Array.from(document.querySelectorAll('#suPerms input:checked')).map(cb => cb.value).join(',');
    const commType = role === 'Doctor' ? (document.getElementById('suCommType')?.value || 'percentage') : 'percentage';
    const commValue = role === 'Doctor' ? (parseFloat(document.getElementById('suCommValue')?.value) || 0) : 0;

    if (editingUserId) {
      await API.put(`/api/settings/users/${editingUserId}`, { username, password: password || undefined, display_name: document.getElementById('suName').value, role, speciality: spec, permissions: perms, commission_type: commType, commission_value: commValue, is_active: 1 });
      showToast(tr('User updated!', 'تم تحديث المستخدم!'));
    } else {
      await API.post('/api/settings/users', { username, password, display_name: document.getElementById('suName').value, role, speciality: spec, permissions: perms, commission_type: commType, commission_value: commValue });
      showToast(tr('User added!', 'تم إنشاء المستخدم!'));
    }

    editingUserId = null;
    await navigateTo(18);
  } catch (e) { showToast(e.message || tr('Error saving user', 'خطأ في عملية الحفظ'), 'error'); }
};

window.editUser = (id) => {
  const user = settingsUsersList.find(u => u.id === id);
  if (!user) return;
  editingUserId = id;
  document.getElementById('suUser').value = user.username || '';
  document.getElementById('suName').value = user.display_name || '';
  document.getElementById('suRole').value = user.role || 'Reception';
  document.getElementById('suPass').value = '';

  if (user.role === 'Doctor') {
    document.getElementById('suSpecDiv').style.display = 'block';
    document.getElementById('suSpec').value = user.speciality || 'General Clinic';
    document.getElementById('suCommDiv').style.display = 'block';
    document.getElementById('suCommType').value = user.commission_type || 'percentage';
    document.getElementById('suCommValue').value = user.commission_value || 0;
  } else {
    document.getElementById('suSpecDiv').style.display = 'none';
    document.getElementById('suCommDiv').style.display = 'none';
  }

  document.querySelectorAll('#suPerms input').forEach(cb => cb.checked = false);
  const perms = (user.permissions || '').split(',');
  perms.forEach(p => {
    const cb = document.getElementById(`perm_${p}`);
    if (cb) cb.checked = true;
  });

  document.getElementById('suCancelBtn').style.display = 'inline-block';
  document.getElementById('suAddBtn').innerHTML = `🔄 ${tr('Update User', 'تحديث المستخدم')}`;
};

window.cancelEditUser = () => {
  editingUserId = null;
  document.getElementById('suUser').value = '';
  document.getElementById('suName').value = '';
  document.getElementById('suPass').value = '';
  document.getElementById('suRole').value = 'Reception';
  document.getElementById('suSpecDiv').style.display = 'none';
  document.getElementById('suCommDiv').style.display = 'none';
  document.querySelectorAll('#suPerms input').forEach(cb => cb.checked = true);
  document.getElementById('suCancelBtn').style.display = 'none';
  document.getElementById('suAddBtn').innerHTML = `➕ ${tr('Save User', 'حفظ المستخدم')}`;
};

window.deleteUser = async (id) => {
  if (!confirm(tr('Are you sure you want to delete this user? This cannot be undone.', 'هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.'))) return;
  try {
    await API.delete(`/api/settings/users/${id}`);
    showToast(tr('User deleted!', 'تم الحذف بنجاح!'));
    await navigateTo(18);
  } catch (e) { showToast(e.message || tr('Error deleting', 'خطأ في الحذف'), 'error'); }
};

// ===== CATALOG MODULE =====
async function renderCatalog(el) {
  const [labTests, radExams, services] = await Promise.all([
    API.get('/api/catalog/lab'),
    API.get('/api/catalog/radiology'),
    API.get('/api/medical/services')
  ]);

  // Group lab tests by category
  const labGroups = {};
  labTests.forEach(t => { if (!labGroups[t.category]) labGroups[t.category] = []; labGroups[t.category].push(t); });

  // Group radiology by modality
  const radGroups = {};
  radExams.forEach(r => { if (!radGroups[r.modality]) radGroups[r.modality] = []; radGroups[r.modality].push(r); });

  // Group services by specialty then category
  const svcGroups = {};
  services.forEach(s => {
    if (!svcGroups[s.specialty]) svcGroups[s.specialty] = {};
    if (!svcGroups[s.specialty][s.category]) svcGroups[s.specialty][s.category] = [];
    svcGroups[s.specialty][s.category].push(s);
  });

  const specNames = {
    'General Practice': 'الطب العام', 'Dentistry': 'طب الأسنان', 'Internal Medicine': 'الباطنية',
    'Cardiology': 'القلب', 'Dermatology': 'الجلدية', 'Ophthalmology': 'العيون',
    'ENT': 'الأنف والأذن', 'Orthopedics': 'العظام', 'Obstetrics': 'النساء والولادة',
    'Pediatrics': 'الأطفال', 'Neurology': 'الأعصاب', 'Psychiatry': 'الطب النفسي',
    'Urology': 'المسالك البولية', 'Endocrinology': 'الغدد الصماء', 'Gastroenterology': 'الجهاز الهضمي',
    'Pulmonology': 'الصدرية', 'Nephrology': 'الكلى', 'Surgery': 'الجراحة العامة',
    'Oncology': 'الأورام', 'Physiotherapy': 'العلاج الطبيعي', 'Nutrition': 'التغذية',
    'Emergency': 'الطوارئ'
  };

  const catIcons = { 'Consultation': '🩺', 'Procedure': '🔧', 'Diagnostic': '📊', 'Therapy': '💆', 'Service': '📝' };

  el.innerHTML = `
    <div class="page-title">📂 ${tr('Service Catalog', 'الأصناف والخدمات')}</div>
    <div class="flex gap-8 mb-16">
      <button class="btn btn-primary" id="catTabLab" onclick="switchCatTab('lab')" style="flex:1">🔬 ${tr('Lab Tests', 'فحوصات المختبر')} (${labTests.length})</button>
      <button class="btn btn-secondary" id="catTabRad" onclick="switchCatTab('rad')" style="flex:1">📡 ${tr('Radiology', 'الأشعة')} (${radExams.length})</button>
      <button class="btn btn-secondary" id="catTabSvc" onclick="switchCatTab('svc')" style="flex:1">🏥 ${tr('Procedures', 'الإجراءات الطبية')} (${services.length})</button>
    </div>
    <input class="form-input mb-12" id="catSearch" placeholder="${tr('Search...', 'بحث...')}" oninput="filterCatalog()">

    <div id="catLabContent">
      ${Object.entries(labGroups).map(([cat, tests]) => `
        <div class="card mb-12 cat-item">
          <div class="card-title" style="cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            🧪 ${cat} <span class="badge badge-info">${tests.length}</span> <span style="float:left;font-size:12px;color:var(--text-dim)">▼</span>
          </div>
          <div style="display:none">
            <table class="data-table"><thead><tr>
              <th style="width:40%">${tr('Test Name', 'اسم الفحص')}</th>
              <th>${tr('Normal Range', 'المعدل الطبيعي')}</th>
              <th style="width:100px">${tr('Price', 'السعر')}</th>
              <th style="width:60px"></th>
            </tr></thead><tbody>
            ${tests.map(t => `<tr class="cat-row" data-name="${t.test_name.toLowerCase()}">
              <td>${t.test_name}</td>
              <td style="font-size:11px;color:var(--text-dim)">${t.normal_range || '-'}</td>
              <td><input type="number" class="form-input" value="${t.price}" id="labP${t.id}" style="width:80px;text-align:center;padding:4px 6px;font-size:12px"></td>
              <td><button class="btn btn-sm btn-success" onclick="saveCatPrice('lab',${t.id})">💾</button></td>
            </tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      `).join('')}
    </div>

    <div id="catRadContent" style="display:none">
      ${Object.entries(radGroups).map(([mod, exams]) => `
        <div class="card mb-12 cat-item">
          <div class="card-title" style="cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            📡 ${mod} <span class="badge badge-info">${exams.length}</span> <span style="float:left;font-size:12px;color:var(--text-dim)">▼</span>
          </div>
          <div style="display:none">
            <table class="data-table"><thead><tr>
              <th style="width:60%">${tr('Exam Name', 'اسم الفحص')}</th>
              <th style="width:100px">${tr('Price', 'السعر')}</th>
              <th style="width:60px"></th>
            </tr></thead><tbody>
            ${exams.map(r => `<tr class="cat-row" data-name="${r.exact_name.toLowerCase()}">
              <td>${r.exact_name}</td>
              <td><input type="number" class="form-input" value="${r.price}" id="radP${r.id}" style="width:80px;text-align:center;padding:4px 6px;font-size:12px"></td>
              <td><button class="btn btn-sm btn-success" onclick="saveCatPrice('rad',${r.id})">💾</button></td>
            </tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      `).join('')}
    </div>

    <div id="catSvcContent" style="display:none">
      <div class="flex gap-8 mb-12" style="flex-wrap:wrap" id="catSpecFilter">
        <button class="btn btn-sm btn-primary" onclick="filterSpec('all')">📋 ${tr('All', 'الكل')}</button>
        ${Object.keys(svcGroups).map(s => `<button class="btn btn-sm btn-secondary" onclick="filterSpec('${s}')">${specNames[s] || s}</button>`).join('')}
      </div>
      ${Object.entries(svcGroups).map(([spec, cats]) => `
        <div class="spec-group" data-spec="${spec}">
          <div class="card mb-12">
            <div class="card-title" style="cursor:pointer;background:var(--hover);border-radius:8px;padding:12px" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
              🏥 ${specNames[spec] || spec} — ${spec} <span class="badge badge-info">${Object.values(cats).flat().length}</span> <span style="float:left;font-size:12px;color:var(--text-dim)">▼</span>
            </div>
            <div style="display:none">
              ${Object.entries(cats).map(([cat, items]) => `
                <div style="margin:12px 0">
                  <div style="font-weight:600;margin-bottom:8px;padding:6px 12px;background:var(--hover);border-radius:6px">${catIcons[cat] || '📌'} ${cat} <span class="badge badge-info" style="font-size:10px">${items.length}</span></div>
                  <table class="data-table"><thead><tr>
                    <th>${tr('Procedure (EN)', 'الإجراء (إنجليزي)')}</th>
                    <th>${tr('Procedure (AR)', 'الإجراء (عربي)')}</th>
                    <th style="width:100px">${tr('Price', 'السعر')}</th>
                    <th style="width:60px"></th>
                  </tr></thead><tbody>
                  ${items.map(s => `<tr class="cat-row" data-name="${s.name_en.toLowerCase()} ${s.name_ar}">
                    <td style="font-size:12px">${s.name_en}</td>
                    <td style="font-size:12px">${s.name_ar}</td>
                    <td><input type="number" class="form-input" value="${s.price}" id="svcP${s.id}" style="width:80px;text-align:center;padding:4px 6px;font-size:12px"></td>
                    <td><button class="btn btn-sm btn-success" onclick="saveCatPrice('svc',${s.id})">💾</button></td>
                  </tr>`).join('')}
                  </tbody></table>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

window.switchCatTab = (tab) => {
  document.getElementById('catLabContent').style.display = tab === 'lab' ? 'block' : 'none';
  document.getElementById('catRadContent').style.display = tab === 'rad' ? 'block' : 'none';
  document.getElementById('catSvcContent').style.display = tab === 'svc' ? 'block' : 'none';
  document.getElementById('catTabLab').className = `btn ${tab === 'lab' ? 'btn-primary' : 'btn-secondary'}`;
  document.getElementById('catTabRad').className = `btn ${tab === 'rad' ? 'btn-primary' : 'btn-secondary'}`;
  document.getElementById('catTabSvc').className = `btn ${tab === 'svc' ? 'btn-primary' : 'btn-secondary'}`;
};

window.filterCatalog = () => {
  const q = document.getElementById('catSearch').value.toLowerCase();
  document.querySelectorAll('.cat-row').forEach(row => {
    row.style.display = row.dataset.name.includes(q) ? '' : 'none';
  });
};

window.filterSpec = (spec) => {
  document.querySelectorAll('.spec-group').forEach(g => {
    g.style.display = (spec === 'all' || g.dataset.spec === spec) ? 'block' : 'none';
  });
};

window.saveCatPrice = async (type, id) => {
  try {
    let url, price;
    if (type === 'lab') { url = `/api/catalog/lab/${id}`; price = parseFloat(document.getElementById(`labP${id}`).value); }
    else if (type === 'rad') { url = `/api/catalog/radiology/${id}`; price = parseFloat(document.getElementById(`radP${id}`).value); }
    else { url = `/api/medical/services/${id}`; price = parseFloat(document.getElementById(`svcP${id}`).value); }
    await API.put(url, { price });
    showToast(tr('Price saved!', 'تم حفظ السعر!'));
  } catch (e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
};

// ===== DEPARTMENT RESOURCE REQUESTS =====
async function renderDeptRequests(el) {
  const content = el;

  const requests = await API.get('/api/dept-requests').catch(() => []);
  const pending = requests.filter(r => r.status === 'pending').length;

  content.innerHTML = `
    <h2>${tr('Department Requests', 'طلبات الأقسام')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${requests.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total', 'الإجمالي')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${pending}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Pending Approval', 'بانتظار الموافقة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Request', 'طلب جديد')}</h4>
        <div class="form-group"><label>${tr('Type', 'النوع')}</label>
          <select class="form-input" id="drType"><option value="supplies">${tr('Supplies', 'مستلزمات')}</option><option value="equipment">${tr('Equipment', 'أجهزة')}</option><option value="maintenance">${tr('Maintenance', 'صيانة')}</option><option value="staffing">${tr('Staffing', 'توظيف')}</option><option value="other">${tr('Other', 'أخرى')}</option></select></div>
        <div class="form-group"><label>${tr('Department', 'القسم')}</label><input class="form-input" id="drDept"></div>
        <div class="form-group"><label>${tr('Item/Description', 'البند/الوصف')}</label><input class="form-input" id="drItem"></div>
        <div class="form-group"><label>${tr('Quantity', 'الكمية')}</label><input type="number" class="form-input" id="drQty" value="1"></div>
        <div class="form-group"><label>${tr('Priority', 'الأولوية')}</label>
          <select class="form-input" id="drPriority"><option value="low">${tr('Low', 'منخفضة')}</option><option value="medium" selected>${tr('Medium', 'متوسطة')}</option><option value="high">${tr('High', 'عالية')}</option><option value="urgent">${tr('Urgent', 'عاجلة')}</option></select></div>
        <div class="form-group"><label>${tr('Notes', 'ملاحظات')}</label><textarea class="form-input" id="drNotes" rows="2"></textarea></div>
        <button class="btn btn-primary w-full" onclick="saveDeptReq()">📤 ${tr('Submit', 'تقديم')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Requests', 'الطلبات')}</h4>
        <div id="drTable"></div>
      </div>
    </div>`;

  const dt = document.getElementById('drTable');
  if (dt) {
    createTable(dt, 'drTbl',
      [tr('Type', 'النوع'), tr('Dept', 'القسم'), tr('Item', 'البند'), tr('Qty', 'الكمية'), tr('Priority', 'الأولوية'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', '')],
      requests.map(r => ({ cells: [r.request_type || r.type || '', r.department || '', r.item || r.description || '', r.quantity || '', r.priority || '', statusBadge(r.status), r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '', r.status === 'pending' ? '<button class="btn btn-sm" style="background:#e8f5e9;color:#2e7d32" onclick="approveDeptReq(' + r.id + ')">✅ ' + tr('Approve', 'موافقة') + '</button> <button class="btn btn-sm" style="background:#fce4ec;color:#c62828" onclick="rejectDeptReq(' + r.id + ')">❌</button>' : ''], id: r.id }))
    );
  }
  window.saveDeptReq = async () => { try { await API.post('/api/dept-requests', { request_type: document.getElementById('drType').value, department: document.getElementById('drDept').value, item: document.getElementById('drItem').value, quantity: document.getElementById('drQty').value, priority: document.getElementById('drPriority').value, notes: document.getElementById('drNotes').value, requested_by: window.currentUser?.display_name || '' }); showToast(tr('Request submitted!', 'تم تقديم الطلب!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };
  window.approveDeptReq = async (id) => { try { await API.put('/api/dept-requests/' + id, { status: 'approved' }); showToast('✅'); navigateTo(currentPage); } catch (e) { } };
  window.rejectDeptReq = async (id) => { try { await API.put('/api/dept-requests/' + id, { status: 'rejected' }); showToast('❌'); navigateTo(currentPage); } catch (e) { } };

}
let drqItems = [];
window.addDrqItem = () => {
  const sel = document.getElementById('drqItem');
  const itemId = parseInt(sel.value);
  const itemName = sel.options[sel.selectedIndex]?.text || '';
  const qty = parseInt(document.getElementById('drqQty').value) || 1;
  if (!itemId) return;
  if (drqItems.find(x => x.item_id === itemId)) { showToast(tr('Item already added', 'الصنف مضاف مسبقاً'), 'error'); return; }
  drqItems.push({ item_id: itemId, name: itemName, qty });
  renderDrqItems();
};
function renderDrqItems() {
  const c = document.getElementById('drqItemsList');
  if (!drqItems.length) { c.innerHTML = `<span style="color:var(--text-dim);font-size:13px">${tr('No items added', 'لم تتم إضافة أصناف')}</span>`; return; }
  c.innerHTML = drqItems.map((item, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--hover);border-radius:8px;margin:4px 0">
    <span>${item.name} × <strong>${item.qty}</strong></span>
    <button class="btn btn-danger btn-sm" onclick="drqItems.splice(${i},1);renderDrqItems()">🗑</button>
  </div>`).join('');
}
window.submitDrq = async () => {
  if (!drqItems.length) { showToast(tr('Add items first', 'أضف أصناف أولاً'), 'error'); return; }
  try {
    await API.post('/api/dept-requests', {
      department: document.getElementById('drqDept').value,
      requested_by: currentUser?.name || '',
      items: drqItems,
      notes: document.getElementById('drqNotes').value
    });
    showToast(tr('Request submitted!', 'تم إرسال الطلب!'));
    drqItems = [];
    await navigateTo(17);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.approveDrq = async (id) => {
  try { await API.put(`/api/dept-requests/${id}`, { status: 'Approved' }); showToast(tr('Approved!', 'تم الاعتماد!')); await navigateTo(17); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.rejectDrq = async (id) => {
  try { await API.put(`/api/dept-requests/${id}`, { status: 'Rejected' }); showToast(tr('Rejected', 'تم الرفض')); await navigateTo(17); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== SURGERY & PRE-OP =====
let surgeryTab = 'schedule';
async function renderSurgery(el) {
  const [surgeries, patients, ors, emps] = await Promise.all([
    API.get('/api/surgeries'), API.get('/api/patients'),
    API.get('/api/operating-rooms'), API.get('/api/employees')
  ]);
  const doctors = emps.filter(e => e.role === 'Doctor' || e.name);
  const priorityBadge = p => p === 'Urgent' ? badge(p, 'danger') : p === 'Emergency' ? badge(p, 'danger') : badge(p, 'info');
  const surgStatusBadge = s => ({ Scheduled: 'info', 'In Progress': 'warning', Completed: 'success', Cancelled: 'danger' }[s] || 'info');

  el.innerHTML = `
    <div class="page-title">🏥 ${tr('Surgery & Pre-Op Management', 'العمليات وما قبلها')}</div>
    <div class="flex gap-8 mb-16" style="flex-wrap:wrap">
      <button class="btn ${surgeryTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}" onclick="surgeryTab='schedule';navigateTo(18)">📅 ${tr('Surgery Schedule', 'جدول العمليات')}</button>
      <button class="btn ${surgeryTab === 'preop' ? 'btn-primary' : 'btn-secondary'}" onclick="surgeryTab='preop';navigateTo(18)">📋 ${tr('Pre-Op Assessment', 'تقييم ما قبل العملية')}</button>
      <button class="btn ${surgeryTab === 'anesthesia' ? 'btn-primary' : 'btn-secondary'}" onclick="surgeryTab='anesthesia';navigateTo(18)">💉 ${tr('Anesthesia', 'التخدير')}</button>
      <button class="btn ${surgeryTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}" onclick="surgeryTab='rooms';navigateTo(18)">🚪 ${tr('Operating Rooms', 'غرف العمليات')}</button>
    </div>
    <div id="surgeryContent"></div>`;

  const cont = document.getElementById('surgeryContent');
  if (surgeryTab === 'schedule') {
    cont.innerHTML = `
    <div class="split-layout"><div class="card">
      <div class="card-title">📝 ${tr('Schedule New Surgery', 'جدولة عملية جديدة')}</div>
      <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><select class="form-input" id="srgPatient">${patients.map(p => `<option value="${p.id}" data-name="">${p.file_number} - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Procedure', 'الإجراء')}</label><input class="form-input" id="srgProc" placeholder="${tr('e.g. Appendectomy', 'مثال: استئصال الزائدة')}"></div>
      <div class="form-group mb-12"><label>${tr('Procedure (Arabic)', 'الإجراء بالعربية')}</label><input class="form-input" id="srgProcAr"></div>
      <div class="form-group mb-12"><label>${tr('Surgeon', 'الجراح')}</label><select class="form-input" id="srgSurgeon"><option value="">${tr('Select', 'اختر')}</option>${doctors.map(d => `<option value="${d.id}" data-name="${d.name}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Anesthetist', 'طبيب التخدير')}</label><select class="form-input" id="srgAnesth"><option value="">${tr('Select', 'اختر')}</option>${doctors.map(d => `<option value="${d.id}" data-name="${d.name}">${d.name}</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Type', 'النوع')}</label><select class="form-input" id="srgType"><option value="Elective">${tr('Elective', 'اختيارية')}</option><option value="Urgent">${tr('Urgent', 'عاجلة')}</option><option value="Emergency">${tr('Emergency', 'طارئة')}</option></select></div>
      <div class="form-group mb-12"><label>${tr('Operating Room', 'غرفة العمليات')}</label><select class="form-input" id="srgOR">${ors.map(o => `<option value="${isArabic ? o.room_name_ar : o.room_name}">${isArabic ? o.room_name_ar : o.room_name} (${o.location})</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Date', 'التاريخ')}</label><input class="form-input" type="date" id="srgDate" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group mb-12"><label>${tr('Time', 'الوقت')}</label><input class="form-input" type="time" id="srgTime" value="08:00"></div>
      <div class="form-group mb-12"><label>${tr('Duration (min)', 'المدة (دقيقة)')}</label><input class="form-input" type="number" id="srgDur" value="60"></div>
      <div class="form-group mb-12"><label>${tr('Priority', 'الأولوية')}</label><select class="form-input" id="srgPriority"><option value="Normal">${tr('Normal', 'عادية')}</option><option value="Urgent">${tr('Urgent', 'عاجلة')}</option><option value="Emergency">${tr('Emergency', 'طارئة')}</option></select></div>
      <div class="form-group mb-12"><label>${tr('Notes', 'ملاحظات')}</label><textarea class="form-input form-textarea" id="srgNotes"></textarea></div>
      <button class="btn btn-primary w-full" onclick="scheduleSurgery()" style="height:44px">📅 ${tr('Schedule Surgery', 'جدولة العملية')}</button>
    </div><div class="card">
      <div class="card-title">📋 ${tr('Surgery Schedule', 'جدول العمليات')}</div>
      <input class="search-filter" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'srgTable')">
      <div id="srgTable">${makeTable(
      [tr('ID', '#'), tr('Patient', 'المريض'), tr('Procedure', 'الإجراء'), tr('Surgeon', 'الجراح'), tr('Date', 'التاريخ'), tr('Time', 'الوقت'), tr('OR', 'الغرفة'), tr('Priority', 'الأولوية'), tr('Pre-Op', 'ما قبل'), tr('Status', 'الحالة'), tr('Actions', 'إجراءات')],
      surgeries.map(s => ({ cells: [s.id, s.patient_name, isArabic ? (s.procedure_name_ar || s.procedure_name) : s.procedure_name, s.surgeon_name, s.scheduled_date, s.scheduled_time, s.operating_room, priorityBadge(s.priority), badge(s.preop_status, s.preop_status === 'Complete' ? 'success' : s.preop_status === 'In Progress' ? 'warning' : 'danger'), badge(s.status, surgStatusBadge(s.status))], id: s.id })),
      row => `<div class="flex gap-4" style="flex-wrap:wrap">
              ${row.cells[9]?.includes('Scheduled') || row.cells[9]?.includes('info') ? `<button class="btn btn-warning btn-sm" onclick="updateSurgStatus(${row.id},'In Progress')" style="font-size:11px">▶ ${tr('Start', 'بدء')}</button>` : ''}
              ${!row.cells[9]?.includes('Completed') && !row.cells[9]?.includes('success') ? `<button class="btn btn-success btn-sm" onclick="updateSurgStatus(${row.id},'Completed')" style="font-size:11px;font-weight:bold">✅ ${tr('Surgery Done', 'انتهت العملية')}</button>` : `<span class="badge badge-success">✅ ${tr('Done', 'منتهية')}</span>`}
              <button class="btn btn-danger btn-sm" onclick="deleteSurgery(${row.id})" style="font-size:11px">🗑</button>
            </div>`
    )}</div>
    </div></div>`;
  } else if (surgeryTab === 'preop') {
    cont.innerHTML = `<div class="card">
      <div class="card-title">📋 ${tr('Pre-Operative Assessment', 'تقييم ما قبل العملية')}</div>
      <div class="form-group mb-12"><label>${tr('Select Surgery', 'اختر العملية')}</label>
        <select class="form-input" id="preopSurgery" onchange="loadPreopAssessment()">
          <option value="">${tr('-- Select --', '-- اختر --')}</option>
          ${surgeries.filter(s => s.status === 'Scheduled').map(s => `<option value="${s.id}">${s.id} - ${s.patient_name} - ${s.procedure_name} (${s.scheduled_date})</option>`).join('')}
        </select>
      </div>
      <div id="preopForm" style="display:none">
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
          ${[{ id: 'npo', icon: '🚫', l: 'NPO Confirmed (صيام مؤكد)' }, { id: 'allergies', icon: '⚠️', l: 'Allergies Reviewed (مراجعة الحساسية)', hasNotes: 1 }, { id: 'medications', icon: '💊', l: 'Medications Reviewed (مراجعة الأدوية)', hasNotes: 1 },
      { id: 'labs', icon: '🔬', l: 'Labs Reviewed (مراجعة الفحوصات)', hasNotes: 1 }, { id: 'imaging', icon: '📡', l: 'Imaging Reviewed (مراجعة الأشعة)', hasNotes: 1 }, { id: 'blood_type', icon: '🩸', l: 'Blood Type Confirmed (فصيلة الدم مؤكدة)' },
      { id: 'consent', icon: '📝', l: 'Consent Signed (الإقرار موقع)' }, { id: 'anesthesia_clr', icon: '💉', l: 'Anesthesia Clearance (موافقة التخدير)' }, { id: 'nursing', icon: '👩‍⚕️', l: 'Nursing Assessment (تقييم التمريض)', hasNotes: 1 },
      { id: 'cardiac', icon: '❤️', l: 'Cardiac Clearance (موافقة القلب)', hasNotes: 1 }, { id: 'pulmonary', icon: '🫁', l: 'Pulmonary Clearance (موافقة الرئة)' }, { id: 'infection', icon: '🦠', l: 'Infection Screening (فحص العدوى)' },
      { id: 'dvt', icon: '💉', l: 'DVT Prophylaxis (الوقاية من الجلطات)' }
      ].map(c => `<div class="stat-card" style="--stat-color:#60a5fa;padding:12px;cursor:pointer" onclick="document.getElementById('preop_${c.id}').checked=!document.getElementById('preop_${c.id}').checked">
            <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="preop_${c.id}" style="width:20px;height:20px;accent-color:#4ade80" onclick="event.stopPropagation()"> <span>${c.icon} ${c.l}</span></div>
            ${c.hasNotes ? `<input class="form-input mt-8" id="preop_${c.id}_notes" placeholder="${tr('Notes', 'ملاحظات')}" style="font-size:12px" onclick="event.stopPropagation()">` : ''}</div>`).join('')}
        </div>
        <div class="flex gap-8 mt-16"><div class="form-group" style="flex:1"><label>${tr('Blood Reserved', 'دم محجوز')}</label><select class="form-input" id="preop_blood_reserved"><option value="0">${tr('No', 'لا')}</option><option value="1">${tr('Yes', 'نعم')}</option></select></div></div>
        <button class="btn btn-primary w-full mt-16" onclick="savePreopAssessment()" style="height:44px">💾 ${tr('Save Assessment', 'حفظ التقييم')}</button>
        <div class="card mt-16"><div class="card-title">🔬 ${tr('Required Pre-Op Tests', 'فحوصات مطلوبة قبل العملية')}</div>
          <div class="flex gap-8 mb-12"><select class="form-input" id="preopTestType" style="flex:1"><option value="Lab">${tr('Lab', 'مختبر')}</option><option value="Radiology">${tr('Radiology', 'أشعة')}</option><option value="ECG">ECG</option><option value="Other">${tr('Other', 'أخرى')}</option></select>
            <input class="form-input" id="preopTestName" placeholder="${tr('Test name', 'اسم الفحص')}" style="flex:2">
            <button class="btn btn-success" onclick="addPreopTest()">➕</button></div>
          <div id="preopTestsList"></div>
        </div>
      </div>
    </div>`;
  } else if (surgeryTab === 'anesthesia') {
    cont.innerHTML = `<div class="card">
      <div class="card-title">💉 ${tr('Anesthesia Record', 'سجل التخدير')}</div>
      <div class="form-group mb-12"><label>${tr('Select Surgery', 'اختر العملية')}</label>
        <select class="form-input" id="anesthSurgery" onchange="loadAnesthRecord()">
          <option value="">${tr('-- Select --', '-- اختر --')}</option>
          ${surgeries.map(s => `<option value="${s.id}">${s.id} - ${s.patient_name} - ${s.procedure_name} (${s.scheduled_date})</option>`).join('')}
        </select></div>
      <div id="anesthForm" style="display:none">
        <div class="grid-equal"><div>
          <div class="form-group mb-12"><label>${tr('Anesthetist', 'طبيب التخدير')}</label><input class="form-input" id="anName"></div>
          <div class="form-group mb-12"><label>ASA ${tr('Classification', 'التصنيف')}</label><select class="form-input" id="anASA"><option>ASA I</option><option>ASA II</option><option>ASA III</option><option>ASA IV</option><option>ASA V</option><option>ASA VI</option></select></div>
          <div class="form-group mb-12"><label>${tr('Anesthesia Type', 'نوع التخدير')}</label><select class="form-input" id="anType"><option value="General">${tr('General', 'عام')}</option><option value="Spinal">${tr('Spinal', 'نخاعي')}</option><option value="Epidural">${tr('Epidural', 'فوق الجافية')}</option><option value="Regional">${tr('Regional', 'موضعي')}</option><option value="Local">${tr('Local', 'موضعي')}</option><option value="Sedation">${tr('Sedation', 'تخدير واعي')}</option></select></div>
          <div class="form-group mb-12"><label>${tr('Airway Assessment', 'تقييم المجرى الهوائي')}</label><input class="form-input" id="anAirway"></div>
          <div class="form-group mb-12"><label>Mallampati Score</label><select class="form-input" id="anMallampati"><option value="">-</option><option>Class I</option><option>Class II</option><option>Class III</option><option>Class IV</option></select></div>
        </div><div>
          <div class="form-group mb-12"><label>${tr('Premedication', 'أدوية تحضيرية')}</label><input class="form-input" id="anPremed"></div>
          <div class="form-group mb-12"><label>${tr('Induction Agents', 'أدوية التحريض')}</label><input class="form-input" id="anInduction"></div>
          <div class="form-group mb-12"><label>${tr('Maintenance', 'أدوية الصيانة')}</label><input class="form-input" id="anMaint"></div>
          <div class="form-group mb-12"><label>${tr('Muscle Relaxants', 'مرخيات العضلات')}</label><input class="form-input" id="anRelax"></div>
          <div class="form-group mb-12"><label>${tr('IV Access', 'المدخل الوريدي')}</label><input class="form-input" id="anIV"></div>
        </div></div>
        <div class="grid-equal"><div>
          <div class="form-group mb-12"><label>${tr('Fluid Given', 'السوائل المعطاة')}</label><input class="form-input" id="anFluid"></div>
          <div class="form-group mb-12"><label>${tr('Blood Loss (ml)', 'فقدان الدم (مل)')}</label><input class="form-input" type="number" id="anBloodLoss" value="0"></div>
        </div><div>
          <div class="form-group mb-12"><label>${tr('Complications', 'مضاعفات')}</label><input class="form-input" id="anComp"></div>
          <div class="form-group mb-12"><label>${tr('Recovery Notes', 'ملاحظات الإفاقة')}</label><textarea class="form-input form-textarea" id="anRecovery"></textarea></div>
        </div></div>
        <button class="btn btn-primary w-full" onclick="saveAnesthRecord()" style="height:44px">💾 ${tr('Save Anesthesia Record', 'حفظ سجل التخدير')}</button>
      </div></div>`;
  } else if (surgeryTab === 'rooms') {
    cont.innerHTML = `<div class="card">
      <div class="card-title">🚪 ${tr('Operating Rooms', 'غرف العمليات')}</div>
      <div class="stats-grid" style="margin-bottom:16px">${ors.map(o => `<div class="stat-card" style="--stat-color:${o.status === 'Available' ? '#4ade80' : '#f87171'}">
        <span class="stat-icon">🚪</span><div class="stat-label">${isArabic ? o.room_name_ar : o.room_name}</div>
        <div class="stat-value" style="font-size:14px">${o.location}</div>
        <div>${badge(o.status, o.status === 'Available' ? 'success' : 'danger')}</div>
      </div>`).join('')}</div>
    </div>`;
  }
}

window.scheduleSurgery = async () => {
  const pSel = document.getElementById('srgPatient');
  try {
    await API.post('/api/surgeries', {
      patient_id: pSel.value, patient_name: pSel.options[pSel.selectedIndex]?.dataset?.name || '',
      surgeon_id: document.getElementById('srgSurgeon').value, surgeon_name: document.getElementById('srgSurgeon').options[document.getElementById('srgSurgeon').selectedIndex]?.dataset?.name || '',
      anesthetist_id: document.getElementById('srgAnesth').value, anesthetist_name: document.getElementById('srgAnesth').options[document.getElementById('srgAnesth').selectedIndex]?.dataset?.name || '',
      procedure_name: document.getElementById('srgProc').value, procedure_name_ar: document.getElementById('srgProcAr').value,
      surgery_type: document.getElementById('srgType').value, operating_room: document.getElementById('srgOR').value,
      scheduled_date: document.getElementById('srgDate').value, scheduled_time: document.getElementById('srgTime').value,
      estimated_duration: document.getElementById('srgDur').value, priority: document.getElementById('srgPriority').value,
      notes: document.getElementById('srgNotes').value
    });
    showToast(tr('Surgery scheduled!', 'تم جدولة العملية!')); surgeryTab = 'schedule'; await navigateTo(18);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.updateSurgStatus = async (id, status) => {
  try { await API.put(`/api/surgeries/${id}`, { status }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(18); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.deleteSurgery = async (id) => {
  if (!confirm(tr('Delete this surgery?', 'حذف هذه العملية؟'))) return;
  try { await API.del(`/api/surgeries/${id}`); showToast(tr('Deleted', 'تم الحذف')); await navigateTo(18); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.loadPreopAssessment = async () => {
  const sid = document.getElementById('preopSurgery').value;
  if (!sid) { document.getElementById('preopForm').style.display = 'none'; return; }
  document.getElementById('preopForm').style.display = 'block';
  try {
    const data = await API.get(`/api/surgeries/${sid}/preop`);
    if (data) {
      const map = { npo: 'npo_confirmed', allergies: 'allergies_reviewed', medications: 'medications_reviewed', labs: 'labs_reviewed', imaging: 'imaging_reviewed', blood_type: 'blood_type_confirmed', consent: 'consent_signed', anesthesia_clr: 'anesthesia_clearance', nursing: 'nursing_assessment', cardiac: 'cardiac_clearance', pulmonary: 'pulmonary_clearance', infection: 'infection_screening', dvt: 'dvt_prophylaxis' };
      Object.entries(map).forEach(([k, v]) => { const el = document.getElementById('preop_' + k); if (el) el.checked = !!data[v]; });
      ['allergies', 'medications', 'labs', 'imaging', 'nursing', 'cardiac'].forEach(k => { const el = document.getElementById('preop_' + k + '_notes'); if (el) el.value = data[k + '_notes'] || ''; });
      document.getElementById('preop_blood_reserved').value = data.blood_reserved ? '1' : '0';
    }
    const tests = await API.get(`/api/surgeries/${sid}/preop-tests`);
    const tl = document.getElementById('preopTestsList');
    tl.innerHTML = tests.length ? makeTable([tr('Type', 'النوع'), tr('Test', 'الفحص'), tr('Status', 'الحالة'), tr('Result', 'النتيجة'), tr('Action', 'إجراء')],
      tests.map(t => ({ cells: [t.test_type, t.test_name, t.is_completed ? badge(tr('Done', 'تم'), 'success') : badge(tr('Pending', 'معلق'), 'warning'), t.result_summary || '-'], id: t.id })),
      row => `<button class="btn btn-success btn-sm" onclick="markTestDone(${row.id})">✅</button>`) : `<p style="color:var(--text-dim)">${tr('No tests added', 'لم تتم إضافة فحوصات')}</p>`;
  } catch (e) { console.error(e); }
};
window.savePreopAssessment = async () => {
  const sid = document.getElementById('preopSurgery').value;
  if (!sid) return;
  try {
    await API.post(`/api/surgeries/${sid}/preop`, {
      npo_confirmed: document.getElementById('preop_npo').checked, allergies_reviewed: document.getElementById('preop_allergies').checked,
      allergies_notes: document.getElementById('preop_allergies_notes')?.value || '', medications_reviewed: document.getElementById('preop_medications').checked,
      medications_notes: document.getElementById('preop_medications_notes')?.value || '', labs_reviewed: document.getElementById('preop_labs').checked,
      labs_notes: document.getElementById('preop_labs_notes')?.value || '', imaging_reviewed: document.getElementById('preop_imaging').checked,
      imaging_notes: document.getElementById('preop_imaging_notes')?.value || '', blood_type_confirmed: document.getElementById('preop_blood_type').checked,
      blood_reserved: document.getElementById('preop_blood_reserved').value === '1', consent_signed: document.getElementById('preop_consent').checked,
      anesthesia_clearance: document.getElementById('preop_anesthesia_clr').checked, nursing_assessment: document.getElementById('preop_nursing').checked,
      nursing_notes: document.getElementById('preop_nursing_notes')?.value || '', cardiac_clearance: document.getElementById('preop_cardiac').checked,
      cardiac_notes: document.getElementById('preop_cardiac_notes')?.value || '', pulmonary_clearance: document.getElementById('preop_pulmonary').checked,
      infection_screening: document.getElementById('preop_infection').checked, dvt_prophylaxis: document.getElementById('preop_dvt').checked
    });
    showToast(tr('Assessment saved!', 'تم حفظ التقييم!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addPreopTest = async () => {
  const sid = document.getElementById('preopSurgery').value;
  if (!sid) return;
  try {
    await API.post(`/api/surgeries/${sid}/preop-tests`, { test_type: document.getElementById('preopTestType').value, test_name: document.getElementById('preopTestName').value });
    showToast(tr('Test added', 'تم إضافة الفحص')); loadPreopAssessment();
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.markTestDone = async (id) => {
  try { await API.put(`/api/surgery-preop-tests/${id}`, { is_completed: 1 }); showToast(tr('Done', 'تم')); loadPreopAssessment(); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.loadAnesthRecord = async () => {
  const sid = document.getElementById('anesthSurgery').value;
  if (!sid) { document.getElementById('anesthForm').style.display = 'none'; return; }
  document.getElementById('anesthForm').style.display = 'block';
  try {
    const d = await API.get(`/api/surgeries/${sid}/anesthesia`);
    if (d) {
      document.getElementById('anName').value = d.anesthetist_name || ''; document.getElementById('anASA').value = d.asa_class || 'ASA I';
      document.getElementById('anType').value = d.anesthesia_type || 'General'; document.getElementById('anAirway').value = d.airway_assessment || '';
      document.getElementById('anMallampati').value = d.mallampati_score || ''; document.getElementById('anPremed').value = d.premedication || '';
      document.getElementById('anInduction').value = d.induction_agents || ''; document.getElementById('anMaint').value = d.maintenance_agents || '';
      document.getElementById('anRelax').value = d.muscle_relaxants || ''; document.getElementById('anIV').value = d.iv_access || '';
      document.getElementById('anFluid').value = d.fluid_given || ''; document.getElementById('anBloodLoss').value = d.blood_loss_ml || 0;
      document.getElementById('anComp').value = d.complications || ''; document.getElementById('anRecovery').value = d.recovery_notes || '';
    }
  } catch (e) { }
};
window.saveAnesthRecord = async () => {
  const sid = document.getElementById('anesthSurgery').value;
  if (!sid) return;
  try {
    await API.post(`/api/surgeries/${sid}/anesthesia`, {
      anesthetist_name: document.getElementById('anName').value, asa_class: document.getElementById('anASA').value,
      anesthesia_type: document.getElementById('anType').value, airway_assessment: document.getElementById('anAirway').value,
      mallampati_score: document.getElementById('anMallampati').value, premedication: document.getElementById('anPremed').value,
      induction_agents: document.getElementById('anInduction').value, maintenance_agents: document.getElementById('anMaint').value,
      muscle_relaxants: document.getElementById('anRelax').value, iv_access: document.getElementById('anIV').value,
      fluid_given: document.getElementById('anFluid').value, blood_loss_ml: parseInt(document.getElementById('anBloodLoss').value) || 0,
      complications: document.getElementById('anComp').value, recovery_notes: document.getElementById('anRecovery').value
    });
    showToast(tr('Anesthesia record saved!', 'تم حفظ سجل التخدير!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== BLOOD BANK =====
let bbTab = 'inventory';
async function renderBloodBank(el) {
  const [stats, units, donors, crossmatches, transfusions, patients] = await Promise.all([
    API.get('/api/blood-bank/stats'), API.get('/api/blood-bank/units'),
    API.get('/api/blood-bank/donors'), API.get('/api/blood-bank/crossmatch'),
    API.get('/api/blood-bank/transfusions'), API.get('/api/patients')
  ]);
  const btColors = { 'A': '#ef4444', 'B': '#3b82f6', 'AB': '#8b5cf6', 'O': '#22c55e' };
  el.innerHTML = `
    <div class="page-title">🩸 ${tr('Blood Bank', 'بنك الدم')}</div>
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:#ef4444"><span class="stat-icon">🩸</span><div class="stat-label">${tr('Available Units', 'وحدات متاحة')}</div><div class="stat-value">${stats.total}</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><span class="stat-icon">⏰</span><div class="stat-label">${tr('Expiring Soon', 'تنتهي قريباً')}</div><div class="stat-value">${stats.expiring}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><span class="stat-icon">👥</span><div class="stat-label">${tr('Total Donors', 'إجمالي المتبرعين')}</div><div class="stat-value">${stats.totalDonors}</div></div>
      <div class="stat-card" style="--stat-color:#8b5cf6"><span class="stat-icon">🔄</span><div class="stat-label">${tr('Today Transfusions', 'نقل دم اليوم')}</div><div class="stat-value">${stats.todayTransfusions}</div></div>
      <div class="stat-card" style="--stat-color:#06b6d4"><span class="stat-icon">🧪</span><div class="stat-label">${tr('Pending Cross-Match', 'توافق معلق')}</div><div class="stat-value">${stats.pendingCrossmatch}</div></div>
    </div>
    <div class="stats-grid mt-16" style="grid-template-columns:repeat(8,1fr)">
      ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => {
    const bt = t.replace(/[+-]/, ''), rh = t.includes('+') ? '+' : '-';
    const cnt = stats.byType?.find(b => b.blood_type === bt && b.rh_factor === rh)?.cnt || 0;
    return `<div class="stat-card" style="--stat-color:${btColors[bt] || '#888'};text-align:center;padding:12px"><div style="font-size:24px;font-weight:800">${t}</div><div style="font-size:18px;font-weight:600">${cnt}</div><div style="font-size:10px">${tr('units', 'وحدة')}</div></div>`;
  }).join('')}
    </div>
    <div class="flex gap-8 mt-16 mb-16" style="flex-wrap:wrap">
      <button class="btn ${bbTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}" onclick="bbTab='inventory';navigateTo(19)">📦 ${tr('Inventory', 'المخزون')}</button>
      <button class="btn ${bbTab === 'donors' ? 'btn-primary' : 'btn-secondary'}" onclick="bbTab='donors';navigateTo(19)">👥 ${tr('Donors', 'المتبرعين')}</button>
      <button class="btn ${bbTab === 'crossmatch' ? 'btn-primary' : 'btn-secondary'}" onclick="bbTab='crossmatch';navigateTo(19)">🧪 ${tr('Cross-Match', 'التوافق')}</button>
      <button class="btn ${bbTab === 'transfusions' ? 'btn-primary' : 'btn-secondary'}" onclick="bbTab='transfusions';navigateTo(19)">💉 ${tr('Transfusions', 'نقل الدم')}</button>
    </div>
    <div id="bbContent"></div>`;
  const cont = document.getElementById('bbContent');
  if (bbTab === 'inventory') {
    cont.innerHTML = `<div class="split-layout"><div class="card">
      <div class="card-title">➕ ${tr('Add Blood Unit', 'إضافة وحدة دم')}</div>
      <div class="form-group mb-12"><label>${tr('Bag Number', 'رقم الكيس')}</label><input class="form-input" id="bbBag"></div>
      <div class="form-group mb-12"><label>${tr('Blood Type', 'فصيلة الدم')}</label><select class="form-input" id="bbType"><option>A</option><option>B</option><option>AB</option><option>O</option></select></div>
      <div class="form-group mb-12"><label>Rh</label><select class="form-input" id="bbRh"><option value="+">+</option><option value="-">-</option></select></div>
      <div class="form-group mb-12"><label>${tr('Component', 'المكون')}</label><select class="form-input" id="bbComp"><option>Whole Blood</option><option>Packed RBC</option><option>FFP</option><option>Platelets</option><option>Cryoprecipitate</option></select></div>
      <div class="form-group mb-12"><label>${tr('Collection Date', 'تاريخ التجميع')}</label><input class="form-input" type="date" id="bbCollDate" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group mb-12"><label>${tr('Expiry Date', 'تاريخ الانتهاء')}</label><input class="form-input" type="date" id="bbExpDate"></div>
      <div class="form-group mb-12"><label>${tr('Volume (ml)', 'الحجم (مل)')}</label><input class="form-input" type="number" id="bbVol" value="450"></div>
      <button class="btn btn-primary w-full" onclick="addBloodUnit()" style="height:44px">💾 ${tr('Add Unit', 'إضافة وحدة')}</button>
    </div><div class="card">
      <div class="card-title">📦 ${tr('Blood Units', 'وحدات الدم')}</div>
      <div id="bbUnitsTable">${makeTable([tr('Bag#', 'رقم الكيس'), tr('Type', 'الفصيلة'), tr('Component', 'المكون'), tr('Collection', 'التجميع'), tr('Expiry', 'الانتهاء'), tr('Status', 'الحالة')],
      units.map(u => ({ cells: [u.bag_number, u.blood_type + u.rh_factor, u.component, u.collection_date, u.expiry_date, statusBadge(u.status)] })))}</div>
    </div></div>`;
  } else if (bbTab === 'donors') {
    cont.innerHTML = `<div class="split-layout"><div class="card">
      <div class="card-title">👤 ${tr('Register Donor', 'تسجيل متبرع')}</div>
      <div class="form-group mb-12"><label>${tr('Name (EN)', 'الاسم (إنجليزي)')}</label><input class="form-input" id="bbDonorName"></div>
      <div class="form-group mb-12"><label>${tr('Name (AR)', 'الاسم (عربي)')}</label><input class="form-input" id="bbDonorNameAr"></div>
      <div class="form-group mb-12"><label>${tr('National ID', 'الهوية')}</label><input class="form-input" id="bbDonorNID"></div>
      <div class="form-group mb-12"><label>${tr('Phone', 'الجوال')}</label><input class="form-input" id="bbDonorPhone"></div>
      <div class="form-group mb-12"><label>${tr('Blood Type', 'فصيلة الدم')}</label><select class="form-input" id="bbDonorBT"><option>A</option><option>B</option><option>AB</option><option>O</option></select></div>
      <div class="form-group mb-12"><label>Rh</label><select class="form-input" id="bbDonorRh"><option value="+">+</option><option value="-">-</option></select></div>
      <div class="form-group mb-12"><label>${tr('Age', 'العمر')}</label><input class="form-input" type="number" id="bbDonorAge"></div>
      <button class="btn btn-primary w-full" onclick="addDonor()" style="height:44px">💾 ${tr('Register', 'تسجيل')}</button>
    </div><div class="card">
      <div class="card-title">👥 ${tr('Donors List', 'قائمة المتبرعين')}</div>
      <div id="bbDonorsTable">${makeTable([tr('Name', 'الاسم'), tr('ID', 'الهوية'), tr('Blood Type', 'الفصيلة'), tr('Phone', 'الجوال'), tr('Last Donation', 'آخر تبرع'), tr('Eligible', 'مؤهل')],
      donors.map(d => ({ cells: [isArabic ? (d.donor_name_ar || d.donor_name) : d.donor_name, d.national_id, d.blood_type + d.rh_factor, d.phone, d.last_donation_date, d.is_eligible ? badge(tr('Yes', 'نعم'), 'success') : badge(tr('No', 'لا'), 'danger')] })))}</div>
    </div></div>`;
  } else if (bbTab === 'crossmatch') {
    cont.innerHTML = `<div class="split-layout"><div class="card">
      <div class="card-title">🧪 ${tr('Request Cross-Match', 'طلب فحص توافق')}</div>
      <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><select class="form-input" id="bbCMPatient">${patients.map(p => `<option value="${p.id}" data-name="">${p.file_number} - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Blood Type', 'فصيلة المريض')}</label><select class="form-input" id="bbCMBT"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
      <div class="form-group mb-12"><label>${tr('Units Needed', 'الوحدات المطلوبة')}</label><input class="form-input" type="number" id="bbCMUnits" value="1"></div>
      <button class="btn btn-primary w-full" onclick="requestCrossmatch()" style="height:44px">🧪 ${tr('Request', 'طلب')}</button>
    </div><div class="card">
      <div class="card-title">📋 ${tr('Cross-Match Results', 'نتائج التوافق')}</div>
      <div id="bbCMTable">${makeTable([tr('Patient', 'المريض'), tr('Type', 'الفصيلة'), tr('Units', 'الوحدات'), tr('Technician', 'الفني'), tr('Result', 'النتيجة'), tr('Action', 'إجراء')],
      crossmatches.map(c => ({ cells: [c.patient_name, c.patient_blood_type, c.units_needed, c.lab_technician, c.result === 'Pending' ? badge(c.result, 'warning') : c.result === 'Compatible' ? badge(c.result, 'success') : badge(c.result, 'danger')], id: c.id })),
      row => `<button class="btn btn-success btn-sm" onclick="updateCrossmatch(${row.id},'Compatible')">✅</button><button class="btn btn-danger btn-sm" onclick="updateCrossmatch(${row.id},'Incompatible')">❌</button>`)}</div>
    </div></div>`;
  } else if (bbTab === 'transfusions') {
    cont.innerHTML = `<div class="split-layout"><div class="card">
      <div class="card-title">💉 ${tr('Record Transfusion', 'تسجيل نقل دم')}</div>
      <div class="form-group mb-12"><label>${tr('Patient', 'المريض')}</label><select class="form-input" id="bbTrPatient">${patients.map(p => `<option value="${p.id}" data-name="">${p.file_number} - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Blood Unit', 'وحدة الدم')}</label><select class="form-input" id="bbTrUnit">${units.filter(u => u.status === 'Available').map(u => `<option value="${u.id}" data-bag="${u.bag_number}" data-bt="${u.blood_type + u.rh_factor}" data-comp="${u.component}">${u.bag_number} (${u.blood_type}${u.rh_factor} - ${u.component})</option>`).join('')}</select></div>
      <div class="form-group mb-12"><label>${tr('Volume (ml)', 'الحجم (مل)')}</label><input class="form-input" type="number" id="bbTrVol" value="450"></div>
      <button class="btn btn-primary w-full" onclick="recordTransfusion()" style="height:44px">💉 ${tr('Record', 'تسجيل')}</button>
    </div><div class="card">
      <div class="card-title">📋 ${tr('Transfusion Records', 'سجل نقل الدم')}</div>
      <div id="bbTrTable">${makeTable([tr('Patient', 'المريض'), tr('Bag#', 'الكيس'), tr('Type', 'الفصيلة'), tr('Component', 'المكون'), tr('By', 'بواسطة'), tr('Time', 'الوقت'), tr('Reaction', 'تفاعل')],
      transfusions.map(t => ({ cells: [t.patient_name, t.bag_number, t.blood_type, t.component, t.administered_by, t.start_time?.split('T')[0] || '', t.adverse_reaction ? badge(tr('Yes', 'نعم'), 'danger') : badge(tr('No', 'لا'), 'success')] })))}</div>
    </div></div>`;
  }
}
window.addBloodUnit = async () => {
  try {
    await API.post('/api/blood-bank/units', { bag_number: document.getElementById('bbBag').value, blood_type: document.getElementById('bbType').value, rh_factor: document.getElementById('bbRh').value, component: document.getElementById('bbComp').value, collection_date: document.getElementById('bbCollDate').value, expiry_date: document.getElementById('bbExpDate').value, volume_ml: document.getElementById('bbVol').value });
    showToast(tr('Unit added!', 'تم إضافة الوحدة!')); bbTab = 'inventory'; await navigateTo(19);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addDonor = async () => {
  try {
    await API.post('/api/blood-bank/donors', { donor_name: document.getElementById('bbDonorName').value, donor_name_ar: document.getElementById('bbDonorNameAr').value, national_id: document.getElementById('bbDonorNID').value, phone: document.getElementById('bbDonorPhone').value, blood_type: document.getElementById('bbDonorBT').value, rh_factor: document.getElementById('bbDonorRh').value, age: document.getElementById('bbDonorAge').value });
    showToast(tr('Donor registered!', 'تم تسجيل المتبرع!')); bbTab = 'donors'; await navigateTo(19);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.requestCrossmatch = async () => {
  const sel = document.getElementById('bbCMPatient');
  try {
    await API.post('/api/blood-bank/crossmatch', { patient_id: sel.value, patient_name: sel.options[sel.selectedIndex]?.dataset?.name || '', patient_blood_type: document.getElementById('bbCMBT').value, units_needed: document.getElementById('bbCMUnits').value });
    showToast(tr('Cross-match requested!', 'تم طلب فحص التوافق!')); bbTab = 'crossmatch'; await navigateTo(19);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.updateCrossmatch = async (id, result) => {
  try { await API.put(`/api/blood-bank/crossmatch/${id}`, { result }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(19); }
  catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.recordTransfusion = async () => {
  const pSel = document.getElementById('bbTrPatient'), uSel = document.getElementById('bbTrUnit');
  const opt = uSel.options[uSel.selectedIndex];
  try {
    await API.post('/api/blood-bank/transfusions', { patient_id: pSel.value, patient_name: pSel.options[pSel.selectedIndex]?.dataset?.name || '', unit_id: uSel.value, bag_number: opt?.dataset?.bag || '', blood_type: opt?.dataset?.bt || '', component: opt?.dataset?.comp || '', volume_ml: document.getElementById('bbTrVol').value });
    showToast(tr('Transfusion recorded!', 'تم تسجيل نقل الدم!')); bbTab = 'transfusions'; await navigateTo(19);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== CONSENT FORMS =====

window.printConsentForm = async (formId) => {
  try {
    const [form, settings] = await Promise.all([
      API.get('/api/consent-forms/' + formId),
      API.get('/api/settings')
    ]);
    // Try to use rich HTML template if available
    if (form.form_type) {
      const renderUrl = `/api/consent-forms/render/${form.form_type}?patient_id=${form.patient_id || ''}&doctor_name=${encodeURIComponent(form.doctor_name || '')}`;
      try {
        const resp = await fetch(renderUrl);
        if (resp.ok) {
          const w = window.open('', '_blank');
          const html = await resp.text();
          // Add print/close buttons at top
          const printBar = `<div class="no-print" style="text-align:center;margin-bottom:20px;padding:15px;background:#f8f9fa;border-bottom:2px solid #1a365d">
            <button onclick="window.print()" style="padding:12px 40px;font-size:16px;background:#1a365d;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ طباعة / Print</button>
            <button onclick="window.close()" style="padding:12px 30px;font-size:16px;background:#dc3545;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:10px">✕ إغلاق</button>
          </div><style>@media print{.no-print{display:none!important}}</style>`;
          const finalHtml = html.replace('<body>', '<body>' + printBar);
          w.document.write(finalHtml);
          w.document.close();
          return;
        }
      } catch (e) { /* fall through to legacy print */ }
    }
    // Legacy text-based print (fallback)
    const hospitalAr = settings.company_name_ar || 'المركز الطبي';
    const hospitalEn = settings.company_name_en || 'Medical Center';
    const phone = settings.phone || '';
    const address = settings.address || '';
    const taxNum = settings.tax_number || '';
    const title = form.form_title_ar || form.form_title || '';
    const titleEn = form.form_title || '';
    const contentText = (form.content || '').replace(/\\n/g, '\n');
    const contentParts = contentText.split('\n').filter(l => l.trim());
    const arabicContent = contentParts.filter(l => /[\u0600-\u06FF]/.test(l));
    const englishContent = contentParts.filter(l => !/[\u0600-\u06FF]/.test(l.replace(/[⚠️]/g, '')));
    const signedDate = form.signed_at ? new Date(form.signed_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');
    const sigImg = form.patient_signature && form.patient_signature.startsWith('data:') ? `<img src="${form.patient_signature}" style="max-height:80px;max-width:200px">` : '<div style="height:60px;border-bottom:2px solid #333;width:200px"></div>';
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${title}</title>
<style>
@page{size:A4;margin:18mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:30px;color:#222;direction:rtl;line-height:1.8;font-size:14px}
.header{text-align:center;border-bottom:3px double #1a365d;padding-bottom:18px;margin-bottom:25px}
.header h1{font-size:22px;color:#1a365d;margin:6px 0}
.header h2{font-size:16px;color:#555;font-weight:500;margin-bottom:4px}
.header .hospital-info{font-size:11px;color:#888;margin-top:8px}
.patient-box{display:grid;grid-template-columns:1fr 1fr;gap:10px;border:1px solid #ccc;border-radius:8px;padding:16px;margin-bottom:20px;background:#fafbfc}
.patient-box .field{font-size:13px}
.patient-box .field label{font-weight:700;color:#1a365d}
.consent-section{margin:20px 0;padding:18px;border:1px solid #ddd;border-radius:10px}
.consent-section h3{color:#1a365d;font-size:16px;text-align:center;margin-bottom:14px;border-bottom:1px solid #eee;padding-bottom:8px}
.consent-text-ar{font-size:14px;line-height:2;text-align:justify;margin-bottom:16px;padding:12px;background:#f7f8fa;border-radius:8px}
.consent-text-en{font-size:12px;line-height:1.8;text-align:left;direction:ltr;color:#555;font-style:italic;padding:12px;background:#f0f4f8;border-radius:8px;margin-top:10px}
.sig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:35px;padding-top:15px;border-top:2px solid #eee}
.sig-box{text-align:center}
.sig-box .sig-label{font-weight:700;font-size:13px;color:#1a365d;margin-bottom:4px}
.sig-box .sig-label-en{font-size:11px;color:#888}
.sig-box .sig-area{margin-top:8px;min-height:70px;display:flex;align-items:flex-end;justify-content:center}
.sig-box .sig-line{border-top:2px solid #333;width:100%;margin-top:60px;padding-top:4px}
.status-badge{display:inline-block;padding:3px 14px;border-radius:12px;font-size:12px;font-weight:700}
.status-signed{background:#d4edda;color:#155724}
.status-pending{background:#fff3cd;color:#856404}
.footer{text-align:center;margin-top:30px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#999}
@media print{body{padding:15px}.no-print{display:none!important}}
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:20px">
  <button onclick="window.print()" style="padding:12px 40px;font-size:16px;background:#1a365d;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ طباعة / Print</button>
  <button onclick="window.close()" style="padding:12px 30px;font-size:16px;background:#dc3545;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-right:10px">✕ إغلاق</button>
</div>
<div class="header">
  <h1>${hospitalAr}</h1>
  <h2>${hospitalEn}</h2><div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap"><button class="btn" onclick="showChangePassword()" style="background:#fff3e0;border:1px solid #ff9800;color:#e65100">🔑 ${tr("Change Password", "تغيير كلمة المرور")}</button><button class="btn" onclick="startBackup()" style="background:#e8f5e9;border:1px solid #4caf50;color:#2e7d32">💾 ${tr("Database Backup", "نسخة احتياطية")}</button></div>
  <div class="hospital-info">
    ${phone ? '📞 ' + phone + ' | ' : ''}${address ? '📍 ' + address + ' | ' : ''}${taxNum ? 'الرقم الضريبي: ' + taxNum : ''}
  </div>
</div>
<h3 style="text-align:center;color:#1a365d;font-size:18px;margin-bottom:5px">📜 ${title}</h3>
<p style="text-align:center;color:#777;font-size:13px;margin-bottom:20px">${titleEn}</p>
<div class="patient-box">
  <div class="field"><label>اسم المريض / Patient Name:</label> ${form.patient_name || ''}</div>
  <div class="field"><label>تاريخ الإقرار / Date:</label> ${signedDate}</div>
  <div class="field"><label>الطبيب المعالج / Doctor:</label> ${form.doctor_name || ''}</div>
  <div class="field"><label>الحالة / Status:</label> <span class="status-badge ${form.status === 'Signed' ? 'status-signed' : 'status-pending'}">${form.status === 'Signed' ? '✅ موقع Signed' : '⏳ معلق Pending'}</span></div>
</div>
<div class="consent-section">
  <h3>📋 نص الإقرار — Consent Declaration</h3>
  <div class="consent-text-ar">${arabicContent.join('<br>')}</div>
  ${englishContent.length ? `<div class="consent-text-en">${englishContent.join('<br>')}</div>` : ''}
</div>
<div class="sig-grid">
  <div class="sig-box">
    <div class="sig-label">توقيع المريض</div>
    <div class="sig-label-en">Patient Signature</div>
    <div class="sig-area">${sigImg}</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">توقيع الطبيب</div>
    <div class="sig-label-en">Physician Signature</div>
    <div class="sig-area"><div class="sig-line">${form.doctor_name || ''}</div></div>
  </div>
  <div class="sig-box">
    <div class="sig-label">توقيع الشاهد</div>
    <div class="sig-label-en">Witness</div>
    <div class="sig-area"><div class="sig-line">${form.witness_name || ''}</div></div>
  </div>
</div>
<div class="footer">
  ${hospitalAr} — ${hospitalEn} | ${tr('Form #', 'إقرار رقم')} ${form.id} | ${tr('Printed on', 'طُبع بتاريخ')} ${new Date().toLocaleDateString('ar-SA')}
</div>
</body></html>`);
    w.document.close();
  } catch (e) { console.error(e); showToast(tr('Print error', 'خطأ في الطباعة'), 'error'); }
};
window.loadConsentTemplate = () => {
  const sel = document.getElementById('cfTemplate');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.value) {
    document.getElementById('cfTitle').value = isArabic ? (opt.dataset.titleAr || opt.dataset.title) : opt.dataset.title;
    document.getElementById('cfContent').value = opt.dataset.content || '';
  }
};
window.createConsentForm = async () => {
  const pSel = document.getElementById('cfPatient');
  const tSel = document.getElementById('cfTemplate');
  const opt = tSel.options[tSel.selectedIndex];
  try {
    await API.post('/api/consent-forms', {
      patient_id: pSel.value, patient_name: pSel.options[pSel.selectedIndex]?.dataset?.name || '',
      form_type: tSel.value || 'general', form_title: document.getElementById('cfTitle').value,
      form_title_ar: opt?.dataset?.titleAr || document.getElementById('cfTitle').value,
      content: document.getElementById('cfContent').value, doctor_name: document.getElementById('cfDoctor').value
    });
    showToast(tr('Form created!', 'تم إنشاء الإقرار!')); await navigateTo(20);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.loadConsentForSign = async () => {
  const fid = document.getElementById('cfSignSelect').value;
  if (!fid) { document.getElementById('cfSignArea').style.display = 'none'; return; }
  document.getElementById('cfSignArea').style.display = 'block';
  try {
    const f = await API.get(`/ api / consent - forms / ${fid} `);
    document.getElementById('cfSignContent').innerHTML = `< h3 > ${isArabic ? (f.form_title_ar || f.form_title) : f.form_title}</h3 ><p>${f.content}</p><p><strong>${tr('Patient', 'المريض')}:</strong> ${f.patient_name}<br><strong>${tr('Doctor', 'الطبيب')}:</strong> ${f.doctor_name}</p>`;
    // Setup canvas
    setTimeout(() => {
      const canvas = document.getElementById('cfSigCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let drawing = false;
      canvas.onpointerdown = (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
      canvas.onpointermove = (e) => { if (!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke(); };
      canvas.onpointerup = () => drawing = false;
      canvas.onpointerout = () => drawing = false;
    }, 100);
  } catch (e) { console.error(e); }
};
window.clearSigCanvas = () => {
  const c = document.getElementById('cfSigCanvas');
  if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
};
window.signConsentForm = async () => {
  const fid = document.getElementById('cfSignSelect').value;
  if (!fid) return;
  const canvas = document.getElementById('cfSigCanvas');
  const sig = canvas ? canvas.toDataURL('image/png') : '';
  try {
    await API.put(`/ api / consent - forms / ${fid}/sign`, {
      patient_signature: sig, witness_name: document.getElementById('cfWitness').value
    });
    showToast(tr('Consent signed!', 'تم توقيع الإقرار!')); await navigateTo(20);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== EMERGENCY DEPARTMENT =====
let erTab = 'board';
async function renderEmergency(el) {
  const [stats, visits, beds, patients, doctors] = await Promise.all([
    API.get('/api/emergency/stats'), API.get('/api/emergency/visits'), API.get('/api/emergency/beds'),
    API.get('/api/patients'), API.get('/api/employees')
  ]);
  const drs = (doctors || []).filter(d => d.role === 'Doctor' || d.department_en === 'Emergency');
  const triageColors = { Red: '#e74c3c', Orange: '#e67e22', Yellow: '#f1c40f', Green: '#2ecc71', Blue: '#3498db' };
  const active = (visits || []).filter(v => v.status === 'Active');
  const discharged = (visits || []).filter(v => v.status === 'Discharged');
  const admitted = (visits || []).filter(v => v.status === 'Admitted');
  el.innerHTML = `<div class="page-title">🚨 ${tr('Emergency Department', 'الطوارئ')}</div>
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card"><div class="stat-icon" style="background:#e74c3c22;color:#e74c3c">🚨</div><div class="stat-value" style="color:#e74c3c">${stats.active}</div><div class="stat-label">${tr('Active Cases', 'حالات نشطة')}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e67e2222;color:#e67e22">⚠️</div><div class="stat-value" style="color:#e67e22">${stats.critical}</div><div class="stat-label">${tr('Critical', 'حرجة')}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#3498db22;color:#3498db">📊</div><div class="stat-value" style="color:#3498db">${stats.today}</div><div class="stat-label">${tr('Today', 'اليوم')}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#2ecc7122;color:#2ecc71">✅</div><div class="stat-value" style="color:#2ecc71">${discharged.length}</div><div class="stat-label">${tr('Discharged', 'خارجين')}</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#9b59b622;color:#9b59b6">🏥</div><div class="stat-value" style="color:#9b59b6">${admitted.length}</div><div class="stat-label">${tr('Transferred', 'محولين')}</div></div>
    </div>
    <div class="tab-bar"><button class="tab-btn ${erTab === 'board' ? 'active' : ''}" onclick="erTab='board';navigateTo(21)">🏥 ${tr('ER Board', 'لوحة الطوارئ')}</button>
      <button class="tab-btn ${erTab === 'register' ? 'active' : ''}" onclick="erTab='register';navigateTo(21)">➕ ${tr('Register', 'تسجيل حالة')}</button>
      <button class="tab-btn ${erTab === 'discharged' ? 'active' : ''}" onclick="erTab='discharged';navigateTo(21)">🚪 ${tr('Discharged', 'الخارجين')}</button>
      <button class="tab-btn ${erTab === 'transferred' ? 'active' : ''}" onclick="erTab='transferred';navigateTo(21)">🔄 ${tr('Transferred', 'المحولين للتنويم')}</button>
      <button class="tab-btn ${erTab === 'beds' ? 'active' : ''}" onclick="erTab='beds';navigateTo(21)">🛏️ ${tr('Bed Map', 'خريطة الأسرّة')}</button></div>
    <div class="card" id="erContent"></div>
    <div id="erDischargeModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center">
      <div style="background:#fff;padding:30px;border-radius:16px;width:500px;max-width:90%;max-height:80vh;overflow-y:auto;direction:rtl">
        <h3 style="margin-bottom:16px">🚪 ${tr('Discharge from ER', 'خروج من الطوارئ')}</h3>
        <input type="hidden" id="erDischargeId">
        <div class="form-grid" style="gap:12px">
          <div><label>${tr('Diagnosis', 'التشخيص')}</label><textarea id="erDischargeDiag" class="form-control" rows="2"></textarea></div>
          <div><label>${tr('Instructions', 'تعليمات الخروج')}</label><textarea id="erDischargeInst" class="form-control" rows="2"></textarea></div>
          <div><label>${tr('Medications', 'الأدوية')}</label><input id="erDischargeMeds" class="form-control"></div>
          <div><label>${tr('Follow-up Date', 'موعد المراجعة')}</label><input id="erDischargeFollowup" type="date" class="form-control"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary" onclick="confirmERDischarge()" style="flex:1">✅ ${tr('Confirm Discharge', 'تأكيد الخروج')}</button>
          <button class="btn" onclick="document.getElementById('erDischargeModal').style.display='none'" style="flex:1">❌ ${tr('Cancel', 'إلغاء')}</button>
        </div>
      </div>
    </div>`;
  const c = document.getElementById('erContent');
  if (erTab === 'board') {
    c.innerHTML = `<h3>🚨 ${tr('Active ER Cases', 'حالات الطوارئ النشطة')} (${active.length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'erTable')" style="margin-bottom:12px">
      ${active.length ? `<table class="data-table" id="erTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Complaint', 'الشكوى')}</th><th>${tr('Triage', 'الفرز')}</th><th>${tr('Arrival', 'الوصول')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Bed', 'السرير')}</th><th>${tr('Actions', 'إجراءات')}</th></tr></thead><tbody>${active.map(v => {
      const tc = triageColors[v.triage_color] || '#999';
      return `<tr><td>${v.id}</td><td>${v.patient_name}</td><td>${v.chief_complaint_ar || v.chief_complaint}</td>
          <td><span style="background:${tc};color:#fff;padding:2px 10px;border-radius:12px;font-weight:700">${tr('ESI ' + v.triage_level, 'ESI ' + v.triage_level)} ${v.triage_color}</span></td>
          <td>${new Date(v.arrival_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</td><td>${v.assigned_doctor || '-'}</td><td>${v.assigned_bed || '-'}</td>
          <td><button class="btn btn-sm" onclick="showERDischargeModal(${v.id})">🚪 ${tr('Discharge', 'خروج')}</button> <button class="btn btn-sm btn-success" onclick="transferERToInpatient(${v.id},'${(v.patient_name || '').replace(/'/g, "\\'")}',${v.patient_id},'${(v.assigned_doctor || '').replace(/'/g, "\\'")}','${v.chief_complaint_ar || v.chief_complaint || ''}')">${tr('Admit', 'تنويم')}</button></td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">✅</div><p>${tr('No active cases', 'لا توجد حالات نشطة')}</p></div>`}`;
  } else if (erTab === 'register') {
    c.innerHTML = `<h3>➕ ${tr('Register ER Visit', 'تسجيل حالة طوارئ')}</h3>
      <div class="form-grid">
        <div><label>${tr('Patient', 'المريض')}</label><select id="erPatient" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(patients || []).map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.name_ar || p.name_en} (${p.file_number})</option>`).join('')}</select></div>
        <div><label>${tr('Arrival Mode', 'طريقة الوصول')}</label><select id="erArrival" class="form-control"><option value="Walk-in">${tr('Walk-in', 'مشي')}</option><option value="Ambulance">${tr('Ambulance', 'إسعاف')}</option><option value="Referred">${tr('Referred', 'محوّل')}</option><option value="Police">${tr('Police', 'شرطة')}</option></select></div>
        <div><label>${tr('Chief Complaint', 'الشكوى الرئيسية')}</label><input id="erComplaint" class="form-control"></div>
        <div><label>${tr('Complaint (AR)', 'الشكوى بالعربي')}</label><input id="erComplaintAr" class="form-control"></div>
        <div><label>${tr('Triage Level', 'مستوى الفرز')}</label><select id="erTriage" class="form-control" onchange="document.getElementById('erTriageColor').value=['','Red','Orange','Yellow','Green','Blue'][this.value]">
          <option value="1">1 - ${tr('Resuscitation', 'إنعاش')}</option><option value="2">2 - ${tr('Emergent', 'طارئ')}</option><option value="3" selected>3 - ${tr('Urgent', 'عاجل')}</option><option value="4">4 - ${tr('Less Urgent', 'أقل إلحاحاً')}</option><option value="5">5 - ${tr('Non-Urgent', 'غير طارئ')}</option></select></div>
        <div><label>${tr('Triage Color', 'لون الفرز')}</label><select id="erTriageColor" class="form-control"><option value="Red">${tr('Red', 'أحمر')}</option><option value="Orange">${tr('Orange', 'برتقالي')}</option><option value="Yellow" selected>${tr('Yellow', 'أصفر')}</option><option value="Green">${tr('Green', 'أخضر')}</option><option value="Blue">${tr('Blue', 'أزرق')}</option></select></div>
        <div><label>${tr('Doctor', 'الطبيب')}</label><select id="erDoctor" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${drs.map(d => `<option value="${d.name_ar || d.name}">${d.name_ar || d.name}</option>`).join('')}</select></div>
        <div><label>${tr('ER Bed', 'سرير الطوارئ')}</label><select id="erBed" class="form-control"><option value="">${tr('None', 'بدون')}</option>${(beds || []).filter(b => b.status === 'Available').map(b => `<option value="${b.bed_name}">${b.bed_name_ar} (${b.zone_ar})</option>`).join('')}</select></div>
      </div>
      <button class="btn btn-primary" onclick="registerERVisit()" style="margin-top:16px">🚨 ${tr('Register', 'تسجيل')}</button>`;
  } else if (erTab === 'discharged') {
    c.innerHTML = `<h3>🚪 ${tr('Discharged from ER', 'الخارجين من الطوارئ')} (${discharged.length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'erDischTable')" style="margin-bottom:12px">
      ${discharged.length ? `<table class="data-table" id="erDischTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Complaint', 'الشكوى')}</th><th>${tr('Triage', 'الفرز')}</th><th>${tr('Arrival', 'الوصول')}</th><th>${tr('Discharge', 'الخروج')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Diagnosis', 'التشخيص')}</th></tr></thead><tbody>${discharged.map(v => {
      const tc = triageColors[v.triage_color] || '#999';
      return `<tr><td>${v.id}</td><td>${v.patient_name}</td><td>${v.chief_complaint_ar || v.chief_complaint || '-'}</td>
        <td><span style="background:${tc};color:#fff;padding:2px 8px;border-radius:12px;font-size:.85em">${v.triage_color}</span></td>
        <td>${v.arrival_time ? new Date(v.arrival_time).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
        <td>${v.discharge_time ? new Date(v.discharge_time).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
        <td>${v.assigned_doctor || '-'}</td><td>${v.discharge_diagnosis || '-'}</td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">📋</div><p>${tr('No discharged patients', 'لا يوجد مرضى خارجين')}</p></div>`}`;
  } else if (erTab === 'transferred') {
    c.innerHTML = `<h3>🔄 ${tr('Transferred to Inpatient', 'المحولين للتنويم')} (${admitted.length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'erTransTable')" style="margin-bottom:12px">
      ${admitted.length ? `<table class="data-table" id="erTransTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Complaint', 'الشكوى')}</th><th>${tr('Triage', 'الفرز')}</th><th>${tr('ER Doctor', 'طبيب الطوارئ')}</th><th>${tr('Arrival', 'الوصول')}</th><th>${tr('Status', 'الحالة')}</th></tr></thead><tbody>${admitted.map(v => {
      const tc = triageColors[v.triage_color] || '#999';
      return `<tr><td>${v.id}</td><td>${v.patient_name}</td><td>${v.chief_complaint_ar || v.chief_complaint || '-'}</td>
        <td><span style="background:${tc};color:#fff;padding:2px 8px;border-radius:12px;font-size:.85em">${v.triage_color}</span></td>
        <td>${v.assigned_doctor || '-'}</td>
        <td>${v.arrival_time ? new Date(v.arrival_time).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
        <td>${badge(tr('Admitted', 'تم التنويم'), 'success')}</td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">🏥</div><p>${tr('No transferred patients', 'لا يوجد مرضى محولين')}</p></div>`}`;
  } else {
    const zones = ['Resuscitation', 'Critical', 'Acute', 'Observation'];
    c.innerHTML = `<h3>🛏️ ${tr('ER Bed Map', 'خريطة أسرّة الطوارئ')}</h3>
      ${zones.map(z => `<h4 style="margin:16px 0 8px">${tr(z, z === 'Resuscitation' ? 'الإنعاش' : z === 'Critical' ? 'الحرجة' : z === 'Acute' ? 'الحادة' : 'المراقبة')}</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${(beds || []).filter(b => b.zone === z).map(b => `<div style="padding:16px;border-radius:12px;text-align:center;background:${b.status === 'Available' ? '#d4edda' : '#f8d7da'};border:2px solid ${b.status === 'Available' ? '#28a745' : '#dc3545'}">
          <div style="font-size:1.4em;font-weight:700">${b.bed_name_ar}</div><div style="font-size:.85em;margin-top:4px">${statusBadge(b.status)}</div></div>`).join('')}</div>`).join('')}`;
  }
}
window.registerERVisit = async function () {
  const ps = document.getElementById('erPatient'); if (!ps.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/emergency/visits', { patient_id: ps.value, patient_name: ps.options[ps.selectedIndex].dataset.name, arrival_mode: document.getElementById('erArrival').value, chief_complaint: document.getElementById('erComplaint').value, chief_complaint_ar: document.getElementById('erComplaintAr').value, triage_level: document.getElementById('erTriage').value, triage_color: document.getElementById('erTriageColor').value, assigned_doctor: document.getElementById('erDoctor').value, assigned_bed: document.getElementById('erBed').value });
    showToast(tr('ER visit registered!', 'تم تسجيل حالة الطوارئ!')); erTab = 'board'; await navigateTo(21);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.showERDischargeModal = function (id) {
  document.getElementById('erDischargeId').value = id;
  document.getElementById('erDischargeDiag').value = '';
  document.getElementById('erDischargeInst').value = '';
  document.getElementById('erDischargeMeds').value = '';
  document.getElementById('erDischargeFollowup').value = '';
  document.getElementById('erDischargeModal').style.display = 'flex';
};
window.confirmERDischarge = async function () {
  const id = document.getElementById('erDischargeId').value;
  try {
    await API.put('/api/emergency/visits/' + id, {
      status: 'Discharged',
      discharge_diagnosis: document.getElementById('erDischargeDiag').value,
      discharge_instructions: document.getElementById('erDischargeInst').value,
      discharge_medications: document.getElementById('erDischargeMeds').value,
      followup_date: document.getElementById('erDischargeFollowup').value
    });
    document.getElementById('erDischargeModal').style.display = 'none';
    showToast(tr('Patient discharged from ER!', 'تم خروج المريض من الطوارئ!'));
    erTab = 'discharged'; await navigateTo(21);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.transferERToInpatient = async function (visitId, patientName, patientId, doctor, complaint) {
  if (!confirm(tr('Transfer this patient to inpatient?', 'هل تريد تحويل هذا المريض للتنويم؟'))) return;
  try {
    await API.put('/api/emergency/visits/' + visitId, { status: 'Admitted' });
    await API.post('/api/admissions', {
      patient_id: patientId, patient_name: patientName,
      admission_type: 'Emergency', admitting_doctor: doctor, attending_doctor: doctor,
      department: 'Emergency', diagnosis: complaint
    });
    showToast(tr('Patient transferred to inpatient!', 'تم تحويل المريض للتنويم!'));
    erTab = 'transferred'; await navigateTo(21);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.updateERVisit = async function (id, status) {
  try { await API.put('/api/emergency/visits/' + id, { status }); showToast(tr('Updated', 'تم التحديث')); await navigateTo(21); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== INPATIENT ADT =====
let adtTab = 'census';
async function renderInpatient(el) {
  const [census, activeAdm, dischargedAdm, patients, doctors, wards] = await Promise.all([
    API.get('/api/beds/census'), API.get('/api/admissions?status=Active'),
    API.get('/api/admissions?status=Discharged'),
    API.get('/api/patients'), API.get('/api/employees'), API.get('/api/wards')
  ]);
  const drs = (doctors || []).filter(d => d.role === 'Doctor');
  el.innerHTML = `<div class="page-title">🛏️ ${tr('Inpatient ADT', 'التنويم')}</div>
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card"><div class="stat-value" style="color:#2ecc71">${census.available || 0}</div><div class="stat-label">${tr('Available Beds', 'أسرّة متاحة')}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#e74c3c">${census.occupied || 0}</div><div class="stat-label">${tr('Occupied', 'مشغولة')}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#3498db">${(activeAdm || []).length}</div><div class="stat-label">${tr('Current Patients', 'المنومين')}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#27ae60">${(dischargedAdm || []).length}</div><div class="stat-label">${tr('Discharged', 'الخارجين')}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:#9b59b6">${census.occupancyRate || 0}%</div><div class="stat-label">${tr('Occupancy', 'نسبة الإشغال')}</div></div>
    </div>
    <div class="tab-bar"><button class="tab-btn ${adtTab === 'census' ? 'active' : ''}" onclick="adtTab='census';navigateTo(22)">🗺️ ${tr('Census', 'الإشغال')}</button>
      <button class="tab-btn ${adtTab === 'admit' ? 'active' : ''}" onclick="adtTab='admit';navigateTo(22)">➕ ${tr('Admit', 'تنويم')}</button>
      <button class="tab-btn ${adtTab === 'patients' ? 'active' : ''}" onclick="adtTab='patients';navigateTo(22)">📋 ${tr('Patients', 'المنومين')}</button>
      <button class="tab-btn ${adtTab === 'discharged' ? 'active' : ''}" onclick="adtTab='discharged';navigateTo(22)">🚪 ${tr('Discharged', 'الخارجين')}</button></div>
    <div class="card" id="adtContent"></div>
    <div id="adtDischargeModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center">
      <div style="background:#fff;padding:30px;border-radius:16px;width:550px;max-width:90%;max-height:85vh;overflow-y:auto;direction:rtl">
        <h3 style="margin-bottom:16px">🚪 ${tr('Discharge Patient', 'خروج مريض')}</h3>
        <input type="hidden" id="adtDischargeId">
        <div class="form-grid" style="gap:12px">
          <div><label>${tr('Discharge Type', 'نوع الخروج')}</label><select id="adtDischargeType" class="form-control">
            <option value="Regular">${tr('Regular', 'عادي')}</option><option value="AMA">${tr('Against Medical Advice', 'ضد المشورة الطبية')}</option>
            <option value="Transfer">${tr('Transfer', 'تحويل')}</option><option value="Death">${tr('Death', 'وفاة')}</option></select></div>
          <div style="grid-column:span 2"><label>${tr('Discharge Summary', 'ملخص الخروج')}</label><textarea id="adtDischargeSummary" class="form-control" rows="3"></textarea></div>
          <div style="grid-column:span 2"><label>${tr('Instructions', 'تعليمات للمريض')}</label><textarea id="adtDischargeInst" class="form-control" rows="2"></textarea></div>
          <div><label>${tr('Medications', 'أدوية الخروج')}</label><textarea id="adtDischargeMeds" class="form-control" rows="2"></textarea></div>
          <div><label>${tr('Follow-up Date', 'موعد المراجعة')}</label><input id="adtFollowupDate" type="date" class="form-control"></div>
          <div><label>${tr('Follow-up Doctor', 'طبيب المتابعة')}</label><select id="adtFollowupDoctor" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${drs.map(d => `<option value="${d.name_ar || d.name}">${d.name_ar || d.name}</option>`).join('')}</select></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary" onclick="confirmInpatientDischarge()" style="flex:1">✅ ${tr('Confirm Discharge', 'تأكيد الخروج')}</button>
          <button class="btn" onclick="document.getElementById('adtDischargeModal').style.display='none'" style="flex:1">❌ ${tr('Cancel', 'إلغاء')}</button>
        </div>
      </div>
    </div>`;
  const c = document.getElementById('adtContent');
  if (adtTab === 'census') {
    c.innerHTML = (census.wards || []).map(w => {
      const wBeds = (census.beds || []).filter(b => b.ward_id === w.id);
      const occ = wBeds.filter(b => b.status === 'Occupied').length;
      return `<div style="margin-bottom:20px"><h4>${w.ward_name_ar} (${w.ward_name}) — <span style="color:${occ / wBeds.length > 0.8 ? '#e74c3c' : '#2ecc71'}">${occ}/${wBeds.length}</span></h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">${wBeds.map(b => `<div style="padding:10px;border-radius:10px;text-align:center;font-size:.85em;background:${b.status === 'Available' ? '#d4edda' : '#f8d7da'};border:1px solid ${b.status === 'Available' ? '#28a745' : '#dc3545'};cursor:pointer" title="${b.patient_name || ''} ${b.diagnosis || ''}">
          <strong>${tr('Bed', 'سرير')} ${b.bed_number}</strong><br><small>${tr('Room', 'غرفة')} ${b.room_number}</small><br>${b.patient_name ? `<small>${b.patient_name}</small>` : statusBadge(b.status)}</div>`).join('')}</div></div>`;
    }).join('');
  } else if (adtTab === 'admit') {
    c.innerHTML = `<h3>➕ ${tr('New Admission', 'تنويم جديد')}</h3><div class="form-grid">
      <div><label>${tr('Patient', 'المريض')}</label><select id="admPatient" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(patients || []).map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.name_ar || p.name_en} (${p.file_number})</option>`).join('')}</select></div>
      <div><label>${tr('Type', 'النوع')}</label><select id="admType" class="form-control"><option value="Regular">${tr('Regular', 'عادي')}</option><option value="Emergency">${tr('Emergency', 'طوارئ')}</option><option value="Transfer">${tr('Transfer', 'تحويل')}</option></select></div>
      <div><label>${tr('Attending Doctor', 'الطبيب المعالج')}</label><select id="admDoctor" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${drs.map(d => `<option value="${d.name_ar || d.name}">${d.name_ar || d.name}</option>`).join('')}</select></div>
      <div><label>${tr('Department', 'القسم')}</label><input id="admDept" class="form-control"></div>
      <div><label>${tr('Ward', 'الجناح')}</label><select id="admWard" class="form-control" onchange="loadWardBeds(this.value)"><option value="">${tr('Select', 'اختر')}</option>${(wards || []).map(w => `<option value="${w.id}">${w.ward_name_ar}</option>`).join('')}</select></div>
      <div><label>${tr('Bed', 'السرير')}</label><select id="admBed" class="form-control"><option value="">${tr('Select ward first', 'اختر الجناح أولاً')}</option></select></div>
      <div style="grid-column:span 2"><label>${tr('Diagnosis', 'التشخيص')}</label><textarea id="admDiagnosis" class="form-control" rows="2"></textarea></div>
      <div><label>${tr('Diet', 'الحمية')}</label><select id="admDiet" class="form-control"><option value="Regular">${tr('Regular', 'عادية')}</option><option value="Diabetic">${tr('Diabetic', 'سكري')}</option><option value="Renal">${tr('Renal', 'كلوي')}</option><option value="Cardiac">${tr('Cardiac', 'قلبي')}</option><option value="NPO">${tr('NPO', 'صائم')}</option><option value="Liquid">${tr('Liquid', 'سوائل')}</option></select></div>
      <div><label>${tr('Expected LOS', 'مدة الإقامة المتوقعة')}</label><input id="admLOS" type="number" value="3" class="form-control"></div>
    </div><button class="btn btn-primary" onclick="admitPatient()" style="margin-top:16px">🛏️ ${tr('Admit', 'تنويم')}</button>`;
  } else if (adtTab === 'patients') {
    c.innerHTML = `<h3>📋 ${tr('Current Inpatients', 'المنومين الحاليين')} (${(activeAdm || []).length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'adtPatientsTable')" style="margin-bottom:12px">
      ${(activeAdm || []).length ? `<table class="data-table" id="adtPatientsTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Type', 'النوع')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Diagnosis', 'التشخيص')}</th><th>${tr('Admission Date', 'تاريخ التنويم')}</th><th>${tr('Days', 'أيام')}</th><th>${tr('Actions', 'إجراءات')}</th></tr></thead><tbody>${(activeAdm || []).map(a => {
      const days = Math.floor((new Date() - new Date(a.admission_date)) / 86400000);
      const typeBadge = a.admission_type === 'Emergency' ? badge(tr('ER', 'طوارئ'), 'danger') : a.admission_type === 'Transfer' ? badge(tr('Transfer', 'تحويل'), 'warning') : badge(tr('Regular', 'عادي'), 'info');
      return `<tr><td>${a.id}</td><td><strong>${a.patient_name}</strong></td><td>${typeBadge}</td><td>${a.attending_doctor || '-'}</td><td>${a.diagnosis || '-'}</td><td>${new Date(a.admission_date).toLocaleDateString('ar-SA')}</td><td><span style="font-weight:700;color:${days > 7 ? '#e74c3c' : '#2ecc71'}">${days}</span></td>
        <td><button class="btn btn-sm" onclick="showInpatientDischargeModal(${a.id})">🚪 ${tr('Discharge', 'خروج')}</button></td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">🛏️</div><p>${tr('No inpatients', 'لا يوجد منومين')}</p></div>`}`;
  } else if (adtTab === 'discharged') {
    c.innerHTML = `<h3>🚪 ${tr('Discharged Patients', 'الخارجين من التنويم')} (${(dischargedAdm || []).length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'adtDischTable')" style="margin-bottom:12px">
      ${(dischargedAdm || []).length ? `<table class="data-table" id="adtDischTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Type', 'نوع الخروج')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Diagnosis', 'التشخيص')}</th><th>${tr('Admitted', 'التنويم')}</th><th>${tr('Discharged', 'الخروج')}</th><th>${tr('LOS', 'المدة')}</th></tr></thead><tbody>${(dischargedAdm || []).map(a => {
      const los = a.discharge_date && a.admission_date ? Math.floor((new Date(a.discharge_date) - new Date(a.admission_date)) / 86400000) : '-';
      const dtBadge = a.discharge_type === 'AMA' ? badge(tr('AMA', 'ضد المشورة'), 'danger') : a.discharge_type === 'Death' ? badge(tr('Death', 'وفاة'), 'danger') : a.discharge_type === 'Transfer' ? badge(tr('Transfer', 'تحويل'), 'warning') : badge(tr('Regular', 'عادي'), 'success');
      return `<tr><td>${a.id}</td><td>${a.patient_name}</td><td>${dtBadge}</td><td>${a.attending_doctor || '-'}</td><td>${a.diagnosis || '-'}</td>
        <td>${a.admission_date ? new Date(a.admission_date).toLocaleDateString('ar-SA') : '-'}</td>
        <td>${a.discharge_date ? new Date(a.discharge_date).toLocaleDateString('ar-SA') : '-'}</td>
        <td><strong>${los}</strong> ${tr('days', 'يوم')}</td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">📋</div><p>${tr('No discharged patients', 'لا يوجد مرضى خارجين')}</p></div>`}`;
  }
}
window.loadWardBeds = async function (wardId) {
  if (!wardId) return;
  const beds = await API.get('/api/beds?ward_id=' + wardId);
  const s = document.getElementById('admBed');
  s.innerHTML = `<option value="">${tr('Select', 'اختر')}</option>${(beds || []).filter(b => b.status === 'Available').map(b => `<option value="${b.id}">${tr('Bed', 'سرير')} ${b.bed_number} - ${tr('Room', 'غرفة')} ${b.room_number}</option>`).join('')}`;
};
window.admitPatient = async function () {
  const ps = document.getElementById('admPatient'); if (!ps.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/admissions', { patient_id: ps.value, patient_name: ps.options[ps.selectedIndex].dataset.name, admission_type: document.getElementById('admType').value, attending_doctor: document.getElementById('admDoctor').value, admitting_doctor: document.getElementById('admDoctor').value, department: document.getElementById('admDept').value, ward_id: document.getElementById('admWard').value, bed_id: document.getElementById('admBed').value, diagnosis: document.getElementById('admDiagnosis').value, diet_order: document.getElementById('admDiet').value, expected_los: document.getElementById('admLOS').value });
    showToast(tr('Patient admitted!', 'تم التنويم!')); adtTab = 'patients'; await navigateTo(22);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.showInpatientDischargeModal = function (id) {
  document.getElementById('adtDischargeId').value = id;
  document.getElementById('adtDischargeSummary').value = '';
  document.getElementById('adtDischargeInst').value = '';
  document.getElementById('adtDischargeMeds').value = '';
  document.getElementById('adtFollowupDate').value = '';
  document.getElementById('adtDischargeModal').style.display = 'flex';
};
window.confirmInpatientDischarge = async function () {
  const id = document.getElementById('adtDischargeId').value;
  try {
    await API.put('/api/admissions/' + id + '/discharge', {
      discharge_type: document.getElementById('adtDischargeType').value,
      discharge_summary: document.getElementById('adtDischargeSummary').value,
      discharge_instructions: document.getElementById('adtDischargeInst').value,
      discharge_medications: document.getElementById('adtDischargeMeds').value,
      followup_date: document.getElementById('adtFollowupDate').value,
      followup_doctor: document.getElementById('adtFollowupDoctor').value
    });
    document.getElementById('adtDischargeModal').style.display = 'none';
    showToast(tr('Patient discharged!', 'تم خروج المريض!'));
    adtTab = 'discharged'; await navigateTo(22);
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.dischargePatient = async function (id) {
  showInpatientDischargeModal(id);
};
// ===== ICU =====
// ===== ICU =====
let icuTab = 'patients';
async function renderICU(el) {
  let icuPatients = [], allAdmissions = [], alerts = [], flowsheet = {};
  try { [icuPatients, allAdmissions, alerts] = await Promise.all([
    API.get('/api/icu/patients'), API.get('/api/admissions'), API.get('/api/clinical/alerts')
  ]); } catch(e) { icuPatients=[]; allAdmissions=[]; alerts=[]; }
  const discharged = (allAdmissions||[]).filter(a => a.status==='Discharged' && a.department==='ICU');
  const totalICU = (icuPatients||[]).length;
  const onVent = (icuPatients||[]).filter(p => p.activity_level==='Ventilated'||p.dvt_prophylaxis).length;
  const critAlerts = (alerts||[]).filter(a => a.severity==='critical' && !a.resolved_at);
  const warnAlerts = (alerts||[]).filter(a => a.severity==='warning' && !a.resolved_at);
  const occ = totalICU > 0 ? Math.round((totalICU/(totalICU+discharged.length||1))*100) : 0;

  el.innerHTML = `<div class="page-title">🫀 ${tr('ICU Real-time Dashboard', 'لوحة العناية المركزة اللحظية')}</div>
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card" style="--stat-color:#ef4444"><div class="stat-icon">🫀</div><div class="stat-label">${tr('Current Patients', 'المرضى الحاليين')}</div><div class="stat-value" style="color:#ef4444">${totalICU}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-icon">🫁</div><div class="stat-label">${tr('On Ventilator', 'على التنفس')}</div><div class="stat-value" style="color:#3b82f6">${onVent}</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-icon">⚠️</div><div class="stat-label">${tr('Active Alerts', 'تنبيهات نشطة')}</div><div class="stat-value" style="color:#f59e0b">${critAlerts.length + warnAlerts.length}</div></div>
      <div class="stat-card" style="--stat-color:#22c55e"><div class="stat-icon">📊</div><div class="stat-label">${tr('Occupancy', 'الإشغال')}</div><div class="stat-value" style="color:#22c55e">${occ}%</div></div>
    </div>

    <!-- CRITICAL ALERTS PANEL -->
    ${critAlerts.length ? `<div class="card" style="border:1px solid rgba(239,68,68,0.3);margin-bottom:16px;animation:alertPulse 2s infinite">
      <div class="card-title" style="color:#ef4444;border-bottom-color:rgba(239,68,68,0.2)">🚨 ${tr('CRITICAL ALERTS', 'تنبيهات حرجة')} (${critAlerts.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">
        ${critAlerts.slice(0,6).map(a => `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(239,68,68,0.08);border-radius:12px;border:1px solid rgba(239,68,68,0.15)">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${a.alert_type==='gcs_critical'?'🧠':a.alert_type==='pain_critical'?'😣':'🚨'}</div>
          <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;color:#ef4444">${escapeHTML(a.alert_type||'').replace(/_/g,' ').toUpperCase()}</div>
          <div style="font-size:12px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(a.message||'')}</div>
          <div style="font-size:11px;color:var(--text-dim);opacity:0.6">${a.created_at ? new Date(a.created_at).toLocaleTimeString('ar-SA') : ''}</div></div>
          <button class="btn btn-sm btn-danger" onclick="resolveAlert(${a.id})" style="flex-shrink:0">✓</button>
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${warnAlerts.length ? `<div class="card" style="border:1px solid rgba(245,158,11,0.3);margin-bottom:16px">
      <div class="card-title" style="color:#f59e0b;border-bottom-color:rgba(245,158,11,0.2)">⚠️ ${tr('WARNING ALERTS', 'تنبيهات تحذيرية')} (${warnAlerts.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${warnAlerts.slice(0,8).map(a => `<div style="padding:8px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:8px;font-size:12px">
          <span style="font-weight:700;color:#f59e0b">${escapeHTML(a.alert_type||'').replace(/_/g,' ')}</span> — ${escapeHTML(a.message||'').substring(0,60)}
        </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="tabs" style="margin-bottom:16px">
      <div class="tab ${icuTab==='patients'?'active':''}" onclick="icuTab='patients';navigateTo(23)">👥 ${tr('Bed Map', 'خريطة الأسرّة')}</div>
      <div class="tab ${icuTab==='monitor'?'active':''}" onclick="icuTab='monitor';navigateTo(23)">📊 ${tr('Vitals', 'العلامات الحيوية')}</div>
      <div class="tab ${icuTab==='ventilator'?'active':''}" onclick="icuTab='ventilator';navigateTo(23)">🫁 ${tr('Ventilator', 'التنفس')}</div>
      <div class="tab ${icuTab==='scores'?'active':''}" onclick="icuTab='scores';navigateTo(23)">📋 ${tr('Scores', 'المقاييس')}</div>
      <div class="tab ${icuTab==='fluid'?'active':''}" onclick="icuTab='fluid';navigateTo(23)">💧 ${tr('Fluid', 'السوائل')}</div>
      <div class="tab ${icuTab==='discharged'?'active':''}" onclick="icuTab='discharged';navigateTo(23)">🚪 ${tr('Discharged', 'الخارجين')}</div>
    </div>
    <div class="card" id="icuContent"></div>
    <style>.icu-bed{border-radius:14px;padding:16px;border:1px solid var(--glass-border);background:var(--glass-card);transition:all .3s ease;position:relative;overflow:hidden}.icu-bed:hover{transform:translateY(-3px);box-shadow:var(--glow-md)}.icu-bed.critical{border-color:rgba(239,68,68,.3);animation:bedPulse 2s infinite}.icu-bed .bed-id{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px}.icu-bed .bed-patient{font-size:14px;font-weight:700;margin-bottom:4px}.icu-bed .bed-vitals{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.icu-bed .vital-chip{font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.15);font-weight:600}@keyframes bedPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.15)}50%{box-shadow:0 0 0 6px rgba(239,68,68,.05)}}@keyframes alertPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.1)}50%{box-shadow:0 0 0 4px rgba(239,68,68,.05)}}</style>`;

  const c = document.getElementById('icuContent');
  if (icuTab === 'patients') {
    if (totalICU) {
      c.innerHTML = `<div class="card-title">🛏️ ${tr('ICU Bed Map', 'خريطة أسرّة العناية')} (${totalICU})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
        ${(icuPatients||[]).map(p => {
          const days = Math.floor((new Date()-new Date(p.admission_date))/86400000);
          const isCrit = days > 7;
          return `<div class="icu-bed ${isCrit?'critical':''}">
            <div class="bed-id">${tr('Bed','سرير')} ${p.bed_number||'?'} — ${p.ward_name_ar||'ICU'}</div>
            <div class="bed-patient">${escapeHTML(p.patient_name)}</div>
            <div style="font-size:12px;color:var(--text-dim)">${escapeHTML(p.diagnosis||'-')}</div>
            <div style="font-size:11px;margin-top:4px">${tr('Doctor','طبيب')}: ${escapeHTML(p.attending_doctor||'-')}</div>
            <div class="bed-vitals">
              <span class="vital-chip" style="${isCrit?'background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.2);color:#ef4444':''}">📅 ${days} ${tr('days','يوم')}</span>
              ${p.activity_level==='Ventilated'?'<span class="vital-chip" style="background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.2);color:#3b82f6">🫁 Vent</span>':''}
            </div>
            <div style="margin-top:10px"><button class="btn btn-sm" onclick="showInpatientDischargeModal(${p.id})">🚪 ${tr('Discharge','خروج')}</button></div>
          </div>`;
        }).join('')}</div>`;
    } else {
      c.innerHTML = `<div class="empty-state"><div class="empty-icon">🫀</div><p>${tr('No ICU patients','لا يوجد مرضى بالعناية')}</p></div>`;
    }
  } else if (icuTab === 'monitor') {
    c.innerHTML = `<h3>📊 ${tr('Record Vitals', 'تسجيل العلامات الحيوية')}</h3>
      <div class="form-grid">
        <div><label>${tr('Patient', 'المريض')}</label><select id="icuPatientMon" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(icuPatients || []).map(p => `<option value="${p.id}" data-pid="${p.patient_id}">${p.patient_name} - ${p.ward_name_ar || ''} ${tr('Bed', 'سرير')} ${p.bed_number || ''}</option>`).join('')}</select></div>
        <div><label>HR</label><input id="icuHR" type="number" class="form-control" placeholder="bpm"></div>
        <div><label>SBP/DBP</label><div style="display:flex;gap:4px"><input id="icuSBP" type="number" class="form-control" placeholder="SBP"><input id="icuDBP" type="number" class="form-control" placeholder="DBP"></div></div>
        <div><label>SpO2</label><input id="icuSpO2" type="number" class="form-control" placeholder="%"></div>
        <div><label>RR</label><input id="icuRR" type="number" class="form-control" placeholder="/min"></div>
        <div><label>Temp</label><input id="icuTemp" type="number" step="0.1" class="form-control" placeholder="°C"></div>
        <div><label>FiO2</label><input id="icuFiO2" type="number" class="form-control" placeholder="%"></div>
        <div><label>Urine (ml)</label><input id="icuUrine" type="number" class="form-control" placeholder="ml"></div>
      </div><button class="btn btn-primary" onclick="saveICUMonitor()" style="margin-top:12px">💾 ${tr('Save', 'حفظ')}</button>`;
  } else if (icuTab === 'ventilator') {
    c.innerHTML = `<h3>🫁 ${tr('Ventilator Settings', 'إعدادات التنفس الصناعي')}</h3>
      <div class="form-grid">
        <div><label>${tr('Patient', 'المريض')}</label><select id="icuPatientVent" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(icuPatients || []).map(p => `<option value="${p.id}" data-pid="${p.patient_id}">${p.patient_name}</option>`).join('')}</select></div>
        <div><label>${tr('Mode', 'الوضع')}</label><select id="ventMode" class="form-control"><option>CMV</option><option>SIMV</option><option>PSV</option><option>CPAP</option><option>BiPAP</option><option>APRV</option></select></div>
        <div><label>FiO2 %</label><input id="ventFiO2" type="number" value="21" class="form-control"></div>
        <div><label>TV (ml)</label><input id="ventTV" type="number" class="form-control"></div>
        <div><label>RR</label><input id="ventRR" type="number" class="form-control"></div>
        <div><label>PEEP</label><input id="ventPEEP" type="number" class="form-control"></div>
        <div><label>PIP</label><input id="ventPIP" type="number" class="form-control"></div>
        <div><label>PS</label><input id="ventPS" type="number" class="form-control"></div>
        <div><label>ETT Size</label><input id="ventETT" class="form-control"></div>
      </div><button class="btn btn-primary" onclick="saveVentilator()" style="margin-top:12px">💾 ${tr('Save', 'حفظ')}</button>`;
  } else if (icuTab === 'scores') {
    c.innerHTML = `<h3>📋 ${tr('Clinical Scores', 'المقاييس السريرية')}</h3>
      <div class="form-grid">
        <div><label>${tr('Patient', 'المريض')}</label><select id="icuPatientScore" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(icuPatients || []).map(p => `<option value="${p.id}" data-pid="${p.patient_id}">${p.patient_name}</option>`).join('')}</select></div>
        <div><label>APACHE II</label><input id="scoreAPACHE" type="number" class="form-control"></div>
        <div><label>SOFA</label><input id="scoreSOFA" type="number" class="form-control"></div>
        <div><label>GCS</label><input id="scoreGCS" type="number" value="15" class="form-control"></div>
        <div><label>RASS</label><input id="scoreRASS" type="number" value="0" class="form-control"></div>
        <div><label>Braden</label><input id="scoreBraden" type="number" value="23" class="form-control"></div>
        <div><label>Morse Fall</label><input id="scoreMorse" type="number" class="form-control"></div>
        <div><label>Pain (0-10)</label><input id="scorePain" type="number" class="form-control"></div>
      </div><button class="btn btn-primary" onclick="saveICUScores()" style="margin-top:12px">💾 ${tr('Save', 'حفظ')}</button>`;
  } else if (icuTab === 'fluid') {
    c.innerHTML = `<h3>💧 ${tr('Fluid Balance', 'توازن السوائل')}</h3>
      <div class="form-grid">
        <div><label>${tr('Patient', 'المريض')}</label><select id="icuPatientFluid" class="form-control"><option value="">${tr('Select', 'اختر')}</option>${(icuPatients || []).map(p => `<option value="${p.id}" data-pid="${p.patient_id}">${p.patient_name}</option>`).join('')}</select></div>
        <div><label>${tr('Shift', 'الوردية')}</label><select id="fluidShift" class="form-control"><option value="Day">${tr('Day', 'نهاري')}</option><option value="Night">${tr('Night', 'ليلي')}</option></select></div>
        <div style="grid-column:span 2"><h4 style="color:#2ecc71">⬇️ ${tr('Intake', 'الوارد')}</h4></div>
        <div><label>IV Fluids (ml)</label><input id="fluidIV" type="number" class="form-control"></div>
        <div><label>Oral (ml)</label><input id="fluidOral" type="number" class="form-control"></div>
        <div><label>Blood Products (ml)</label><input id="fluidBlood" type="number" class="form-control"></div>
        <div><label>IV Meds (ml)</label><input id="fluidMeds" type="number" class="form-control"></div>
        <div style="grid-column:span 2"><h4 style="color:#e74c3c">⬆️ ${tr('Output', 'الصادر')}</h4></div>
        <div><label>Urine (ml)</label><input id="fluidUrine" type="number" class="form-control"></div>
        <div><label>Drains (ml)</label><input id="fluidDrains" type="number" class="form-control"></div>
        <div><label>NGT (ml)</label><input id="fluidNGT" type="number" class="form-control"></div>
        <div><label>Vomit (ml)</label><input id="fluidVomit" type="number" class="form-control"></div>
      </div><button class="btn btn-primary" onclick="saveFluidBalance()" style="margin-top:12px">💾 ${tr('Save', 'حفظ')}</button>`;
  } else if (icuTab === 'discharged') {
    c.innerHTML = `<h3>🚪 ${tr('Discharged from ICU', 'الخارجين من العناية المركزة')} (${discharged.length})</h3>
      <input class="form-control" placeholder="${tr('Search...', 'بحث...')}" oninput="filterTable(this,'icuDischTable')" style="margin-bottom:12px">
      ${discharged.length ? `<table class="data-table" id="icuDischTable"><thead><tr><th>#</th><th>${tr('Patient', 'المريض')}</th><th>${tr('Discharge Type', 'نوع الخروج')}</th><th>${tr('Doctor', 'الطبيب')}</th><th>${tr('Diagnosis', 'التشخيص')}</th><th>${tr('Admitted', 'التنويم')}</th><th>${tr('Discharged', 'الخروج')}</th><th>${tr('LOS', 'المدة')}</th></tr></thead><tbody>${discharged.map(a => {
      const los = a.discharge_date && a.admission_date ? Math.floor((new Date(a.discharge_date) - new Date(a.admission_date)) / 86400000) : '-';
      const dtBadge = a.discharge_type === 'AMA' ? badge(tr('AMA', 'ضد المشورة'), 'danger') : a.discharge_type === 'Death' ? badge(tr('Death', 'وفاة'), 'danger') : a.discharge_type === 'Transfer' ? badge(tr('Transfer', 'تحويل'), 'warning') : badge(tr('Regular', 'عادي'), 'success');
      return `<tr><td>${a.id}</td><td>${a.patient_name}</td><td>${dtBadge}</td><td>${a.attending_doctor || '-'}</td><td>${a.diagnosis || '-'}</td>
        <td>${a.admission_date ? new Date(a.admission_date).toLocaleDateString('ar-SA') : '-'}</td>
        <td>${a.discharge_date ? new Date(a.discharge_date).toLocaleDateString('ar-SA') : '-'}</td>
        <td><strong>${los}</strong> ${tr('days', 'يوم')}</td></tr>`;
    }).join('')}</tbody></table>` : `<div class="empty-state"><div class="empty-icon">📋</div><p>${tr('No discharged patients', 'لا يوجد مرضى خارجين')}</p></div>`}`;
  }
}
window.saveICUMonitor = async function () {
  const s = document.getElementById('icuPatientMon'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/icu/monitoring', { admission_id: s.value, patient_id: s.options[s.selectedIndex].dataset.pid, hr: document.getElementById('icuHR').value, sbp: document.getElementById('icuSBP').value, dbp: document.getElementById('icuDBP').value, spo2: document.getElementById('icuSpO2').value, rr: document.getElementById('icuRR').value, temp: document.getElementById('icuTemp').value, fio2: document.getElementById('icuFiO2').value, urine_output: document.getElementById('icuUrine').value, recorded_by: currentUser?.display_name });
    showToast(tr('Saved!', 'تم الحفظ!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveVentilator = async function () {
  const s = document.getElementById('icuPatientVent'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/icu/ventilator', { admission_id: s.value, patient_id: s.options[s.selectedIndex].dataset.pid, vent_mode: document.getElementById('ventMode').value, fio2: document.getElementById('ventFiO2').value, tidal_volume: document.getElementById('ventTV').value, respiratory_rate: document.getElementById('ventRR').value, peep: document.getElementById('ventPEEP').value, pip: document.getElementById('ventPIP').value, ps: document.getElementById('ventPS').value, ett_size: document.getElementById('ventETT').value, recorded_by: currentUser?.display_name });
    showToast(tr('Saved!', 'تم الحفظ!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveICUScores = async function () {
  const s = document.getElementById('icuPatientScore'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/icu/scores', { admission_id: s.value, patient_id: s.options[s.selectedIndex].dataset.pid, apache_ii: document.getElementById('scoreAPACHE').value, sofa: document.getElementById('scoreSOFA').value, gcs: document.getElementById('scoreGCS').value, rass: document.getElementById('scoreRASS').value, braden: document.getElementById('scoreBraden').value, morse_fall: document.getElementById('scoreMorse').value, pain_score: document.getElementById('scorePain').value, calculated_by: currentUser?.display_name });
    showToast(tr('Saved!', 'تم الحفظ!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.saveFluidBalance = async function () {
  const s = document.getElementById('icuPatientFluid'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try {
    await API.post('/api/icu/fluid-balance', { admission_id: s.value, patient_id: s.options[s.selectedIndex].dataset.pid, shift: document.getElementById('fluidShift').value, iv_fluids: document.getElementById('fluidIV').value, oral_intake: document.getElementById('fluidOral').value, blood_products: document.getElementById('fluidBlood').value, medications_iv: document.getElementById('fluidMeds').value, urine: document.getElementById('fluidUrine').value, drains: document.getElementById('fluidDrains').value, ngt_output: document.getElementById('fluidNGT').value, vomit: document.getElementById('fluidVomit').value, recorded_by: currentUser?.display_name });
    showToast(tr('Saved!', 'تم الحفظ!'));
  } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.resolveAlert = async function (id) {
  try { await API.put('/api/clinical/alerts/' + id + '/resolve', { resolved_by: currentUser?.display_name }); showToast(tr('Alert resolved', 'تم حل التنبيه')); navigateTo(23); } catch(e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
// ===== CSSD =====
async function renderCSSD(el) {
  const content = el;

  const batches = await API.get('/api/cssd/batches').catch(() => []);
  const processing = batches.filter(b => b.status === 'processing').length;
  const done = batches.filter(b => b.status === 'completed').length;

  content.innerHTML = `
    <h2>${tr('CSSD - Sterilization', 'التعقيم المركزي')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${batches.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Batches', 'إجمالي الدفعات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${processing}</h3><p style="margin:4px 0 0;font-size:12px">${tr('In Process', 'قيد التعقيم')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${done}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Completed', 'مكتملة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Batch', 'دفعة جديدة')}</h4>
        <div class="form-group"><label>${tr('Batch #', 'رقم الدفعة')}</label><input class="form-input" id="cssdBatch" value="CSSD-${Date.now().toString().slice(-6)}"></div>
        <div class="form-group"><label>${tr('Items', 'الأصناف')}</label><textarea class="form-input" id="cssdItems" rows="2" placeholder="${tr('Surgical instruments, trays...', 'أدوات جراحية، صواني...')}"></textarea></div>
        <div class="form-group"><label>${tr('Department', 'القسم')}</label><input class="form-input" id="cssdDept" placeholder="${tr('Surgery, ER...', 'الجراحة، الطوارئ...')}"></div>
        <div class="form-group"><label>${tr('Method', 'طريقة التعقيم')}</label>
          <select class="form-input" id="cssdMethod">
            <option value="autoclave">${tr('Steam Autoclave', 'أوتوكلاف بخاري')}</option>
            <option value="eto">${tr('ETO Gas', 'غاز ETO')}</option>
            <option value="plasma">${tr('H2O2 Plasma', 'بلازما H2O2')}</option>
            <option value="chemical">${tr('Chemical', 'كيميائي')}</option>
          </select></div>
        <div class="form-group"><label>${tr('Temperature', 'الحرارة')}</label><input class="form-input" id="cssdTemp" placeholder="134°C"></div>
        <div class="form-group"><label>${tr('Operator', 'المشغّل')}</label><input class="form-input" id="cssdOp"></div>
        <button class="btn btn-primary w-full" onclick="saveCssdBatch()">💾 ${tr('Start Cycle', 'بدء الدورة')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Batch History', 'سجل الدفعات')}</h4>
        <div id="cssdTable"></div>
      </div>
    </div>`;

  const ct = document.getElementById('cssdTable');
  if (ct) {
    createTable(ct, 'cssdTbl',
      [tr('Batch#', 'الدفعة'), tr('Items', 'الأصناف'), tr('Dept', 'القسم'), tr('Method', 'الطريقة'), tr('Temp', 'الحرارة'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', 'إجراءات')],
      batches.map(b => ({
        cells: [b.batch_number, (b.items || '').substring(0, 30), b.department || '', b.method || '', b.temperature || '', statusBadge(b.status), b.created_at ? new Date(b.created_at).toLocaleDateString('ar-SA') : '',
        b.status === 'processing' ? '<button class="btn btn-sm" onclick="completeCssd(' + b.id + ')">✅ ' + tr('Complete', 'إكمال') + '</button>' : '✅'], id: b.id
      }))
    );
  }
  window.saveCssdBatch = async () => {
    try { await API.post('/api/cssd/batches', { batch_number: document.getElementById('cssdBatch').value, items: document.getElementById('cssdItems').value, department: document.getElementById('cssdDept').value, method: document.getElementById('cssdMethod').value, temperature: document.getElementById('cssdTemp').value, operator: document.getElementById('cssdOp').value }); showToast(tr('Cycle started!', 'بدأت الدورة!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };
  window.completeCssd = async (id) => { try { await API.put('/api/cssd/batches/' + id, { status: 'completed' }); showToast('✅'); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };

}
window.addInstrumentSet = async function () {
  try { await API.post('/api/cssd/instruments', { set_name: document.getElementById('cssdName').value, set_name_ar: document.getElementById('cssdNameAr').value, set_code: document.getElementById('cssdCode').value, category: document.getElementById('cssdCat').value, instrument_count: document.getElementById('cssdCount').value, department: document.getElementById('cssdDept').value }); showToast(tr('Added!', 'تمت الإضافة!')); await navigateTo(24); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.startCycle = async function () {
  try { await API.post('/api/cssd/cycles', { cycle_number: document.getElementById('cycleNum').value, machine_name: document.getElementById('cycleMachine').value, cycle_type: document.getElementById('cycleType').value, temperature: document.getElementById('cycleTemp').value, duration_minutes: document.getElementById('cycleDur').value, operator: document.getElementById('cycleOp').value }); showToast(tr('Cycle started!', 'بدأت الدورة!')); await navigateTo(24); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.completeCycle = async function (id) {
  try { await API.put('/api/cssd/cycles/' + id, { status: 'Completed', bi_test_result: 'Pass' }); showToast(tr('Completed!', 'اكتملت!')); await navigateTo(24); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== DIETARY =====
async function renderDietary(el) {

  const patients = await API.get('/api/dietary/orders').catch(() => []);
  content.innerHTML = `
    <h2>${tr('Dietary / Nutrition', 'التغذية')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${patients.length || 0}</h3><p style="margin:4px 0 0;font-size:13px;color:#666">${tr('Active Orders', 'طلبات نشطة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${patients.filter?.(p => p.diet_type === 'diabetic')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px;color:#666">${tr('Diabetic Diet', 'حمية سكري')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${patients.filter?.(p => p.diet_type === 'soft')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px;color:#666">${tr('Soft Diet', 'حمية لينة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Diet Order', 'طلب حمية جديد')}</h4>
        <div class="form-group"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="dietPatient" placeholder="${tr('Patient name', 'اسم المريض')}"></div>
        <div class="form-group"><label>${tr('Ward/Room', 'الجناح/الغرفة')}</label><input class="form-input" id="dietRoom" placeholder="${tr('e.g. 3A-201', 'مثال: 3أ-201')}"></div>
        <div class="form-group"><label>${tr('Diet Type', 'نوع الحمية')}</label>
        <select class="form-input" id="dietType">
          <option value="regular">${tr('Regular', 'عادي')}</option>
          <option value="diabetic">${tr('Diabetic', 'سكري')}</option>
          <option value="soft">${tr('Soft', 'لينة')}</option>
          <option value="liquid">${tr('Liquid', 'سائلة')}</option>
          <option value="NPO">${tr('NPO (Nothing by mouth)', 'صائم')}</option>
          <option value="low_sodium">${tr('Low Sodium', 'قليل الملح')}</option>
          <option value="renal">${tr('Renal', 'كلوية')}</option>
          <option value="gluten_free">${tr('Gluten Free', 'خالي جلوتين')}</option>
        </select></div>
        <div class="form-group"><label>${tr('Allergies/Notes', 'حساسية/ملاحظات')}</label><textarea class="form-input" id="dietNotes" rows="2"></textarea></div>
        <div class="form-group"><label>${tr('Meal Time', 'وقت الوجبة')}</label>
        <select class="form-input" id="dietMeal"><option value="breakfast">${tr('Breakfast', 'فطور')}</option><option value="lunch">${tr('Lunch', 'غداء')}</option><option value="dinner">${tr('Dinner', 'عشاء')}</option><option value="all">${tr('All Meals', 'كل الوجبات')}</option></select></div>
        <button class="btn btn-primary w-full" onclick="saveDietOrder()">💾 ${tr('Save Order', 'حفظ الطلب')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Active Diet Orders', 'طلبات الحمية النشطة')}</h4>
        <div id="dietOrdersList"></div>
      </div>
    </div>`;

  const list = document.getElementById('dietOrdersList');
  if (list && patients.length > 0) {
    list.innerHTML = patients.map(p => '<div style="padding:10px;margin:6px 0;background:#f8f9fa;border-radius:8px;border-right:4px solid ' + (p.diet_type === 'NPO' ? '#cc0000' : p.diet_type === 'diabetic' ? '#ff9800' : '#4caf50') + '"><strong>' + (p.patient_name || '') + '</strong> - ' + (p.room || '') + '<br><span style="font-size:13px;color:#666">' + (p.diet_type || '') + ' | ' + (p.meal_time || '') + '</span></div>').join('');
  } else if (list) { list.innerHTML = '<p style="color:#999;text-align:center">' + tr('No active orders', 'لا توجد طلبات') + '</p>'; }

  window.saveDietOrder = async () => {
    try {
      await API.post('/api/dietary/orders', { patient_name: document.getElementById('dietPatient')?.value, room: document.getElementById('dietRoom')?.value, diet_type: document.getElementById('dietType')?.value, meal_time: document.getElementById('dietMeal')?.value, notes: document.getElementById('dietNotes')?.value });
      showToast(tr('Diet order saved!', 'تم حفظ طلب الحمية!'));
      renderDietary(content);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}
window.addDietOrder = async function () {
  const s = document.getElementById('dietPatient'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  const dt = document.getElementById('dietType');
  try { await API.post('/api/dietary/orders', { admission_id: s.value, patient_id: s.options[s.selectedIndex].dataset.pid, patient_name: s.options[s.selectedIndex].dataset.name, diet_type: dt.value, diet_type_ar: dt.options[dt.selectedIndex].dataset.ar, texture: document.getElementById('dietTexture').value, allergies: document.getElementById('dietAllergies').value, ordered_by: currentUser?.display_name }); showToast(tr('Diet ordered!', 'تم طلب الحمية!')); await navigateTo(25); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== INFECTION CONTROL =====
let icTab = 'surveillance';
async function renderInfectionControl(el) {
  const content = el;

  const reports = await API.get('/api/infection-control/reports').catch(() => []);
  const active = reports.filter(r => r.status === 'active').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  // Group by infection type
  const byType = {};
  reports.forEach(r => { const t = r.infection_type || 'Other'; byType[t] = (byType[t] || 0) + 1; });

  content.innerHTML = `
    <h2>${tr('Infection Control', 'مكافحة العدوى')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#fce4ec"><h3 style="margin:0;color:#c62828">${reports.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Reports', 'إجمالي البلاغات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${active}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Active Cases', 'حالات نشطة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${resolved}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Resolved', 'محلولة')}</p></div>
    </div>
    ${Object.keys(byType).length > 0 ? '<div class="card" style="padding:16px;margin-bottom:16px"><h4 style="margin:0 0 8px">' + tr('By Infection Type', 'حسب نوع العدوى') + '</h4><div style="display:flex;gap:8px;flex-wrap:wrap">' + Object.entries(byType).map(([t, c]) => '<span style="padding:4px 12px;border-radius:16px;background:#fce4ec;font-size:12px">' + t + ': <strong>' + c + '</strong></span>').join('') + '</div></div>' : ''}
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Report Infection', 'إبلاغ عن عدوى')}</h4>
        <div class="form-group"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="icPatient"></div>
        <div class="form-group"><label>${tr('Infection Type', 'نوع العدوى')}</label>
          <select class="form-input" id="icType">
            <option value="MRSA">MRSA</option><option value="VRE">VRE</option><option value="C.diff">C. difficile</option>
            <option value="ESBL">ESBL</option><option value="TB">TB</option><option value="COVID-19">COVID-19</option>
            <option value="Influenza">Influenza</option><option value="UTI">UTI</option><option value="SSI">SSI</option>
            <option value="Other">${tr('Other', 'أخرى')}</option>
          </select></div>
        <div class="form-group"><label>${tr('Ward', 'الجناح')}</label><input class="form-input" id="icWard"></div>
        <div class="form-group"><label>${tr('Isolation Type', 'نوع العزل')}</label>
          <select class="form-input" id="icIsolation"><option value="none">${tr('None', 'بدون')}</option><option value="contact">${tr('Contact', 'تلامسي')}</option><option value="droplet">${tr('Droplet', 'رذاذي')}</option><option value="airborne">${tr('Airborne', 'هوائي')}</option><option value="protective">${tr('Protective', 'وقائي')}</option></select></div>
        <div class="form-group"><label>${tr('Culture Results', 'نتائج الزراعة')}</label><textarea class="form-input" id="icCulture" rows="2"></textarea></div>
        <div class="form-group"><label>${tr('Action Taken', 'الإجراء المتخذ')}</label><textarea class="form-input" id="icAction" rows="2"></textarea></div>
        <button class="btn btn-primary w-full" onclick="saveIcReport()">🦠 ${tr('Submit Report', 'تقديم البلاغ')}</button>
      </div>
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <h4 style="margin:0">${tr('Reports', 'البلاغات')}</h4>
          <button class="btn btn-sm" onclick="exportToCSV(reports,'infection_control')" style="background:#e0f7fa;color:#00838f">📥</button>
        </div>
        <div id="icTable"></div>
      </div>
    </div>`;

  const ict = document.getElementById('icTable');
  if (ict) {
    createTable(ict, 'icTbl',
      [tr('Patient', 'المريض'), tr('Type', 'النوع'), tr('Ward', 'الجناح'), tr('Isolation', 'العزل'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', '')],
      reports.map(r => ({ cells: [r.patient_name, r.infection_type, r.ward || '', r.isolation_type || '', statusBadge(r.status), r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '', r.status === 'active' ? '<button class="btn btn-sm" onclick="resolveIc(' + r.id + ')">✅</button>' : '✅'], id: r.id }))
    );
  }
  window.saveIcReport = async () => { try { await API.post('/api/infection-control/reports', { patient_name: document.getElementById('icPatient').value, infection_type: document.getElementById('icType').value, ward: document.getElementById('icWard').value, isolation_type: document.getElementById('icIsolation').value, culture_results: document.getElementById('icCulture').value, action_taken: document.getElementById('icAction').value }); showToast(tr('Report submitted!', 'تم تقديم البلاغ!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };
  window.resolveIc = async (id) => { try { await API.put('/api/infection-control/reports/' + id, { status: 'resolved' }); showToast('✅'); navigateTo(currentPage); } catch (e) { } };

}
window.reportInfection = async function () {
  try { await API.post('/api/infection/surveillance', { patient_name: document.getElementById('icPatient').value, infection_type: document.getElementById('icType').value, organism: document.getElementById('icOrganism').value, ward: document.getElementById('icWard').value, hai_category: document.getElementById('icHAI').value, isolation_type: document.getElementById('icIsolation').value, reported_by: currentUser?.display_name }); showToast(tr('Reported!', 'تم التسجيل!')); await navigateTo(26); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addHHAudit = async function () {
  try { await API.post('/api/infection/hand-hygiene', { department: document.getElementById('hhDept').value, moments_observed: document.getElementById('hhObs').value, moments_compliant: document.getElementById('hhComp').value, auditor: currentUser?.display_name }); showToast(tr('Recorded!', 'تم التسجيل!')); await navigateTo(26); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== QUALITY =====
let qTab = 'incidents';
async function renderQuality(el) {
  const content = el;

  const [incidents, surveys, kpis] = await Promise.all([
    API.get('/api/quality/incidents').catch(() => []),
    API.get('/api/quality/surveys').catch(() => []),
    API.get('/api/quality/kpis').catch(() => [])
  ]);
  const avgSat = surveys.length ? (surveys.reduce((s, x) => s + (x.rating || 0), 0) / surveys.length).toFixed(1) : '5.0';

  content.innerHTML = `
    <h2>${tr('Quality & Safety', 'الجودة والسلامة')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#fce4ec"><h3 style="margin:0;color:#c62828">${incidents.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Incidents', 'حوادث')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${avgSat} / 5</h3><p style="margin:4px 0 0;font-size:12px">${tr('Avg Satisfaction', 'متوسط الرضا')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff8e1"><h3 style="margin:0;color:#f57f17">${surveys.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Surveys', 'استبيانات المرضى')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${kpis.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Active KPIs', 'مؤشرات نشطة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Report Incident', 'إبلاغ عن حادث')}</h4>
        <div class="form-group"><label>${tr('Type', 'النوع')}</label>
          <select class="form-input" id="qiType"><option value="medication_error">${tr('Medication Error', 'خطأ دوائي')}</option><option value="fall">${tr('Patient Fall', 'سقوط مريض')}</option><option value="infection">${tr('Infection', 'عدوى')}</option><option value="equipment">${tr('Equipment', 'أجهزة')}</option><option value="complaint">${tr('Complaint', 'شكوى')}</option><option value="other">${tr('Other', 'أخرى')}</option></select></div>
        <div class="form-group"><label>${tr('Severity', 'الخطورة')}</label>
          <select class="form-input" id="qiSeverity"><option value="low">🟢 ${tr('Low', 'منخفضة')}</option><option value="medium">🟡 ${tr('Medium', 'متوسطة')}</option><option value="high">🔴 ${tr('High', 'عالية')}</option><option value="critical">⚫ ${tr('Critical', 'حرجة')}</option></select></div>
        <div class="form-group"><label>${tr('Department', 'القسم')}</label><input class="form-input" id="qiDept"></div>
        <div class="form-group"><label>${tr('Description', 'الوصف')}</label><textarea class="form-input" id="qiDesc" rows="3"></textarea></div>
        <button class="btn btn-primary w-full" onclick="saveQIncident()">📋 ${tr('Submit', 'تقديم')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Recent Incidents', 'الحوادث الأخيرة')}</h4>
        <div id="qiTable"></div>
      </div>
    </div>
    <div class="card" style="padding:20px;margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h4 style="margin:0">${tr('Patient Surveys', 'استبيانات المرضى')}</h4>
            <button class="btn btn-primary" onclick="showAddSurveyModal()">+ ${tr('Add Survey', 'إضافة استبيان')}</button>
        </div>
        <div id="surveyTable"></div>
    </div>`;

  const qit = document.getElementById('qiTable');
  if (qit) {
    createTable(qit, 'qiTbl',
      [tr('Type', 'النوع'), tr('Severity', 'الخطورة'), tr('Dept', 'القسم'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')],
      incidents.map(i => ({ cells: [i.type || i.incident_type || '', '<span style="padding:2px 8px;border-radius:4px;font-size:11px;background:' + (i.severity === 'critical' ? '#212121' : i.severity === 'high' ? '#c62828' : i.severity === 'medium' ? '#e65100' : '#2e7d32') + ';color:#fff">' + (i.severity || '') + '</span>', i.department || '', statusBadge(i.status), i.created_at ? new Date(i.created_at).toLocaleDateString('ar-SA') : ''], id: i.id }))
    );
  }
  
  const svt = document.getElementById('surveyTable');
  if (svt) {
    createTable(svt, 'svTbl',
      [tr('Patient ID', 'رقم المريض'), tr('Department', 'القسم'), tr('Rating', 'التقييم'), tr('Feedback', 'التعليق'), tr('Date', 'التاريخ')],
      surveys.map(s => ({ cells: [s.patient_id || '-', s.department || '-', '⭐'.repeat(s.rating || 5), s.feedback || '-', s.created_at ? new Date(s.created_at).toLocaleDateString('ar-SA') : '-'], id: s.id }))
    );
  }

  window.saveQIncident = async () => { try { await API.post('/api/quality/incidents', { incident_type: document.getElementById('qiType').value, severity: document.getElementById('qiSeverity').value, department: document.getElementById('qiDept').value, description: document.getElementById('qiDesc').value }); showToast(tr('Incident reported!', 'تم الإبلاغ!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };

  window.showAddSurveyModal = () => {
      const html = '<div class="form-group"><label>' + tr('Patient ID', 'رقم المريض') + '</label><input type="number" id="psPatient" class="form-input"></div>' +
                   '<div class="form-group"><label>' + tr('Department', 'القسم') + '</label><input id="psDept" class="form-input"></div>' +
                   '<div class="form-group"><label>' + tr('Rating (1-5)', 'التقييم') + '</label><input type="number" min="1" max="5" value="5" id="psRating" class="form-input"></div>' +
                   '<div class="form-group"><label>' + tr('Feedback', 'التعليق') + '</label><textarea id="psFeedback" class="form-input" rows="2"></textarea></div>' +
                   '<button class="btn btn-primary w-full" onclick="saveSurvey()">💾 ' + tr('Save', 'حفظ') + '</button>';
      showModal(tr('Add Survey', 'إضافة استبيان'), html);
  };
  window.saveSurvey = async () => {
      try {
          await API.post('/api/quality/surveys', { patient_id: document.getElementById('psPatient').value, department: document.getElementById('psDept').value, rating: document.getElementById('psRating').value, feedback: document.getElementById('psFeedback').value });
          showToast(tr('Survey Added!', 'تمت إضافة الاستبيان!'));
          document.querySelector('.modal-overlay')?.remove(); navigateTo(currentPage);
      } catch(e) { showToast('Error', 'error'); }
  };
}
window.reportIncident = async function () {
  try { await API.post('/api/quality/incidents', { incident_type: document.getElementById('qiType').value, severity: document.getElementById('qiSeverity').value, department: document.getElementById('qiDept').value, description: document.getElementById('qiDesc').value, immediate_action: document.getElementById('qiAction').value, reported_by: currentUser?.display_name }); showToast(tr('Reported!', 'تم التسجيل!')); await navigateTo(27); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.closeIncident = async function (id) {
  try { await API.put('/api/quality/incidents/' + id, { status: 'Closed' }); showToast(tr('Closed!', 'تم الإغلاق!')); await navigateTo(27); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addKPI = async function () {
  try { await API.post('/api/quality/kpis', { kpi_name: document.getElementById('kpiName').value, target_value: document.getElementById('kpiTarget').value, actual_value: document.getElementById('kpiActual').value, period: document.getElementById('kpiPeriod').value }); showToast(tr('Added!', 'تمت الإضافة!')); await navigateTo(27); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== MAINTENANCE =====
let mtTab = 'orders';
async function renderMaintenance(el) {
  const content = el;

  const orders = await API.get('/api/maintenance/orders').catch(() => []);
  const pending = orders.filter(o => o.status === 'pending').length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;

  content.innerHTML = `
    <h2>${tr('Maintenance', 'الصيانة')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${orders.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Orders', 'إجمالي الطلبات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${pending}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Pending', 'بانتظار')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${inProgress}</h3><p style="margin:4px 0 0;font-size:12px">${tr('In Progress', 'قيد التنفيذ')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Work Order', 'طلب صيانة جديد')}</h4>
        <div class="form-group"><label>${tr('Equipment', 'الجهاز/المعدة')}</label><input class="form-input" id="mntEquip"></div>
        <div class="form-group"><label>${tr('Location', 'الموقع')}</label><input class="form-input" id="mntLoc"></div>
        <div class="form-group"><label>${tr('Type', 'النوع')}</label>
          <select class="form-input" id="mntType"><option value="corrective">${tr('Corrective', 'تصحيحية')}</option><option value="preventive">${tr('Preventive', 'وقائية')}</option><option value="emergency">${tr('Emergency', 'طارئة')}</option><option value="calibration">${tr('Calibration', 'معايرة')}</option></select></div>
        <div class="form-group"><label>${tr('Priority', 'الأولوية')}</label>
          <select class="form-input" id="mntPriority"><option value="low">${tr('Low', 'منخفضة')}</option><option value="medium">${tr('Medium', 'متوسطة')}</option><option value="high">${tr('High', 'عالية')}</option><option value="urgent">${tr('Urgent', 'عاجلة')}</option></select></div>
        <div class="form-group"><label>${tr('Description', 'الوصف')}</label><textarea class="form-input" id="mntDesc" rows="2"></textarea></div>
        <button class="btn btn-primary w-full" onclick="saveMntOrder()">🔧 ${tr('Submit', 'تقديم')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Work Orders', 'طلبات الصيانة')}</h4>
        <div id="mntTable"></div>
      </div>
    </div>`;

  const mt = document.getElementById('mntTable');
  if (mt) {
    createTable(mt, 'mntTbl',
      [tr('Equipment', 'الجهاز'), tr('Location', 'الموقع'), tr('Type', 'النوع'), tr('Priority', 'الأولوية'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', '')],
      orders.map(o => ({ cells: [o.equipment, o.location || '', o.maintenance_type || '', '<span style="padding:2px 8px;border-radius:4px;font-size:11px;background:' + (o.priority === 'urgent' ? '#c62828' : o.priority === 'high' ? '#e65100' : '#1565c0') + ';color:#fff">' + (o.priority || '') + '</span>', statusBadge(o.status), o.created_at ? new Date(o.created_at).toLocaleDateString('ar-SA') : '', o.status !== 'completed' ? '<button class="btn btn-sm" onclick="completeMnt(' + o.id + ')">✅</button>' : ''], id: o.id }))
    );
  }
  window.saveMntOrder = async () => { try { await API.post('/api/maintenance/orders', { equipment: document.getElementById('mntEquip').value, location: document.getElementById('mntLoc').value, maintenance_type: document.getElementById('mntType').value, priority: document.getElementById('mntPriority').value, description: document.getElementById('mntDesc').value, requested_by: window.currentUser?.display_name || '' }); showToast(tr('Order submitted!', 'تم تقديم الطلب!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); } };
  window.completeMnt = async (id) => { try { await API.put('/api/maintenance/orders/' + id, { status: 'completed' }); showToast('✅'); navigateTo(currentPage); } catch (e) { } };

}
window.addWorkOrder = async function () {
  try { await API.post('/api/maintenance/work-orders', { request_type: document.getElementById('woType').value, priority: document.getElementById('woPriority').value, department: document.getElementById('woDept').value, location: document.getElementById('woLocation').value, description: document.getElementById('woDesc').value, requested_by: currentUser?.display_name }); showToast(tr('Created!', 'تم الإنشاء!')); await navigateTo(28); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.completeWO = async function (id) {
  try { await API.put('/api/maintenance/work-orders/' + id, { status: 'Completed' }); showToast(tr('Completed!', 'اكتمل!')); await navigateTo(28); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.addEquipment = async function () {
  try { await API.post('/api/maintenance/equipment', { equipment_name: document.getElementById('eqName').value, equipment_name_ar: document.getElementById('eqNameAr').value, category: document.getElementById('eqCat').value, manufacturer: document.getElementById('eqMfg').value, serial_number: document.getElementById('eqSerial').value, department: document.getElementById('eqDept').value }); showToast(tr('Added!', 'تمت الإضافة!')); await navigateTo(28); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== TRANSPORT =====
async function renderTransport(el) {
  const content = el;

  const requests = await API.get('/api/transport/requests').catch(() => []);
  content.innerHTML = `
    <h2>${tr('Transport', 'النقل')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${requests.filter?.(r => r.status === 'pending')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Pending', 'بانتظار')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${requests.filter?.(r => r.status === 'in_transit')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('In Transit', 'في الطريق')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${requests.filter?.(r => r.status === 'completed')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Completed', 'مكتمل')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Request', 'طلب جديد')}</h4>
        <div class="form-group"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="trPatient"></div>
        <div class="form-group"><label>${tr('From', 'من')}</label><input class="form-input" id="trFrom" placeholder="${tr('e.g. Ward 3A', 'مثال: جناح 3أ')}"></div>
        <div class="form-group"><label>${tr('To', 'إلى')}</label><input class="form-input" id="trTo" placeholder="${tr('e.g. Radiology', 'مثال: الأشعة')}"></div>
        <div class="form-group"><label>${tr('Type', 'النوع')}</label>
        <select class="form-input" id="trType"><option value="wheelchair">${tr('Wheelchair', 'كرسي متحرك')}</option><option value="stretcher">${tr('Stretcher', 'نقالة')}</option><option value="ambulance">${tr('Ambulance', 'إسعاف')}</option><option value="walking">${tr('Walking Escort', 'مرافقة')}</option></select></div>
        <div class="form-group"><label>${tr('Priority', 'الأولوية')}</label>
        <select class="form-input" id="trPriority"><option value="routine">${tr('Routine', 'عادي')}</option><option value="urgent">${tr('Urgent', 'مستعجل')}</option><option value="emergency">${tr('Emergency', 'طوارئ')}</option></select></div>
        <div class="form-group"><label>${tr('Notes', 'ملاحظات')}</label><input class="form-input" id="trNotes"></div>
        <button class="btn btn-primary w-full" onclick="saveTransportReq()">📤 ${tr('Submit', 'إرسال')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Active Requests', 'الطلبات النشطة')}</h4>
        <div id="trList">${requests.filter(r => r.status !== 'completed').map(r => '<div style="padding:10px;margin:6px 0;background:#f8f9fa;border-radius:8px;border-right:4px solid ' + (r.status === 'in_transit' ? '#1565c0' : '#ff9800') + ';display:flex;justify-content:space-between;align-items:center"><div><strong>' + (r.patient_name || '') + '</strong><br><span style="font-size:12px;color:#666">' + (r.from_location || '') + ' → ' + (r.to_location || '') + ' | ' + (r.transport_type || '') + '</span></div><button class="btn btn-sm" onclick="updateTransport(' + r.id + ',\'completed\')" style="background:#e8f5e9;color:#2e7d32">✅</button></div>').join('') || '<p style="color:#999;text-align:center">' + tr('No active requests', 'لا توجد طلبات') + '</p>'}</div>
      </div>
    </div>`;

  window.saveTransportReq = async () => {
    try { await API.post('/api/transport/requests', { patient_name: document.getElementById('trPatient')?.value, from_location: document.getElementById('trFrom')?.value, to_location: document.getElementById('trTo')?.value, transport_type: document.getElementById('trType')?.value, priority: document.getElementById('trPriority')?.value, notes: document.getElementById('trNotes')?.value, status: 'pending' }); showToast(tr('Request submitted', 'تم إرسال الطلب')); renderTransport(content); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };
  window.updateTransport = async (id, status) => {
    try { await API.put('/api/transport/requests/' + id, { status }); showToast(tr('Updated', 'تم التحديث')); renderTransport(content); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}
window.addTransport = async function () {
  const s = document.getElementById('trPatient'); if (!s.value) return showToast(tr('Select patient', 'اختر المريض'), 'error');
  try { await API.post('/api/transport/requests', { patient_id: s.value, patient_name: s.options[s.selectedIndex].dataset.name, from_location: document.getElementById('trFrom').value, to_location: document.getElementById('trTo').value, transport_type: document.getElementById('trType').value, priority: document.getElementById('trPriority').value, special_needs: document.getElementById('trNeeds').value, requested_by: currentUser?.display_name }); showToast(tr('Requested!', 'تم الطلب!')); await navigateTo(29); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};
window.completeTransport = async function (id) {
  try { await API.put('/api/transport/requests/' + id, { status: 'Completed', dropoff_time: new Date().toISOString() }); showToast(tr('Done!', 'تم!')); await navigateTo(29); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
};

// ===== MEDICAL RECORDS / HIM =====
let mrTab = 'requests';
async function renderMedicalRecords(el) {
  const content = el;

  const patients = await API.get('/api/patients').catch(() => []);

  content.innerHTML = `
    <h2>${tr('Medical Records', 'السجلات الطبية')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${patients.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Records', 'إجمالي السجلات')}</p></div>
    </div>
    <div class="card" style="padding:20px;margin-bottom:16px">
      <h4 style="margin:0 0 12px">🔍 ${tr('Search Medical Records', 'بحث في السجلات الطبية')}</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end">
        <div class="form-group"><label>${tr('Name', 'الاسم')}</label><input class="form-input" id="mrSearchName" oninput="filterMedRecords()"></div>
        <div class="form-group"><label>${tr('MRN / File #', 'رقم الملف')}</label><input class="form-input" id="mrSearchMRN" oninput="filterMedRecords()"></div>
        <div class="form-group"><label>${tr('ID / Iqama', 'الهوية/الإقامة')}</label><input class="form-input" id="mrSearchID" oninput="filterMedRecords()"></div>
        <button class="btn btn-primary" onclick="filterMedRecords()">🔍</button>
      </div>
    </div>
    <div class="card" style="padding:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <h4 style="margin:0">${tr('Patient Records', 'سجلات المرضى')}</h4>
        <button class="btn btn-sm" onclick="exportToCSV(window._mrData||[],'medical_records')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
      </div>
      <div id="mrTable"></div>
    </div>`;

  window._mrData = patients;
  const mrt = document.getElementById('mrTable');
  if (mrt) {
    createTable(mrt, 'mrTbl',
      [tr('File #', 'رقم الملف'), tr('Name (AR)', 'الاسم بالعربي'), tr('Name (EN)', 'الاسم بالإنجليزي'), tr('ID', 'الهوية'), tr('Phone', 'الجوال'), tr('DOB', 'تاريخ الميلاد'), tr('Nationality', 'الجنسية'), tr('Actions', '')],
      patients.slice(0, 100).map(p => ({ cells: [p.file_number || p.id, p.name_ar || '', p.name_en || '', p.id_number || '', p.phone || '', p.dob || '', p.nationality || '', '<button class="btn btn-sm" onclick="viewPatientRecord(' + p.id + ')">📂 ' + tr('View', 'عرض') + '</button>'], id: p.id }))
    );
  }
  window.filterMedRecords = () => { const n = (document.getElementById('mrSearchName')?.value || '').toLowerCase(); const mrn = (document.getElementById('mrSearchMRN')?.value || ''); const sid = (document.getElementById('mrSearchID')?.value || ''); document.querySelectorAll('#mrTbl tbody tr').forEach(r => { const t = r.textContent.toLowerCase(); r.style.display = (t.includes(n) && (!mrn || t.includes(mrn)) && (!sid || t.includes(sid))) ? '' : 'none'; }); };
  window.viewPatientRecord = async (id) => { try { const visits = await API.get('/api/visits?patient_id=' + id).catch(() => []); const p = patients.find(x => x.id === id) || {}; const modal = document.createElement('div'); modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center'; modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:700px;max-height:85vh;overflow:auto"><h3 style="margin:0 0 16px">📂 ' + (p.name_ar || p.name_en || '') + '</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:13px"><div><strong>' + tr('File', 'ملف') + ':</strong> ' + (p.file_number || p.id) + '</div><div><strong>' + tr('ID', 'الهوية') + ':</strong> ' + (p.id_number || '') + '</div><div><strong>' + tr('Phone', 'الجوال') + ':</strong> ' + (p.phone || '') + '</div><div><strong>' + tr('DOB', 'الميلاد') + ':</strong> ' + (p.dob || '') + '</div></div><h4>' + tr('Visit History', 'سجل الزيارات') + ' (' + visits.length + ')</h4>' + (visits.length ? visits.map(v => '<div style="padding:8px;margin:4px 0;background:#f5f5f5;border-radius:8px"><strong>' + (v.visit_date || v.created_at ? new Date(v.visit_date || v.created_at).toLocaleDateString('ar-SA') : '') + '</strong> — ' + (v.diagnosis || v.complaint || tr('No details', 'بدون تفاصيل')) + '</div>').join('') : '<p style="color:#999">' + tr('No visits', 'لا توجد زيارات') + '</p>') + '<button class="btn btn-secondary w-full" onclick="this.parentElement.parentElement.remove()" style="margin-top:16px">' + tr('Close', 'إغلاق') + '</button></div>'; document.body.appendChild(modal); modal.onclick = e => { if (e.target === modal) modal.remove(); }; } catch (e) { } };

}
window.submitMRRequest = async function () {
  const sel = document.getElementById('mrPatient');
  const patient_id = sel.value;
  const file_number = sel.options[sel.selectedIndex].dataset.fn;
  await API.post('/api/medical-records/requests', { patient_id, file_number, department: document.getElementById('mrDept').value, purpose: document.getElementById('mrPurpose').value, notes: document.getElementById('mrNotes').value });
  showToast(tr('Request submitted', 'تم الطلب')); mrTab = 'requests'; navigateTo(30);
};
window.updateMRRequest = async function (id, status) {
  await API.put('/api/medical-records/requests/' + id, { status });
  showToast(tr('Updated', 'تم التحديث')); navigateTo(30);
};

// ===== CLINICAL PHARMACY =====
let cpTab = 'reviews';
async function renderClinicalPharmacy(el) {
  const content = el;

  const prescriptions = await API.get('/api/pharmacy/prescriptions').catch(() => []);
  const pending = prescriptions.filter(p => p.status === 'pending').length;

  const interactions = [
    { drug1: 'Warfarin', drug2: 'Aspirin', severity: 'high', effect: tr('Increased bleeding risk', 'زيادة خطر النزيف') },
    { drug1: 'ACE Inhibitors', drug2: 'Potassium', severity: 'high', effect: tr('Hyperkalemia risk', 'خطر فرط البوتاسيوم') },
    { drug1: 'Metformin', drug2: 'Contrast Dye', severity: 'moderate', effect: tr('Lactic acidosis risk', 'خطر الحموضة اللبنية') },
    { drug1: 'SSRIs', drug2: 'MAOIs', severity: 'high', effect: tr('Serotonin syndrome', 'متلازمة السيروتونين') },
    { drug1: 'Statins', drug2: 'Macrolides', severity: 'moderate', effect: tr('Rhabdomyolysis risk', 'خطر انحلال العضلات') },
    { drug1: 'NSAIDs', drug2: 'Anticoagulants', severity: 'high', effect: tr('GI bleeding', 'نزيف هضمي') },
    { drug1: 'Digoxin', drug2: 'Amiodarone', severity: 'high', effect: tr('Digoxin toxicity', 'سمية الديجوكسين') },
    { drug1: 'Ciprofloxacin', drug2: 'Theophylline', severity: 'moderate', effect: tr('Theophylline toxicity', 'سمية الثيوفيلين') },
  ];

  content.innerHTML = `
    <h2>${tr('Clinical Pharmacy', 'الصيدلة الإكلينيكية')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${prescriptions.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Prescriptions', 'إجمالي الوصفات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${pending}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Pending Review', 'بانتظار المراجعة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fce4ec"><h3 style="margin:0;color:#c62828">${interactions.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Known Interactions', 'تداخلات معروفة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">🔍 ${tr('Drug Interaction Checker', 'فحص تداخل الأدوية')}</h4>
        <div class="form-group"><label>${tr('Drug 1', 'الدواء 1')}</label><input class="form-input" id="cpDrug1" placeholder="${tr('e.g. Warfarin', 'مثال: وارفارين')}"></div>
        <div class="form-group"><label>${tr('Drug 2', 'الدواء 2')}</label><input class="form-input" id="cpDrug2" placeholder="${tr('e.g. Aspirin', 'مثال: أسبرين')}"></div>
        <button class="btn btn-primary w-full" onclick="checkInteraction()">🔍 ${tr('Check Interaction', 'فحص التداخل')}</button>
        <div id="cpResult" style="margin-top:12px"></div>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">⚠️ ${tr('Known Drug Interactions', 'التداخلات الدوائية المعروفة')}</h4>
        <div style="max-height:300px;overflow-y:auto">${interactions.map(i => '<div style="padding:8px;margin:4px 0;border-radius:8px;background:' + (i.severity === 'high' ? '#fce4ec' : '#fff3e0') + '"><strong>' + i.drug1 + ' + ' + i.drug2 + '</strong><br><span style="font-size:12px;color:#666">' + i.effect + '</span><span style="float:left;font-size:11px;padding:2px 6px;border-radius:4px;background:' + (i.severity === 'high' ? '#c62828' : '#e65100') + ';color:#fff">' + i.severity + '</span></div>').join('')}</div>
      </div>
    </div>
    <div class="card" style="padding:20px;margin-top:16px">
      <h4 style="margin:0 0 12px">${tr('Recent Prescriptions for Review', 'وصفات بانتظار المراجعة')}</h4>
      <div id="cpTable"></div>
    </div>`;

  const cpt = document.getElementById('cpTable');
  if (cpt && prescriptions.length) {
    createTable(cpt, 'cpTbl',
      [tr('Patient', 'المريض'), tr('Medication', 'الدواء'), tr('Dosage', 'الجرعة'), tr('Doctor', 'الطبيب'), tr('Status', 'الحالة'), tr('Date', 'التاريخ')],
      prescriptions.slice(0, 20).map(p => ({ cells: [p.patient_name || '', p.medication || p.drug_name || '', p.dosage || '', p.doctor || '', statusBadge(p.status), p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SA') : ''], id: p.id }))
    );
  }

  window.checkInteraction = () => {
    const d1 = (document.getElementById('cpDrug1')?.value || '').toLowerCase();
    const d2 = (document.getElementById('cpDrug2')?.value || '').toLowerCase();
    const res = document.getElementById('cpResult');
    if (!d1 || !d2) { res.innerHTML = '<p style="color:#666">' + tr('Enter both drugs', 'أدخل الدوائين') + '</p>'; return; }
    const found = interactions.find(i => (i.drug1.toLowerCase().includes(d1) && i.drug2.toLowerCase().includes(d2)) || (i.drug1.toLowerCase().includes(d2) && i.drug2.toLowerCase().includes(d1)));
    if (found) { res.innerHTML = '<div style="padding:12px;background:#fce4ec;border-radius:8px;border-left:4px solid #c62828"><strong>⚠️ ' + tr('INTERACTION FOUND', 'تم اكتشاف تداخل') + '</strong><br>' + found.effect + '<br><span style="color:#c62828;font-weight:bold">' + tr('Severity', 'الخطورة') + ': ' + found.severity.toUpperCase() + '</span></div>'; }
    else { res.innerHTML = '<div style="padding:12px;background:#e8f5e9;border-radius:8px;border-left:4px solid #2e7d32"><strong>✅ ' + tr('No known interaction', 'لا يوجد تداخل معروف') + '</strong></div>'; }
  };

}
window.submitCPReview = async function () {
  const sel = document.getElementById('cpPatient');
  const patient_name = sel.options[sel.selectedIndex].dataset.name;
  await API.post('/api/clinical-pharmacy/reviews', { patient_id: sel.value, patient_name, review_type: document.getElementById('cpType').value, severity: document.getElementById('cpSeverity').value, findings: document.getElementById('cpFindings').value, recommendations: document.getElementById('cpRecs').value });
  showToast(tr('Review submitted', 'تم الإرسال')); cpTab = 'reviews'; navigateTo(31);
};
window.resolveCPReview = async function (id) {
  await API.put('/api/clinical-pharmacy/reviews/' + id, { outcome: 'Resolved', status: 'Closed' });
  showToast(tr('Resolved', 'تم الحل')); navigateTo(31);
};

// ===== REHABILITATION / PT =====
let rehabTab = 'patients';
async function renderRehabilitation(el) {
  const [rehabPatients, sessions, allPatients] = await Promise.all([
    API.get('/api/rehab/patients').catch(() => []),
    API.get('/api/rehab/sessions').catch(() => []),
    API.get('/api/patients').catch(() => [])
  ]);
  const active = rehabPatients.filter(r => r.status === 'Active').length;
  el.innerHTML = `
    <div class="page-title">🏋️ ${tr('Rehabilitation / Physical Therapy', 'إعادة التأهيل / العلاج الطبيعي')}</div>
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card" style="--stat-color:#3b82f6"><span class="stat-icon">👥</span><div class="stat-label">${tr('Active Patients', 'مرضى نشطين')}</div><div class="stat-value">${active}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><span class="stat-icon">📅</span><div class="stat-label">${tr('Total Sessions', 'إجمالي الجلسات')}</div><div class="stat-value">${sessions.length}</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><span class="stat-icon">🏥</span><div class="stat-label">${tr('Total Patients', 'إجمالي المرضى')}</div><div class="stat-value">${rehabPatients.length}</div></div>
      <div class="stat-card" style="--stat-color:#a78bfa"><span class="stat-icon">✅</span><div class="stat-label">${tr('Discharged', 'خرجوا')}</div><div class="stat-value">${rehabPatients.filter(r => r.status === 'Discharged').length}</div></div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn ${rehabTab === 'patients' ? 'active' : ''}" onclick="rehabTab='patients';navigateTo(32)">👥 ${tr('Patients', 'المرضى')}</button>
      <button class="tab-btn ${rehabTab === 'new' ? 'active' : ''}" onclick="rehabTab='new';navigateTo(32)">➕ ${tr('New Referral', 'تحويل جديد')}</button>
      <button class="tab-btn ${rehabTab === 'sessions' ? 'active' : ''}" onclick="rehabTab='sessions';navigateTo(32)">📅 ${tr('Sessions', 'الجلسات')}</button>
    </div>
    <div class="card" id="rehabContent"></div>`;
  const mc = document.getElementById('rehabContent');
  if (rehabTab === 'patients') {
    mc.innerHTML = rehabPatients.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Diagnosis', 'التشخيص'), tr('Therapy', 'العلاج'), tr('Therapist', 'المعالج'), tr('Status', 'الحالة'), tr('Sessions', 'الجلسات')],
      rehabPatients.map(r => ({
        cells: [r.patient_name, r.diagnosis, r.therapy_type, r.therapist, statusBadge(r.status),
        `<button class="btn btn-sm" onclick="viewRehabSessions(${r.id})">📋 ${tr('View', 'عرض')}</button>`
        ]
      }))
    ) : `<div class="empty-state"><span style="font-size:48px">🏋️</span><p>${tr('No rehab patients', 'لا يوجد مرضى تأهيل')}</p></div>`;
  } else if (rehabTab === 'new') {
    const therapyTypes = ['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Cardiac Rehab', 'Pulmonary Rehab', 'Neurological Rehab'];
    mc.innerHTML = `<h3>➕ ${tr('New Rehabilitation Referral', 'تحويل تأهيل جديد')}</h3>
    <div class="form-grid">
      <div><label>${tr('Patient', 'المريض')}</label><select id="rehabPatient" class="form-input">${allPatients.map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.file_number} - ${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Therapy Type', 'نوع العلاج')}</label><select id="rehabType" class="form-input">${therapyTypes.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div><label>${tr('Therapist', 'المعالج')}</label><input id="rehabTherapist" class="form-input"></div>
      <div><label>${tr('Referral Source', 'مصدر التحويل')}</label><input id="rehabSource" class="form-input" placeholder="${tr('Dr. Name / Dept', 'اسم الطبيب / القسم')}"></div>
      <div style="grid-column:1/-1"><label>${tr('Diagnosis', 'التشخيص')}</label><input id="rehabDiag" class="form-input"></div>
      <div style="grid-column:1/-1"><label>${tr('Notes', 'ملاحظات')}</label><textarea id="rehabNotes" class="form-input" rows="3"></textarea></div>
    </div>
    <button class="btn btn-primary" onclick="submitRehab()" style="margin-top:8px">🏋️ ${tr('Add Patient', 'إضافة مريض')}</button>`;
  } else {
    mc.innerHTML = sessions.length ? makeTable(
      [tr('Session#', 'جلسة#'), tr('Date', 'التاريخ'), tr('Therapist', 'المعالج'), tr('Duration', 'المدة'), tr('Pain Before', 'ألم قبل'), tr('Pain After', 'ألم بعد'), tr('Notes', 'ملاحظات')],
      sessions.map(s => ({
        cells: [s.session_number, s.session_date, s.therapist, s.duration_minutes + ' ' + tr('min', 'د'),
        `<span style="color:${s.pain_before > 5 ? '#ef4444' : '#22c55e'}">${s.pain_before}/10</span>`,
        `<span style="color:${s.pain_after > 5 ? '#ef4444' : '#22c55e'}">${s.pain_after}/10</span>`,
        s.progress_notes?.substring(0, 50) || '-'
        ]
      }))
    ) : `<div class="empty-state"><p>${tr('No sessions', 'لا توجد جلسات')}</p></div>`;
  }
}
window.submitRehab = async function () {
  const sel = document.getElementById('rehabPatient');
  const patient_name = sel.options[sel.selectedIndex].dataset.name;
  await API.post('/api/rehab/patients', { patient_id: sel.value, patient_name, diagnosis: document.getElementById('rehabDiag').value, referral_source: document.getElementById('rehabSource').value, therapist: document.getElementById('rehabTherapist').value, therapy_type: document.getElementById('rehabType').value, notes: document.getElementById('rehabNotes').value });
  showToast(tr('Patient added', 'تمت الإضافة')); rehabTab = 'patients'; navigateTo(32);
};
window.viewRehabSessions = async function (id) {
  rehabTab = 'sessions'; navigateTo(32);
};

// ===== PATIENT PORTAL =====
async function renderPatientPortal(el) {
  const content = el;

  const patients = await API.get('/api/patients').catch(() => []);
  const appointments = await API.get('/api/appointments').catch(() => []);
  const recentCount = patients.filter(p => { const d = new Date(p.created_at); const week = new Date(); week.setDate(week.getDate() - 7); return d > week; }).length;

  content.innerHTML = `
    <h2>${tr('Patient Portal', 'بوابة المريض')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#e3f2fd,#bbdefb);cursor:pointer" onclick="navigateTo(1)">
        <div style="font-size:40px;margin-bottom:8px">🏥</div>
        <h4 style="margin:0">${tr('Registration', 'التسجيل')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${patients.length} ${tr('patients', 'مريض')}</p>
      </div>
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);cursor:pointer" onclick="navigateTo(2)">
        <div style="font-size:40px;margin-bottom:8px">📅</div>
        <h4 style="margin:0">${tr('Appointments', 'المواعيد')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${appointments.length} ${tr('booked', 'محجوز')}</p>
      </div>
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#fce4ec,#f8bbd0);cursor:pointer" onclick="navigateTo(4)">
        <div style="font-size:40px;margin-bottom:8px">🔬</div>
        <h4 style="margin:0">${tr('Lab Results', 'نتائج المختبر')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${tr('View results', 'عرض النتائج')}</p>
      </div>
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#fff3e0,#ffe0b2);cursor:pointer" onclick="navigateTo(5)">
        <div style="font-size:40px;margin-bottom:8px">📡</div>
        <h4 style="margin:0">${tr('Radiology', 'الأشعة')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${tr('View images', 'عرض الصور')}</p>
      </div>
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#e8eaf6,#c5cae9);cursor:pointer" onclick="navigateTo(6)">
        <div style="font-size:40px;margin-bottom:8px">💊</div>
        <h4 style="margin:0">${tr('Pharmacy', 'الصيدلية')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${tr('Prescriptions', 'الوصفات')}</p>
      </div>
      <div class="card" style="padding:24px;text-align:center;background:linear-gradient(135deg,#f3e5f5,#ce93d8);cursor:pointer" onclick="navigateTo(8)">
        <div style="font-size:40px;margin-bottom:8px">💰</div>
        <h4 style="margin:0">${tr('Billing', 'الفواتير')}</h4>
        <p style="margin:4px 0 0;font-size:12px;color:#666">${tr('View invoices', 'عرض الفواتير')}</p>
      </div>
    </div>
    <div class="card" style="padding:20px">
      <h4 style="margin:0 0 12px">${tr('Recent Patients', 'المرضى الأخيرون')} (${tr('Last 7 days', 'آخر 7 أيام')})</h4>
      <p style="color:#666">${recentCount} ${tr('new registrations', 'تسجيل جديد')}</p>
    </div>`;

}
window.approvePortalAppt = async function (id) { await API.put('/api/portal/appointments/' + id, { status: 'Approved' }); showToast(tr('Approved', 'تمت الموافقة')); navigateTo(33); };
window.rejectPortalAppt = async function (id) { await API.put('/api/portal/appointments/' + id, { status: 'Rejected' }); showToast(tr('Rejected', 'تم الرفض')); navigateTo(33); };

// ===== ZATCA E-INVOICING =====
let zatcaTab = 'invoices';
async function renderZATCA(el) {
  const content = el;

  const [invoices, settings] = await Promise.all([
    API.get('/api/zatca/invoices').catch(() => []),
    API.get('/api/zatca/settings').catch(() => ({}))
  ]);
  const submitted = invoices.filter(i => i.zatca_status === 'submitted').length;
  const pending = invoices.filter(i => !i.zatca_status || i.zatca_status === 'pending' || i.zatca_status === 'ready').length;
  const hasSettings = !!settings.tax_number;
  const phaseTxt = settings.phase === '2' ? tr('Phase 2', 'المرحلة 2') : tr('Phase 1', 'المرحلة 1');
  let nphiesData = {}, wasfatyData = [], yaqeenData = {};
  try { nphiesData = await API.get('/api/nphies/config').catch(()=>({})); } catch(e){}
  try { wasfatyData = await API.get('/api/wasfaty/prescriptions').catch(()=>[]); } catch(e){}
  try { yaqeenData = await API.get('/api/yaqeen/stats').catch(()=>({})); } catch(e){}
  const rejected = invoices.filter(i => i.zatca_status === 'rejected').length;

  content.innerHTML = `
    <div class="page-title">🇸🇦 ${tr('Saudi Compliance Hub', 'مركز الامتثال السعودي')}</div>

    <!-- Integration Status Bar -->
    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="stat-card" style="--stat-color:#22c55e"><div class="stat-icon">🧾</div><div class="stat-label">ZATCA</div>
        <div class="stat-value" style="color:#22c55e;font-size:20px">${hasSettings ? '✅ '+phaseTxt : '❌ '+tr('Not Set','غير مُعدّ')}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><div class="stat-icon">🏥</div><div class="stat-label">NPHIES</div>
        <div class="stat-value" style="color:#3b82f6;font-size:20px">${nphiesData.provider_id ? '✅ '+tr('Connected','متصل') : '⏳ '+tr('Pending','معلق')}</div></div>
      <div class="stat-card" style="--stat-color:#8b5cf6"><div class="stat-icon">💊</div><div class="stat-label">Wasfaty</div>
        <div class="stat-value" style="color:#8b5cf6;font-size:20px">${wasfatyData.length || 0} ${tr('Prescriptions','وصفات')}</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-icon">🪪</div><div class="stat-label">Yaqeen</div>
        <div class="stat-value" style="color:#f59e0b;font-size:20px">${yaqeenData.verified_count || 0} ${tr('Verified','تم التحقق')}</div></div>
    </div>

    <!-- ZATCA Summary -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:28px;font-weight:800;color:#22c55e">${submitted}</div><div style="font-size:12px;color:var(--text-dim)">${tr('Submitted','مرسلة')}</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:28px;font-weight:800;color:#f59e0b">${pending}</div><div style="font-size:12px;color:var(--text-dim)">${tr('Pending','معلقة')}</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:28px;font-weight:800;color:#ef4444">${rejected}</div><div style="font-size:12px;color:var(--text-dim)">${tr('Rejected','مرفوضة')}</div></div>
      <div class="card" style="text-align:center;padding:16px"><div style="font-size:28px;font-weight:800;color:#3b82f6">${invoices.length}</div><div style="font-size:12px;color:var(--text-dim)">${tr('Total','الإجمالي')}</div></div>
    </div>

    <div class="tabs" style="margin-bottom:16px">
      <div class="tab ${zatcaTab==='invoices'?'active':''}" onclick="zatcaTab='invoices';navigateTo(currentPage)">🧾 ${tr('E-Invoices','الفوترة الإلكترونية')}</div>
      <div class="tab ${zatcaTab==='settings'?'active':''}" onclick="zatcaTab='settings';navigateTo(currentPage)">⚙️ ${tr('ZATCA Settings','إعدادات زاتكا')}</div>
      <div class="tab ${zatcaTab==='nphies'?'active':''}" onclick="zatcaTab='nphies';navigateTo(currentPage)">🏥 NPHIES</div>
      <div class="tab ${zatcaTab==='wasfaty'?'active':''}" onclick="zatcaTab='wasfaty';navigateTo(currentPage)">💊 ${tr('Wasfaty','وصفتي')}</div>
      <div class="tab ${zatcaTab==='yaqeen'?'active':''}" onclick="zatcaTab='yaqeen';navigateTo(currentPage)">🪪 ${tr('Yaqeen','يقين')}</div>
    </div>
    <div id="zatcaContent"></div>`;

  const zc = document.getElementById('zatcaContent');

  if (zatcaTab === 'settings') {
    zc.innerHTML = `
    <div class="card" style="padding:24px">
      <h3 style="margin:0 0 16px">⚙️ ${tr('ZATCA Settings', 'إعدادات زاتكا / هيئة الزكاة والضريبة والجمارك')}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>${tr('Seller Name (EN)', 'اسم البائع (إنجليزي)')}</label><input class="form-input" id="zSellerName" value="${settings.seller_name || ''}"></div>
        <div class="form-group"><label>${tr('Seller Name (AR)', 'اسم البائع (عربي)')}</label><input class="form-input" id="zSellerNameAr" value="${settings.seller_name_ar || ''}"></div>
        <div class="form-group"><label>🔢 ${tr('Tax Registration Number (TRN)', 'الرقم الضريبي')}</label><input class="form-input" id="zTaxNumber" value="${settings.tax_number || ''}" placeholder="3XXXXXXXXXX0003" maxlength="15"></div>
        <div class="form-group"><label>${tr('Commercial Registration', 'السجل التجاري')}</label><input class="form-input" id="zCommReg" value="${settings.commercial_reg || ''}"></div>
        <div class="form-group"><label>${tr('Street', 'الشارع')}</label><input class="form-input" id="zStreet" value="${settings.street || ''}"></div>
        <div class="form-group"><label>${tr('Building Number', 'رقم المبنى')}</label><input class="form-input" id="zBldgNum" value="${settings.building_number || ''}"></div>
        <div class="form-group"><label>${tr('District', 'الحي')}</label><input class="form-input" id="zDistrict" value="${settings.district || ''}"></div>
        <div class="form-group"><label>${tr('City', 'المدينة')}</label><input class="form-input" id="zCity" value="${settings.city || ''}"></div>
        <div class="form-group"><label>${tr('Postal Code', 'الرمز البريدي')}</label><input class="form-input" id="zPostal" value="${settings.postal_code || ''}"></div>
        <div class="form-group"><label>${tr('Country', 'الدولة')}</label><input class="form-input" id="zCountry" value="${settings.country_code || 'SA'}" disabled></div>
      </div>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e0e0e0">
      <h4 style="margin:0 0 12px">🔐 ${tr('Phase & Certificates', 'المرحلة والشهادات')}</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>${tr('ZATCA Phase', 'مرحلة زاتكا')}</label>
          <select class="form-input" id="zPhase">
            <option value="1" ${(settings.phase || '1') === '1' ? 'selected' : ''}>${tr('Phase 1 - Simple QR (Tags 1-5)', 'المرحلة 1 - QR بسيط')}</option>
            <option value="2" ${settings.phase === '2' ? 'selected' : ''}>${tr('Phase 2 - Digital Signature (Tags 1-9)', 'المرحلة 2 - توقيع رقمي')}</option>
          </select>
        </div>
        <div class="form-group"><label>${tr('Invoice Type', 'نوع الفاتورة')}</label>
          <select class="form-input" id="zInvType">
            <option value="simplified" ${(settings.invoice_type || 'simplified') === 'simplified' ? 'selected' : ''}>${tr('Simplified (B2C)', 'مبسطة')}</option>
            <option value="standard" ${settings.invoice_type === 'standard' ? 'selected' : ''}>${tr('Standard (B2B)', 'قياسية')}</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1"><label>${tr('Private Key (Base64) - Phase 2 only', 'المفتاح الخاص (Base64) - المرحلة 2 فقط')}</label><textarea class="form-input" id="zPrivKey" rows="3" placeholder="${tr('Paste ECDSA private key in Base64...', 'الصق المفتاح الخاص...')}">${settings.private_key_base64 || ''}</textarea></div>
        <div class="form-group" style="grid-column:1/-1"><label>${tr('Certificate (Base64) - Phase 2 only', 'الشهادة (Base64) - المرحلة 2 فقط')}</label><textarea class="form-input" id="zCert" rows="3" placeholder="${tr('Paste X.509 certificate in Base64...', 'الصق الشهادة...')}">${settings.certificate_base64 || ''}</textarea></div>
      </div>
      <button class="btn btn-primary w-full" onclick="saveZatcaSettings()" style="height:48px;margin-top:12px;font-size:16px">💾 ${tr('Save ZATCA Settings', 'حفظ إعدادات زاتكا')}</button>
    </div>`;
  } else if (zatcaTab === 'nphies') {
    zc.innerHTML = `<div class="card" style="padding:24px">
      <h3 style="margin:0 0 16px">🏥 ${tr('NPHIES — Insurance Verification','نفيس — التحقق التأميني')}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div style="padding:16px;border-radius:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);text-align:center">
          <div style="font-size:24px;font-weight:800;color:#22c55e">✅</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">${tr('Eligible','مؤهل')}</div>
        </div>
        <div style="padding:16px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);text-align:center">
          <div style="font-size:24px;font-weight:800;color:#ef4444">❌</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px">${tr('Rejected','مرفوض')}</div>
        </div>
      </div>
      <div class="form-group mb-12"><label>${tr('Patient ID','رقم المريض')}</label><input class="form-input" id="nphPatient" placeholder="${tr('Enter patient ID or file number','أدخل رقم المريض أو الملف')}"></div>
      <div class="form-group mb-12"><label>${tr('Insurance Provider','شركة التأمين')}</label>
        <select class="form-input" id="nphInsurer"><option>Bupa Arabia</option><option>Tawuniya</option><option>MedGulf</option><option>Al Rajhi Takaful</option><option>AXA Cooperative</option><option>${tr('Other','أخرى')}</option></select>
      </div>
      <div class="form-group mb-12"><label>${tr('Member ID','رقم العضوية')}</label><input class="form-input" id="nphMemberId"></div>
      <button class="btn btn-primary w-full" onclick="checkNPHIES()" style="height:44px">🔍 ${tr('Check Eligibility','تحقق من الأهلية')}</button>
      <div id="nphResult" style="margin-top:16px"></div>
    </div>`;
  } else if (zatcaTab === 'wasfaty') {
    zc.innerHTML = `<div class="card" style="padding:24px">
      <h3 style="margin:0 0 16px">💊 ${tr('Wasfaty — E-Prescriptions','وصفتي — الوصفات الإلكترونية')}</h3>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px">${tr('Track prescriptions sent to the national Wasfaty gateway','تتبع الوصفات المرسلة لبوابة وصفتي الوطنية')}</p>
      ${(wasfatyData||[]).length ? `<table class="data-table"><thead><tr><th>#</th><th>${tr('Patient','المريض')}</th><th>${tr('Medication','الدواء')}</th><th>${tr('Status','الحالة')}</th><th>${tr('Wasfaty ID','معرف وصفتي')}</th><th>${tr('Date','التاريخ')}</th></tr></thead><tbody>
      ${(wasfatyData||[]).map(w => `<tr><td>${w.id||''}</td><td>${escapeHTML(w.patient_name||'')}</td><td>${escapeHTML(w.medication_name||'')}</td>
        <td>${w.status==='dispensed'?badge(tr('Dispensed','تم الصرف'),'success'):w.status==='sent'?badge(tr('Sent','مرسلة'),'info'):badge(tr('Pending','معلقة'),'warning')}</td>
        <td style="font-family:monospace;font-size:11px">${w.wasfaty_id||'-'}</td><td>${w.created_at?new Date(w.created_at).toLocaleDateString('ar-SA'):'-'}</td></tr>`).join('')}
      </tbody></table>` : `<div class="empty-state"><div class="empty-icon">💊</div><p>${tr('No Wasfaty prescriptions yet','لا توجد وصفات في وصفتي بعد')}</p></div>`}
    </div>`;
  } else if (zatcaTab === 'yaqeen') {
    zc.innerHTML = `<div class="card" style="padding:24px">
      <h3 style="margin:0 0 16px">🪪 ${tr('Yaqeen — Identity Verification','يقين — التحقق من الهوية')}</h3>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px">${tr('Verify patient identity through Yaqeen national platform','تحقق من هوية المريض عبر منصة يقين الوطنية')}</p>
      <div class="form-group mb-12"><label>${tr('National ID / Iqama','رقم الهوية / الإقامة')}</label><input class="form-input" id="yqNatId" maxlength="10" placeholder="1XXXXXXXXX"></div>
      <div class="form-group mb-12"><label>${tr('Date of Birth (Hijri)','تاريخ الميلاد (هجري)')}</label><input class="form-input" id="yqDob" placeholder="1410/01/15"></div>
      <button class="btn btn-primary w-full" onclick="verifyYaqeen()" style="height:44px">🔍 ${tr('Verify Identity','تحقق من الهوية')}</button>
      <div id="yqResult" style="margin-top:16px"></div>
    </div>`;
  } else {
    // Invoices tab
    zc.innerHTML = `
    <div class="card" style="padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0">🧾 ${tr('Invoices with ZATCA QR', 'الفواتير مع باركود زاتكا')}</h4>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="bulkSubmitZatca()" style="background:#e8f5e9;color:#2e7d32">📤 ${tr('Submit All Pending', 'إرسال الكل')}</button>
          <button class="btn btn-sm" onclick="exportToCSV(window._zatcaData||[],'zatca_invoices')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
        </div>
      </div>
      ${!hasSettings ? '<div style="padding:12px;background:#fff3e0;border-radius:8px;border-right:4px solid #ff9800;margin-bottom:12px"><strong>⚠️ ' + tr('Please configure ZATCA settings first!', 'يرجى إعداد إعدادات زاتكا أولاً!') + '</strong></div>' : ''}
      <div id="zatcaInvList"></div>
    </div>`;

    window._zatcaData = invoices;
    const invList = document.getElementById('zatcaInvList');
    if (invList && invoices.length) {
      invList.innerHTML = invoices.slice(0, 50).map(inv => `
        <div style="padding:14px;margin:8px 0;background:#f8f9fa;border-radius:12px;border-right:4px solid ${inv.zatca_status === 'submitted' ? '#4caf50' : '#ff9800'};display:flex;align-items:center;gap:16px">
          <div id="qr_${inv.id}" style="min-width:80px;min-height:80px;display:flex;align-items:center;justify-content:center">${inv.qr_base64 ? '' : '<span style="color:#ccc;font-size:40px">📝</span>'}</div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:15px">${inv.invoice_number || 'INV-' + inv.id}</strong>
              <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${inv.zatca_status === 'submitted' ? '#e8f5e9' : '#fff3e0'};color:${inv.zatca_status === 'submitted' ? '#2e7d32' : '#e65100'}">${inv.zatca_status === 'submitted' ? tr('Submitted', 'مرسلة') : tr('Pending', 'بانتظار')}</span>
            </div>
            <div style="font-size:13px;color:#666;margin-top:4px">${inv.patient_name || ''} • ${parseFloat(inv.total || 0).toFixed(2)} SAR • ${tr('VAT', 'ضريبة')}: ${parseFloat(inv.vat_amount || 0).toFixed(2)}</div>
            <div style="font-size:11px;color:#999;margin-top:2px">${inv.created_at ? new Date(inv.created_at).toLocaleString('ar-SA') : ''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-direction:column">
            <button class="btn btn-sm" onclick="printZatcaInvoice(${inv.id})" style="background:#e3f2fd;color:#1565c0;font-size:11px">🖨️ ${tr('Print', 'طباعة')}</button>
            ${inv.zatca_status !== 'submitted' ? '<button class="btn btn-sm" onclick="submitSingleZatca(' + inv.id + ')" style="background:#e8f5e9;color:#2e7d32;font-size:11px">📤 ' + tr('Submit', 'إرسال') + '</button>' : ''}
          </div>
        </div>
      `).join('');

      // Generate QR codes
      setTimeout(() => {
        invoices.slice(0, 50).forEach(inv => {
          if (inv.qr_base64) {
            const qrEl = document.getElementById('qr_' + inv.id);
            if (qrEl && typeof QRCode !== 'undefined') {
              const canvas = document.createElement('canvas');
              QRCode.toCanvas(canvas, inv.qr_base64, { width: 80, margin: 1 }, (err) => {
                if (!err) { qrEl.innerHTML = ''; qrEl.appendChild(canvas); }
              });
            }
          }
        });
      }, 200);
    } else if (invList) {
      invList.innerHTML = '<p style="color:#999;text-align:center;padding:20px">' + tr('No invoices yet', 'لا توجد فواتير بعد') + '</p>';
    }
  }

  // === ZATCA Window Functions ===
  window.saveZatcaSettings = async () => {
    try {
      await API.post('/api/zatca/settings', {
        seller_name: document.getElementById('zSellerName').value,
        seller_name_ar: document.getElementById('zSellerNameAr').value,
        tax_number: document.getElementById('zTaxNumber').value,
        commercial_reg: document.getElementById('zCommReg').value,
        street: document.getElementById('zStreet').value,
        building_number: document.getElementById('zBldgNum').value,
        district: document.getElementById('zDistrict').value,
        city: document.getElementById('zCity').value,
        postal_code: document.getElementById('zPostal').value,
        country_code: 'SA',
        phase: document.getElementById('zPhase').value,
        invoice_type: document.getElementById('zInvType').value,
        private_key_base64: document.getElementById('zPrivKey').value,
        certificate_base64: document.getElementById('zCert').value
      });
      showToast(tr('ZATCA settings saved!', 'تم حفظ إعدادات زاتكا!'));
      zatcaTab = 'invoices';
      navigateTo(currentPage);
    } catch (e) { showToast(tr('Error saving', 'خطأ في الحفظ'), 'error'); }
  };

  window.submitSingleZatca = async (id) => {
    try {
      await API.post('/api/zatca/submit/' + id, {});
      showToast(tr('Submitted to ZATCA!', 'تم الإرسال لزاتكا!'));
      navigateTo(currentPage);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

  window.bulkSubmitZatca = async () => {
    const pendingIds = invoices.filter(i => i.zatca_status !== 'submitted').map(i => i.id);
    if (!pendingIds.length) return showToast(tr('No pending invoices', 'لا توجد فواتير بانتظار'));
    try {
      await API.post('/api/zatca/bulk-submit', { invoice_ids: pendingIds });
      showToast(tr('All invoices submitted!', 'تم إرسال جميع الفواتير!'));
      navigateTo(currentPage);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

  window.printZatcaInvoice = async (id) => {
    try {
      const data = await API.get('/api/zatca/qr/' + id);
      const inv = data.invoice;
      const s = data.settings || settings;
      const sellerName = s.seller_name || settings.seller_name_ar || '';

      // Generate QR image
      let qrDataUrl = '';
      if (data.qr_base64 && typeof QRCode !== 'undefined') {
        qrDataUrl = await QRCode.toDataURL(data.qr_base64, { width: 200, margin: 1 });
      }

      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${tr('Invoice', 'فاتورة')} ${inv.invoice_number || inv.id}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Tajawal',Arial,sans-serif;padding:20px;max-width:400px;margin:0 auto;font-size:14px}
        .header{text-align:center;border-bottom:2px dashed #333;padding-bottom:12px;margin-bottom:12px}
        .header h1{font-size:20px;margin-bottom:4px}
        .header p{font-size:12px;color:#555}
        .line{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #ddd}
        .line.total{border-top:2px solid #333;border-bottom:2px solid #333;font-weight:700;font-size:16px;padding:8px 0;margin-top:8px}
        .qr{text-align:center;margin:16px 0;padding:12px;border:1px dashed #999;border-radius:8px}
        .qr img{max-width:200px}
        .footer{text-align:center;margin-top:12px;font-size:11px;color:#777}
        .phase-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;background:#e3f2fd;color:#1565c0;margin-top:4px}
        @media print{body{max-width:100%;padding:10px}}
      </style></head><body>
        <div class="header">
          <h1>${settings.seller_name_ar || settings.seller_name || 'المركز الطبي'}</h1>
          <p>${settings.seller_name || 'Medical Center'}</p>
          ${settings.tax_number ? '<p>الرقم الضريبي: ' + settings.tax_number + '</p>' : ''}
          ${settings.commercial_reg ? '<p>سجل تجاري: ' + settings.commercial_reg + '</p>' : ''}
          <p>${[settings.street, settings.district, settings.city].filter(Boolean).join(' - ') || ''}</p>
        </div>

        <div style="text-align:center;margin-bottom:12px">
          <strong style="font-size:18px">فاتورة ضريبية${settings.invoice_type === 'simplified' ? ' مبسطة' : ''}</strong><br>
          <span style="font-size:12px">Tax Invoice${settings.invoice_type === 'simplified' ? ' (Simplified)' : ''}</span>
        </div>

        <div class="line"><span>${tr('Invoice #', 'رقم الفاتورة')}</span><span>${inv.invoice_number || 'INV-' + inv.id}</span></div>
        <div class="line"><span>${tr('Date', 'التاريخ')}</span><span>${inv.created_at ? new Date(inv.created_at).toLocaleString('ar-SA') : ''}</span></div>
        <div class="line"><span>${tr('Patient', 'المريض')}</span><span>${inv.patient_name || ''}</span></div>
        <div class="line"><span>${tr('Service', 'الخدمة')}</span><span>${inv.description || inv.service_type || ''}</span></div>
        <div class="line"><span>${tr('Amount (excl. VAT)', 'المبلغ بدون ضريبة')}</span><span>${(parseFloat(inv.total || 0) - parseFloat(inv.vat_amount || 0)).toFixed(2)} SAR</span></div>
        <div class="line"><span>${tr('VAT (15%)', 'ضريبة القيمة المضافة 15%')}</span><span>${parseFloat(inv.vat_amount || 0).toFixed(2)} SAR</span></div>
        <div class="line total"><span>${tr('Total', 'الإجمالي')}</span><span>${parseFloat(inv.total || 0).toFixed(2)} SAR</span></div>
        <div class="line"><span>${tr('Payment', 'الدفع')}</span><span>${inv.payment_method || 'Cash'}</span></div>
        <div class="line"><span>${tr('Status', 'الحالة')}</span><span>${inv.paid ? '✅ ' + tr('Paid', 'مدفوع') : '⏳ ' + tr('Unpaid', 'غير مدفوع')}</span></div>

        <div class="qr">
          ${qrDataUrl ? '<img src="' + qrDataUrl + '" alt="ZATCA QR Code"><br>' : ''}
          <div class="phase-badge">${tr('ZATCA Phase', 'مرحلة زاتكا')} ${data.phase_used || '1'}</div>
          <p style="font-size:10px;color:#999;margin-top:4px">${tr('Scan QR to verify invoice', 'امسح الباركود للتحقق من الفاتورة')}</p>
        </div>

        <div class="footer">
          <p>${settings.seller_name_ar || 'المركز الطبي'} - ${settings.city || ''}</p>
          <p>هذه فاتورة إلكترونية صادرة وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك</p>
          <p>This is an electronic invoice issued per ZATCA regulations</p>
        </div>

        <script>setTimeout(()=>window.print(),500)<\/script>
      </body></html>`);
      win.document.close();
    } catch (e) { showToast(tr('Error printing', 'خطأ في الطباعة'), 'error'); }
  };

  // NPHIES & Yaqeen window functions
  window.checkNPHIES = async function() {
    const pid = document.getElementById('nphPatient')?.value;
    if (!pid) { showToast(tr('Enter patient ID','أدخل رقم المريض'),'error'); return; }
    try {
      const r = await API.post('/api/nphies/eligibility/check', { patient_id: pid, insurer: document.getElementById('nphInsurer')?.value, member_id: document.getElementById('nphMemberId')?.value });
      document.getElementById('nphResult').innerHTML = `<div style="padding:16px;border-radius:12px;background:${r.eligible?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'};border:1px solid ${r.eligible?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'};margin-top:12px">
        <div style="font-weight:700;color:${r.eligible?'#22c55e':'#ef4444'};font-size:16px">${r.eligible?'✅ '+tr('ELIGIBLE','مؤهل'):'❌ '+tr('NOT ELIGIBLE','غير مؤهل')}</div>
        <div style="font-size:12px;margin-top:6px;color:var(--text-dim)">${escapeHTML(r.message||r.details||'')}</div></div>`;
    } catch(e) { document.getElementById('nphResult').innerHTML = `<div style="padding:12px;background:rgba(245,158,11,0.1);border-radius:8px;color:#f59e0b;font-size:13px">⏳ ${tr('NPHIES service unavailable — check configuration','خدمة نفيس غير متاحة — تحقق من الإعدادات')}</div>`; }
  };
  window.verifyYaqeen = async function() {
    const natId = document.getElementById('yqNatId')?.value;
    if (!natId) { showToast(tr('Enter National ID','أدخل رقم الهوية'),'error'); return; }
    try {
      const r = await API.post('/api/yaqeen/verify', { national_id: natId, date_of_birth: document.getElementById('yqDob')?.value });
      document.getElementById('yqResult').innerHTML = `<div style="padding:16px;border-radius:12px;background:${r.verified?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'};border:1px solid ${r.verified?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}">
        <div style="font-weight:700;color:${r.verified?'#22c55e':'#ef4444'};font-size:16px">${r.verified?'✅ '+tr('VERIFIED','تم التحقق'):'❌ '+tr('NOT VERIFIED','لم يتم التحقق')}</div>
        ${r.full_name?`<div style="margin-top:8px;font-size:13px"><strong>${tr('Name','الاسم')}:</strong> ${escapeHTML(r.full_name)}</div>`:''}
        ${r.nationality?`<div style="font-size:13px"><strong>${tr('Nationality','الجنسية')}:</strong> ${escapeHTML(r.nationality)}</div>`:''}
      </div>`;
    } catch(e) { document.getElementById('yqResult').innerHTML = `<div style="padding:12px;background:rgba(245,158,11,0.1);border-radius:8px;color:#f59e0b;font-size:13px">⏳ ${tr('Yaqeen service unavailable','خدمة يقين غير متاحة')}</div>`; }
  };
}

// ===== TELEMEDICINE =====
let teleTab = 'sessions';
async function renderTelemedicine(el) {
  const content = el;

  const sessions = await API.get('/api/telehealth').catch(() => []);
  const active = sessions.filter(s => s.status === 'active' || s.status === 'Active').length;

  content.innerHTML = `
    <h2>${tr('Telemedicine', 'الطب عن بُعد')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${sessions.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Sessions', 'إجمالي الجلسات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${active}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Active Now', 'نشطة الآن')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Schedule Session', 'جدولة جلسة')}</h4>
        <div class="form-group"><label>${tr('Patient ID', 'رقم المريض')}</label><input type="number" class="form-input" id="telePatientId"></div>
        <div class="form-group"><label>${tr('Doctor ID', 'رقم الطبيب')}</label><input type="number" class="form-input" id="teleDoctorId"></div>
        <div class="form-group"><label>${tr('Date & Time', 'التاريخ والوقت')}</label><input type="datetime-local" class="form-input" id="teleDate"></div>
        <div class="form-group"><label>${tr('Meeting Link', 'رابط الاجتماع')}</label><input class="form-input" id="teleLink" placeholder="https://..."></div>
        <div class="form-group"><label>${tr('Notes', 'ملاحظات')}</label><textarea class="form-input" id="teleNotes" rows="2"></textarea></div>
        <button class="btn btn-primary w-full" onclick="saveTeleSession()">📡 ${tr('Schedule', 'جدولة')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Sessions', 'الجلسات')}</h4>
        <div id="teleTable"></div>
      </div>
    </div>`;

  const tt = document.getElementById('teleTable');
  if (tt) {
    createTable(tt, 'teleTbl',
      [tr('Patient ID', 'رقم المريض'), tr('Doctor ID', 'رقم الطبيب'), tr('Date', 'التاريخ'), tr('Link', 'الرابط'), tr('Status', 'الحالة')],
      sessions.map(s => ({ cells: [s.patient_id || '-', s.doctor_id || '-', s.scheduled_time ? new Date(s.scheduled_time).toLocaleString('ar-SA') : '-', s.session_link ? '<a href="' + s.session_link + '" target="_blank" style="color:#1a73e8">🔗 ' + tr('Join', 'انضمام') + '</a>' : '-', statusBadge(s.status || 'Scheduled')], id: s.id }))
    );
  }
  window.saveTeleSession = async () => {
    try { 
        await API.post('/api/telehealth', { patient_id: document.getElementById('telePatientId').value, doctor_id: document.getElementById('teleDoctorId').value, scheduled_time: document.getElementById('teleDate').value, session_link: document.getElementById('teleLink').value, notes: document.getElementById('teleNotes').value }); 
        showToast(tr('Session scheduled!', 'تم جدولة الجلسة!')); 
        navigateTo(currentPage); 
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}
window.scheduleTele = async function () {
  const sel = document.getElementById('telePatient');
  await API.post('/api/telemedicine/sessions', { patient_id: sel.value, patient_name: sel.options[sel.selectedIndex].dataset.name, session_type: document.getElementById('teleType').value, scheduled_date: document.getElementById('teleDate').value, scheduled_time: document.getElementById('teleTime').value, duration_minutes: document.getElementById('teleDur').value });
  showToast(tr('Session scheduled', 'تمت الجدولة')); teleTab = 'sessions'; navigateTo(35);
};

// ===== PATHOLOGY =====
async function renderPathology(el) {
  const content = el;

  const [specimens, labOrders] = await Promise.all([
    API.get('/api/pathology/specimens').catch(() => []),
    API.get('/api/lab/orders').catch(() => [])
  ]);
  const pending = specimens.filter(s => s.status === 'received').length;
  const processing = specimens.filter(s => s.status === 'processing').length;
  const completed = specimens.filter(s => s.status === 'completed').length;

  content.innerHTML = `
    <h2>${tr('Pathology', 'علم الأمراض')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${specimens.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Specimens', 'إجمالي العينات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fce4ec"><h3 style="margin:0;color:#c62828">${pending}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Received', 'مستلمة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${processing}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Processing', 'قيد المعالجة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${completed}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Completed', 'مكتملة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Register Specimen', 'تسجيل عينة')}</h4>
        <div class="form-group"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="pathPatient" placeholder="${tr('Patient Name', 'اسم المريض')}"></div>
        <div class="form-group"><label>${tr('Specimen Type', 'نوع العينة')}</label>
          <select class="form-input" id="pathType">
            <option value="biopsy">${tr('Biopsy', 'خزعة')}</option>
            <option value="cytology">${tr('Cytology', 'خلوية')}</option>
            <option value="surgical">${tr('Surgical', 'جراحية')}</option>
            <option value="autopsy">${tr('Autopsy', 'تشريح')}</option>
            <option value="frozen">${tr('Frozen Section', 'مقطع مجمد')}</option>
          </select></div>
        <div class="form-group"><label>${tr('Site', 'الموقع')}</label><input class="form-input" id="pathSite"></div>
        <div class="form-group"><label>${tr('Doctor', 'الطبيب')}</label><input class="form-input" id="pathDoctor"></div>
        <div class="form-group"><label>${tr('Clinical Details', 'التفاصيل السريرية')}</label><textarea class="form-input" id="pathDetails" rows="2"></textarea></div>
        <div class="form-group"><label>${tr('Priority', 'الأولوية')}</label>
          <select class="form-input" id="pathPriority">
            <option value="routine">${tr('Routine', 'عادي')}</option>
            <option value="urgent">${tr('Urgent', 'عاجل')}</option>
            <option value="stat">${tr('STAT', 'فوري')}</option>
          </select></div>
        <button class="btn btn-primary w-full" onclick="savePathSpecimen()">💾 ${tr('Register', 'تسجيل')}</button>
      </div>
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h4 style="margin:0">${tr('Specimen List', 'قائمة العينات')}</h4>
          <div style="display:flex;gap:8px">
            <input class="form-input" id="pathSearch" placeholder="${tr('Search...', 'بحث...')}" style="width:200px" oninput="filterPathTable()">
            <button class="btn btn-sm" onclick="exportToCSV(window._pathData||[],'pathology')" style="background:#e0f7fa;color:#00838f">📥</button>
          </div>
        </div>
        <div id="pathTable"></div>
      </div>
    </div>`;

  window._pathData = specimens;
  const pt = document.getElementById('pathTable');
  if (pt) {
    createTable(pt, 'pathTbl',
      [tr('Patient', 'المريض'), tr('Type', 'النوع'), tr('Site', 'الموقع'), tr('Doctor', 'الطبيب'), tr('Priority', 'الأولوية'), tr('Status', 'الحالة'), tr('Date', 'التاريخ'), tr('Actions', 'إجراءات')],
      specimens.map(s => ({
        cells: [s.patient_name, s.specimen_type, s.site || '', s.doctor || '',
        '<span style="padding:2px 8px;border-radius:4px;font-size:11px;background:' + (s.priority === 'stat' ? '#fce4ec' : s.priority === 'urgent' ? '#fff3e0' : '#e8f5e9') + '">' + (s.priority || 'routine') + '</span>',
        statusBadge(s.status), s.created_at ? new Date(s.created_at).toLocaleDateString('ar-SA') : '',
        s.status !== 'completed' ? '<button class="btn btn-sm" onclick="updatePathStatus(' + s.id + ')">✅ ' + tr('Complete', 'إكمال') + '</button>' : '✅'], id: s.id
      }))
    );
  }

  window.savePathSpecimen = async () => {
    try {
      await API.post('/api/pathology/specimens', { patient_name: document.getElementById('pathPatient').value, specimen_type: document.getElementById('pathType').value, site: document.getElementById('pathSite').value, doctor: document.getElementById('pathDoctor').value, clinical_details: document.getElementById('pathDetails').value, priority: document.getElementById('pathPriority').value });
      showToast(tr('Specimen registered!', 'تم تسجيل العينة!'));
      navigateTo(currentPage);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };
  window.updatePathStatus = async (id) => {
    try { await API.put('/api/pathology/specimens/' + id, { status: 'completed' }); showToast('✅'); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };
  window.filterPathTable = () => { const t = (document.getElementById('pathSearch')?.value || '').toLowerCase(); document.querySelectorAll('#pathTbl tbody tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(t) ? '' : 'none'); };

}

// ===== SOCIAL WORK =====
async function renderSocialWork(el) {
  const content = el;

  const cases = await API.get('/api/social-work/cases').catch(() => []);
  content.innerHTML = `
    <h2>${tr('Social Work', 'الخدمة الاجتماعية')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0">${cases.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Total Cases', 'إجمالي الحالات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0">${cases.filter?.(c => c.status === 'open')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Open', 'مفتوحة')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0">${cases.filter?.(c => c.status === 'resolved')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px">${tr('Resolved', 'تم حلها')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('New Case', 'حالة جديدة')}</h4>
        <div class="form-group"><label>${tr('Patient', 'المريض')}</label><input class="form-input" id="swPatient"></div>
        <div class="form-group"><label>${tr('Case Type', 'نوع الحالة')}</label>
        <select class="form-input" id="swType"><option value="financial">${tr('Financial Assistance', 'مساعدة مالية')}</option><option value="abuse">${tr('Abuse/Neglect', 'إساءة/إهمال')}</option><option value="discharge_planning">${tr('Discharge Planning', 'تخطيط الخروج')}</option><option value="counseling">${tr('Counseling', 'إرشاد')}</option><option value="legal">${tr('Legal Issues', 'قضايا قانونية')}</option><option value="housing">${tr('Housing', 'إسكان')}</option></select></div>
        <div class="form-group"><label>${tr('Priority', 'الأولوية')}</label>
        <select class="form-input" id="swPriority"><option value="low">${tr('Low', 'منخفضة')}</option><option value="medium" selected>${tr('Medium', 'متوسطة')}</option><option value="high">${tr('High', 'عالية')}</option><option value="urgent">${tr('Urgent', 'عاجلة')}</option></select></div>
        <div class="form-group"><label>${tr('Description', 'الوصف')}</label><textarea class="form-input" id="swDesc" rows="3"></textarea></div>
        <div class="form-group"><label>${tr('Assigned To', 'مسؤول الحالة')}</label><input class="form-input" id="swAssigned"></div>
        <button class="btn btn-primary w-full" onclick="saveSWCase()">💾 ${tr('Create Case', 'إنشاء حالة')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Cases', 'الحالات')}</h4>
        <div id="swList"></div>
      </div>
    </div>`;

  const sl = document.getElementById('swList');
  if (sl) { sl.innerHTML = cases.length ? cases.map(c => '<div style="padding:10px;margin:6px 0;background:#f8f9fa;border-radius:8px;border-right:4px solid ' + (c.status === 'resolved' ? '#4caf50' : c.priority === 'urgent' ? '#cc0000' : '#ff9800') + '"><strong>' + (c.patient_name || '') + '</strong> - ' + (c.case_type || '') + '<br><span style="font-size:12px;color:#666">' + (c.status || '') + ' | ' + (c.priority || '') + (c.assigned_to ? ' | ' + c.assigned_to : '') + '</span></div>').join('') : '<p style="color:#999;text-align:center">' + tr('No cases', 'لا توجد حالات') + '</p>'; }

  window.saveSWCase = async () => {
    try {
      await API.post('/api/social-work/cases', { patient_name: document.getElementById('swPatient')?.value, case_type: document.getElementById('swType')?.value, priority: document.getElementById('swPriority')?.value, description: document.getElementById('swDesc')?.value, assigned_to: document.getElementById('swAssigned')?.value, status: 'open' });
      showToast(tr('Case created', 'تم إنشاء الحالة'));
      renderSocialWork(content);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}

// ===== MORTUARY =====
async function renderMortuary(el) {
  const content = el;

  const cases = await API.get('/api/mortuary/cases').catch(() => []);
  content.innerHTML = `
    <h2>${tr('Mortuary', 'المشرحة')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#f3e5f5"><h3 style="margin:0">${cases.length || 0}</h3><p style="margin:4px 0 0;font-size:13px;color:#666">${tr('Total Cases', 'إجمالي الحالات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0">${cases.filter?.(c => c.status === 'pending')?.length || 0}</h3><p style="margin:4px 0 0;font-size:13px;color:#666">${tr('Pending Release', 'بانتظار التسليم')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Register Case', 'تسجيل حالة')}</h4>
        <div class="form-group"><label>${tr('Deceased Name', 'اسم المتوفى')}</label><input class="form-input" id="mortName"></div>
        <div class="form-group"><label>${tr('National ID', 'الهوية')}</label><input class="form-input" id="mortID"></div>
        <div class="form-group"><label>${tr('Date/Time of Death', 'تاريخ ووقت الوفاة')}</label><input type="datetime-local" class="form-input" id="mortDate"></div>
        <div class="form-group"><label>${tr('Cause of Death', 'سبب الوفاة')}</label><input class="form-input" id="mortCause"></div>
        <div class="form-group"><label>${tr('Attending Doctor', 'الطبيب المعالج')}</label><input class="form-input" id="mortDoctor"></div>
        <div class="form-group"><label>${tr('Next of Kin', 'أقرب الأقارب')}</label><input class="form-input" id="mortKin"></div>
        <div class="form-group"><label>${tr('Contact Phone', 'هاتف التواصل')}</label><input class="form-input" id="mortPhone"></div>
        <div class="form-group"><label>${tr('Storage Location', 'مكان التخزين')}</label><input class="form-input" id="mortLoc" placeholder="e.g. Unit-3"></div>
        <button class="btn btn-primary w-full" onclick="saveMortuaryCase()">💾 ${tr('Register', 'تسجيل')}</button>
      </div>
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Cases', 'الحالات')}</h4>
        <div id="mortList"></div>
      </div>
    </div>`;

  const ml = document.getElementById('mortList');
  if (ml) { ml.innerHTML = cases.length ? cases.map(c => '<div style="padding:10px;margin:6px 0;background:#f8f9fa;border-radius:8px;border-right:4px solid ' + (c.status === 'released' ? '#4caf50' : '#ff9800') + '"><strong>' + (c.name || '') + '</strong><br><span style="font-size:12px;color:#666">' + (c.cause_of_death || '') + ' | ' + (c.status || '') + '</span></div>').join('') : '<p style="color:#999;text-align:center">' + tr('No cases', 'لا توجد حالات') + '</p>'; }

  window.saveMortuaryCase = async () => {
    try {
      await API.post('/api/mortuary/cases', { name: document.getElementById('mortName')?.value, national_id: document.getElementById('mortID')?.value, death_datetime: document.getElementById('mortDate')?.value, cause_of_death: document.getElementById('mortCause')?.value, doctor: document.getElementById('mortDoctor')?.value, next_of_kin: document.getElementById('mortKin')?.value, contact_phone: document.getElementById('mortPhone')?.value, storage_location: document.getElementById('mortLoc')?.value, status: 'pending' });
      showToast(tr('Case registered', 'تم تسجيل الحالة'));
      renderMortuary(content);
    } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}

// ===== CME (Continuing Medical Education) =====
let cmeTab = 'activities';
async function renderCME(el) {
  const content = el;

  const events = await API.get('/api/cme/events').catch(() => []);
  const totalHours = events.reduce((s, e) => s + parseFloat(e.cme_hours || 0), 0);
  const upcoming = events.filter(e => e.status === 'upcoming').length;

  content.innerHTML = `
    <h2>${tr('CME - Continuing Medical Education', 'التعليم الطبي المستمر')}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      <div class="card" style="padding:16px;text-align:center;background:#e3f2fd"><h3 style="margin:0;color:#1565c0">${events.length}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Total Events', 'إجمالي الفعاليات')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#e8f5e9"><h3 style="margin:0;color:#2e7d32">${totalHours.toFixed(1)}</h3><p style="margin:4px 0 0;font-size:12px">${tr('CME Hours', 'ساعات CME')}</p></div>
      <div class="card" style="padding:16px;text-align:center;background:#fff3e0"><h3 style="margin:0;color:#e65100">${upcoming}</h3><p style="margin:4px 0 0;font-size:12px">${tr('Upcoming', 'قادمة')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px">
      <div class="card" style="padding:20px">
        <h4 style="margin:0 0 12px">${tr('Add Event', 'إضافة فعالية')}</h4>
        <div class="form-group"><label>${tr('Title', 'العنوان')}</label><input class="form-input" id="cmeTitle"></div>
        <div class="form-group"><label>${tr('Speaker', 'المتحدث')}</label><input class="form-input" id="cmeSpeaker"></div>
        <div class="form-group"><label>${tr('Date', 'التاريخ')}</label><input type="date" class="form-input" id="cmeDate"></div>
        <div class="form-group"><label>${tr('CME Hours', 'ساعات CME')}</label><input type="number" class="form-input" id="cmeHours" min="0.5" step="0.5" value="1"></div>
        <div class="form-group"><label>${tr('Category', 'الفئة')}</label>
          <select class="form-input" id="cmeCat"><option value="lecture">${tr('Lecture', 'محاضرة')}</option><option value="workshop">${tr('Workshop', 'ورشة عمل')}</option><option value="conference">${tr('Conference', 'مؤتمر')}</option><option value="online">${tr('Online', 'عن بُعد')}</option></select></div>
        <div class="form-group"><label>${tr('Department', 'القسم')}</label><input class="form-input" id="cmeDept"></div>
        <button class="btn btn-primary w-full" onclick="saveCmeEvent()">💾 ${tr('Save', 'حفظ')}</button>
      </div>
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <h4 style="margin:0">${tr('Events', 'الفعاليات')}</h4>
          <button class="btn btn-sm" onclick="exportToCSV(window._cmeData||[],'cme')" style="background:#e0f7fa;color:#00838f">📥 ${tr('Export', 'تصدير')}</button>
        </div>
        <div id="cmeTable"></div>
      </div>
    </div>`;

  window._cmeData = events;
  const et = document.getElementById('cmeTable');
  if (et) {
    createTable(et, 'cmeTbl',
      [tr('Title', 'العنوان'), tr('Speaker', 'المتحدث'), tr('Date', 'التاريخ'), tr('Hours', 'ساعات'), tr('Category', 'الفئة'), tr('Status', 'الحالة')],
      events.map(e => ({ cells: [e.title, e.speaker || '', e.event_date ? new Date(e.event_date).toLocaleDateString('ar-SA') : '', e.cme_hours || 0, e.category || '', statusBadge(e.status)], id: e.id }))
    );
  }
  window.saveCmeEvent = async () => {
    try { await API.post('/api/cme/events', { title: document.getElementById('cmeTitle').value, speaker: document.getElementById('cmeSpeaker').value, event_date: document.getElementById('cmeDate').value, cme_hours: document.getElementById('cmeHours').value, category: document.getElementById('cmeCat').value, department: document.getElementById('cmeDept').value }); showToast(tr('Event added!', 'تمت إضافة الفعالية!')); navigateTo(currentPage); } catch (e) { showToast(tr('Error', 'خطأ'), 'error'); }
  };

}
window.addCME = async function () {
  await API.post('/api/cme/activities', { title: document.getElementById('cmeTitle').value, category: document.getElementById('cmeCat').value, credit_hours: document.getElementById('cmeHours').value, activity_date: document.getElementById('cmeDate').value, location: document.getElementById('cmeLoc').value });
  showToast(tr('Activity added', 'تمت الإضافة')); cmeTab = 'activities'; navigateTo(40);
};

// ===== COSMETIC / PLASTIC SURGERY =====
let cosTab = 'procedures';
async function renderCosmeticSurgery(el) {
  const [procedures, cases, consents, followups, patients] = await Promise.all([
    API.get('/api/cosmetic/procedures').catch(() => []),
    API.get('/api/cosmetic/cases').catch(() => []),
    API.get('/api/cosmetic/consents').catch(() => []),
    API.get('/api/cosmetic/followups').catch(() => []),
    API.get('/api/patients').catch(() => [])
  ]);
  const scheduled = cases.filter(c => c.status === 'Scheduled').length;
  const completed = cases.filter(c => c.status === 'Completed').length;
  const revenue = cases.reduce((s, c) => s + Number(c.total_cost || 0), 0);
  const catIcons = { Face: '👤', Body: '💪', 'Non-Surgical': '💉', Laser: '✨', Hair: '💇' };
  el.innerHTML = `
    <div class="page-title">💎 ${tr('Cosmetic & Plastic Surgery', 'جراحة التجميل والجراحة التقويمية')}</div>
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card" style="--stat-color:#ec4899"><span class="stat-icon">💎</span><div class="stat-label">${tr('Procedures', 'الإجراءات')}</div><div class="stat-value">${procedures.length}</div></div>
      <div class="stat-card" style="--stat-color:#f59e0b"><span class="stat-icon">📅</span><div class="stat-label">${tr('Scheduled', 'مجدولة')}</div><div class="stat-value">${scheduled}</div></div>
      <div class="stat-card" style="--stat-color:#4ade80"><span class="stat-icon">✅</span><div class="stat-label">${tr('Completed', 'مكتملة')}</div><div class="stat-value">${completed}</div></div>
      <div class="stat-card" style="--stat-color:#3b82f6"><span class="stat-icon">📋</span><div class="stat-label">${tr('Consents', 'إقرارات')}</div><div class="stat-value">${consents.length}</div></div>
      <div class="stat-card" style="--stat-color:#a78bfa"><span class="stat-icon">💰</span><div class="stat-label">${tr('Revenue', 'الإيرادات')}</div><div class="stat-value">${revenue.toLocaleString()}</div></div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn ${cosTab === 'procedures' ? 'active' : ''}" onclick="cosTab='procedures';navigateTo(41)">📋 ${tr('Procedures', 'الإجراءات')}</button>
      <button class="tab-btn ${cosTab === 'cases' ? 'active' : ''}" onclick="cosTab='cases';navigateTo(41)">🏥 ${tr('Cases', 'الحالات')}</button>
      <button class="tab-btn ${cosTab === 'newcase' ? 'active' : ''}" onclick="cosTab='newcase';navigateTo(41)">➕ ${tr('New Case', 'حالة جديدة')}</button>
      <button class="tab-btn ${cosTab === 'consents' ? 'active' : ''}" onclick="cosTab='consents';navigateTo(41)">📜 ${tr('Consents', 'الإقرارات')}</button>
      <button class="tab-btn ${cosTab === 'newconsent' ? 'active' : ''}" onclick="cosTab='newconsent';navigateTo(41)">✍️ ${tr('New Consent', 'إقرار جديد')}</button>
      <button class="tab-btn ${cosTab === 'followups' ? 'active' : ''}" onclick="cosTab='followups';navigateTo(41)">🩺 ${tr('Follow-ups', 'المتابعات')}</button>
    </div>
    <div id="cosContent"></div>`;
  const mc = document.getElementById('cosContent');

  if (cosTab === 'procedures') {
    // Group by category
    const cats = {};
    procedures.forEach(p => { if (!cats[p.category]) cats[p.category] = []; cats[p.category].push(p); });
    mc.innerHTML = Object.entries(cats).map(([cat, procs]) => `
      <div class="card mb-16">
        <div class="card-title">${catIcons[cat] || '💎'} ${cat}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${procs.map(p => `
            <div style="border:1px solid var(--border-color,#e5e7eb);border-radius:12px;padding:14px;background:var(--card-bg)">
              <div style="font-weight:700;font-size:15px;margin-bottom:6px">${isArabic ? p.name_ar : p.name_en}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${p.description?.substring(0, 80) || ''}</div>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;font-size:11px">
                <span>⏱️ ${p.estimated_duration} ${tr('min', 'د')}</span>
                <span>💉 ${p.anesthesia_type}</span>
                <span>💰 ${Number(p.average_cost).toLocaleString()} SAR</span>
                <span>🔄 ${p.recovery_days} ${tr('days', 'يوم')}</span>
              </div>
              <div style="margin-top:8px;font-size:11px;color:#ef4444">⚠️ ${p.risks?.substring(0, 60) || ''}...</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } else if (cosTab === 'cases') {
    mc.innerHTML = `<div class="card">${cases.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Procedure', 'الإجراء'), tr('Surgeon', 'الجراح'), tr('Date', 'التاريخ'), tr('Cost', 'التكلفة'), tr('Payment', 'الدفع'), tr('Status', 'الحالة'), tr('Actions', 'إجراءات')],
      cases.map(c => ({
        cells: [c.patient_name, c.procedure_name, c.surgeon, c.surgery_date, Number(c.total_cost).toLocaleString() + ' SAR',
        c.payment_status === 'Paid' ? '<span class="badge badge-success">' + tr('Paid', 'مدفوع') + '</span>' : '<span class="badge badge-danger">' + tr('Pending', 'معلق') + '</span>',
        statusBadge(c.status),
        c.status === 'Scheduled' ? `<button class="btn btn-sm btn-success" onclick="completeCosCase(${c.id})">✅ ${tr('Complete', 'إكمال')}</button>` : ''
        ]
      }))
    ) : `<div class="empty-state"><span style="font-size:48px">💎</span><p>${tr('No cases yet', 'لا توجد حالات بعد')}</p></div>`}</div>`;
  } else if (cosTab === 'newcase') {
    mc.innerHTML = `<div class="card"><h3>➕ ${tr('Schedule New Cosmetic Case', 'جدولة حالة تجميل جديدة')}</h3>
    <div class="form-grid">
      <div><label>${tr('Patient', 'المريض')}</label><select id="cosPatient" class="form-input">${patients.map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.file_number} - ${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Procedure', 'الإجراء')}</label><select id="cosProc" class="form-input" onchange="updateCosFields()">${procedures.map(p => `<option value="${p.id}" data-name="${isArabic ? p.name_ar : p.name_en}" data-cost="${p.average_cost}" data-anes="${p.anesthesia_type}" data-dur="${p.estimated_duration}">${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Date', 'التاريخ')}</label><input id="cosSurgDate" type="date" class="form-input"></div>
      <div><label>${tr('Time', 'الوقت')}</label><input id="cosSurgTime" type="time" class="form-input"></div>
      <div><label>${tr('Anesthesia', 'التخدير')}</label><select id="cosAnes" class="form-input"><option>Local</option><option>General</option><option>Sedation</option><option>None</option></select></div>
      <div><label>${tr('Operating Room', 'غرفة العمليات')}</label><input id="cosOR" class="form-input" placeholder="${tr('OR-1', 'غ.ع-1')}"></div>
      <div><label>${tr('Cost (SAR)', 'التكلفة')}</label><input id="cosCost" type="number" class="form-input"></div>
      <div style="grid-column:1/-1"><label>${tr('Pre-Op Notes', 'ملاحظات ما قبل العملية')}</label><textarea id="cosPreNotes" class="form-input" rows="2"></textarea></div>
    </div>
    <button class="btn btn-primary" onclick="saveCosCase()" style="margin-top:10px;width:100%;height:44px">💎 ${tr('Schedule Case', 'جدولة الحالة')}</button></div>`;
    // Auto-fill fields from selected procedure
    setTimeout(() => {
      const sel = document.getElementById('cosProc');
      if (sel && sel.options.length) {
        const opt = sel.options[sel.selectedIndex];
        document.getElementById('cosCost').value = opt.dataset.cost || '';
        document.getElementById('cosAnes').value = opt.dataset.anes || 'Local';
      }
    }, 100);
  } else if (cosTab === 'consents') {
    mc.innerHTML = `<div class="card">${consents.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Procedure', 'الإجراء'), tr('Type', 'النوع'), tr('Surgeon', 'الجراح'), tr('Date', 'التاريخ'), tr('📷', 'تصوير'), tr('💉', 'تخدير'), tr('🩸', 'نقل دم'), tr('Status', 'الحالة'), tr('Actions', 'إجراءات')],
      consents.map(c => ({
        cells: [c.patient_name, c.procedure_name, c.consent_type, c.surgeon, c.consent_date,
        c.is_photography_consent ? '✅' : '❌', c.is_anesthesia_consent ? '✅' : '❌', c.is_blood_transfusion_consent ? '✅' : '❌',
        statusBadge(c.status),
        `<button class="btn btn-sm" onclick="printCosConsent(${c.id})">🖨️ ${tr('Print', 'طباعة')}</button>`
        ]
      }))
    ) : `<div class="empty-state"><span style="font-size:48px">📜</span><p>${tr('No consents', 'لا توجد إقرارات')}</p></div>`}</div>`;
  } else if (cosTab === 'newconsent') {
    mc.innerHTML = `<div class="card"><h3>✍️ ${tr('New Consent Form', 'نموذج إقرار جديد')}</h3>
    <div class="form-grid">
      <div><label>${tr('Patient', 'المريض')}</label><select id="conPatient" class="form-input">${patients.map(p => `<option value="${p.id}" data-name="${p.name_ar || p.name_en}">${p.file_number} - ${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Procedure', 'الإجراء')}</label><select id="conProc" class="form-input" onchange="fillConsentRisks()">${procedures.map(p => `<option value="${p.id}" data-name="${isArabic ? p.name_ar : p.name_en}" data-risks="${p.risks}" data-desc="${p.description}">${isArabic ? p.name_ar : p.name_en}</option>`).join('')}</select></div>
      <div><label>${tr('Consent Type', 'نوع الإقرار')}</label><select id="conType" class="form-input"><option value="Surgery">${tr('Surgery Consent', 'إقرار جراحة')}</option><option value="Non-Surgical">${tr('Non-Surgical', 'غير جراحي')}</option><option value="Anesthesia">${tr('Anesthesia', 'تخدير')}</option></select></div>
      <div><label>${tr('Witness', 'الشاهد')}</label><input id="conWitness" class="form-input"></div>
      <div style="grid-column:1/-1"><label>⚠️ ${tr('Risks Explained', 'المخاطر الموضّحة')}</label><textarea id="conRisks" class="form-input" rows="3"></textarea></div>
      <div style="grid-column:1/-1"><label>🔄 ${tr('Alternatives Explained', 'البدائل الموضّحة')}</label><textarea id="conAlts" class="form-input" rows="2" placeholder="${tr('Non-surgical options, different techniques...', 'الخيارات غير الجراحية، تقنيات مختلفة...')}"></textarea></div>
      <div style="grid-column:1/-1"><label>✅ ${tr('Expected Results', 'النتائج المتوقعة')}</label><textarea id="conResults" class="form-input" rows="2"></textarea></div>
      <div style="grid-column:1/-1"><label>⛔ ${tr('Limitations', 'القيود والمحددات')}</label><textarea id="conLimits" class="form-input" rows="2" placeholder="${tr('Results may vary, revision may be needed...', 'النتائج قد تختلف، قد تكون المراجعة ضرورية...')}"></textarea></div>
    </div>
    <div style="margin:16px 0;padding:16px;background:var(--hover);border-radius:12px">
      <h4 style="margin-bottom:12px">${tr('Additional Consents', 'موافقات إضافية')}</h4>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px"><input type="checkbox" id="conPhoto"> 📷 ${tr('Photography Consent', 'الموافقة على التصوير')}</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px"><input type="checkbox" id="conAnesC"> 💉 ${tr('Anesthesia Consent', 'الموافقة على التخدير')}</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px"><input type="checkbox" id="conBlood"> 🩸 ${tr('Blood Transfusion', 'نقل الدم')}</label>
      </div>
    </div>
    <button class="btn btn-primary" onclick="saveCosConsent()" style="width:100%;height:48px;font-size:16px">✍️ ${tr('Sign & Save Consent', 'توقيع وحفظ الإقرار')}</button></div>`;
    setTimeout(() => fillConsentRisks(), 100);
  } else if (cosTab === 'followups') {
    mc.innerHTML = `<div class="card">${followups.length ? makeTable(
      [tr('Patient', 'المريض'), tr('Date', 'التاريخ'), tr('Days Post-Op', 'أيام بعد العملية'), tr('Healing', 'التعافي'), tr('Pain', 'الألم'), tr('Swelling', 'التورم'), tr('Satisfaction', 'الرضا'), tr('Next', 'القادمة')],
      followups.map(f => ({
        cells: [f.patient_name, f.followup_date, f.days_post_op + ' ' + tr('days', 'يوم'),
        f.healing_status === 'Excellent' ? '🟢 ' + tr('Excellent', 'ممتاز') : f.healing_status === 'Good' ? '🟡 ' + tr('Good', 'جيد') : '🔴 ' + tr('Poor', 'ضعيف'),
        `<span style="color:${f.pain_level >= 7 ? '#ef4444' : f.pain_level >= 4 ? '#f59e0b' : '#22c55e'}">${f.pain_level}/10</span>`,
        f.swelling, '⭐'.repeat(Math.min(f.patient_satisfaction || 0, 5)), f.next_followup || '-'
        ]
      }))
    ) : `<div class="empty-state"><span style="font-size:48px">🩺</span><p>${tr('No follow-ups', 'لا توجد متابعات')}</p></div>`}</div>`;
  }
}

// Cosmetic Surgery Helper Functions
window.updateCosFields = function () {
  const sel = document.getElementById('cosProc');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('cosCost').value = opt.dataset.cost || '';
  document.getElementById('cosAnes').value = opt.dataset.anes || 'Local';
};
window.fillConsentRisks = function () {
  const sel = document.getElementById('conProc');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const risksEl = document.getElementById('conRisks');
  if (risksEl) risksEl.value = opt.dataset.risks || '';
};
window.saveCosCase = async function () {
  const patSel = document.getElementById('cosPatient');
  const procSel = document.getElementById('cosProc');
  await API.post('/api/cosmetic/cases', {
    patient_id: patSel.value, patient_name: patSel.options[patSel.selectedIndex].dataset.name,
    procedure_id: procSel.value, procedure_name: procSel.options[procSel.selectedIndex].dataset.name,
    surgery_date: document.getElementById('cosSurgDate').value, surgery_time: document.getElementById('cosSurgTime').value,
    anesthesia_type: document.getElementById('cosAnes').value, operating_room: document.getElementById('cosOR').value,
    total_cost: document.getElementById('cosCost').value, pre_op_notes: document.getElementById('cosPreNotes').value
  });
  showToast(tr('Case scheduled!', 'تمت الجدولة!')); cosTab = 'cases'; navigateTo(41);
};
window.completeCosCase = async function (id) {
  await API.put('/api/cosmetic/cases/' + id, { status: 'Completed' });
  showToast(tr('Case completed', 'تمت العملية')); navigateTo(41);
};
window.saveCosConsent = async function () {
  const patSel = document.getElementById('conPatient');
  const procSel = document.getElementById('conProc');
  await API.post('/api/cosmetic/consents', {
    patient_id: patSel.value, patient_name: patSel.options[patSel.selectedIndex].dataset.name,
    procedure_name: procSel.options[procSel.selectedIndex].dataset.name,
    consent_type: document.getElementById('conType').value,
    risks_explained: document.getElementById('conRisks').value,
    alternatives_explained: document.getElementById('conAlts').value,
    expected_results: document.getElementById('conResults').value,
    limitations: document.getElementById('conLimits').value,
    is_photography_consent: document.getElementById('conPhoto').checked,
    is_anesthesia_consent: document.getElementById('conAnesC').checked,
    is_blood_transfusion_consent: document.getElementById('conBlood').checked,
    witness_name: document.getElementById('conWitness').value
  });
  showToast(tr('Consent signed!', 'تم التوقيع!')); cosTab = 'consents'; navigateTo(41);
};
window.printCosConsent = async function (id) {
  const consents = await API.get('/api/cosmetic/consents');
  const c = consents.find(x => x.id === id);
  if (!c) return;
  const w = window.open('', '_blank', 'width=800,height=1000');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>إقرار موافقة - Consent Form</title>
  <style>body{font-family:'Segoe UI',Tahoma,sans-serif;padding:30px;color:#333;direction:rtl}
  .header{text-align:center;border-bottom:3px double #333;padding:20px 0;margin-bottom:20px}
  .header h1{margin:0;font-size:22px;color:#1a365d} .header h2{margin:5px 0;font-size:16px;color:#666}
  .section{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:8px}
  .section h3{color:#1a365d;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:0}
  .field{margin:10px 0;line-height:1.8} .field label{font-weight:700;color:#555}
  .sig-area{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:30px}
  .sig-box{text-align:center;border-top:2px solid #333;padding-top:10px}
  .checkbox{margin:8px 0;font-size:14px}
  @media print{body{padding:20px}}</style></head><body>
  <div class="header">
    <h1>نموذج إقرار وموافقة على إجراء تجميلي</h1>
    <h2>Cosmetic Procedure Consent Form</h2>
    <p style="margin:5px 0;color:#888">Medical Center - المركز الطبي</p>
  </div>
  <div class="section">
    <h3>📋 بيانات المريض / Patient Information</h3>
    <div class="field"><label>اسم المريض / Patient Name:</label> ${c.patient_name}</div>
    <div class="field"><label>الإجراء / Procedure:</label> ${c.procedure_name}</div>
    <div class="field"><label>الجراح / Surgeon:</label> ${c.surgeon}</div>
    <div class="field"><label>التاريخ / Date:</label> ${c.consent_date} &nbsp; <label>الوقت / Time:</label> ${c.consent_time}</div>
  </div>
  <div class="section">
    <h3>⚠️ المخاطر والمضاعفات المحتملة / Risks & Complications</h3>
    <p>${c.risks_explained || 'N/A'}</p>
  </div>
  <div class="section">
    <h3>🔄 البدائل المتاحة / Available Alternatives</h3>
    <p>${c.alternatives_explained || 'N/A'}</p>
  </div>
  <div class="section">
    <h3>✅ النتائج المتوقعة / Expected Results</h3>
    <p>${c.expected_results || 'N/A'}</p>
  </div>
  <div class="section">
    <h3>⛔ القيود والمحددات / Limitations</h3>
    <p>${c.limitations || 'N/A'}</p>
  </div>
  <div class="section">
    <h3>📋 موافقات إضافية / Additional Consents</h3>
    <div class="checkbox">${c.is_photography_consent ? '☑' : '☐'} الموافقة على التصوير / Photography Consent</div>
    <div class="checkbox">${c.is_anesthesia_consent ? '☑' : '☐'} الموافقة على التخدير / Anesthesia Consent</div>
    <div class="checkbox">${c.is_blood_transfusion_consent ? '☑' : '☐'} الموافقة على نقل الدم / Blood Transfusion Consent</div>
  </div>
  <div style="margin:25px 0;padding:15px;background:#f8f9fa;border-radius:8px;font-size:13px">
    <strong>إقرار / Declaration:</strong><br>
    أقر أنا الموقع أدناه بأنني قد فهمت طبيعة الإجراء التجميلي المذكور أعلاه، وتم شرح المخاطر والمضاعفات المحتملة والبدائل المتاحة لي. أوافق على إجراء العملية بكامل إرادتي.<br><br>
    <em>I, the undersigned, declare that I have fully understood the nature of the cosmetic procedure described above, and the risks, complications, and alternatives have been explained to me. I consent to the procedure of my own free will.</em>
  </div>
  <div class="sig-area">
    <div class="sig-box"><strong>توقيع المريض<br>Patient Signature</strong></div>
    <div class="sig-box"><strong>توقيع الجراح<br>Surgeon: ${c.surgeon}</strong></div>
    <div class="sig-box"><strong>توقيع الشاهد<br>Witness: ${c.witness_name || ''}</strong></div>
  </div>
  </body></html>`);
  setTimeout(() => { w.print(); }, 500);
};


// ===== CONSULTATION (الكشف) =====
async function renderConsultation(el) {
  const content = el;
  const [patients, services, settings] = await Promise.all([
    API.get('/api/patients').catch(() => []),
    API.get('/api/medical/services').catch(() => []),
    API.get('/api/zatca/settings').catch(() => ({}))
  ]);

  // Get consultation services grouped by specialty
  const consultations = services.filter(s => s.category === 'Consultation');
  const specialties = [...new Set(consultations.map(s => s.specialty))];

  const specNamesAr = {
    'General Practice': 'الطب العام', 'Dentistry': 'طب الأسنان', 'Internal Medicine': 'الباطنية',
    'Cardiology': 'القلب', 'Dermatology': 'الجلدية', 'Ophthalmology': 'العيون',
    'ENT': 'الأنف والأذن والحنجرة', 'Orthopedics': 'العظام', 'Obstetrics': 'النساء والولادة',
    'Pediatrics': 'الأطفال', 'Neurology': 'الأعصاب', 'Psychiatry': 'الطب النفسي',
    'Urology': 'المسالك البولية', 'Endocrinology': 'الغدد الصماء', 'Gastroenterology': 'الجهاز الهضمي',
    'Pulmonology': 'الصدرية', 'Nephrology': 'الكلى', 'Surgery': 'الجراحة العامة',
    'Oncology': 'الأورام', 'Physiotherapy': 'العلاج الطبيعي', 'Nutrition': 'التغذية',
    'Emergency': 'الطوارئ'
  };

  content.innerHTML = `
    <div class="page-title">🩺 ${tr('Consultation', 'الكشف')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Patient Search -->
      <div class="card" style="padding:20px">
        <div class="card-title">🔍 ${tr('Search Patient', 'البحث عن مريض')}</div>
        <input class="form-input mb-12" id="csPatientSearch" placeholder="${tr('Search by name, ID, phone, file number...', 'ابحث بالاسم، الهوية، الجوال، رقم الملف...')}" oninput="filterConsultPatients()">
        <div id="csPatientList" style="max-height:250px;overflow-y:auto"></div>
        <div id="csSelectedPatient" style="display:none;margin-top:12px;padding:12px;background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:10px"></div>
      </div>

      <!-- Department & Fee -->
      <div class="card" style="padding:20px">
        <div class="card-title">🏥 ${tr('Select Department & Service', 'اختيار القسم والخدمة')}</div>
        <div class="form-group mb-12">
          <label>${tr('Department', 'القسم')}</label>
          <select class="form-input" id="csDepartment" onchange="loadConsultServices()">
            <option value="">${tr('-- Select Department --', '-- اختر القسم --')}</option>
            ${specialties.map(s => `<option value="${s}">${isArabic ? (specNamesAr[s] || s) : s}</option>`).join('')}
          </select>
        </div>
        <div id="csServicesList" style="margin-bottom:12px"></div>
        <div id="csSelectedService" style="display:none;margin-bottom:12px;padding:12px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:10px"></div>
        <div class="form-group mb-12">
          <label>${tr('Payment Method', 'طريقة الدفع')}</label>
          <select class="form-input" id="csPayMethod">
            <option value="Cash">${tr('Cash', 'نقدي')}</option>
            <option value="Mada">${tr('Mada', 'مدى')}</option>
            <option value="Visa/MC">${tr('Visa/MasterCard', 'فيزا/ماستركارد')}</option>
            <option value="Insurance">${tr('Insurance', 'تأمين')}</option>
            <option value="Bank Transfer">${tr('Bank Transfer', 'تحويل بنكي')}</option>
          </select>
        </div>
        <button class="btn btn-primary w-full" onclick="createConsultInvoice()" style="height:48px;font-size:16px">💳 ${tr('Create Consultation Invoice', 'إنشاء فاتورة كشف')}</button>
      </div>
    </div>

    <!-- Recent Consultations -->
    <div class="card" style="padding:20px;margin-top:16px">
      <div class="card-title">📋 ${tr('Consultation Fee by Department (from Catalog)', 'تسعيرة الكشف حسب القسم (من الأصناف)')}</div>
      <table class="data-table">
        <thead><tr>
          <th>${tr('Department', 'القسم')}</th>
          <th>${tr('Service', 'الخدمة')}</th>
          <th>${tr('Arabic', 'عربي')}</th>
          <th style="width:100px">${tr('Price', 'السعر')}</th>
        </tr></thead>
        <tbody>
          ${consultations.map(c => `<tr>
            <td><strong>${isArabic ? (specNamesAr[c.specialty] || c.specialty) : c.specialty}</strong></td>
            <td>${c.name_en}</td>
            <td>${c.name_ar || ''}</td>
            <td style="font-weight:700;color:#2e7d32">${parseFloat(c.price || 0).toFixed(2)} SAR</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Store data for window functions
  window._csPatients = patients;
  window._csServices = services;
  window._csConsultations = consultations;
  window._csSettings = settings;

  // Filter patients
  window.filterConsultPatients = () => {
    const q = (document.getElementById('csPatientSearch')?.value || '').toLowerCase();
    const list = document.getElementById('csPatientList');
    if (!list || !q || q.length < 2) { list.innerHTML = ''; return; }
    const filtered = patients.filter(p =>
      (p.name_ar || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.national_id || '').includes(q) ||
      (p.phone || '').includes(q) ||
      String(p.file_number || '').includes(q)
    ).slice(0, 10);
    list.innerHTML = filtered.map(p => `
      <div style="padding:8px 12px;margin:4px 0;background:#f5f5f5;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="selectConsultPatient(${p.id})">
        <div>
          <strong>${p.file_number || ''}</strong> - ${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
          <span style="font-size:11px;color:#666"> | ${p.phone || ''}</span>
        </div>
        <span style="font-size:20px">☑️</span>
      </div>
    `).join('');
  };

  // Select patient
  window.selectConsultPatient = (id) => {
    const p = patients.find(pp => pp.id === id);
    if (!p) return;
    window._csSelectedPatient = p;
    const el = document.getElementById('csSelectedPatient');
    el.style.display = 'block';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong style="font-size:16px">${isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}</strong>
          <div style="font-size:13px;color:#1565c0;margin-top:4px">📁 ${tr('File', 'ملف')}: ${p.file_number || p.id} | 📱 ${p.phone || '-'} | 🪪 ${p.national_id || '-'}</div>
        </div>
        <span style="font-size:28px">✅</span>
      </div>`;
    document.getElementById('csPatientList').innerHTML = '';
    document.getElementById('csPatientSearch').value = isArabic ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar);
  };

  // Load services for selected department
  window.loadConsultServices = () => {
    const dept = document.getElementById('csDepartment')?.value;
    const list = document.getElementById('csServicesList');
    if (!dept || !list) { list.innerHTML = ''; return; }
    const deptServices = consultations.filter(s => s.specialty === dept);
    list.innerHTML = deptServices.map(s => `
      <div style="padding:10px;margin:4px 0;background:#f8f9fa;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border:2px solid transparent;transition:all 0.2s" 
           onmouseover="this.style.borderColor='#4caf50'" onmouseout="this.style.borderColor='transparent'" 
           onclick="selectConsultService(${s.id})">
        <div>
          <strong>${isArabic ? (s.name_ar || s.name_en) : s.name_en}</strong>
          <div style="font-size:11px;color:#666">${s.category} | ${isArabic ? (specNamesAr[s.specialty] || s.specialty) : s.specialty}</div>
        </div>
        <span style="font-weight:700;color:#2e7d32;font-size:16px">${parseFloat(s.price || 0).toFixed(2)} SAR</span>
      </div>
    `).join('');
  };

  // Select service
  window.selectConsultService = (id) => {
    const s = services.find(ss => ss.id === id);
    if (!s) return;
    window._csSelectedService = s;
    const el = document.getElementById('csSelectedService');
    el.style.display = 'block';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong style="font-size:15px">✅ ${isArabic ? (s.name_ar || s.name_en) : s.name_en}</strong>
          <div style="font-size:13px;color:#2e7d32;margin-top:4px">${tr('Price', 'السعر')}: <strong>${parseFloat(s.price || 0).toFixed(2)} SAR</strong> + ${tr('VAT 15%', 'ضريبة 15%')}: <strong>${(parseFloat(s.price || 0) * 0.15).toFixed(2)} SAR</strong> = <strong style="font-size:16px">${(parseFloat(s.price || 0) * 1.15).toFixed(2)} SAR</strong></div>
        </div>
      </div>`;
  };

  // Create consultation invoice
  window.createConsultInvoice = async () => {
    const patient = window._csSelectedPatient;
    const service = window._csSelectedService;
    if (!patient) return showToast(tr('Please select a patient', 'يرجى اختيار المريض'), 'error');
    if (!service) return showToast(tr('Please select a service', 'يرجى اختيار الخدمة'), 'error');

    const price = parseFloat(service.price || 0);
    const nationality = patient.nationality || '';
    const isExempt = (nationality === 'سعودي' || nationality.toLowerCase() === 'saudi');
    const vatAmount = isExempt ? 0 : price * 0.15;
    const total = price + vatAmount;
    const payMethod = document.getElementById('csPayMethod')?.value || 'Cash';

    try {
      const inv = await API.post('/api/invoices', {
        patient_id: patient.id,
        patient_name: isArabic ? (patient.name_ar || patient.name_en) : (patient.name_en || patient.name_ar),
        total: total.toFixed(2),
        description: (isArabic ? (service.name_ar || service.name_en) : service.name_en) + ' - ' + service.specialty,
        service_type: 'Consultation',
        payment_method: payMethod,
        discount: 0,
        discount_reason: '',
        original_amount: total.toFixed(2)
      });

      // Auto pay
      await API.put('/api/invoices/' + inv.id + '/pay', { payment_method: payMethod });

      showToast(tr('Consultation invoice created & paid!', 'تم إنشاء فاتورة الكشف ودفعها!'));

      // Print ZATCA invoice
      if (settings.tax_number) {
        try {
          const qrData = await API.get('/api/zatca/qr/' + inv.id);
          let qrDataUrl = '';
          if (qrData.qr_base64 && typeof QRCode !== 'undefined') {
            qrDataUrl = await QRCode.toDataURL(qrData.qr_base64, { width: 180, margin: 1 });
          }
          const win = window.open('', '_blank');
          win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${tr('Consultation Invoice', 'فاتورة كشف')}</title>
          <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tajawal',Arial,sans-serif;padding:15px;max-width:380px;margin:0 auto;font-size:13px}.header{text-align:center;border-bottom:2px dashed #333;padding-bottom:10px;margin-bottom:10px}.header h1{font-size:18px;margin-bottom:3px}.header p{font-size:11px;color:#555}.line{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted #ddd}.line.total{border-top:2px solid #333;border-bottom:2px solid #333;font-weight:700;font-size:15px;padding:6px 0;margin-top:6px}.qr{text-align:center;margin:12px 0;padding:10px;border:1px dashed #999;border-radius:8px}.qr img{max-width:180px}.footer{text-align:center;margin-top:10px;font-size:10px;color:#777}@media print{body{max-width:100%;padding:8px}}</style></head><body>
          <div class="header">
            <h1>${settings.seller_name_ar || settings.seller_name || 'المركز الطبي'}</h1>
            <p>${settings.seller_name || 'Medical Center'}</p>
            ${settings.tax_number ? '<p>الرقم الضريبي: ' + settings.tax_number + '</p>' : ''}
            ${settings.commercial_reg ? '<p>سجل تجاري: ' + settings.commercial_reg + '</p>' : ''}
            <p>${[settings.street, settings.district, settings.city].filter(Boolean).join(' - ') || ''}</p>
          </div>
          <div style="text-align:center;margin-bottom:8px"><strong style="font-size:16px">فاتورة كشف${settings.invoice_type === 'simplified' ? ' مبسطة' : ''}</strong></div>
          <div class="line"><span>رقم الفاتورة</span><span>${inv.invoice_number || 'INV-' + inv.id}</span></div>
          <div class="line"><span>التاريخ</span><span>${new Date().toLocaleString('ar-SA')}</span></div>
          <div class="line"><span>المريض</span><span>${patient.name_ar || patient.name_en || ''}</span></div>
          <div class="line"><span>رقم الملف</span><span>${patient.file_number || patient.id}</span></div>
          <div class="line"><span>القسم</span><span>${specNamesAr[service.specialty] || service.specialty}</span></div>
          <div class="line"><span>الخدمة</span><span>${service.name_ar || service.name_en}</span></div>
          <div class="line"><span>المبلغ قبل الضريبة</span><span>${price.toFixed(2)} SAR</span></div>
          <div class="line"><span>ضريبة القيمة المضافة 15%</span><span>${vatAmount.toFixed(2)} SAR</span></div>
          <div class="line total"><span>الإجمالي</span><span>${total.toFixed(2)} SAR</span></div>
          <div class="line"><span>طريقة الدفع</span><span>${payMethod}</span></div>
          <div class="line"><span>الحالة</span><span>✅ مدفوع</span></div>
          <div class="qr">
            ${qrDataUrl ? '<img src="' + qrDataUrl + '" alt="ZATCA QR"><br>' : ''}
            <p style="font-size:9px;color:#999;margin-top:4px">امسح الباركود للتحقق من الفاتورة</p>
          </div>
          <div class="footer">
            <p>${settings.seller_name_ar || 'المركز الطبي'}</p>
            <p>فاتورة إلكترونية - هيئة الزكاة والضريبة والجمارك</p>
          </div>
          <script>setTimeout(()=>window.print(),500)<\/script>
          </body></html>`);
          win.document.close();
        } catch (e) { console.error('Print error:', e); }
      }

      navigateTo(currentPage);
    } catch (e) { showToast(tr('Error creating invoice', 'خطأ في إنشاء الفاتورة'), 'error'); }
  };
}

// ===== APP SERVER PORTAL =====
async function renderAppServerPortal(el) {
  el.innerHTML = '<div class="page-title">🖥️ ' + tr('APP SERVER Portal', 'بوابة التطبيقات') + '</div>' +
    '<div style="display:flex;gap:12px;margin-bottom:16px">' +
      '<a href="/portal/" target="_blank" class="btn btn-primary">🔗 ' + tr('Open in New Tab', 'فتح في تبويب جديد') + '</a>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;border-radius:12px">' +
      '<iframe src="/portal/" style="width:100%;height:calc(100vh - 200px);border:none;border-radius:12px"></iframe>' +
    '</div>';
}

// ===== ADAPTIVE UI INTEGRATION =====
window.launchAdaptiveUI = async () => {
  let drSpecialty = 'CARDIO_INT';
  try {
    const currentUser = await API.get('/api/auth/me');
    if (currentUser && currentUser.user && currentUser.user.speciality) {
      drSpecialty = currentUser.user.speciality;
    }
  } catch(e) {
    console.warn("Could not get user specialty for Adaptive Station, defaulting to CARDIO_INT", e);
  }
  
  const lang = localStorage.getItem('namaLang') || 'en';
  const iframeHtml = `<iframe src="/adaptive_doctor_station.html?specialty=${drSpecialty}&lang=${lang}" style="width:100%; height:85vh; border:none; border-radius:12px;"></iframe>`;
  document.getElementById('pageContent').innerHTML = iframeHtml;
};
