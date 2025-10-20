# 🌍 BPApp

**BPApp** es una aplicación web enfocada en la visualización de datos y el manejo de filtros dinámicos mediante JavaScript.  
El proyecto se compone de una interfaz moderna y eficiente que facilita la interacción con información visual (por ejemplo, mapas o dashboards).

---

## 🧩 Descripción general

La aplicación presenta un **mapa interactivo** y un conjunto de **filtros configurables** que permiten manipular y visualizar datos de manera dinámica.  
Su diseño modular facilita la integración con APIs o fuentes externas de datos.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso principal |
|-------------|----------------|
| **HTML5** | Estructura semántica de la aplicación |
| **CSS3 (map.css, style.css)** | Estilos visuales y diseño responsivo |
| **JavaScript (ES6+)** | Lógica de interacción, carga dinámica de datos y control de filtros |
| **Fetch API / JSON (si aplica)** | Posible manejo de datos externos |

---

## 📂 Estructura del proyecto

```
BPApp/
│
├── index.html              # Página principal
│
├── css/
│   ├── style.css           # Estilos generales
│   └── map.css             # Estilos específicos del mapa
│
└── js/
    ├── datos.js            # Datos o configuración base de la app
    ├── filtrosToogle.js    # Lógica de activación/desactivación de filtros
    └── loading.js          # Control del estado de carga
```

---

## 🚀 Cómo ejecutar el proyecto

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/RamonLS1509/BPAppWeb.git
   ```

2. **Abre el proyecto:**
   - Ingresa al directorio:
     ```bash
     cd BPAppWeb
     ```
   - Abre `index.html` directamente en tu navegador  
     o usa un servidor local (por ejemplo, con **Live Server** en VS Code).

3. **(Opcional)** Si los datos provienen de una API, asegúrate de tener acceso a ella antes de cargar la página.

---

## 💡 Funcionalidades destacadas

- **Carga visual progresiva:** manejo del estado `loading` mediante `loading.js`.  
- **Gestión de filtros dinámicos:** activación y desactivación de filtros sin recargar la página.  
- **Datos configurables:** `datos.js` centraliza la información para mantener un flujo limpio y estructurado.  
- **Estilo adaptable:** uso de CSS modular (separación entre estilos generales y específicos del mapa).

---

## 🧠 Futuras mejoras

- [ ] Integrar librerías de visualización (por ejemplo, Leaflet.js o Chart.js).  
- [ ] Añadir soporte para datos en tiempo real (API o WebSockets).  
- [ ] Implementar un sistema de búsqueda avanzada.  
- [ ] Agregar pruebas unitarias (Jest).  

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.

1. Realiza un **fork** del proyecto.  
2. Crea una rama con tu mejora:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y asegúrate de que todo funciona.  
4. Envía un **Pull Request** con una descripción detallada.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.  
Consulta el archivo `LICENSE` para más detalles.

---

## 📬 Contacto

**Autor:** Ramón L. S.  
**Repositorio:** [github.com/RamonLS1509/BPAppWeb](https://github.com/RamonLS1509/BPAppWeb)

---

> _“Un proyecto bien estructurado es el primer paso hacia una aplicación escalable.”_
