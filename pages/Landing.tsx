import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, UserCheck, Users, UserPlus, ArrowRight, Lock } from 'lucide-react';
import {api} from "../../backend/services/api"



export const Landing: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VOTER);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role Configurations
  const roles = [
    { id: UserRole.VOTER, label: 'Voter', icon: UserCheck },
    { id: UserRole.CANDIDATE, label: 'Candidate', icon: UserPlus },
    { id: UserRole.OFFICER, label: 'Officer', icon: ShieldCheck },
    { id: UserRole.ADMIN, label: 'Admin', icon: Users },
  ];

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Flow for Voter
    if (selectedRole === UserRole.VOTER) {
      navigate('/voter');
      return;
    }

    // Flow for Candidate (Auto-login wrapper for registration)
    if (selectedRole === UserRole.CANDIDATE) {
      login(UserRole.CANDIDATE, 'Candidate User');
      navigate('/candidate');
      return;
    }

    // Flow for Admin/Officer (Auth Required)
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginUser(credentials.email, credentials.password);
      if (res.success && res.role === selectedRole) {
        login(res.role, res.name || 'User');
        navigate(selectedRole === UserRole.ADMIN ? '/admin' : '/officer');
      } else {
        setError(res.message || 'Authentication failed or invalid role selected.');
      }
    } catch (err) {
      setError('System error occurred.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[80vh]">
      
      {/* Header Section */}
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-6xl overflow-hidden">
          <span className="inline-block animate-text-reveal">Welcome to</span>{' '}
          <span className="text-primary relative inline-block animate-text-reveal" style={{ animationDelay: '150ms' }}>
            VoteGuard
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 animate-text-reveal" style={{ animationDelay: '300ms' }}>
          Secure, Auditable, Electronic Voting System
        </p>
      </div>

      {/* Main Unified Card */}
      <div className="w-full max-w-md animate-text-reveal" style={{ animationDelay: '450ms' }}>
        <Card className="border-t-8 border-t-primary shadow-2xl relative overflow-hidden bg-white">
            
            {/* Role Tabs */}
            <div className="grid grid-cols-4 border-b border-gray-100">
                {roles.map((r) => {
                    const Icon = r.icon;
                    const isActive = selectedRole === r.id;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => { setSelectedRole(r.id); setError(''); setCredentials({email: '', password: ''}); }}
                            className={`flex flex-col items-center justify-center py-4 px-1 transition-all duration-200 focus:outline-none
                                ${isActive ? 'bg-white border-b-2 border-primary text-primary' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}
                            `}
                        >
                            <Icon className={`h-6 w-6 mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{r.label}</span>
                        </button>
                    )
                })}
            </div>