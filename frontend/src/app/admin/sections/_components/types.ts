// ================================
// Types & Interfaces
// ================================

export interface FormData {
  type: string;
  title: string;
  order: number;
  isActive: boolean;
  layoutJson: {
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    secondButtonText?: string;
    secondButtonLink?: string;
    bgColor?: string;
    bgColorEnd?: string;
    bgImage?: string;
    sort?: string;
    limit?: number;
  };
}

// ================================
// Constants
// ================================

export const SECTION_TYPES = [
  { value: 'hero', label: '히어로 배너' },
  { value: 'featured', label: '추천 모임' },
  { value: 'categories', label: '카테고리' },
  { value: 'banner', label: '배너 슬라이드' },
  { value: 'meetings', label: '모임 목록' },
];

export const initialFormData: FormData = {
  type: 'hero',
  title: '',
  order: 0,
  isActive: true,
  layoutJson: {},
};
