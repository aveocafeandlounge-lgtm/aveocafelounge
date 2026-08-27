const admin = require('firebase-admin');
const serviceAccount = require('../serviceacountkey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TABLES_TO_CREATE = [
  { id: 'table-01', name: 'Table 01', seats: 6, section: 'Indoor' },
  { id: 'table-02', name: 'Table 02', seats: 6, section: 'Indoor' },
  { id: 'table-03', name: 'Table 03', seats: 6, section: 'Indoor' },
  { id: 'table-10', name: 'Table 10', seats: 6, section: 'Outdoor' },
  { id: 'table-11', name: 'Table 11', seats: 4, section: 'Outdoor' },
  { id: 'table-12', name: 'Table 12', seats: 4, section: 'Outdoor' },
  { id: 'table-13', name: 'Table 13', seats: 4, section: 'Outdoor' },
  { id: 'table-14', name: 'Table 14', seats: 10, section: 'Outdoor' },
  { id: 'table-15', name: 'Table 15', seats: 4, section: 'Outdoor' },
  { id: 'table-16', name: 'Table 16', seats: 4, section: 'Outdoor' },
  { id: 'table-17', name: 'Table 17', seats: 4, section: 'Outdoor' },
  { id: 'table-18', name: 'Table 18', seats: 4, section: 'Outdoor' },
  { id: 'table-19', name: 'Table 19', seats: 4, section: 'Outdoor' },
  { id: 'table-06', name: 'Table 06', seats: 4, section: 'Indoor' },
  { id: 'table-07', name: 'Table 07', seats: 4, section: 'Indoor' },
  { id: 'table-08', name: 'Table 08', seats: 4, section: 'Indoor' },
  { id: 'table-09', name: 'Table 09', seats: 4, section: 'Indoor' },
  { id: 'table-05', name: 'Table 05', seats: 6, section: 'Indoor' },
  { id: 'table-04', name: 'Table 04', seats: 4, section: 'Indoor' },
];

async function seedTables() {
  console.log('Starting to seed tables...');
  
  try {
    // Clear existing tables
    const existingTables = await db.collection('tables').get();
    console.log(`Found ${existingTables.size} existing tables to delete...`);
    
    const batch = db.batch();
    existingTables.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('Cleared existing tables');
    
    // Add new tables
    const newBatch = db.batch();
    TABLES_TO_CREATE.forEach(table => {
      const docRef = db.collection('tables').doc(table.id);
      newBatch.set(docRef, table);
    });
    await newBatch.commit();
    
    console.log(`Successfully seeded ${TABLES_TO_CREATE.length} tables`);
    console.log('Tables:', TABLES_TO_CREATE.map(t => t.name).join(', '));
  } catch (error) {
    console.error('Error seeding tables:', error);
  } finally {
    process.exit(0);
  }
}

seedTables();
