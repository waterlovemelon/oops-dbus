# Electron D-Bus Workbench Design Specification

**Date:** 2026-04-17
**Status:** Draft - Pending Review
**Author:** Claude Code
**Scope:** Full rewrite of Qt Quick D-Bus workbench to Electron

---

## Context

The current D-Bus workbench is a Qt Quick/QML application with C++ backend providing D-Bus service discovery, introspection, method invocation, and signal monitoring. The user wants to rewrite it with Electron for improved UI/UX flexibility using React and modern web technologies.

**Key motivations:**
- Better UI/UX with web technologies and modern component libraries
- Leverage React ecosystem and Shadcn/ui components
- Improve developer experience with TypeScript and Vite tooling
- Maintain full feature parity with existing application

**Current features to preserve:**
- D-Bus service discovery and listing (session/system bus)
- Service introspection with hierarchical tree view
- Method invocation with argument handling
- Signal subscription and event monitoring
- Property viewing
- Postman/VS Code inspired multi-pane layout

---

## Deepin UOS Compatibility

### System Requirements

**Minimum Requirements:**
- **OS**: Deepin UOS 20.9+ or Deepin UOS 23
- **Architecture**: x86_64 (amd64), arm64
- **glibc**: >= 2.31 (ships with Debian 10+)
- **libdbus**: >= 1.12.0
- **Memory**: >= 512 MB RAM
- **Disk**: >= 200 MB for installation

**Tested Platforms:**
- Deepin UOS 20.9 (Debian 10 based, glibc 2.28)
- Deepin UOS 23 (Debian 12 based, glibc 2.36)
- Ubuntu 20.04/22.04 LTS
- Fedora 36+
- Arch Linux (rolling)

### Dependency Version Strategy

**Why Conservative Versions:**
- Deepin UOS 20 ships with older system libraries
- Electron 22 is the last version supporting glibc 2.28+
- Node.js 16 LTS is stable and widely available in UOS repositories
- Avoids glibc version conflicts with system libraries

**Native Dependencies:**
```bash
# Build dependencies (available in Deepin UOS repos)
sudo apt install -y
  build-essential
  libdbus-1-dev
  pkg-config
  python3
  nodejs
  npm
```

### Packaging for Deepin UOS

**Recommended Format: .deb Package**

```bash
# Build .deb for Deepin UOS
npm run build:linux-deb

# Output: dbus-workbench-electron_1.0.0_amd64.deb
```

**Package Structure:**
```
dbus-workbench-electron_1.0.0_amd64.deb
├── usr/
│   ├── bin/dbus-workbench-electron
│   ├── lib/dbus-workbench-electron/
│   │   └── [application files]
│   └── share/
│       ├── applications/dbus-workbench-electron.desktop
│       ├── icons/hicolor/[sizes]/apps/dbus-workbench-electron.png
│       └── doc/dbus-workbench-electron/
└── DEBIAN/
    ├── control
    ├── postinst
    └── prerm
```

**Control File (DEBIAN/control):**
```
Package: dbus-workbench-electron
Version: 1.0.0
Section: devel
Priority: optional
Architecture: amd64
Depends:
  libc6 (>= 2.28),
  libdbus-1-3 (>= 1.12.0),
  libgtk-3-0,
  libnotify4,
  libnss3,
  libxss1,
  libxtst6,
  xdg-utils
Maintainer: [Your Name] <your.email@example.com>
Description: D-Bus workbench application
 Modern D-Bus introspection, method invocation, and signal
 monitoring tool built with Electron and React.
```

**Alternative: AppImage (Universal)**

AppImage is self-contained and doesn't depend on system Node.js:
```bash
# Build AppImage
npm run build:linux-appimage

# Output: D-Bus Workbench-1.0.0-x86_64.AppImage
```

**Installation:**
```bash
# Method 1: .deb package (recommended for Deepin UOS)
sudo dpkg -i dbus-workbench-electron_1.0.0_amd64.deb
sudo apt-get install -f  # Fix dependencies

# Method 2: AppImage (no installation required)
chmod +x D-Bus\ Workbench-1.0.0-x86_64.AppImage
./D-Bus\ Workbench-1.0.0-x86_64.AppImage
```

### Testing on Deepin UOS

**Pre-release Testing Checklist:**
- [ ] Test installation from .deb package
- [ ] Verify all dependencies resolve correctly
- [ ] Test D-Bus connection (session and system bus)
- [ ] Test on clean Deepin UOS 20.9 VM
- [ ] Test on clean Deepin UOS 23 VM
- [ ] Verify desktop integration (menu entry, icons)
- [ ] Test Chinese localization (if applicable)
- [ ] Verify file associations work
- [ ] Test uninstall removes all files

**CI/CD Testing Matrix:**
```yaml
# .github/workflows/test.yml
matrix:
  os:
    - deepin-uos-20.9
    - deepin-uos-23
    - ubuntu-20.04
    - ubuntu-22.04
  node:
    - 16
    - 18
  arch:
    - x64
    - arm64
```

