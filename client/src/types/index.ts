export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "individual" | "manager" | "admin";
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MoodEntry {
  id: string;
  moodScore: number;
  notes?: string;
  createdAt: Date;
}

export interface Journal {
  id: string;
  moodScore?: number;
  content: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
}

export interface AnonymousRant {
  id: string;
  content: string;
  sentimentScore: number;
  supportCount: number;
  createdAt: Date;
}

export interface Therapist {
  id: string;
  name: string;
  specialization: string;
  licenseNumber?: string;
  profileUrl?: string;
  rating: number;
  availability: Record<string, any>;
}

export interface Appointment {
  id: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: string;
  thumbnailUrl?: string;
  modules: Record<string, any>;
}

export interface WellnessMetrics {
  teamWellness: number;
  engagement: number;
  sessionsThisWeek: number;
  atRiskCount: number;
  departments: Array<{
    name: string;
    average: number;
    status: string;
  }>;
}
