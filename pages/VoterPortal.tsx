import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../backend/services/api';
import { Position, Candidate, Voter } from '../types';
import { Card, Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Lock, Send, Vote, X, Copy, AlertCircle } from 'lucide-react';


export const VoterPortal: React.FC = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  // Verification State
  const [step, setStep] = useState<'ID' | 'OTP' | 'BALLOT' | 'DONE'>('ID');
  const [regNo, setRegNo] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  // OTP Popup State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Ballot State
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({}); // positionId -> candidateId


  
  // --- Step 1: Request OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.requestOtp(regNo);
      if (res.success && res.otp) {
        setGeneratedOtp(res.otp);
        setShowOtpModal(true);
        setStep('OTP');
      } else {
        setError(res.message);
      }
    } catch (e) {
      setError('System error. Please try again.');
    } finally {
      setLoading(false);
    }
  };