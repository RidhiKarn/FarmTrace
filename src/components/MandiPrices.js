import { useState, useEffect } from 'react'

// Shows live government mandi prices for a crop, sourced from Agmarknet
// (data.gov.in) via our own /api/mandi-prices proxy.
//
// Agmarknet reports prices in Rs. per QUINTAL (100 kg), but every price in
// this app (basePricePerKg, auctionPricePerKg, ...) is per KG — so these are
// converted here for a direct, correct comparison instead of showing the raw
// quintal figure next to a per-kg field.
function perKg(quintalPrice) {
  const n = parseFloat(quintalPrice)
  return Number.isFinite(n) ? (n / 100).toFixed(2) : '—'
}

export default function MandiPrices({ commodity, state }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!commodity) {
      setPrices([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ commodity })
    if (state) params.set('state', state)

    fetch(`/api/mandi-prices?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) throw new Error(data.error)
        setPrices(data.prices || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [commodity, state])

  if (!commodity) return null

  return (
    <div style={{ marginTop: '14px', padding: '12px 14px', background: '#f7f8f2', border: '1px solid #ddd', borderRadius: '6px' }}>
      <strong style={{ fontSize: '13px' }}>
        Live Mandi Prices — {commodity}{state ? ` (${state})` : ''}
      </strong>
      <div style={{ fontSize: '11px', color: '#888', margin: '2px 0 8px' }}>
        Source: Agmarknet, Ministry of Agriculture &amp; Farmers Welfare (data.gov.in) — converted from Rs/quintal to Rs/kg
      </div>

      {loading && <p style={{ fontSize: '13px', margin: 0 }}>Loading live prices…</p>}
      {error && <p style={{ fontSize: '13px', color: '#c0392b', margin: 0 }}>Could not load live prices right now.</p>}
      {!loading && !error && prices.length === 0 && (
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>No recent mandi data found for this crop{state ? ' in this state' : ''}.</p>
      )}

      {prices.length > 0 && (
        <table style={{ fontSize: '12.5px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Market</th>
              <th style={{ textAlign: 'left' }}>Min /kg</th>
              <th style={{ textAlign: 'left' }}>Max /kg</th>
              <th style={{ textAlign: 'left' }}>Modal /kg</th>
              <th style={{ textAlign: 'left' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={i}>
                <td>{p.market}</td>
                <td>Rs {perKg(p.minPrice)}</td>
                <td>Rs {perKg(p.maxPrice)}</td>
                <td><strong>Rs {perKg(p.modalPrice)}</strong></td>
                <td>{p.arrivalDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
