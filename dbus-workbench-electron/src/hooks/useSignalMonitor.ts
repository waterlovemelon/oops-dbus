/**
 * useSignalMonitor Hook
 * Manages D-Bus signal subscriptions and event tracking
 */

import { useCallback, useEffect, useState } from 'react'
import { ipcClient } from '../ipc/ipcClient'
import type { SignalEvent, SignalSubscriptionParams } from '../types/electron-api'

const MAX_SIGNAL_EVENTS = 200

type Subscription = SignalSubscriptionParams

export function useSignalMonitor() {
  const [events, setEvents] = useState<SignalEvent[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])

  // Set up signal event listener
  useEffect(() => {
    ipcClient.onSignalReceived((event: SignalEvent) => {
      setEvents((prev) => [...prev, event].slice(-MAX_SIGNAL_EVENTS))
    })

    return () => {
      ipcClient.removeSignalListener()
    }
  }, [])

  const subscribe = useCallback(
    async (params: Subscription) => {
      try {
        await ipcClient.subscribeSignal(params)
        setSubscriptions((prev) =>
          prev.some((sub) => isSameSubscription(sub, params)) ? prev : [...prev, params]
        )
      } catch (error) {
        console.error('Failed to subscribe to signal:', error)
        throw error
      }
    },
    []
  )

  const unsubscribe = useCallback(
    async (params: Subscription) => {
      try {
        await ipcClient.unsubscribeSignal(params)
        setSubscriptions((prev) => prev.filter((sub) => !isSameSubscription(sub, params)))
      } catch (error) {
        console.error('Failed to unsubscribe from signal:', error)
        throw error
      }
    },
    []
  )

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  const isSubscribed = useCallback(
    (params: Subscription) => {
      return subscriptions.some((sub) => isSameSubscription(sub, params))
    },
    [subscriptions]
  )

  return {
    events,
    subscriptions,
    subscribe,
    unsubscribe,
    clearEvents,
    isSubscribed,
  }
}

function isSameSubscription(left: Subscription, right: Subscription): boolean {
  return (
    left.serviceName === right.serviceName &&
    left.path === right.path &&
    left.interfaceName === right.interfaceName &&
    left.signalName === right.signalName &&
    left.busType === right.busType
  )
}
