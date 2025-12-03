import { PrismaClient, UserRole, Category, MeetingStatus, ParticipantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USERS = [
  { email: 'admin@sommoim.com', password: 'admin123!', nickname: '관리자', role: UserRole.ADMIN, bio: '소모임 관리자입니다' },
  { email: 'user1@sommoim.com', password: 'user123!', nickname: '축구좋아', role: UserRole.USER, bio: '축구와 풋살을 좋아합니다' },
  { email: 'user2@sommoim.com', password: 'user123!', nickname: '맛집탐방러', role: UserRole.USER, bio: '맛있는 음식 찾아다니는 중' },
  { email: 'user3@sommoim.com', password: 'user123!', nickname: '독서광', role: UserRole.USER, bio: '매달 10권 이상 읽어요' },
  { email: 'user4@sommoim.com', password: 'user123!', nickname: '게이머킴', role: UserRole.USER, bio: '롤/발로 마스터' },
  { email: 'user5@sommoim.com', password: 'user123!', nickname: '등산러버', role: UserRole.USER, bio: '주말마다 산타는 직장인' },
];

const MEETINGS = [
  { title: '주말 풋살 모임', description: '매주 토요일 오전 풋살합니다', category: Category.SPORTS, location: '서울 마포구', max: 12 },
  { title: '강남 맛집 탐방', description: '매주 금요일 저녁 강남 맛집 탐방', category: Category.FOOD, location: '서울 강남구', max: 8 },
  { title: '월간 독서 모임', description: '매월 한 권의 책을 정해 토론합니다', category: Category.STUDY, location: '서울 종로구', max: 10 },
  { title: 'LOL 클랜 모집', description: '실버~골드 티어 분들 함께 해요', category: Category.GAMES, location: '온라인', max: 20 },
  { title: '북한산 등산 동호회', description: '매주 일요일 북한산 등산', category: Category.SPORTS, location: '서울 은평구', max: 15 },
  { title: '전시회 함께 가실 분', description: '미술관, 박물관 같이 다녀요', category: Category.CULTURE, location: '서울 용산구', max: 6 },
  { title: '제주도 여행 동행', description: '다음 달 제주도 3박4일 여행', category: Category.TRAVEL, location: '제주도', max: 4 },
  { title: '코딩 스터디', description: 'JavaScript/TypeScript 스터디', category: Category.STUDY, location: '서울 강남구', max: 8 },
];

async function seedUsers() {
  console.log('Seeding users...');
  const users: any[] = [];
  for (const u of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { profile: { update: { bio: u.bio } } },
      create: { email: u.email, password: hashedPassword, nickname: u.nickname, role: u.role, profile: { create: { bio: u.bio } } },
    });
    users.push(created);
    console.log(`  - ${u.nickname}`);
  }
  return users;
}

async function seedMeetings(users: any[]) {
  console.log('Seeding meetings...');
  const meetings: any[] = [];
  for (let i = 0; i < MEETINGS.length; i++) {
    const m = MEETINGS[i];
    const host = users[(i % (users.length - 1)) + 1];
    const created = await prisma.meeting.create({
      data: {
        title: m.title, description: m.description, category: m.category, location: m.location,
        maxParticipants: m.max, status: MeetingStatus.RECRUITING, hostId: host.id, viewCount: Math.floor(Math.random() * 100),
        schedules: { create: generateSchedules() },
      },
    });
    meetings.push(created);
    console.log(`  - ${m.title}`);
  }
  return meetings;
}

function generateSchedules() {
  const schedules = [];
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const start = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    schedules.push({ startTime: start, endTime: end, note: `${i}주차 일정` });
  }
  return schedules;
}

async function seedParticipants(users: any[], meetings: any[]) {
  console.log('Seeding participants...');
  for (const meeting of meetings) {
    const otherUsers = users.filter((u) => u.id !== meeting.hostId);
    const participantCount = Math.min(Math.floor(Math.random() * 4) + 1, otherUsers.length);
    for (let i = 0; i < participantCount; i++) {
      await prisma.participant.create({
        data: { meetingId: meeting.id, userId: otherUsers[i].id, status: ParticipantStatus.APPROVED },
      });
    }
  }
  console.log('  - Participants added');
}

