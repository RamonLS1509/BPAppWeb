const toggleButton = document.getElementById('toggle-filters');
const filtersContainer = document.getElementById('filters-container');
let filtersVisible = false;

// Al cargar, filtros ocultos y sin espacio
filtersContainer.classList.add("hidden");

toggleButton.addEventListener('click', () => {
  filtersVisible = !filtersVisible;

  if (filtersVisible) {
    filtersContainer.classList.remove("hidden");
    filtersContainer.style.maxHeight = filtersContainer.scrollHeight + "px";
    filtersContainer.style.opacity = "1";
    filtersContainer.style.pointerEvents = "auto";
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M6 18L18 6M6 6l12 12" />
      </svg>
      Ocultar filtros`;
  } else {
    filtersContainer.classList.add("hidden");
    filtersContainer.style.maxHeight = "0px";
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V20a1 1 0 01-1.447.894l-4-2A1 1 0 019 18V13.414L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
      Mostrar filtros`;
  }
});

// Modo escritorio
const mediaQuery = window.matchMedia('(min-width: 1024px)');
function handleScreenChange(e) {
  if (e.matches) {
    filtersContainer.classList.remove("hidden");
    filtersContainer.style.maxHeight = 'none';
    filtersContainer.style.opacity = '1';
    filtersContainer.style.pointerEvents = 'auto';
  } else if (!filtersVisible) {
    filtersContainer.classList.add("hidden");
  }
}
mediaQuery.addEventListener('change', handleScreenChange);
handleScreenChange(mediaQuery);


tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'sans-serif'] },
          colors: {
            'bp-green': '#00704A',
            'bp-yellow': '#FFC72C',
            'bp-light-green': '#009966',
            'bp-gray': '#f7f8fa'
          },
          boxShadow: {
            'soft': '0 8px 24px rgba(0,0,0,0.08)',
            'inner': 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }
        }
      }
    }