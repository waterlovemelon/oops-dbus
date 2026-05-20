# D-Bus Workbench Electron - 后续实施计划

**日期**: 2026-04-17
**状态**: Phase 1 完成，Phase 2-6 待实施
**项目位置**: `dbus-workbench-electron/`

---

## 已完成工作 (Phase 1)

### ✅ 项目基础设施
- [x] Electron + Vite + React + TypeScript 项目结构
- [x] TypeScript 严格模式配置
- [x] Tailwind CSS + 深色主题配置
- [x] ESLint + Prettier 配置
- [x] npm 依赖安装完成（使用淘宝镜像）

### ✅ D-Bus 后端实现
- [x] `electron/dbus/types.ts` - D-Bus 数据类型定义
- [x] `electron/dbus/DBusTypes.ts` - 类型转换工具
- [x] `electron/dbus/ServiceExplorer.ts` - 服务发现和内省
  - `listServices()` - 列出总线上的所有服务
  - `introspectServiceMembers()` - 内省服务成员（方法、信号、属性）
  - 递归探索对象路径
  - XML 解析（使用正则表达式）
- [x] `electron/dbus/MethodInvoker.ts` - 方法调用
  - `invokeMethod()` - 异步调用 D-Bus 方法
  - JavaScript ↔ D-Bus 类型转换
  - 错误处理
- [x] `electron/dbus/SignalMonitor.ts` - 信号监控
  - `subscribe()` - 订阅信号
  - `unsubscribe()` - 取消订阅
  - 事件发射器

### ✅ IPC 通信层
- [x] `electron/ipc/types.ts` - IPC 类型定义
- [x] `electron/ipc/serviceExplorer.ts` - 服务发现 IPC 处理器
- [x] `electron/ipc/methodInvoker.ts` - 方法调用 IPC 处理器
- [x] `electron/ipc/signalMonitor.ts` - 信号监控 IPC 处理器
- [x] `electron/ipc/index.ts` - IPC 处理器注册
- [x] `electron/main.ts` - 主进程入口（已集成 IPC 处理器）
- [x] `electron/preload.ts` - 预加载脚本（context bridge）

### ✅ React 基础
- [x] `src/main.tsx` - React 入口
- [x] `src/App.tsx` - 根组件（带自定义标题栏）
- [x] `src/index.css` - 全局样式（深色主题）
- [x] `src/types/electron-api.ts` - Electron API 类型定义
- [x] `src/lib/utils.ts` - Shadcn/ui 工具函数
- [x] `src/components/ui/button.tsx` - 按钮组件
- [x] `src/components/ui/input.tsx` - 输入框组件
- [x] `src/components/ui/card.tsx` - 卡片组件

### ✅ 工具
- [x] `electron/utils/logger.ts` - 文件日志工具

### ✅ 构建系统
- [x] TypeScript 编译成功
- [x] Vite 构建成功
- [x] 生成 `dist/` 和 `dist-electron/` 目录

---

## 待实施工作

### Phase 2: React Hooks 和状态管理

#### 2.1 IPC 客户端层
**文件**: `src/ipc/channels.ts`, `src/ipc/ipcClient.ts`

```typescript
// src/ipc/channels.ts
export const IPC_CHANNELS = {
  LIST_SERVICES: 'dbus:listServices',
  INTROSPECT_SERVICE_MEMBERS: 'dbus:introspectServiceMembers',
  INVOKE_METHOD: 'dbus:invokeMethod',
  SUBSCRIBE_SIGNAL: 'dbus:subscribeSignal',
  UNSUBSCRIBE_SIGNAL: 'dbus:unsubscribeSignal',
} as const

// src/ipc/ipcClient.ts
// 封装所有 IPC 调用为类型安全的函数
```

#### 2.2 自定义 Hooks
**文件**: `src/hooks/`

- `useServiceExplorer.ts` - 服务发现 hook（使用 React Query）
  ```typescript
  export function useServiceExplorer(busType: 'session' | 'system') {
    return useQuery({
      queryKey: ['services', busType],
      queryFn: () => ipcClient.listServices(busType),
      staleTime: 30000,
    })
  }
  ```

- `useServiceIntrospection.ts` - 服务内省 hook
  ```typescript
  export function useServiceIntrospection(serviceName: string, busType: BusType) {
    return useQuery({
      queryKey: ['introspection', serviceName, busType],
      queryFn: () => ipcClient.introspectServiceMembers(serviceName, busType),
      enabled: !!serviceName,
    })
  }
  ```

