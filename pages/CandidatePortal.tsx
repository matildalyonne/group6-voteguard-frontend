import React, { useState, useEffect } from 'react';
import { api } from '../../backend/services/api';
import { Position, Candidate } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Upload, Info, CheckCircle, Trash2 } from 'lucide-react';


export const CandidatePortal: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState({
    name: '',
    regNo: '',
    positionId: '',
    manifesto: '',
  });
  const [fileName, setFileName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getPositions().then(setPositions);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let photoUrl = `https://picsum.photos/seed/${form.name.replace(/\s/g, '')}/200`; // Fallback placeholder

      if (file) {
        // Create a safe unique filename: regNo_timestamp
        const safeReg = form.regNo.replace(/[^a-zA-Z0-9]/g, '_');
        const path = `candidates/${safeReg}_${Date.now()}`;
        photoUrl = await api.uploadPhoto(file, path);
      }

      await api.submitNomination({
        ...form,
        photoUrl: photoUrl
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit nomination. Please try again.");
    } finally {
      setUploading(false);
    }
  };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setFile(e.target.files[0]);
    }
  };

  const selectedPosition = positions.find(p => p.id === form.positionId);

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Card>
          <div className="text-green-500 mb-4 flex justify-center">
            <Upload className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nomination Submitted!</h2>
          <p className="text-gray-600">Your application is now pending approval by the Returning Officer. Check back later for your status.</p>
          <Button className="mt-6" variant="outline" onClick={() => { setSubmitted(false); setForm({ ...form, name: '', regNo: '', manifesto: '' }); setFileName(''); setFile(null); }}>Submit Another</Button>
        </Card>
      </div>
    );
  }

  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Candidate Registration</h1>
      <Card title="Submit Nomination">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            placeholder="Ampaire Colleen"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="Registration Number"
            placeholder="e.g. M24B13/026"
            value={form.regNo}
            onChange={e => setForm({ ...form, regNo: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Position</label>
            <select
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 bg-white text-slate-900"
              value={form.positionId}
              onChange={e => setForm({ ...form, positionId: e.target.value })}
              required
            >
              <option value="">Select a position...</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.semester})</option>
              ))}
            </select>
          </div>

          {selectedPosition && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Eligibility Criteria</h4>
                <p className="text-sm text-blue-800 mt-1">{selectedPosition.eligibilityRules}</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Manifesto / Platform</label>
            <textarea
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2 h-32 bg-white text-slate-900"
              placeholder="What do you plan to achieve?"
              value={form.manifesto}
              onChange={e => setForm({ ...form, manifesto: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Photo Upload</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white hover:bg-gray-50 transition-colors">
              <label htmlFor="file-upload" className="space-y-1 text-center w-full cursor-pointer">
                {fileName ? (
                  <div className="flex flex-col items-center animate-in fade-in duration-300">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <p className="text-sm text-gray-900 font-medium truncate max-w-xs">{fileName}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFileName(''); setFile(null); }}
                      className="mt-2 inline-flex items-center text-xs text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center flex-wrap mt-2">
                      <span className="font-medium text-primary hover:text-blue-500">Upload a file</span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={uploading}>
            {uploading ? 'Uploading & Submitting...' : 'Submit Nomination'}
          </Button>
        </form>
      </Card>
    </div>
  );
};