# CyberPulse - VS Code Extension

Extensión de Visual Studio Code para **CyberPulse** - Agente de contenido de ciberseguridad para LinkedIn.

## Features

- **Sidebar Panel** - CyberPulse integrado en la barra lateral de VS Code
- **Editor Tab** - Abre CyberPulse como pestaña de editor completa
- **Status Bar** - Acceso rápido desde la barra de estado
- **Sin salir del editor** - Genera posts para LinkedIn mientras codeas

## Requisitos

- VS Code 1.74+
- Node.js 18+ (para desarrollo)

## Instalación

### Desde archivo .vsix

```bash
# Empaquetar la extensión
npm install -g @vscode/vsce
vsce package

# Instalar en VS Code
# Click en Extensions (Ctrl+Shift+X) → "..." → "Install from VSIX"
```

### Desde código fuente

```bash
# 1. Clonar o copiar esta carpeta
cd vscode-extension

# 2. Instalar dependencias
npm install

# 3. Compilar
npm run compile

# 4. Abrir en VS Code
# Presiona F5 para abrir ventana de desarrollo
```

## Uso

### Abrir CyberPulse

| Método | Acción |
|--------|--------|
| **Sidebar** | Click en el icono de pulse en la barra de actividades (izquierda) |
| **Command Palette** | `Ctrl+Shift+P` → "CyberPulse: Open" |
| **Status Bar** | Click en "CyberPulse" en la barra inferior derecha |

### Configuración

Abre settings (`Ctrl+,`) y busca "CyberPulse":

```json
{
  "cyberpulse.url": "https://6xyrrp7uai5gg.kimi.page",
  "cyberpulse.apiUrl": "",
  "cyberpulse.apiKey": ""
}
```

| Setting | Descripción | Default |
|---------|-------------|---------|
| `cyberpulse.url` | URL de CyberPulse | URL deployada |
| `cyberpulse.apiUrl` | URL del backend API | (vacío = usa url) |
| `cyberpulse.apiKey` | API Key para auth | (vacío) |

### Usar tu instancia local

Si corres CyberPulse localmente con Docker:

```json
{
  "cyberpulse.url": "http://localhost:3001"
}
```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar en watch mode
npm run watch

# Abrir ventana de desarrollo (con F5 en VS Code)
# Presiona Ctrl+Shift+P → "Developer: Reload Window" para recargar

# Empaquetar para distribución
vsce package
```

## Estructura

```
vscode-extension/
├── package.json           # Configuración de la extensión
├── tsconfig.json          # TypeScript config
├── src/
│   └── extension.ts       # Código principal (webview + comandos)
└── README.md
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `CyberPulse: Open` | Abre CyberPulse en editor tab |
| `CyberPulse: Open Settings` | Abre configuración de CyberPulse |

## Notas

- La extensión carga CyberPulse via iframe con sandbox seguro
- Comunicación bidireccional via `postMessage` (preparada para futuras features)
- El contexto se mantiene al cambiar de pestaña (`retainContextWhenHidden`)
