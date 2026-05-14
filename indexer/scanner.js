require("dotenv").config()

const { ethers } = require("ethers")
const { Client } = require("pg")

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL
)

const db = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

let latestScannedBlock = 0

// SAVE TRANSACTION
async function saveTransaction(tx, block) {

  try {

    await db.query(
      `
      INSERT INTO transactions
      (
        tx_hash,
        block_number,
        from_address,
        to_address,
        value,
        gas_used,
        timestamp
      )

      VALUES ($1,$2,$3,$4,$5,$6,$7)

      ON CONFLICT (tx_hash)
      DO NOTHING
      `,
      [
        tx.hash || "",
        tx.blockNumber || 0,
        tx.from || "",
        tx.to || "",
        tx.value
          ? tx.value.toString()
          : "0",
        tx.gasLimit
          ? tx.gasLimit.toString()
          : "0",
        new Date(block.timestamp * 1000),
      ]
    )

  } catch (err) {

    console.log(
      "TX Error:",
      err.message
    )
  }
}

// SAVE WALLET
async function saveWallet(address, timestamp) {

  if (!address) return

  try {

    // GET NATIVE BALANCE
    const rawBalance =
      await provider.getBalance(address)

    const balance =
      Number(
        ethers.formatEther(rawBalance)
      )

    await db.query(
      `
      INSERT INTO wallets
      (
        address,
        first_seen,
        last_seen,
        tx_count,
        balance
      )

      VALUES ($1,$2,$3,$4,$5)

      ON CONFLICT (address)

      DO UPDATE SET
        last_seen = EXCLUDED.last_seen,
        tx_count = wallets.tx_count + 1,
        balance = EXCLUDED.balance
      `,
      [
        address,
        timestamp,
        timestamp,
        1,
        balance
      ]
    )

  } catch (err) {

    console.log(
      "Wallet Error:",
      err.message
    )
  }
}

// UPDATE DAILY STATS
async function updateDailyStats(day) {

  try {

    // =========================
    // TX COUNT
    // =========================

    const txResult = await db.query(
      `
      SELECT COUNT(*) as tx_count
      FROM transactions
      WHERE DATE(timestamp) = $1
      `,
      [day]
    )

    // =========================
    // ACTIVE WALLETS
    // =========================

    const activeResult = await db.query(
      `
      SELECT COUNT(DISTINCT from_address)
      as active_wallets

      FROM transactions

      WHERE DATE(timestamp) = $1
      `,
      [day]
    )

    // =========================
    // NEW WALLETS
    // =========================

    const newWalletResult = await db.query(
      `
      SELECT COUNT(*) as new_wallets

      FROM wallets

      WHERE DATE(first_seen) = $1
      `,
      [day]
    )

    // =========================
    // RETURNING WALLETS
    // =========================

    const returningResult = await db.query(
      `
      SELECT COUNT(*) as returning_wallets

      FROM wallets

      WHERE DATE(last_seen) = $1
      AND DATE(first_seen) < $1
      `,
      [day]
    )

    // =========================
    // AVG GAS
    // =========================

    const gasResult = await db.query(
      `
      SELECT AVG(gas_used::numeric)::BIGINT as avg_gas
      FROM transactions
      WHERE DATE(timestamp) = $1
      `,
      [day]
    )

    // =========================
    // TOTAL BLOCKS
    // =========================

    const blockResult = await db.query(
      `
      SELECT COUNT(DISTINCT block_number)
      as total_blocks

      FROM transactions

      WHERE DATE(timestamp) = $1
      `,
      [day]
    )

    // =========================
    // TPS
    // =========================

    const txCount =
      parseInt(txResult.rows[0].tx_count)

    const totalBlocks =
      parseInt(blockResult.rows[0].total_blocks)

    const avgBlockTime = 5

    const tps =
      totalBlocks > 0
        ? txCount / (totalBlocks * avgBlockTime)
        : 0

    // =========================
    // SAVE
    // =========================

    await db.query(
      `
      INSERT INTO daily_stats
      (
        date,
        tx_count,
        active_wallets,
        new_wallets,
        returning_wallets,
        avg_block_time,
        tps,
        avg_gas,
        total_blocks
      )

      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)

      ON CONFLICT (date)

      DO UPDATE SET
        tx_count = EXCLUDED.tx_count,
        active_wallets = EXCLUDED.active_wallets,
        new_wallets = EXCLUDED.new_wallets,
        returning_wallets = EXCLUDED.returning_wallets,
        avg_block_time = EXCLUDED.avg_block_time,
        tps = EXCLUDED.tps,
        avg_gas = EXCLUDED.avg_gas,
        total_blocks = EXCLUDED.total_blocks
      `,
      [
        day,
        txCount,
        parseInt(activeResult.rows[0].active_wallets),
        parseInt(newWalletResult.rows[0].new_wallets),
        parseInt(returningResult.rows[0].returning_wallets),
        avgBlockTime,
        tps,
        parseInt(gasResult.rows[0].avg_gas || 0),
        totalBlocks
      ]
    )

    console.log("Updated stats:", day)

  } catch (err) {

    console.log(
      "Stats Error:",
      err.message
    )
  }
}

// SCAN BLOCK
async function scanBlock(blockNumber) {

  try {

    const block =
      await provider.getBlock(blockNumber)

    if (!block) return

    console.log(
      "\nScanning Block:",
      blockNumber
    )

    console.log(
      "Transactions:",
      block.transactions.length
    )

    for (const txHash of block.transactions) {

      // GET FULL TX DATA
      const tx =
        await provider.getTransaction(txHash)

      console.log(tx)

      if (!tx) continue

      await saveTransaction(tx, block)

      const timestamp =
        new Date(block.timestamp * 1000)

      await saveWallet(tx.from, timestamp)
      await saveWallet(tx.to, timestamp)
    }

    const day =
      new Date(block.timestamp * 1000)
        .toISOString()
        .split("T")[0]

    await updateDailyStats(day)

  } catch (err) {

    console.log(
      "Block Error:",
      err.message
    )
  }
}

// MAIN LOOP
async function main() {

  await db.connect()

  console.log("Connected DB")

  latestScannedBlock =
    await provider.getBlockNumber()

  console.log(
    "Starting from block:",
    latestScannedBlock
  )

  setInterval(async () => {

    try {

      const latestChainBlock =
        await provider.getBlockNumber()

      if (
        latestChainBlock >
        latestScannedBlock
      ) {

        for (
          let i = latestScannedBlock + 1;
          i <= latestChainBlock;
          i++
        ) {

          await scanBlock(i)
        }

        latestScannedBlock =
          latestChainBlock
      }

    } catch (err) {

      console.log(
        "Loop Error:",
        err.message
      )
    }

  }, 5000)
}

main()