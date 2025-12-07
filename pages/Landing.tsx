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