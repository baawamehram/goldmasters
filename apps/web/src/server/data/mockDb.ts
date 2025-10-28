import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// File path for server-side persistence (only used on server)
// Use workspace root .data directory (one level up from apps/web, then up from apps)
const DATA_DIR = path.join(process.cwd(), '..', '..', '.data');
const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.json');
const USER_ENTRIES_FILE = path.join(DATA_DIR, 'user-entries.json');
const COMPLETED_ENTRIES_FILE = path.join(DATA_DIR, 'completed-entries.json');

// Ensure data directory exists (server-side only)
const ensureDataDir = () => {
  if (typeof window === 'undefined') {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }
};

export type MockMarker = {
  id: string;
  x: number;
  y: number;
};

export type MockTicket = {
  id: string;
  ticketNumber: number;
  status: 'ASSIGNED' | 'USED';
  markersAllowed: number;
  markersUsed: number;
  markers: MockMarker[];
  submittedAt?: Date | null;
};

export type MockParticipant = {
  id: string;
  competitionId: string;
  name: string;
  phone: string;
  email?: string;
  tickets: MockTicket[];
  lastSubmissionAt?: Date | null;
};

export type MockCompetition = {
  id: string;
  title: string;
  imageUrl: string;
  maxEntries: number;
  status: 'ACTIVE' | 'CLOSED';
  pricePerTicket: number;
  markersPerTicket: number;
  invitePasswordHash: string;
  invitePasswordHint?: string;
  createdAt: Date;
  endsAt: Date;
  finalJudgeX?: number | null;
  finalJudgeY?: number | null;
};

export type MockCompetitionWinner = {
  ticketId: string;
  ticketNumber: number;
  participantId: string;
  participantName: string;
  participantPhone: string;
  distance: number;
  marker: MockMarker | null;
};

export type MockCompetitionResult = {
  competitionId: string;
  finalJudgeX: number;
  finalJudgeY: number;
  winners: MockCompetitionWinner[];
  computedAt: Date;
};

const DEFAULT_INVITE_PASSWORD = 'competition123';
const DEFAULT_INVITE_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_INVITE_PASSWORD, 10);

export const sanitizePhone = (phone: string): string => phone.replace(/[^0-9+]/g, '');

let mockCompetitions: MockCompetition[] = [
  {
    id: 'test-id',
    title: 'Gold Coin',
    imageUrl: '/images/gold-coin.svg',
    maxEntries: 100,
    status: 'ACTIVE',
    pricePerTicket: 500,
    markersPerTicket: 3,
    invitePasswordHash: DEFAULT_INVITE_PASSWORD_HASH,
    invitePasswordHint: 'Default dev password',
    createdAt: new Date('2025-10-01'),
    endsAt: new Date('2025-10-31'),
    finalJudgeX: null,
    finalJudgeY: null,
  },
];

