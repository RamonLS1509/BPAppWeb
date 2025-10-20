let map;
let allMarkers = [];

const CACHE_KEY = 'carburantes_api_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

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
// Fetch + caché (localStorage)
// -------------------------------------------
async function fetchEstaciones() {
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_DURATION && cached.data && Array.isArray(cached.data.ListaEESSPrecio)) {
          console.log('✅ Cache vigente, no es necesario nuevo fetch.');
          return; // Ya se cargó antes desde el cache
        } else {
          console.log('🕒 Caché expirada o inválida, se solicitará nueva.');
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    console.log('🌐 Solicitando datos a la API del Ministerio...');
    const resp = await fetch(
      'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres',
      { method: 'GET', cache: 'no-store' }
    );

    if (!resp.ok) throw new Error(`Respuesta no OK: ${resp.status}`);

    const data = await resp.json();
    if (!data || !Array.isArray(data.ListaEESSPrecio))
      throw new Error('Estructura inesperada de la API');

    // Guardar cache
    const filtered = data.ListaEESSPrecio.filter(e => e['Rótulo'] && e['Rótulo'].toUpperCase().includes('BP'));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: { ListaEESSPrecio: filtered } }));
    console.log('💾 Datos guardados en localStorage.');
    processData(data);

  } catch (error) {
    console.error('❌ Error al obtener datos de la API:', error);
    if (map && typeof L !== 'undefined') {
      L.popup()
        .setLatLng([40.416775, -3.703790])
        .setContent('❌ Error al cargar los datos de la API.')
        .openOn(map);
    }

    // Intentar usar cache vieja como fallback
    try {
      const fallback = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      if (fallback?.data?.ListaEESSPrecio) {
        console.warn('⚠️ Usando caché antigua como fallback.');
        processData(fallback.data);
      }
    } catch (e) { }
  }
}

// ----------------------------
// Procesar datos
// ----------------------------
function processData(data) {
  try {
    const rawList = Array.isArray(data.ListaEESSPrecio) ? data.ListaEESSPrecio : [];
    const estacionesBP = rawList
      .filter(e => e?.['Rótulo']?.toUpperCase().includes('BP'))
      .map(e => {
        const safeLat = e.Latitud?.replace(',', '.').trim() || '';
        const longKey = e['Longitud (WGS84)'] ? 'Longitud (WGS84)' : (e['Longitud'] ? 'Longitud' : null);
        const safeLon = longKey ? e[longKey]?.replace(',', '.').trim() : '';
        return { ...e, Latitud: safeLat, 'Longitud (WGS84)': safeLon };
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
// Filtros y renderizado
// ----------------------------
function filterAndRenderStations() {
  try {
    const fuelKey = document.getElementById('fuel-filter')?.value || '';
    const openNow = document.getElementById('open-now-filter')?.checked || false;
    const searchText = document.getElementById('search-input')?.value.toLowerCase() || '';
    const selectedProvince = document.getElementById('province-filter')?.value || '';

    const estacionesData = Array.isArray(window.estacionesData) ? window.estacionesData : [];

    const filtered = estacionesData.filter(estacion => {
      if (!estacion) return false;
      if (fuelKey && !estacion[fuelKey]) return false;
      if (openNow && !isGasolineraOpen(estacion.Horario)) return false;
      if (selectedProvince && estacion.Provincia !== selectedProvince) return false;

      const rotulo = (estacion['Rótulo'] || '').toLowerCase();
      const direccion = (estacion['Dirección'] || '').toLowerCase();
      return !searchText || rotulo.includes(searchText) || direccion.includes(searchText);
    });

    

    renderMarkers(filtered);
  } catch (err) {
    console.error('filterAndRenderStations error:', err);
  }
}

// ----------------------------
// Dibujar marcadores en el mapa
// ----------------------------
function renderMarkers(data) {
  allMarkers.forEach(m => { try { map.removeLayer(m); } catch { } });
  allMarkers = [];

  const bounds = L.latLngBounds();
  let added = 0;

  data.forEach(estacion => {
    const lat = parseFloat(estacion.Latitud);
    const lon = parseFloat(estacion['Longitud (WGS84)']);
    if (isNaN(lat) || isNaN(lon)) return;

    const abierta = isGasolineraOpen(estacion.Horario);
    const status = abierta ? '🟢 ABIERTA AHORA' : '🔴 CERRADA AHORA';

    let preciosHtml = '';
    COMBUSTIBLES.forEach(p => {
      const precio = estacion[p.key]?.replace(',', '.').trim();
      if (precio) preciosHtml += `<div><strong>${p.label}:</strong> ${precio} €/L</div>`;
    });

    const popupHtml = `
      <div style="min-width:180px;">
        <strong style="color:#00704A;font-size:1.05em">${estacion['Rótulo'] || 'Estación'}</strong>
        <div style="font-size:0.9em;margin-bottom:6px;">${estacion['Dirección'] || ''}</div>
        <div style="margin-bottom:6px;"><strong>${status}</strong></div>
        <hr>
        ${preciosHtml || '<div style="color:#b91c1c;">Precios no disponibles</div>'}
        <details style="margin-top:6px;font-size:0.9em;">
          <summary style="font-weight:bold;color:#555;">Horario</summary>
          <div style="padding-left:8px;">${(estacion.Horario || '').replace(/\n/g, '<br>')}</div>
        </details>
        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}"
           target="_blank"
           style="display:inline-block;margin-top:8px;padding:6px 10px;background:#00704A;color:white;text-decoration:none;border-radius:6px;">
           📍 Cómo llegar
        </a>
      </div>`;

    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(popupHtml);
    allMarkers.push(marker);
    bounds.extend([lat, lon]);
    added++;
  });

  if (added > 0) map.fitBounds(bounds, { padding: [50, 50] });
  else L.popup().setLatLng([40.416775, -3.703790]).setContent('🚫 No se encontraron gasolineras.').openOn(map);
}

// ----------------------------
// Provincias
// ----------------------------
function loadProvinces(estaciones) {
  const select = document.getElementById('province-filter');
  if (!select) return;
  select.innerHTML = '<option value="">Todas las provincias</option>';
  [...new Set(estaciones.map(e => e.Provincia).filter(Boolean))].sort().forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
}

// ----------------------------
// Inicialización rápida (con cache instantánea)
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Inicializar mapa
    map = L.map('map').setView([40.416775, -3.703790], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Poblar select combustibles
    const fuelSelect = document.getElementById('fuel-filter');
    if (fuelSelect) {
      COMBUSTIBLES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.key;
        opt.textContent = p.label;
        fuelSelect.appendChild(opt);
      });
      fuelSelect.addEventListener('change', filterAndRenderStations);
    }

    // Listeners de filtros
    ['open-now-filter', 'search-input', 'province-filter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'search-input' ? 'input' : 'change', filterAndRenderStations);
    });

    // ⚡ PRIMERA CARGA: usar cache instantáneamente si existe
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_DURATION && cached.data?.ListaEESSPrecio) {
          console.log('⚡ Cargando instantáneamente desde caché local.');
          processData(cached.data);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // 🌐 Segundo paso: actualizar en segundo plano
    fetchEstaciones();

  } catch (err) {
    console.error('DOMContentLoaded init error:', err);
  }
});
