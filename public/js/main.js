let mapa;
let marcadorUsuario;
let puntos = [];
let puntoActual = null;
let puntaje = 0;

async function cargarPuntos() {
  const res = await fetch('/api/puntos');
  puntos = await res.json();
  siguienteFoto();
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

  // Reinicia animación
  photo.classList.remove('fade-in');
  void photo.offsetWidth;
  photo.src = nuevaFoto;
  photo.classList.add('fade-in');

  if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
}

function iniciarMapa() {
  mapa = L.map('map').setView([-33.45, -70.66], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);

  mapa.on('click', function(e) {
    if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
    marcadorUsuario = L.marker(e.latlng, { draggable: true }).addTo(mapa);
  });
}

function calcularDistancia() {
  if (!marcadorUsuario || !puntoActual) return;

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
  resultEl.innerText = `¡Estuviste a ${distancia.toFixed(2)} km de distancia! Ganaste ${puntosGanados} puntos.`;

  const scoreEl = document.getElementById('score');
  scoreEl.innerText = `Puntaje: ${puntaje}`;
  scoreEl.classList.add('animado');
  setTimeout(() => scoreEl.classList.remove('animado'), 300);

  actualizarBarraPuntaje(puntaje);

  // Espera 3 segundos y pasa a la siguiente imagen
  setTimeout(() => {
    resultEl.innerText = "";
    siguienteFoto();
  }, 3000);
}

// Esperar a que todo esté cargado
window.addEventListener('DOMContentLoaded', () => {
  iniciarMapa();
  cargarPuntos();
  document.getElementById('check').addEventListener('click', calcularDistancia);

  // Botón toggle para la barra lateral
  document.querySelectorAll('#toggleSidebar').forEach(button => {
    button.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const main = document.getElementById('main-content');
      sidebar.classList.toggle('active');

      // Redimensionar el mapa después de mostrar la barra
      setTimeout(() => {
        if (window.mapa) {
          mapa.invalidateSize();
        }
      }, 310);
    });
  });
});
