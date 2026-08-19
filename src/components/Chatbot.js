import { useState, useRef, useEffect } from 'react'

// Knowledge base for FarmTrace - Bilingual (Hindi + English)
const knowledgeBase = {
  greetings: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'namaskar', 'pranam'],

  // Hindi keywords mapping
  hindiKeywords: {
    batch: ['batch', 'baith', 'fasal', 'maal', 'sabzi', 'banao', 'banaye', 'banayein', 'banana', 'naya', 'create'],
    transfer: ['transfer', 'bhejo', 'bhejein', 'bhejna', 'dena', 'de do', 'forward', 'aage'],
    otp: ['otp', 'code', 'password', 'number', 'verify', 'pramaan'],
    price: ['price', 'daam', 'rate', 'paisa', 'paise', 'rupay', 'rupee', 'kitna', 'kitne', 'kimat', 'keemat', 'mulya', 'auction', 'neelami', 'mandi'],
    track: ['track', 'dekho', 'dekhein', 'kahan', 'kidhar', 'pata', 'status', 'sthiti'],
    help: ['help', 'madad', 'sahayata', 'kaise', 'kya', 'kaun', 'samjhao', 'batao', 'bataiye']
  },

  responses: {
    greeting: "Hello! I'm FarmTrace Assistant. How can I help you today?\n\nनमस्ते! मैं FarmTrace Assistant हूं।\n\nYou can ask me about:\n- Creating batches / बैच बनाना\n- Transferring produce / माल भेजना\n- Tracking prices / दाम देखना\n- Using OTP",

    batch_hindi: "बैच कैसे बनाएं:\n\n1. Farmer के रूप में Login करें\n2. Dashboard पर जाएं\n3. फसल का नाम, मात्रा (Kg), और दाम भरें\n4. 'Create Batch' पर क्लिक करें\n\nआपको एक unique code मिलेगा जैसे BT-0001\n\n---\nHow to create batch:\n1. Login as Farmer\n2. Fill crop, quantity, price\n3. Click Create Batch",

    batch: "To create a batch:\n1. Login as a Farmer\n2. Go to Dashboard\n3. Fill crop name, quantity (Kg), and your price\n4. Click 'Create Batch'\n\nYour batch will get a unique code like BT-0001.\n\n---\nबैच बनाने के लिए Farmer login करें और फसल की जानकारी भरें।",

    transfer_hindi: "माल कैसे भेजें (Transfer):\n\n1. अपने batch पर 'Transfer' क्लिक करें\n2. खरीदार चुनें (Trader/APMC/Wholesaler)\n3. Pickup और Dropoff location डालें\n4. OTP मिलेगा - खरीदार को दें\n5. खरीदार OTP डालकर माल लेगा\n\n---\nClick Transfer → Select buyer → Share OTP",

    transfer: "To transfer a batch:\n1. Click 'Transfer' on your batch\n2. Select recipient (Village Trader/APMC/Wholesaler)\n3. Add pickup & dropoff locations\n4. Share the OTP with recipient\n5. Recipient enters OTP to accept\n\n---\nTransfer करने के लिए OTP शेयर करें।",

    otp_hindi: "OTP क्या है?\n\nOTP = One Time Password (एक बार का पासवर्ड)\n\n• Transfer शुरू करने पर OTP मिलता है\n• यह OTP खरीदार को दें\n• खरीदार OTP डालकर माल लेता है\n• हर OTP सिर्फ एक बार काम करता है\n\nइससे चोरी नहीं हो सकती!",

    otp: "OTP (One-Time Password) ensures secure transfers:\n- Generated when you initiate a transfer\n- Share it with the recipient\n- They enter it to accept the batch\n- Each OTP works only once\n\nThis prevents unauthorized transfers!\n\n---\nOTP से माल सुरक्षित रहता है।",

    price_hindi: "दाम कैसे काम करता है:\n\n1. किसान का दाम - किसान जो rate रखता है\n2. मंडी/Auction दाम - APMC में नीलामी के बाद\n3. दुकान का दाम - Retailer का final price\n\nग्राहक देख सकता है कि किसान को कितना मिला!\n\n---\nConsumer portal पर सब दाम दिखते हैं।",

    price: "FarmTrace tracks 3 prices:\n1. Farmer's Base Price - Set by farmer\n2. Auction Price - Set by APMC after mandi auction\n3. Retail Price - Set by retailer\n\nConsumers can see all prices and farmer's share!\n\n---\nतीन दाम track होते हैं: किसान, मंडी, दुकान",

    track_hindi: "माल कहां है देखें:\n\n1. Consumer Portal खोलें (/consumer)\n2. Batch code डालें या QR scan करें\n3. पूरा सफर देखें - खेत से दुकान तक\n4. सभी दाम और किसान की कमाई देखें\n\n---\nQR code scan करके tracking देखें।",

    blockchain: "Blockchain में सब record होता है:\n- Batch बनना\n- हर Transfer\n- दाम बदलना\n- सब timestamps\n\nकोई record बदल नहीं सकता - पूरा पारदर्शी!\n\n---\nEvery transaction is permanently recorded. No tampering possible!",

    help_hindi: "मैं इनमें मदद कर सकता हूं:\n\n• बैच कैसे बनाएं - 'batch banana hai'\n• माल कैसे भेजें - 'transfer kaise karein'\n• OTP क्या है - 'OTP kya hai'\n• दाम देखना - 'price batao'\n• ट्रैकिंग - 'maal kahan hai'\n\nहिंदी या English में पूछें!",

    help: "I can help you with:\n\n• Creating batches - 'batch kaise banaye'\n• Transferring produce - 'transfer kaise kare'\n• OTP system - 'OTP kya hai'\n• Price tracking - 'daam batao'\n• Consumer tracking - 'maal kahan hai'\n\nAsk in Hindi or English!",

    default_hindi: "माफ कीजिए, समझ नहीं आया।\n\nये पूछ सकते हैं:\n• 'batch kaise banaye'\n• 'transfer kaise kare'\n• 'OTP kya hai'\n• 'daam batao'\n• 'madad chahiye'\n\nया English में पूछें!",

    default: "I'm not sure about that. Try asking:\n\n• 'How to create batch' / 'batch kaise banaye'\n• 'How to transfer' / 'transfer kaise kare'\n• 'What is OTP' / 'OTP kya hai'\n• 'Show prices' / 'daam batao'\n\nया हिंदी में पूछें!"
  }
}

