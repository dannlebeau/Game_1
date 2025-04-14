const fs = require('fs');
const { Pool } = require('pg');

// Configura tu conexión PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Game_1',
  password: '3022',
  port: 5432, // o el puerto que uses
});

const puntos = JSON.parse(fs.readFileSync('puntos.json', 'utf-8'));

async function insertarPuntos() {
  for (const punto of puntos) {
    const { id, usuario, latitud, longitud, foto } = punto;

    try {
      await pool.query(
        `INSERT INTO puntos (id, usuario, foto, geom)
         VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
         ON CONFLICT (id) DO NOTHING`,
        [id, usuario, foto, longitud, latitud]
      );
      console.log(`✅ Punto insertado: ${id}`);
    } catch (err) {
      console.error(`❌ Error insertando ${id}:`, err);
    }
  }

  await pool.end();
}

insertarPuntos();