---

## Architecture

### Technology Stack

**Core Platform:**
- **Electron**: ^22.0.0 (LTS, compatible with glibc 2.31+)
- **React**: ^18.2.0 with TypeScript strict mode
- **Vite**: ^4.5.0 (stable, tested on Deepin UOS)
- **Node.js**: >=16.0.0 (ships with Deepin UOS 20/23)

**Target Platform:**
- **Deepin UOS 20** (based on Debian stable)
- **Deepin UOS 23** (latest)
- Also compatible with other Linux distributions with glibc 2.31+

**D-Bus Integration:**
- **dbus-next**: ^0.9.0 (native bindings, compatible with libdbus 1.12+)
- Custom TypeScript service classes matching Qt backend API

**UI Framework:**
- **Tailwind CSS**: ^3.3.0 (stable)
- **Shadcn/ui**: Latest compatible with React 18
- **Lucide React**: ^0.300.0 (modern icons)
- **Class Variance Authority**: ^0.7.0

**State Management:**
- **Zustand**: ^4.4.0 (lightweight)
- **React Query**: ^4.36.0 (TanStack Query v4)
- **React Hook Form**: ^7.48.0

**Development Tools:**
- **TypeScript**: ^5.0.0 (strict mode)
- **ESLint**: ^8.0.0 + Prettier ^3.0.0
- **electron-reloader**: ^0.3.0 (development hot reload)

### Project Structure

```
dbus-workbench-electron/
├── electron/                      # Electron main process
│   ├── main.ts                   # Main entry point, window management
│   ├── preload.ts                # Preload script (contextBridge)
│   ├── ipc/                      # IPC handlers
│   │   ├── index.ts              # IPC handler registration
│   │   ├── serviceExplorer.ts    # Service discovery IPC
│   │   ├── methodInvoker.ts      # Method invocation IPC
│   │   ├── signalMonitor.ts      # Signal monitoring IPC
│   │   └── types.ts              # IPC message type definitions
│   ├── dbus/                     # D-Bus integration layer
│   │   ├── ServiceExplorer.ts    # List services, introspect interfaces
│   │   ├── MethodInvoker.ts      # Invoke methods with arguments
│   │   ├── SignalMonitor.ts      # Subscribe to signals
│   │   ├── DBusTypes.ts          # D-Bus type system utilities
│   │   └── types.ts              # TypeScript type definitions
│   └── utils/                    # Main process utilities
│       └── logger.ts             # File logging to ~/.config/dbus-workbench-electron/logs/main.log
├── src/                          # React renderer process
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component
│   ├── components/               # UI components
│   │   ├── layout/               # Layout components
│   │   │   ├── AppShell.tsx      # Main app container
│   │   │   ├── TopBar.tsx        # Command bar and window controls
│   │   │   ├── Sidebar.tsx       # Resizable service explorer
│   │   │   └── BottomPanel.tsx   # Collapsible signal monitor
│   │   ├── explorer/             # Service explorer components
│   │   │   ├── ServiceTree.tsx   # Service list with search
│   │   │   ├── MemberTree.tsx    # Hierarchical member tree
│   │   │   └── TreeNode.tsx      # Individual tree node
│   │   ├── workbench/            # Method invocation components
│   │   │   ├── MethodPane.tsx    # Method detail view
│   │   │   ├── ArgumentForm.tsx  # Dynamic argument input
│   │   │   └── ResultView.tsx    # Execution result display
│   │   ├── monitor/              # Signal monitoring components
│   │   │   ├── SignalPane.tsx    # Signal detail and subscription
│   │   │   └── EventList.tsx     # Received signal events
│   │   └── ui/                   # Shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useServiceExplorer.ts # Service discovery hook
│   │   ├── useMethodInvoker.ts   # Method invocation hook
│   │   ├── useSignalMonitor.ts   # Signal subscription hook
│   │   └── useIPC.ts             # Generic IPC hook
│   ├── ipc/                      # IPC client layer
│   │   ├── ipcClient.ts          # Type-safe IPC call wrappers
│   │   └── channels.ts           # IPC channel constants
│   ├── stores/                   # Zustand stores
│   │   ├── appStore.ts           # App state (bus type, selection)
│   │   └── settingsStore.ts      # User preferences
│   ├── types/                    # TypeScript types
│   │   ├── dbus.ts               # D-Bus type definitions
│   │   ├── components.ts         # Component prop types
│   │   └── index.ts              # Shared types
│   └── lib/                      # Utility functions
│       ├── utils.ts              # General utilities
│       └── dbusUtils.ts          # D-Bus specific utilities
├── public/                       # Static assets
├── package.json
├── vite.config.ts                # Vite configuration
├── vite.main.config.ts           # Vite config for main process
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── electron-builder.yml          # Electron builder config
└── README.md
```

---

## Component Architecture

### Main Process Components

