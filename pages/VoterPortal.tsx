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

  


  if (step === 'OTP') {
    return (
      <div className="max-w-md mx-auto py-12 relative animate-slide-in-right">
        <Card title="Enter Verification PIN">
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4 animate-fade-in border border-blue-100 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              Please enter the 6-digit PIN generated for <b>{regNo}</b>.
            </div>
            <Input
              label="OTP Code"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              error={error}
              className="text-center text-2xl tracking-widest"
            />
            <Button type="submit" className="w-full" isLoading={loading} size="lg">
              Verify Identity
            </Button>
            <div className="text-xs text-center text-gray-400 mt-4">
              If you lost the popup, re-enter your ID to generate a new PIN.
            </div>
          </form>
        </Card>

        {/* OTP POPUP MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all animate-pop">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Your Access PIN</h3>
                <button onClick={closeOtpModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="text-center space-y-6">
                <p className="text-sm text-gray-600">Use this PIN to access your ballot. It is valid for one-time use only.</p>
                <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
                  <span className="text-4xl font-mono font-bold tracking-widest text-secondary">{generatedOtp}</span>
                </div>
                <Button onClick={closeOtpModal} className="w-full" variant="secondary">
                  I have copied it
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }