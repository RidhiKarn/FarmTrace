import { useState, useEffect } from 'react'
import TransferModal from '../TransferModal'
import MandiPrices from '../MandiPrices'

export default function FarmerDashboard({ user }) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [createdOTP, setCreatedOTP] = useState(null)
  const [formData, setFormData] = useState({
    crop: '',
    quantityKg: '',
    basePricePerKg: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/batches?type=created', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setBatches(data.batches || [])
    } catch (err) {
      console.error('Error fetching batches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create batch')
      }

      setSuccess(`Batch ${data.batch.batchCode} created successfully!`)
      setFormData({ crop: '', quantityKg: '', basePricePerKg: '' })
      fetchBatches()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStartTransfer = (batch) => {
    setSelectedBatch(batch)
    setShowTransferModal(true)
    setCreatedOTP(null)
  }

  const handleTransferCreated = (otp) => {
    setCreatedOTP(otp)
    fetchBatches()
  }

  return (
    <div>
      {/* Create Batch Section */}
      <div className="card">
        <h3 className="section-title">Create New Batch</h3>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleCreateBatch}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Crop Type *</label>
              <select
                value={formData.crop}
                onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                required
              >
                <option value="">Select Crop</option>
                <option value="Tomato">Tomato</option>
                <option value="Potato">Potato</option>
                <option value="Onion">Onion</option>
                <option value="Carrot">Carrot</option>
                <option value="Cabbage">Cabbage</option>
                <option value="Cauliflower">Cauliflower</option>
                <option value="Spinach">Spinach</option>
                <option value="Brinjal">Brinjal</option>
                <option value="Capsicum">Capsicum</option>
                <option value="Cucumber">Cucumber</option>
                <option value="Apple">Apple</option>
                <option value="Banana">Banana</option>
                <option value="Orange">Orange</option>
                <option value="Mango">Mango</option>
                <option value="Grapes">Grapes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quantity (Kg) *</label>
              <input
                type="number"
                value={formData.quantityKg}
                onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                required
                min="1"
                placeholder="Enter quantity in Kg"
              />
            </div>

            <div className="form-group">
              <label>Base Price (Rs/Kg) *</label>
              <input
                type="number"
                value={formData.basePricePerKg}
                onChange={(e) => setFormData({ ...formData, basePricePerKg: e.target.value })}
                required
                min="1"
                placeholder="Your price per Kg"
              />
            </div>
          </div>

          <button type="submit" className="btn">Create Batch</button>
        </form>

        <MandiPrices commodity={formData.crop} state={user.state} />
      </div>

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

      {/* My Batches Section */}
      <div className="card">
        <h3 className="section-title">My Batches</h3>

        {loading ? (
          <p>Loading batches...</p>
        ) : batches.length === 0 ? (
          <div className="empty-state">
            <p>No batches created yet. Create your first batch above.</p>
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
                <th>Current Owner</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
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
                    {batch.currentOwner?.farmtraceId}
                    <br />
                    <small>{batch.currentOwner?.name}</small>
                  </td>
                  <td>
                    {batch.status === 'CREATED' && batch.currentOwnerId === user.id && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleStartTransfer(batch)}
                      >
                        Start Transfer
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
          currentRole="FARMER"
          onClose={() => setShowTransferModal(false)}
          onTransferCreated={handleTransferCreated}
        />
      )}
    </div>
  )
}
