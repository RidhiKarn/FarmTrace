import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function PublicBatchPage() {
  const router = useRouter()
  const { code } = router.query
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (code) {
      fetchBatch()
    }
  }, [code])

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/batches/${code}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Batch not found')
      }

      setBatch(data.batch)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getRoleLabel = (role) => {
    const labels = {
      FARMER: 'Farmer',
      VILLAGE_TRADER: 'Village Trader',
      APMC_AGENT: 'APMC Agent (Mandi)',
      WHOLESALER: 'Wholesaler',
      TRANSPORTER: 'Transporter',
      RETAILER: 'Retailer'
    }
    return labels[role] || role
  }

  const calculateMarkup = () => {
    if (!batch?.retailPricePerKg || !batch?.basePricePerKg) return null
    const markup = ((batch.retailPricePerKg - batch.basePricePerKg) / batch.basePricePerKg) * 100
    return markup.toFixed(1)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div className="container text-center">
          <p>Loading batch information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
        <div className="container">
          <div className="card text-center">
            <h2>Batch Not Found</h2>
            <p style={{ color: '#666', marginTop: '10px' }}>{error}</p>
            <Link href="/" className="btn" style={{ marginTop: '20px' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const markup = calculateMarkup()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: '#1e3a5f', color: 'white', padding: '20px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>FarmTrace Jaipur</h1>
            <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '30px' }}>
        {/* Batch Header */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ marginBottom: '10px' }}>Batch: {batch.batchCode}</h2>
              <p style={{ fontSize: '1.5rem' }}>{batch.crop}</p>
              <p style={{ opacity: 0.9 }}>{batch.quantityKg} Kg</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge badge-${batch.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                {batch.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Origin Info */}
        <div className="card">
          <h3 className="section-title">Origin Information</h3>
          <div className="grid grid-2">
            <div>
              <p><strong>Origin Village:</strong> {batch.originVillage || 'Not specified'}</p>
              <p><strong>Origin State:</strong> {batch.originState || 'Not specified'}</p>
              <p><strong>Created:</strong> {formatDate(batch.createdAt)}</p>
            </div>
            <div>
              <p><strong>Farmer:</strong> {batch.createdBy?.name}</p>
              <p><strong>Farmer ID:</strong> <code>{batch.createdBy?.farmtraceId}</code></p>
              <p><strong>Role:</strong> {getRoleLabel(batch.createdBy?.role)}</p>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="card">
          <h3 className="section-title">Price Information</h3>
          <div className="price-comparison">
            <div className="price-box base">
              <div className="label">Farmer's Base Price</div>
              <div className="value">Rs {batch.basePricePerKg}/Kg</div>
            </div>
            <div className="price-box retail">
              <div className="label">Retail Price</div>
              <div className="value">
                {batch.retailPricePerKg ? `Rs ${batch.retailPricePerKg}/Kg` : 'Not set yet'}
              </div>
            </div>
          </div>
          {markup && (
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
              Total Markup: <strong>{markup}%</strong> from farm to retail
            </p>
          )}
        </div>

        {/* Current Owner */}
        <div className="card">
          <h3 className="section-title">Current Location</h3>
          <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
            <p style={{ fontSize: '1.1rem' }}>
              <strong>Current Owner:</strong> {batch.currentOwner?.name}
            </p>
            <p><strong>FarmTrace ID:</strong> <code>{batch.currentOwner?.farmtraceId}</code></p>
            <p><strong>Role:</strong> {getRoleLabel(batch.currentOwner?.role)}</p>
            {batch.currentOwner?.village && (
              <p><strong>Location:</strong> {batch.currentOwner.village}, {batch.currentOwner.state}</p>
            )}
          </div>
        </div>

        {/* Ownership Chain */}
        <div className="card">
          <h3 className="section-title">Complete Ownership Chain</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Ownership is always with stakeholders (Farmer, Trader, APMC Agent, Wholesaler, Retailer).
            Transporters only carry goods - they never own the produce.
          </p>

          <div className="timeline">
            {/* Initial Creation */}
            <div className="timeline-item">
              <h4>{getRoleLabel(batch.createdBy?.role)}: {batch.createdBy?.name}</h4>
              <p>
                <strong>ID:</strong> {batch.createdBy?.farmtraceId}<br />
                <strong>Event:</strong> Batch Created<br />
                <strong>Time:</strong> {formatDate(batch.createdAt)}
              </p>
            </div>

            {/* Transfers */}
            {batch.transfers?.map((transfer, index) => (
              <div key={transfer.id}>
                {/* Transfer Event */}
                <div className="timeline-item">
                  <h4>Transfer #{index + 1}</h4>
                  <p>
                    <strong>From:</strong> {transfer.fromOwner?.name} ({getRoleLabel(transfer.fromOwner?.role)})<br />
                    <strong>To:</strong> {transfer.toOwner?.name} ({getRoleLabel(transfer.toOwner?.role)})<br />
                    {transfer.transporter && (
                      <>
                        <strong>Transporter:</strong> {transfer.transporter.name} (ID: {transfer.transporter.farmtraceId})<br />
                      </>
                    )}
                    <strong>Pickup:</strong> {transfer.pickupLocation}<br />
                    <strong>Dropoff:</strong> {transfer.dropoffLocation}<br />
                    {transfer.pickupTime && (
                      <><strong>Pickup Time:</strong> {formatDate(transfer.pickupTime)}<br /></>
                    )}
                    {transfer.dropoffTime && (
                      <><strong>Dropoff Time:</strong> {formatDate(transfer.dropoffTime)}<br /></>
                    )}
                    <strong>Status:</strong> {transfer.accepted ? 'Accepted' : 'Pending'}
                  </p>
                </div>

                {/* New Owner after acceptance */}
                {transfer.accepted && (
                  <div className="timeline-item">
                    <h4>{getRoleLabel(transfer.toOwner?.role)}: {transfer.toOwner?.name}</h4>
                    <p>
                      <strong>ID:</strong> {transfer.toOwner?.farmtraceId}<br />
                      <strong>Event:</strong> Batch Received (OTP Verified)<br />
                      <strong>Location:</strong> {transfer.dropoffLocation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transparency Note */}
        <div className="card" style={{ background: '#fef3c7' }}>
          <h3>About This Tracking</h3>
          <p>
            This batch has been tracked through the FarmTrace supply chain system.
            Every ownership transfer requires OTP verification, ensuring that
            produce cannot be claimed without proper handoff.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Note:</strong> Transporters (if any) only carry the goods - they never become owners.
            Ownership always transitions between: Farmer → Village Trader → APMC Agent → Wholesaler → Retailer.
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
          <p>FarmTrace Jaipur - Transparent Supply Chain Tracking</p>
          <Link href="/" style={{ color: '#2563eb' }}>Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
