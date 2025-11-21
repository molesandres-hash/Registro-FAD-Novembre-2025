import { FullCourseDocumentGenerator } from '../services/fullCourseDocumentGenerator';
import { ParsedFullCourseData, FullCourseParticipantInfo } from '../types/course';
import { ProcessedParticipant } from '../types';
import Docxtemplater from 'docxtemplater';
import { processParticipants } from '../utils/csvParser';
import { LessonService } from '../services/lessonService';

// Mock dependencies
jest.mock('docxtemplater', () => {
    return jest.fn().mockImplementation(() => ({
        render: jest.fn(),
        getZip: jest.fn().mockReturnValue({
            generate: jest.fn().mockReturnValue(new ArrayBuffer(0))
        })
    }));
});

jest.mock('pizzip', () => {
    return jest.fn().mockImplementation(() => ({}));
});

jest.mock('../utils/csvParser');
jest.mock('../services/lessonService');

describe('FullCourseDocumentGenerator', () => {
    let generator: FullCourseDocumentGenerator;
    let mockRender: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        (Docxtemplater as unknown as jest.Mock).mockClear();
        (processParticipants as jest.Mock).mockClear();
        (LessonService.calculateDynamicLessonHours as jest.Mock).mockReturnValue([9, 10, 11, 12, 13]);

        // Setup render mock capture
        mockRender = jest.fn();
        (Docxtemplater as unknown as jest.Mock).mockImplementation(() => ({
            render: mockRender,
            getZip: jest.fn().mockReturnValue({
                generate: jest.fn().mockReturnValue(new ArrayBuffer(0))
            })
        }));

        generator = new FullCourseDocumentGenerator();
    });

    it('should format connection times with multiple intervals', async () => {
        const mockDate = new Date('2025-07-08T09:00:00');

        // Mock participant with multiple connections
        const mockParticipant: ProcessedParticipant = {
            name: 'Test User',
            email: 'test@test.com',
            totalAbsenceMinutes: 0,
            isPresent: true,
            allConnections: {
                morning: [
                    { joinTime: new Date('2025-07-08T09:00:00'), leaveTime: new Date('2025-07-08T10:00:00') },
                    { joinTime: new Date('2025-07-08T10:05:00'), leaveTime: new Date('2025-07-08T13:00:00') }
                ],
                afternoon: []
            },
            sessions: { morning: [], afternoon: [] },
            aliases: []
        };

        // Mock participant info for allParticipants
        const mockParticipantInfo: FullCourseParticipantInfo = {
            id: '1',
            primaryName: 'Test User',
            aliases: [],
            email: 'test@test.com',
            isOrganizer: false,
            masterOrder: 1,
            daysPresent: ['2025-07-08']
        };

        // Mock processParticipants to return our mock participant
        (processParticipants as jest.Mock).mockReturnValue({
            participants: [mockParticipant],
            organizer: null
        });

        // Mock parsed data
        const mockParsedData: ParsedFullCourseData = {
            courseName: 'Test Course',
            zoomMeetingId: '123',
            organizer: { name: 'Org', email: 'org@test.com' },
            dateRange: { start: '2025-07-08', end: '2025-07-08' },
            days: [{
                date: '2025-07-08',
                courseName: 'Test Course',
                zoomMeetingId: '123',
                startTime: mockDate,
                endTime: new Date('2025-07-08T13:00:00'),
                sessions: [],
                participantNames: new Set(['Test User'])
            }],
            allParticipants: [mockParticipantInfo],
            aliasSuggestions: [],
            statistics: {
                totalDays: 1,
                totalParticipants: 1,
                totalSessions: 1
            }
        };

        const mockTemplateFile = new File([''], 'template.docx');
        mockTemplateFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));

        const result = await generator.generateAllDocuments(mockParsedData, mockTemplateFile);

        // Verify render was called
        expect(mockRender).toHaveBeenCalled();

        // Get the data passed to render
        const templateData = mockRender.mock.calls[0][0];

        // Verify formatted times
        // MattOraIn should be "09:00:00 - 10:05:00"
        expect(templateData.MattOraIn1).toBe('09:00:00 - 10:05:00');

        // MattOraOut should be "10:00:00 - 13:00:00"
        expect(templateData.MattOraOut1).toBe('10:00:00 - 13:00:00');
    });
});
