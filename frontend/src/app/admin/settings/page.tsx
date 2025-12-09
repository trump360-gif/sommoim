'use client';

// ================================
// Imports
// ================================
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api/admin';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';

// ================================
// Types
// ================================
interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  settings: SettingItem[];
}

interface SettingItem {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
}

// ================================
// Constants
// ================================
const settingSections: SettingSection[] = [
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
      },
      {
        key: 'siteDescription',
        label: '사이트 설명',
        description: 'SEO에 사용되는 사이트 설명입니다',
        type: 'text',
      },
      {
        key: 'maxMeetingMembers',
        label: '최대 모임 인원',
        description: '한 모임에 참가할 수 있는 최대 인원',
        type: 'number',
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
      },
      {
        key: 'pushNotification',
        label: '푸시 알림',
        description: '브라우저 푸시 알림 활성화',
        type: 'toggle',
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
      },
      {
        key: 'maxLoginAttempts',
        label: '최대 로그인 시도',
        description: '계정 잠금까지의 최대 시도 횟수',
        type: 'number',
      },
      {
        key: 'sessionTimeout',
        label: '세션 타임아웃 (분)',
        description: '비활성 상태 세션 만료 시간',
        type: 'number',
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
      },
      {
        key: 'smtpPort',
        label: 'SMTP 포트',
        description: '이메일 발송 서버 포트',
        type: 'number',
      },
      {
        key: 'senderEmail',
        label: '발신자 이메일',
        description: '시스템 이메일 발신 주소',
        type: 'text',
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
      },
      {
        key: 'backupInterval',
        label: '백업 주기',
        description: '자동 백업 실행 주기',
        type: 'select',
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
// Default Values
// ================================
const defaultValues: Record<string, string> = {
  siteName: '소모임',
  siteDescription: '소모임 - 함께하는 즐거움',
  maxMeetingMembers: '100',
  emailNotification: 'true',
  pushNotification: 'false',
  requireEmailVerification: 'true',
  maxLoginAttempts: '5',
  sessionTimeout: '60',
  smtpHost: 'smtp.example.com',
  smtpPort: '587',
  senderEmail: 'noreply@sommoim.com',
  backupEnabled: 'true',
  backupInterval: 'daily',
};

// ================================
// Component
// ================================
export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('general');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(defaultValues);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Update local settings when data is fetched
  useEffect(() => {
    if (settingsData) {
      setLocalSettings({ ...defaultValues, ...settingsData });
      setHasChanges(false);
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('설정이 저장되었습니다');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('설정 저장에 실패했습니다');
    },
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        권한이 없습니다
      </div>
    );
  }

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    const stringValue = typeof value === 'boolean' ? value.toString() : String(value);
    setLocalSettings((prev) => ({ ...prev, [key]: stringValue }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localSettings);
  };

  const getValue = (key: string): string => {
    return localSettings[key] ?? defaultValues[key] ?? '';
  };

  const getBooleanValue = (key: string): boolean => {
    return getValue(key) === 'true';
  };

  const getNumberValue = (key: string): number => {
    return parseInt(getValue(key)) || 0;
  };

  const currentSection = settingSections.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold">시스템 설정</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !hasChanges}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveMutation.isPending ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {settingSections.map((section) => (
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
                    <label className="font-medium text-gray-900">{setting.label}</label>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className="shrink-0">
                    {setting.type === 'toggle' && (
                      <button
                        onClick={() => handleSettingChange(setting.key, !getBooleanValue(setting.key))}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          getBooleanValue(setting.key) ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            getBooleanValue(setting.key) ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    )}
                    {setting.type === 'text' && (
                      <input
                        type="text"
                        value={getValue(setting.key)}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    )}
                    {setting.type === 'number' && (
                      <input
                        type="number"
                        value={getNumberValue(setting.key)}
                        onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
                        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    )}
                    {setting.type === 'select' && (
                      <select
                        value={getValue(setting.key)}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
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
      )}

      {/* Unsaved Changes Indicator */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-800 shadow-lg">
          저장되지 않은 변경사항이 있습니다
        </div>
      )}
    </div>
  );
}
