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

    return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nomination Approvals</h1>
      <p className="text-gray-500">Review and approve candidate nominations for the upcoming election.</p>

      <div className="grid gap-6">
        {candidates.map(candidate => (
          <Card key={candidate.id} className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img src={candidate.photoUrl} alt={candidate.name} className="h-32 w-32 object-cover rounded-md bg-gray-200" />
            </div>
            <div className="flex-grow space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                  <div className="text-sm text-gray-500 font-mono mb-1">{candidate.regNo}</div>
                  <p className="text-sm text-primary font-medium">{getPositionName(candidate.positionId)}</p>
                </div>
                <Badge status={candidate.status} />
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 italic">
                "{candidate.manifesto}"
              </div>

              <div className="text-xs text-gray-400">
                Submitted on {new Date(candidate.createdAt).toLocaleDateString()}
              </div>
            </div>