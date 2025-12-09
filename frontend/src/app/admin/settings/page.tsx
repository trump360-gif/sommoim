'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Mail,
  Database,
  Save,
} from 'lucide-react';

// ================================
// Types
// ================================
interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  settings: Setting[];
}

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  value: string | boolean | number;
  options?: { value: string; label: string }[];
}

// ================================
// Constants
// ================================
const initialSettings: SettingSection[] = [
  {
    id: 'general',
    title: '일반 설정',
    icon: <Globe className="h-5 w-5" />,
    settings: [
      {
        key: 'siteName',
        label: '사이트 이름',
        description: '사이트의 표시 이름입니다',
        type: 'text',
        value: '소모임',
      },
      {
        key: 'siteDescription',
        label: '사이트 설명',
        description: 'SEO에 사용되는 사이트 설명입니다',
        type: 'text',
        value: '소모임 - 함께하는 즐거움',
      },
      {
        key: 'maxMeetingMembers',
        label: '최대 모임 인원',
        description: '한 모임에 참가할 수 있는 최대 인원',
        type: 'number',
        value: 100,
      },
    ],
  },
  {
    id: 'notification',
    title: '알림 설정',
    icon: <Bell className="h-5 w-5" />,
    settings: [
      {
        key: 'emailNotification',
        label: '이메일 알림',
        description: '시스템 이메일 알림 활성화',
        type: 'toggle',
        value: true,
      },
      {
        key: 'pushNotification',
        label: '푸시 알림',
        description: '브라우저 푸시 알림 활성화',
        type: 'toggle',
        value: false,
      },
    ],
  },
  {
    id: 'security',
    title: '보안 설정',
    icon: <Shield className="h-5 w-5" />,
    settings: [
      {
        key: 'requireEmailVerification',
        label: '이메일 인증 필수',
        description: '회원가입 시 이메일 인증 요구',
        type: 'toggle',
        value: true,
      },
      {
        key: 'maxLoginAttempts',
        label: '최대 로그인 시도',
        description: '계정 잠금까지의 최대 시도 횟수',
        type: 'number',
        value: 5,
      },
      {
        key: 'sessionTimeout',
        label: '세션 타임아웃 (분)',
        description: '비활성 상태 세션 만료 시간',
        type: 'number',
        value: 60,
      },
    ],
  },
  {
    id: 'email',
    title: '이메일 설정',
    icon: <Mail className="h-5 w-5" />,
    settings: [
      {
        key: 'smtpHost',
        label: 'SMTP 호스트',
        description: '이메일 발송 서버 주소',
        type: 'text',
        value: 'smtp.example.com',
      },
      {
        key: 'smtpPort',
        label: 'SMTP 포트',
        description: '이메일 발송 서버 포트',
        type: 'number',
        value: 587,
      },
      {
        key: 'senderEmail',
        label: '발신자 이메일',
        description: '시스템 이메일 발신 주소',
        type: 'text',
        value: 'noreply@sommoim.com',
      },
    ],
  },
  {
    id: 'database',
    title: '데이터베이스',
    icon: <Database className="h-5 w-5" />,
    settings: [
      {
        key: 'backupEnabled',
        label: '자동 백업',
        description: '데이터베이스 자동 백업 활성화',
        type: 'toggle',
        value: true,
      },
      {
        key: 'backupInterval',
        label: '백업 주기',
        description: '자동 백업 실행 주기',
        type: 'select',
        value: 'daily',
        options: [
          { value: 'hourly', label: '매시간' },
          { value: 'daily', label: '매일' },
          { value: 'weekly', label: '매주' },
        ],
      },
    ],
  },
];

// ================================
// Component
// ================================
export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(initialSettings);
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        권한이 없습니다
      </div>
    );
  }

  const handleSettingChange = (
    sectionId: string,
    key: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              settings: section.settings.map((setting) =>
                setting.key === key ? { ...setting, value } : setting
              ),
            }
          : section
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: API 연동
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('설정이 저장되었습니다');
    setIsSaving(false);
  };

  const currentSection = settings.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold">시스템 설정</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {settings.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-3">
              {currentSection?.icon}
              <h2 className="text-lg font-semibold">{currentSection?.title}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection?.settings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 last:border-0"
              >
                <div>
                  <label className="font-medium text-gray-900">
                    {setting.label}
                  </label>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
                <div className="shrink-0">
                  {setting.type === 'toggle' && (
                    <button
                      onClick={() =>
                        handleSettingChange(
                          activeSection,
                          setting.key,
                          !setting.value
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        setting.value ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          setting.value ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  )}
                  {setting.type === 'text' && (
                    <input
                      type="text"
                      value={setting.value as string}
                      onChange={(e) =>
                        handleSettingChange(
                          activeSection,
                          setting.key,
                          e.target.value
                        )
                      }
                      className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  )}
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={setting.value as number}
                      onChange={(e) =>
                        handleSettingChange(
                          activeSection,
                          setting.key,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  )}
                  {setting.type === 'select' && (
                    <select
                      value={setting.value as string}
                      onChange={(e) =>
                        handleSettingChange(
                          activeSection,
                          setting.key,
                          e.target.value
                        )
                      }
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {setting.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