#### 1. ServiceExplorer (electron/dbus/ServiceExplorer.ts)

**Purpose**: Discover and introspect D-Bus services

**API:**
```typescript
class ServiceExplorer {
  // List all services on bus
  async listServices(busType: 'session' | 'system'): Promise<string[]>

  // Introspect service and return flat member list
  async introspectServiceMembers(
    serviceName: string,
    busType: 'session' | 'system'
  ): Promise<DbusMember[]>

  // Parse introspection XML
  private parseIntrospectionXML(xml: string): DbusInterface[]
}
```

**Responsibilities:**
- Connect to session/system bus via dbus-next
- Call `org.freedesktop.DBus.ListNames` to get services
- Call `org.freedesktop.DBus.Introspectable.Introspect` on each path
- Parse XML introspection data into structured TypeScript objects
- Flatten interface members into list matching Qt backend structure

**Data Flow:**
1. Renderer requests service list via IPC
2. ServiceExplorer.listServices() called
3. Returns array of service names
4. Renderer requests introspection for selected service
5. ServiceExplorer.introspectServiceMembers() recursively introspects paths
6. Returns flat array of methods/signals/properties

#### 2. MethodInvoker (electron/dbus/MethodInvoker.ts)

**Purpose**: Execute D-Bus method calls

**API:**
```typescript
class MethodInvoker {
  // Invoke method asynchronously
  async invokeMethod(
    serviceName: string,
    path: string,
    interfaceName: string,
    methodName: string,
    args: any[],
    busType: 'session' | 'system'
  ): Promise<DbusMethodResult>
}

interface DbusMethodResult {
  success: boolean
  value?: any
  error?: string
}
```

**Responsibilities:**
- Create method call message with dbus-next
- Convert JavaScript arguments to D-Bus types
- Send asynchronous call and await response
- Parse return value(s) from D-Bus format to JavaScript
- Handle errors and timeouts gracefully

**Type Conversion:**
- JavaScript string → D-Bus string
- JavaScript number → D-Bus int32/double
- JavaScript boolean → D-Bus boolean
- JavaScript array → D-Bus array
- JavaScript object → D-Bus dict

#### 3. SignalMonitor (electron/dbus/SignalMonitor.ts)

**Purpose**: Subscribe to and receive D-Bus signals

**API:**
```typescript
class SignalMonitor {
  // Subscribe to signal
  subscribe(
    serviceName: string,
    path: string,
    interfaceName: string,
    signalName: string,
    busType: 'session' | 'system'
  ): boolean

  // Unsubscribe from signal
  unsubscribe(
    serviceName: string,
    path: string,
    interfaceName: string,
    signalName: string,
    busType: 'session' | 'system'
  ): void

  // Event emitter for received signals
  onSignalReceived: EventEmitter<SignalEvent>
}

interface SignalEvent {
  timestamp: Date
  serviceName: string
  path: string
  interfaceName: string
  signalName: string
  args: any[]
}
```

**Responsibilities:**
- Add signal match rules via dbus-next
- Listen for signal events on connection
- Parse signal arguments to JavaScript types
- Emit events to IPC layer for renderer notification
- Track active subscriptions

### IPC Communication Layer

#### Channel Definitions (electron/ipc/types.ts)

```typescript
// Service Explorer
'dbus:list-services' → { busType: 'session' | 'system' } → string[]
'dbus:introspect-service' → { serviceName: string, busType } → DbusMember[]

// Method Invoker
'dbus:invoke-method' → { serviceName, path, interface, method, args, busType } → DbusMethodResult

// Signal Monitor
'dbus:subscribe-signal' → { serviceName, path, interface, signal, busType } → boolean
'dbus:unsubscribe-signal' → { serviceName, path, interface, signal, busType } → void
'dbus:signal-received' ← SignalEvent (main → renderer push)
```

#### IPC Client (src/ipc/ipcClient.ts)

**Purpose**: Type-safe IPC wrapper for renderer process

```typescript
export const ipcClient = {
  serviceExplorer: {
    listServices: (busType: 'session' | 'system') =>
      ipcRenderer.invoke('dbus:list-services', { busType }),

    introspectService: (serviceName: string, busType: 'session' | 'system') =>
      ipcRenderer.invoke('dbus:introspect-service', { serviceName, busType })
  },

  methodInvoker: {
    invoke: (params: MethodInvokeParams) =>
      ipcRenderer.invoke('dbus:invoke-method', params)
  },

  signalMonitor: {
    subscribe: (params: SignalSubscribeParams) =>
      ipcRenderer.invoke('dbus:subscribe-signal', params),

    unsubscribe: (params: SignalSubscribeParams) =>
      ipcRenderer.invoke('dbus:unsubscribe-signal', params),

    onSignalReceived: (callback: (event: SignalEvent) => void) => {
      ipcRenderer.on('dbus:signal-received', (_, event) => callback(event))
    }
  }
}
```

### Renderer Process Components

