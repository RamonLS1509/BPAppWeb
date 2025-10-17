// mapa.js (versión corregida y más defensiva)

let map;
let allMarkers = [];

const CACHE_KEY = 'carburantes_api_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en ms

const COMBUSTIBLES = [
  { key: 'Precio Gasolina 95 E5', label: 'G95 E5' },
  { key: 'Precio Gasoleo A', label: 'GA' },
  { key: 'Precio Gasolina 98 E5', label: 'G98 E5' },
  { key: 'Precio Gasoleo B', label: 'GB' },
  { key: 'Precio Gases licuados del petróleo', label: 'GLP' },
  { key: 'Precio Gas Natural Comprimido', label: 'GNC' },
  { key: 'Precio Gasoleo Premium', label: 'G. Prem' },
];

// ---------------------------
// Utilidad: comprobar horario
// ---------------------------
function isGasolineraOpen(horario) {
  try {
    if (typeof horario !== 'string' || horario.trim() === '') return false;
    if (horario.toUpperCase().includes('24H')) return true;

    const match = horario.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (!match) return false;

    const startHour = parseInt(match[1], 10);
    const startMinute = parseInt(match[2], 10);
    const endHour = parseInt(match[3], 10);
    const endMinute = parseInt(match[4], 10);

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (isNaN(start) || isNaN(end)) return false;

    // Horario que pasa de medianoche
    if (end < start) {
      return current >= start || current < end;
    } else {
      return current >= start && current < end;
    }
  } catch (e) {
    console.error('isGasolineraOpen error:', e, 'horario:', horario);
    return false;
  }
}

