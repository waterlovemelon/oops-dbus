export const zh = {
  // TopBar
  'topbar.settings': '设置',
  'topbar.remoteConnection': '远程连接',
  'topbar.switchToLight': '切换亮色主题',
  'topbar.switchToDark': '切换暗色主题',
  'topbar.about': '关于',

  // Sidebar
  'sidebar.local': '本地',
  'sidebar.localDbus': '本地 D-Bus',
  'sidebar.remoteConnections': '远程连接',
  'sidebar.all': '全部',
  'sidebar.searchPlaceholder': '搜索服务...',
  'sidebar.loadingServices': '加载服务中...',
  'sidebar.noServices': '无服务',
  'sidebar.noMatchingServices': '无匹配服务',
  'sidebar.loadingMembers': '加载成员中...',
  'sidebar.noMembers': '无成员',
  'sidebar.inactive': '未激活',
  'sidebar.connecting': '连接中...',
  'sidebar.disconnected': '未连接',
  'sidebar.connectViaMenu': '通过远程连接菜单连接',
  'sidebar.services': '个服务',
  'sidebar.remoteConnectionsCount': '个远程连接',

  // AppShell
  'appshell.selectService': '选择一个服务进行探索',

  // MethodPane
  'method.inputParams': '输入参数',
  'method.outputParams': '输出参数',
  'method.none': '无',
  'method.arguments': '参数',
  'method.invoke': '调用',
  'method.invoking': '调用中...',
  'method.reset': '重置',
  'method.copyCommand': '复制命令',
  'method.monitorMethod': '监听方法',

  // ResultView
  'result.invokingMethod': '正在调用方法...',
  'result.waitingForResponse': '等待 D-Bus 响应...',
  'result.title': '结果',
  'result.noResult': '暂无结果。点击"调用方法"执行。',
  'result.error': '错误',
  'result.unknownError': '未知错误',
  'result.success': '成功',
  'result.copied': '已复制！',
  'result.copy': '复制',
  'result.valueType': '值类型：',

  // ArgumentForm
  'argument.noArgs': '无需参数',
  'argument.argumentN': '参数',
  'argument.enterAsJson': '以 JSON 格式输入（例如：',

  // SignalPane
  'signal.systemBus': '系统总线',
  'signal.sessionBus': '会话总线',
  'signal.signal': '信号',
  'signal.signalInfo': '信号信息',
  'signal.interface': '接口',
  'signal.objectPath': '对象路径',
  'signal.description': '描述',
  'signal.monitorSignal': '监控信号',
  'signal.defaultDesc': '服务发出的 D-Bus 信号。',

  // PropertyPane
  'property.get': '获取',
  'property.copyGet': '复制获取命令',
  'property.set': '设置',
  'property.copySet': '复制设置命令',
  'property.newValue': '新值',
  'property.enterValue': '输入值',
  'property.valueType': '值类型：',
  'property.unknownError': '未知错误',
  'property.accessNotRecognized': '属性访问模式 "{access}" 无法识别。',
  'property.monitorProperty': '监听属性',

  // ServiceOverviewPane
  'service.systemBus': '系统总线',
  'service.sessionBus': '会话总线',
  'service.active': '活跃',
  'service.inactive': '未激活',
  'service.serviceInfo': '服务信息',
  'service.loading': '加载中...',
  'service.serviceName': '服务名称',
  'service.uniqueName': '唯一名称',
  'service.owningProcess': '所属进程',
  'service.notRunning': '未运行',
  'service.busType': '总线类型',
  'service.startTime': '启动时间',
  'service.startupCommand': '启动命令',
  'service.monitorService': '监控服务',
  'service.monitorProcess': '监控进程',

  // PathPane
  'path.pathInfo': '路径信息',
  'path.objectPath': '对象路径',
  'path.owningService': '所属服务',
  'path.busType': '总线类型',
  'path.monitorPath': '监控路径',

  // InterfacePane
  'interface.interfaceInfo': '接口信息',
  'interface.interfaceName': '接口名称',
  'interface.objectPath': '对象路径',
  'interface.owningService': '所属服务',
  'interface.busType': '总线类型',
  'interface.methods': '方法',
  'interface.signals': '信号',
  'interface.properties': '属性',
  'interface.monitorInterface': '监控接口',

  // RemoteDrawer
  'remote.title': '远程连接',
  'remote.addNew': '新增远程连接',

  // ConnectionDialog
  'remote.editConnection': '编辑远程连接',
  'remote.newConnection': '新增远程连接',
  'remote.connectionName': '连接名称',
  'remote.namePlaceholder': '例如：生产环境 - 应用服务器',
  'remote.connectionType': '连接类型',
  'remote.host': '主机地址',
  'remote.port': '端口',
  'remote.username': '用户名',
  'remote.authMethod': '认证方式',
  'remote.sshKey': 'SSH 密钥',
  'remote.password': '密码',
  'remote.keyPath': '密钥路径',
  'remote.keyPathHint': '留空则使用默认密钥',
  'remote.passwordPlaceholder': '输入密码',
  'remote.dbusSocketPath': 'D-Bus Socket 路径 (可选)',
  'remote.dbusSocketPlaceholder': '自动检测',
  'remote.dbusSocketHint': '留空则自动检测远程 D-Bus socket',
  'remote.cancel': '取消',
  'remote.save': '保存',

  // ConnectionCard
  'remote.edit': '编辑',
  'remote.delete': '删除',
  'remote.address': '地址',
  'remote.portLabel': '端口',
  'remote.user': '用户',
  'remote.connected': '已连接',
  'remote.connecting': '连接中...',
  'remote.retry': '重试',
  'remote.connect': '连接',

  // Validation
  'validation.byteRange': '字节值必须在 0 到 255 之间',
  'validation.mustBeBoolean': '必须为 true 或 false',
  'validation.int32Range': 'Int32 值必须在 -2147483648 到 2147483647 之间',

  // MonitoringCommands
  'monitor.copyAll': '复制全部',
  'monitor.copy': '复制',

  // ServiceTree
  'serviceTree.filterPlaceholder': '搜索服务...',
  'serviceTree.noServices': '未找到服务',
  'serviceTree.noMatching': '无匹配服务',
  'serviceTree.servicesCount': '共 {total} 个服务',

  // BottomPanel
  'bottomPanel.signalMonitor': '信号监控',
  'bottomPanel.clear': '清空',
  'bottomPanel.noEvents': '未收到信号事件',
}
