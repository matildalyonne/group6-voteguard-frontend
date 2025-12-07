import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../backend/services/api';
import { Position, Candidate, Voter } from '../types';
import { Card, Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Lock, Send, Vote, X, Copy, AlertCircle } from 'lucide-react';
