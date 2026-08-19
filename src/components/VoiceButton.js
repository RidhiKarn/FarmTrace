import { useState } from 'react'
import { startVoiceInput, speak } from '../lib/voice'
import { useLanguage } from '../context/LanguageContext'

export default function VoiceButton({ inputId, onResult, style }) {
  const { lang, t } = useLanguage()
  const [isListening, setIsListening] = useState(false)

  const handleClick = () => {
    if (isListening) return

    setIsListening(true)
    speak(t('listening'), lang)

    startVoiceInput(
      (transcript) => {
        const input = document.getElementById(inputId)
        if (input) {
          // Update the input value
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set
          nativeInputValueSetter.call(input, transcript)

          // Trigger React's onChange
          const event = new Event('input', { bubbles: true })
          input.dispatchEvent(event)
        }
        if (onResult) onResult(transcript)
      },
      lang,
      () => setIsListening(true),
      () => setIsListening(false),
      () => setIsListening(false)
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`voice-btn ${isListening ? 'listening' : ''}`}
      title={t('voiceInput')}
      style={{
        background: isListening ? '#ef4444' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 12px',
        cursor: 'pointer',
        marginLeft: '8px',
        fontSize: '16px',
        ...style
      }}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  )
}
