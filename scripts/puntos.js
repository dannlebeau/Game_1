const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  try {
    // Obtén la ruta del archivo JSON
    const filePath = path.join(process.cwd(), 'data', 'puntos.json');
    
    // Lee el archivo JSON
    const data = fs.readFileSync(filePath, 'utf8');
    
    // Responde con los datos como JSON
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
    res.status(500).json({ error: 'No se pudo cargar los puntos.' });
  }
}
