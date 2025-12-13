
export const SAMPLE_IMAGES = {
    MEETING: {
        SPORTS: '/images/sample/meeting-sports.jpg',
        GAMES: '/images/sample/meeting-games.jpg',
        FOOD: '/images/sample/meeting-food.jpg',
        CULTURE: '/images/sample/meeting-culture.jpg',
        TRAVEL: '/images/sample/meeting-travel.jpg',
        STUDY: '/images/sample/meeting-study.jpg',
    },
    AVATAR: {
        DEFAULT: '/images/sample/default-avatar.svg',
    },
} as const;

export function getSampleMeetingImage(category?: string): string {
    if (!category) return SAMPLE_IMAGES.MEETING.CULTURE;
    const normalizedCategory = category.toUpperCase();
    switch (normalizedCategory) {
        case 'SPORTS':
            return SAMPLE_IMAGES.MEETING.SPORTS;
        case 'GAMES':
            return SAMPLE_IMAGES.MEETING.GAMES;
        case 'FOOD':
            return SAMPLE_IMAGES.MEETING.FOOD;
        case 'CULTURE':
            return SAMPLE_IMAGES.MEETING.CULTURE;
        case 'TRAVEL':
            return SAMPLE_IMAGES.MEETING.TRAVEL;
        case 'STUDY':
            return SAMPLE_IMAGES.MEETING.STUDY;
        default:
            return SAMPLE_IMAGES.MEETING.CULTURE; // Default fallback
    }
}

export function getSampleAvatar(): string {
    return SAMPLE_IMAGES.AVATAR.DEFAULT;
}