#### 1. App Shell (src/components/layout/AppShell.tsx)

**Purpose**: Root layout container

**Structure:**
```
┌─────────────────────────────────────────────┐
│ TopBar (command bar, window controls)       │
├─────────────┬───────────────────────────────┤
│ Sidebar     │ Main Content Area             │
│ (Service    │ ├─ MethodPane                 │
│  Explorer)  │ ├─ SignalPane                 │
│             │ └─ BrowsePane                 │
│             ├───────────────────────────────┤
│             │ BottomPanel (signal events)   │
└─────────────┴───────────────────────────────┘
```

**Responsibilities:**
- Manage layout state (sidebar width, bottom panel height)
- Handle window drag and maximize
- Coordinate selection state between panes

#### 2. Service Tree (src/components/explorer/ServiceTree.tsx)

**Purpose**: Display and search D-Bus services

**Features:**
- List services with bus type toggle (session/system)
- Search/filter services by name
- Show service status indicator
- Click to select and introspect

**State:**
```typescript
interface ServiceTreeState {
  services: string[]
  selectedServiceId: string | null
  searchQuery: string
  isLoading: boolean
}
```

#### 3. Member Tree (src/components/explorer/MemberTree.tsx)

**Purpose**: Hierarchical view of service members

**Tree Structure:**
```
📁 /org/freedesktop/DBus
  📁 org.freedesktop.DBus
    📂 Methods (3)
      • Hello
      • RequestName
      • ListNames
    📂 Signals (2)
      • NameOwnerChanged
      • NameLost
    📂 Properties (1)
      • Features
```

**Features:**
- Expandable/collapsible nodes
- Search across all members
- Group by path → interface → type
- Click member to show detail pane
- Visual indicators for member type (method/signal/property)

#### 4. Method Pane (src/components/workbench/MethodPane.tsx)

**Purpose**: Method detail view and invocation

**Layout:**
```
┌────────────────────────────────────┐
│ ← Back to Browse                   │
├────────────────────────────────────┤
│ Method: Hello                      │
│ Interface: org.freedesktop.DBus    │
│ Path: /org/freedesktop/DBus        │
├────────────────────────────────────┤
│ Arguments:                         │
│ ┌────────────────────────────────┐ │
│ │ arg0: [string input]           │ │
│ │ arg1: [int32 input]            │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ [Invoke Method]                    │
├────────────────────────────────────┤
│ Result:                            │
│ { "value": "1.234" }              │
│ [Copy] [Copy as gdbus]             │
└────────────────────────────────────┘
```

**Features:**
- Dynamic argument form based on signature
- Type-specific inputs (string, int, boolean, array)
- Execute button with loading state
- Result display with syntax highlighting
- Copy as different formats (JSON, gdbus command)
- Error display with stack trace

#### 5. Signal Pane (src/components/monitor/SignalPane.tsx)

**Purpose**: Signal detail and subscription control

**Features:**
- Signal signature display
- Subscribe/Unsubscribe toggle
- Live event list (auto-scrolling)
- Event details with timestamp
- Clear events button
- Filter events by content

#### 6. Browse Pane (src/components/workbench/BrowsePane.tsx)

**Purpose**: Default view when no specific member is selected, or when a group node is clicked

**Features:**
- Display summary information for selected node
- List all members of the same type (all methods/signals/properties in an interface)
- Click member card to open detail pane
- Quick action buttons (Copy command for methods)

**When shown:**
- User clicks on a path node → Shows all interfaces under that path
- User clicks on an interface node → Shows all member types summary
- User clicks on a member group (Methods/Signals/Properties) → Lists all members of that type

#### 7. Property Pane (src/components/workbench/PropertyPane.tsx)

**Purpose**: Property detail view

**Features:**
- Property signature and type display
- Read-only indicator or writable indicator
- Current value display (if readable)
- For writable properties: input field to set new value
- Get/Set buttons with result display

---

## Data Flow

### Service Discovery Flow

```
User selects bus (session/system)
    ↓
ServiceTree component calls useServiceExplorer hook
    ↓
Hook calls ipcClient.serviceExplorer.listServices(busType)
    ↓
IPC invoke → Main process handler
    ↓
ServiceExplorer.listServices(busType)
    ↓
dbus-next: Connect to bus, call ListNames
    ↓
Return string[] → IPC → Hook
    ↓
React Query caches result, updates UI
```

### Method Invocation Flow

```
User fills argument form, clicks "Invoke"
    ↓
MethodPane component calls useMethodInvoker hook
    ↓
Hook validates arguments, calls ipcClient.methodInvoker.invoke()
    ↓
IPC invoke → Main process handler
    ↓
MethodInvoker.invokeMethod()
    ↓
dbus-next: Create method call, convert args, send async
    ↓
Await response, parse return value
    ↓
Return DbusMethodResult → IPC → Hook
    ↓
Update UI with result or error
```

### Signal Monitoring Flow

