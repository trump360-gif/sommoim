// ================================
// Types & Interfaces
// ================================

'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScheduleManager } from './schedule-manager';
import { EventList } from '@/components/meeting/event-list';
import type { Meeting } from '@/types';

interface MeetingInfoTabProps {
  meeting: Meeting;
  meetingId: string;
  isHost: boolean;
  isMember: boolean;
}

// ================================
// Component
// ================================

export function MeetingInfoTab({ meeting, meetingId, isHost, isMember }: MeetingInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <p className="whitespace-pre-wrap text-gray-700">{meeting.description}</p>
      </div>

      {/* Events - 정모/번개 */}
      <EventList meetingId={meetingId} isHost={isHost} isParticipant={isMember} />

      {/* Schedules - 기존 일정 관리 */}
      <ScheduleManager
        meetingId={meetingId}
        schedules={meeting.schedules || []}
        isHost={isHost}
      />

      {/* Participants */}
      {meeting.participants && meeting.participants.length > 0 && (
        <ParticipantsCard meeting={meeting} />
      )}
    </div>
  );
}

// ================================
// Participants Card
// ================================

function ParticipantsCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          참가자 ({meeting._count?.participants || 0}/{meeting.maxParticipants})
        </h2>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {meeting.participants?.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
            >
              <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-300">
                {p.user.profile?.avatarUrl && (
                  <Image
                    src={p.user.profile.avatarUrl}
                    alt={p.user.nickname}
                    width={24}
                    height={24}
                  />
                )}
              </div>
              <span className="text-sm">{p.user.nickname}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
