import { useState } from 'react'

export default function RegulatorDashboard({ user }) {
  const [searchType, setSearchType] = useState('batchCode')
  const [searchValue, setSearchValue] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearchResult(null)

    if (!searchValue.trim()) {
      setError('Please enter a search value')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      if (searchType === 'batchCode') {
        // Search by batch code
        const res = await fetch(`/api/batches/${searchValue}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Batch not found')
        }

        setSearchResult({ type: 'batch', data: data.batch })
      } else {
        // Search by FarmTrace ID
        const res = await fetch(`/api/users/search?farmtraceId=${searchValue}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'User not found')
        }

        setSearchResult({ type: 'user', data: data.user })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const getRoleLabel = (role) => {
    const labels = {
      FARMER: 'Farmer',
      VILLAGE_TRADER: 'Village Trader',
      APMC_AGENT: 'APMC Agent',
      WHOLESALER: 'Wholesaler',
      TRANSPORTER: 'Transporter',
      RETAILER: 'Retailer',
      REGULATOR: 'Regulator'
    }
    return labels[role] || role
  }

  return (
    <div>
      <div className="alert alert-info">
        <strong>Regulator Access:</strong> Read-only access to audit and verify supply chain data.
        You can search by batch code or FarmTrace ID to view complete records.
      </div>

      {/* Search Section */}
      <div className="card">
        <h3 className="section-title">Search Records</h3>

        <form onSubmit={handleSearch}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Search By</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="batchCode">Batch Code</option>
                <option value="farmtraceId">FarmTrace ID</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                {searchType === 'batchCode' ? 'Batch Code' : 'FarmTrace ID'}
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'batchCode' ? 'e.g., BT-0001' : 'e.g., FT-FARMER-0001'}
              />
            </div>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="alert alert-error" style={{ marginTop: '15px' }}>{error}</div>}
      </div>

      {/* Search Results */}
      {searchResult && searchResult.type === 'batch' && (
        <div className="card">
          <h3 className="section-title">Batch Details: {searchResult.data.batchCode}</h3>

          <div className="grid grid-2">
            <div>
              <h4>Basic Information</h4>
              <table>
                <tbody>
                  <tr><td><strong>Batch Code</strong></td><td>{searchResult.data.batchCode}</td></tr>
                  <tr><td><strong>Crop</strong></td><td>{searchResult.data.crop}</td></tr>
                  <tr><td><strong>Quantity</strong></td><td>{searchResult.data.quantityKg} Kg</td></tr>
                  <tr><td><strong>Base Price</strong></td><td>Rs {searchResult.data.basePricePerKg}/Kg</td></tr>
                  <tr><td><strong>Retail Price</strong></td><td>{searchResult.data.retailPricePerKg ? `Rs ${searchResult.data.retailPricePerKg}/Kg` : 'Not set'}</td></tr>
                  <tr><td><strong>Status</strong></td><td>{searchResult.data.status}</td></tr>
                  <tr><td><strong>Origin</strong></td><td>{searchResult.data.originVillage}, {searchResult.data.originState}</td></tr>
                  <tr><td><strong>Created</strong></td><td>{formatDate(searchResult.data.createdAt)}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4>Ownership</h4>
              <table>
                <tbody>
                  <tr>
                    <td><strong>Created By</strong></td>
                    <td>
                      {searchResult.data.createdBy?.farmtraceId}<br />
                      <small>{searchResult.data.createdBy?.name} ({getRoleLabel(searchResult.data.createdBy?.role)})</small>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Current Owner</strong></td>
                    <td>
                      {searchResult.data.currentOwner?.farmtraceId}<br />
                      <small>{searchResult.data.currentOwner?.name} ({getRoleLabel(searchResult.data.currentOwner?.role)})</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer Timeline */}
          <h4 style={{ marginTop: '30px' }}>Transfer History</h4>
          {searchResult.data.transfers?.length === 0 ? (
            <p style={{ color: '#666' }}>No transfers recorded yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Transporter</th>
                  <th>Pickup Location</th>
                  <th>Dropoff Location</th>
                  <th>Pickup Time</th>
                  <th>Dropoff Time</th>
                  <th>OTP</th>
                  <th>Accepted</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {searchResult.data.transfers?.map((transfer, index) => (
                  <tr key={transfer.id}>
                    <td>{index + 1}</td>
                    <td>
                      {transfer.fromOwner?.farmtraceId}<br />
                      <small>{transfer.fromOwner?.name}</small><br />
                      <small>({getRoleLabel(transfer.fromOwner?.role)})</small>
                    </td>
                    <td>
                      {transfer.toOwner?.farmtraceId}<br />
                      <small>{transfer.toOwner?.name}</small><br />
                      <small>({getRoleLabel(transfer.toOwner?.role)})</small>
                    </td>
                    <td>
                      {transfer.transporter ? (
                        <>
                          {transfer.transporter.farmtraceId}<br />
                          <small>{transfer.transporter.name}</small>
                        </>
                      ) : '-'}
                    </td>
                    <td>{transfer.pickupLocation}</td>
                    <td>{transfer.dropoffLocation}</td>
                    <td>{formatDate(transfer.pickupTime)}</td>
                    <td>{formatDate(transfer.dropoffTime)}</td>
                    <td><code>{transfer.otp}</code></td>
                    <td>{transfer.accepted ? 'Yes' : 'No'}</td>
                    <td>{formatDate(transfer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {searchResult && searchResult.type === 'user' && (
        <div className="card">
          <h3 className="section-title">User Details: {searchResult.data?.farmtraceId}</h3>
          <table>
            <tbody>
              <tr><td><strong>FarmTrace ID</strong></td><td>{searchResult.data?.farmtraceId}</td></tr>
              <tr><td><strong>Name</strong></td><td>{searchResult.data?.name}</td></tr>
              <tr><td><strong>Role</strong></td><td>{getRoleLabel(searchResult.data?.role)}</td></tr>
              <tr><td><strong>Village</strong></td><td>{searchResult.data?.village || '-'}</td></tr>
              <tr><td><strong>State</strong></td><td>{searchResult.data?.state || '-'}</td></tr>
              <tr><td><strong>Registered</strong></td><td>{formatDate(searchResult.data?.createdAt)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
