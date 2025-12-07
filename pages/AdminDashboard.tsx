import React, { useEffect, useState } from 'react';
import { api } from '../../backend/services/api';
import { Position, AuditLogEntry, Semester, Voter, VoterStatus } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Plus, Activity, RefreshCw, Power, PowerOff, Edit2, Save, X, Upload, UserPlus, Search, Ban, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);

  // Form State - Position
  const [newPosition, setNewPosition] = useState<{
    name: string;
    seats: number;
    semester: Semester;
    eligibilityRules: string;
  }>({
    name: '',
    seats: 1,
    semester: 'Trinity',
    eligibilityRules: ''
  });

  // Form State - Voter
  const [newVoter, setNewVoter] = useState({
    regNo: '',
    name: '',
    email: '',
    program: ''
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Search & Edit Voter State
  const [voterSearchQuery, setVoterSearchQuery] = useState('');
  const [searchedVoters, setSearchedVoters] = useState<Voter[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadTestResult, setLoadTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Position>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a, p, v] = await Promise.all([
        api.getStats(),
        api.getAuditLogs(),
        api.getPositions(),
        api.getVoters()
      ]);
      setStats(s);
      setAuditLogs(a);
      setPositions(p);
      setVoters(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
