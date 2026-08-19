import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import VoiceButton from '../components/VoiceButton'
import { speak } from '../lib/voice'

export default function Signup() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FARMER',
    language: 'en',
    village: '',
    state: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      speak(t('voiceSignup'), lang)
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, language: lang })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      speak(lang === 'hi' ? 'खाता सफलतापूर्वक बनाया गया' : 'Account created successfully', lang)
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
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '20px' }}>
          <LanguageSelector />
        </div>

        <h1>{t('appName')}</h1>
        <p>{t('createAccount')}</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('fullName')} *</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={lang === 'hi' ? 'अपना पूरा नाम दर्ज करें' : 'Enter your full name'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="name"
                onResult={(text) => setFormData({ ...formData, name: text })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('email')} *</label>
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
            <label>{t('password')} *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder={lang === 'hi' ? 'न्यूनतम 6 अक्षर' : 'Minimum 6 characters'}
            />
          </div>

          <div className="form-group">
            <label>{t('role')} *</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="FARMER">{t('farmer')}</option>
              <option value="VILLAGE_TRADER">{t('villageTrader')}</option>
              <option value="APMC_AGENT">{t('apmcAgent')}</option>
              <option value="WHOLESALER">{t('wholesaler')}</option>
              <option value="TRANSPORTER">{t('transporter')}</option>
              <option value="RETAILER">{t('retailer')}</option>
              <option value="REGULATOR">{t('regulator')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('village')} ({t('optional')})</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                id="village"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder={lang === 'hi' ? 'अपने गांव का नाम' : 'Your village name'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="village"
                onResult={(text) => setFormData({ ...formData, village: text })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('state')} ({t('optional')})</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder={lang === 'hi' ? 'अपना राज्य' : 'Your state'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="state"
                onResult={(text) => setFormData({ ...formData, state: text })}
              />
            </div>
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('creatingAccount') : t('signup')}
          </button>
        </form>

        <div className="auth-links">
          <p>{t('alreadyHaveAccount')} <Link href="/login">{t('login')}</Link></p>
          <p><Link href="/">{t('backToHome')}</Link></p>
        </div>
      </div>
    </div>
  )
}