// Load participants from localStorage (browser) or file (server)
const loadParticipantsFromStorage = (): MockParticipant[] => {
  // Browser: use localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mock_participants_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((participant: any) => ({
          ...participant,
          lastSubmissionAt: participant.lastSubmissionAt ? new Date(participant.lastSubmissionAt) : null,
          tickets: participant.tickets.map((ticket: any) => ({
            ...ticket,
            submittedAt: ticket.submittedAt ? new Date(ticket.submittedAt) : null,
          })),
        }));
      }
    } catch (error) {
      console.error('Error loading participants from localStorage:', error);
    }
  }
  // Server: use file system
  else {
    try {
      ensureDataDir();
      if (fs.existsSync(PARTICIPANTS_FILE)) {
        const data = fs.readFileSync(PARTICIPANTS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.map((participant: any) => ({
          ...participant,
          lastSubmissionAt: participant.lastSubmissionAt ? new Date(participant.lastSubmissionAt) : null,
          tickets: participant.tickets.map((ticket: any) => ({
            ...ticket,
            submittedAt: ticket.submittedAt ? new Date(ticket.submittedAt) : null,
          })),
        }));
      }
    } catch (error) {
      console.error('Error loading participants from file:', error);
    }
  }
  // Return default sample participants if nothing in storage
  return [
    {
      id: 'participant-1',
      competitionId: 'test-id',
      name: 'Priya Sharma',
      phone: sanitizePhone('+91 98765 43210'),
      email: 'priya.sharma@example.com',
      tickets: [
        {
          id: 'ticket-1',
          ticketNumber: 101,
          status: 'ASSIGNED',
          markersAllowed: 3,
          markersUsed: 0,
          markers: [],
        },
        {
          id: 'ticket-2',
          ticketNumber: 102,
          status: 'ASSIGNED',
          markersAllowed: 3,
          markersUsed: 0,
          markers: [],
        },
      ],
    },
    {
      id: 'participant-2',
      competitionId: 'test-id',
      name: 'Arjun Mehta',
      phone: sanitizePhone('+91 91234 56789'),
      email: 'arjun.mehta@example.com',
      tickets: [
        {
          id: 'ticket-3',
          ticketNumber: 103,
          status: 'USED',
          markersAllowed: 3,
          markersUsed: 3,
          markers: [
            { id: 'ticket-3-marker-1', x: 0.42, y: 0.28 },
            { id: 'ticket-3-marker-2', x: 0.55, y: 0.31 },
            { id: 'ticket-3-marker-3', x: 0.51, y: 0.45 },
          ],
          submittedAt: new Date('2025-10-20T10:30:00Z'),
        },
      ],
      lastSubmissionAt: new Date('2025-10-20T10:30:00Z'),
    },
  ];
};

// Save participants to localStorage (browser) or file (server)
const saveParticipantsToStorage = () => {
  // Browser: use localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mock_participants_db', JSON.stringify(mockParticipants));
    } catch (error) {
      console.error('Error saving participants to localStorage:', error);
    }
  }
  // Server: use file system
  else {
    try {
      ensureDataDir();
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(mockParticipants, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving participants to file:', error);
    }
  }
};

const COMPLETED_ENTRIES_STORAGE_KEY = 'completed_entries_db';

const loadCompletedEntriesFromStorage = (): Set<string> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(COMPLETED_ENTRIES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed.filter((value): value is string => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.error('Error loading completed entries from localStorage:', error);
    }
  } else {
    try {
      ensureDataDir();
      if (fs.existsSync(COMPLETED_ENTRIES_FILE)) {
        const data = fs.readFileSync(COMPLETED_ENTRIES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return new Set(parsed.filter((value: unknown): value is string => typeof value === 'string'));
        }
      }
    } catch (error) {
      console.error('Error loading completed entries from file:', error);
    }
  }

  return new Set();
};

const saveCompletedEntriesToStorage = (entries: Set<string>) => {
  const payload = JSON.stringify(Array.from(entries), null, 2);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COMPLETED_ENTRIES_STORAGE_KEY, payload);
    } catch (error) {
      console.error('Error saving completed entries to localStorage:', error);
    }
  } else {
    try {
      ensureDataDir();
      fs.writeFileSync(COMPLETED_ENTRIES_FILE, payload, 'utf-8');
    } catch (error) {
      console.error('Error saving completed entries to file:', error);
    }
  }
};

let mockParticipants: MockParticipant[] = loadParticipantsFromStorage();

let mockCompetitionResults: MockCompetitionResult[] = [];
let completedEntries: Set<string> = loadCompletedEntriesFromStorage();

export const getCompetitions = (): MockCompetition[] => mockCompetitions;

export const getParticipants = (): MockParticipant[] => mockParticipants;

export const getParticipantsByCompetition = (competitionId: string): MockParticipant[] =>
  mockParticipants.filter((participant) => participant.competitionId === competitionId);

export const calculateTicketsSold = (competitionId: string): number =>
  mockParticipants
    .filter((participant) => participant.competitionId === competitionId)
    .reduce((total, participant) => total + participant.tickets.length, 0);

export const findCompetitionById = (id: string): MockCompetition | null =>
  mockCompetitions.find((competition) => competition.id === id) ?? null;