async function seedReviews(users: any[], meetings: any[]) {
  console.log('Seeding reviews...');
  const reviews = [
    '정말 재미있었어요! 다음에도 참여하고 싶습니다.',
    '좋은 분들과 즐거운 시간 보냈습니다.',
    '운영이 체계적이고 좋았어요.',
    '다음에도 꼭 참석할게요!',
    '기대 이상으로 좋았습니다.',
  ];
  for (const meeting of meetings.slice(0, 4)) {
    const otherUsers = users.filter((u) => u.id !== meeting.hostId);
    for (let i = 0; i < Math.min(2, otherUsers.length); i++) {
      await prisma.review.create({
        data: { meetingId: meeting.id, userId: otherUsers[i].id, rating: 4 + Math.floor(Math.random() * 2), content: reviews[Math.floor(Math.random() * reviews.length)] },
      });
    }
  }
  console.log('  - Reviews added');
}

async function seedCategories() {
  console.log('Seeding categories...');
  const cats = [
    { name: 'SPORTS', icon: '⚽', color: '#22c55e', order: 1 },
    { name: 'GAMES', icon: '🎮', color: '#8b5cf6', order: 2 },
    { name: 'FOOD', icon: '🍔', color: '#f97316', order: 3 },
    { name: 'CULTURE', icon: '🎨', color: '#ec4899', order: 4 },
    { name: 'TRAVEL', icon: '✈️', color: '#3b82f6', order: 5 },
    { name: 'STUDY', icon: '📚', color: '#eab308', order: 6 },
  ];
  for (const c of cats) {
    await prisma.categoryEntity.upsert({ where: { name: c.name }, update: c, create: c });
  }
  console.log('  - Categories added');
}

async function seedSections() {
  console.log('Seeding sections...');
  const sections = [
    { type: 'banner', title: '배너', order: 1, isActive: true, layoutJson: {} },
    { type: 'hero', title: '관심사가 같은 사람들과 함께해요', order: 2, isActive: true, layoutJson: {} },
    { type: 'categories', title: '카테고리', order: 3, isActive: true, layoutJson: {} },
    { type: 'meetings', title: '인기 모임', order: 4, isActive: true, layoutJson: { sort: 'popular', limit: 4 } },
    { type: 'meetings', title: '최신 모임', order: 5, isActive: true, layoutJson: { sort: 'latest', limit: 4 } },
    { type: 'featured', title: '나만의 모임을 시작해보세요', order: 6, isActive: true, layoutJson: {} },
  ];
  for (const s of sections) {
    const existing = await prisma.pageSection.findFirst({ where: { type: s.type, title: s.title } });
    if (!existing) {
      await prisma.pageSection.create({ data: s });
    }
  }
  console.log('  - Sections added');
}

async function seedBanners() {
  console.log('Seeding banners...');
  const banners = [
    { imageUrl: 'https://picsum.photos/seed/banner1/800/450', linkUrl: '/meetings', order: 1, isActive: true },
    { imageUrl: 'https://picsum.photos/seed/banner2/800/450', linkUrl: '/meetings?sort=popular', order: 2, isActive: true },
    { imageUrl: 'https://picsum.photos/seed/banner3/800/450', linkUrl: '/meetings/create', order: 3, isActive: true },
  ];
  const existingCount = await prisma.banner.count();
  if (existingCount === 0) {
    for (const b of banners) {
      await prisma.banner.create({ data: b });
    }
  }
  console.log('  - Banners added');
}

async function main() {
  console.log('Starting seed...\n');
  const users = await seedUsers();
  const meetings = await seedMeetings(users);
  await seedParticipants(users, meetings);
  await seedReviews(users, meetings);
  await seedCategories();
  await seedSections();
  await seedBanners();
  console.log('\nSeed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
