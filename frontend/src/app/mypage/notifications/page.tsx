'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Bell,
  MessageSquare,
  Calendar,
  Users,
  Heart,
  Megaphone,
  Save,
} from 'lucide-react';

// ================================
// Types
// ================================
interface NotificationSettings {
  newMeeting: boolean;
  eventReminder: boolean;
  chatMessage: boolean;
  newFollower: boolean;
  meetingUpdate: boolean;
  announcement: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// ================================
// Constants
// ================================
const DEFAULT_SETTINGS: NotificationSettings = {
  newMeeting: true,
  eventReminder: true,
  chatMessage: true,
  newFollower: true,
  meetingUpdate: true,
  announcement: true,
  emailNotifications: false,
  pushNotifications: true,
};

// ================================
// Sub Components
// ================================
function SettingItem({ icon, title, description, checked, onChange }: SettingItemProps) {
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
export default function NotificationSettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Local state for settings (in real app, fetch from API)
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // ================================
  // Handlers
  // ================================
  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In real app, call API to save settings
    toast.success('알림 설정이 저장되었습니다');
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        {hasChanges && (
          <Button onClick={handleSave}>
            <Save className="mr-1.5 h-4 w-4" />
            저장
          </Button>
        )}
      </div>

      {/* Activity Notifications */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">활동 알림</h2>
          <p className="text-sm text-gray-500">모임 및 활동 관련 알림을 설정합니다</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <SettingItem
            icon={<Calendar className="h-5 w-5" />}
            title="일정 알림"
            description="참여한 이벤트 시작 전 알림을 받습니다"
            checked={settings.eventReminder}
            onChange={(v) => updateSetting('eventReminder', v)}
          />
          <SettingItem
            icon={<Users className="h-5 w-5" />}
            title="모임 업데이트"
            description="참여 중인 모임의 새 소식을 받습니다"
            checked={settings.meetingUpdate}
            onChange={(v) => updateSetting('meetingUpdate', v)}
          />
          <SettingItem
            icon={<MessageSquare className="h-5 w-5" />}
            title="채팅 메시지"
            description="새로운 채팅 메시지 알림을 받습니다"
            checked={settings.chatMessage}
            onChange={(v) => updateSetting('chatMessage', v)}
          />
          <SettingItem
            icon={<Bell className="h-5 w-5" />}
            title="새 모임 추천"
            description="관심사에 맞는 새 모임을 추천받습니다"
            checked={settings.newMeeting}
            onChange={(v) => updateSetting('newMeeting', v)}
          />
        </CardContent>
      </Card>

      {/* Social Notifications */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">소셜 알림</h2>
          <p className="text-sm text-gray-500">팔로우 및 소셜 활동 알림을 설정합니다</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <SettingItem
            icon={<Heart className="h-5 w-5" />}
            title="새 팔로워"
            description="누군가 나를 팔로우할 때 알림을 받습니다"
            checked={settings.newFollower}
            onChange={(v) => updateSetting('newFollower', v)}
          />
          <SettingItem
            icon={<Megaphone className="h-5 w-5" />}
            title="공지사항"
            description="서비스 공지 및 이벤트 알림을 받습니다"
            checked={settings.announcement}
            onChange={(v) => updateSetting('announcement', v)}
          />
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">알림 수단</h2>
          <p className="text-sm text-gray-500">알림을 받을 방법을 선택합니다</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <SettingItem
            icon={<Bell className="h-5 w-5" />}
            title="푸시 알림"
            description="브라우저/앱 푸시 알림을 받습니다"
            checked={settings.pushNotifications}
            onChange={(v) => updateSetting('pushNotifications', v)}
          />
          <SettingItem
            icon={<MessageSquare className="h-5 w-5" />}
            title="이메일 알림"
            description="중요한 알림을 이메일로 받습니다"
            checked={settings.emailNotifications}
            onChange={(v) => updateSetting('emailNotifications', v)}
          />
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleReset}>
          기본값으로 초기화
        </Button>
      </div>
    </div>
  );
}
