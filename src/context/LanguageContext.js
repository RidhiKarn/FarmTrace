import { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation } from '../lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('farmtrace-lang')
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      setLang(savedLang)
    }
  }, [])

  const changeLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('farmtrace-lang', newLang)
  }

  const t = (key) => getTranslation(lang, key)

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
