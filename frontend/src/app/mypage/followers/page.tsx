'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api/users';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, UserPlus, UserMinus, Search } from 'lucide-react';

// ================================
// Types
// ================================
interface FollowUser {
  id: string;
  nickname: string;
  profile?: {
    avatarUrl?: string;
    bio?: string;
  };
  isFollowing?: boolean;
}

// ================================
// Constants
// ================================
const TABS = [
  { key: 'followers', label: '팔로워' },
  { key: 'following', label: '팔로잉' },
];

// ================================
// Component
// ================================
export default function FollowersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('followers');
  const [searchQuery, setSearchQuery] = useState('');

  // ================================
  // Queries
  // ================================
  const { data: followersData, isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => usersApi.getFollowers(user!.id),
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: followingData, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => usersApi.getFollowing(user!.id),
    enabled: isAuthenticated && !!user?.id,
  });

  // ================================
  // Mutations
  // ================================
  const followMutation = useMutation({
    mutationFn: (targetId: string) => usersApi.follow(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success('팔로우했습니다');
    },
    onError: () => {
      toast.error('팔로우에 실패했습니다');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (targetId: string) => usersApi.unfollow(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success('언팔로우했습니다');
    },
    onError: () => {
      toast.error('언팔로우에 실패했습니다');
    },
  });

  // ================================
  // Derived State
  // ================================
  const isLoading = activeTab === 'followers' ? loadingFollowers : loadingFollowing;
  const users: FollowUser[] = activeTab === 'followers'
    ? (followersData as any)?.data || []
    : (followingData as any)?.data || [];

  const filteredUsers = searchQuery
    ? users.filter((u) =>
        u.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeTab === 'followers' ? '팔로워' : '팔로잉'}
        </h1>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="사용자 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm"
        />
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">로딩 중...</div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchQuery
                ? '검색 결과가 없습니다'
                : activeTab === 'followers'
                ? '아직 팔로워가 없습니다'
                : '아직 팔로잉하는 사람이 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((followUser) => (
            <UserCard
              key={followUser.id}
              user={followUser}
              currentUserId={user?.id}
              activeTab={activeTab}
              onFollow={() => followMutation.mutate(followUser.id)}
              onUnfollow={() => unfollowMutation.mutate(followUser.id)}
              isFollowPending={followMutation.isPending}
              isUnfollowPending={unfollowMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ================================
// User Card Component
// ================================
interface UserCardProps {
  user: FollowUser;
  currentUserId?: string;
  activeTab: string;
  onFollow: () => void;
  onUnfollow: () => void;
  isFollowPending: boolean;
  isUnfollowPending: boolean;
}

function UserCard({
  user,
  currentUserId,
  activeTab,
  onFollow,
  onUnfollow,
  isFollowPending,
  isUnfollowPending,
}: UserCardProps) {
  const isOwnProfile = user.id === currentUserId;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.id}`}>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt={user.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-400">
                  {user.nickname.charAt(0)}
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`}>
              <p className="font-semibold text-gray-900 hover:text-primary-600">
                {user.nickname}
              </p>
            </Link>
            {user.profile?.bio && (
              <p className="text-sm text-gray-500 truncate">{user.profile.bio}</p>
            )}
          </div>

          {/* Action Button */}
          {!isOwnProfile && (
            <div>
              {activeTab === 'followers' ? (
                // 팔로워 탭: 맞팔로우 버튼
                user.isFollowing ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onUnfollow}
                    disabled={isUnfollowPending}
                    className="text-gray-600"
                  >
                    <UserMinus className="mr-1.5 h-4 w-4" />
                    팔로잉
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onFollow}
                    disabled={isFollowPending}
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    맞팔로우
                  </Button>
                )
              ) : (
                // 팔로잉 탭: 언팔로우 버튼
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUnfollow}
                  disabled={isUnfollowPending}
                  className="text-gray-600"
                >
                  <UserMinus className="mr-1.5 h-4 w-4" />
                  언팔로우
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
