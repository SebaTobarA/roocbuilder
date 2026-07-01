# ROOC Party Builder

Herramienta web para organizar y optimizar parties en **Ragnarok Origin Classic (ROOC)**.  
Soporta **Guild League** (Campo Principal + Secundario) y **Emperium Overrun**.

## ✨ Funciones

- Importar jugadores desde Excel, CSV o texto libre (`Nick,Clase;Nick,Clase`)
- Selector de roles por slot (Tanque, Curación, Daño, Flexible) al estilo del juego
- Organización automática de parties según composición definida
- Sugerencia de distribución para jugadores sobrantes
- Drag & Drop entre parties y el pool sin asignar
- Detección de parties sin Tank o Support

## 🚀 Instalación local

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/rooc-party-builder.git
cd rooc-party-builder

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## 🏗️ Build para producción

```bash
npm run build
```

Los archivos se generan en la carpeta `dist/`.

## 🌐 Deploy en GitHub Pages

El repositorio incluye un workflow de GitHub Actions que despliega automáticamente en GitHub Pages al hacer push a `main`.

**Pasos:**
1. Sube el proyecto a GitHub.
2. Ve a **Settings → Pages → Source** y selecciona **GitHub Actions**.
3. Haz push a `main` y espera que termine el workflow.
4. Tu app estará disponible en `https://TU_USUARIO.github.io/rooc-party-builder/`

## 🛠️ Tecnologías

- [React 18](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [Lucide React](https://lucide.dev/) — iconos
- CSS custom properties (sin dependencias de UI)

## 📁 Estructura

```
src/
├── types/        # Tipos TypeScript compartidos
├── utils/        # Parseo de entradas, inferencia de roles
├── hooks/        # useCampo: lógica de jugadores, parties y slots
├── components/   # Componentes React
└── styles/       # globals.css con el sistema de diseño
```

## 📋 Hoja de ruta

- [x] V1 — Importador, selector de roles, organización automática
- [ ] V2 — Persistencia en LocalStorage, undo/redo, exportar JSON
- [ ] V3 — Algoritmo de optimización automática (IA)