- `useMethodInvoker.ts` - 方法调用 hook
  ```typescript
  export function useMethodInvoker() {
    const [result, setResult] = useState<DbusMethodResult | null>(null)
    const [isInvoking, setIsInvoking] = useState(false)

    const invoke = async (params: InvokeMethodParams) => {
      setIsInvoking(true)
      const result = await ipcClient.invokeMethod(params)
      setResult(result)
      setIsInvoking(false)
      return result
    }

    return { invoke, result, isInvoking }
  }
  ```

- `useSignalMonitor.ts` - 信号监控 hook
  ```typescript
  export function useSignalMonitor() {
    const [events, setEvents] = useState<SignalEvent[]>([])
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

    // 订阅/取消订阅逻辑
    // 事件监听和累积
  }
  ```

#### 2.3 Zustand Stores
**文件**: `src/stores/`

- `appStore.ts` - 应用状态
  ```typescript
  interface AppStore {
    // 总线类型
    activeBus: 'session' | 'system'
    setActiveBus: (bus: 'session' | 'system') => void

    // 活动模式
    activeMode: 'browse' | 'workbench' | 'signal'
    setActiveMode: (mode: 'browse' | 'workbench' | 'signal') => void

    // 选中的服务
    selectedServiceId: string | null
    selectedServiceName: string | null
    setSelectedService: (id: string, name: string) => void

    // 选中的成员
    selectedMemberId: string | null
    selectedNode: TreeNode | null
    setSelectedMember: (id: string, node: TreeNode) => void

    // 服务树节点
    serviceTreeNodes: TreeNode[]
    setServiceTreeNodes: (nodes: TreeNode[]) => void
  }
  ```

- `settingsStore.ts` - 用户设置
  ```typescript
  interface SettingsStore {
    theme: 'dark' | 'light'
    setTheme: (theme: 'dark' | 'light') => void

    sidebarWidth: number
    setSidebarWidth: (width: number) => void

    bottomPanelHeight: number
    setBottomPanelHeight: (height: number) => void

    bottomPanelCollapsed: boolean
    toggleBottomPanel: () => void
  }
  ```

---

### Phase 3: 布局组件

#### 3.1 主布局
**文件**: `src/components/layout/`

- `AppShell.tsx` - 主应用容器
  - 使用 `react-resizable-panels` 实现可调整大小的面板
  - 布局：左侧边栏 + 中间内容 + 底部面板
  - 类似 Postman/VS Code 风格

- `TopBar.tsx` - 顶部栏
  - 自定义窗口控制按钮（最小化、最大化、关闭）
  - 总线选择器（Session Bus / System Bus）
  - 刷新按钮
  - 搜索框

- `Sidebar.tsx` - 左侧边栏
  - 可调整宽度
  - 包含 ServiceTree 组件
  - 搜索过滤功能

- `BottomPanel.tsx` - 底部面板
  - 可折叠
  - 显示信号事件列表
  - 清除事件按钮

---

### Phase 4: 服务浏览器组件

#### 4.1 服务树
**文件**: `src/components/explorer/`

- `ServiceTree.tsx` - 服务列表
  ```typescript
  interface ServiceTreeProps {
    services: string[]
    selectedServiceId: string | null
    onSelectService: (serviceName: string) => void
    filterText: string
  }
  ```
  - 显示服务名称列表
  - 模糊搜索过滤（参考 Qt 的 fuzzyMatch）
  - 点击服务触发内省

- `MemberTree.tsx` - 成员树
  ```typescript
  interface MemberTreeProps {
    members: DbusMemberInfo[]
    selectedMemberId: string | null
    onSelectMember: (member: DbusMemberInfo) => void
  }
  ```
  - 构建树结构：
    ```
    Service Name
    ├── /path1
    │   ├── org.interface.Name
    │   │   ├── Methods
    │   │   │   ├── method1
    │   │   │   └── method2
    │   │   ├── Signals
    │   │   │   └── signal1
    │   │   └── Properties
    │   │       └── property1
    ```
  - 图标区分方法、信号、属性
  - 点击成员打开详情面板

- `TreeNode.tsx` - 树节点组件
  - 可展开/折叠
  - 图标 + 文本
  - 选中状态

#### 4.2 树结构构建逻辑
**文件**: `src/lib/buildTree.ts`

