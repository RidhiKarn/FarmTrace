import { useState, useEffect } from 'react'
import TransferModal from '../TransferModal'

export default function VillageTraderDashboard({ user }) {
  const [incomingTransfers, setIncomingTransfers] = useState([])
  const [ownedBatches, setOwnedBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [otpInputs, setOtpInputs] = useState({})
  const [createdOTP, setCreatedOTP] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch incoming transfers
      const transfersRes = await fetch('/api/transfers?type=incoming', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const transfersData = await transfersRes.json()
      setIncomingTransfers(transfersData.transfers || [])

      // Fetch owned batches
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

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* OTP Display */}
      {createdOTP && (
        <div className="card">
          <div className="otp-display">
            <h4>Pickup OTP</h4>
            <div className="otp-code">{createdOTP}</div>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Give this OTP to the transporter at pickup (or directly to the next owner if no transporter is assigned)
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setCreatedOTP(null)}>
            Close
          </button>
        </div>
      )}

      {/* Incoming Transfers */}
      <div className="card">
        <h3 className="section-title">Incoming Transfers</h3>

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

      {/* Owned Batches - Forward */}
      <div className="card">
        <h3 className="section-title">My Batches (Forward to APMC Agent)</h3>

        {ownedBatches.length === 0 ? (
          <div className="empty-state">
            <p>No batches in your possession.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Base Price</th>
                <th>Status</th>
                <th>Origin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ownedBatches.map((batch) => (
                <tr key={batch.id}>
                  <td><strong>{batch.batchCode}</strong></td>
                  <td>{batch.crop}</td>
                  <td>{batch.quantityKg} Kg</td>
                  <td>Rs {batch.basePricePerKg}/Kg</td>
                  <td>
                    <span className={`badge badge-${batch.status.toLowerCase().replace('_', '-')}`}>
                      {batch.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <small>{batch.originVillage}, {batch.originState}</small>
                  </td>
                  <td>
                    {batch.status !== 'IN_TRANSIT' && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleForwardBatch(batch)}
                      >
                        Forward
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          batch={selectedBatch}
          currentRole="VILLAGE_TRADER"
          onClose={() => setShowTransferModal(false)}
          onTransferCreated={handleTransferCreated}
        />
      )}
    </div>
  )
}
