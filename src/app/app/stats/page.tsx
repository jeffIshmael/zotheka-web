"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserMinus, RefreshCw } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats/kyc");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen bg-background text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">User Analytics</h1>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="p-2 bg-brand-green/10 text-brand-green rounded-full hover:bg-brand-green/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-2xl text-brand-red">
          {error}
        </div>
      ) : loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-black">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-green/5 border border-brand-green/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">KYC Verified</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black">{stats.verifiedUsers}</p>
                    <span className="text-brand-green font-bold text-sm">({stats.verifiedPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                  <UserMinus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/50 uppercase tracking-wider">Unverified</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black">{stats.unverifiedUsers}</p>
                    <span className="text-brand-yellow font-bold text-sm">({stats.unverifiedPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6">KYC Completion Rate</h3>
            <div className="relative h-8 bg-white/10 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-brand-green transition-all duration-1000 ease-out"
                style={{ width: `${stats.verifiedPercentage}%` }}
              />
              <div 
                className="h-full bg-brand-yellow transition-all duration-1000 ease-out"
                style={{ width: `${stats.unverifiedPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm font-semibold text-white/50">
              <span>{stats.verifiedPercentage}% Verified</span>
              <span>{stats.unverifiedPercentage}% Unverified</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
