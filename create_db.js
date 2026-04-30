const { Client } = require('pg');
async function run() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: 'postgres'
    });
    try {
        await client.connect();
        await client.query('CREATE DATABASE nama_medical_web');
        console.log('Database created');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