export const getCompetitionById = (id: string): MockCompetition => {
  const existing = mockCompetitions.find((competition) => competition.id === id);
  if (existing) {
    return existing;
  }

  return {
    id,
    title: 'Unnamed Competition',
    imageUrl: 'https://placehold.co/1200x800/png?text=Competition+Image',
    maxEntries: 100,
    status: 'ACTIVE',
    pricePerTicket: 500,
    markersPerTicket: 3,
    invitePasswordHash: DEFAULT_INVITE_PASSWORD_HASH,
    invitePasswordHint: 'Default dev password',
    createdAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: null,
    finalJudgeY: null,
  };
};

export const upsertCompetition = (competition: MockCompetition): void => {
  const exists = mockCompetitions.some((record) => record.id === competition.id);
  if (exists) {
    mockCompetitions = mockCompetitions.map((record) =>
      record.id === competition.id ? competition : record
    );
  } else {
    mockCompetitions = [...mockCompetitions, competition];
  }
};

export const createCompetition = async ({
  title,
  maxEntries,
  invitePassword,
  imageUrl,
  pricePerTicket,
  markersPerTicket,
  endsAt,
}: {
  title: string;
  maxEntries: number;
  invitePassword: string;
  imageUrl: string;
  pricePerTicket?: number;
  markersPerTicket?: number;
  endsAt?: string;
}): Promise<MockCompetition> => {
  const id = `competition-${Date.now()}`;
  const invitePasswordHash = await bcrypt.hash(invitePassword, 10);

  const competition: MockCompetition = {
    id,
    title,
    imageUrl,
    maxEntries,
    status: 'ACTIVE',
    pricePerTicket: pricePerTicket ?? 500,
    markersPerTicket: markersPerTicket ?? 3,
    invitePasswordHash,
    invitePasswordHint: 'Provided during creation',
    createdAt: new Date(),
    endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: null,
    finalJudgeY: null,
  };

  mockCompetitions = [...mockCompetitions, competition];
  return competition;
};

export const closeCompetition = (id: string): MockCompetition | null => {
  const competition = mockCompetitions.find((record) => record.id === id);
  if (!competition) {
    return null;
  }

  const updated: MockCompetition = {
    ...competition,
    status: 'CLOSED',
  };

  mockCompetitions = mockCompetitions.map((record) =>
    record.id === id ? updated : record
  );

  return updated;
};

export const findParticipantByPhone = (competitionId: string, phone: string) =>
  mockParticipants.find(
    (participant) =>
      participant.competitionId === competitionId &&
      sanitizePhone(participant.phone) === sanitizePhone(phone)
  );

export const findParticipantById = (competitionId: string, participantId: string) =>
  mockParticipants.find(
    (participant) =>
      participant.competitionId === competitionId && participant.id === participantId
  );

export const findParticipantsByPhone = (phone: string): MockParticipant[] => {
  const sanitized = sanitizePhone(phone);
  return mockParticipants.filter(
    (participant) => sanitizePhone(participant.phone) === sanitized
  );
};

export const getCompetitionsByIds = (ids: string[]): MockCompetition[] => {
  const lookup = new Set(ids);
  return mockCompetitions.filter((competition) => lookup.has(competition.id));
};

export const saveParticipant = (updatedParticipant: MockParticipant) => {
  const exists = mockParticipants.some(
    (participant) => participant.id === updatedParticipant.id
  );

  if (exists) {
    mockParticipants = mockParticipants.map((participant) =>
      participant.id === updatedParticipant.id ? updatedParticipant : participant
    );
  } else {
    mockParticipants = [...mockParticipants, updatedParticipant];
  }
};

export const getCompetitionsWithStats = () =>
  mockCompetitions.map((competition) => {
    const ticketsSold = calculateTicketsSold(competition.id);
    const remainingSlots = Math.max(0, competition.maxEntries - ticketsSold);

    return {
      ...competition,
      ticketsSold,
      remainingSlots,
    };
  });

