import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useSelector } from 'react-redux';
import api from '../../lib/axios.js';
import ExportButton from '../../components/ExportButton.jsx';

const COLORS = ['#EF4444', '#F97316', '#3B82F6', '#22C55E'];
const PRIORITY_LABELS = ['critical', 'high', 'medium', 'low'];
const PERIODS = [
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'last_6m', label: 'Last 6 months' },
  { value: 'last_12m', label: 'Last 12 months' },
];
const METRICS = [
  { value: 'completionRate', label: 'Task Completion' },
  { value: 'onTimeRate', label: 'On-Time Rate' },
  { value: 'hoursLogged', label: 'Hours Logged' },
  { value: 'attendanceRate', label: 'Attendance Rate' },
];
const MEDAL = ['🥇', '🥈', '🥉'];

function pct(n) {
  return n !== null && n !== undefined ? `${Number(n).toFixed(1)}%` : 'N/A';
}

function CompareChip({ value, avg }) {
  if (value === null || value === undefined || avg === null || avg === undefined) return null;
  const above = value >= avg;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${above ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {above ? '▲ Above avg' : '▼ Below avg'}
    </span>
  );
}

export default function EmployeeReportPage() {
  const user = useSelector((s) => s.auth.user);
  const [view, setView] = useState('team');
  const [period, setPeriod] = useState('last_30d');
  const [department, setDepartment] = useState('');
  const [rankMetric, setRankMetric] = useState('completionRate');
  const [teamData, setTeamData] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [selected, setSelected] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const DEPTS = ['engineering', 'design', 'qa', 'management', 'sales', 'hr', 'finance'];

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (department) params.set('department', department);
      const [teamRes, rankRes] = await Promise.all([
        api.get(`/analytics/employees/team?${params}`),
        api.get(`/analytics/employees/ranking?metric=${rankMetric}&period=${period}`),
      ]);
      setTeamData(teamRes.data.data);
      setRanking(rankRes.data.data ?? []);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [period, department, rankMetric]);

  const fetchIndividual = useCallback(async (emp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/analytics/employees/${emp.employee._id}?period=${period}`);
      setSelected(res.data.data);
      const wRes = await api.get(`/analytics/employees/${emp.employee._id}?period=last_12m`);
      setWeekly(wRes.data.data?.weekly ?? []);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const teamAvg = teamData?.teamAverages;
  const employees = teamData?.employees ?? [];

  const priorityData = selected
    ? PRIORITY_LABELS.map((p, i) => ({
        name: p,
        value: selected.metrics?.tasks?.byPriority?.[p] ?? 0,
        fill: COLORS[i],
      })).filter((d) => d.value > 0)
    : [];

  if (loading && !teamData) {
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
          <h1 className="text-2xl font-bold">Employee Productivity Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Track performance and productivity metrics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted rounded-lg p-0.5">
            {['team', 'individual'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${view === v ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}
              >
                {v === 'team' ? 'Team View' : 'Individual View'}
              </button>
            ))}
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-white"
          >
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <ExportButton reportType="employees" params={{ period, department }} format="excel" label="Export Excel" />
          <ExportButton reportType="employees" params={{ period, department }} format="pdf" label="Export PDF" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Team View */}
      {view === 'team' && (
        <div className="space-y-6">
          {/* Team Summary Cards */}
          {teamAvg && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Avg Completion Rate', value: pct(teamAvg.completionRate) },
                { label: 'Total Hours Logged', value: `${teamAvg.totalHoursLogged?.toFixed(0) ?? 0}h` },
                { label: 'Team Attendance Rate', value: pct(teamAvg.attendanceRate) },
                { label: 'Team Members', value: employees.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Department filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Department:</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="border border-border rounded-md px-3 py-1.5 text-sm bg-white"
            >
              <option value="">All Departments</option>
              {DEPTS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Leaderboard</h2>
              <div className="flex gap-1">
                {METRICS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setRankMetric(m.value)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${rankMetric === m.value ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div
                    key={r.employee?._id ?? i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                    onClick={() => { setView('individual'); fetchIndividual(r); }}
                  >
                    <span className="text-lg w-8 text-center">{MEDAL[i] ?? `#${r.rank}`}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {(r.employee?.name ?? '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.employee?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.employee?.department}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {typeof r.metricValue === 'number' ? pct(r.metricValue) : r.metricValue}
                    </span>
                  </div>
                ))}
                {ranking.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">No data for selected metric</p>
                )}
              </div>
            )}
          </div>

          {/* Full team table */}
          <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">All Employees</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Employee', 'Dept', 'Tasks Done', 'Completion %', 'On-Time %', 'Hours', 'Attendance'].map((h) => (
                    <th key={h} className="py-2 pr-4 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr
                    key={e.employee?._id}
                    className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                    onClick={() => { setView('individual'); fetchIndividual(e); }}
                  >
                    <td className="py-2 pr-4 font-medium">{e.employee?.name}</td>
                    <td className="py-2 pr-4 capitalize text-muted-foreground">{e.employee?.department}</td>
                    <td className="py-2 pr-4">{e.metrics?.tasks?.tasksCompleted ?? 0}</td>
                    <td className="py-2 pr-4">{pct(e.metrics?.tasks?.completionRate)}</td>
                    <td className="py-2 pr-4">{pct(e.metrics?.tasks?.onTimeRate)}</td>
                    <td className="py-2 pr-4">{e.metrics?.tasks?.hoursLogged ?? 0}h</td>
                    <td className="py-2 pr-4">{pct(e.metrics?.attendance?.attendanceRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual View */}
      {view === 'individual' && (
        <div className="space-y-6">
          <button
            onClick={() => { setView('team'); setSelected(null); }}
            className="text-sm text-primary hover:underline"
          >
            ← Back to team view
          </button>

          {loading && !selected ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : selected ? (
            <>
              {/* Employee header */}
              <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selected.employee?.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selected.employee?.name}</h2>
                  <p className="text-muted-foreground text-sm capitalize">{selected.employee?.designation} · {selected.employee?.department}</p>
                </div>
                <div className="ml-auto">
                  <ExportButton
                    reportType="employees"
                    params={{ period, employeeId: selected.employee?._id }}
                    format="pdf"
                    label="Export Report"
                  />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tasks Completed', value: selected.metrics?.tasks?.tasksCompleted ?? 0, avg: teamAvg?.completionRate, metric: null },
                  { label: 'Completion Rate', value: pct(selected.metrics?.tasks?.completionRate), avg: teamAvg?.completionRate, metric: selected.metrics?.tasks?.completionRate },
                  { label: 'Hours Logged', value: `${selected.metrics?.tasks?.hoursLogged ?? 0}h` },
                  { label: 'Attendance Rate', value: pct(selected.metrics?.attendance?.attendanceRate), avg: teamAvg?.attendanceRate, metric: selected.metrics?.attendance?.attendanceRate },
                ].map(({ label, value, avg, metric }) => (
                  <div key={label} className="bg-white rounded-xl border border-border p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {avg !== undefined && metric !== undefined && (
                      <CompareChip value={metric} avg={avg} />
                    )}
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend */}
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-base font-semibold mb-4">Weekly Trend</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={selected.weekly ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tasksCompleted" name="Tasks Done" stroke="#1B2A4A" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="hoursLogged" name="Hours" stroke="#10B981" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority breakdown */}
                <div className="bg-white rounded-xl border border-border p-5">
                  <h3 className="text-base font-semibold mb-4">Task Priority Breakdown</h3>
                  {priorityData.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center mt-8">No task data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={priorityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                          {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Attendance breakdown */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-base font-semibold mb-3">Attendance Breakdown</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {[
                    { label: 'Present', value: selected.metrics?.attendance?.presentDays, color: 'text-green-600' },
                    { label: 'Absent', value: selected.metrics?.attendance?.absentDays, color: 'text-red-600' },
                    { label: 'Late', value: selected.metrics?.attendance?.lateDays, color: 'text-amber-600' },
                    { label: 'Working Days', value: selected.metrics?.attendance?.workingDays, color: 'text-foreground' },
                    { label: 'Avg Hours/Day', value: `${selected.metrics?.attendance?.avgWorkingHours ?? 0}h`, color: 'text-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select an employee from the team view to see their individual report.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
