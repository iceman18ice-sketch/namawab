# خطة بناء نظام المركز الطبي الويب (Namaweb3) — البلوبرنت الكامل
# Medical ERP — Complete Build Blueprint
# Version: 1.0 | Date: 2026-02-23

---

## 📋 نظرة عامة — Overview

نظام طبي شامل (ERP) للعيادات والمستشفيات يعمل على المتصفح.  
Full medical ERP web application for clinics and hospitals.

- **Stack**: Node.js + Express.js + SQLite (better-sqlite3) + Vanilla HTML/CSS/JS (SPA)
- **Port**: 3000
- **Login**: admin / admin
- **Database**: `nama_medical_web.db` (SQLite, auto-created)
- **Language**: Bilingual Arabic/English with toggle

---

## 📁 هيكل المشروع — Project Structure

```
namaweb3/
├── server.js          # Express backend (API routes + session auth)
├── database.js        # Database schema + seed data (tables + lab/rad/services/drugs)
├── import_drugs.js    # Script to import 4000+ drugs from drugs_export.txt
├── package.json       # Dependencies: express, better-sqlite3, express-session, cors
├── public/
│   ├── index.html     # Single HTML page (SPA shell)
│   ├── css/
│   │   └── style.css  # Full design system (themes, components, animations)
│   └── js/
│       └── app.js     # All frontend logic (18 modules/pages)
```

---

## 🗄️ قاعدة البيانات — Database Schema (50+ Tables)

### Core Tables:
```sql
-- المرضى
patients (id, file_number, name_ar, name_en, national_id, phone, dob_gregorian, dob_hijri, gender, blood_type, nationality, marital_status, city, address, email, department, notes, amount, status, created_at)

-- المستخدمين
system_users (id, username, password_hash, display_name, role, speciality, permissions, is_active, created_at)
-- Roles: Admin, Doctor, Nurse, Reception, Lab, Radiology, Pharmacy, HR, Finance
-- speciality: links to medical_services specialty for Doctors

-- إعدادات المنشأة
company_settings (id, setting_key, setting_value)

-- الموظفين
employees (id, name, name_ar, name_en, role, department_ar, department_en, status, salary, phone, email, hire_date, created_at)
```

### Medical Records:
```sql
medical_records (id, patient_id, doctor_name, diagnosis, symptoms, icd_code, notes, created_at)
prescriptions (id, patient_id, record_id, medication_name, dosage, frequency, duration, notes, created_at)
appointments (id, patient_id, patient_name, doctor, department, date, time, status, notes, created_at)
vital_signs (id, patient_id, recorded_by, blood_pressure, heart_rate, temperature, respiratory_rate, oxygen_saturation, weight, height, bmi, notes, created_at)
```

### Lab & Radiology:
```sql
-- كتالوج الفحوصات (300+ فحص)
lab_tests_catalog (id, test_name, category, normal_range, price)
-- Categories: Hematology, Biochemistry, Hormones, Immunology, Microbiology, Urinalysis, Coagulation, Tumor Markers, Drug Monitoring, Autoimmune, Blood Gas

-- كتالوج الأشعة (178 فحص)
radiology_catalog (id, modality, exact_name, default_template, price)
-- Modalities: X-Ray(34), CT(30), MRI(36), Ultrasound(30), Mammography(5), DEXA(3), Echo(4), Fluoroscopy(9), Nuclear Medicine(12), PET/CT(3), Interventional(12)

-- طلبات المختبر والأشعة
lab_radiology_orders (id, patient_id, order_type, is_radiology, status, results, report_text, created_at)
```

### Pharmacy:
```sql
-- كتالوج الأدوية (4000+ دواء)
pharmacy_drug_catalog (id, drug_name, active_ingredient, category, unit, selling_price, cost_price, stock_qty, reorder_level, is_active)
-- Source: drugs_export.txt (TSV tab-separated from desktop app)

-- طابور الصيدلية وصرف الأدوية
pharmacy_queue (id, patient_id, patient_name, prescription_id, status, created_at)
pharmacy_dispensing (id, queue_id, drug_id, quantity, price, created_at)

medications (id, name, active_ingredient, stock_quantity, price)
```

