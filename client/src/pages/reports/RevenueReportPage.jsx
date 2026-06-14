import React, { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../lib/axios.js';
import ExportButton from '../../components/ExportButton.jsx';

const COLORS = ['#1B2A4A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

function fmt(n) {
  return `PKR ${Number(n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
}

function pct(n) {
  return n !== null && n !== undefined ? `${Number(n).toFixed(1)}%` : 'N/A';
}

function KpiCard({ title, value, subtitle, trend, trendValue }) {
  const up = trend === 'up';
  const down = trend === 'down';
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trendValue !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${up ? 'text-green-600' : down ? 'text-red-600' : 'text-muted-foreground'}`}>
          {up ? <ArrowUp className="h-3 w-3" /> : down ? <ArrowDown className="h-3 w-3" /> : null}
          {trendValue}
        </div>
      )}
    </div>
  );
}

const BUCKET_LABELS = {
  current: 'Current',
  days_30: '1–30 days',
  days_60: '31–60 days',
  days_90: '61–90 days',
  days_90plus: '90+ days',
};

export default function RevenueReportPage() {
  const user = useSelector((s) => s.auth.user);
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [byClient, setByClient] = useState([]);
  const [byType, setByType] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [receivables, setReceivables] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, clientRes, typeRes, growthRes] = await Promise.all([
        api.get(`/analytics/revenue/dashboard`),
        api.get(`/analytics/revenue/by-client?limit=10`),
        api.get(`/analytics/revenue/by-type`),
        api.get(`/analytics/revenue/growth?months=12`),
      ]);
      setDashboard(dashRes.data.data);
      setByClient(clientRes.data.data ?? []);
      setByType(typeRes.data.data ?? []);
      setGrowth(growthRes.data.data ?? []);

      if (isAdmin) {
        const recvRes = await api.get(`/analytics/revenue/receivables`);
        setReceivables(recvRes.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const metrics = dashboard?.metrics;
  const monthly = dashboard?.monthly ?? [];
  const avgRevenue = growth.length > 0 ? growth.reduce((s, g) => s + g.revenue, 0) / growth.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  const exportParams = { year };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-white"
          >
            {[0, 1, 2].map((offset) => {
              const y = new Date().getFullYear() - offset;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <ExportButton reportType="revenue" params={exportParams} format="excel" label="Export Excel" />
          <ExportButton reportType="revenue" params={exportParams} format="pdf" label="Export PDF" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="MRR (This Month)"
          value={fmt(metrics?.mrrCurrent)}
          subtitle="Monthly recurring revenue"
        />
        <KpiCard
          title="ARR (Projected)"
          value={fmt(metrics?.arrProjected)}
          subtitle="Annualised run rate"
        />
        <KpiCard
          title="YTD Revenue"
          value={fmt(metrics?.totalRevenueYTD)}
          subtitle="Collected this year"
        />
        <KpiCard
          title="Collection Rate"
          value={pct(metrics?.collectionRate)}
          subtitle="Collected vs billed"
          trend={metrics?.collectionRate >= 80 ? 'up' : 'down'}
          trendValue={metrics?.collectionRate >= 80 ? 'On track' : 'Below target'}
        />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold mb-4">Monthly Revenue ({year})</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthly} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => fmt(val)} />
            <Legend />
            <Bar yAxisId="left" dataKey="billed" name="Billed" fill="#94A3B8" />
            <Bar yAxisId="left" dataKey="collected" name="Collected" fill="#10B981" />
            <Line yAxisId="right" type="monotone" dataKey="outstanding" name="Outstanding" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Client + Type charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Client */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Revenue by Client</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={byClient.slice(0, 10)} margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="companyName" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => fmt(val)} />
              <Bar dataKey="totalCollected" name="Collected" fill="#1B2A4A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Revenue by Project Type</h2>
          {byType.length === 0 ? (
            <p className="text-muted-foreground text-sm mt-8 text-center">No project type data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  dataKey="totalCollected"
                  nameKey="type"
                  label={({ name, percent }) => `${Array.isArray(name) ? name[0] : name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => fmt(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Growth Trend */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold mb-4">Revenue Growth Trend (Last 12 Months)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={growth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val, name) => [fmt(val), name]}
              labelFormatter={(l) => l}
            />
            <ReferenceLine y={avgRevenue} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Avg', position: 'right', fontSize: 11 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1B2A4A" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Receivables Table (admin only) */}
      {isAdmin && receivables && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Aged Receivables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold">Bucket</th>
                  <th className="text-right py-2 font-semibold">Count</th>
                  <th className="text-right py-2 font-semibold">Total Amount</th>
                  <th className="text-right py-2 font-semibold">% of Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(BUCKET_LABELS).map(([key, label]) => {
                  const bucket = receivables[key] ?? { count: 0, totalAmount: 0 };
                  const total = Object.values(receivables).reduce((s, b) => s + (b?.totalAmount ?? 0), 0);
                  const sharePct = total > 0 ? ((bucket.totalAmount / total) * 100).toFixed(1) : '0.0';
                  return (
                    <tr
                      key={key}
                      className={`border-b border-border/50 ${key === 'days_90plus' ? 'bg-red-50 text-red-700 font-medium' : 'hover:bg-muted/30'}`}
                    >
                      <td className="py-2">{label}</td>
                      <td className="py-2 text-right">{bucket.count}</td>
                      <td className="py-2 text-right">{fmt(bucket.totalAmount)}</td>
                      <td className="py-2 text-right">{sharePct}%</td>
                    </tr>
                  );
                })}
                <tr className="font-bold border-t-2 border-border">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">
                    {Object.values(receivables).reduce((s, b) => s + (b?.count ?? 0), 0)}
                  </td>
                  <td className="py-2 text-right">
                    {fmt(Object.values(receivables).reduce((s, b) => s + (b?.totalAmount ?? 0), 0))}
                  </td>
                  <td className="py-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
