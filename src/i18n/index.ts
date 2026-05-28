/**
 * i18n Module
 * Lightweight internationalization using Zustand
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { zh } from './locales/zh'
import { en } from './locales/en'

export type Locale = 'zh' | 'en'

const locales = { zh, en } as const

type TranslationKey = keyof typeof zh

interface I18nStore {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      locale: 'zh',
      setLocale: (locale) => set({ locale }),
      t: (key, params) => {
        const { locale } = get()
        let text = locales[locale][key] || locales.zh[key] || key
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v))
          })
        }
        return text
      },
    }),
    {
      name: 'oops-dbus-i18n',
    }
  )
)

/**
 * Hook shorthand for translations
 * Usage: const { t } = useTranslation()
 * Then: t('sidebar.searchPlaceholder')
 */
export function useTranslation() {
  const { t, locale, setLocale } = useI18n()
  return { t, locale, setLocale }
}
