# ⛽ BPApp — Estaciones BP en España

**BPApp** es una aplicación web moderna que te permite localizar estaciones de servicio **BP** en España, con datos actualizados en tiempo real sobre precios de carburantes, horarios y disponibilidad.  

Su diseño está optimizado para **dispositivos móviles**, con una interfaz minimalista, rápida y accesible.

---

## 🧭 Características principales

- 🗺️ **Mapa interactivo** con Leaflet mostrando todas las estaciones BP.
- ⚡ **Caché inteligente (24h)**: los datos se guardan en `localStorage` para cargar instantáneamente en visitas posteriores.
- 🔍 **Filtros avanzados**: busca por nombre, provincia, tipo de combustible o estaciones abiertas actualmente.
- 📱 **Diseño responsive 2025**: limpio, elegante y compatible con cualquier dispositivo.
- 💚 **Donaciones por PayPal** integradas en el menú superior.
- 👤 **Nueva página “Sobre mí”** con enlaces a GitHub y LinkedIn.
- 🔄 **Animación de carga opcional**, mejorando la experiencia de usuario móvil.

---

## 🧩 Tecnologías utilizadas

| Tecnología | Descripción |
|-------------|--------------|
| **HTML5 / TailwindCSS** | Diseño moderno y adaptable |
| **Leaflet.js** | Visualización de mapas interactivos |
| **JavaScript (ES6+)** | Lógica, filtros, y gestión de datos |
| **Fetch API + LocalStorage** | Carga eficiente y almacenamiento local |
| **PayPal** | Sistema de donaciones integrado |
| **GitHub / LinkedIn** | Enlaces personales en la página “Sobre mí” |

---

## 📂 Estructura del proyecto

```
BPApp/
│
├── index.html             # Página principal con mapa y filtros
├── sobre-mi.html          # Página "Sobre mí" con perfil y enlaces
│
├── css/
│   ├── style.css          # Estilos generales
│
└── js/
    ├── datos.js           # Carga de datos y lógica de filtrado
    ├── filtrosToogle.js   # Control de visibilidad de filtros
```

---

## 🚀 Cómo ejecutar el proyecto

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/RamonLS1509/BPAppWeb.git
   ```

2. **Accede al proyecto:**
   ```bash
   cd BPAppWeb
   ```

3. **Abre el proyecto:**
   - Puedes abrir el archivo `index.html` directamente en tu navegador.
   - O ejecutar un servidor local (por ejemplo con la extensión *Live Server* de VS Code).

4. **Disfruta de una carga más rápida:**  
   La primera carga guarda los datos de la API durante 24 horas.  
   Las siguientes visitas se cargarán al instante desde la caché local.

---

## 💚 Donaciones

Si este proyecto te ha resultado útil, puedes **invitarme a un café ☕** y ayudarme a seguir mejorando:

👉 [**Donar con PayPal**](https://paypal.me/ramonlopezsalmeron)

Cada contribución, por pequeña que sea, me ayuda a mantener y optimizar esta aplicación gratuita. ¡Gracias por tu apoyo! 🙌

---

## 👤 Página “Sobre mí”

La página [**sobre-mi.html**](./sobre-mi.html) incluye:
- Mi presentación personal.  
- Enlaces a **GitHub** y **LinkedIn**.  
- Una invitación a colaborar o donar mediante PayPal.  
- Diseño coherente con el resto del proyecto (verde BP + amarillo BP).  

---

## 🤝 Contribuciones

¿Quieres mejorar el proyecto?  
¡Perfecto! Sigue estos pasos:

1. Haz un **fork** del repositorio.  
2. Crea una nueva rama:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y pruébalos.  
4. Envía un **Pull Request** con una descripción clara.

---

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**.  
Puedes usarlo libremente, siempre mencionando la autoría original.

---

## 📬 Contacto

**Autor:** Ramón López Salmerón  
**GitHub:** [github.com/RamonLS1509](https://github.com/RamonLS1509)  
**LinkedIn:** [linkedin.com/in/tuusuario](https://linkedin.com/in/tuusuario)  
**PayPal:** [paypal.me/ramonlopezsalmeron](https://paypal.me/ramonlopezsalmeron)