import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { api } from '../../services/api';
import { useSaaS } from '../../context/SaaSContext';
import { RoleBadge } from '../common/Badge';
import { 
  Shield, 
  Plus, 
  Mail, 
  UserCheck, 
  Trash2, 
  X, 
  Check, 
  Edit2, 
  Save, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Key
} from 'lucide-react';

export const UserManager: React.FC = () => {
  const { getField } = useSaaS();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');

  // Combined Driver Registration State
  const [createAsDriver, setCreateAsDriver] = useState(false);
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cnh, setCnh] = useState('');
  const [cnhCategory, setCnhCategory] = useState<'B' | 'C' | 'D' | 'E'>('C');
  const [cnhExpiresAt, setCnhExpiresAt] = useState('2028-12-31');
  const [rntrc, setRntrc] = useState('');
  const [notes, setNotes] = useState('');

  // Driver Banking Details State
  const [bankName, setBankName] = useState('');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [pixKey, setPixKey] = useState('');

  // Driver Vehicle Details State
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [vehicleBrand, setVehicleBrand] = useState('Mercedes-Benz');
  const [vehicleModel, setVehicleModel] = useState('Atego');
  const [vehicleYear, setVehicleYear] = useState('2022');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleRenavam, setVehicleRenavam] = useState('');
  const [capacityKg, setCapacityKg] = useState('12000');
  const [bodyType, setBodyType] = useState('BAU');

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USUARIO');
  const [editStatus, setEditStatus] = useState<UserStatus>('ATIVO');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fName = getField('userForm', 'name') || { label: 'Nome Completo', placeholder: 'Ex: Carlos Oliveira', enabled: true, required: true };
  const fEmail = getField('userForm', 'email') || { label: 'E-mail Corporativo', placeholder: 'carlos@translog.com.br', enabled: true, required: true };
  const fPhone = getField('userForm', 'phone') || { label: 'Telefone / WhatsApp', placeholder: '(11) 98765-4321', enabled: true, required: true };
  const fRole = getField('userForm', 'role') || { label: 'Nível de Permissão (Role)', placeholder: '', enabled: true, required: true };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createUser({
        name,
        email,
        phone: phone || '(11) 98765-4321',
        role,
        status: 'ATIVO'
      });
      setUsers([...users, created]);
      setIsInviteOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setFeedbackMessage({ type: 'success', text: `Usuário ${created.name} convidado com sucesso!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar usuário');
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditStatus(user.status || 'ATIVO');
    setEditPassword('');
    setIsEditOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSaving(true);
      const updated = await api.updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        status: editStatus,
        password: editPassword || undefined
      });

      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setIsEditOpen(false);
      setEditingUser(null);
      setFeedbackMessage({ type: 'success', text: `Perfil de ${updated.name} editado e salvo com sucesso!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações no usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName}? Esta ação é irreversível.`)) return;
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setFeedbackMessage({ type: 'success', text: `Usuário ${userName} excluído com sucesso.` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Controle de Acesso & Gestão de Usuários (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie e edite os perfis, permissões e dados de acesso de todos os membros da equipe.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Usuário</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-in fade-in ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Usuários</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{users.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Usuários Ativos</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {users.filter(u => u.status === 'ATIVO').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Administradores</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Operadores / Supervisores</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {users.filter(u => u.role === 'USUARIO' || u.role === 'SUPERVISOR').length}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou telefone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filtrar Permissão:</label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todas as Permissões</option>
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="USUARIO">Operador</option>
            <option value="MOTORISTA">Motorista</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Nome & Contato</th>
                <th className="py-3.5 px-4">E-mail Corporativo</th>
                <th className="py-3.5 px-4">Perfil / Permissão</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Criado em</th>
                <th className="py-3.5 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span>{u.name}</span>
                        <span className="block text-[11px] font-normal text-slate-400">{u.phone || 'Sem telefone'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ATIVO' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : u.status === 'PENDENTE'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {u.status || 'ATIVO'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Editar perfil do usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg">
                  {editName.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Editar Perfil do Usuário</h2>
                  <p className="text-xs text-slate-400">Atualize dados cadastrais e permissões</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsEditOpen(false); setEditingUser(null); }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail Corporativo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nível de Permissão (Role) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ADMIN">Administrador da Transportadora</option>
                    <option value="SUPERVISOR">Supervisor Operacional</option>
                    <option value="USUARIO">Operador / Usuário Padrão</option>
                    <option value="MOTORISTA">Motorista</option>
                    <option value="SUPER_ADMIN">Super Administrador SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status da Conta <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="PENDENTE">Pendente de Aprovação</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Redefinir Senha de Acesso (Opcional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingUser(null); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Convidar Membro da Equipe</h2>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {fName.enabled && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fName.label} {fName.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={fName.required}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fName.placeholder}
                  />
                </div>
              )}

              {fEmail.enabled && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fEmail.label} {fEmail.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    required={fEmail.required}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fEmail.placeholder}
                  />
                </div>
              )}

              {fPhone.enabled && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fPhone.label} {fPhone.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={fPhone.required}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fPhone.placeholder}
                  />
                </div>
              )}

              {fRole.enabled && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fRole.label} {fRole.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={role}
                    required={fRole.required}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="ADMIN">Administrador da Transportadora</option>
                    <option value="SUPERVISOR">Supervisor Operacional</option>
                    <option value="USUARIO">Operador / Usuário Padrão</option>
                    <option value="SUPER_ADMIN">Super Administrador SaaS</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Acesso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
