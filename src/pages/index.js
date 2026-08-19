import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
      <div className="container" style={{ paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
            FarmTrace
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '40px', opacity: 0.9 }}>
            Agricultural Supply Chain Transparency Platform
          </p>
          <p style={{ maxWidth: '600px', margin: '0 auto 40px', opacity: 0.8 }}>
            Track your produce from farm to fork. Complete transparency for farmers,
            traders, wholesalers, retailers, and consumers.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn" style={{ padding: '15px 40px', fontSize: '1.1rem', background: 'white', color: '#1e3a5f' }}>
                  Sign Up
                </Link>
                <Link href="/login" className="btn" style={{ padding: '15px 40px', fontSize: '1.1rem', background: 'transparent', border: '2px solid white' }}>
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-2" style={{ marginTop: '80px' }}>
          <div className="card">
            <h3>For Farmers</h3>
            <p>Create produce batches, set prices, and track your goods through the entire supply chain.</p>
          </div>
          <div className="card">
            <h3>For Traders and Agents</h3>
            <p>Receive and forward batches with OTP verification. Complete audit trail for every transaction.</p>
          </div>
          <div className="card">
            <h3>For Transporters</h3>
            <p>Confirm pickups and dropoffs. Transport goods but never own them - clear separation of roles.</p>
          </div>
          <div className="card">
            <h3>For Consumers</h3>
            <p>Enter batch code to see complete journey of your produce - from farm to your plate.</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white' }}>
          <h3 style={{ color: 'white' }}>🔍 Consumer Portal - Track Your Food</h3>
          <p>See the complete journey from farm to fork with full price transparency</p>
          <form onSubmit={(e) => {
            e.preventDefault()
            const code = e.target.batchCode.value
            if (code) router.push(`/consumer?code=${code}`)
          }} style={{ marginTop: '20px' }}>
            <input
              type="text"
              name="batchCode"
              placeholder="Enter batch code (e.g., FT-TOM-abc123)"
              style={{ padding: '12px', width: '280px', marginRight: '10px', borderRadius: '8px', border: 'none' }}
            />
            <button type="submit" className="btn" style={{ background: 'white', color: '#27ae60' }}>Track Batch</button>
          </form>
          <p style={{ marginTop: '15px', fontSize: '0.9rem', opacity: 0.9 }}>
            View: Farmer's Price → Auction Price → Retail Price | Full Blockchain History
          </p>
          <Link href="/consumer" style={{ color: 'white', textDecoration: 'underline', fontSize: '0.9rem' }}>
            Or go to full Consumer Portal →
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px', color: 'white', opacity: 0.7 }}>
          <p>FarmTrace - Ensuring Trust in Every Transaction</p>
        </div>
      </div>
    </div>
  )
}
