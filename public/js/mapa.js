//Test inicial

const mapa = L.map('map').setView([-33.4489, -70.6693], 6); // Chile centrado

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

fetch('/api/puntos')
  .then(res => res.json())
  .then(puntos => {
    puntos.forEach(p => {
      const marker = L.marker([p.latitud, p.longitud]).addTo(mapa);
      marker.bindPopup(`
        <strong>${p.usuario}</strong><br>
        <img src="fotos/${p.foto}" width="150">
      `);
    });
  });
