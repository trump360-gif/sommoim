export type Category =
  | 'SPORTS'
  | 'GAMES'
  | 'FOOD'
  | 'CULTURE'
  | 'TRAVEL'
  | 'STUDY';

export type MeetingStatus =
  | 'DRAFT'
  | 'RECRUITING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParticipantStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'KICKED'
  | 'ATTENDED';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  maxParticipants: number;
  imageUrl?: string;
  status: MeetingStatus;
  autoApprove: boolean;
  hostId: string;
  host: {
    id: string;
    nickname: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participants: number;
    bookmarks: number;
  };
}

export interface MeetingSchedule {
  id: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
}

export interface Participant {
  id: string;
  userId: string;
  status: ParticipantStatus;
  user: {
    id: string;
    nickname: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  createdAt: string;
}
