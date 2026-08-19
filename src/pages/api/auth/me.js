import { getUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    res.status(200).json({
      user: {
        id: user.id,
        farmtraceId: user.farmtraceId,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        village: user.village,
        state: user.state
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
