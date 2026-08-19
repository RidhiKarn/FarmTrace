import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function ConsumerPage() {
  const router = useRouter()
  const [batchCode, setBatchCode] = useState('')
  const [batchData, setBatchData] = useState(null)
  const [blockchainHistory, setBlockchainHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-load batch from URL query parameter
  useEffect(() => {
    if (router.query.code) {
      setBatchCode(router.query.code)
      searchBatch(router.query.code)
    }
  }, [router.query.code])

  const searchBatch = async (code) => {
    setError('')
    setBatchData(null)
    setBlockchainHistory([])
    setLoading(true)

    try {
      const batchRes = await fetch(`/api/public/batch/${code}`)
      const batchJson = await batchRes.json()

      if (!batchRes.ok) {
        throw new Error(batchJson.error || 'Batch not found')
      }

      setBatchData(batchJson.batch)

      const blockchainRes = await fetch(`/api/blockchain/batch/${code}`)
      const blockchainJson = await blockchainRes.json()
      setBlockchainHistory(blockchainJson.blockchainRecords || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!batchCode.trim()) {
      setError('Please enter a batch code')
      return
    }
    searchBatch(batchCode)
  }

  const getQRCodeUrl = (code) => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/consumer?code=${code}`
      : `/consumer?code=${code}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculatePriceDifference = () => {
    if (!batchData) return null
    const farmerPrice = batchData.basePricePerKg
    const retailPrice = batchData.retailPricePerKg || batchData.auctionPricePerKg || farmerPrice
    const difference = retailPrice - farmerPrice
    const percentage = ((difference / farmerPrice) * 100).toFixed(1)
    return { difference, percentage }
  }

  return (
    <>
      <Head>
        <title>FarmTrace - Consumer Portal</title>
        <meta name="description" content="Track your food from farm to fork" />
      </Head>

      <div className="consumer-page">
        <style jsx>{`
          .consumer-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a5f2a 0%, #2d8f4e 100%);
            padding: 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            color: white;
            padding: 40px 20px;
          }
          .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 1.1rem;
            opacity: 0.9;
          }
          .search-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
          }
          .search-form {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          .search-input {
            flex: 1;
            min-width: 250px;
            padding: 15px 20px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 1.1rem;
            transition: border-color 0.3s;
          }
          .search-input:focus {
            outline: none;
            border-color: #27ae60;
          }
          .search-btn {
            padding: 15px 40px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: background 0.3s;
          }
          .search-btn:hover {
            background: #1e8449;
          }
          .search-btn:disabled {
            background: #95a5a6;
            cursor: not-allowed;
          }
          .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
          }
          .result-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
          }
          .batch-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
          }
          .batch-code {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
          }
          .batch-crop {
            font-size: 1.3rem;
            color: #27ae60;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .price-section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
          }
          .price-section h3 {
            margin-bottom: 20px;
            color: #2c3e50;
            font-size: 1.2rem;
          }
          .price-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          .price-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .price-label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 8px;
          }
          .price-value {
            font-size: 1.8rem;
            font-weight: bold;
          }
          .price-farmer { color: #27ae60; }
          .price-auction { color: #e67e22; }
          .price-retail { color: #e74c3c; }
          .price-note {
            font-size: 0.8rem;
            color: #999;
            margin-top: 5px;
          }
          .farmer-earning {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-top: 20px;
          }
          .farmer-earning h4 {
            margin-bottom: 10px;
          }
          .farmer-earning .amount {
            font-size: 1.5rem;
            font-weight: bold;
          }
          .journey-section h3 {
            margin-bottom: 20px;
            color: #2c3e50;
          }
          .journey-timeline {
            position: relative;
            padding-left: 30px;
          }
          .journey-timeline::before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #27ae60;
          }
          .journey-step {
            position: relative;
            padding-bottom: 25px;
          }
          .journey-step::before {
            content: '';
            position: absolute;
            left: -25px;
            top: 5px;
            width: 15px;
            height: 15px;
            background: #27ae60;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px #27ae60;
          }
          .journey-step-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
          }
          .journey-step-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .journey-step-detail {
            font-size: 0.9rem;
            color: #666;
          }
          .blockchain-section {
            margin-top: 30px;
          }
          .blockchain-section h3 {
            margin-bottom: 15px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .blockchain-badge {
            background: #9b59b6;
            color: white;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.7rem;
          }
          .blockchain-record {
            background: #f5f0ff;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            border-left: 4px solid #9b59b6;
          }
          .blockchain-record-type {
            font-weight: bold;
            color: #9b59b6;
            margin-bottom: 5px;
          }
          .blockchain-record-hash {
            font-family: monospace;
            font-size: 0.75rem;
            color: #666;
            word-break: break-all;
          }
          .blockchain-record-time {
            font-size: 0.8rem;
            color: #999;
            margin-top: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }
          .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
          }
          .info-label {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 5px;
          }
          .info-value {
            font-weight: bold;
            color: #2c3e50;
          }
          .verified-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #d4edda;
            color: #155724;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
          }
          .ownership-chain {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
          }
          .chain-step {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            margin-bottom: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .chain-icon {
            font-size: 2rem;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #f0f0f0;
          }
          .farmer-icon { background: #d4edda; }
          .trader-icon { background: #fff3cd; }
          .apmc-icon { background: #cce5ff; }
          .wholesaler-icon { background: #e2e3e5; }
          .retailer-icon { background: #f8d7da; }
          .consumer-icon { background: #d1ecf1; }
          .chain-content {
            flex: 1;
          }
          .chain-role {
            font-weight: bold;
            color: #2c3e50;
            font-size: 0.9rem;
            margin-bottom: 3px;
          }
          .chain-name {
            color: #666;
            font-size: 0.85rem;
            margin-bottom: 5px;
          }
          .chain-price {
            font-size: 1rem;
            margin-bottom: 3px;
          }
          .farmer-price { color: #27ae60; }
          .auction-price { color: #e67e22; }
          .retail-price { color: #e74c3c; }
          .chain-earning {
            font-size: 0.85rem;
            color: #27ae60;
            background: #d4edda;
            padding: 5px 10px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 5px;
          }
          .chain-arrow {
            text-align: center;
            font-size: 1.5rem;
            color: #27ae60;
            padding: 5px 0;
          }
          .price-change {
            font-size: 0.8rem;
            margin-top: 5px;
          }
          .price-up { color: #27ae60; }
          .price-down { color: #e74c3c; }
          .total-markup { color: #9b59b6; font-weight: 500; }
          .price-summary-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-top: 20px;
          }
          .price-summary-box h4 {
            margin-bottom: 15px;
            font-size: 1.1rem;
          }
          .price-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
          }
          .summary-item {
            background: rgba(255,255,255,0.15);
            padding: 12px;
            border-radius: 8px;
          }
          .summary-label {
            display: block;
            font-size: 0.85rem;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 1.3rem;
            font-weight: bold;
          }
          .farmer-color { color: #90EE90; }
          .auction-color { color: #FFD700; }
          .retail-color { color: #FFB6C1; }
          .farmer-share {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.3);
            text-align: center;
            font-size: 1rem;
          }
        `}</style>

        <div className="container">
          <div className="header">
            <h1>FarmTrace Consumer Portal</h1>
            <p>Track your food from farm to fork - Know exactly where your produce comes from</p>
          </div>

          <div className="search-card">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                className="search-input"
                placeholder="Enter Batch Code (e.g., FT-TOM-abc123)"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Track Batch'}
              </button>
            </form>
            {error && <div className="error">{error}</div>}
          </div>

          {batchData && (
            <div className="result-card">
              <div className="batch-header">
                <div>
                  <div className="batch-code">{batchData.batchCode}</div>
                  <div className="verified-badge">
                    <span>✓</span> Blockchain Verified
                  </div>
                </div>
                <div className="batch-crop">
                  <span style={{ fontSize: '2rem' }}>🌾</span>
                  {batchData.crop}
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Quantity</div>
                  <div className="info-value">{batchData.quantityKg} Kg</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Origin</div>
                  <div className="info-value">{batchData.originVillage}, {batchData.originState}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Created By</div>
                  <div className="info-value">{batchData.createdBy?.name || 'Farmer'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Current Status</div>
                  <div className="info-value">{batchData.status?.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="price-section">
                <h3>Price Transparency - Know What the Farmer Earned</h3>
                <div className="price-grid">
                  <div className="price-card">
                    <div className="price-label">Farmer's Original Price</div>
                    <div className="price-value price-farmer">₹{batchData.basePricePerKg}/Kg</div>
                    <div className="price-note">Price set by farmer</div>
                  </div>
                  <div className="price-card">
                    <div className="price-label">APMC Auction Price</div>
                    <div className="price-value price-auction">
                      {batchData.auctionPricePerKg ? `₹${batchData.auctionPricePerKg}/Kg` : 'Not set yet'}
                    </div>
                    <div className="price-note">Price after mandi auction</div>
                  </div>
                  <div className="price-card">
                    <div className="price-label">Retail Price</div>
                    <div className="price-value price-retail">
                      {batchData.retailPricePerKg ? `₹${batchData.retailPricePerKg}/Kg` : 'Not set yet'}
                    </div>
                    <div className="price-note">Price you pay</div>
                  </div>
                </div>

                {calculatePriceDifference() && (
                  <div className="farmer-earning">
                    <h4>Farmer's Earnings</h4>
                    <div className="amount">
                      ₹{(batchData.basePricePerKg * batchData.quantityKg).toLocaleString('en-IN')}
                      <span style={{ fontSize: '1rem', opacity: 0.9 }}> for {batchData.quantityKg} Kg</span>
                    </div>
                    {batchData.auctionPricePerKg && batchData.auctionPricePerKg > batchData.basePricePerKg && (
                      <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                        The farmer received ₹{(batchData.auctionPricePerKg - batchData.basePricePerKg).toFixed(2)}/Kg more than base price at auction!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Complete Ownership Chain with Prices */}
              <div className="journey-section">
                <h3>Complete Ownership Chain with Prices</h3>
                <div className="ownership-chain">
                  {/* Farmer */}
                  <div className="chain-step">
                    <div className="chain-icon farmer-icon">👨‍🌾</div>
                    <div className="chain-content">
                      <div className="chain-role">FARMER</div>
                      <div className="chain-name">{batchData.createdBy?.name}</div>
                      <div className="chain-price farmer-price">
                        Sold at: <strong>₹{batchData.basePricePerKg}/Kg</strong>
                      </div>
                      <div className="chain-earning">
                        Total Earning: ₹{(batchData.basePricePerKg * batchData.quantityKg).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="chain-arrow">↓</div>

                  {/* Village Trader (if applicable) */}
                  {batchData.transfers?.some(t => t.toOwner?.role === 'VILLAGE_TRADER') && (
                    <>
                      <div className="chain-step">
                        <div className="chain-icon trader-icon">🏪</div>
                        <div className="chain-content">
                          <div className="chain-role">VILLAGE TRADER</div>
                          <div className="chain-name">
                            {batchData.transfers.find(t => t.toOwner?.role === 'VILLAGE_TRADER')?.toOwner?.name}
                          </div>
                          <div className="chain-price">Aggregates from farmers</div>
                        </div>
                      </div>
                      <div className="chain-arrow">↓</div>
                    </>
                  )}

                  {/* APMC Agent */}
                  <div className="chain-step">
                    <div className="chain-icon apmc-icon">🏛️</div>
                    <div className="chain-content">
                      <div className="chain-role">APMC MANDI</div>
                      <div className="chain-name">Agricultural Produce Market Committee</div>
                      <div className="chain-price auction-price">
                        Auction Price: <strong>{batchData.auctionPricePerKg ? `₹${batchData.auctionPricePerKg}/Kg` : 'Pending'}</strong>
                      </div>
                      {batchData.auctionPricePerKg && (
                        <div className="price-change">
                          {batchData.auctionPricePerKg >= batchData.basePricePerKg ? (
                            <span className="price-up">
                              ↑ ₹{(batchData.auctionPricePerKg - batchData.basePricePerKg).toFixed(2)}/Kg more than farmer's price
                            </span>
                          ) : (
                            <span className="price-down">
                              ↓ ₹{(batchData.basePricePerKg - batchData.auctionPricePerKg).toFixed(2)}/Kg less than farmer's price
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="chain-arrow">↓</div>

                  {/* Wholesaler */}
                  <div className="chain-step">
                    <div className="chain-icon wholesaler-icon">🏭</div>
                    <div className="chain-content">
                      <div className="chain-role">WHOLESALER</div>
                      <div className="chain-name">
                        {batchData.transfers?.find(t => t.toOwner?.role === 'WHOLESALER')?.toOwner?.name || 'Pending'}
                      </div>
                      <div className="chain-price">Bulk distribution</div>
                    </div>
                  </div>

                  <div className="chain-arrow">↓</div>

                  {/* Retailer */}
                  <div className="chain-step">
                    <div className="chain-icon retailer-icon">🛒</div>
                    <div className="chain-content">
                      <div className="chain-role">RETAILER</div>
                      <div className="chain-name">
                        {batchData.transfers?.find(t => t.toOwner?.role === 'RETAILER')?.toOwner?.name || 'Pending'}
                      </div>
                      <div className="chain-price retail-price">
                        Retail Price: <strong>{batchData.retailPricePerKg ? `₹${batchData.retailPricePerKg}/Kg` : 'Pending'}</strong>
                      </div>
                      {batchData.retailPricePerKg && batchData.basePricePerKg && (
                        <div className="price-change">
                          <span className="total-markup">
                            Total markup from farmer: ₹{(batchData.retailPricePerKg - batchData.basePricePerKg).toFixed(2)}/Kg
                            ({(((batchData.retailPricePerKg - batchData.basePricePerKg) / batchData.basePricePerKg) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="chain-arrow">↓</div>

                  {/* Consumer */}
                  <div className="chain-step">
                    <div className="chain-icon consumer-icon">👥</div>
                    <div className="chain-content">
                      <div className="chain-role">CONSUMER (You)</div>
                      <div className="chain-price">
                        You pay: <strong>{batchData.retailPricePerKg ? `₹${batchData.retailPricePerKg}/Kg` : 'Price pending'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Summary Box */}
                <div className="price-summary-box">
                  <h4>💰 Price Transparency Summary</h4>
                  <div className="price-summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Farmer received:</span>
                      <span className="summary-value farmer-color">₹{batchData.basePricePerKg}/Kg</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">After APMC auction:</span>
                      <span className="summary-value auction-color">
                        {batchData.auctionPricePerKg ? `₹${batchData.auctionPricePerKg}/Kg` : 'Pending'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Retailer sells at:</span>
                      <span className="summary-value retail-color">
                        {batchData.retailPricePerKg ? `₹${batchData.retailPricePerKg}/Kg` : 'Pending'}
                      </span>
                    </div>
                  </div>
                  {batchData.retailPricePerKg && (
                    <div className="farmer-share">
                      <strong>Farmer's share of final price: {((batchData.basePricePerKg / batchData.retailPricePerKg) * 100).toFixed(1)}%</strong>
                    </div>
                  )}
                </div>
              </div>

              {blockchainHistory.length > 0 && (
                <div className="blockchain-section">
                  <h3>
                    Blockchain Records
                    <span className="blockchain-badge">Immutable</span>
                  </h3>
                  {blockchainHistory.map((record, index) => (
                    <div key={index} className="blockchain-record">
                      <div className="blockchain-record-type">
                        {record.type?.replace(/_/g, ' ')}
                      </div>
                      <div className="blockchain-record-hash">
                        Block Hash: {record.hash}
                      </div>
                      <div className="blockchain-record-time">
                        {formatDate(record.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
