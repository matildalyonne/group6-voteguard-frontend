import React, { useEffect, useState } from 'react';
import { api } from '../../backend/services/api';
import { Candidate, CandidateStatus, Position } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { Check, X } from 'lucide-react';


export const OfficerDashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [c, p] = await Promise.all([api.getCandidates(), api.getPositions()]);
    setCandidates(c);
    setPositions(p);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, status: CandidateStatus) => {
    await api.updateCandidateStatus(id, status, status === CandidateStatus.REJECTED ? 'Did not meet criteria' : undefined);
    fetchData();
  };

  const getPositionName = (id: string) => positions.find(p => p.id === id)?.name || 'Unknown';

  if (loading) return <div>Loading...</div>;