### الإجراءات الطبية Medical Services (338 إجراء):
```sql
medical_services (id, name_en, name_ar, specialty, category, price, is_active)
```
**22 تخصص:**
General Practice(20), Dentistry(52), Internal Medicine(14), Cardiology(9), Dermatology(23), Ophthalmology(22), ENT(22), Orthopedics(22), Obstetrics(23), Pediatrics(15), Neurology(11), Psychiatry(9), Urology(11), Endocrinology(10), Gastroenterology(12), Pulmonology(10), Nephrology(7), Surgery(17), Oncology(7), Physiotherapy(9), Nutrition(6), Emergency(7)

**Categories per specialty:** Consultation, Procedure, Diagnostic, Therapy, Service

### Finance & Insurance:
```sql
invoices (id, patient_name, total, paid, created_at)
invoice_items (id, invoice_id, description, amount)
insurance_companies (id, name, contact, email, phone, contract_start, contract_end, is_active)
insurance_claims (id, patient_name, insurance_company, claim_amount, status, created_at)
```

### Other Tables:
```sql
inventory_items, inventory_suppliers, inventory_purchases
messages (internal messaging)
waiting_queue
patient_referrals
form_builder_templates, form_builder_submissions
```

---

## 🖥️ 18 وحدة — Modules (NAV_ITEMS)

```javascript
const NAV_ITEMS = [
  { icon: '📊', en: 'Dashboard', ar: 'لوحة التحكم' },        // 0
  { icon: '🏥', en: 'Reception', ar: 'الاستقبال' },          // 1
  { icon: '📅', en: 'Appointments', ar: 'المواعيد' },        // 2
  { icon: '👨‍⚕️', en: 'Doctor Station', ar: 'محطة الطبيب' },  // 3
  { icon: '🔬', en: 'Laboratory', ar: 'المختبر' },           // 4
  { icon: '📡', en: 'Radiology', ar: 'الأشعة' },             // 5
  { icon: '💊', en: 'Pharmacy', ar: 'الصيدلية' },            // 6
  { icon: '🏢', en: 'HR', ar: 'الموارد البشرية' },           // 7
  { icon: '💰', en: 'Finance', ar: 'المالية' },              // 8
  { icon: '🛡️', en: 'Insurance', ar: 'التأمين' },            // 9
  { icon: '📦', en: 'Inventory', ar: 'المخازن' },            // 10
  { icon: '👩‍⚕️', en: 'Nursing', ar: 'التمريض' },             // 11
  { icon: '🪑', en: 'Waiting Queue', ar: 'قائمة الانتظار' }, // 12
  { icon: '💳', en: 'Patient Accounts', ar: 'حسابات المرضى' },// 13
  { icon: '📋', en: 'Reports', ar: 'التقارير' },             // 14
  { icon: '✉️', en: 'Messaging', ar: 'الرسائل' },            // 15
  { icon: '📂', en: 'Catalog', ar: 'الأصناف' },              // 16
  { icon: '⚙️', en: 'Settings', ar: 'الإعدادات' },           // 17
];
```

---

## 🔗 API Routes — server.js

### Auth:
- `POST /api/auth/login` — Login (stores session with id, name, role, speciality, permissions)
- `GET /api/auth/me` — Current user info
- `POST /api/auth/logout` — Logout

### Patients:
- `GET /api/patients` — List all
- `POST /api/patients` — Create
- `PUT /api/patients/:id` — Update
- `GET /api/patients/:id` — Get one

### Medical Records:
- `GET /api/medical/records` — All records
- `POST /api/medical/records` — Create record
- `GET /api/medical/services` — All services (filterable by ?specialty=)
- `PUT /api/medical/services/:id` — Update service price

### Prescriptions:
- `GET /api/prescriptions` — All
- `POST /api/prescriptions` — Create

### Appointments:
- `GET /api/appointments` — All
- `POST /api/appointments` — Create
- `PUT /api/appointments/:id` — Update

### Lab:
- `GET /api/lab/orders` — Lab orders
- `POST /api/lab/orders` — Create order
- `PUT /api/lab/orders/:id` — Update status/results

