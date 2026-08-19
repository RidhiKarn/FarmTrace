// Proxies the Indian government's live mandi (market) price data so the
// API key never reaches the browser. Source: Agmarknet, via data.gov.in.
// Dataset: "Variety-wise Daily Market Prices Data of Commodity"
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { commodity, state } = req.query

  if (!commodity) {
    return res.status(400).json({ error: 'commodity is required' })
  }

  const apiKey = process.env.AGMARKNET_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Mandi price API is not configured' })
  }

  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: '10'
  })
  params.set('filters[commodity]', commodity)
  if (state) params.set('filters[state]', state)

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`data.gov.in responded with ${response.status}`)
    }

    const data = await response.json()

    const prices = (data.records || []).map((r) => ({
      market: r.market,
      district: r.district,
      state: r.state,
      variety: r.variety,
      minPrice: r.min_price,
      maxPrice: r.max_price,
      modalPrice: r.modal_price,
      arrivalDate: r.arrival_date
    }))

    res.status(200).json({
      prices,
      source: 'Agmarknet, Ministry of Agriculture & Farmers Welfare (data.gov.in)'
    })
  } catch (error) {
    console.error('Mandi price fetch error:', error)
    res.status(502).json({ error: 'Failed to fetch live mandi prices' })
  }
}
