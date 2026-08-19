import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'farmtrace-secret'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  })

  return user
}

export function generateFarmtraceId(role, count) {
  const roleMap = {
    FARMER: 'FARMER',
    VILLAGE_TRADER: 'TRADER',
    APMC_AGENT: 'APMC',
    WHOLESALER: 'WHOLE',
    TRANSPORTER: 'TRANS',
    RETAILER: 'RETAIL',
    REGULATOR: 'REGUL'
  }
  const prefix = roleMap[role] || 'USER'
  const num = String(count + 1).padStart(4, '0')
  return `FT-${prefix}-${num}`
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateBatchCode(count) {
  const num = String(count + 1).padStart(4, '0')
  return `BT-${num}`
}

// Middleware helper
export function withAuth(handler) {
  return async (req, res) => {
    const user = await getUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    req.user = user
    return handler(req, res)
  }
}

// Check if role can own batches
export function canOwnBatch(role) {
  return ['FARMER', 'VILLAGE_TRADER', 'APMC_AGENT', 'WHOLESALER', 'RETAILER'].includes(role)
}

// Get next expected role in supply chain
export function getNextRoles(currentRole) {
  const chain = {
    FARMER: ['VILLAGE_TRADER', 'APMC_AGENT'],
    VILLAGE_TRADER: ['APMC_AGENT'],
    APMC_AGENT: ['WHOLESALER'],
    WHOLESALER: ['RETAILER'],
    RETAILER: []
  }
  return chain[currentRole] || []
}

// Get batch status for role
export function getStatusForRole(role) {
  const statusMap = {
    FARMER: 'CREATED',
    VILLAGE_TRADER: 'AT_VILLAGE_TRADER',
    APMC_AGENT: 'AT_APMC',
    WHOLESALER: 'AT_WHOLESALER',
    RETAILER: 'AT_RETAILER'
  }
  return statusMap[role] || 'CREATED'
}
