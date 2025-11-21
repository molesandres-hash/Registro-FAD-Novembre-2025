/**
 * Tests for FullCourseProcessor
 *
 * This test suite covers the orchestration layer that coordinates:
 * - CSV parsing
 * - Alias detection
 * - Automatic alias merging
 * - Statistics calculation
 * - Data validation
 */

import { fullCourseProcessor } from '../services/fullCourseProcessor';
import { fullCourseParsingService } from '../services/fullCourseParsingService';
import { aliasManagementService } from '../services/aliasManagementService';
import { ParsedFullCourseData, FullCourseParticipantInfo } from '../types/course';

// Mock the services
jest.mock('../services/fullCourseParsingService');
jest.mock('../services/aliasManagementService');

describe('FullCourseProcessor', () => {
  // Sample mock data
  const mockOrganizer: FullCourseParticipantInfo = {
    id: 'organizer_1',
    primaryName: 'Prof. Mario Rossi',
    aliases: ['Prof. Mario Rossi'],
    email: 'mario.rossi@test.it',
    isOrganizer: true,
    masterOrder: 0,
    daysPresent: ['2025-09-19', '2025-09-20'],
  };

  const mockParticipant1: FullCourseParticipantInfo = {
    id: 'participant_1',
    primaryName: 'Giorgio Santambrogio',
    aliases: ['Giorgio Santambrogio', 'giorgio s.'],
    email: 'giorgio@test.it',
    isOrganizer: false,
    masterOrder: 1,
    daysPresent: ['2025-09-19', '2025-09-20'],
  };

  const mockParticipant2: FullCourseParticipantInfo = {
    id: 'participant_2',
    primaryName: 'Maria Verdi',
    aliases: ['Maria Verdi'],
    email: 'maria@test.it',
    isOrganizer: false,
    masterOrder: 2,
    daysPresent: ['2025-09-19'],
  };

  const mockParsedData: ParsedFullCourseData = {
    courseName: 'Corso Test',
    zoomMeetingId: '123456',
    organizer: {
      name: 'Prof. Mario Rossi',
      email: 'mario.rossi@test.it',
    },
    days: [
      {
        date: '2025-09-19',
        courseName: 'Corso Test',
        zoomMeetingId: '123456',
        startTime: new Date('2025-09-19T09:00:00'),
        endTime: new Date('2025-09-19T13:00:00'),
        sessions: [],
        participantNames: new Set(['Prof. Mario Rossi', 'Giorgio Santambrogio', 'Maria Verdi']),
      },
      {
        date: '2025-09-20',
        courseName: 'Corso Test',
        zoomMeetingId: '123456',
        startTime: new Date('2025-09-20T14:00:00'),
        endTime: new Date('2025-09-20T18:00:00'),
        sessions: [],
        participantNames: new Set(['Prof. Mario Rossi', 'Giorgio Santambrogio']),
      },
    ],
    allParticipants: [mockOrganizer, mockParticipant1, mockParticipant2],
    aliasSuggestions: [],
    dateRange: {
      start: '2025-09-19',
      end: '2025-09-20',
    },
    statistics: {
      totalDays: 2,
      totalParticipants: 3,
      totalSessions: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processFullCourseCSV', () => {
    it('should process CSV file successfully', async () => {
      // Mock parsing service
      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue(mockParsedData);

      // Mock alias detection (no aliases found)
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue([]);

      // Mock alias application
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants: mockParsedData.allParticipants,
        mappings: [],
      });

      const csvContent = 'mock csv content';
      const result = await fullCourseProcessor.processFullCourseCSV(csvContent);

      expect(result).toBeDefined();
      expect(result.courseName).toBe('Corso Test');
      expect(result.statistics.totalDays).toBe(2);
      expect(result.statistics.totalParticipants).toBe(3);
    });

    it('should call parsing service with CSV content', async () => {
      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue(mockParsedData);
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue([]);
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants: mockParsedData.allParticipants,
        mappings: [],
      });

      const csvContent = 'mock csv content';
      await fullCourseProcessor.processFullCourseCSV(csvContent);

      expect(fullCourseParsingService.parseFullCourseCSV).toHaveBeenCalledWith(csvContent);
    });

    it('should detect aliases among participants', async () => {
      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue(mockParsedData);
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue([]);
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants: mockParsedData.allParticipants,
        mappings: [],
      });

      const csvContent = 'mock csv content';
      await fullCourseProcessor.processFullCourseCSV(csvContent);

      expect(aliasManagementService.detectAliases).toHaveBeenCalledWith(
        mockParsedData.allParticipants
      );
    });

    it('should merge high-confidence aliases automatically', async () => {
      const aliasSuggestions = [
        {
          participantId: 'participant_1',
          mainName: 'Giorgio Santambrogio',
          suggestedAliases: ['giorgio s.'],
          similarityScores: [0.85],
          autoMerged: true,
          confidence: 0.85,
        },
      ];

      const mergedParticipants = [mockOrganizer, mockParticipant1, mockParticipant2];

      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue(mockParsedData);
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue(aliasSuggestions);
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants,
        mappings: [],
      });

      const csvContent = 'mock csv content';
      const result = await fullCourseProcessor.processFullCourseCSV(csvContent);

      expect(aliasManagementService.applyAliasMappings).toHaveBeenCalledWith(
        mockParsedData.allParticipants,
        aliasSuggestions
      );
      expect(result.allParticipants).toBe(mergedParticipants);
    });

    it('should throw error if no participants found', async () => {
      const emptyParsedData = {
        ...mockParsedData,
        allParticipants: [mockOrganizer], // Only organizer
      };

      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue(emptyParsedData);
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue([]);
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants: [mockOrganizer],
        mappings: [],
      });

      const csvContent = 'mock csv content';

      await expect(fullCourseProcessor.processFullCourseCSV(csvContent)).rejects.toThrow(
        'Nessun partecipante trovato nel file CSV'
      );
    });

    it('should update statistics after merging', async () => {
      const beforeMergeParticipants = [mockOrganizer, mockParticipant1, mockParticipant2];
      const afterMergeParticipants = [mockOrganizer, mockParticipant1]; // One merged

      (fullCourseParsingService.parseFullCourseCSV as jest.Mock).mockReturnValue({
        ...mockParsedData,
        allParticipants: beforeMergeParticipants,
        statistics: { ...mockParsedData.statistics, totalParticipants: 3 },
      });
      (aliasManagementService.detectAliases as jest.Mock).mockReturnValue([]);
      (aliasManagementService.applyAliasMappings as jest.Mock).mockReturnValue({
        mergedParticipants: afterMergeParticipants,
        mappings: [],
      });

      const csvContent = 'mock csv content';
      const result = await fullCourseProcessor.processFullCourseCSV(csvContent);

      // Statistics should be updated to reflect merged count
      expect(result.statistics.totalParticipants).toBe(2);
    });
  });

  describe('getProcessingSummary', () => {
    it('should generate correct processing summary', () => {
      const summary = fullCourseProcessor.getProcessingSummary(mockParsedData);

      expect(summary.courseName).toBe('Corso Test');
      expect(summary.dateRange).toBe('2025-09-19 - 2025-09-20');
      expect(summary.totalDays).toBe(2);
      // Total participants should match the statistics
      expect(summary.totalParticipants).toBe(mockParsedData.statistics.totalParticipants);
      expect(summary.totalSessions).toBe(5);
      expect(summary.organizerName).toBe('Prof. Mario Rossi');
      expect(summary.participantNames).toContain('Giorgio Santambrogio');
      expect(summary.participantNames).toContain('Maria Verdi');
    });

    it('should exclude organizer from participant names', () => {
      const summary = fullCourseProcessor.getProcessingSummary(mockParsedData);

      expect(summary.participantNames).not.toContain('Prof. Mario Rossi');
      expect(summary.participantNames.length).toBe(2);
    });

    it('should count auto-merged participants', () => {
      const dataWithAliases = {
        ...mockParsedData,
        aliasSuggestions: [
          {
            participantId: 'participant_1',
            mainName: 'Giorgio Santambrogio',
            suggestedAliases: ['giorgio s.'],
            similarityScores: [0.85],
            autoMerged: true,
            confidence: 0.85,
          },
        ],
      };

      const summary = fullCourseProcessor.getProcessingSummary(dataWithAliases);

      expect(summary.autoMergedCount).toBe(1);
    });
  });

  describe('getDayDetails', () => {
    it('should retrieve details for a specific day', () => {
      const details = fullCourseProcessor.getDayDetails(mockParsedData, '2025-09-19');

      expect(details).toBeDefined();
      expect(details!.date).toBe('2025-09-19');
      expect(details!.participantCount).toBe(3);
      expect(details!.participants).toContain('Prof. Mario Rossi');
      expect(details!.participants).toContain('Giorgio Santambrogio');
      expect(details!.participants).toContain('Maria Verdi');
    });

    it('should calculate day duration correctly', () => {
      const details = fullCourseProcessor.getDayDetails(mockParsedData, '2025-09-19');

      expect(details).toBeDefined();
      expect(details!.duration).toBe(240); // 4 hours = 240 minutes
    });

    it('should return null for non-existent date', () => {
      const details = fullCourseProcessor.getDayDetails(mockParsedData, '2025-09-25');

      expect(details).toBeNull();
    });

    it('should sort participants alphabetically', () => {
      const details = fullCourseProcessor.getDayDetails(mockParsedData, '2025-09-19');

      expect(details).toBeDefined();
      const participants = details!.participants;

      for (let i = 0; i < participants.length - 1; i++) {
        expect(participants[i].localeCompare(participants[i + 1])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('getParticipantStats', () => {
    it('should retrieve statistics for a specific participant', () => {
      const stats = fullCourseProcessor.getParticipantStats(mockParsedData, 'participant_1');

      expect(stats).toBeDefined();
      expect(stats!.name).toBe('Giorgio Santambrogio');
      expect(stats!.email).toBe('giorgio@test.it');
      expect(stats!.totalDays).toBe(2);
      expect(stats!.daysPresent).toBe(2);
      expect(stats!.daysAbsent).toBe(0);
      expect(stats!.attendanceRate).toBe(100);
    });

    it('should calculate attendance rate correctly', () => {
      // Maria was present only 1 out of 2 days
      const stats = fullCourseProcessor.getParticipantStats(mockParsedData, 'participant_2');

      expect(stats).toBeDefined();
      expect(stats!.daysPresent).toBe(1);
      expect(stats!.daysAbsent).toBe(1);
      expect(stats!.attendanceRate).toBe(50); // 1/2 = 50%
    });

    it('should return null for non-existent participant', () => {
      const stats = fullCourseProcessor.getParticipantStats(mockParsedData, 'non_existent_id');

      expect(stats).toBeNull();
    });

    it('should include participant aliases', () => {
      const stats = fullCourseProcessor.getParticipantStats(mockParsedData, 'participant_1');

      expect(stats).toBeDefined();
      expect(stats!.aliases).toContain('Giorgio Santambrogio');
      expect(stats!.aliases).toContain('giorgio s.');
    });

    it('should list all dates participant was present', () => {
      const stats = fullCourseProcessor.getParticipantStats(mockParsedData, 'participant_1');

      expect(stats).toBeDefined();
      expect(stats!.presentDates).toContain('2025-09-19');
      expect(stats!.presentDates).toContain('2025-09-20');
    });
  });

  describe('validateParsedData', () => {
    it('should validate correct data without errors', () => {
      const validation = fullCourseProcessor.validateParsedData(mockParsedData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing course name', () => {
      const invalidData = {
        ...mockParsedData,
        courseName: '',
      };

      const validation = fullCourseProcessor.validateParsedData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nome corso mancante');
    });

    it('should detect empty days', () => {
      const invalidData = {
        ...mockParsedData,
        days: [],
      };

      const validation = fullCourseProcessor.validateParsedData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nessun giorno trovato nel CSV');
    });

    it('should detect missing participants', () => {
      const invalidData = {
        ...mockParsedData,
        allParticipants: [],
      };

      const validation = fullCourseProcessor.validateParsedData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Nessun partecipante trovato');
    });

    it('should warn about missing organizer', () => {
      const dataWithoutOrganizer = {
        ...mockParsedData,
        allParticipants: [mockParticipant1, mockParticipant2], // No organizer
      };

      const validation = fullCourseProcessor.validateParsedData(dataWithoutOrganizer);

      expect(validation.warnings).toContain('Organizzatore non identificato');
    });

    it('should warn about participants without email', () => {
      const participantWithoutEmail: FullCourseParticipantInfo = {
        ...mockParticipant2,
        email: '',
      };

      const dataWithMissingEmail = {
        ...mockParsedData,
        allParticipants: [mockOrganizer, mockParticipant1, participantWithoutEmail],
      };

      const validation = fullCourseProcessor.validateParsedData(dataWithMissingEmail);

      expect(validation.warnings).toContain('1 partecipanti senza email');
    });

    it('should warn about days with few participants', () => {
      const sparseDay = {
        ...mockParsedData.days[0],
        participantNames: new Set(['Prof. Mario Rossi', 'Student A']), // Only 2 participants
      };

      const dataWithSparseDay = {
        ...mockParsedData,
        days: [sparseDay, mockParsedData.days[1]],
      };

      const validation = fullCourseProcessor.validateParsedData(dataWithSparseDay);

      // Both days have < 3 participants (first has 2, second has 3 from mockParsedData)
      // Actually let's check that warning contains "giorni con meno di"
      expect(validation.warnings.some(w => w.includes('giorni con meno di 3 partecipanti'))).toBe(true);
    });

    it('should allow valid data with warnings', () => {
      const dataWithWarnings = {
        ...mockParsedData,
        allParticipants: [mockOrganizer, mockParticipant1, { ...mockParticipant2, email: '' }],
      };

      const validation = fullCourseProcessor.validateParsedData(dataWithWarnings);

      expect(validation.isValid).toBe(true); // Still valid
      expect(validation.warnings.length).toBeGreaterThan(0); // But has warnings
    });
  });
});
