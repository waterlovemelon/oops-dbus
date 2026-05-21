/**
 * IPC Channel Names
 * Centralized definition of all IPC communication channels between renderer and main process
 */

export const IPC_CHANNELS = {
  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',

  // D-Bus ServiceExplorer
  LIST_SERVICES: 'dbus:listServices',
  INTROSPECT_SERVICE_MEMBERS: 'dbus:introspectServiceMembers',

  // D-Bus MethodInvoker
  INVOKE_METHOD: 'dbus:invokeMethod',

  // D-Bus SignalMonitor
  SUBSCRIBE_SIGNAL: 'dbus:subscribeSignal',
  UNSUBSCRIBE_SIGNAL: 'dbus:unsubscribeSignal',
  SIGNAL_RECEIVED: 'dbus:signalReceived',

  // SSH Remote Connection
  SSH_LIST_CONNECTIONS: 'ssh:listConnections',
  SSH_CREATE_CONNECTION: 'ssh:createConnection',
  SSH_UPDATE_CONNECTION: 'ssh:updateConnection',
  SSH_DELETE_CONNECTION: 'ssh:deleteConnection',
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  SSH_GET_CONNECTION_STATE: 'ssh:getConnectionState',
  SSH_GET_ALL_CONNECTION_STATES: 'ssh:getAllConnectionStates',
  SSH_CONNECTION_STATUS: 'ssh:connectionStatus',
} as const
