const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Alanna190920',
      database: 'inventario'
    });

    console.log('✅ Conexión exitosa a MySQL');

    const [rows] = await connection.execute('SELECT 1');
    console.log('Resultado:', rows);

    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testDB();
