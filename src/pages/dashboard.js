import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FarmerDashboard from '../components/dashboards/FarmerDashboard'
import VillageTraderDashboard from '../components/dashboards/VillageTraderDashboard'
import APMCAgentDashboard from '../components/dashboards/APMCAgentDashboard'
import WholesalerDashboard from '../components/dashboards/WholesalerDashboard'
import TransporterDashboard from '../components/dashboards/TransporterDashboard'
import RetailerDashboard from '../components/dashboards/RetailerDashboard'
import RegulatorDashboard from '../components/dashboards/RegulatorDashboard'
import Chatbot from '../components/Chatbot'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p>Loading...</p>
      </div>
    )
  }

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'FARMER':
        return <FarmerDashboard user={user} />
      case 'VILLAGE_TRADER':
        return <VillageTraderDashboard user={user} />
      case 'APMC_AGENT':
        return <APMCAgentDashboard user={user} />
      case 'WHOLESALER':
        return <WholesalerDashboard user={user} />
      case 'TRANSPORTER':
        return <TransporterDashboard user={user} />
      case 'RETAILER':
        return <RetailerDashboard user={user} />
      case 'REGULATOR':
        return <RegulatorDashboard user={user} />
      default:
        return <p>Unknown role</p>
    }
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
      <header className="header">
        <div className="header-content">
          <h1>FarmTrace Jaipur</h1>
          <div className="nav-links">
            <span>Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-small btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="profile-card">
          <h2>{getRoleLabel(user?.role)} Dashboard</h2>
          <div style={{ marginTop: '10px' }}>
            <span className="farmtrace-id">{user?.farmtraceId}</span>
          </div>
          <p style={{ marginTop: '10px', opacity: 0.8 }}>
            {user?.village && `${user.village}, `}{user?.state || 'India'}
          </p>
        </div>

        {getDashboardComponent()}
      </div>

      {/* AI Chatbot */}
      <Chatbot user={user} />
    </div>
  )
}
