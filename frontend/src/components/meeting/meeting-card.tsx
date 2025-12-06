import Image from 'next/image';
import { getSampleMeetingImage } from '@/lib/sample-images';
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
      <Card className="group overflow-hidden rounded-2xl border-0 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {meeting.imageUrl ? (
            <Image
              src={meeting.imageUrl}
              alt={meeting.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Image
              src={getSampleMeetingImage(meeting.category)}
              alt={meeting.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              {categoryLabels[meeting.category] || meeting.category}
            </span>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {statusLabels[meeting.status] || meeting.status}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {participantCount}/{meeting.maxParticipants}명
            </span>
          </div>
          <h3 className="mb-2 line-clamp-1 text-lg font-bold text-gray-900">
            {meeting.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
            {meeting.description}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
              {meeting.host.profile?.avatarUrl && (
                <Image
                  src={meeting.host.profile.avatarUrl}
                  alt={meeting.host.nickname}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">{meeting.host.nickname}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
