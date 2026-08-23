import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
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
      if (activeTab !== 'driver-portal' && activeTab !== 'driver-profile') {
        setActiveTab('driver-portal');
      }
    } else if (user?.role === 'SUPER_ADMIN') {
      if (activeTab === 'driver-portal' || activeTab === 'driver-profile') {
        setActiveTab('saas-tenants');
      }
    } else {
      // Company roles (ADMIN, SUPERVISOR, USUARIO)
      if (activeTab === 'driver-portal' || activeTab === 'driver-profile') {
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Demo Account Switcher Bar */}
      <DemoSwitcher />

      {/* Universal Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenCreateFreight={() => setIsCreateFreightOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isDriver ? (
          activeTab === 'driver-profile' ? (
            <DriverProfileView />
          ) : (
            <DriverDashboard onOpenFormModal={handleOpenFormModal} />
          )
        ) : (
          <>
            {activeTab === 'freights' && <CompanyDashboard />}
            {activeTab === 'drivers' && <DriverManager />}
            {activeTab === 'forms' && <FormBuilder />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'audit' && <AuditLogViewer />}
            {activeTab === 'saas-tenants' && <SuperAdminDashboard />}
          </>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
