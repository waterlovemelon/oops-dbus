import { ipcMain } from 'electron'
import { PropertyAccessor } from '../dbus/PropertyAccessor'
import type { GetPropertyParams, SetPropertyParams, GetAllPropertiesParams } from './types'

const propertyAccessor = new PropertyAccessor()

/**
 * Register IPC handlers for PropertyAccessor
 */
export function registerPropertyAccessorHandlers() {
  // Get a single property
  ipcMain.handle('dbus:getProperty', async (_event, params: GetPropertyParams) => {
    try {
      return await propertyAccessor.getProperty(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.propertyName,
        params.busType
      )
    } catch (error: any) {
      console.error('Failed to get property:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  })

  // Set a single property
  ipcMain.handle('dbus:setProperty', async (_event, params: SetPropertyParams) => {
    try {
      return await propertyAccessor.setProperty(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.propertyName,
        params.value,
        params.busType
      )
    } catch (error: any) {
      console.error('Failed to set property:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  })

  // Get all properties
  ipcMain.handle('dbus:getAllProperties', async (_event, params: GetAllPropertiesParams) => {
    try {
      return await propertyAccessor.getAllProperties(
        params.serviceName,
        params.path,
        params.interfaceName,
        params.busType
      )
    } catch (error: any) {
      console.error('Failed to get all properties:', error)
      return { success: false, error: error.message || 'Unknown error' }
    }
  })
}
