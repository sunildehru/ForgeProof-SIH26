import { createContext, useContext, useState } from 'react'
import { translations } from './translations'

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key
})

export function LanguageProvider({ children }) {
  // English is STRICTLY the default whenever the website is loaded
  const [lang, setLangState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('forgeproof_lang')
      }
    } catch (_) {}
    return 'en'
  })

  const setLang = (newLang) => {
    setLangState(newLang)
  }

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en'
    setLang(next)
  }

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