```
User clicks "Subscribe"
    ↓
SignalPane calls useSignalMonitor.subscribe()
    ↓
IPC invoke → Main process SignalMonitor.subscribe()
    ↓
dbus-next: Add match rule, listen for signals
    ↓
Signal received → Parse → Emit to IPC
    ↓
Main process sends 'dbus:signal-received' event
    ↓
Renderer IPC listener triggers callback
    ↓
Hook appends event to signal event store
    ↓
UI updates event list
```

---

## IPC Implementation

### Main Process Setup (electron/main.ts)

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import { ServiceExplorer } from './dbus/ServiceExplorer'
import { MethodInvoker } from './dbus/MethodInvoker'
import { SignalMonitor } from './dbus/SignalMonitor'
import { registerIPCHandlers } from './ipc'

let mainWindow: BrowserWindow
const serviceExplorer = new ServiceExplorer()
const methodInvoker = new MethodInvoker()
const signalMonitor = new SignalMonitor()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 680,
    frame: false, // Frameless window for custom title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load Vite dev server or built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Register IPC handlers
registerIPCHandlers(ipcMain, {
  serviceExplorer,
  methodInvoker,
  signalMonitor
})

// Forward signal events to renderer
signalMonitor.onSignalReceived((event) => {
  mainWindow.webContents.send('dbus:signal-received', event)
})

app.whenReady().then(createWindow)
```

### Preload Script (electron/preload.ts)

```typescript
import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  serviceExplorer: {
    listServices: (busType: string) =>
      ipcRenderer.invoke('dbus:list-services', { busType }),

    introspectService: (serviceName: string, busType: string) =>
      ipcRenderer.invoke('dbus:introspect-service', { serviceName, busType })
  },

  methodInvoker: {
    invoke: (params: any) =>
      ipcRenderer.invoke('dbus:invoke-method', params)
  },

  signalMonitor: {
    subscribe: (params: any) =>
      ipcRenderer.invoke('dbus:subscribe-signal', params),

    unsubscribe: (params: any) =>
      ipcRenderer.invoke('dbus:unsubscribe-signal', params),

    onSignalReceived: (callback: (event: any) => void) => {
      const handler = (_: any, event: any) => callback(event)
      ipcRenderer.on('dbus:signal-received', handler)
      return () => ipcRenderer.removeListener('dbus:signal-received', handler)
    }
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
})
```

---

## D-Bus Integration Details

### Type System Mapping

**D-Bus → JavaScript:**

| D-Bus Type | JavaScript Type | Notes |
|------------|----------------|-------|
| `s` (string) | `string` | UTF-8 string |
| `b` (boolean) | `boolean` | |
| `y` (byte) | `number` | 0-255 |
| `n` (int16) | `number` | |
| `q` (uint16) | `number` | |
| `i` (int32) | `number` | Most common |
| `u` (uint32) | `number` | |
| `x` (int64) | `number` / `bigint` | |
| `t` (uint64) | `number` / `bigint` | |
| `d` (double) | `number` | |
| `o` (object path) | `string` | Path string |
| `g` (signature) | `string` | Type signature |
| `v` (variant) | `any` | Wrapped value |
| `a` (array) | `any[]` | |
| `a{sv}` (dict) | `object` | String-keyed dict |

### Signature Parsing (electron/dbus/DBusTypes.ts)

```typescript
export function parseSignature(signature: string): DbusType[] {
  // Parse D-Bus type signatures like "sis" → [string, int32, string]
  // Handle complex types like "a{sv}", "(sis)", etc.
}

export function argumentToDbus(value: any, type: DbusType): any {
  // Convert JavaScript value to D-Bus format
}

export function dbusToArgument(value: any): any {
  // Convert D-Bus value to JavaScript
}
```

### Introspection XML Parsing

The Qt backend uses QDomDocument to parse introspection XML. We'll use a lightweight XML parser:

```typescript
import { parseString } from 'xml2js'

interface IntrospectionNode {
  node: {
    $: { name: string }
    interface: DbusInterfaceXML[]
    node?: IntrospectionNode[]
  }
}

export async function parseIntrospectionXML(xml: string): Promise<DbusInterface[]> {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err)
      else resolve(transformInterfaces(result))
    })
  })
}
```

---

## Error Handling

### Logging System (electron/utils/logger.ts)

**Purpose**: Application-level logging for debugging and auditing

**Implementation:**
```typescript
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

class Logger {
  private logFile: string
  private logStream: fs.WriteStream

  constructor() {
    const logDir = path.join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    this.logFile = path.join(logDir, 'main.log')
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' })
  }

  info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('ERROR', message, ...args)
  }

  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level}] ${message}\n`
    this.logStream.write(logLine)
    console.log(`[${level}]`, message, ...args)
  }
}

export const logger = new Logger()
```

**Log Format:**
- ISO 8601 timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Message and optional JSON-serialized arguments
- Written to `~/.config/dbus-workbench-electron/logs/main.log`
- Also output to console in development mode

