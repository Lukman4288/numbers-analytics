require("dotenv").config()

const { Client } = require("pg")

const db = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function generateDailyStats() {

  try {

    await db.connect()

    console.log("Connected DB")

    // =========================
    // GET DAILY TRANSACTIONS
    // =========================

    const txResult = await db.query(`
      SELECT
        DATE(timestamp) as day,
        COUNT(*) as tx_count
      FROM transactions
      GROUP BY day
      ORDER BY day ASC
    `)

    for (const row of txResult.rows) {

      const day = row.day
      const txCount = parseInt(row.tx_count)

      // =========================
      // ACTIVE WALLETS
      // =========================

      const activeWalletsResult =
        await db.query(
          `
          SELECT COUNT(DISTINCT from_address)
          as active_wallets

          FROM transactions

          WHERE DATE(timestamp) = $1
          `,
          [day]
        )

      const activeWallets =
        parseInt(
          activeWalletsResult.rows[0]
            .active_wallets
        )

      // =========================
      // NEW WALLETS
      // =========================

      const newWalletsResult =
        await db.query(
          `
          SELECT COUNT(*)
          as new_wallets

          FROM wallets

          WHERE DATE(first_seen) = $1
          `,
          [day]
        )

      const newWallets =
        parseInt(
          newWalletsResult.rows[0]
            .new_wallets
        )

      // =========================
      // SAVE DAILY STATS
      // =========================

      await db.query(
        `
        INSERT INTO daily_stats
        (
          date,
          tx_count,
          active_wallets,
          new_wallets
        )

        VALUES ($1,$2,$3,$4)

        ON CONFLICT (date)

        DO UPDATE SET
          tx_count = EXCLUDED.tx_count,
          active_wallets = EXCLUDED.active_wallets,
          new_wallets = EXCLUDED.new_wallets
        `,
        [
          day,
          txCount,
          activeWallets,
          newWallets
        ]
      )

      console.log(
        `Saved stats for ${day}`
      )
    }

    console.log("\nDONE 🚀")

    await db.end()

  } catch (err) {

    console.log(
      "Stats Error:",
      err.message
    )
  }
}

generateDailyStats()