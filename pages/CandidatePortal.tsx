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
