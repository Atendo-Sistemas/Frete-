import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SaaSProvider } from './context/SaaSContext';
import { Navbar } from './components/layout/Navbar';
import { DemoSwitcher } from './components/common/DemoSwitcher';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { DriverProfileView } from './components/driver/DriverProfileView';
import { CompanyDashboard } from './components/company/CompanyDashboard';
import { DriverManager } from './components/drivers/DriverManager';
import { FormBuilder } from './components/forms/FormBuilder';
import { FormFillModal } from './components/forms/FormFillModal';
import { FreightFormModal } from './components/freight/FreightFormModal';
import { UserManager } from './components/users/UserManager';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { HelpPanel } from './components/common/HelpPanel';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { SaaSConfigPanel } from './components/superadmin/SaaSConfigPanel';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { GuestInstitutionalPage } from './components/common/GuestInstitutionalPage';
import { FormDefinition } from './types';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('freights');
  
  // State for filling form dynamically
  const [activeFormModal, setActiveFormModal] = useState<{ form: FormDefinition; freightId?: string } | null>(null);
  
  // State for creating new freight modal directly from Navbar quick-action
  const [isCreateFreightOpen, setIsCreateFreightOpen] = useState(false);

  const isDriver = user?.role === 'MOTORISTA';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Automatically adjust active tab when switching demo roles
  useEffect(() => {
    if (user?.role === 'MOTORISTA') {
      if (activeTab !== 'driver-portal' && activeTab !== 'driver-profile' && activeTab !== 'expenses') {
        setActiveTab('driver-portal');
      }
    } else if (user?.role === 'SUPER_ADMIN') {
      const validSuperAdminTabs = ['saas-tenants', 'freights', 'drivers', 'expenses', 'forms', 'users', 'audit', 'saas-config'];
      if (!validSuperAdminTabs.includes(activeTab)) {
        setActiveTab('saas-tenants');
      }
    } else {
      // Company roles (ADMIN, SUPERVISOR, USUARIO)
      if (activeTab === 'driver-portal' || activeTab === 'driver-profile' || activeTab === 'saas-tenants') {
        setActiveTab('freights');
      }
    }
  }, [user?.role, user?.id]);

  const handleOpenFormModal = async (formId: string, freightId?: string) => {
    try {
      const forms = await api.getForms();
      const target = forms.find(f => f.id === formId) || forms[0];
      if (target) {
        setActiveFormModal({ form: target, freightId });
      }
    } catch (err) {
      console.error('Erro ao abrir formulário:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
        <DemoSwitcher />
        <GuestInstitutionalPage onLoginSuccess={() => setActiveTab('freights')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Demo Account Switcher Bar */}
      <DemoSwitcher />

      {/* Universal Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenCreateFreight={() => setIsCreateFreightOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full pb-16">
        {isDriver ? (
          activeTab === 'driver-profile' ? (
            <DriverProfileView />
          ) : activeTab === 'expenses' ? (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
              <ExpenseManager currentUser={user} />
            </div>
          ) : activeTab === 'help' ? (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
              <HelpPanel role={user.role} />
            </div>
          ) : (
            <DriverDashboard onOpenFormModal={handleOpenFormModal} />
          )
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
            {activeTab === 'freights' && <CompanyDashboard />}
            {activeTab === 'drivers' && <DriverManager />}
            {activeTab === 'expenses' && <ExpenseManager currentUser={user} />}
            {activeTab === 'forms' && <FormBuilder />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'audit' && <AuditLogViewer />}
            {activeTab === 'help' && <HelpPanel role={user.role} />}
            {activeTab === 'saas-tenants' && <SuperAdminDashboard />}
            {activeTab === 'saas-config' && <SaaSConfigPanel />}
          </div>
        )}
      </main>

      {/* Global Quick Create Freight Modal */}
      <FreightFormModal
        isOpen={isCreateFreightOpen}
        onClose={() => setIsCreateFreightOpen(false)}
        onSuccess={() => {
          setIsCreateFreightOpen(false);
          // If on another tab, go to freights
          setActiveTab('freights');
        }}
      />

      {/* Dynamic Form Fill Modal */}
      {activeFormModal && (
        <FormFillModal
          form={activeFormModal.form}
          freightId={activeFormModal.freightId}
          onClose={() => setActiveFormModal(null)}
          onSuccess={() => {
            alert('Formulário enviado com sucesso!');
            setActiveFormModal(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Portal de Fretes & Motoristas SaaS MVP • Todo o Brasil 🇧🇷</span>
          <span className="font-mono text-[11px] text-slate-400">Arquitetura Multi-tenant • Controle de Concorrência Atômico</span>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <SaaSProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SaaSProvider>
  );
}