export const setCompetitionFinalResult = (
  id: string,
  finalJudgeX: number,
  finalJudgeY: number
): MockCompetition | null => {
  const competition = mockCompetitions.find((record) => record.id === id);
  if (!competition) {
    return null;
  }

  const updated: MockCompetition = {
    ...competition,
    finalJudgeX,
    finalJudgeY,
  };

  mockCompetitions = mockCompetitions.map((record) =>
    record.id === id ? updated : record
  );

  return updated;
};

export const saveCompetitionResult = (result: MockCompetitionResult): void => {
  const exists = mockCompetitionResults.some((entry) => entry.competitionId === result.competitionId);

  if (exists) {
    mockCompetitionResults = mockCompetitionResults.map((entry) =>
      entry.competitionId === result.competitionId ? result : entry
    );
  } else {
    mockCompetitionResults = [...mockCompetitionResults, result];
  }
};

export const getCompetitionResult = (competitionId: string): MockCompetitionResult | null =>
  mockCompetitionResults.find((entry) => entry.competitionId === competitionId) ?? null;

const buildCompletionKey = (competitionId: string, participantId: string) =>
  `${competitionId}:${participantId}`;

export const hasParticipantCompletedEntry = (
  competitionId: string,
  participantId: string | null | undefined
): boolean => {
  if (!competitionId || !participantId) {
    return false;
  }

  return completedEntries.has(buildCompletionKey(competitionId, participantId));
};

export const markParticipantCompletedEntry = (
  competitionId: string,
  participantId: string | null | undefined
) => {
  if (!competitionId || !participantId) {
    return;
  }

  const key = buildCompletionKey(competitionId, participantId);
  if (completedEntries.has(key)) {
    return;
  }

  completedEntries.add(key);
  saveCompletedEntriesToStorage(completedEntries);
};

export const clearParticipantCompletion = (
  competitionId: string,
  participantId: string | null | undefined
) => {
  if (!competitionId || !participantId) {
    return;
  }

  const key = buildCompletionKey(competitionId, participantId);
  if (completedEntries.delete(key)) {
    saveCompletedEntriesToStorage(completedEntries);
  }
};

// ============================================
// USER ENTRY TRACKING (Auto-create on login)
// ============================================

export type UserEntry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  assignedTickets: number; // Count of tickets assigned across all competitions
  isLoggedIn: boolean; // Current login status
  lastLoginAt: Date | null; // Last login timestamp
  lastLogoutAt: Date | null; // Last logout timestamp
  accessCode: string; // Unique 6-digit code for competition access
  currentPhase: number | null; // Which phase user is assigned to (1, 2, or 3)
};

// Default sample users
const getDefaultUserEntries = (): UserEntry[] => {
  return [
    {
      id: 'user-1',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh@example.com',
      accessCode: '123456',
      currentPhase: 1,
      isLoggedIn: true,
      lastLoginAt: new Date('2025-10-26T10:30:00'),
      lastLogoutAt: null,
      assignedTickets: 0,
      createdAt: new Date('2025-10-25T09:00:00'),
    },
    {
      id: 'user-2',
      name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya@example.com',
      accessCode: '234567',
      currentPhase: 1,
      isLoggedIn: false,
      lastLoginAt: new Date('2025-10-26T08:15:00'),
      lastLogoutAt: new Date('2025-10-26T09:45:00'),
      assignedTickets: 0,
      createdAt: new Date('2025-10-25T10:30:00'),
    },
    {
      id: 'user-3',
      name: 'Amit Patel',
      phone: '9876543212',
      email: 'amit@example.com',
      accessCode: '345678',
      currentPhase: 2,
      isLoggedIn: true,
      lastLoginAt: new Date('2025-10-26T11:00:00'),
      lastLogoutAt: null,
      assignedTickets: 0,
      createdAt: new Date('2025-10-25T11:15:00'),
    },
    {
      id: 'user-4',
      name: 'Sneha Reddy',
      phone: '9876543213',
      email: 'sneha@example.com',
      accessCode: '456789',
      currentPhase: null,
      isLoggedIn: false,
      lastLoginAt: new Date('2025-10-25T14:20:00'),
      lastLogoutAt: new Date('2025-10-25T16:30:00'),
      assignedTickets: 0,
      createdAt: new Date('2025-10-25T14:00:00'),
    },
    {
      id: 'user-5',
      name: 'Vikram Singh',
      phone: '9876543214',
      email: 'vikram@example.com',
      accessCode: '567890',
      currentPhase: 3,
      isLoggedIn: true,
      lastLoginAt: new Date('2025-10-26T09:30:00'),
      lastLogoutAt: null,
      assignedTickets: 0,
      createdAt: new Date('2025-10-24T16:45:00'),
    },
  ];
};

