import React, { useEffect, useState } from 'react';
import { api } from '../../backend/services/api';
import { Candidate, CandidateStatus, Position } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { Check, X } from 'lucide-react';
