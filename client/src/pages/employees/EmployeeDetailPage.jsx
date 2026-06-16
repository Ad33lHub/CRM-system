import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { 
  useGetEmployeeByIdQuery, 
  useUpdateEmployeeMutation, 
  useGetAttendanceQuery 
} from '../../services/employeesApi.js';
import { useGetEmployeesQuery } from '../../services/employeesApi.js';
import useAuth from '../../hooks/useAuth.js';
import AttachmentPreviewModal from '../../components/common/AttachmentPreviewModal.jsx';

// Roles that may act as a reporting manager, and roles allowed to reassign one.
const MANAGER_ROLES = ['manager', 'admin', 'super_admin'];
const CAN_ASSIGN_ROLES = ['admin', 'super_admin'];
import { 
  ArrowLeft, User, CreditCard, 
  Calendar, FileCheck, Upload, Loader2, Download 
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, role } = useAuth();
  const canAssignManager = CAN_ASSIGN_ROLES.includes(role);
  
  // States
  const [activeTab, setActiveTab] = useState('profile'); // profile, salary, attendance, documents
  const [isUploading, setIsUploading] = useState(false);
  const [docType, setDocType] = useState('NDA');

  // Preview modal states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries & Mutations
  const { data: employeeData, isLoading, refetch } = useGetEmployeeByIdQuery(id);
  const { data: attendanceData, isLoading: isAttendanceLoading } = useGetAttendanceQuery(id, {
    skip: activeTab !== 'attendance'
  });
  const [updateEmployeeApi] = useUpdateEmployeeMutation();
  // Manager options are only needed when the viewer can reassign.
  const { data: employeesData } = useGetEmployeesQuery(
    { status: 'active' },
    { skip: !canAssignManager }
  );

  const employee = employeeData?.data || employeeData;
  const attendanceLogs = attendanceData?.data || [];

  const employeeUserId = employee?.user?._id || employee?.user?.id;
  const currentManagerId =
    employee?.reportsTo?._id || employee?.reportsTo?.id || employee?.reportsTo || '';
  const managerName = employee?.reportsTo
    ? `${employee.reportsTo.firstName || ''} ${employee.reportsTo.lastName || ''}`.trim() ||
      employee.reportsTo.email
    : null;
  const managerOptions = (employeesData?.data || [])
    .filter(
      (emp) =>
        MANAGER_ROLES.includes(emp.user?.role) &&
        (emp.user?._id || emp.user?.id) !== employeeUserId
    )
    .map((emp) => ({
      id: emp.user?._id || emp.user?.id,
      name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || emp.user?.email,
      role: emp.user?.role,
    }))
    .filter((m) => m.id);

  const handleManagerChange = async (value) => {
    try {
      await updateEmployeeApi({ id, data: { reportsTo: value || null } }).unwrap();
      toast.success('Reporting manager updated');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update manager');
    }
  };

  const isManagerRole = employee?.user?.role === 'manager';
  const currentManagerType = employee?.user?.managerType || '';

  const handleManagerTypeChange = async (value) => {
    try {
      await updateEmployeeApi({ id, data: { managerType: value || null } }).unwrap();
      toast.success('Manager type updated');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update manager type');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'employee');
    formData.append('entityId', id);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        // Update employee document list
        const updatedDocs = [...(employee.documents || []), {
          type: docType,
          url: data.url,
          publicId: data.publicId
        }];

        await updateEmployeeApi({
          id,
          data: { documents: updatedDocs }
        }).unwrap();

        toast.success('Document uploaded and attached successfully!');
        refetch();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  const openPreview = (doc) => {
    setPreviewFile({
      name: `${doc.type || 'Document'}.${doc.url?.split('.').pop() || 'pdf'}`,
      url: doc.url,
      mimeType: doc.url?.endsWith('.pdf') ? 'application/pdf' : 'image/png' // estimate
    });
    setPreviewOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading employee details...</div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-rose-500">Employee Profile Not Found</h3>
        <Button onClick={() => navigate('/employees')} className="mt-4">Back to Registry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`}
        subtitle={`Employee ID: ${employee.employeeId || 'EMP-XXXX'} · ${employee.designation || 'Specialist'}`}
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Profile Details' }
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/employees')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Button>
        }
      />

      {/* Tabs list */}
      <div className="flex gap-2 border-b pb-4 overflow-x-auto select-none">
        {[
          { id: 'profile', name: 'Profile Details', icon: User },
          { id: 'salary', name: 'Compensation & Bank', icon: CreditCard },
          { id: 'attendance', name: 'Attendance Register', icon: Calendar },
          { id: 'documents', name: 'Identity & Contracts', icon: FileCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Profile Details Tab */}
        {activeTab === 'profile' && (
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Designation</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{employee.designation}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Department</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{employee.department?.replace('_', ' ')}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Email address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{employee.user?.email}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Joining Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '--'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Reporting Manager</span>
                  {canAssignManager ? (
                    <select
                      value={currentManagerId}
                      onChange={(e) => handleManagerChange(e.target.value)}
                      className="mt-0.5 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="">— No manager (top level) —</option>
                      {managerOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {managerName || 'None (top level)'}
                    </span>
                  )}
                </div>
                {isManagerRole && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Manager Type</span>
                    {canAssignManager ? (
                      <select
                        value={currentManagerType}
                        onChange={(e) => handleManagerTypeChange(e.target.value)}
                        className="mt-0.5 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">— Select manager type —</option>
                        <option value="lead_manager">Lead Manager (handles leads pipeline)</option>
                        <option value="project_manager">Project Manager (runs projects &amp; tasks)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {currentManagerType === 'lead_manager'
                          ? 'Lead Manager'
                          : currentManagerType === 'project_manager'
                            ? 'Project Manager'
                            : '—'}
                      </span>
                    )}
                    {canAssignManager && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Only Lead Managers can access the Leads module.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Salary & Bank Tab */}
        {activeTab === 'salary' && (
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Compensation Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Monthly Salary (Base)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {employee.salary?.amount ? `$${employee.salary.amount}` : 'Not Authorized / Masked'}
                  </span>
                </div>
                {employee.bankDetails && (
                  <>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">Bank Name</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.bankDetails.bankName || '--'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg col-span-1 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase block mb-1">Account Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.bankDetails.accountNumber || '--'}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Register Tab */}
        {activeTab === 'attendance' && (
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Check-in Logs Registry</CardTitle>
            </CardHeader>
            <CardContent>
              {isAttendanceLoading ? (
                <div className="text-center py-6 text-slate-400 text-xs">Loading logs...</div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No check-in logs recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Check In</th>
                        <th className="py-2.5 px-3">Check Out</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLogs.map((log) => (
                        <tr key={log.id || log._id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '--'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '--'}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={log.status === 'late' ? 'warning' : 'success'} className="text-[9px] uppercase tracking-wide">
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{log.ipAddress || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Identity & Contracts (Documents) Tab */}
        {activeTab === 'documents' && (
          <Card className="border bg-white dark:bg-slate-900/50 shadow-md">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-500" />
                <span>Verification & Contracts Archive</span>
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold focus:outline-none"
                >
                  <option value="NDA">NDA Agreement</option>
                  <option value="Contract">Employment Contract</option>
                  <option value="ID_Scan">National ID Scan</option>
                  <option value="Degree">Degree/Certificate</option>
                </select>
                <input
                  type="file"
                  id="emp-doc-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  disabled={isUploading}
                  onClick={() => document.getElementById('emp-doc-upload').click()}
                  className="gap-1.5"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.documents && employee.documents.length > 0 ? (
                employee.documents.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/20 border rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{doc.type || 'Staff Document'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openPreview(doc)} className="text-[10px] h-7 px-2 font-bold">
                        Preview
                      </Button>
                      <a href={doc.url} download target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 col-span-2 text-xs">No staff verification files uploaded.</div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      <AttachmentPreviewModal 
        file={previewFile}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
