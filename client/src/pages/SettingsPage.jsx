import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Receipt, ShieldCheck, Megaphone, Loader2, Save, Send } from 'lucide-react';
import { PageHeader } from '../components/ui/page-header.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useBroadcastMutation,
} from '../services/settingsApi.js';

const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';
const selectCls =
  'h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

function Field({ label, hint, children }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const [broadcast, { isLoading: isBroadcasting }] = useBroadcastMutation();

  const [org, setOrg] = useState({ companyName: '', address: '', supportEmail: '', logoUrl: '' });
  const [inv, setInv] = useState({
    currency: 'USD',
    taxRate: 0,
    invoicePrefix: 'INV-',
    paymentTermsDays: 14,
    footerNote: '',
  });
  const [sec, setSec] = useState({
    maxLoginAttempts: 5,
    lockoutMinutes: 120,
    sessionTimeoutMinutes: 60,
  });
  const [msg, setMsg] = useState({ title: '', message: '', priority: 'normal' });

  // Hydrate local form state once settings load.
  useEffect(() => {
    const s = data?.data;
    if (!s) return;
    if (s.organization) setOrg((p) => ({ ...p, ...s.organization }));
    if (s.invoiceDefaults) setInv((p) => ({ ...p, ...s.invoiceDefaults }));
    if (s.security) setSec((p) => ({ ...p, ...s.security }));
  }, [data]);

  const saveGroup = async (group, values) => {
    try {
      await updateSettings({ [group]: values }).unwrap();
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save settings');
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!msg.title.trim() || !msg.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    try {
      const res = await broadcast(msg).unwrap();
      toast.success(res?.message || 'Broadcast sent');
      setMsg({ title: '', message: '', priority: 'normal' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send broadcast');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Super Admin · organization, invoicing, security policy, and broadcasts"
      />

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      ) : (
        <Tabs defaultValue="organization">
          <TabsList className="flex w-full flex-wrap">
            <TabsTrigger value="organization" className="gap-1.5">
              <Building2 className="h-4 w-4" /> Organization
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <Receipt className="h-4 w-4" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1.5">
              <Megaphone className="h-4 w-4" /> Broadcast
            </TabsTrigger>
          </TabsList>

          {/* Organization */}
          <TabsContent value="organization" className="mt-4">
            <SectionCard
              icon={Building2}
              title="Organization"
              description="Company identity used across the app and documents."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name">
                  <Input
                    value={org.companyName}
                    onChange={(e) => setOrg({ ...org, companyName: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Support email">
                  <Input
                    type="email"
                    value={org.supportEmail}
                    onChange={(e) => setOrg({ ...org, supportEmail: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Logo URL" hint="Public URL to the company logo.">
                  <Input
                    value={org.logoUrl}
                    onChange={(e) => setOrg({ ...org, logoUrl: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={org.address}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    className="h-11"
                  />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => saveGroup('organization', org)} disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="mt-4">
            <SectionCard
              icon={Receipt}
              title="Invoice defaults"
              description="Defaults applied to new invoices and the invoice PDF."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Currency">
                  <select
                    value={inv.currency}
                    onChange={(e) => setInv({ ...inv, currency: e.target.value })}
                    className={selectCls}
                  >
                    {['USD', 'EUR', 'GBP', 'PKR', 'AED', 'INR'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tax rate (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={inv.taxRate}
                    onChange={(e) => setInv({ ...inv, taxRate: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Invoice prefix" hint="e.g. INV- → INV-0001">
                  <Input
                    value={inv.invoicePrefix}
                    onChange={(e) => setInv({ ...inv, invoicePrefix: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Payment terms (days)">
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={inv.paymentTermsDays}
                    onChange={(e) => setInv({ ...inv, paymentTermsDays: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Invoice footer note">
                    <Textarea
                      value={inv.footerNote}
                      onChange={(e) => setInv({ ...inv, footerNote: e.target.value })}
                      placeholder="Shown at the bottom of every invoice"
                      className="min-h-[80px]"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => saveGroup('invoiceDefaults', inv)} disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-4">
            <SectionCard
              icon={ShieldCheck}
              title="Security policy"
              description="Login lockout and session rules applied across the platform."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Max login attempts" hint="3–20 before lockout">
                  <Input
                    type="number"
                    min="3"
                    max="20"
                    value={sec.maxLoginAttempts}
                    onChange={(e) => setSec({ ...sec, maxLoginAttempts: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Lockout duration (min)" hint="5–1440">
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={sec.lockoutMinutes}
                    onChange={(e) => setSec({ ...sec, lockoutMinutes: e.target.value })}
                    className="h-11"
                  />
                </Field>
                <Field label="Session timeout (min)" hint="5–1440">
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={sec.sessionTimeoutMinutes}
                    onChange={(e) => setSec({ ...sec, sessionTimeoutMinutes: e.target.value })}
                    className="h-11"
                  />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => saveGroup('security', sec)} disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Broadcast */}
          <TabsContent value="broadcast" className="mt-4">
            <SectionCard
              icon={Megaphone}
              title="System broadcast"
              description="Send a notification to every active staff member."
            >
              <form onSubmit={sendBroadcast} className="space-y-4">
                <Field label="Title">
                  <Input
                    value={msg.title}
                    onChange={(e) => setMsg({ ...msg, title: e.target.value })}
                    placeholder="e.g. Scheduled maintenance tonight"
                    className="h-11"
                  />
                </Field>
                <Field label="Message">
                  <Textarea
                    value={msg.message}
                    onChange={(e) => setMsg({ ...msg, message: e.target.value })}
                    placeholder="Write the announcement…"
                    className="min-h-[120px]"
                  />
                </Field>
                <Field label="Priority">
                  <select
                    value={msg.priority}
                    onChange={(e) => setMsg({ ...msg, priority: e.target.value })}
                    className={selectCls}
                  >
                    {['low', 'normal', 'high', 'urgent'].map((p) => (
                      <option key={p} value={p} className="capitalize">
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isBroadcasting} className="gap-1.5">
                    {isBroadcasting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send broadcast
                  </Button>
                </div>
              </form>
            </SectionCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
