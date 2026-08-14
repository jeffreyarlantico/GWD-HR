import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HRISProvider } from './context/HRISContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeListView } from './components/employees/EmployeeListView';
import { EmployeeProfileView } from './components/employees/EmployeeProfileView';
import { AddEmployeeView } from './components/employees/AddEmployeeView';
import { EditEmployeeView } from './components/employees/EditEmployeeView';
import { SchoolsView } from './components/schools/SchoolsView';
import { ServiceCreditsView } from './components/serviceCredits/ServiceCreditsView';
import { LeaveHistoryView } from './components/leave/LeaveHistoryView';
import { ImportDataView } from './components/import/ImportDataView';
import { SystemInfoView } from './components/system/SystemInfoView';
import { LoginPage } from './components/auth/LoginPage';

type TabType = 
  | 'dashboard'
  | 'employees'
  | 'view-employee'
  | 'add-employee'
  | 'edit-employee'
  | 'schools'
  | 'service-credits'
  | 'leave-history'
  | 'import'
  | 'system-info';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeListSearchQuery, setEmployeeListSearchQuery] = useState('');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Navigate to Employee Profile
  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setActiveTab('view-employee');
  };

  // Navigate to Edit Employee
  const handleEditEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setActiveTab('edit-employee');
  };

  // Navigate from Search bar
  const handleHeaderSearch = (query: string) => {
    setEmployeeListSearchQuery(query);
    setActiveTab('employees');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-200 selection:text-amber-950">
      
      {/* Fixed Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as TabType)}
        onSearch={handleHeaderSearch}
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 gap-4 sm:gap-6">
        
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab === 'view-employee' || activeTab === 'edit-employee' ? 'employees' : activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'employees') {
              setEmployeeListSearchQuery('');
            }
            setActiveTab(tab as TabType);
          }}
          onTabChange={(tab) => {
            if (tab !== 'employees') {
              setEmployeeListSearchQuery('');
            }
            setActiveTab(tab as TabType);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={(tab) => setActiveTab(tab as TabType)}
              onSelectEmployee={handleSelectEmployee}
              onNavigateToAddEmployee={() => setActiveTab('add-employee')}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeListView
              onSelectEmployee={handleSelectEmployee}
              onNavigateAddEmployee={() => setActiveTab('add-employee')}
              onNavigateToAddEmployee={() => setActiveTab('add-employee')}
              initialSearchQuery={employeeListSearchQuery}
            />
          )}

          {activeTab === 'view-employee' && selectedEmployeeId && (
            <EmployeeProfileView
              employeeId={selectedEmployeeId}
              onBack={() => setActiveTab('employees')}
              onNavigateEdit={handleEditEmployee}
              onEditEmployee={handleEditEmployee}
            />
          )}

          {activeTab === 'add-employee' && (
            <AddEmployeeView
              onBack={() => setActiveTab('employees')}
              onSuccess={(newId) => {
                setSelectedEmployeeId(newId);
                setActiveTab('view-employee');
              }}
            />
          )}

          {activeTab === 'edit-employee' && selectedEmployeeId && (
            <EditEmployeeView
              employeeId={selectedEmployeeId}
              onBack={() => setActiveTab('view-employee')}
              onSuccess={() => setActiveTab('view-employee')}
            />
          )}

          {activeTab === 'schools' && <SchoolsView />}

          {activeTab === 'service-credits' && <ServiceCreditsView />}

          {activeTab === 'leave-history' && <LeaveHistoryView />}

          {activeTab === 'import' && <ImportDataView />}

          {activeTab === 'system-info' && <SystemInfoView />}
        </main>

      </div>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-3 text-center px-4">
        <p>
          Guimba West District HR Information System (HRIS) • Department of Education, Division of Nueva Ecija
        </p>
        <p className="text-slate-500 mt-0.5">
          Authorized HR Personnel System • Restricted to Guimba West District Schools and Personnel
        </p>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HRISProvider>
        <MainLayout />
      </HRISProvider>
    </AuthProvider>
  );
}
