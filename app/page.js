"use client"

import { useEffect, useState } from "react"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Home() {

  const [stats, setStats] = useState(null)

  useEffect(() => {

    async function loadStats() {

      const res = await fetch("/api/stats")

      const data = await res.json()

      setStats(data)
    }

    // first load
    loadStats()

    // realtime refresh every 5s
    const interval = setInterval(() => {
      loadStats()
    }, 5000)

    return () => clearInterval(interval)

  }, [])

  if (!stats) {

    return (

      <main className="min-h-screen bg-black text-white flex items-center justify-center">

        <h1 className="text-3xl">
          Loading Analytics...
        </h1>

      </main>
    )
  }

  return (

    <div
      className="
        min-h-screen
        bg-black
        text-white
        relative
        overflow-hidden
      "
    >

      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0
          opacity-0,5
          bg-cover
          bg-center
          bg-no-repeat
          blur-sm
        "
        style={{
          backgroundImage:
            "url('/memedna-bg.jpg')"
        }}
      />

      {/* OVERLAY */}

      <div
  className="
    absolute
    inset-0
    bg-white/5
  "
/>

      {/* CONTENT */}

      <main className="relative z-10 p-10">

        {/* HEADER */}

        <div className="mb-12">

          <h1 className="text-6xl font-bold">
            Numbers Ecosystem Analytics by MemeDNA
          </h1>

          <p className="text-zinc-400 mt-4 text-lg">
            Real-time blockchain analytics for Numbers Mainnet
          </p>

        </div>

        {/* TOP STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              Total Transactions
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.totalTransactions}
            </h2>

          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              Total Wallets
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.totalWallets}
            </h2>

          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              ATH Daily Transactions
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.athTransactions}
            </h2>

          </div>

        </div>

        {/* SECONDARY STATS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              Daily Active Wallets
            </p>

            <h2 className="text-4xl font-bold mt-3">

              {
                stats.dailyStats[
                  stats.dailyStats.length - 1
                ]?.active_wallets
              }

            </h2>

          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              New Wallets
            </p>

            <h2 className="text-4xl font-bold mt-3">

              {
                stats.dailyStats[
                  stats.dailyStats.length - 1
                ]?.new_wallets
              }

            </h2>

          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              TPS
            </p>

            <h2 className="text-4xl font-bold mt-3">

              {
                Number(
                  stats.dailyStats[
                    stats.dailyStats.length - 1
                  ]?.tps || 0
                ).toFixed(2)
              }

            </h2>

          </div>

          <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">

            <p className="text-zinc-400">
              Avg Gas
            </p>

            <h2 className="text-4xl font-bold mt-3">

              {
                Number(
                  stats.dailyStats[
                    stats.dailyStats.length - 1
                  ]?.avg_gas || 0
                ).toLocaleString()
              }

            </h2>

          </div>

        </div>

        {/* LIVE TRANSACTIONS */}

        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 mt-12">

          <h2 className="text-3xl font-bold mb-6">
            Live Transactions
          </h2>

          <div className="space-y-4">

            {stats.latestTransactions.map((tx) => (

              <div
                key={tx.tx_hash}
                className="
                  bg-zinc-800/70
                  rounded-xl
                  p-4
                  flex
                  justify-between
                  items-center
                  hover:bg-zinc-700/70
                  transition
                "
              >

                {/* LEFT */}

                <div className="space-y-1">

                  <p className="text-xs text-zinc-400">
                    TX HASH
                  </p>

                  <a
                    href={`https://mainnet.num.network/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      font-mono
                      text-sm
                      text-cyan-400
                      hover:text-cyan-300
                      hover:underline
                    "
                  >

                    {tx.tx_hash.slice(0, 14)}...

                  </a>

                  <div className="text-xs text-zinc-500">

                    <p>
                      From:
                      {" "}
                      {tx.from_address?.slice(0, 10)}...
                    </p>

                    <p>
                      To:
                      {" "}
                      {tx.to_address?.slice(0, 10)}...
                    </p>

                  </div>

                </div>

                {/* RIGHT */}

                <div className="text-right">

                  <p className="text-2xl font-bold">

                    {
                      Number(tx.value || 0) / 1e18
                    }

                  </p>

                  <p className="text-zinc-400 text-sm">
                    NUM
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* TOP WHALES */}

        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 mt-12">

          <h2 className="text-3xl font-bold mb-6">
            Top Whale Wallets
          </h2>

          <div className="space-y-4">

            {stats.topWallets.map((wallet, index) => (

              <div
                key={wallet.address}
                className="
                  flex
                  justify-between
                  items-center
                  bg-zinc-800/70
                  p-4
                  rounded-xl
                "
              >

                <div>

                  <p className="text-zinc-400 text-sm">
                    #{index + 1}
                  </p>

                  <p className="font-mono text-sm">
                    {wallet.address.slice(0, 12)}...
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-bold">
                    {Number(wallet.balance).toFixed(2)}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    NUM
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* CHART */}

        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 mt-12">

          <h2 className="text-3xl font-bold mb-6">
            Daily Transactions
          </h2>

          <div className="h-[450px]">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={stats.dailyStats}>

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="tx_count"
                  stroke="#00bfff"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>

      </main>

    </div>
  )
}