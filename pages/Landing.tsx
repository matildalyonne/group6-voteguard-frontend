import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Card, Button, Input } from '../components/UI';
import { ShieldCheck, UserCheck, Users, UserPlus, ArrowRight, Lock } from 'lucide-react';
import {api} from "../../backend/services/api"