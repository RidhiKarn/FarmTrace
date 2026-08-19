import { useLanguage } from '../context/LanguageContext'
import { speak } from '../lib/voice'

export default function LanguageSelector({ style }) {
  const { lang, changeLang, t } = useLanguage()

  const handleChange = (newLang) => {
    changeLang(newLang)
    const message = newLang === 'hi'
      ? 'भाषा हिंदी में बदल गई है'
      : 'Language changed to English'
    speak(message, newLang)
  }

  return (
    <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      <span style={{ fontSize: '14px' }}>{t('selectLanguage')}:</span>
      <button
        onClick={() => handleChange('en')}
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        style={{
          padding: '6px 12px',
          border: lang === 'en' ? '2px solid #2563eb' : '1px solid #ddd',
          background: lang === 'en' ? '#dbeafe' : 'white',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: lang === 'en' ? 'bold' : 'normal'
        }}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => handleChange('hi')}
        className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
        style={{
          padding: '6px 12px',
          border: lang === 'hi' ? '2px solid #2563eb' : '1px solid #ddd',
          background: lang === 'hi' ? '#dbeafe' : 'white',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: lang === 'hi' ? 'bold' : 'normal'
        }}
      >
        🇮🇳 हिं
      </button>
      <button
        onClick={() => speak(t('voiceWelcome'), lang)}
        title="Voice Guide"
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          background: '#f0fdf4',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔊
      </button>
    </div>
  )
}