**Log Rotation:**
- Logs rotate daily
- Keep last 7 days of logs
- Max log file size: 10MB

### D-Bus Errors

**Connection Errors:**
- Bus not available → Show error dialog, retry button
- Permission denied → Show user-friendly message

**Method Invocation Errors:**
- Invalid arguments → Validate before sending, show field errors
- Timeout → Configurable timeout (default 30s), show progress
- Service not found → Show error, suggest refresh
- Method not found → Show error with method signature

**Signal Errors:**
- Subscription failed → Show error, retry button
- Connection lost → Auto-reconnect with exponential backoff

### IPC Errors

All IPC calls wrapped in try-catch:

```typescript
// Main process handler
ipcMain.handle('dbus:invoke-method', async (event, params) => {
  try {
    const result = await methodInvoker.invokeMethod(params)
    return result
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
})
```

### UI Error Display

- **Toast notifications**: Non-blocking errors (using Shadcn/ui toast)
- **Inline errors**: Form validation, argument errors
- **Error boundaries**: React error boundaries for component crashes
- **Error panel**: Dedicated space in method pane for execution errors

---

## Testing Strategy

### Unit Tests

**D-Bus Layer (Jest):**
- Test signature parsing with various inputs
- Test type conversion (JS ↔ D-Bus)
- Test introspection XML parsing
- Test error handling for malformed data

**IPC Layer:**
- Mock ipcMain/ipcRenderer
- Test message serialization
- Test handler registration

**React Components:**
- Test component rendering with React Testing Library
- Test user interactions (click, type)
- Test hook behavior

### Integration Tests

**D-Bus Integration:**
- Use test D-Bus service (session bus)
- Test full introspection flow
- Test method invocation with real D-Bus
- Test signal subscription and reception

**E2E Tests (Playwright):**
- Test service discovery
- Test method invocation workflow
- Test signal monitoring
- Test UI interactions (drag, resize, search)

### Manual Testing Checklist

- [ ] List services on session bus
- [ ] List services on system bus (check permissions)
- [ ] Introspect service with many interfaces
- [ ] Invoke method with no arguments
- [ ] Invoke method with multiple arguments (string, int, array)
- [ ] Handle method error gracefully
- [ ] Subscribe to signal, receive events
- [ ] Unsubscribe, verify no more events
- [ ] Search services by name
- [ ] Search members across interfaces
- [ ] Resize sidebar, verify persistence
- [ ] Copy method result as JSON
- [ ] Copy as gdbus command
- [ ] Switch between bus types
- [ ] Test on different Linux distros (Ubuntu, Fedora, Arch)

---

## UI/UX Improvements

### Over Qt Version

**Modern Component Library:**
- Consistent, polished look with Shadcn/ui
- Smooth animations and transitions
- Better accessibility (ARIA support out of box)
- Dark mode with proper theme support

**Enhanced Interactivity:**
- Drag-and-drop for reordering panes (future)
- Keyboard shortcuts (Cmd/Ctrl+K for command palette)
- Better search with fuzzy matching
- Result preview before method execution

**Developer Experience:**
- Syntax highlighting for JSON results
- Better error messages with stack traces
- Method history (future: save frequently used methods)
- Export/Import method configurations

**Performance:**
- Virtualized lists for large service trees
- Lazy loading of introspection data
- React Query caching for faster re-renders

### Accessibility

- Full keyboard navigation (Tab, Arrow keys, Enter)
- Screen reader support (semantic HTML, ARIA labels)
- High contrast mode support
- Focus indicators on all interactive elements
- Reduced motion support (respects prefers-reduced-motion)

---

## Build and Distribution

### Development Build

```bash
# Install dependencies
npm install

# Run in development with hot reload
npm run dev

# This starts:
# - Vite dev server for renderer (port 5173)
# - Electron main process with electron-reloader
```

### Production Build

```bash
# Build for current platform
npm run build

# Package as distributable
npm run package
```

### Electron Builder Configuration (electron-builder.yml)

```yaml
appId: com.dbus-workbench.electron
productName: D-Bus Workbench
directories:
  output: dist

linux:
  target:
    - target: deb
      arch:
        - x64
        - arm64
    - target: AppImage
      arch:
        - x64
    - target: rpm
      arch:
        - x64
  category: Development
  maintainer: Your Name <your.email@example.com>
  desktop:
    Name: D-Bus Workbench
    Comment: Modern D-Bus introspection and monitoring tool
    Categories: Development;Debugger;IDE;
    StartupWMClass: dbus-workbench-electron

# Node.js and Electron version constraints
electronDist: node_modules/electron/dist
electronVersion: 22.3.25

# Include native dbus-next module
extraResources:
  - node_modules/dbus-next/**/*
  - node_modules/dbus-next/build/Release/dbus_next.node

# Deepin UOS specific settings
deb:
  priority: optional
  compressionLevel: 9
  depends:
    - libc6 (>= 2.28)
    - libdbus-1-3 (>= 1.12.0)
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6

# Package scripts
afterPack: ./scripts/after-pack.js
afterSign: ./scripts/after-sign.js
```

