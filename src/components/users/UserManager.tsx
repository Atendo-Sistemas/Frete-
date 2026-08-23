import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { RoleBadge } from '../common/Badge';
import { Shield, Plus, Mail, UserCheck, Trash2, X, Check } from 'lucide-react';

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');

  useEffect(() => {
    const load = async () => {
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
    load();
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
    } catch (err: any) {
      alert(err.message || 'Erro ao adicionar usuário');
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) return;
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Controle de Acesso & Equipe (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie operadores, administradores da transportadora e permissões de acesso multi-tenant.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Convidar Membro da Equipe</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Nome & Contato</th>
              <th className="py-3.5 px-4">E-mail</th>
              <th className="py-3.5 px-4">Perfil / Permissão</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Criado em</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <span>{u.name}</span>
                    <span className="block text-[11px] font-normal text-slate-400">{u.phone}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                  {u.email}
                </td>
                <td className="py-3.5 px-4">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {u.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                    title="Excluir usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Convidar Membro da Equipe</h2>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="Ex: Carlos Oliveira"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="carlos@translog.com.br"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nível de Permissão (Role)</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="ADMIN">Administrador da Transportadora</option>
                  <option value="SUPERVISOR">Supervisor Operacional</option>
                  <option value="USUARIO">Operador / Usuário Padrão</option>
                  <option value="SUPER_ADMIN">Super Administrador SaaS</option>
                </select>
              </div>

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
