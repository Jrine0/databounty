
export type BountyStatus = 'active' | 'completed' | 'cancelled';
export type SubmissionStatus = 'pending' | 'accepted' | 'partial' | 'rejected';

export interface SubmissionFile {
  name: string;
  size: number;
  type: string;
}

export interface Submission {
  id: string;
  bountyId: string;
  hunterId: string;
  hunterName: string;
  fileName: string; // Primary file or archive name
  fileSize: number;
  fileType: string;
  timestamp: string;
  status: SubmissionStatus;
  payoutAmount?: number;
  comment?: string;
  additionalFiles?: SubmissionFile[]; // For multi-file uploads
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: string;
  reward: number;
  requesterId: string;
  createdAt: string;
  status: BountyStatus;
  submissionsCount: number;
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  role: 'requester' | 'hunter';
  balance: number;
}
