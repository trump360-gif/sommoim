'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Bell,
  Shield,
  Lock,
  Mail,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

// ================================
// Types
// ================================
interface PrivacySettings {
  showProfile: boolean;
  showMeetings: boolean;
  showFollowers: boolean;
  allowMessages: boolean;
}

interface SettingLinkProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

interface ToggleItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// ================================
// Constants
// ================================
const DEFAULT_PRIVACY: PrivacySettings = {
  showProfile: true,
  showMeetings: true,
  showFollowers: true,
  allowMessages: true,
};

// ================================
// Sub Components
// ================================
function SettingLink({ icon, title, description, href }: SettingLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">{icon}</div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </Link>
  );
}

function ToggleItem({ icon, title, description, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">{icon}</div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300" />
      </label>
    </div>
  );
}

// ================================
// Component
// ================================
export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ================================
  // Handlers
  // ================================
  const updatePrivacy = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    toast.success('설정이 저장되었습니다');
  };

  const handlePasswordChange = () => {
    router.push('/auth/forgot-password');
  };

  const handleDeleteAccount = () => {
    // In real app, call API to delete account
    toast.error('계정 삭제 기능은 준비 중입니다');
    setShowDeleteConfirm(false);
  };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">계정 설정</h1>
        <p className="mt-1 text-gray-500">계정 및 개인정보 설정을 관리합니다</p>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">설정 바로가기</h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <SettingLink
            icon={<Bell className="h-5 w-5" />}
            title="알림 설정"
            description="알림 수신 여부 및 방법을 설정합니다"
            href="/mypage/notifications"
          />
          <SettingLink
            icon={<Shield className="h-5 w-5" />}
            title="차단 관리"
            description="차단한 사용자를 관리합니다"
            href="/mypage/blocked"
          />
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">공개 범위</h2>
          <p className="text-sm text-gray-500">다른 사용자에게 공개할 정보를 설정합니다</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <ToggleItem
            icon={<Eye className="h-5 w-5" />}
            title="프로필 공개"
            description="다른 사용자가 내 프로필을 볼 수 있습니다"
            checked={privacy.showProfile}
            onChange={(v) => updatePrivacy('showProfile', v)}
          />
          <ToggleItem
            icon={<Eye className="h-5 w-5" />}
            title="참여 모임 공개"
            description="참여 중인 모임 목록을 공개합니다"
            checked={privacy.showMeetings}
            onChange={(v) => updatePrivacy('showMeetings', v)}
          />
          <ToggleItem
            icon={<Eye className="h-5 w-5" />}
            title="팔로워/팔로잉 공개"
            description="팔로워 및 팔로잉 목록을 공개합니다"
            checked={privacy.showFollowers}
            onChange={(v) => updatePrivacy('showFollowers', v)}
          />
          <ToggleItem
            icon={<Mail className="h-5 w-5" />}
            title="메시지 수신 허용"
            description="다른 사용자가 나에게 메시지를 보낼 수 있습니다"
            checked={privacy.allowMessages}
            onChange={(v) => updatePrivacy('allowMessages', v)}
          />
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">보안</h2>
          <p className="text-sm text-gray-500">계정 보안 설정을 관리합니다</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">비밀번호 변경</p>
                <p className="text-sm text-gray-500">정기적인 비밀번호 변경을 권장합니다</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePasswordChange}>
              변경하기
            </Button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">이메일</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <h2 className="font-semibold text-red-600">위험 구역</h2>
          <p className="text-sm text-gray-500">주의가 필요한 설정입니다</p>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-2.5 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">계정 삭제</p>
                  <p className="text-sm text-gray-500">
                    모든 데이터가 영구적으로 삭제됩니다
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                삭제하기
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">정말 계정을 삭제하시겠습니까?</p>
                  <p className="mt-1 text-sm text-red-700">
                    이 작업은 되돌릴 수 없습니다. 모든 모임, 리뷰, 활동 기록이 삭제됩니다.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDeleteAccount}
                    >
                      계정 삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