### Distribution Channels

- **GitHub Releases**: AppImage, .deb, .rpm files
- **Snap Store**: Snap package for Ubuntu
- **AUR**: Arch Linux package
- **Flatpak**: Sandboxed distribution (future)

---

## Migration Path

### Phase 1: Core Infrastructure (Week 1)

1. Set up Electron + Vite + React project
2. Configure TypeScript, ESLint, Tailwind, Shadcn/ui
3. Implement basic window and layout
4. Set up IPC communication layer
5. Write D-Bus type utilities

### Phase 2: Service Explorer (Week 2)

1. Implement ServiceExplorer in main process
2. Build ServiceTree component
3. Build MemberTree component with search
4. Test introspection with real D-Bus services

### Phase 3: Method Invocation (Week 3)

1. Implement MethodInvoker in main process
2. Build ArgumentForm with dynamic fields
3. Build ResultView with copy functionality
4. Test with various method signatures

### Phase 4: Signal Monitoring (Week 4)

1. Implement SignalMonitor in main process
2. Build SignalPane with subscription controls
3. Build EventList with live updates
4. Test signal reception and display

### Phase 5: Polish and Testing (Week 5)

1. Implement dark mode
2. Add keyboard shortcuts
3. Write unit and integration tests
4. Manual testing across distributions
5. Documentation and README

### Phase 6: Deepin UOS Packaging and Deployment (Week 6)

1. Create .deb package configuration
2. Set up Deepin UOS 20.9 and 23 test VMs
3. Test installation and runtime dependencies
4. Create desktop entry and icons
5. Test Chinese localization (if needed)
6. Create user documentation in Chinese
7. Package and publish to Deepin/UOS repository (optional)

---

## Verification

### How to Test End-to-End

**Service Discovery:**
```bash
# Start app
npm run dev

# In UI:
1. Select "Session Bus"
2. Verify services listed
3. Search for "org.freedesktop"
4. Click service to introspect
5. Verify member tree populated
```

**Method Invocation:**
```bash
# In UI:
1. Select org.freedesktop.DBus service
2. Navigate to /org/freedesktop/DBus → org.freedesktop.DBus → Methods → ListNames
3. Click method to open detail pane
4. Click "Invoke Method"
5. Verify result shows array of service names
```

**Signal Monitoring:**
```bash
# In UI:
1. Select org.freedesktop.DBus service
2. Navigate to Signals → NameOwnerChanged
3. Click "Subscribe"
4. Start/stop another D-Bus service
5. Verify signal events appear in bottom panel
```

**Cross-Platform Testing:**
```bash
# Build and test on different distros
npm run package

# Test .deb package on:
- Deepin UOS 20.9 (primary target)
- Deepin UOS 23 (secondary target)
- Ubuntu 20.04 LTS
- Ubuntu 22.04 LTS

# Test AppImage on:
- Fedora 39+
- Arch Linux
- openSUSE Leap 15.5
```

**Deepin UOS Specific Tests:**
```bash
# Install and test on Deepin UOS 20.9
sudo dpkg -i dist/dbus-workbench-electron_1.0.0_amd64.deb
sudo apt-get install -f

# Verify installation
which dbus-workbench-electron
dbus-workbench-electron --version

# Test desktop integration
gtk-launch dbus-workbench-electron

# Verify D-Bus permissions
# Check if user is in messagebus group
groups | grep messagebus

# Test system bus access (may require polkit)
dbus-workbench-electron --bus=system
```

---

## Deepin UOS Deployment Notes

### System Integration

**Desktop Entry (usr/share/applications/dbus-workbench-electron.desktop):**
```desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=D-Bus Workbench
Name[zh_CN]=D-Bus 工作台
GenericName=D-Bus Introspection Tool
GenericName[zh_CN]=D-Bus 内省工具
Comment=Modern D-Bus introspection, method invocation, and signal monitoring tool
Comment[zh_CN]=现代化的 D-Bus 内省、方法调用和信号监控工具
Exec=dbus-workbench-electron %F
Icon=dbus-workbench-electron
Terminal=false
Categories=Development;Debugger;IDE;Qt;
Keywords=dbus;introspection;debug;development;
Keywords[zh_CN]=dbus;内省;调试;开发;
StartupWMClass=dbus-workbench-electron
MimeType=application/x-dbus-service;
```

### Polkit Integration (System Bus Access)

For accessing the system D-Bus bus, users may need polkit permissions:

**Polkit Rules File (/usr/share/polkit-1/rules.d/dbus-workbench-electron.rules):**
```javascript
// Allow users in the messagebus group to access system D-Bus
polkit.addRule(function(action, subject) {
    if (action.id == "org.freedesktop.DBus" &&
        subject.isInGroup("messagebus")) {
        return polkit.Result.YES;
    }
});
```

