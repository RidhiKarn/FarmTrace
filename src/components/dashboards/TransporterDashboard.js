import { useState, useEffect } from 'react'

export default function TransporterDashboard({ user }) {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpInputs, setOtpInputs] = useState({})

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/transfers?type=transporter', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTrips(data.transfers || [])
    } catch (err) {
      console.error('Error fetching trips:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPickup = async (transferId) => {
    setError('')
    setSuccess('')

    const otp = otpInputs[transferId]
    if (!otp) {
      setError('Please enter the OTP given to you by the sender')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/transfers/${transferId}/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm pickup')
      }

      setSuccess('Pickup confirmed!')
      setOtpInputs({ ...otpInputs, [transferId]: '' })
      fetchTrips()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleConfirmDropoff = async (transferId) => {
    setError('')
    setSuccess('')

    const otp = otpInputs[transferId]
    if (!otp) {
      setError('Please enter the OTP given to you by the recipient')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/transfers/${transferId}/dropoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm dropoff')
      }

      setSuccess('Dropoff confirmed!')
      setOtpInputs({ ...otpInputs, [transferId]: '' })
      fetchTrips()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  return (
    <div>
      <div className="alert alert-info">
        <strong>Note:</strong> As a transporter, you carry goods but never own them.
        Ownership always remains with Farmers, Traders, APMC Agents, Wholesalers, or Retailers.
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h3 className="section-title">My Transport Trips</h3>

        {loading ? (
          <p>Loading trips...</p>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <p>No transport trips assigned yet.</p>
            <p style={{ marginTop: '10px', color: '#666' }}>
              When a stakeholder creates a transfer and assigns you as the transporter,
              the trip will appear here.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>From</th>
                <th>To</th>
                <th>Pickup Location</th>
                <th>Dropoff Location</th>
                <th>Pickup Time</th>
                <th>Dropoff Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td><strong>{trip.batch.batchCode}</strong></td>
                  <td>{trip.batch.crop}</td>
                  <td>{trip.batch.quantityKg} Kg</td>
                  <td>
                    {trip.fromOwner.farmtraceId}
                    <br />
                    <small>{trip.fromOwner.name}</small>
                    <br />
                    <small>({trip.fromOwner.role})</small>
                  </td>
                  <td>
                    {trip.toOwner.farmtraceId}
                    <br />
                    <small>{trip.toOwner.name}</small>
                    <br />
                    <small>({trip.toOwner.role})</small>
                  </td>
                  <td>{trip.pickupLocation}</td>
                  <td>{trip.dropoffLocation}</td>
                  <td>{formatDate(trip.pickupTime)}</td>
                  <td>{formatDate(trip.dropoffTime)}</td>
                  <td>
                    {trip.accepted ? (
                      <span className="badge badge-at-retailer">Delivered</span>
                    ) : trip.dropoffTime ? (
                      <span className="badge badge-at-wholesaler">Dropped Off</span>
                    ) : trip.pickupTime ? (
                      <span className="badge badge-in-transit">In Transit</span>
                    ) : (
                      <span className="badge badge-created">Pending Pickup</span>
                    )}
                  </td>
                  <td>
                    {!trip.pickupTime && (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="OTP from sender"
                          value={otpInputs[trip.id] || ''}
                          onChange={(e) => setOtpInputs({
                            ...otpInputs,
                            [trip.id]: e.target.value
                          })}
                          style={{ width: '100px' }}
                        />
                        <button
                          className="btn btn-small"
                          onClick={() => handleConfirmPickup(trip.id)}
                        >
                          Confirm Pickup
                        </button>
                      </div>
                    )}
                    {trip.pickupTime && !trip.dropoffTime && (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="OTP from recipient"
                          value={otpInputs[trip.id] || ''}
                          onChange={(e) => setOtpInputs({
                            ...otpInputs,
                            [trip.id]: e.target.value
                          })}
                          style={{ width: '100px' }}
                        />
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleConfirmDropoff(trip.id)}
                        >
                          Confirm Dropoff
                        </button>
                      </div>
                    )}
                    {trip.dropoffTime && !trip.accepted && (
                      <small style={{ color: '#666' }}>Awaiting acceptance</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Trip Statistics</h3>
        <div className="grid grid-2">
          <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
            <h4>Total Trips</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{trips.length}</p>
          </div>
          <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '8px' }}>
            <h4>Completed Trips</h4>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {trips.filter(t => t.dropoffTime).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