### Radiology:
- `GET /api/radiology/orders` — Radiology orders
- `POST /api/radiology/orders` — Create order
- `PUT /api/radiology/orders/:id` — Update status/results
- `GET /api/radiology/catalog` — Catalog listing

### Pharmacy:
- `GET /api/pharmacy/drugs` — Drug catalog
- `POST /api/pharmacy/drugs` — Add drug
- `GET /api/pharmacy/queue` — Dispensing queue

### Catalog (Price Management):
- `GET /api/catalog/lab` — All lab tests with prices
- `PUT /api/catalog/lab/:id` — Update lab test price
- `GET /api/catalog/radiology` — All radiology exams with prices
- `PUT /api/catalog/radiology/:id` — Update radiology price

### Finance:
- `GET /api/invoices` — All invoices
- `POST /api/invoices` — Create invoice

### Insurance:
- `GET /api/insurance/claims` — All claims
- `POST /api/insurance/claims` — Create claim
- `PUT /api/insurance/claims/:id` — Update claim status

### HR:
- `GET /api/employees` — All employees
- `POST /api/employees` — Add employee
- `PUT /api/employees/:id` — Update employee

### Settings:
- `GET /api/settings` — Company settings
- `PUT /api/settings` — Update settings
- `GET /api/settings/users` — System users
- `POST /api/settings/users` — Create user
- `PUT /api/settings/users/:id` — Update user
- `DELETE /api/settings/users/:id` — Delete user

### Reports:
- `GET /api/reports/financial` — Financial summary
- `GET /api/reports/patients` — Patient statistics

### Other:
- `GET /api/vital-signs/:patientId` — Patient vital signs
- `POST /api/vital-signs` — Record vital signs
- `GET /api/waiting-queue` — Queue
- `POST /api/waiting-queue` — Add to queue
- `GET /api/messages` — Messages
- `POST /api/messages` — Send message

---

## 🎨 التصميم — Design System (style.css)

### Themes:
- **Blue (default)** — Professional medical blue
- **Dark** — Dark mode
- **Green** — Nature/calming
- **Purple** — Modern purple

### CSS Variables:
```css
--bg, --card, --sidebar, --border, --text, --text-dim, --accent, --hover
--success, --warning, --danger, --info
```

### Components:
- `.btn` (btn-primary, btn-success, btn-danger, btn-info, btn-secondary, btn-sm)
- `.form-input`, `.form-textarea`, `.form-select`
- `.card`, `.card-title`
- `.data-table` (responsive tables)
- `.badge` (badge-success, badge-warning, badge-danger, badge-info)
- `.stat-card` (dashboard stats with --stat-color)
- `.page-title`
- `.split-layout`, `.grid-equal`
- `.sidebar`, `.nav-item`
- Login page with glassmorphism
- Toast notifications
- RTL support (Arabic)

---

## 📊 البيانات المطلوبة — Required Seed Data

### 1. فحوصات المختبر (300+)
Categories: Hematology, Biochemistry, Hormones/Endocrinology, Immunology/Serology, Microbiology, Urinalysis, Coagulation, Tumor Markers, Therapeutic Drug Monitoring, Autoimmune, Blood Gas
Each has: test_name, category, normal_range, price

