export * from './meeting';

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  profile?: Profile;
  createdAt: string;
}

export interface Profile {
  id: string;
  bio?: string;
  avatarUrl?: string;
  faceImageUrl?: string;
}

export interface Review {
  id: string;
  meetingId: string;
  userId: string;
  rating: number;
  content: string;
  user: {
    id: string;
    nickname: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
