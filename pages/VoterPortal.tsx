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

    // --- Step 2: Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(regNo, otp);
      if (res.success && res.token && res.voter) {
        setToken(res.token);
        // Login strictly as voter in context for header
        login(res.voter.status as any, res.voter.name, res.token);

        // Fetch Ballot Data
        const [p, c] = await Promise.all([api.getPositions(), api.getCandidates()]);
        setPositions(p);
        setCandidates(c);
        setStep('BALLOT');
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (e) {
      setError('Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  



  // --- Step 3: Vote ---
  const toggleSelection = (positionId: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const submitVote = async () => {
    setLoading(true);
    setError('');
    try {
      const votesToCast = Object.entries(selections).map(([pid, cid]) => ({
        positionId: pid,
        candidateId: cid as string
      }));
      await api.castVote(token, votesToCast);
      setStep('DONE');
    } catch (e: any) {
      setError(e.message || 'Failed to cast vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleFinish = () => {
    logout();
    navigate('/');
  };

  

  if (step === 'ID') {
    return (
      <div className="max-w-md mx-auto py-12 animate-slide-up">
        <Card title="Voter Verification">
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <p className="text-sm text-gray-500">Enter your Registration Number to check eligibility.</p>
            <Input
              label="Registration Number"
              placeholder="e.g. M24B13/026"
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full" isLoading={loading} size="lg">
              Check Eligibility
            </Button>
            <div className="text-xs text-center text-secondary mt-4 bg-cyan-50 p-2 rounded font-semibold tracking-wide border border-cyan-100">
              A Secure Ballot, A Secure Vote
            </div>
          </form>
        </Card>
      </div>
    );
  }

  
  // --- Step 3: Vote ---
  const toggleSelection = (positionId: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const submitVote = async () => {
    setLoading(true);
    setError('');
    try {
      const votesToCast = Object.entries(selections).map(([pid, cid]) => ({
        positionId: pid,
        candidateId: cid as string
      }));
      await api.castVote(token, votesToCast);
      setStep('DONE');
    } catch (e: any) {
      setError(e.message || 'Failed to cast vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleFinish = () => {
    logout();
    navigate('/');
  };

  if (step === 'ID') {
    return (
      <div className="max-w-md mx-auto py-12 animate-slide-up">
        <Card title="Voter Verification">
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <p className="text-sm text-gray-500">Enter your Registration Number to check eligibility.</p>
            <Input
              label="Registration Number"
              placeholder="e.g. M24B13/026"
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full" isLoading={loading} size="lg">
              Check Eligibility
            </Button>
            <div className="text-xs text-center text-secondary mt-4 bg-cyan-50 p-2 rounded font-semibold tracking-wide border border-cyan-100">
              A Secure Ballot, A Secure Vote
            </div>
          </form>
        </Card>
      </div>
    );
  }