### 2. الأشعة (178 فحص)
Modalities with counts:
- X-Ray: 34 (Chest PA/Lat, Abdomen KUB/Erect, all Spine segments, Pelvis, Hip, Shoulder, Elbow, Wrist, Hand, Fingers, Knee, Ankle, Foot, Toes, Skull, Facial, Nasal, Sinuses, Mandible, OPG, Clavicle, Ribs, Sacrum, Scapula, Forearm, Humerus, Femur, Tibia/Fibula)
- CT: 30 (Brain ±contrast, Orbits, Sinuses, Temporal, Neck, Chest ±contrast, HRCT, Abdomen ±contrast, Pelvis, KUB, all Spine, CTA Brain/Neck/Chest PE/Aorta/Lower Limb/Coronary/Renal, Enterography, Colonography, Urography, Guided Biopsy, 3D Recon)
- MRI: 36 (Brain ±contrast, MRA, Orbits, IAC, Pituitary, TMJ, Neck, all Spine, Whole Spine, SI Joints, Shoulder, Elbow, Wrist, Hand, Hip, Knee, Ankle, Foot, Abdomen, Pelvis, Liver, MRCP, Prostate, Breast, Cardiac, Enterography, Fetal, Brachial Plexus, MRA Head/Neck/Abdominal/Lower Limb, MRV Brain)
- Ultrasound: 30 (Abdomen Complete/Limited, Pelvis Trans-abdominal/vaginal, Thyroid, Breast Bi/Unilateral, OB 1st/2nd-3rd/Growth/Anomaly, Renal, Bladder, Scrotal, Soft Tissue, MSK, Joint, Neonatal Brain, Hip Infant, Guided Biopsy/Aspiration, Doppler Carotid/Lower Arterial/Venous DVT/Upper/Renal/Portal/Testicular/Fetal, Elastography)
- Mammography: 5, DEXA: 3, Echo: 4, Fluoroscopy: 9, Nuclear Medicine: 12, PET/CT: 3, Interventional: 12

### 3. الإجراءات الطبية (338)
22 specialties with full procedure lists. Key:
- **Dentistry (52)**: Consult, X-Ray, Cleaning, Polishing, Extractions (Simple/Surgical/Wisdom), Fillings (Composite 1-3 surfaces, Amalgam, Temp), Root Canal (Anterior/Premolar/Molar/Retreatment), Post&Core, Crowns (PFM/Zirconia/E-Max/Temp), Bridge, Veneers (Porcelain/Composite), Dentures (Complete Upper/Lower, Partial Acrylic/Metal), Implants (Single/Abutment/Crown), Gum Treatment (Gingivectomy/Curettage/Frenectomy), Whitening (Office/Home), Fluoride, Sealant, Ortho (Consult/Metal/Ceramic/Clear Aligners/Retainer/Space Maintainer), Pediatric (Pulpotomy/SS Crown), Guards (Night/Sport), TMJ, I&D
- **Each other specialty**: Full consultation, follow-up, and relevant procedures/diagnostics

### 4. الأدوية (4000+)
Source: `E:\NamaMedical\drugs_export.txt` (TSV format)
Import via import_drugs.js script
Categories: Analgesic, NSAID, Pain Relief, PPI/Antacid, Antibiotic, Cholesterol, Diabetes, Blood Pressure, Antihistamine, Asthma, Thyroid, Corticosteroid, Cold & Flu, Vitamins, and more

---

## 🔐 Authentication & Authorization

- Session-based auth using express-session
- Password stored as plaintext hash in system_users (for demo)
- Default user: admin/admin (role: Admin)
- Doctor users store `speciality` field matching medical_services specialty names
- Permissions: comma-separated module indices (e.g., "1,2,3,4")
- Admin sees all modules; non-admins see only permitted modules

---

## ⚡ Key Features Per Module

### 0. Dashboard
- Patient/appointment/invoice/employee counts
- Recent patients table
- Revenue stats

### 1. Reception
- Patient registration (AR/EN names, DOB Gregorian/Hijri with auto-age calc, National ID, phone)
- Patient list with search by file#, name, ID, phone
- Status management (Waiting → With Doctor → Done)
- Arabic-to-English name transliteration

### 2. Appointments
- Create/view appointments
- Status badges (Scheduled, Confirmed, Completed, Cancelled)

### 3. Doctor Station
- Patient selector
- Diagnosis/Symptoms/ICD-10/Notes
- **Procedures search filtered by doctor's specialty** (key feature!)
- Lab order creation with comprehensive test dropdowns
- Radiology order creation
- Prescription writing with drug autocomplete from 4000+ drug catalog
- Medical record saving

### 4. Laboratory
- Order management (Requested → In Progress → Done)
- Report writing
- Barcode generation (JsBarcode CODE128) + Print barcode button

### 5. Radiology
- Order management with 178 exam types
- Image upload support
- Report writing

### 6. Pharmacy
- Drug catalog display (4000+ drugs)
- Add new drugs
- Dispensing queue

### 7. HR
- Employee management (CRUD)
- Department/salary tracking

### 8. Finance
- Invoice management
- Revenue tracking