// Load user entries from localStorage (browser) or file (server)
const loadUserEntriesFromStorage = (): UserEntry[] => {
  // Browser: use localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('user_entries_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          lastLoginAt: entry.lastLoginAt ? new Date(entry.lastLoginAt) : null,
          lastLogoutAt: entry.lastLogoutAt ? new Date(entry.lastLogoutAt) : null,
        }));
      }
    } catch (error) {
      console.error('Error loading user entries from localStorage:', error);
    }
  }
  // Server: use file system
  else {
    try {
      ensureDataDir();
      if (fs.existsSync(USER_ENTRIES_FILE)) {
        const data = fs.readFileSync(USER_ENTRIES_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          lastLoginAt: entry.lastLoginAt ? new Date(entry.lastLoginAt) : null,
          lastLogoutAt: entry.lastLogoutAt ? new Date(entry.lastLogoutAt) : null,
        }));
      }
    } catch (error) {
      console.error('Error loading user entries from file:', error);
    }
  }
  return getDefaultUserEntries();
};

// Save user entries to localStorage (browser) or file (server)
const saveUserEntriesToStorage = () => {
  // Browser: use localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('user_entries_db', JSON.stringify(userEntries));
    } catch (error) {
      console.error('Error saving user entries to localStorage:', error);
    }
  }
  // Server: use file system
  else {
    try {
      ensureDataDir();
      fs.writeFileSync(USER_ENTRIES_FILE, JSON.stringify(userEntries, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving user entries to file:', error);
    }
  }
};

// Initialize user entries array
let userEntries: UserEntry[] = loadUserEntriesFromStorage();

// Generate unique 6-digit access code
const generateAccessCode = (): string => {
  // Generate random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Ensure uniqueness
  const exists = userEntries.some(entry => entry.accessCode === code);
  if (exists) {
    return generateAccessCode(); // Recursively generate new code if duplicate
  }
  
  return code;
};

export const createOrUpdateUserEntry = (name: string, phone: string, existingId?: string): UserEntry => {
  const sanitized = sanitizePhone(phone);
  
  // Reload from storage to get latest data
  userEntries = loadUserEntriesFromStorage();
  
  // Check if user already exists by phone
  const existing = userEntries.find((entry) => entry.phone === sanitized);
  
  if (existing) {
    // Update name if changed
    if (existing.name !== name) {
      existing.name = name;
    }
    // Update login status
    existing.isLoggedIn = true;
    existing.lastLoginAt = new Date();
    saveUserEntriesToStorage();
    return existing;
  }
  
  // If existingId is provided, check if a user with that ID already exists
  if (existingId) {
    const existingById = userEntries.find((entry) => entry.id === existingId);
    if (existingById) {
      // Update phone number if user exists with this ID
      existingById.phone = sanitized;
      existingById.name = name;
      existingById.isLoggedIn = true;
      existingById.lastLoginAt = new Date();
      saveUserEntriesToStorage();
      return existingById;
    }
  }
  
  // Create new entry with provided ID or generate new one
  const newEntry: UserEntry = {
    id: existingId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    phone: sanitized,
    email: null,
    createdAt: new Date(),
    assignedTickets: 0,
    isLoggedIn: true, // User is logging in now
    lastLoginAt: new Date(),
    lastLogoutAt: null,
    accessCode: generateAccessCode(), // Auto-generate unique 6-digit code
    currentPhase: null, // No phase assigned yet
  };
  
  userEntries.push(newEntry);
  saveUserEntriesToStorage();
  return newEntry;
};

export const getAllUserEntries = (): UserEntry[] => {
  const defaultCompetitionId = 'test-id';
  
  // Reload from storage to get latest data (including users added by other processes)
  const latestEntries = loadUserEntriesFromStorage();
  
  return latestEntries.map((entry) => {
    // Only count tickets from the default competition to match admin assignment logic
    // This prevents checkout/gameplay tickets in other competitions from affecting the count
    const participants = mockParticipants.filter(
      (p) => sanitizePhone(p.phone) === entry.phone && p.competitionId === defaultCompetitionId
    );
    const ticketCount = participants.reduce((total, p) => total + p.tickets.length, 0);
    
    return {
      ...entry,
      assignedTickets: ticketCount,
    };
  });
};

export const getUserEntryByPhone = (phone: string): UserEntry | null => {
  const sanitized = sanitizePhone(phone);
  return userEntries.find((entry) => entry.phone === sanitized) ?? null;
};

export const getUserEntryById = (id: string): UserEntry | null => {
  return userEntries.find((entry) => entry.id === id) ?? null;
};

export const getUserEntryByNameAndPhone = (name: string, phone: string): UserEntry | null => {
  const sanitized = sanitizePhone(phone);
  return userEntries.find((entry) => 
    entry.phone === sanitized && 
    entry.name.trim().toLowerCase() === name.trim().toLowerCase()
  ) ?? null;
};

export const logoutUserEntry = (phone: string): UserEntry | null => {
  const sanitized = sanitizePhone(phone);
  const entry = userEntries.find((e) => e.phone === sanitized);
  
  if (entry) {
    entry.isLoggedIn = false;
    entry.lastLogoutAt = new Date();
    saveUserEntriesToStorage();
  }
  
  return entry ?? null;
};

export const verifyAccessCode = (code: string): UserEntry | null => {
  return userEntries.find((entry) => entry.accessCode === code) ?? null;
};

export const assignUserToPhase = (userId: string, phase: number): UserEntry | null => {
  const entry = userEntries.find((e) => e.id === userId);
  
  if (entry) {
    entry.currentPhase = phase;
    saveUserEntriesToStorage();
  }
  
  return entry ?? null;
};

export const getUsersByPhase = (phase: number): UserEntry[] => {
  return userEntries.filter((entry) => entry.currentPhase === phase);
};

export const updateUserTickets = (userId: string, ticketCount: number): UserEntry | null => {
  const user = userEntries.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  // Get or create participant for this user in the default competition ONLY
  const defaultCompetitionId = 'test-id';
  
  // CLEANUP: Remove any participants for this user in OTHER competitions
  // We only want one competition per user
  const userPhone = sanitizePhone(user.phone);
  mockParticipants = mockParticipants.filter(
    (p) => !(sanitizePhone(p.phone) === userPhone && p.competitionId !== defaultCompetitionId)
  );
  
  // Find or merge all participants in the default competition for this user
  const participantsInDefault = mockParticipants.filter(
    (p) => sanitizePhone(p.phone) === userPhone && p.competitionId === defaultCompetitionId
  );
  
  let participant: MockParticipant;
  
  if (participantsInDefault.length === 0) {
    // Create new participant entry
    const newParticipant: MockParticipant = {
      id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      competitionId: defaultCompetitionId,
      name: user.name,
      phone: user.phone,
      email: user.email || undefined,
      tickets: [],
      lastSubmissionAt: null,
    };
    mockParticipants.push(newParticipant);
    participant = newParticipant;
  } else if (participantsInDefault.length === 1) {
    // Use the existing participant
    participant = participantsInDefault[0];
  } else {
    // Multiple participants found - merge them into one
    participant = participantsInDefault[0];
    
    // Merge tickets from duplicates
    for (let i = 1; i < participantsInDefault.length; i++) {
      const duplicate = participantsInDefault[i];
      participant.tickets = [...participant.tickets, ...duplicate.tickets];
      
      // Update last submission time if newer
      if (duplicate.lastSubmissionAt && 
          (!participant.lastSubmissionAt || duplicate.lastSubmissionAt > participant.lastSubmissionAt)) {
        participant.lastSubmissionAt = duplicate.lastSubmissionAt;
      }
    }
    
    // Remove duplicates from the array
    const duplicateIds = participantsInDefault.slice(1).map(p => p.id);
    mockParticipants = mockParticipants.filter(p => !duplicateIds.includes(p.id));
  }

  // Calculate current ticket count for this specific participant
  const currentTicketCount = participant.tickets.length;
  
  // Adjust tickets to match the desired count
  if (ticketCount > currentTicketCount) {
    // Add more tickets
    const ticketsToAdd = ticketCount - currentTicketCount;
    for (let i = 0; i < ticketsToAdd; i++) {
      const newTicket: MockTicket = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ticketNumber: 1000 + mockParticipants.reduce((total, p) => total + p.tickets.length, 0) + i,
        status: 'ASSIGNED',
        markersAllowed: 3, // Each ticket allows 3 markers
        markersUsed: 0,
        markers: [],
        submittedAt: null,
      };
      participant.tickets.push(newTicket);
    }
  } else if (ticketCount < currentTicketCount) {
    // Remove excess tickets (only remove unused ones)
    const ticketsToRemove = currentTicketCount - ticketCount;
    const unusedTickets = participant.tickets.filter(t => t.markersUsed === 0);
    
    if (unusedTickets.length >= ticketsToRemove) {
      // Remove unused tickets
      for (let i = 0; i < ticketsToRemove; i++) {
        const ticketIndex = participant.tickets.findIndex(t => t.markersUsed === 0);
        if (ticketIndex !== -1) {
          participant.tickets.splice(ticketIndex, 1);
        }
      }
    } else {
      // If not enough unused tickets, just remove what we can
      participant.tickets = participant.tickets.filter(t => t.markersUsed > 0);
    }
  }

  // Update user's assigned tickets count to match ONLY the default competition
  // Not the sum of all competitions
  user.assignedTickets = participant.tickets.length;
  
  // Save both participants and user entries to storage
  saveParticipantsToStorage();
  saveUserEntriesToStorage();
  
  return user;
};

