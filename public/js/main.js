// ----------------------------------------------------
// 1. Variables Globales
// ----------------------------------------------------
let mapa;
let marcadorUsuario;
let puntos = [];
let puntoActual = null;
let puntaje = 0;
let lineaDistancia = null;
let racha = 0;
let acumuladoKm = 0;
let temporizador = null;

// ----------------------------------------------------
// 2. Cargar Puntos desde la API
// ----------------------------------------------------
async function cargarPuntos() {
  try {
    const res = await fetch('/api/puntos');  // Cargando los puntos desde el API
    puntos = await res.json();
    siguienteFoto();  // Muestra la primera foto del juego
  } catch (err) {
    console.error('Error al cargar los puntos:', err);  // Manejo de errores
  }
}

// ----------------------------------------------------
// 3. Mostrar la siguiente foto
// ----------------------------------------------------
function siguienteFoto() {
  console.log(puntos);  // Mostrar los puntos restantes en la consola
  if (puntos.length === 0) {
    alert("¡Juego terminado! Puntaje final: " + puntaje);  // Al terminar el juego
    reiniciarJuego();
    return;
  }

  const index = Math.floor(Math.random() * puntos.length);
  puntoActual = puntos[index];
  puntos.splice(index, 1);

  document.getElementById('photo').src = `img/${puntoActual.foto}`;  // Mostrar la foto del punto

  if (marcadorUsuario) {
    mapa.removeLayer(marcadorUsuario);  // Eliminar marcador anterior
    marcadorUsuario = null;
  }

  if (lineaDistancia) {
    mapa.removeLayer(lineaDistancia);  // Eliminar línea de distancia
    lineaDistancia = null;
  }
    // Reiniciar temporizador automático si existe
    if (temporizador) {
      clearTimeout(temporizador);
    }
  
    // Iniciar temporizador automático para pasar en 10 segundos
    temporizador = setTimeout(() => {
      siguienteFoto();
    }, 10000);
  }

// ----------------------------------------------------
// 4. Inicializar Mapa
// ----------------------------------------------------
function iniciarMapa() {
 //mapa = L.map('map').setView([-33.45, -70.66], 6);  // Ubicación inicial de Santiago
//  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    attribution: '© OpenStreetMap'
//  }).addTo(mapa);

//Mapa base
// A. Capas base
const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/' +
  'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
});

const stadiaAlidade = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
  attribution: '© Stadia Maps, OpenMapTiles, OpenStreetMap'
});

// B. Inicialización del mapa
mapa = L.map('map', {
  center: [-33.45, -70.66],  // Santiago por defecto
  zoom: 6,
  layers: [openStreetMap] // Por defecto OSM
});

// C. Control de capas base
const mapasBase = {
  "OpenStreetMap": openStreetMap,
  "Esri World Imagery": esriWorldImagery,
  "Stadia Alidade Smooth": stadiaAlidade
};

L.control.layers(mapasBase).addTo(mapa); // Control de capas base


//D.Geolocalizacion
  L.Control.geocoder({
    defaultMarkGeocode: false
  })
    .on('markgeocode', function(e) {
      const latlng = e.geocode.center;
      mapa.setView(latlng, 10);  // Cambiar vista del mapa
      ponerMarcador(latlng);
    })
    .addTo(mapa);

  mapa.on('click', function(e) {
    ponerMarcador(e.latlng);  // Poner marcador en el lugar donde el usuario haga clic
  });
}


// ----------------------------------------------------
// 5. Poner Marcador en el Mapa
// ----------------------------------------------------
function ponerMarcador(latlng) {
  if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);  // Eliminar marcador anterior
  marcadorUsuario = L.marker(latlng, { draggable: true }).addTo(mapa);  // Crear marcador draggable
}

// ----------------------------------------------------
// 6. Calcular Distancia y Actualizar Puntaje
// ----------------------------------------------------
function calcularDistancia() {
  if (!marcadorUsuario || !puntoActual) {
    alert("Debes seleccionar un punto en el mapa.");
    return;
  }

  const latlng1 = marcadorUsuario.getLatLng();
  const latlng2 = L.latLng(puntoActual.latitud, puntoActual.longitud);
  const distancia = mapa.distance(latlng1, latlng2) / 1000;  // Distancia en km

  let puntosGanados = 0;
  if (distancia <= 10) puntosGanados = 100;
  else if (distancia <= 50) puntosGanados = 75;
  else if (distancia <= 150) puntosGanados = 50;
  else if (distancia <= 300) puntosGanados = 25;

  // Lógica de racha
  if (distancia <= 50) {
    racha++;
    acumuladoKm += distancia;
    if (racha >= 3 && distancia <= 50) {
      puntosGanados += 50;  // Bonus por racha
    }
    if (racha === 3 && acumuladoKm <= 100) {
      alert("🎁 ¡Recompensa desbloqueada por Modo Historia!");  // Desbloqueo de recompensa
    }
  } else {
    racha = 0;
    acumuladoKm = 0;
  }

  puntaje += puntosGanados;

  const resultEl = document.getElementById('result');
  resultEl.innerText = `¡Estuviste a ${distancia.toFixed(2)} km! Ganaste ${puntosGanados} puntos.`;

  const barra = document.getElementById('score-bar');
  barra.innerText = `${puntaje} pts`;
  barra.style.width = `${Math.min((puntaje / 1000) * 100, 100)}%`;

  if (lineaDistancia) mapa.removeLayer(lineaDistancia);  // Eliminar línea de distancia anterior
  lineaDistancia = L.polyline([latlng1, latlng2], {
    color: 'red',
    dashArray: '6,10',
    weight: 2
  }).addTo(mapa);

  setTimeout(() => {
    resultEl.innerText = "";
    if (lineaDistancia) {
      mapa.removeLayer(lineaDistancia);  // Eliminar línea después de unos segundos
      lineaDistancia = null;
    }
    siguienteFoto();  // Mostrar la siguiente foto
  }, 10000); // Esperar 10 segundos antes de mostrar la siguiente foto
}

