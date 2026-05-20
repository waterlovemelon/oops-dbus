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
} as const
