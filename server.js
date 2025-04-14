const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para obtener los datos geográficos
app.get('/api/puntos', (req, res) => {
    const data = fs.readFileSync(path.join(__dirname, 'data/puntos.json'));
    res.json(JSON.parse(data));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
