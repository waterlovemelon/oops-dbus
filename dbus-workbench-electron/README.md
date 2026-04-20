# D-Bus Workbench (Electron)

Modern D-Bus introspection, method invocation, and signal monitoring tool built with Electron and React.

## Features

- D-Bus service discovery and listing (session/system bus)
- Service introspection with hierarchical tree view
- Method invocation with argument handling
- Signal subscription and event monitoring
- Property viewing
- Postman/VS Code inspired multi-pane layout

## Technology Stack

- **Electron**: ^22.0.0 (LTS, compatible with glibc 2.31+)
- **React**: ^18.2.0 with TypeScript strict mode
- **Vite**: ^4.5.0 (stable)
- **dbus-next**: ^0.9.0 (D-Bus integration)
- **Tailwind CSS**: ^3.3.0
- **Shadcn/ui**: Modern UI components
- **Zustand**: State management
- **React Query**: Data fetching and caching

## Platform Compatibility

- **Deepin UOS 20.9+** (glibc 2.28+)
- **Deepin UOS 23**
- **Ubuntu 20.04/22.04 LTS**
- **Fedora 36+**
- **Arch Linux**

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- libdbus-1-dev

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Package for Linux

```bash
# Build .deb package
npm run build:linux-deb

# Build AppImage
npm run build:linux-appimage
```

## Project Structure

```
dbus-workbench-electron/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # Preload script
│   ├── ipc/              # IPC handlers
│   ├── dbus/             # D-Bus integration
│   └── utils/            # Utilities
├── src/                  # React renderer process
│   ├── components/       # UI components
│   ├── hooks/            # Custom hooks
│   ├── ipc/              # IPC client
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── lib/              # Utilities
└── public/               # Static assets
```

## License

MIT