// ----------------------------------------------------
// 7. Reiniciar Juego
// ----------------------------------------------------
function reiniciarJuego() {
  puntaje = 0;
  racha = 0;
  acumuladoKm = 0;
  document.getElementById('score-bar').style.width = '0%';  // Resetear barra de puntuación
  document.getElementById('score-bar').innerText = '0 pts';
  cargarPuntos();  // Volver a cargar los puntos
}

// ----------------------------------------------------
// 8. Configuración de Event Listeners
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  iniciarMapa();
  cargarPuntos();  // Cargar puntos al iniciar

  document.getElementById('check').addEventListener('click', calcularDistancia);  // Botón para calcular la distancia

  document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');  // Activar/desactivar la barra lateral
    setTimeout(() => {
      mapa.invalidateSize();  // Ajustar tamaño del mapa al cambiar la barra lateral
    }, 310);
  });

  // ✅ Botón siguiente foto
  document.getElementById('BtnNxt').addEventListener('click', () => {
    siguienteFoto(); //llamada manual
  });

    // Cargar la primera imagen al inicio
    //siguienteFoto();
});

// ----------------------------------------------------
// 9. Configuracion de pistas
// ----------------------------------------------------
// Función para agregar una pista a la lista de pistas usadas
function addHintToUsedList(hintText) {
  const hintList = document.getElementById('hint-list');
  const listItem = document.createElement('li');
  listItem.textContent = hintText;  // El texto que se mostrará de la pista utilizada
  hintList.appendChild(listItem);
}

// Deshabilitar el botón de una pista y agregarla a las usadas
function useHint(button, hintText) {
  // Deshabilitar el botón para evitar más usos
  button.disabled = true;
  
  // Llamar a la función que agrega la pista a la lista
  addHintToUsedList(hintText);
}

// Mostrar pistas según el punto actual
function mostrarPistas() {
  const pistaRegion = document.getElementById('hint-region');
  const pistaComuna = document.getElementById('hint-comuna');
  const pistaCalle = document.getElementById('hint-calle');
  
  // Dependiendo de los valores de region, comuna o calle, habilitar las pistas
  if (puntoActual.region) {
    pistaRegion.disabled = true;  // Habilitar pista de región si está disponible
  } else {
    pistaRegion.disabled = false;   // Deshabilitar si no hay información de región
  }
  
  if (puntoActual.comuna) {
    pistaComuna.disabled = true;  // Habilitar pista de comuna si está disponible
  } else {
    pistaComuna.disabled = false;   // Deshabilitar si no hay información de comuna
  }
  
  if (puntoActual.calle) {
    pistaCalle.disabled = true;   // Habilitar pista de calle si está disponible
  } else {
    pistaCalle.disabled = false;    // Deshabilitar si no hay información de calle
  }
}

// Agregar los eventos de clic a los botones de pistas
document.getElementById('hint-region').addEventListener('click', function() {
  console.log("Pista Región seleccionada");
  useHint(this, 'Pista 1: Región - ' + puntoActual.region);  // Mostrar la región como pista
});

document.getElementById('hint-comuna').addEventListener('click', function() {
  console.log("Pista Comuna seleccionada");
  useHint(this, 'Pista 2: Comuna - ' + puntoActual.comuna);  // Mostrar la comuna como pista
});

document.getElementById('hint-calle').addEventListener('click', function() {
  console.log("Pista Calle seleccionada");
  useHint(this, 'Pista 3: Calle - ' + puntoActual.calle);  // Mostrar la calle como pista
});

// Llamar a la función mostrarPistas cuando se cargue un nuevo punto
function siguienteFoto() {
  if (puntos.length === 0) {
    alert("¡Juego terminado! Puntaje final: " + puntaje);  // Al terminar el juego
    reiniciarJuego();
    return;
  }

  const index = Math.floor(Math.random() * puntos.length);
  puntoActual = puntos[index];
  puntos.splice(index, 1);

  document.getElementById('photo').src = `img/${puntoActual.foto}`;  // Mostrar la foto del punto
  
  // Mostrar las pistas según el punto actual
  mostrarPistas();  

  if (marcadorUsuario) {
    mapa.removeLayer(marcadorUsuario);  // Eliminar marcador anterior
    marcadorUsuario = null;
  }

  if (lineaDistancia) {
    mapa.removeLayer(lineaDistancia);  // Eliminar línea de distancia
    lineaDistancia = null;
  }
}