// Extract batch code from message
function extractBatchCode(message) {
  const patterns = [
    /BT-\d+/i,
    /batch\s*(?:code\s*)?[:\s]*([A-Z0-9-]+)/i,
    /([A-Z]{2,3}-\d{4})/i
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return match[0].toUpperCase()
    }
  }
  return null
}

// Check if message is asking about a specific batch
function isBatchQuery(message) {
  const msg = message.toLowerCase()
  const batchCode = extractBatchCode(message)

  if (batchCode) {
    const queryWords = ['price', 'daam', 'rate', 'kya', 'kitna', 'status', 'kahan', 'where', 'details', 'info', 'batao', 'bata', 'show', 'dekho']
    return queryWords.some(word => msg.includes(word))
  }
  return false
}

// Fetch batch data from API
async function fetchBatchData(batchCode) {
  try {
    const response = await fetch(`/api/public/batch/${batchCode}`)
    const data = await response.json()

    if (response.ok && data.batch) {
      const batch = data.batch
      return `📦 **${batch.batchCode}** - ${batch.crop}\n\n` +
        `🌾 मात्रा (Quantity): ${batch.quantityKg} Kg\n` +
        `📍 Origin: ${batch.originVillage || 'N/A'}, ${batch.originState || 'N/A'}\n\n` +
        `💰 **Prices / दाम:**\n` +
        `• किसान का दाम (Farmer): ₹${batch.basePricePerKg}/Kg\n` +
        `• मंडी दाम (Auction): ${batch.auctionPricePerKg ? '₹' + batch.auctionPricePerKg + '/Kg' : 'Not set yet'}\n` +
        `• दुकान दाम (Retail): ${batch.retailPricePerKg ? '₹' + batch.retailPricePerKg + '/Kg' : 'Not set yet'}\n\n` +
        `📊 Status: ${batch.status?.replace('_', ' ')}\n` +
        `👨‍🌾 Farmer: ${batch.createdBy?.name || 'N/A'}`
    } else {
      return `❌ Batch "${batchCode}" नहीं मिला।\n\nBatch not found. Please check the code and try again.`
    }
  } catch (error) {
    return `⚠️ Error fetching batch data. Please try again.`
  }
}

