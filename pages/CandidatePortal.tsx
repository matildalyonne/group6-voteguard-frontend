import React, { useState, useEffect } from 'react';
import { api } from '../../backend/services/api';
import { Position, Candidate } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Upload, Info, CheckCircle, Trash2 } from 'lucide-react';