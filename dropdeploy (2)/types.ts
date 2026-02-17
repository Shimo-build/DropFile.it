import { User } from 'firebase/auth';

export interface Site {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  url?: string;
  screenshot?: string;
  status: 'live' | 'deploying' | 'failed' | 'offline';
  deploymentCount: number;
}

export interface Deployment {
  id: string;
  siteId: string;
  status: 'queued' | 'building' | 'ready' | 'error';
  createdAt: number;
  fileCount: number;
  size: number;
  authorName: string;
  authorPhoto?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface FileNode {
  path: string;
  file: File;
}