// Simple keyword matching (returns object with response and whether it needs async)
function getResponse(message) {
  const msg = message.toLowerCase().trim()

  // Check for batch-specific query first
  const batchCode = extractBatchCode(message)
  if (batchCode && isBatchQuery(message)) {
    return { type: 'batch_query', batchCode }
  }

  // Greetings
  if (knowledgeBase.greetings.some(g => msg.includes(g))) {
    return { type: 'static', response: knowledgeBase.responses.greeting }
  }

  // Check Hindi keywords
  const isHindi = /[\u0900-\u097F]/.test(message) ||
    ['kya', 'kaise', 'kahan', 'kitna', 'batao', 'hai', 'hain', 'mein', 'ka', 'ki', 'ke', 'chahiye', 'karo', 'kare', 'karein'].some(w => msg.includes(w))

  // Batch creation related
  if (knowledgeBase.hindiKeywords.batch.some(k => msg.includes(k)) && (msg.includes('kaise') || msg.includes('banana') || msg.includes('banaye') || msg.includes('create') || msg.includes('how'))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.batch_hindi : knowledgeBase.responses.batch }
  }

  // Transfer related
  if (knowledgeBase.hindiKeywords.transfer.some(k => msg.includes(k))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.transfer_hindi : knowledgeBase.responses.transfer }
  }

  // OTP related
  if (knowledgeBase.hindiKeywords.otp.some(k => msg.includes(k))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.otp_hindi : knowledgeBase.responses.otp }
  }

  // Price related (general, not batch-specific)
  if (knowledgeBase.hindiKeywords.price.some(k => msg.includes(k))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.price_hindi : knowledgeBase.responses.price }
  }

  // Track related
  if (knowledgeBase.hindiKeywords.track.some(k => msg.includes(k))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.track_hindi : knowledgeBase.responses.blockchain }
  }

  // Blockchain related
  if (msg.includes('blockchain') || msg.includes('secure') || msg.includes('tamper') || msg.includes('record')) {
    return { type: 'static', response: knowledgeBase.responses.blockchain }
  }

  // Help related
  if (knowledgeBase.hindiKeywords.help.some(k => msg.includes(k))) {
    return { type: 'static', response: isHindi ? knowledgeBase.responses.help_hindi : knowledgeBase.responses.help }
  }

  return { type: 'static', response: isHindi ? knowledgeBase.responses.default_hindi : knowledgeBase.responses.default }
}

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hello ${user?.name || 'there'}! I'm FarmTrace Assistant. How can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    // Show typing indicator
    setIsTyping(true)

    // Get response (might be async for batch queries)
    const result = getResponse(userMessage)

    if (result.type === 'batch_query') {
      // Fetch actual batch data
      const batchResponse = await fetchBatchData(result.batchCode)
      setMessages(prev => [...prev, { role: 'bot', content: batchResponse }])
      setIsTyping(false)
    } else {
      // Static response with slight delay
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', content: result.response }])
        setIsTyping(false)
      }, 500 + Math.random() * 500)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    'BT-0005 ka price?',
    'Batch kaise banaye?',
    'OTP kya hai?',
    'Help / Madad'
  ]

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 1000,
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '360px',
          height: '500px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>FarmTrace Assistant</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>AI-powered help</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            background: '#f8f9fa'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '10px'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 15px',
                  borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: msg.role === 'user' ? 'white' : '#333',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-line',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                <div style={{
                  padding: '10px 15px',
                  borderRadius: '15px 15px 15px 0',
                  background: 'white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  <span className="typing-dots">●●●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div style={{
            padding: '10px 15px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            background: 'white'
          }}>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(q)
                  setTimeout(() => handleSend(), 100)
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  border: '1px solid #667eea',
                  borderRadius: '15px',
                  background: 'white',
                  color: '#667eea',
                  cursor: 'pointer'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '15px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '10px',
            background: 'white'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                padding: '10px 20px',
                background: input.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .typing-dots {
          animation: blink 1.4s infinite;
        }
        @keyframes blink {
          0%, 20% { opacity: 0.2; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0.2; }
        }
      `}</style>
    </>
  )
}
