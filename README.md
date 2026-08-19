# FarmTrace Jaipur

A full-stack agricultural supply chain tracking application built with Next.js, Prisma, and SQLite.

## Features

- **7 User Roles**: Farmer, Village Trader, APMC Agent, Wholesaler, Transporter, Retailer, Regulator
- **OTP-Based Transfers**: Secure batch transfers with 6-digit OTP verification
- **Complete Traceability**: Track produce from farm to consumer
- **Public Consumer Page**: Anyone can view batch journey via `/batch/[code]`
- **Role-Based Dashboards**: Each stakeholder sees relevant actions

## Important Ownership Rule

**Transporters carry goods but NEVER own them.** Ownership always stays with:
- Farmer → Village Trader → APMC Agent → Wholesaler → Retailer

## Setup Instructions

### 1. Install Dependencies

```bash
cd "C:/Users/Ridhi/OneDrive/Desktop/FarmTrace-Jaipur"
npm install
```

### 2. Generate Prisma Client & Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open in Browser

Visit: http://localhost:3000

## User Flows

### Farmer
1. Sign up as FARMER
2. Create batches (crop, quantity, price)
3. Start transfer to Village Trader or APMC Agent
4. Share OTP with recipient

### Village Trader / APMC Agent / Wholesaler
1. Sign up with respective role
2. View incoming transfers
3. Enter OTP to accept batch
4. Forward to next stakeholder in chain

### Transporter
1. Sign up as TRANSPORTER
2. View assigned trips
3. Confirm pickup and dropoff
4. (Cannot own batches)

### Retailer
1. Accept batches from Wholesaler
2. Set retail price
3. Share consumer link/QR

### Regulator
1. Read-only access
2. Search by batch code or FarmTrace ID
3. View complete audit trail

### Consumer (Public)
1. No login required
2. Visit /batch/[code]
3. View complete supply chain journey

## FarmTrace ID Format

Each user gets a unique ID:
- `FT-FARMER-0001`
- `FT-TRADER-0001`
- `FT-APMC-0001`
- `FT-WHOLE-0001`
- `FT-TRANS-0001`
- `FT-RETAIL-0001`
- `FT-REGUL-0001`

## Batch Code Format

Each batch gets: `BT-0001`, `BT-0002`, etc.

## Tech Stack

- **Frontend**: Next.js 14, React
- **Backend**: Next.js API Routes
- **Database**: SQLite via Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Database Reset

To reset the database:

```bash
rm prisma/dev.db
npx prisma db push
```
