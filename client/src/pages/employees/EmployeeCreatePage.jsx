import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Loader2, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';
import {
  useCreateEmployeeMutation,
  useGetEmployeesQuery,
} from '../../services/employeesApi.js';
import useAuth from '../../hooks/useAuth.js';
import { toast } from 'sonner';

// Roles that may act as a reporting manager.
const MANAGER_ROLES = ['manager', 'admin', 'super_admin'];

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const { role: myRole } = useAuth();
  // Only the super admin can mint managers.
  const canMakeManager = myRole === 'super_admin';
  const [step, setStep] = useState(1);

  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [roleField, setRoleField] = useState('developer');
  const [managerType, setManagerType] = useState('');
  const [department, setDepartment] = useState('engineering');
  const [designation, setDesignation] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [joinDate, setJoinDate] = useState('');

  const [salary, setSalary] = useState(3000);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const [createEmployeeApi, { isLoading }] = useCreateEmployeeMutation();

  // Reporting-manager options: existing staff with a manager/admin role.
  const { data: employeesData } = useGetEmployeesQuery({ status: 'active' });
  const managerOptions = (employeesData?.data || [])
    .filter((emp) => MANAGER_ROLES.includes(emp.user?.role))
    .map((emp) => ({
      id: emp.user?._id || emp.user?.id,
      name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || emp.user?.email,
      role: emp.user?.role,
    }))
    .filter((m) => m.id);
  const selectedManager = managerOptions.find((m) => m.id === reportsTo);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email) {
        toast.error('First name, last name, and email are required');
        return;
      }
      if (!password || password.length < 8) {
        toast.error('A temporary password of at least 8 characters is required');
        return;
      }
    }
    if (step === 2) {
      if (!designation || !joinDate) {
        toast.error('Designation and join date are required');
        return;
      }
      if (roleField === 'manager' && !managerType) {
        toast.error('Please select a manager type (Lead or Project Manager)');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmployeeApi({
        firstName,
        lastName,
        email,
        phone,
        password,
        role: roleField,
        managerType: roleField === 'manager' ? managerType : null,
        department,
        designation,
        reportsTo: reportsTo || null,
        joinDate,
        salary: Number(salary),
        bankDetails: {
          bankName,
          accountNumber: bankAccount
        }
      }).unwrap();

      toast.success('Employee registered successfully!');
      navigate('/employees');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to register employee');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Employee"
        subtitle="Complete the 4-step wizard to create staff profiles and permissions credentials"
      />

      <div className="max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 text-xs font-bold text-slate-400 select-none">
          {['Personal Info', 'Job Details', 'Compensation', 'Review'].map((label, idx) => {
            const active = step === idx + 1;
            const completed = step > idx + 1;
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center border font-semibold ${
                  active 
                    ? 'bg-blue-600 border-blue-600 text-white shadow'
                    : completed
                    ? 'bg-emerald-50 border-emerald-50 text-emerald-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200'
                }`}>
                  {idx + 1}
                </span>
                <span className={active ? 'text-slate-800 dark:text-slate-200' : ''}>{label}</span>
              </div>
            );
          })}
        </div>

        <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
              {step === 1 && 'Step 1: Contact Details'}
              {step === 2 && 'Step 2: Company Structure'}
              {step === 3 && 'Step 3: Compensation Terms'}
              {step === 4 && 'Step 4: Review Staff Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="emp-fn" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                    <Input id="emp-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="h-10.5" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="emp-ln" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                    <Input id="emp-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="h-10.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="emp-email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@company.com" className="h-10.5" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="emp-phone" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone number</label>
                  <Input id="emp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" className="h-10.5" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="emp-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Temporary Password</label>
                  <Input id="emp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="h-10.5" autoComplete="new-password" />
                  <p className="text-[11px] text-slate-500">The staff member uses this to log in first, then can reset it.</p>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="emp-role" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Role</label>
                    <select
                      id="emp-role"
                      value={roleField}
                      onChange={(e) => setRoleField(e.target.value)}
                      className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="qa_engineer">QA Engineer</option>
                      {canMakeManager && <option value="manager">Manager</option>}
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="emp-dept" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                    <select
                      id="emp-dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="engineering">Engineering</option>
                      <option value="design">Creative Design</option>
                      <option value="qa">Quality Assurance</option>
                      <option value="management">Management</option>
                      <option value="sales">Sales & Leads</option>
                    </select>
                  </div>
                </div>
                {roleField === 'manager' && (
                  <div className="space-y-1.5">
                    <label htmlFor="emp-mgrtype" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manager Type</label>
                    <select
                      id="emp-mgrtype"
                      value={managerType}
                      onChange={(e) => setManagerType(e.target.value)}
                      className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">— Select manager type —</option>
                      <option value="lead_manager">Lead Manager (handles leads pipeline)</option>
                      <option value="project_manager">Project Manager (runs projects & tasks)</option>
                      <option value="hiring_manager">Hiring Manager (registers employees)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Lead Managers access Leads; Hiring Managers can add employees.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="emp-desig" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designation / Job Title</label>
                  <Input id="emp-desig" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="h-10.5" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="emp-join" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Joining Date</label>
                  <Input id="emp-join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="h-10.5" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="emp-mgr" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reporting Manager</label>
                  <select
                    id="emp-mgr"
                    value={reportsTo}
                    onChange={(e) => setReportsTo(e.target.value)}
                    className="flex h-10.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">— No manager (top level) —</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Who this employee reports to. Their manager sees them in attendance, tasks, and exports.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="emp-salary" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Base Salary (PKR)</label>
                  <Input id="emp-salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="h-10.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="emp-bank" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bank Name</label>
                    <Input id="emp-bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Standard Chartered" className="h-10.5" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="emp-acct" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bank Account Number</label>
                    <Input id="emp-acct" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="e.g. 0123456789" className="h-10.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border rounded-xl divide-y space-y-3">
                  <div className="flex justify-between items-center pb-2">
                    <span>Full Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{firstName} {lastName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Email Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Role & Scope</span>
                    <span className="font-bold text-blue-500 capitalize">{roleField}</span>
                  </div>
                  {roleField === 'manager' && (
                    <div className="flex justify-between items-center py-2">
                      <span>Manager Type</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {managerType === 'lead_manager'
                          ? 'Lead Manager'
                          : managerType === 'project_manager'
                          ? 'Project Manager'
                          : managerType === 'hiring_manager'
                          ? 'Hiring Manager'
                          : '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span>Department</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{department}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Reporting Manager</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedManager?.name || 'None (top level)'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Base Salary</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">PKR {salary}/mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard actions */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => navigate('/employees')} disabled={isLoading}>
                  Cancel
                </Button>
              )}

              {step < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Register Staff
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
