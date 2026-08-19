import { useState, useEffect } from 'react'
import TransferModal from '../TransferModal'
import MandiPrices from '../MandiPrices'

export default function APMCAgentDashboard({ user }) {
  const [incomingTransfers, setIncomingTransfers] = useState([])
  const [ownedBatches, setOwnedBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [otpInputs, setOtpInputs] = useState({})
  const [auctionPrices, setAuctionPrices] = useState({})
  const [priceCheckCrop, setPriceCheckCrop] = useState('')
  const [createdOTP, setCreatedOTP] = useState(null)
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

  const handleForwardBatch = (batch) => {
    setSelectedBatch(batch)
    setShowTransferModal(true)
    setCreatedOTP(null)
  }

  const handleTransferCreated = (otp) => {
    setCreatedOTP(otp)
    fetchData()
  }

  const handleSetAuctionPrice = async (batchCode) => {
    setError('')
    setSuccess('')

    const price = auctionPrices[batchCode]
    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid auction price')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/batches/${batchCode}/auction-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ auctionPricePerKg: parseFloat(price) })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set auction price')
      }

      setSuccess(`Auction price set to Rs ${price}/Kg for batch ${batchCode}. Recorded on blockchain!`)
      setAuctionPrices({ ...auctionPrices, [batchCode]: '' })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {createdOTP && (
        <div className="card">
          <div className="otp-display">
            <h4>Pickup OTP</h4>
            <div className="otp-code">{createdOTP}</div>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Give this OTP to the transporter at pickup (or directly to the wholesaler if no transporter is assigned)
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setCreatedOTP(null)}>
            Close
          </button>
        </div>
      )}

      {/* Incoming Transfers */}
      <div className="card">
        <h3 className="section-title">Incoming Transfers (from Farmers/Village Traders)</h3>

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
                <th>From</th>
                <th>Transporter</th>
                <th>Locations</th>
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
                  <td>
                    {transfer.fromOwner.farmtraceId}
                    <br />
                    <small>{transfer.fromOwner.name} ({transfer.fromOwner.role})</small>
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
                  <td>
                    <small>
                      From: {transfer.pickupLocation}<br />
                      To: {transfer.dropoffLocation}
                    </small>
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

      {/* Owned Batches - Set Auction Price & Forward */}
      <div className="card">
        <h3 className="section-title">Batches at APMC Mandi - Set Auction Price</h3>
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
          Set the auction price after conducting the mandi auction. This price will be recorded on blockchain and shown to consumers.
        </p>

        {ownedBatches.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px' }}>Check live government mandi price for:</label>
            <select
              value={priceCheckCrop}
              onChange={(e) => setPriceCheckCrop(e.target.value)}
              style={{ marginLeft: '8px', width: 'auto' }}
            >
              <option value="">Select crop</option>
              {[...new Set(ownedBatches.map((b) => b.crop))].map((crop) => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <MandiPrices commodity={priceCheckCrop} state={user.state} />
          </div>
        )}

        {ownedBatches.length === 0 ? (
          <div className="empty-state">
            <p>No batches at APMC mandi.</p>
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
                <th>Set Auction Price</th>
                <th>Origin</th>
                <th>Forward</th>
              </tr>
            </thead>
            <tbody>
              {ownedBatches.map((batch) => (
                <tr key={batch.id}>
                  <td><strong>{batch.batchCode}</strong></td>
                  <td>{batch.crop}</td>
                  <td>{batch.quantityKg} Kg</td>
                  <td style={{ color: '#27ae60' }}>
                    <strong>Rs {batch.basePricePerKg}/Kg</strong>
                    <br /><small>(Farmer's price)</small>
                  </td>
                  <td>
                    {batch.auctionPricePerKg ? (
                      <span style={{ color: '#e67e22' }}>
                        <strong>Rs {batch.auctionPricePerKg}/Kg</strong>
                        <br /><small>(Auction set)</small>
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>Not set</span>
                    )}
                  </td>
                  <td>
                    {!batch.auctionPricePerKg ? (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="number"
                          placeholder="Rs/Kg"
                          value={auctionPrices[batch.batchCode] || ''}
                          onChange={(e) => setAuctionPrices({
                            ...auctionPrices,
                            [batch.batchCode]: e.target.value
                          })}
                          style={{ width: '80px' }}
                          min="0"
                          step="0.5"
                        />
                        <button
                          className="btn btn-small btn-warning"
                          onClick={() => handleSetAuctionPrice(batch.batchCode)}
                          style={{ backgroundColor: '#e67e22' }}
                        >
                          Set
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#27ae60' }}>✓ Done</span>
                    )}
                  </td>
                  <td>
                    <small>{batch.originVillage}, {batch.originState}</small>
                  </td>
                  <td>
                    {batch.status !== 'IN_TRANSIT' && batch.auctionPricePerKg && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleForwardBatch(batch)}
                      >
                        Forward
                      </button>
                    )}
                    {batch.status !== 'IN_TRANSIT' && !batch.auctionPricePerKg && (
                      <small style={{ color: '#999' }}>Set price first</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showTransferModal && (
        <TransferModal
          batch={selectedBatch}
          currentRole="APMC_AGENT"
          onClose={() => setShowTransferModal(false)}
          onTransferCreated={handleTransferCreated}
        />
      )}
    </div>
  )
}