// Delete user entries and related participant data by a list of IDs
export const deleteUserEntriesByIds = (ids: string[]): { deleted: number; failed: number } => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  const idSet = new Set(ids);
  let deletedCount = 0;

  try {
    // Reload latest data from storage to ensure we have the latest state
    userEntries = loadUserEntriesFromStorage();
    mockParticipants = loadParticipantsFromStorage();

    console.log(`[deleteUserEntriesByIds] Before deletion: ${userEntries.length} users, ${mockParticipants.length} participants`);

    // Find emails of users to be deleted (for participant lookup)
    const usersToDelete = userEntries.filter((entry) => idSet.has(entry.id));
    const emailsToDelete = new Set(usersToDelete.map((u) => u.email));
    const phonesToDelete = new Set(usersToDelete.map((u) => u.phone));

    // Delete user entries
    const userEntriesBeforeDelete = userEntries.length;
    userEntries = userEntries.filter((entry) => !idSet.has(entry.id));
    deletedCount = userEntriesBeforeDelete - userEntries.length;

    // Delete all participants associated with these users (match by email or phone)
    const participantsBeforeDelete = mockParticipants.length;
    mockParticipants = mockParticipants.filter((participant) => {
      // Keep this participant if it doesn't match any deleted user's email or phone
      const shouldDelete = 
        (participant.email && emailsToDelete.has(participant.email)) || 
        phonesToDelete.has(participant.phone);
      return !shouldDelete;
    });

    // Persist changes to storage
    saveUserEntriesToStorage();
    saveParticipantsToStorage();

    const participantsDeleted = participantsBeforeDelete - mockParticipants.length;
    console.log(`[deleteUserEntriesByIds] Deleted ${deletedCount} users, ${participantsDeleted} participants`);
    console.log(`[deleteUserEntriesByIds] After deletion: ${userEntries.length} users, ${mockParticipants.length} participants`);

    return { deleted: deletedCount, failed: 0 };
  } catch (err) {
    console.error('[deleteUserEntriesByIds] Error:', err);
    return { deleted: 0, failed: ids.length };
  }
};

