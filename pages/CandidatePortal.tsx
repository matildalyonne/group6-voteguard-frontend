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
