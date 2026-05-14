import { Client } from "pg"

export async function GET() {

  const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  await db.connect()

  // TOTAL TRANSACTIONS
  const totalTx = await db.query(`
    SELECT COUNT(*) FROM transactions
  `)

  // TOTAL WALLETS
  const totalWallets = await db.query(`
    SELECT COUNT(*) FROM wallets
  `)

  // ATH TRANSACTIONS
  const athTx = await db.query(`
    SELECT MAX(tx_count)
    FROM daily_stats
  `)

  // DAILY STATS
  const dailyStats = await db.query(`
    SELECT *
    FROM daily_stats
    ORDER BY date ASC
  `)
const topWallets = await db.query(`
  SELECT address, balance

  FROM wallets

  ORDER BY balance DESC

  LIMIT 10
`)
const latestTransactions = await db.query(`
  SELECT
    tx_hash,
    from_address,
    to_address,
    value,
    timestamp

  FROM transactions

  ORDER BY timestamp DESC

  LIMIT 15
`)
  await db.end()

  return Response.json({
    totalTransactions:
      totalTx.rows[0].count,

    totalWallets:
      totalWallets.rows[0].count,

    athTransactions:
      athTx.rows[0].max,

    dailyStats:
  dailyStats.rows,

topWallets:
  topWallets.rows,

latestTransactions:
  latestTransactions.rows
  })
}