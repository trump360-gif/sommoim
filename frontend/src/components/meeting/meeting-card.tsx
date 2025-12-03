import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Meeting } from '@/types/meeting';

interface MeetingCardProps {
  meeting: Meeting;
}

const categoryLabels: Record<string, string> = {
  SPORTS: '스포츠',
  GAMES: '게임',
  FOOD: '음식',
  CULTURE: '문화',
  TRAVEL: '여행',
  STUDY: '스터디',
};

const statusLabels: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

export function MeetingCard({ meeting }: MeetingCardProps) {
  const participantCount = meeting._count?.participants ?? 0;

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-gray-100">
          {meeting.imageUrl ? (
            <Image
              src={meeting.imageUrl}
              alt={meeting.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-primary-600 px-2 py-1 text-xs text-white">
              {categoryLabels[meeting.category] || meeting.category}
            </span>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {statusLabels[meeting.status] || meeting.status}
            </span>
            <span className="text-xs text-gray-500">
              {participantCount}/{meeting.maxParticipants}명
            </span>
          </div>
          <h3 className="mb-1 line-clamp-1 font-semibold text-gray-900">
            {meeting.title}
          </h3>
          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
            {meeting.description}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-200">
              {meeting.host.profile?.avatarUrl && (
                <Image
                  src={meeting.host.profile.avatarUrl}
                  alt={meeting.host.nickname}
                  width={24}
                  height={24}
                />
              )}
            </div>
            <span className="text-xs text-gray-500">{meeting.host.nickname}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
