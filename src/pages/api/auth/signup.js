import prisma from '../../../lib/prisma'
import { hashPassword, generateToken, generateFarmtraceId } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, password, role, language, village, state } = req.body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' })
    }

    // Validate role
    const validRoles = ['FARMER', 'VILLAGE_TRADER', 'APMC_AGENT', 'WHOLESALER', 'TRANSPORTER', 'RETAILER', 'REGULATOR']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Base the next farmtraceId on the highest one actually in use, not a
    // row count — count() drifts out of sync (and collides) once any user
    // with this role has ever been deleted.
    const lastUser = await prisma.user.findFirst({
      where: { role },
      orderBy: { farmtraceId: 'desc' }
    })
    const lastNum = lastUser ? parseInt(lastUser.farmtraceId.split('-').pop(), 10) || 0 : 0

    // Generate farmtraceId
    const farmtraceId = generateFarmtraceId(role, lastNum)

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        farmtraceId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        language: language || 'en',
        village: village || null,
        state: state || null
      }
    })

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        farmtraceId: user.farmtraceId,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        village: user.village,
        state: user.state
      },
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