**Post-installation Script (DEBIAN/postinst):**
```bash
#!/bin/bash
set -e

# Add user to messagebus group for system D-Bus access
if [ "$1" = "configure" ]; then
    # Create messagebus group if it doesn't exist
    if ! getent group messagebus > /dev/null; then
        groupadd --system messagebus
    fi

    echo "To access the system D-Bus bus, users need to be in the 'messagebus' group."
    echo "Add yourself to the group with:"
    echo "  sudo usermod -a -G messagebus \$USER"
    echo "Then log out and back in for changes to take effect."
fi

# Update desktop database
update-desktop-database /usr/share/applications 2>/dev/null || true

exit 0
```

### Localization (Chinese)

**Language File Structure:**
```
locales/
├── zh-CN/
│   ├── common.json
│   ├── menu.json
│   ├── errors.json
│   └── help.json
└── en-US/
    ├── common.json
    ├── menu.json
    ├── errors.json
    └── help.json
```

**Sample Chinese Translation (locales/zh-CN/common.json):**
```json
{
  "app.title": "D-Bus 工作台",
  "service.explorer": "服务浏览器",
  "session.bus": "会话总线",
  "system.bus": "系统总线",
  "method.invocation": "方法调用",
  "signal.monitor": "信号监控",
  "invoke": "调用",
  "subscribe": "订阅",
  "unsubscribe": "取消订阅"
}
```

### Distribution Channels for Deepin UOS

**Option 1: Deepin Store (Official)**
- Submit to Deepin Software Store for review
- Requires Deepin developer account
- Provides automatic updates to users

**Option 2: GitHub Releases**
```bash
# Create release on GitHub
gh release create v1.0.0 \
  dist/dbus-workbench-electron_1.0.0_amd64.deb \
  dist/D-Bus-Workbench-1.0.0-x86_64.AppImage \
  --title "D-Bus Workbench v1.0.0" \
  --notes-file RELEASE_NOTES.md
```

**Option 3: APT Repository (Self-hosted)**
```bash
# Set up custom APT repository
# Users can install with:
curl -fsSL https://your-repo.com/gpg.key | sudo apt-key add -
echo "deb [arch=amd64] https://your-repo.com/debian stable main" | \
  sudo tee /etc/apt/sources.list.d/dbus-workbench.list
sudo apt update
sudo apt install dbus-workbench-electron
```

### Known Issues and Workarounds

**Issue 1: glibc Version Too Old**
- **Problem**: Deepin UOS 20.5 (older) has glibc 2.27, Electron 22 requires 2.28+
- **Solution**: Use Electron 20 (last version supporting glibc 2.27) or upgrade to Deepin UOS 20.9+

**Issue 2: Node.js Not Available**
- **Problem**: Some Deepin UOS versions don't ship Node.js
- **Solution**: Bundle Node.js runtime in the AppImage, or use .deb with bundled Node.js

**Issue 3: dbus-next Native Module Build Fails**
- **Problem**: Missing build dependencies (build-essential, libdbus-1-dev)
- **Solution**: Document required build dependencies in README:
  ```bash
  sudo apt install build-essential libdbus-1-dev pkg-config python3
  ```

**Issue 4: Chinese Font Rendering**
- **Problem**: Default font may not render Chinese characters well
- **Solution**: Use system fonts in CSS:
  ```css
  font-family: -apple-system, BlinkMacSystemFont,
               "Noto Sans CJK SC", "Source Han Sans SC",
               "WenQuanYi Micro Hei", sans-serif;
  ```

---

## Future Enhancements

**Not in scope for initial implementation:**
- Method history and favorites
- Export/Import configurations
- Custom themes
- Plugin system for custom argument types
- Terminal integration (spawn gdbus/BusCtl commands)
- Multi-window support
- Service connection details viewer
- Property get/set interface

---

## References

**D-Bus and Electron:**
- [dbus-next Documentation](https://github.com/dbus-next/dbus-next)
- [Electron Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)
- [D-Bus Specification](https://dbus.freedesktop.org/doc/dbus-specification.html)
- [Qt D-Bus Documentation](https://doc.qt.io/qt-6/qtdbus-index.html) (for comparison)

**UI and Components:**
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

**Deepin UOS Deployment:**
- [Deepin Developer Documentation](https://github.com/linuxdeepin/developer-center)
- [Deepin Store Submission Guide](https://github.com/linuxdeepin/developer-center/wiki)
- [Debian Packaging Guide](https://www.debian.org/doc/manuals/maint-guide/)
- [Electron Builder Linux Options](https://www.electron.build/configuration/linux)

**Compatibility and Testing:**
- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [Electron Releases](https://www.electronjs.org/releases/stable)
- [glibc Version Matrix](https://sourceware.org/glibc/wiki/Glibc%20Timeline)
- [Deepin UOS Release Notes](https://www.deepin.org/en/release-note/)
