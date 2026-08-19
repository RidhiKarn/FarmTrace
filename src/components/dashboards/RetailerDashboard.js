import { useState, useEffect } from 'react'

export default function RetailerDashboard({ user }) {
  const [incomingTransfers, setIncomingTransfers] = useState([])
  const [ownedBatches, setOwnedBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [otpInputs, setOtpInputs] = useState({})
  const [priceInputs, setPriceInputs] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      const transfersRes = await fetch('/api/transfers?type=incoming', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const transfersData = await transfersRes.json()
      setIncomingTransfers(transfersData.transfers || [])

      const batchesRes = await fetch('/api/batches?type=owned', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const batchesData = await batchesRes.json()
      setOwnedBatches(batchesData.batches || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTransfer = async (transferId) => {
    setError('')
    setSuccess('')

    const otp = otpInputs[transferId]
    if (!otp) {
      setError('Please enter the OTP')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/transfers/${transferId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept transfer')
      }

      setSuccess('Batch accepted successfully!')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSetRetailPrice = async (batchCode) => {
    setError('')
    setSuccess('')

    const price = priceInputs[batchCode]
    if (!price) {
      setError('Please enter a retail price')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/batches/${batchCode}/retail-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ retailPricePerKg: parseFloat(price) })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set retail price')
      }

      setSuccess('Retail price set successfully!')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const getConsumerLink = (batchCode) => {
    return `${window.location.origin}/consumer?code=${batchCode}`
  }

  const getQRCodeUrl = (batchCode) => {
    const consumerUrl = `${window.location.origin}/consumer?code=${batchCode}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(consumerUrl)}`
  }

  const [showQRModal, setShowQRModal] = useState(false)
  const [qrBatch, setQrBatch] = useState(null)

  const openQRModal = (batch) => {
    setQrBatch(batch)
    setShowQRModal(true)
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Incoming Transfers */}
      <div className="card">
        <h3 className="section-title">Incoming Transfers (from Wholesaler)</h3>

        {loading ? (
          <p>Loading...</p>
        ) : incomingTransfers.length === 0 ? (
          <div className="empty-state">
            <p>No pending transfers to accept.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Base Price</th>
                <th>From</th>
                <th>Transporter</th>
                <th>OTP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incomingTransfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td><strong>{transfer.batch.batchCode}</strong></td>
                  <td>{transfer.batch.crop}</td>
                  <td>{transfer.batch.quantityKg} Kg</td>
                  <td>Rs {transfer.batch.basePricePerKg}/Kg</td>
                  <td>
                    {transfer.fromOwner.farmtraceId}
                    <br />
                    <small>{transfer.fromOwner.name}</small>
                  </td>
                  <td>
                    {transfer.transporter ? (
                      <>
                        {transfer.transporter.farmtraceId}
                        <br />
                        <small>{transfer.transporter.name}</small>
                      </>
                    ) : (
                      <small>No transporter</small>
                    )}
                  </td>
                  {transfer.transporter ? (
                    <>
                      <td>
                        <strong>{transfer.dropoffOtp}</strong>
                      </td>
                      <td>
                        <small style={{ color: '#666' }}>
                          Give this code to the transporter when they deliver
                        </small>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpInputs[transfer.id] || ''}
                          onChange={(e) => setOtpInputs({
                            ...otpInputs,
                            [transfer.id]: e.target.value
                          })}
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleAcceptTransfer(transfer.id)}
                        >
                          Accept
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Owned Batches - Set Retail Price & Consumer Link */}
      <div className="card">
        <h3 className="section-title">My Inventory - Set Retail Price</h3>

        {ownedBatches.length === 0 ? (
          <div className="empty-state">
            <p>No batches in inventory.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Farmer's Price</th>
                <th>Auction Price</th>
                <th>Retail Price</th>
                <th>Set Retail Price</th>
                <th>Consumer Link</th>
              </tr>
            </thead>
            <tbody>
              {ownedBatches.map((batch) => {
                return (
                  <tr key={batch.id}>
                    <td><strong>{batch.batchCode}</strong></td>
                    <td>{batch.crop}</td>
                    <td>{batch.quantityKg} Kg</td>
                    <td style={{ color: '#27ae60' }}>
                      <strong>Rs {batch.basePricePerKg}/Kg</strong>
                      <br /><small>(Farmer)</small>
                    </td>
                    <td style={{ color: '#e67e22' }}>
                      {batch.auctionPricePerKg
                        ? <><strong>Rs {batch.auctionPricePerKg}/Kg</strong><br /><small>(APMC)</small></>
                        : <span style={{ color: '#999' }}>Not set</span>
                      }
                    </td>
                    <td style={{ color: '#e74c3c' }}>
                      {batch.retailPricePerKg
                        ? <><strong>Rs {batch.retailPricePerKg}/Kg</strong><br /><small>(Your price)</small></>
                        : <span style={{ color: '#999' }}>Not set</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="number"
                          placeholder="Rs/Kg"
                          value={priceInputs[batch.batchCode] || ''}
                          onChange={(e) => setPriceInputs({
                            ...priceInputs,
                            [batch.batchCode]: e.target.value
                          })}
                          style={{ width: '80px' }}
                        />
                        <button
                          className="btn btn-small"
                          onClick={() => handleSetRetailPrice(batch.batchCode)}
                        >
                          Set
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-small"
                        onClick={() => openQRModal(batch)}
                        style={{ background: '#9b59b6', marginBottom: '5px' }}
                      >
                        📱 QR Code
                      </button>
                      <br />
                      <a
                        href={getConsumerLink(batch.batchCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem', color: '#3498db' }}
                      >
                        View Page →
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Consumer QR / Link Info</h3>
        <p>
          Click the "QR Code" button on any batch to generate a scannable QR code.
          Consumers can scan it to see the complete journey from farm to fork.
        </p>
        <p style={{ marginTop: '10px', color: '#666' }}>
          The consumer page shows: crop info, origin, full ownership chain, all handlers,
          farmer price vs auction price vs retail price, and blockchain verification.
        </p>
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrBatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '10px' }}>Scan to Track</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {qrBatch.crop} - {qrBatch.batchCode}
            </p>

            <img
              src={getQRCodeUrl(qrBatch.batchCode)}
              alt="QR Code"
              style={{
                width: '200px',
                height: '200px',
                border: '2px solid #eee',
                borderRadius: '10px'
              }}
            />

            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
                <strong>Prices:</strong>
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                Farmer: <span style={{ color: '#27ae60' }}>₹{qrBatch.basePricePerKg}/Kg</span>
                {qrBatch.auctionPricePerKg && (
                  <> → Auction: <span style={{ color: '#e67e22' }}>₹{qrBatch.auctionPricePerKg}/Kg</span></>
                )}
                {qrBatch.retailPricePerKg && (
                  <> → Retail: <span style={{ color: '#e74c3c' }}>₹{qrBatch.retailPricePerKg}/Kg</span></>
                )}
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = getQRCodeUrl(qrBatch.batchCode)
                  link.download = `QR-${qrBatch.batchCode}.png`
                  link.click()
                }}
              >
                Download QR
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowQRModal(false)}
              >
                Close
              </button>
            </div>

            <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#999' }}>
              {getConsumerLink(qrBatch.batchCode)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
