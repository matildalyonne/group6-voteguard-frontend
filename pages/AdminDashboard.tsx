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

  
  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosition.name) return;
    await api.createPosition({
      name: newPosition.name,
      seats: newPosition.seats,
      semester: newPosition.semester,
      eligibilityRules: newPosition.eligibilityRules || 'Open to all eligible voters.',
      opensAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 86400000 * 7).toISOString()
    });
    setNewPosition({ name: '', seats: 1, semester: 'Trinity', eligibilityRules: '' });
    loadData();
  };

  const handleToggleStatus = async (id: string, action: 'OPEN' | 'CLOSE') => {
    await api.updatePositionStatus(id, action);
    loadData();
  };

  const handleEditClick = (position: Position) => {
    setEditingId(position.id);
    setEditForm({
      ...position,
      semester: position.semester || 'Trinity',
      eligibilityRules: position.eligibilityRules || ''
    });
  };

  const handleSaveEdit = async () => {
    if (editingId && editForm.name) {
      await api.updatePositionDetails(editingId, {
        name: editForm.name,
        seats: editForm.seats,
        semester: editForm.semester || 'Trinity',
        eligibilityRules: editForm.eligibilityRules || ''
      });
      setEditingId(null);
      loadData();
    }
  };

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addVoter(newVoter);
      setNewVoter({ regNo: '', name: '', email: '', program: '' });
      alert('Voter added successfully');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const parsedVoters = lines
          .map(line => {
            const [regNo, name, email, program] = line.split(',').map(s => s.trim());
            return { regNo, name, email, program };
          })
          .filter(v => v.regNo && v.name && v.regNo !== 'regNo' && v.regNo !== 'reg_no');

        const result = await api.bulkAddVoters(parsedVoters);
        alert(`Import complete: ${result.added} added, ${result.skipped} skipped (duplicates).`);
        setCsvFile(null);
        loadData();
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV. Ensure format: regNo,name,email,program');
      }
    };
    reader.readAsText(csvFile);
  };