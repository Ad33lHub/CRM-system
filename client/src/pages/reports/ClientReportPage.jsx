import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useSelector } from 'react-redux';
import api from '../../lib/axios.js';
import ExportButton from '../../components/ExportButton.jsx';

const COLORS = ['#1B2A4A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function fmt(n) {
  return `PKR ${Number(n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
}

const STATUS_BADGE = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  churned: 'bg-red-100 text-red-700',
  lead: 'bg-blue-100 text-blue-700',
};

const HEALTH_BADGE = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

export default function ClientReportPage() {
  const user = useSelector((s) => s.auth.user);
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  const [allClients, setAllClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientReport, setClientReport] = useState(null);
  const [leadConversion, setLeadConversion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes] = await Promise.all([
        api.get('/analytics/clients'),
      ]);
      setAllClients(listRes.data.data ?? []);
      if (isAdmin) {
        const lcRes = await api.get('/analytics/clients/lead-conversion');
        setLeadConversion(lcRes.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchClient = useCallback(async (id) => {
    if (!id) { setClientReport(null); return; }
    setClientLoading(true);
    try {
      const res = await api.get(`/analytics/clients/${id}`);
      setClientReport(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load client report');
    } finally {
      setClientLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchClient(selectedClientId); }, [selectedClientId, fetchClient]);

  const totalRevenue = allClients.reduce((s, c) => s + (c.totalCollected ?? 0), 0);
  const totalOutstanding = allClients.reduce((s, c) => s + (c.outstandingAmount ?? 0), 0);
  const activeProjects = allClients.reduce((s, c) => s + (c.activeProjects ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Client Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Client spend and project performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-white min-w-[200px]"
          >
            <option value="">All Clients</option>
            {allClients.map((c) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
          <ExportButton
            reportType="clients"
            params={selectedClientId ? { clientId: selectedClientId } : {}}
            format="excel"
            label="Export Excel"
          />
          <ExportButton
            reportType="clients"
            params={selectedClientId ? { clientId: selectedClientId } : {}}
            format="pdf"
            label="Export PDF"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* All clients view */}
      {!selectedClientId && (
        <div className="space-y-6">
          {/* Summary cards */}
          {isAdmin && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Clients', value: allClients.length },
                { label: 'Active Projects', value: activeProjects },
                { label: 'Total Revenue', value: fmt(totalRevenue) },
                { label: 'Outstanding', value: fmt(totalOutstanding) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top clients table */}
          <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">Client Overview</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-semibold">Client</th>
                  <th className="py-2 pr-4 font-semibold">Industry</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  {isAdmin && <>
                    <th className="py-2 pr-4 font-semibold">Total Spend</th>
                    <th className="py-2 pr-4 font-semibold">Outstanding</th>
                  </>}
                  <th className="py-2 pr-4 font-semibold">Projects</th>
                  <th className="py-2 pr-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {allClients.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                    onClick={() => setSelectedClientId(c._id)}
                  >
                    <td className="py-2 pr-4 font-medium">{c.companyName}</td>
                    <td className="py-2 pr-4 text-muted-foreground capitalize">{c.industry}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    {isAdmin && <>
                      <td className="py-2 pr-4">{fmt(c.totalCollected)}</td>
                      <td className="py-2 pr-4 text-amber-600">{fmt(c.outstandingAmount)}</td>
                    </>}
                    <td className="py-2 pr-4">{c.projectCount ?? 0}</td>
                    <td className="py-2 pr-4">
                      <span className="text-xs text-primary hover:underline">View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lead conversion (admin only) */}
          {isAdmin && leadConversion && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold mb-4">Lead Conversion Metrics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <div className="text-center py-4">
                    <p className="text-5xl font-bold text-primary">{leadConversion.conversionRate?.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground mt-2">Overall conversion rate</p>
                    <p className="text-xs text-muted-foreground">{leadConversion.totalConverted} of {leadConversion.totalLeads} leads</p>
                  </div>
                  {leadConversion.avgDaysToConvert && (
                    <p className="text-center text-sm text-muted-foreground">
                      Avg {leadConversion.avgDaysToConvert} days to convert
                    </p>
                  )}
                </div>
                <div className="lg:col-span-1 overflow-x-auto">
                  <h3 className="text-sm font-semibold mb-2">By Source</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-1 pr-3 font-medium text-muted-foreground">Source</th>
                        <th className="py-1 pr-3 font-medium text-muted-foreground">Leads</th>
                        <th className="py-1 pr-3 font-medium text-muted-foreground">Won</th>
                        <th className="py-1 font-medium text-muted-foreground">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leadConversion.bySource ?? []).map((s) => (
                        <tr key={s.source} className="border-b border-border/50">
                          <td className="py-1 pr-3 capitalize">{s.source}</td>
                          <td className="py-1 pr-3">{s.total}</td>
                          <td className="py-1 pr-3">{s.converted}</td>
                          <td className="py-1">{s.rate?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(leadConversion.lostReasons ?? []).length > 0 && (
                  <div className="lg:col-span-1">
                    <h3 className="text-sm font-semibold mb-2">Lost Reasons</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={leadConversion.lostReasons}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="reason"
                          label={({ reason }) => reason?.slice(0, 12)}
                        >
                          {leadConversion.lostReasons.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individual client view */}
      {selectedClientId && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedClientId('')}
            className="text-sm text-primary hover:underline"
          >
            ← All clients
          </button>

          {clientLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : clientReport ? (
            <>
              {/* Client header */}
              <div className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{clientReport.companyName}</h2>
                    <p className="text-muted-foreground capitalize mt-1">{clientReport.industry}</p>
                    {clientReport.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Client since {new Date(clientReport.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[clientReport.status] ?? 'bg-gray-100'}`}>
                      {clientReport.status}
                    </span>
                    <ExportButton
                      reportType="clients"
                      params={{ clientId: selectedClientId }}
                      format="pdf"
                      label="Export PDF"
                    />
                  </div>
                </div>
              </div>

              {/* Financial summary (admin/manager) */}
              {isAdmin && clientReport.totalBilled !== undefined && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Billed', value: fmt(clientReport.totalBilled) },
                    { label: 'Total Collected', value: fmt(clientReport.totalCollected) },
                    { label: 'Outstanding', value: fmt(clientReport.outstandingAmount) },
                    { label: 'Avg Payment Days', value: clientReport.avgPaymentDays ? `${clientReport.avgPaymentDays} days` : 'N/A' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl border border-border p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Spend trend */}
              {isAdmin && (clientReport.spendTrend ?? []).length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-base font-semibold mb-4">Spend Trend (Last 12 Months)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={clientReport.spendTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val) => fmt(val)} />
                      <Legend />
                      <Line type="monotone" dataKey="billed" name="Billed" stroke="#94A3B8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="collected" name="Collected" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Projects table */}
              {(clientReport.projects ?? []).length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto">
                  <h3 className="text-base font-semibold mb-4">Projects</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        {['Name', 'Status', 'Health', 'Completion', isAdmin ? 'Budget' : null, isAdmin ? 'Actual' : null, 'On Time'].filter(Boolean).map((h) => (
                          <th key={h} className="py-2 pr-4 font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clientReport.projects.map((p) => (
                        <tr key={p._id} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium">{p.name}</td>
                          <td className="py-2 pr-4 capitalize">{p.status}</td>
                          <td className="py-2 pr-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HEALTH_BADGE[p.health] ?? ''}`}>
                              {p.health}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${p.completionPercent ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs">{p.completionPercent ?? 0}%</span>
                            </div>
                          </td>
                          {isAdmin && <td className="py-2 pr-4">{fmt(p.totalBudget)}</td>}
                          {isAdmin && <td className="py-2 pr-4">{fmt(p.actualCost)}</td>}
                          <td className="py-2 pr-4">
                            {p.deliveredOnTime === true ? (
                              <span className="text-green-600 text-xs font-medium">✓ Yes</span>
                            ) : p.deliveredOnTime === false ? (
                              <span className="text-red-600 text-xs font-medium">✗ No</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
