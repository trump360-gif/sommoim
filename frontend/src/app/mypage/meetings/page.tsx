'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api/users';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { Users, Crown, Plus } from 'lucide-react';
import { categoryLabels, statusLabels } from '@/shared';
import { getSampleMeetingImage } from '@/lib/sample-images';

// ================================
// Constants
// ================================
const TABS = [
  { key: 'hosted', label: '만든 모임' },
  { key: 'participated', label: '참여 모임' },
];

// ================================
// Component
// ================================
export default function MyMeetingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('hosted');

  // ================================
  // Queries
  // ================================
  const { data: myMeetingsData, isLoading } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: () => usersApi.getMyMeetings(),
    enabled: isAuthenticated,
  });

  // ================================
  // Derived Data
  // ================================
  const hostedMeetings = myMeetingsData?.hosted || [];
  const participatedMeetings = myMeetingsData?.participated || [];
  const displayMeetings = activeTab === 'hosted' ? hostedMeetings : participatedMeetings;

  // ================================
  // Auth Check
  // ================================
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">로그인이 필요합니다</p>
        <Button onClick={() => router.push('/auth/login')} className="mt-4">
          로그인
        </Button>
      </div>
    );
  }

  // ================================
  // Render
  // ================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 모임</h1>
        <Link href="/meetings/create">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            새 모임 만들기
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all ${activeTab === 'hosted' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setActiveTab('hosted')}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-100 p-3">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{hostedMeetings.length}</p>
              <p className="text-sm text-gray-500">만든 모임</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${activeTab === 'participated' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setActiveTab('participated')}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{participatedMeetings.length}</p>
              <p className="text-sm text-gray-500">참여 모임</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Meeting List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">로딩 중...</div>
      ) : displayMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {activeTab === 'hosted' ? (
              <>
                <Crown className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">아직 만든 모임이 없습니다</p>
                <Link href="/meetings/create">
                  <Button>첫 모임 만들기</Button>
                </Link>
              </>
            ) : (
              <>
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">아직 참여한 모임이 없습니다</p>
                <Link href="/meetings">
                  <Button>모임 둘러보기</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayMeetings.map((meeting) => (
            <div key={meeting.id} className="relative">
              {activeTab === 'hosted' && (
                <div className="absolute -top-2 -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-lg">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              )}
              <Link href={`/meetings/${meeting.id}`}>
                <Card className="group overflow-hidden rounded-2xl border-0 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1">
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={meeting.imageUrl || getSampleMeetingImage(meeting.category)}
                      alt={meeting.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
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
                        {meeting._count?.participants ?? 0}/{meeting.maxParticipants}명
                      </span>
                    </div>
                    <h3 className="mb-2 line-clamp-1 text-lg font-bold text-gray-900">
                      {meeting.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {meeting.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