参考 Qt `Main.qml` 中的树构建逻辑：
```typescript
interface TreeNode {
  id: string
  label: string
  type: 'service' | 'path' | 'interface' | 'category' | 'member'
  children?: TreeNode[]
  member?: DbusMemberInfo
}

export function buildServiceTree(members: DbusMemberInfo[]): TreeNode[] {
  // 按 path 分组
  // 按 interface 分组
  // 按 type (method/signal/property) 分组
  // 返回树结构
}
```

---

### Phase 5: 工作台组件（方法调用）

#### 5.1 方法面板
**文件**: `src/components/workbench/`

- `MethodPane.tsx` - 方法详情视图
  ```typescript
  interface MethodPaneProps {
    member: DbusMemberInfo
    busType: 'session' | 'system'
    onBack: () => void
  }
  ```
  - 显示方法名称、接口、路径
  - 显示签名和返回类型
  - 参数输入表单
  - 执行按钮
  - 结果显示区域

- `ArgumentForm.tsx` - 参数表单
  ```typescript
  interface ArgumentFormProps {
    signature: string
    values: any[]
    onChange: (values: any[]) => void
  }
  ```
  - 解析方法签名
  - 为每个参数生成输入字段
  - 支持基本类型：string, int, boolean
  - 支持复杂类型：array, dict（JSON 编辑器）
  - 使用 react-hook-form 进行验证

- `ResultView.tsx` - 结果显示
  ```typescript
  interface ResultViewProps {
    result: DbusMethodResult | null
    isInvoking: boolean
  }
  ```
  - 显示执行状态（成功/失败/执行中）
  - 格式化返回值（JSON 格式）
  - 复制到剪贴板按钮
  - 错误消息显示

---

### Phase 6: 信号监控组件

#### 6.1 信号面板
**文件**: `src/components/monitor/`

- `SignalPane.tsx` - 信号详情视图
  ```typescript
  interface SignalPaneProps {
    member: DbusMemberInfo
    busType: 'session' | 'system'
    onBack: () => void
  }
  ```
  - 显示信号名称、接口、路径
  - 显示签名
  - 订阅/取消订阅按钮
  - 订阅状态指示

- `EventList.tsx` - 事件列表
  ```typescript
  interface EventListProps {
    events: SignalEvent[]
    onClear: () => void
  }
  ```
  - 显示接收到的信号事件
  - 时间戳、发送者、参数
  - 自动滚动到最新
  - 清除按钮
  - 搜索/过滤功能

---

### Phase 7: 属性查看组件

#### 7.1 属性面板
**文件**: `src/components/property/`

- `PropertyPane.tsx` - 属性详情视图
  - 显示属性名称、类型、访问权限
  - 读取属性值按钮
  - 显示当前值
  - 如果可写，显示编辑表单

---

### Phase 8: 集成和优化

#### 8.1 主应用集成
**文件**: `src/App.tsx`

- 集成所有组件到 AppShell
- 连接 Zustand store
- 设置 React Query provider
- 实现模式切换逻辑（browse/workbench/signal）

#### 8.2 键盘快捷键
**文件**: `src/hooks/useKeyboardShortcuts.ts`

- `Ctrl+R` - 刷新服务列表
- `Ctrl+F` - 聚焦搜索框
- `Ctrl+Shift+S` - 切换 Session/System 总线
- `Escape` - 返回/取消

#### 8.3 深色模式优化
- 确保所有组件支持深色主题
- 优化颜色对比度
- 滚动条样式

#### 8.4 性能优化
- 使用 React Query 缓存
- 虚拟滚动（如果服务列表很长）
- 懒加载组件

---

### Phase 9: 测试和验证

#### 9.1 手动测试场景

**服务发现测试:**
```bash
npm run dev

# UI 操作:
1. 选择 "Session Bus"
2. 验证服务列表显示
3. 搜索 "org.freedesktop"
4. 点击服务触发内省
5. 验证成员树显示
```

**方法调用测试:**
```bash
# UI 操作:
1. 选择 org.freedesktop.DBus 服务
2. 导航到 /org/freedesktop/DBus → org.freedesktop.DBus → Methods → ListNames
3. 点击方法打开详情面板
4. 点击 "Invoke Method"
5. 验证结果显示服务名称数组
```

**信号监控测试:**
```bash
# UI 操作:
1. 选择 org.freedesktop.DBus 服务
2. 导航到 Signals → NameOwnerChanged
3. 点击 "Subscribe"
4. 启动/停止另一个 D-Bus 服务
5. 验证信号事件出现在底部面板
```

#### 9.2 跨平台测试
- Deepin UOS 20.9
- Deepin UOS 23
- Ubuntu 20.04 LTS
- Ubuntu 22.04 LTS

