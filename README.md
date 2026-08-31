# Mis finanzas

App de gestión de gastos personales. Sin backend: todo se guarda en `localStorage` del navegador.

## Estructura

```
app_gastos/
├── index.html              # esqueleto HTML de la página
├── css/
│   └── styles.css          # todos los estilos
└── js/
    ├── main.js              # punto de entrada: arranca la app y conecta el botón +
    ├── icons.js              # iconos SVG y colores por categoría
    ├── state.js               # modelo de datos y persistencia en localStorage
    ├── format.js              # formateo de dinero, fechas y texto
    ├── selectors.js           # cálculos derivados (gastado, presupuesto, rentabilidad...)
    ├── ui.js                  # navegación entre pestañas, estado de la UI, toasts
    ├── modals.js              # formularios emergentes (nuevo gasto, ingreso, área, fondo...)
    └── pages/
        ├── inicio.js
        ├── gastos.js
        ├── inversion.js
        └── ajustes.js
```

## Cómo ejecutarla

El JavaScript usa módulos ES (`import`/`export`), por lo que necesita cargarse por http(s) —no funciona si abres `index.html` con doble clic (`file://`).

- **GitHub Pages / hosting**: funciona directamente en la URL publicada.
- **En local**: sirve la carpeta con un servidor estático antes de abrirla, por ejemplo:
  ```bash
  python3 -m http.server 8000
  # y abre http://localhost:8000
  ```
