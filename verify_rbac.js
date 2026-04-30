const { getDb } = require('./database.js');
const db = getDb();

console.log('--- Adaptive Doctor Station RBAC Verification ---');

function getVisibleLabs(specialtyId) {
  const query = `
    SELECT l.test_name 
    FROM lab_tests_catalog l
    JOIN specialty_labs sl ON l.id = sl.lab_id
    WHERE sl.specialty_id = ?
  `;
  return db.prepare(query).all(specialtyId).map(row => row.test_name);
}

const cardioLabs = getVisibleLabs('CARDIO_INT');
const entLabs = getVisibleLabs('ENT');

console.log('\nLabs visible to Interventional Cardiologist (CARDIO_INT):');
console.log(cardioLabs);

console.log('\nLabs visible to ENT Doctor (ENT):');
console.log(entLabs);

console.log('\n--- Verification Checks ---');
console.log('Interventional Cardiologist can see Troponin High Sensitivity:', cardioLabs.includes('Troponin High Sensitivity') ? '✅ YES' : '❌ NO');
console.log('ENT Doctor can see Troponin High Sensitivity:', entLabs.includes('Troponin High Sensitivity') ? '✅ YES' : '❌ NO');
console.log('Both can see CBC:', (cardioLabs.includes('CBC') && entLabs.includes('CBC')) ? '✅ YES' : '❌ NO');