// -------------------------------------------
// Fetch + caché (localStorage) con defensa
// -------------------------------------------
async function fetchEstaciones() {
  try {
    // Intentamos leer cache
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_DURATION && cached.data && Array.isArray(cached.data.ListaEESSPrecio)) {
          console.log('✅ Cargando datos desde caché local (menos de 24h).');
          processData(cached.data);
          return;
        } else {
          console.log('🕒 Caché expirada o inválida. Se eliminará y se solicitará nuevo fetch.');
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (err) {
        console.warn('⚠️ Error parseando caché local, se eliminará. Detalle:', err);
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // Realizamos fetch con comprobación de status
    console.log('🌐 Solicitando datos a la API del Ministerio...');
    const resp = await fetch('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres', {
      method: 'GET',
      cache: 'no-store'
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error('Respuesta no OK: ' + resp.status + ' ' + resp.statusText + ' — ' + txt.slice(0, 200));
    }

    // parse JSON de forma segura
    let data;
    try {
      data = await resp.json();
    } catch (err) {
      const txt = await resp.text().catch(() => '');
      throw new Error('JSON parse error: ' + err.message + ' ; body: ' + txt.slice(0, 400));
    }

    if (!data || !Array.isArray(data.ListaEESSPrecio)) {
      throw new Error('Estructura inesperada de la API: falta ListaEESSPrecio');
    }

    // Guardar en caché completa (timestamp + data)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      console.log('💾 Datos guardados en localStorage (cache).');
    } catch (err) {
      console.warn('⚠️ No se pudo guardar la cache en localStorage:', err);
    }

    processData(data);

  } catch (error) {
    console.error('❌ Error al obtener los datos de la API:', error);

    // Mostrar popup claro en el mapa (si existe)
    if (map && typeof L !== 'undefined') {
      L.popup()
        .setLatLng([40.416775, -3.703790])
        .setContent('❌ Error al cargar los datos de la API. Revisa consola para más info.')
        .openOn(map);
    }

    // Como fallback, si hay cache aunque expirado, intenta usarla (mejor que nada)
    try {
      const fallback = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      if (fallback && fallback.data && Array.isArray(fallback.data.ListaEESSPrecio)) {
        console.warn('⚠️ Usando caché como fallback (aunque pudiera estar expirada).');
        processData(fallback.data);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
}

// ----------------------------
// Procesar datos y dejarlos "limpios"
// ----------------------------
function processData(data) {
  try {
    const rawList = Array.isArray(data.ListaEESSPrecio) ? data.ListaEESSPrecio : [];
    const estacionesBP = rawList
      .filter(e => e && e['Rótulo'] && typeof e['Rótulo'] === 'string' && e['Rótulo'].toUpperCase().includes('BP'))
      .map(e => {
        // defensivo: claves lat/long pueden faltar o venir con coma
        const safeLat = (e.Latitud && typeof e.Latitud === 'string') ? e.Latitud.replace(',', '.').trim() : '';
        const longKey = e['Longitud (WGS84)'] ? 'Longitud (WGS84)' : (e['Longitud'] ? 'Longitud' : null);
        const safeLon = longKey && e[longKey] && typeof e[longKey] === 'string' ? e[longKey].replace(',', '.').trim() : '';

        return {
          ...e,
          Latitud: safeLat,
          'Longitud (WGS84)': safeLon
        };
      });

    window.estacionesData = estacionesBP;
    loadProvinces(estacionesBP);
    filterAndRenderStations();

    console.log('📍 Estaciones BP procesadas:', estacionesBP.length);
  } catch (err) {
    console.error('processData error:', err);
  }
}

// ----------------------------
// Filtrado y render
// ----------------------------
function filterAndRenderStations() {
  try {
    const fuelKeyEl = document.getElementById('fuel-filter');
    const openNowEl = document.getElementById('open-now-filter');
    const searchEl = document.getElementById('search-input');
    const provinceEl = document.getElementById('province-filter');

    const fuelKey = fuelKeyEl ? fuelKeyEl.value : '';
    const openNow = openNowEl ? openNowEl.checked : false;
    const searchText = searchEl ? (searchEl.value || '').toLowerCase() : '';
    const selectedProvince = provinceEl ? provinceEl.value : '';

    const estacionesData = Array.isArray(window.estacionesData) ? window.estacionesData : [];

    const filtered = estacionesData.filter(estacion => {
      if (!estacion) return false;

      // combustible
      if (fuelKey && (!estacion[fuelKey] || estacion[fuelKey] === '')) return false;

      // abiertas ahora
      if (openNow && !isGasolineraOpen(estacion.Horario)) return false;

      // provincia
      if (selectedProvince && (!estacion.Provincia || estacion.Provincia !== selectedProvince)) return false;

      // busqueda texto
      if (searchText) {
        const rotulo = (estacion['Rótulo'] || '').toLowerCase();
        const direccion = (estacion['Dirección'] || '').toLowerCase();
        if (!rotulo.includes(searchText) && !direccion.includes(searchText)) return false;
      }

      return true;
    });

    renderMarkers(filtered);
  } catch (err) {
    console.error('filterAndRenderStations error:', err);
  }
}

// ----------------------------
// Dibujar marcadores
// ----------------------------
function renderMarkers(data) {
  try {
    // limpiar anteriores
    allMarkers.forEach(m => {
      try { map.removeLayer(m); } catch (e) { /* ignore */ }
    });
    allMarkers = [];

    let bounds = L.latLngBounds();
    let markersAdded = 0;

    data.forEach(estacion => {
      const lat = parseFloat(estacion.Latitud);
      const lon = parseFloat(estacion['Longitud (WGS84)']);

      if (isNaN(lat) || isNaN(lon)) return;

      const horario = estacion.Horario || 'Horario no disponible';
      const abierta = isGasolineraOpen(horario);
      const status = abierta ? '🟢 ABIERTA AHORA' : '🔴 CERRADA AHORA';

      let preciosHtml = '';
      COMBUSTIBLES.forEach(p => {
        const precioRaw = estacion[p.key];
        const precio = (typeof precioRaw === 'string') ? precioRaw.replace(',', '.').trim() : '';
        if (precio) {
          preciosHtml += `<div style="font-size:0.9em;"><strong>${p.label}:</strong> ${precio} €/L</div>`;
        }
      });

      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const popupHtml = `
        <div style="min-width:180px;">
          <strong style="color:#00704A;font-size:1.05em">${estacion['Rótulo'] || 'Estación'}</strong>
          <div style="font-size:0.9em;margin-bottom:6px;">${estacion['Dirección'] || ''}</div>
          <div style="margin-bottom:6px;"><strong>${status}</strong></div>
          <hr>
          ${preciosHtml || '<div style="color:#b91c1c;">Precios no disponibles</div>'}
          <details style="margin-top:6px;font-size:0.9em;"><summary style="font-weight:bold;color:#555;">Horario</summary><div style="padding-left:8px;">${(horario || '').replace(/\n/g,'<br>')}</div></details>
          <a href="${directionsUrl}" target="_blank" style="display:inline-block;margin-top:8px;padding:6px 10px;background:#00704A;color:white;text-decoration:none;border-radius:6px;">📍 Cómo llegar</a>
        </div>
      `;

      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(popupHtml);
      allMarkers.push(marker);
      bounds.extend([lat, lon]);
      markersAdded++;
    });

    if (markersAdded > 0) {
      try { map.fitBounds(bounds, { padding: [50, 50] }); } catch(e) { console.warn('fitBounds fallo:', e); }
    } else {
      L.popup().setLatLng([40.416775, -3.703790]).setContent('🚫 No se encontraron gasolineras BP con el filtro aplicado.').openOn(map);
    }
  } catch (err) {
    console.error('renderMarkers error:', err);
  }
}

// ----------------------------
// Cargar provincias en select
// ----------------------------
function loadProvinces(estaciones) {
  try {
    const provinceSelect = document.getElementById('province-filter');
    if (!provinceSelect) return;

    provinceSelect.innerHTML = '<option value="">Todas las provincias</option>';
    const provincias = [...new Set(estaciones.map(e => e.Provincia).filter(Boolean))].sort();

    provincias.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      provinceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('loadProvinces error:', err);
  }
}

// ----------------------------
// Inicialización DOMContentLoaded
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Inicializar mapa
    map = L.map('map').setView([40.416775, -3.703790], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Poblar select de combustibles
    const fuelFilterSelect = document.getElementById('fuel-filter');
    if (fuelFilterSelect) {
      COMBUSTIBLES.forEach(p => {
        const option = document.createElement('option');
        option.value = p.key;
        option.textContent = p.label;
        fuelFilterSelect.appendChild(option);
      });
      fuelFilterSelect.addEventListener('change', filterAndRenderStations);
    }

    const openNowEl = document.getElementById('open-now-filter');
    if (openNowEl) openNowEl.addEventListener('change', filterAndRenderStations);

    const searchEl = document.getElementById('search-input');
    if (searchEl) searchEl.addEventListener('input', filterAndRenderStations);

    const provinceEl = document.getElementById('province-filter');
    if (provinceEl) provinceEl.addEventListener('change', filterAndRenderStations);

    // Llamamos al fetch (usa cache si existe)
    fetchEstaciones();
  } catch (err) {
    console.error('DOMContentLoaded init error:', err);
  }
});