### 9. Insurance
- Insurance company management
- Claim submission and status tracking (Pending/Approved/Rejected)

### 10. Inventory
- Stock management
- Low stock alerts
- Purchase management

### 11. Nursing
- Vital signs recording (BP, HR, Temp, RR, O2)
- Patient queue

### 12. Waiting Queue
- Real-time patient queue management

### 13. Patient Accounts
- Patient financial history

### 14. Reports
- Financial summaries
- Patient statistics by department/status
- Lab/radiology order summaries

### 15. Messaging
- Internal messaging system

### 16. Catalog (الأصناف)
- **3 tabs**: Lab Tests | Radiology | Medical Procedures
- Grouped by category/modality/specialty
- Collapsible sections
- Editable price fields with save button per item
- Search filter
- Specialty filter for procedures

### 17. Settings
- Company info (Arabic/English name, tax#, CR#, phone, address)
- System user management (Create/Edit/Delete)
- 22 specialty options for Doctor role
- Module permission checkboxes

---

## 🚀 كيفية التشغيل — How to Run

```bash
cd namaweb3
npm install          # Install dependencies
node server.js       # Start server on port 3000
```

### لاستيراد 4000+ دواء:
```bash
node import_drugs.js   # Reads from E:\NamaMedical\drugs_export.txt
```

### Dependencies (package.json):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "express-session": "^1.17.3",
    "cors": "^2.8.5"
  }
}
```

---

## 📝 ملاحظات مهمة — Important Notes

1. **Database auto-creates** on first run — all tables and seed data inserted automatically
2. **drugs_export.txt** must exist at `E:\NamaMedical\drugs_export.txt` for drug import
3. **Session includes speciality** — Login query selects `speciality` from system_users and stores in session
4. **Doctor Station filtering** — Uses `currentUser.user.speciality` to filter medical_services by specialty
5. **Specialty names must match** between system_users.speciality and medical_services.specialty
6. **SPA architecture** — Single index.html, all routing via JavaScript navigateTo()
7. **Bilingual** — `tr(en, ar)` function + `isArabic` flag for language toggle
8. **Themes** — CSS custom properties switched by data-theme attribute on body
9. **JsBarcode** loaded from CDN for lab barcodes
10. **No build step needed** — Pure vanilla JS, runs directly

---

## 🔄 إعادة البناء من الصفر — Rebuild From Scratch Steps

1. Create project folder + `npm init -y`
2. Install: `npm install express better-sqlite3 express-session cors`
3. Create `server.js` with all API routes listed above
4. Create `database.js` with all tables + seed data (lab 300+, radiology 178, services 338, drugs 90+)
5. Create `public/index.html` (SPA shell with sidebar + content area)
6. Create `public/css/style.css` (full design system with themes)
7. Create `public/js/app.js` (all 18 module renderers)
8. Create `import_drugs.js` for bulk drug import
9. Run `node server.js`
10. Open http://localhost:3000, login with admin/admin

---

## 🐘 المهمة التالية: تحويل إلى PostgreSQL — Migration to PostgreSQL

### الوضع الحالي:
- النظام يعمل على **SQLite** (better-sqlite3) — sync API
- PostgreSQL 16 **مثبت وشغال** على الجهاز
- مكتبة `pg` **مثبتة** في المشروع
- قاعدة بيانات `nama_medical_web` **منشأة وفاضية** في PostgreSQL
- ملف `db_postgres.js` جاهز (جداول + اتصال)

### PostgreSQL Connection:
```
Host: localhost
Port: 5432
Database: nama_medical_web
User: postgres
Password: postgres
```

### المطلوب:
1. تحويل `server.js` من sync (better-sqlite3) إلى async (pg Pool) — كل route يستخدم `await`
2. تحويل `database.js` seed data (300+ lab, 178 radiology, 338 services, 90+ drugs) إلى PostgreSQL INSERT
3. تحويل `import_drugs.js` لـ PostgreSQL
4. SQLite syntax → PostgreSQL: `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`, `?` → `$1,$2...`
5. الفرونت إند (app.js, style.css, index.html) **لا يتغير** — نفسه بالضبط

