import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSLEBalance: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch all profiles to calculate total liabilities
        const { data: profiles } = await supabase.from("profiles").select("sle_balance");
        const { count: txCount } = await supabase.from("transactions").select("*", { count: "exact", head: true });

        const totalUsers = profiles ? profiles.length : 0;
        const totalSLE = profiles ? profiles.reduce((acc, curr) => acc + (Number(curr.sle_balance) || 0), 0) : 0;

        setStats({
          totalUsers,
          totalSLEBalance: totalSLE,
          totalTransactions: txCount || 0,
        });
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto text-slate-900 dark:text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">NovaPay Admin Command Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">System Liquidity & Platform Metrics</p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
          ● System Live
        </span>
      </div>

      {loading ? (
        <p className="text-sm">Loading analytics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Users</p>
            <h2 className="text-3xl font-extrabold">{stats.totalUsers}</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">User SLE Liabilities</p>
            <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.totalSLEBalance.toFixed(2)} SLE
            </h2>
            <p className="text-[10px] text-slate-400 mt-2">Total user balances owed by NovaPay</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Transactions Processed</p>
            <h2 className="text-3xl font-extrabold">{stats.totalTransactions}</h2>
          </div>
        </div>
      )}
    </div>
  );
};