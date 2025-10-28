import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// File path for server-side persistence
// Use workspace root .data directory (two levels up from apps/api)
const DATA_DIR = path.join(process.cwd(), '..', '..', '.data');
const CHECKOUT_SUMMARIES_FILE = path.join(DATA_DIR, 'checkout-summaries.json');
const USER_ENTRIES_FILE = path.join(DATA_DIR, 'user-entries.json');

// Ensure data directory exists
const ensureDataDir = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
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

export type CheckoutSummary = {
  competitionId: string;
  participantId: string;
  userId?: string; // Add userId to link with user entries
  competition: {
    id: string;
    title: string;
    imageUrl: string;
    pricePerTicket: number;
    markersPerTicket: number;
    status: string;
  };
  participant: {
    id: string;
    name: string;
    phone: string;
    ticketsPurchased: number;
  };
  tickets: Array<{
    ticketNumber: number;
    markerCount: number;
    markers: Array<{ id: string; x: number; y: number; label: string }>;
  }>;
  totalMarkers: number;
  checkoutTime: string;
};

export type UserEntry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  assignedTickets: number;
  isLoggedIn: boolean;
  lastLoginAt: Date | null;
  lastLogoutAt: Date | null;
  accessCode: string;
  currentPhase: number | null;
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

let mockParticipants: MockParticipant[] = [
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

let mockCompetitionResults: MockCompetitionResult[] = [];

// Load checkout summaries from file
const loadCheckoutSummaries = (): Map<string, CheckoutSummary> => {
  try {
    ensureDataDir();
    if (fs.existsSync(CHECKOUT_SUMMARIES_FILE)) {
      const data = fs.readFileSync(CHECKOUT_SUMMARIES_FILE, 'utf-8');
      const parsed = JSON.parse(data) as Array<[string, any]>;
      return new Map(parsed);
    }
  } catch (error) {
    console.error('Error loading checkout summaries from file:', error);
  }
  return new Map();
};

// Save checkout summaries to file
const saveCheckoutSummariesToFile = (summaries: Map<string, CheckoutSummary>) => {
  try {
    ensureDataDir();
    const data = Array.from(summaries.entries());
    fs.writeFileSync(CHECKOUT_SUMMARIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving checkout summaries to file:', error);
  }
};

// Load user entries from file on startup
const loadUserEntries = (): UserEntry[] => {
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
  return [];
};

// Save user entries to file
const saveUserEntriesToFile = (entries: UserEntry[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(USER_ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving user entries to file:', error);
  }
};

const checkoutSummaries = loadCheckoutSummaries();
let userEntries: UserEntry[] = loadUserEntries();

// Generate unique 6-digit access code
const generateAccessCode = (): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const exists = userEntries.some(entry => entry.accessCode === code);
  if (exists) {
    return generateAccessCode();
  }
  return code;
};

export const createOrUpdateUserEntry = (name: string, phone: string, existingId?: string): UserEntry => {
  const sanitized = sanitizePhone(phone);
  
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
    saveUserEntriesToFile(userEntries); // Persist to file
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
      saveUserEntriesToFile(userEntries); // Persist to file
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
    isLoggedIn: true,
    lastLoginAt: new Date(),
    lastLogoutAt: null,
    accessCode: generateAccessCode(),
    currentPhase: null,
  };
  
  userEntries.push(newEntry);
  saveUserEntriesToFile(userEntries); // Persist to file
  return newEntry;
};

export const getUserEntryById = (id: string): UserEntry | null => {
  return userEntries.find((entry) => entry.id === id) ?? null;
};

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

export const saveCheckoutSummary = (
  competitionId: string,
  participantId: string,
  summary: CheckoutSummary
): void => {
  const key = `${competitionId}:${participantId}`;
  checkoutSummaries.set(key, summary);
  
  // Also save by userId if available for easier lookup
  if (summary.userId) {
    const userKey = `${competitionId}:user:${summary.userId}`;
    checkoutSummaries.set(userKey, summary);
  }
  
  // Persist to file
  saveCheckoutSummariesToFile(checkoutSummaries);
};

export const getCheckoutSummary = (
  competitionId: string,
  participantId: string
): CheckoutSummary | null => {
  const key = `${competitionId}:${participantId}`;
  return checkoutSummaries.get(key) ?? null;
};

export const getCheckoutSummaryByUserId = (
  competitionId: string,
  userId: string
): CheckoutSummary | null => {
  const userKey = `${competitionId}:user:${userId}`;
  return checkoutSummaries.get(userKey) ?? null;
};