---

### Phase 10: 打包和部署

#### 10.1 electron-builder 配置
**文件**: `electron-builder.yml`

```yaml
appId: com.deepin.dbus-workbench
productName: D-Bus Workbench
directories:
  output: dist

linux:
  target:
    - deb
    - AppImage
  category: Development
  maintainer: YinJie <your.email@example.com>

deb:
  depends:
    - libc6 (>= 2.28)
    - libdbus-1-3 (>= 1.12.0)
    - libgtk-3-0
    - libnotify4
    - libnss3
    - libxss1
    - libxtst6
    - xdg-utils
```

#### 10.2 桌面入口文件
**文件**: `build/dbus-workbench-electron.desktop`

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
Categories=Development;Debugger;
```

#### 10.3 构建命令
```bash
# 构建 .deb 包
npm run build:linux-deb

# 构建 AppImage
npm run build:linux-appimage

# 测试安装
sudo dpkg -i dist/dbus-workbench-electron_1.0.0_amd64.deb
sudo apt-get install -f
```

---

## 实施优先级

### 高优先级（立即实施）
1. **IPC 客户端层** - 连接前端和后端的桥梁
2. **React Hooks** - 封装 D-Bus 操作逻辑
3. **Zustand Stores** - 应用状态管理
4. **布局组件** - AppShell, TopBar, Sidebar, BottomPanel
5. **服务树组件** - ServiceTree, MemberTree, TreeNode

### 中优先级（第二阶段）
6. **工作台组件** - MethodPane, ArgumentForm, ResultView
7. **信号监控组件** - SignalPane, EventList
8. **属性查看组件** - PropertyPane

### 低优先级（优化阶段）
9. **键盘快捷键**
10. **性能优化**
11. **测试和验证**
12. **打包和部署**

---

## 关键文件参考

### 现有 Qt/QML 代码（API 兼容性参考）
- `src/dbus/ServiceExplorer.h` - 服务发现 API
- `src/dbus/MethodInvoker.h` - 方法调用 API
- `src/dbus/SignalMonitor.h` - 信号监控 API
- `src/dbus/models/ServiceModel.h` - 服务列表模型
- `src/dbus/models/MemberModel.h` - 成员列表模型
- `qml/Main.qml` - 应用编排和状态管理
- `qml/components/WorkbenchPane.qml` - 方法执行 UI
- `qml/components/SignalDetailPane.qml` - 信号订阅 UI

### 设计文档
- `docs/electron-rewrite-design.md` - 完整规格说明

---

## 开发命令

```bash
# 进入项目目录
cd dbus-workbench-electron

# 开发模式
npm run dev

# 构建生产版本
npm run build:vite

# 代码检查
npm run lint

# 代码格式化
npm run format

# 打包 Linux
npm run package:linux

# 打包 .deb
npm run build:linux-deb

# 打包 AppImage
npm run build:linux-appimage
```

---

## 下一步行动

**在新会话中继续开发时，请按以下顺序进行:**

1. **创建 IPC 客户端层** (`src/ipc/`)
   - 封装所有 Electron IPC 调用
   - 提供类型安全的 API

2. **创建 React Hooks** (`src/hooks/`)
   - useServiceExplorer
   - useServiceIntrospection
   - useMethodInvoker
   - useSignalMonitor

3. **创建 Zustand Stores** (`src/stores/`)
   - appStore
   - settingsStore

4. **实现布局组件** (`src/components/layout/`)
   - AppShell（使用 react-resizable-panels）
   - TopBar
   - Sidebar
   - BottomPanel

5. **实现服务树组件** (`src/components/explorer/`)
   - ServiceTree
   - MemberTree（参考 Qt Main.qml 的树构建逻辑）
   - TreeNode

6. **测试基本功能**
   - 启动应用
   - 列出服务
   - 内省服务
   - 显示成员树

7. **继续实施工作台和信号监控组件**

---

## 注意事项

1. **API 兼容性** - 确保 TypeScript 接口与 Qt C++ 结构体匹配
2. **平台兼容性** - 使用 Electron 22 以支持 Deepin UOS 20.9 (glibc 2.28+)
3. **深色主题** - 所有组件必须支持深色主题
4. **错误处理** - D-Bus 操作可能失败，需要友好的错误提示
5. **性能** - 服务列表可能很长，考虑虚拟滚动
6. **类型安全** - 使用 TypeScript 严格模式，避免 `any` 类型

---

**祝开发顺利！** 🚀
