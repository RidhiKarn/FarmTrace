import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import VoiceButton from '../components/VoiceButton'
import { speak } from '../lib/voice'

export default function Login() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      speak(t('voiceLogin'), lang)
    }, 500)
  }, [lang])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      speak(lang === 'hi' ? 'लॉगिन सफल' : 'Login successful', lang)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
      speak(err.message, lang)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: '20px' }}>
          <LanguageSelector />
        </div>

        <h1>{t('appName')}</h1>
        <p>{t('loginToAccount')}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('email')}</label>
            <div style={{ display: 'flex' }}>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={lang === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="email"
                onResult={(text) => setFormData({ ...formData, email: text.replace(/\s/g, '').toLowerCase() })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={lang === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <div className="auth-links">
          <p>{t('dontHaveAccount')} <Link href="/signup">{t('signup')}</Link></p>
          <p><Link href="/">{t('backToHome')}</Link></p>
        </div>
      </div>
    </div>
  )
}
