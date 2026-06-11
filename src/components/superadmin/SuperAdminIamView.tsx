'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, Trash2, Shield, User, Lock, Mail, RefreshCw } from 'lucide-react';

interface IamUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'staff';
  created_at: string;
}

interface SuperAdminIamViewProps {
  currentUser: any;
}

export default function SuperAdminIamView({ currentUser }: SuperAdminIamViewProps) {
  const [users, setUsers] = useState<IamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'superadmin' | 'staff'>('staff');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('creva_token');
      const res = await fetch('/api/backend/admin/users', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error("Failed to load users:", await res.text());
      }
    } catch (e) {
      console.error("Error fetching admin users:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required.");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('creva_token');
      const res = await fetch('/api/backend/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFormSuccess(`Successfully added ${name} as a ${role}!`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('staff');
        fetchUsers();
      } else {
        setFormError(data.error || "Failed to create user.");
      }
    } catch (err: any) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetId: string, targetName: string) => {
    if (targetId === currentUser?.id) {
      alert("Error: You cannot delete your own logged-in account!");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${targetName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('creva_token');
      const res = await fetch(`/api/backend/admin/users/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert(`Successfully deleted ${targetName}.`);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete user'}`);
      }
    } catch (e) {
      alert("Failed to delete user. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            IAM & Staff Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage administrative access levels, add new staff accounts, and authorize permissions.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Sync Users
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column — Add User Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-850 pb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Add Platform Account</h2>
              <p className="text-[10px] text-gray-500">Create new staff or superadmin credentials</p>
            </div>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sanjay Kumar"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@crevawebzz.com"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Access Role */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'superadmin' | 'staff')}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="staff">Staff (Verify payments & reset passwords, no settings access)</option>
                <option value="superadmin">Superadmin (Full platform permissions)</option>
              </select>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20 text-left font-medium">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs rounded-xl border border-emerald-500/20 text-left font-medium">
                {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Add User Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column — User List Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[400px]">
          <div className="px-6 py-4 border-b border-gray-850 flex items-center gap-2">
            <Shield className="text-blue-400 w-5 h-5" />
            <span className="font-bold text-white text-sm">Authorized Administrators & Staff</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-xs">Loading user accounts...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-xs text-gray-500">
                No user profiles found.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-gray-950/60 uppercase font-bold text-[10px] text-gray-500 tracking-wider border-b border-gray-850">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-850/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.role === 'superadmin' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-amber-500'}`} />
                        {item.name}
                        {item.id === currentUser?.id && (
                          <span className="text-[8px] font-black uppercase bg-blue-500/15 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded ml-1.5">You</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">{item.email}</td>
                      <td className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full border ${
                          item.role === 'superadmin' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(item.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(item.id, item.name)}
                          disabled={item.id === currentUser?.id}
                          className={`p-1.5 rounded-lg border transition-all ${
                            item.id === currentUser?.id 
                              ? 'border-gray-800 text-gray-700 cursor-not-allowed opacity-30' 
                              : 'border-rose-950 text-rose-500 hover:text-white hover:bg-rose-650 hover:border-transparent cursor-pointer'
                          }`}
                          title={item.id === currentUser?.id ? "You cannot delete yourself" : "Delete Account"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
