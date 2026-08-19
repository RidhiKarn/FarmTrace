// Voice utilities for Speech-to-Text and Text-to-Speech

export function initSpeechRecognition(lang = 'en') {
  if (typeof window === 'undefined') return null

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser')
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US'

  return recognition
}

export function speak(text, lang = 'en') {
  if (typeof window === 'undefined') return

  const synthesis = window.speechSynthesis
  if (!synthesis) {
    console.warn('Speech Synthesis not supported in this browser')
    return
  }

  // Cancel any ongoing speech
  synthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1

  synthesis.speak(utterance)
}

export function startVoiceInput(callback, lang = 'en', onStart, onEnd, onError) {
  const recognition = initSpeechRecognition(lang)

  if (!recognition) {
    if (onError) onError('Speech recognition not supported')
    return null
  }

  recognition.onstart = () => {
    if (onStart) onStart()
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    if (callback) callback(transcript)
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    if (onError) onError(event.error)
  }

  recognition.onend = () => {
    if (onEnd) onEnd()
  }

  try {
    recognition.start()
  } catch (error) {
    console.error('Error starting recognition:', error)
    if (onError) onError(error.message)
  }

  return recognition
}

// Voice Input Button Component Hook
export function useVoiceInput(lang = 'en') {
  const startListening = (inputId, onResult) => {
    const input = document.getElementById(inputId)
    if (!input) return

    startVoiceInput(
      (transcript) => {
        input.value = transcript
        // Trigger React's onChange
        const event = new Event('input', { bubbles: true })
        input.dispatchEvent(event)
        if (onResult) onResult(transcript)
        speak(lang === 'hi' ? 'आवाज प्राप्त हुई' : 'Voice received', lang)
      },
      lang,
      () => {
        speak(lang === 'hi' ? 'सुन रहा हूं' : 'Listening', lang)
      },
      () => {},
      (error) => {
        speak(lang === 'hi' ? 'त्रुटि हुई' : 'Error occurred', lang)
      }
    )
  }

  return { startListening, speak: (text) => speak(text, lang) }
}
