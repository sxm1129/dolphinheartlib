export interface Project {
  id: string;
  title: string;
  genre: string;
  tags: string[];
  duration: string;
  createdAt?: string;  // Frontend display format
  created_at?: string; // Backend format
  updated_at?: string;
  color: string;
  status: 'Draft' | 'Generated' | 'Mastered';
  waveform?: number[]; // Mock data for visualization
}

export interface Track {
  id: string;
  name: string;
  type: 'Vocals' | 'Instrumental' | 'Drums' | 'Bass';
  muted: boolean;
  solo: boolean;
  volume: number;
  color: string;
}

export interface GenConfig {
  model: string;
  checkpoint: string;
  samplingMethod: string;
  temperature: number;
  topK: number;
  topP: number;
  duration: number; // in seconds
  cfgScale: number;
  seed: number;
}

export enum ViewMode {
  LIBRARY = 'LIBRARY',
  STUDIO = 'STUDIO',
  TRANSCRIBE = 'TRANSCRIBE',
  AUDIO_LAB = 'AUDIO_LAB'
}

// Task types from backend
export interface Task {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  params: Record<string, unknown>;
  output_audio_path: string | null;
  result: unknown;
  error_message: string | null;
}