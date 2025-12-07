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

    if (step === 'BALLOT') {
    const isComplete = positions.length > 0 && Object.keys(selections).length === positions.length;

    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-24">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Official Ballot</h1>
            <p className="text-gray-500">Select one candidate per position. This action is irreversible.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Session Token</span>
            <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded border border-gray-200 text-gray-600">{token.substring(0, 8)}...</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center text-red-700 animate-pulse">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {positions.map((position, idx) => {
          const positionCandidates = candidates.filter(c => c.positionId === position.id && c.status === 'APPROVED');
          return (
            <div key={position.id} className="space-y-4 animate-slide-up">
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-2">
                <div className="h-8 w-1 bg-secondary rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">{position.name}</h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{position.seats} Seat</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionCandidates.map(c => (
                  <div
                    key={c.id}
                    onClick={() => toggleSelection(position.id, c.id)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex gap-4 items-center group overflow-hidden
                      ${selections[position.id] === c.id
                        ? 'border-secondary bg-cyan-50 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 hover:border-cyan-200 bg-white hover:shadow-lg hover:scale-[1.01]'
                      }
                    `}
                  >
                    <img src={c.photoUrl} alt={c.name} className="h-16 w-16 rounded-full object-cover bg-gray-200 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{c.manifesto}</p>
                    </div>
                    {selections[position.id] === c.id && (
                      <div className="absolute right-0 top-0 bottom-0 w-12 bg-secondary flex items-center justify-center animate-slide-in-right">
                        <Vote className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="block text-xs text-gray-400 uppercase">Progress</span>
              <span className={`font-bold text-lg ${isComplete ? 'text-secondary' : 'text-gray-900'}`}>{Object.keys(selections).length}</span>
              <span className="text-gray-400"> / {positions.length} Selections</span>
            </div>
            <Button
              size="lg"
              disabled={!isComplete}
              onClick={submitVote}
              isLoading={loading}
              variant="accent"
              className={`w-64 shadow-xl transition-all ${isComplete ? 'animate-pulse' : ''}`}
            >
              <Lock className="h-5 w-5 mr-2" />
              Submit Official Ballot
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 text-center animate-pop">
      <Card className="border-t-8 border-t-green-500">
        <div className="flex justify-center mb-6 pt-4">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse-slow">
            <Send className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Vote Cast Successfully</h2>
        <p className="text-gray-500 mb-8 px-4">Your ballot has been encrypted, time-stamped, and recorded in the secure ledger. Your session token is now invalidated.</p>
        <Button onClick={handleFinish} variant="primary" size="lg" className="w-full">Return to Home</Button>
      </Card>
    </div>
  );
};