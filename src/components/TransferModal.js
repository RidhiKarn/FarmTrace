import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import VoiceButton from './VoiceButton'
import { speak } from '../lib/voice'

export default function TransferModal({ batch, currentRole, onClose, onTransferCreated }) {
  const { lang, t } = useLanguage()
  const [formData, setFormData] = useState({
    nextOwnerEmail: '',
    transporterEmail: '',
    pickupLocation: '',
    dropoffLocation: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    speak(t('voiceTransfer'), lang)
  }, [])

  const getNextRoleOptions = () => {
    const chain = {
      FARMER: ['VILLAGE_TRADER', 'APMC_AGENT'],
      VILLAGE_TRADER: ['APMC_AGENT'],
      APMC_AGENT: ['WHOLESALER'],
      WHOLESALER: ['RETAILER']
    }
    return chain[currentRole] || []
  }

  const roleLabels = {
    VILLAGE_TRADER: lang === 'hi' ? 'गांव का व्यापारी' : 'Village Trader',
    APMC_AGENT: lang === 'hi' ? 'एपीएमसी एजेंट' : 'APMC Agent',
    WHOLESALER: lang === 'hi' ? 'थोक विक्रेता' : 'Wholesaler',
    RETAILER: lang === 'hi' ? 'खुदरा विक्रेता' : 'Retailer'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          batchId: batch.id,
          ...formData
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create transfer')
      }

      speak(`${t('voiceOTP')} ${data.otp}`, lang)
      onTransferCreated(data.otp)
      onClose()
    } catch (err) {
      setError(err.message)
      speak(err.message, lang)
    } finally {
      setLoading(false)
    }
  }

  const nextRoles = getNextRoleOptions()

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{t('startTransfer')}</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {lang === 'hi' ? 'बैच ट्रांसफर करें' : 'Transfer batch'} <strong>{batch.batchCode}</strong> ({batch.crop}, {batch.quantityKg} Kg)
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="alert alert-info">
          <strong>{lang === 'hi' ? 'वैध प्राप्तकर्ता:' : 'Valid recipients:'}</strong> {nextRoles.map(r => roleLabels[r]).join(', ')}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('nextOwnerEmail')} *</label>
            <div style={{ display: 'flex' }}>
              <input
                type="email"
                id="nextOwnerEmail"
                value={formData.nextOwnerEmail}
                onChange={(e) => setFormData({ ...formData, nextOwnerEmail: e.target.value })}
                required
                placeholder={lang === 'hi' ? 'अगले मालिक का ईमेल' : 'Email of the next owner'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="nextOwnerEmail"
                onResult={(text) => setFormData({ ...formData, nextOwnerEmail: text.replace(/\s/g, '').toLowerCase() })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('transporterEmail')}</label>
            <div style={{ display: 'flex' }}>
              <input
                type="email"
                id="transporterEmail"
                value={formData.transporterEmail}
                onChange={(e) => setFormData({ ...formData, transporterEmail: e.target.value })}
                placeholder={lang === 'hi' ? 'ट्रांसपोर्टर का ईमेल (वैकल्पिक)' : 'Email of the transporter (optional)'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="transporterEmail"
                onResult={(text) => setFormData({ ...formData, transporterEmail: text.replace(/\s/g, '').toLowerCase() })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('pickupLocation')} *</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                id="pickupLocation"
                value={formData.pickupLocation}
                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                required
                placeholder={lang === 'hi' ? 'पिकअप स्थान' : 'Where will the batch be picked up?'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="pickupLocation"
                onResult={(text) => setFormData({ ...formData, pickupLocation: text })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('dropoffLocation')} *</label>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                id="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                required
                placeholder={lang === 'hi' ? 'ड्रॉपऑफ स्थान' : 'Where will the batch be delivered?'}
                style={{ flex: 1 }}
              />
              <VoiceButton
                inputId="dropoffLocation"
                onResult={(text) => setFormData({ ...formData, dropoffLocation: text })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? (lang === 'hi' ? 'बना रहे हैं...' : 'Creating...') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
