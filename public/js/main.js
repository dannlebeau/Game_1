let mapa;
let marcadorUsuario;
let puntos = [];
let puntoActual = null;
let puntaje = 0;
let lineaDistancia = null;

async function cargarPuntos() {
  try {
    const res = await fetch('/api/puntos');
    puntos = await res.json();
    siguienteFoto();
  } catch (err) {
    console.error('Error al cargar los puntos:', err);
  }
}

function siguienteFoto() {
  if (puntos.length === 0) {
    document.getElementById('photo').src = "";
    alert("¡Juego terminado!");
    return;
  }

  const index = Math.floor(Math.random() * puntos.length);
  puntoActual = puntos[index];
  puntos.splice(index, 1);

  const nuevaFoto = `img/${puntoActual.foto}`;
  const photo = document.getElementById('photo');
  photo.src = nuevaFoto;

  if (marcadorUsuario) {
    mapa.removeLayer(marcadorUsuario);
    marcadorUsuario = null;
  }

  if (lineaDistancia) {
    mapa.removeLayer(lineaDistancia);
    lineaDistancia = null;
  }
}

function iniciarMapa() {
  mapa = L.map('map').setView([-33.45, -70.66], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);

  // Barra de búsqueda con Leaflet Control Geocoder
  L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on('markgeocode', function(e) {
      const latlng = e.geocode.center;
      mapa.setView(latlng, 10);

      // Simula clic de usuario al buscar
      if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
      marcadorUsuario = L.marker(latlng, { draggable: true }).addTo(mapa);
    })
    .addTo(mapa);

  // Permitir clic manual
  mapa.on('click', function(e) {
    if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
    marcadorUsuario = L.marker(e.latlng, { draggable: true }).addTo(mapa);
  });
}

function calcularDistancia() {
  if (!marcadorUsuario || !puntoActual) {
    alert("Debes seleccionar un punto en el mapa.");
    return;
  }

  const latlng1 = marcadorUsuario.getLatLng();
  const latlng2 = L.latLng(puntoActual.latitud, puntoActual.longitud);
  const distancia = mapa.distance(latlng1, latlng2) / 1000;

  let puntosGanados = 0;
  if (distancia <= 10) puntosGanados = 100;
  else if (distancia <= 50) puntosGanados = 75;
  else if (distancia <= 150) puntosGanados = 50;
  else if (distancia <= 300) puntosGanados = 25;

  puntaje += puntosGanados;

  const resultEl = document.getElementById('result');
  resultEl.innerText = `¡Estuviste a ${distancia.toFixed(2)} km! Ganaste ${puntosGanados} puntos.`;

  // Actualiza barra de puntaje
  const barra = document.getElementById('score-bar');
  barra.innerText = `${puntaje} pts`;
  barra.style.width = `${Math.min((puntaje / 1000) * 100, 100)}%`;

  // Dibuja línea entre el punto marcado y el real
  if (lineaDistancia) mapa.removeLayer(lineaDistancia);
  lineaDistancia = L.polyline([latlng1, latlng2], {
    color: 'red',
    dashArray: '6,10',
    weight: 2
  }).addTo(mapa);

  // Avanza en 3 segundos
  setTimeout(() => {
    resultEl.innerText = "";
    if (lineaDistancia) {
      mapa.removeLayer(lineaDistancia);
      lineaDistancia = null;
    }
    siguienteFoto();
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarMapa();
  cargarPuntos();

  document.getElementById('check').addEventListener('click', calcularDistancia);

  document.querySelectorAll('#toggleSidebar').forEach(button => {
    button.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('active');
      setTimeout(() => {
        if (mapa) mapa.invalidateSize();
      }, 310);
    });
  });
});
