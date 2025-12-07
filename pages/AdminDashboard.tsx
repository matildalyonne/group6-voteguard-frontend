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



  const handleSearchVoters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterSearchQuery) return;
    setIsSearching(true);
    const results = await api.searchVoters(voterSearchQuery);
    setSearchedVoters(results);
    setIsSearching(false);
  };

  const handleToggleBlockVoter = async (voter: Voter) => {
    const newStatus = voter.status === VoterStatus.BLOCKED ? VoterStatus.ELIGIBLE : VoterStatus.BLOCKED;
    if (voter.status === VoterStatus.VOTED && newStatus === VoterStatus.ELIGIBLE) {
      if (!window.confirm("This voter has already voted. Resetting to ELIGIBLE will allow them to vote again. Continue?")) return;
    }

    await api.updateVoterStatus(voter.id, newStatus);

    if (voterSearchQuery) {
      const results = await api.searchVoters(voterSearchQuery);
      setSearchedVoters(results);
    }
    loadData();
  };

  const handleLoadTest = async () => {
    if (!window.confirm("This will simulate 500 votes being cast simultaneously. Continue?")) return;
    setTesting(true);
    setLoadTestResult(null);
    try {
      const result = await api.runLoadTest(500);
      setLoadTestResult(result);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure? This deletes ALL votes, candidates, and positions, then resets to the default state.")) {
      setResetting(true);
      try {
        await api.resetSystem();
        alert("System has been reset to default state.");
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert("Failed to reset system. Check permissions.");
        setResetting(false);
      }
    }
  };

  // --- Export Functions ---

  const downloadCSV = (type: 'audit' | 'results') => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (type === 'results' && stats?.results) {
      const headers = ["Candidate Name", "Position ID", "Votes"];
      csvContent += headers.join(",") + "\n";
      stats.results.forEach((row: any) => {
        const line = [
          `"${row.candidateName}"`,
          `"${row.positionId}"`,
          row.votes
        ].join(",");
        csvContent += line + "\n";
      });
    } else if (type === 'audit' && auditLogs.length > 0) {
      const headers = ["Timestamp", "Actor Type", "Actor ID", "Action", "Details"];
      csvContent += headers.join(",") + "\n";
      auditLogs.forEach(log => {
        const line = [
          `"${new Date(log.timestamp).toLocaleString()}"`,
          log.actorType,
          `"${log.actorId}"`,
          `"${log.action}"`,
          `"${log.details.replace(/"/g, '""')}"` // Escape quotes
        ].join(",");
        csvContent += line + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `voteguard-${type}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = (type: 'audit' | 'results') => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Primary Blue
    doc.text(`VoteGuard Election ${type === 'results' ? 'Results' : 'Audit Log'}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    if (type === 'results' && stats?.results) {
      const tableData = stats.results.map((r: any) => [
        r.candidateName,
        r.positionId, // You might want to map this to Position Name if available efficiently
        r.votes
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Candidate Name', 'Position ID', 'Votes Cast']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 183, 194], textColor: 255 }, // Teal header
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Add Summary stats
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total Voters: ${stats.totalVoters}`, 14, finalY);
      doc.text(`Total Votes Cast: ${stats.voted}`, 14, finalY + 5);
      doc.text(`Turnout: ${Math.round((stats.voted / stats.totalVoters) * 100) || 0}%`, 14, finalY + 10);

    } else if (type === 'audit') {
      const tableData = auditLogs.map(l => [
        new Date(l.timestamp).toLocaleString(),
        l.actorType,
        l.actorId,
        l.action,
        l.details
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Time', 'Role', 'User', 'Action', 'Details']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue Header
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 35 }, // Time
          1: { cellWidth: 20 }, // Role
          2: { cellWidth: 30 }, // User
          3: { cellWidth: 35 }, // Action
          // Details takes remaining space
        }
      });
    }

    doc.save(`voteguard-${type}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading && !stats) return <div className="p-8 text-center animate-pulse text-gray-500">Loading Admin Dashboard...</div>;

  const turnoutData = stats ? [
    { name: 'Voted', value: stats.voted },
    { name: 'Did Not Vote', value: stats.totalVoters - stats.voted }
  ] : [];
  const COLORS = ['#00B7C2', '#e2e8f0'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Election Administration</h1>
          <p className="text-gray-500 text-sm">Monitor results, manage system and audit logs.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Export Controls */}
          <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-bold px-2 text-gray-500 uppercase tracking-wide">Results</span>
            <Button size="sm" variant="outline" onClick={() => downloadCSV('results')} className="h-8 px-2 border-gray-200 hover:border-secondary hover:text-secondary hover:bg-cyan-50" title="Download CSV">
              <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadPDF('results')} className="h-8 px-2 border-gray-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50" title="Download PDF">
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>

          <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-bold px-2 text-gray-500 uppercase tracking-wide">Audit</span>
            <Button size="sm" variant="outline" onClick={() => downloadCSV('audit')} className="h-8 px-2 border-gray-200 hover:border-secondary hover:text-secondary hover:bg-cyan-50" title="Download CSV">
              <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadPDF('audit')} className="h-8 px-2 border-gray-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50" title="Download PDF">
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>

          <div className="border-l border-gray-300 h-8 mx-1 hidden md:block"></div>

          <Button variant="danger" onClick={handleReset} isLoading={resetting} size="sm" className="h-9">
            <RefreshCw className="h-4 w-4 mr-2" /> Reset System
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200 animate-slide-up">
          <div className="text-blue-900 text-sm font-medium">Total Voters</div>
          <div className="text-4xl font-bold text-blue-700 mt-1">{stats?.totalVoters}</div>
        </Card>
        <Card className="bg-green-50 border-green-200 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="text-green-900 text-sm font-medium">Votes Cast</div>
          <div className="text-4xl font-bold text-green-700 mt-1">{stats?.voted}</div>
        </Card>
        <Card className="bg-teal-50 border-teal-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="text-teal-900 text-sm font-medium">Verified (Active)</div>
          <div className="text-4xl font-bold text-teal-700 mt-1">{stats?.verified}</div>
        </Card>
        <Card className="bg-orange-50 border-orange-200 flex flex-col justify-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Button variant="outline" size="sm" onClick={handleLoadTest} isLoading={testing} className="w-full hover:bg-orange-100 hover:text-orange-900 border-orange-300">
            <Activity className="h-4 w-4 mr-2" /> Run Load Test (500)
          </Button>
          {loadTestResult && (
            <div className="text-xs text-center mt-1 text-orange-800 animate-fade-in">
              {loadTestResult.successful} votes in {loadTestResult.durationSeconds}s
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Live Turnout" className="h-80 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-center h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={turnoutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {turnoutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Results by Position" className="h-80 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="candidateName" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="votes" fill="#F5C542" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manage Positions */}
        <Card title="Manage Positions" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="space-y-4">
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {positions.map(p => {
                const isClosed = new Date() > new Date(p.closesAt) || new Date() < new Date(p.opensAt);
                const isEditing = editingId === p.id;

                if (isEditing) {
                  return (
                    <li key={p.id} className="py-4 space-y-3 bg-gray-50 p-2 rounded animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Name"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-slate-700">Semester</label>
                          <select
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 bg-white text-slate-900"
                            value={editForm.semester || 'Trinity'}
                            onChange={e => setEditForm({ ...editForm, semester: e.target.value as Semester })}
                          >
                            <option value="Advent">Advent</option>
                            <option value="Easter">Easter</option>
                            <option value="Trinity">Trinity</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1">
                          <Input
                            label="Seats"
                            type="number"
                            value={editForm.seats}
                            onChange={e => setEditForm({ ...editForm, seats: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            label="Rules"
                            value={editForm.eligibilityRules || ''}
                            onChange={e => setEditForm({ ...editForm, eligibilityRules: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /> Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit}><Save className="h-4 w-4" /> Save</Button>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={p.id} className="py-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({p.semester}, {p.seats} seat)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge status={isClosed ? 'CLOSED' : 'OPEN'} className={isClosed ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'} />
                        <button
                          onClick={() => handleEditClick(p)}
                          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1 flex items-center transition-colors hover:bg-blue-50"
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </button>
                        {isClosed ? (
                          <button
                            onClick={() => handleToggleStatus(p.id, 'OPEN')}
                            className="text-xs text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1 flex items-center transition-colors hover:bg-green-50"
                          >
                            <Power className="h-3 w-3 mr-1" /> Re-open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(p.id, 'CLOSE')}
                            className="text-xs text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-1 flex items-center transition-colors hover:bg-red-50"
                          >
                            <PowerOff className="h-3 w-3 mr-1" /> Close
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate" title={p.eligibilityRules}>
                      Rules: {p.eligibilityRules}
                    </p>
                  </li>
                );
              })}
            </ul>

            <form onSubmit={handleCreatePosition} className="pt-4 border-t border-gray-100 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Add New Position</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Position Name (e.g. Treasurer)"
                  value={newPosition.name}
                  onChange={e => setNewPosition({ ...newPosition, name: e.target.value })}
                  required
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Semester</label>
                  <select
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2 bg-white text-slate-900"
                    value={newPosition.semester}
                    onChange={e => setNewPosition({ ...newPosition, semester: e.target.value as Semester })}
                  >
                    <option value="Advent">Advent</option>
                    <option value="Easter">Easter</option>
                    <option value="Trinity">Trinity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Input
                    type="number"
                    min="1"
                    label="Seats"
                    value={newPosition.seats}
                    onChange={e => setNewPosition({ ...newPosition, seats: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label="Eligibility Rules"
                    placeholder="e.g. Must be 3rd Year Student"
                    value={newPosition.eligibilityRules}
                    onChange={e => setNewPosition({ ...newPosition, eligibilityRules: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" disabled={!newPosition.name} className="w-full" variant="secondary">
                <Plus className="h-4 w-4 mr-2" /> Create Position
              </Button>
            </form>
          </div>
        </Card>

        {/* Manage Voters */}
        <Card title="Manage Voters" className="animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="space-y-6">

            {/* Search Section */}
            <div className="border-b border-gray-100 pb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Search className="h-4 w-4 mr-2" /> Find & Edit Voter
              </h4>
              <form onSubmit={handleSearchVoters} className="flex gap-2">
                <Input
                  placeholder="Search by RegNo or Name..."
                  value={voterSearchQuery}
                  onChange={e => setVoterSearchQuery(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit" variant="secondary" disabled={isSearching}>Search</Button>
              </form>

              {searchedVoters.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden animate-slide-up">
                  {searchedVoters.map(v => (
                    <li key={v.id} className="p-3 bg-white flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{v.name}</div>
                        <div className="text-xs text-gray-500">{v.regNo} • <Badge status={v.status} /></div>
                      </div>
                      <div>
                        {v.status === VoterStatus.BLOCKED ? (
                          <Button size="sm" variant="outline" onClick={() => handleToggleBlockVoter(v)} className="text-green-600 border-green-200 hover:bg-green-50">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Unblock
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleToggleBlockVoter(v)} className="text-red-600 border-red-200 hover:bg-red-50">
                            <Ban className="h-4 w-4 mr-1" /> Block
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Manual Add */}
            <form onSubmit={handleAddVoter} className="space-y-4 border-b border-gray-100 pb-6">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" /> Manual Add
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Reg No (e.g. M24B13/026)"
                  value={newVoter.regNo}
                  onChange={e => setNewVoter({ ...newVoter, regNo: e.target.value })}
                  required
                />
                <Input
                  placeholder="Full Name"
                  value={newVoter.name}
                  onChange={e => setNewVoter({ ...newVoter, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newVoter.email}
                  onChange={e => setNewVoter({ ...newVoter, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Program (e.g. BSc CS)"
                  value={newVoter.program}
                  onChange={e => setNewVoter({ ...newVoter, program: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="w-full">Add Single Voter</Button>
            </form>

            {/* CSV Import */}
            <form onSubmit={handleCsvUpload} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Upload className="h-4 w-4 mr-2" /> Import CSV
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-teal-50 file:text-teal-700
                    hover:file:bg-teal-100"
                />
                <Button type="submit" size="sm" disabled={!csvFile} variant="primary">Import</Button>
              </div>
            </form>

            {/* Recent Voters List */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Recently Added</h4>
              <ul className="text-sm divide-y divide-gray-100 max-h-40 overflow-y-auto bg-gray-50 rounded border border-gray-100">
                {voters.map(v => (
                  <li key={v.id} className="px-3 py-2 flex justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{v.regNo}</span>
                      <span className="text-gray-500 ml-2">- {v.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{v.program}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Card>
      </div>

      {/* Full Width Audit Log */}
      <Card title="System Audit Log" className="max-h-[30rem] overflow-y-auto animate-slide-up" style={{ animationDelay: '800ms' }}>
        <div className="flow-root">
          <ul className="-mb-8">
            {auditLogs.map((log, logIdx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== auditLogs.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${log.actorType === 'ADMIN' ? 'bg-gray-800' : 'bg-secondary'}`}>
                      <span className="text-white text-xs font-bold">{log.actorType[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{log.action}</span> by {log.actorId}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{log.details}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};