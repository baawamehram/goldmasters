import bcrypt from 'bcryptjs';
import prisma from 'db';
import { CompetitionStatus, TicketStatus, ParticipantStatus } from 'db';

// Re-export types for compatibility
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
  userId?: string | null;
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
  userId?: string;
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
    email?: string | null;
    ticketsPurchased: number;
  };
  contactEmail?: string | null;
  completed?: boolean;
  completedAt?: string | null;
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

const DEFAULT_COMPETITION_ID = process.env.NEXT_PUBLIC_DEFAULT_COMPETITION_ID?.trim() || 'test-id';

const normalizeCompetitionId = (competitionId: string | null | undefined): string => {
  if (!competitionId) {
    return DEFAULT_COMPETITION_ID;
  }

  if (competitionId.startsWith('user-') || competitionId.startsWith('participant-')) {
    return DEFAULT_COMPETITION_ID;
  }

  return competitionId;
};

// Phone sanitization helper
export const sanitizePhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D+/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
};

// Generate unique 6-digit access code
const generateAccessCode = async (): Promise<string> => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const exists = await prisma.userEntry.findUnique({
    where: { accessCode: code }
  });
  if (exists) {
    return generateAccessCode();
  }
  return code;
};

// User Entry Functions
export const createOrUpdateUserEntry = async (name: string, phone: string, existingId?: string): Promise<UserEntry> => {
  const sanitized = sanitizePhone(phone);
  
  // Check if user already exists by phone
  const existing = await prisma.userEntry.findUnique({
    where: { phone: sanitized }
  });
  
  if (existing) {
    // Update name if changed
    const updated = await prisma.userEntry.update({
      where: { phone: sanitized },
      data: {
        name,
        isLoggedIn: true,
        lastLoginAt: new Date(),
      }
    });
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      createdAt: updated.createdAt,
      assignedTickets: updated.assignedTickets,
      isLoggedIn: updated.isLoggedIn,
      lastLoginAt: updated.lastLoginAt,
      lastLogoutAt: updated.lastLogoutAt,
      accessCode: updated.accessCode,
      currentPhase: updated.currentPhase,
    };
  }
  
  // If existingId is provided, check if a user with that ID already exists
  if (existingId) {
    const existingById = await prisma.userEntry.findUnique({
      where: { id: existingId }
    });
    if (existingById) {
      // Update phone number if user exists with this ID
      const updated = await prisma.userEntry.update({
        where: { id: existingId },
        data: {
          phone: sanitized,
          name,
          isLoggedIn: true,
          lastLoginAt: new Date(),
        }
      });
      return {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        createdAt: updated.createdAt,
        assignedTickets: updated.assignedTickets,
        isLoggedIn: updated.isLoggedIn,
        lastLoginAt: updated.lastLoginAt,
        lastLogoutAt: updated.lastLogoutAt,
        accessCode: updated.accessCode,
        currentPhase: updated.currentPhase,
      };
    }
  }
  
  // Create new entry
  const accessCode = await generateAccessCode();
  const newEntry = await prisma.userEntry.create({
    data: {
      id: existingId || undefined,
      name,
      phone: sanitized,
      email: null,
      assignedTickets: 0,
      isLoggedIn: true,
      lastLoginAt: new Date(),
      lastLogoutAt: null,
      accessCode,
      currentPhase: null,
    }
  });
  
  return {
    id: newEntry.id,
    name: newEntry.name,
    phone: newEntry.phone,
    email: newEntry.email,
    createdAt: newEntry.createdAt,
    assignedTickets: newEntry.assignedTickets,
    isLoggedIn: newEntry.isLoggedIn,
    lastLoginAt: newEntry.lastLoginAt,
    lastLogoutAt: newEntry.lastLogoutAt,
    accessCode: newEntry.accessCode,
    currentPhase: newEntry.currentPhase,
  };
};

export const getAllUserEntries = async (): Promise<UserEntry[]> => {
  const entries = await prisma.userEntry.findMany();
  
  return entries.map(entry => ({
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt,
    assignedTickets: entry.assignedTickets,
    isLoggedIn: entry.isLoggedIn,
    lastLoginAt: entry.lastLoginAt,
    lastLogoutAt: entry.lastLogoutAt,
    accessCode: entry.accessCode,
    currentPhase: entry.currentPhase,
  }));
};

export const getUserEntryById = async (id: string): Promise<UserEntry | null> => {
  const entry = await prisma.userEntry.findUnique({
    where: { id }
  });
  
  if (!entry) return null;
  
  return {
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt,
    assignedTickets: entry.assignedTickets,
    isLoggedIn: entry.isLoggedIn,
    lastLoginAt: entry.lastLoginAt,
    lastLogoutAt: entry.lastLogoutAt,
    accessCode: entry.accessCode,
    currentPhase: entry.currentPhase,
  };
};

export const createManualUserEntry = async ({
  name,
  phone,
  email,
  id,
}: {
  name: string;
  phone: string;
  email?: string | null;
  id?: string;
}): Promise<UserEntry> => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const sanitizedPhone = sanitizePhone(typeof phone === 'string' ? phone : '');

  if (!trimmedName) {
    throw new Error('Name is required');
  }

  if (!sanitizedPhone) {
    throw new Error('Phone number is required');
  }

  const duplicateByPhone = await prisma.userEntry.findUnique({
    where: { phone: sanitizedPhone }
  });
  
  if (duplicateByPhone) {
    throw new Error('A participant with this phone number already exists.');
  }

  const requestedId = typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
  
  if (requestedId) {
    const duplicateById = await prisma.userEntry.findUnique({
      where: { id: requestedId }
    });
    if (duplicateById) {
      throw new Error('A participant with this user ID already exists.');
    }
  }

  const normalizedEmail = typeof email === 'string' && email.trim().length > 0 ? email.trim() : null;
  const accessCode = await generateAccessCode();

  const newEntry = await prisma.userEntry.create({
    data: {
      id: requestedId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      phone: sanitizedPhone,
      email: normalizedEmail,
      assignedTickets: 0,
      isLoggedIn: false,
      accessCode,
    }
  });

  return {
    id: newEntry.id,
    name: newEntry.name,
    phone: newEntry.phone,
    email: newEntry.email,
    createdAt: newEntry.createdAt,
    assignedTickets: newEntry.assignedTickets,
    isLoggedIn: newEntry.isLoggedIn,
    lastLoginAt: newEntry.lastLoginAt,
    lastLogoutAt: newEntry.lastLogoutAt,
    accessCode: newEntry.accessCode,
    currentPhase: newEntry.currentPhase,
  };
};

export const deleteUserEntriesByIds = async (ids: string[]): Promise<{ deleted: number; failed: number }> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  try {
    // Find users to be deleted
    const usersToDelete = await prisma.userEntry.findMany({
      where: { id: { in: ids } }
    });

    const phonesToDelete = usersToDelete.map(u => u.phone);
    const emailsToDelete = usersToDelete.filter(u => u.email).map(u => u.email as string);

    // Delete associated participants
    await prisma.participant.deleteMany({
      where: {
        OR: [
          { phone: { in: phonesToDelete } },
          ...(emailsToDelete.length > 0 ? [{ email: { in: emailsToDelete } }] : [])
        ]
      }
    });

    // Delete user entries
    const deleteResult = await prisma.userEntry.deleteMany({
      where: { id: { in: ids } }
    });

    return { deleted: deleteResult.count, failed: 0 };
  } catch (err) {
    console.error('[deleteUserEntriesByIds] Error:', err);
    return { deleted: 0, failed: ids.length };
  }
};

export const getUserEntryByPhone = async (phone: string): Promise<UserEntry | null> => {
  const sanitized = sanitizePhone(phone);
  
  const entry = await prisma.userEntry.findUnique({
    where: { phone: sanitized }
  });
  
  if (!entry) return null;
  
  return {
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt,
    assignedTickets: entry.assignedTickets,
    isLoggedIn: entry.isLoggedIn,
    lastLoginAt: entry.lastLoginAt,
    lastLogoutAt: entry.lastLogoutAt,
    accessCode: entry.accessCode,
    currentPhase: entry.currentPhase,
  };
};

export const getUserEntryByNameAndPhone = async (name: string, phone: string): Promise<UserEntry | null> => {
  const sanitized = sanitizePhone(phone);
  const normalized = name.trim().toLowerCase();
  
  const entries = await prisma.userEntry.findMany({
    where: { phone: sanitized }
  });
  
  const match = entries.find(e => e.name.trim().toLowerCase() === normalized);
  if (!match) return null;
  
  return {
    id: match.id,
    name: match.name,
    phone: match.phone,
    email: match.email,
    createdAt: match.createdAt,
    assignedTickets: match.assignedTickets,
    isLoggedIn: match.isLoggedIn,
    lastLoginAt: match.lastLoginAt,
    lastLogoutAt: match.lastLogoutAt,
    accessCode: match.accessCode,
    currentPhase: match.currentPhase,
  };
};

export const verifyAccessCode = async (code: string): Promise<UserEntry | null> => {
  const trimmed = typeof code === 'string' ? code.trim() : '';
  if (!trimmed) {
    return null;
  }
  
  const entry = await prisma.userEntry.findUnique({
    where: { accessCode: trimmed }
  });
  
  if (!entry) return null;
  
  return {
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: entry.email,
    createdAt: entry.createdAt,
    assignedTickets: entry.assignedTickets,
    isLoggedIn: entry.isLoggedIn,
    lastLoginAt: entry.lastLoginAt,
    lastLogoutAt: entry.lastLogoutAt,
    accessCode: entry.accessCode,
    currentPhase: entry.currentPhase,
  };
};

// Competition Functions
export const getCompetitions = async (): Promise<MockCompetition[]> => {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return competitions.map(c => ({
    id: c.id,
    title: c.title,
    imageUrl: c.imageUrl || '/images/gold-coin.svg',
    maxEntries: c.totalTickets,
    status: c.status === CompetitionStatus.ACTIVE ? 'ACTIVE' : 'CLOSED',
    pricePerTicket: c.pricePerTicket,
    markersPerTicket: c.markersPerTicket,
    invitePasswordHash: c.password,
    invitePasswordHint: 'Competition password',
    createdAt: c.createdAt,
    endsAt: c.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: c.finalJudgeX,
    finalJudgeY: c.finalJudgeY,
  }));
};

export const getCompetitionById = async (id: string): Promise<MockCompetition> => {
  const competition = await prisma.competition.findUnique({
    where: { id }
  });
  
  if (!competition) {
    // Return default competition
    return {
      id,
      title: 'Unnamed Competition',
      imageUrl: 'https://placehold.co/1200x800/png?text=Competition+Image',
      maxEntries: 100,
      status: 'ACTIVE',
      pricePerTicket: 500,
      markersPerTicket: 3,
      invitePasswordHash: await bcrypt.hash('competition123', 10),
      invitePasswordHint: 'Default dev password',
      createdAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      finalJudgeX: null,
      finalJudgeY: null,
    };
  }
  
  return {
    id: competition.id,
    title: competition.title,
    imageUrl: competition.imageUrl || '/images/gold-coin.svg',
    maxEntries: competition.totalTickets,
    status: competition.status === CompetitionStatus.ACTIVE ? 'ACTIVE' : 'CLOSED',
    pricePerTicket: competition.pricePerTicket,
    markersPerTicket: competition.markersPerTicket,
    invitePasswordHash: competition.password,
    invitePasswordHint: 'Competition password',
    createdAt: competition.createdAt,
    endsAt: competition.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: competition.finalJudgeX,
    finalJudgeY: competition.finalJudgeY,
  };
};

export const findCompetitionById = async (id: string): Promise<MockCompetition | null> => {
  const competition = await prisma.competition.findUnique({
    where: { id }
  });
  
  if (!competition) return null;
  
  return {
    id: competition.id,
    title: competition.title,
    imageUrl: competition.imageUrl || '/images/gold-coin.svg',
    maxEntries: competition.totalTickets,
    status: competition.status === CompetitionStatus.ACTIVE ? 'ACTIVE' : 'CLOSED',
    pricePerTicket: competition.pricePerTicket,
    markersPerTicket: competition.markersPerTicket,
    invitePasswordHash: competition.password,
    invitePasswordHint: 'Competition password',
    createdAt: competition.createdAt,
    endsAt: competition.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: competition.finalJudgeX,
    finalJudgeY: competition.finalJudgeY,
  };
};

export const calculateTicketsSold = async (competitionId: string): Promise<number> => {
  const count = await prisma.ticket.count({
    where: {
      competitionId,
      status: { in: [TicketStatus.ASSIGNED, TicketStatus.USED] }
    }
  });
  return count;
};

export const getCompetitionsWithStats = async () => {
  const competitions = await getCompetitions();
  
  const withStats = await Promise.all(
    competitions.map(async (competition) => {
      const ticketsSold = await calculateTicketsSold(competition.id);
      const remainingSlots = Math.max(0, competition.maxEntries - ticketsSold);

      return {
        ...competition,
        ticketsSold,
        remainingSlots,
      };
    })
  );
  
  return withStats;
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
  const invitePasswordHash = await bcrypt.hash(invitePassword, 10);
  
  // Get admin (create a default one if doesn't exist)
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@wishmasters.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10),
        name: 'Admin',
      }
    });
  }

  const competition = await prisma.competition.create({
    data: {
      title,
      description: `Competition: ${title}`,
      imageUrl,
      totalTickets: maxEntries,
      availableTickets: maxEntries,
      markersPerTicket: markersPerTicket ?? 3,
      pricePerTicket: pricePerTicket ?? 500,
      password: invitePasswordHash,
      status: CompetitionStatus.ACTIVE,
      startDate: new Date(),
      endDate: endsAt ? new Date(endsAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    }
  });

  return {
    id: competition.id,
    title: competition.title,
    imageUrl: competition.imageUrl || imageUrl,
    maxEntries: competition.totalTickets,
    status: 'ACTIVE',
    pricePerTicket: competition.pricePerTicket,
    markersPerTicket: competition.markersPerTicket,
    invitePasswordHash: competition.password,
    invitePasswordHint: 'Provided during creation',
    createdAt: competition.createdAt,
    endsAt: competition.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: null,
    finalJudgeY: null,
  };
};

export const closeCompetition = async (id: string): Promise<MockCompetition | null> => {
  const competition = await prisma.competition.update({
    where: { id },
    data: { status: CompetitionStatus.CLOSED }
  });
  
  if (!competition) return null;
  
  return {
    id: competition.id,
    title: competition.title,
    imageUrl: competition.imageUrl || '/images/gold-coin.svg',
    maxEntries: competition.totalTickets,
    status: 'CLOSED',
    pricePerTicket: competition.pricePerTicket,
    markersPerTicket: competition.markersPerTicket,
    invitePasswordHash: competition.password,
    invitePasswordHint: 'Competition password',
    createdAt: competition.createdAt,
    endsAt: competition.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: competition.finalJudgeX,
    finalJudgeY: competition.finalJudgeY,
  };
};

export const setCompetitionFinalResult = async (
  id: string,
  finalJudgeX: number,
  finalJudgeY: number
): Promise<MockCompetition | null> => {
  const competition = await prisma.competition.update({
    where: { id },
    data: { 
      finalJudgeX,
      finalJudgeY,
      isJudged: true,
      judgedAt: new Date(),
    }
  });
  
  if (!competition) return null;
  
  return {
    id: competition.id,
    title: competition.title,
    imageUrl: competition.imageUrl || '/images/gold-coin.svg',
    maxEntries: competition.totalTickets,
    status: competition.status === CompetitionStatus.ACTIVE ? 'ACTIVE' : 'CLOSED',
    pricePerTicket: competition.pricePerTicket,
    markersPerTicket: competition.markersPerTicket,
    invitePasswordHash: competition.password,
    invitePasswordHint: 'Competition password',
    createdAt: competition.createdAt,
    endsAt: competition.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: competition.finalJudgeX,
    finalJudgeY: competition.finalJudgeY,
  };
};

// Participant Functions
export const findParticipantByPhone = async (competitionId: string, phone: string): Promise<MockParticipant | undefined> => {
  const normalizedCompetitionId = normalizeCompetitionId(competitionId);
  const sanitized = sanitizePhone(phone);

  const participant = await prisma.participant.findFirst({
    where: {
      competitionId: normalizedCompetitionId,
      phone: sanitized,
    },
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  if (!participant) return undefined;

  return {
    id: participant.id,
    competitionId: participant.competitionId,
    name: participant.name,
    phone: participant.phone,
    email: participant.email,
    tickets: participant.tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status === TicketStatus.USED ? 'USED' : 'ASSIGNED',
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers.map(marker => ({
        id: marker.id,
        x: marker.x,
        y: marker.y,
      })),
      submittedAt: ticket.assignedAt,
    })),
    lastSubmissionAt: participant.updatedAt,
  };
};

export const findParticipantById = async (competitionId: string, participantId: string): Promise<MockParticipant | undefined> => {
  const normalizedCompetitionId = normalizeCompetitionId(competitionId);
  
  const participant = await prisma.participant.findFirst({
    where: {
      id: participantId,
      competitionId: normalizedCompetitionId,
    },
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  if (!participant) return undefined;

  return {
    id: participant.id,
    competitionId: participant.competitionId,
    name: participant.name,
    phone: participant.phone,
    email: participant.email,
    tickets: participant.tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status === TicketStatus.USED ? 'USED' : 'ASSIGNED',
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers.map(marker => ({
        id: marker.id,
        x: marker.x,
        y: marker.y,
      })),
      submittedAt: ticket.assignedAt,
    })),
    lastSubmissionAt: participant.updatedAt,
  };
};

export const findParticipantsByPhone = async (phone: string): Promise<MockParticipant[]> => {
  const sanitized = sanitizePhone(phone);
  
  const participants = await prisma.participant.findMany({
    where: {
      phone: sanitized,
    },
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  return participants.map(participant => ({
    id: participant.id,
    competitionId: participant.competitionId,
    name: participant.name,
    phone: participant.phone,
    email: participant.email,
    tickets: participant.tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status === TicketStatus.USED ? 'USED' : 'ASSIGNED',
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers.map(marker => ({
        id: marker.id,
        x: marker.x,
        y: marker.y,
      })),
      submittedAt: ticket.assignedAt,
    })),
    lastSubmissionAt: participant.updatedAt,
  }));
};

export const getParticipants = async (): Promise<MockParticipant[]> => {
  const participants = await prisma.participant.findMany({
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  return participants.map(participant => ({
    id: participant.id,
    competitionId: participant.competitionId,
    name: participant.name,
    phone: participant.phone,
    email: participant.email,
    tickets: participant.tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status === TicketStatus.USED ? 'USED' : 'ASSIGNED',
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers.map(marker => ({
        id: marker.id,
        x: marker.x,
        y: marker.y,
      })),
      submittedAt: ticket.assignedAt,
    })),
    lastSubmissionAt: participant.updatedAt,
  }));
};

export const getParticipantsByCompetition = async (competitionId: string): Promise<MockParticipant[]> => {
  const normalizedCompetitionId = normalizeCompetitionId(competitionId);
  
  const participants = await prisma.participant.findMany({
    where: {
      competitionId: normalizedCompetitionId,
    },
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  return participants.map(participant => ({
    id: participant.id,
    competitionId: participant.competitionId,
    name: participant.name,
    phone: participant.phone,
    email: participant.email,
    tickets: participant.tickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status === TicketStatus.USED ? 'USED' : 'ASSIGNED',
      markersAllowed: ticket.markersAllowed,
      markersUsed: ticket.markersUsed,
      markers: ticket.markers.map(marker => ({
        id: marker.id,
        x: marker.x,
        y: marker.y,
      })),
      submittedAt: ticket.assignedAt,
    })),
    lastSubmissionAt: participant.updatedAt,
  }));
};

export const getCompetitionsByIds = async (ids: string[]): Promise<MockCompetition[]> => {
  const competitions = await prisma.competition.findMany({
    where: {
      id: { in: ids }
    }
  });

  return competitions.map(c => ({
    id: c.id,
    title: c.title,
    imageUrl: c.imageUrl || '/images/gold-coin.svg',
    maxEntries: c.totalTickets,
    status: c.status === CompetitionStatus.ACTIVE ? 'ACTIVE' : 'CLOSED',
    pricePerTicket: c.pricePerTicket,
    markersPerTicket: c.markersPerTicket,
    invitePasswordHash: c.password,
    invitePasswordHint: 'Competition password',
    createdAt: c.createdAt,
    endsAt: c.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    finalJudgeX: c.finalJudgeX,
    finalJudgeY: c.finalJudgeY,
  }));
};

export const saveParticipant = async (updatedParticipant: MockParticipant): Promise<void> => {
  const normalizedParticipant: MockParticipant = {
    ...updatedParticipant,
    competitionId: normalizeCompetitionId(updatedParticipant.competitionId),
    phone: sanitizePhone(updatedParticipant.phone ?? ''),
  };

  // Upsert participant
  const participant = await prisma.participant.upsert({
    where: { id: normalizedParticipant.id },
    update: {
      name: normalizedParticipant.name,
      email: normalizedParticipant.email,
      phone: normalizedParticipant.phone,
      ticketsPurchased: normalizedParticipant.tickets.length,
      status: ParticipantStatus.ACTIVE,
    },
    create: {
      id: normalizedParticipant.id,
      competitionId: normalizedParticipant.competitionId,
      name: normalizedParticipant.name,
      email: normalizedParticipant.email || '',
      phone: normalizedParticipant.phone,
      ticketsPurchased: normalizedParticipant.tickets.length,
      totalMarkers: normalizedParticipant.tickets.length * 3,
      markersUsed: 0,
      status: ParticipantStatus.ACTIVE,
      amountPaid: 0,
    }
  });

  // Upsert tickets and markers
  for (const ticket of normalizedParticipant.tickets) {
    const ticketData = await prisma.ticket.upsert({
      where: { id: ticket.id },
      update: {
        markersUsed: ticket.markersUsed,
        status: ticket.status === 'USED' ? TicketStatus.USED : TicketStatus.ASSIGNED,
      },
      create: {
        id: ticket.id,
        competitionId: normalizedParticipant.competitionId,
        participantId: participant.id,
        ticketNumber: ticket.ticketNumber,
        markersAllowed: ticket.markersAllowed,
        markersUsed: ticket.markersUsed,
        status: ticket.status === 'USED' ? TicketStatus.USED : TicketStatus.ASSIGNED,
        assignedAt: ticket.submittedAt || new Date(),
      }
    });

    // Save markers
    for (const marker of ticket.markers) {
      await prisma.marker.upsert({
        where: { id: marker.id },
        update: {
          x: marker.x,
          y: marker.y,
        },
        create: {
          id: marker.id,
          competitionId: normalizedParticipant.competitionId,
          participantId: participant.id,
          ticketId: ticketData.id,
          x: marker.x,
          y: marker.y,
        }
      });
    }
  }
};

export const updateUserTickets = async (
  userId: string,
  ticketCount: number,
  competitionId = 'comp-default'
): Promise<UserEntry | null> => {
  const user = await prisma.userEntry.findUnique({
    where: { id: userId }
  });
  
  if (!user) return null;

  const targetCompetitionId = normalizeCompetitionId(competitionId);
  const userPhone = sanitizePhone(user.phone);
  
  // Get competition to know markersPerTicket - use find instead of get to handle missing competition
  const competition = await findCompetitionById(targetCompetitionId);
  if (!competition) {
    console.warn(`[updateUserTickets] Competition ${targetCompetitionId} not found. Skipping ticket assignment.`);
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      assignedTickets: 0,
      isLoggedIn: user.isLoggedIn,
      lastLoginAt: user.lastLoginAt,
      lastLogoutAt: user.lastLogoutAt,
      accessCode: user.accessCode,
      currentPhase: user.currentPhase,
    };
  }
  const markersPerTicket = competition.markersPerTicket ?? 3;

  // Find participants in this competition with this phone
  const participants = await prisma.participant.findMany({
    where: {
      phone: userPhone,
      competitionId: targetCompetitionId
    },
    include: {
      tickets: {
        include: {
          markers: true
        }
      }
    }
  });

  let participant: any;

  if (participants.length === 0) {
    // Create new participant
    participant = await prisma.participant.create({
      data: {
        id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        competitionId: targetCompetitionId,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        ticketsPurchased: 0,
        totalMarkers: 0,
        markersUsed: 0,
        status: ParticipantStatus.ACTIVE,
        amountPaid: 0,
      }
    });
  } else {
    // Use first participant (we can merge logic later if needed)
    participant = participants[0];
  }

  // Count existing tickets
  const existingTickets = await prisma.ticket.count({
    where: {
      participantId: participant.id,
      competitionId: targetCompetitionId
    }
  });

  const ticketsToAdd = ticketCount - existingTickets;

  // Add new tickets if needed
  if (ticketsToAdd > 0) {
    for (let i = 0; i < ticketsToAdd; i++) {
      await prisma.ticket.create({
        data: {
          id: `ticket-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          competitionId: targetCompetitionId,
          participantId: participant.id,
          ticketNumber: existingTickets + i + 1,
          markersAllowed: markersPerTicket,
          markersUsed: 0,
          status: TicketStatus.ASSIGNED,
          assignedAt: new Date(),
        }
      });
    }

    // Update participant ticket count
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        ticketsPurchased: ticketCount,
        totalMarkers: ticketCount * markersPerTicket
      }
    });
  }

  // Update user entry assigned tickets
  await prisma.userEntry.update({
    where: { id: userId },
    data: { assignedTickets: ticketCount }
  });

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt,
    assignedTickets: ticketCount,
    isLoggedIn: user.isLoggedIn,
    lastLoginAt: user.lastLoginAt,
    lastLogoutAt: user.lastLogoutAt,
    accessCode: user.accessCode,
    currentPhase: user.currentPhase,
  };
};

// Checkout Summary Functions
export const saveCheckoutSummary = async (
  competitionId: string,
  participantId: string,
  summary: CheckoutSummary
): Promise<void> => {
  await prisma.checkoutSummary.upsert({
    where: {
      competitionId_participantId: {
        competitionId,
        participantId
      }
    },
    update: {
      userId: summary.userId,
      summaryData: summary as any,
      completed: summary.completed || false,
      completedAt: summary.completedAt ? new Date(summary.completedAt) : null,
    },
    create: {
      competitionId,
      participantId,
      userId: summary.userId,
      summaryData: summary as any,
      completed: summary.completed || false,
      completedAt: summary.completedAt ? new Date(summary.completedAt) : null,
    }
  });
};

export const getCheckoutSummary = async (
  competitionId: string,
  participantId: string
): Promise<CheckoutSummary | null> => {
  const summary = await prisma.checkoutSummary.findUnique({
    where: {
      competitionId_participantId: {
        competitionId,
        participantId
      }
    }
  });

  if (!summary) return null;

  return summary.summaryData as any as CheckoutSummary;
};

export const getCheckoutSummaryByUserId = async (
  competitionId: string,
  userId: string
): Promise<CheckoutSummary | null> => {
  const summary = await prisma.checkoutSummary.findFirst({
    where: {
      competitionId,
      userId,
    }
  });

  if (!summary) return null;

  return summary.summaryData as any as CheckoutSummary;
};

export const getCheckoutSummariesByCompetition = async (competitionId: string): Promise<CheckoutSummary[]> => {
  const summaries = await prisma.checkoutSummary.findMany({
    where: {
      competitionId,
    }
  });

  return summaries.map(s => s.summaryData as any as CheckoutSummary);
};

export const hasParticipantCompletedEntry = async (
  competitionId: string,
  participantId: string
): Promise<boolean> => {
  const summary = await getCheckoutSummary(competitionId, participantId);
  if (!summary) {
    return false;
  }

  if (summary.completed === true) {
    return true;
  }

  return Boolean(summary.completedAt);
};

export const markParticipantCompletedEntry = async (
  competitionId: string,
  participantId: string | null | undefined
): Promise<void> => {
  if (!competitionId || !participantId) {
    return;
  }

  // Update checkout summary to mark as completed
  await prisma.checkoutSummary.upsert({
    where: {
      competitionId_participantId: {
        competitionId,
        participantId
      }
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
    create: {
      competitionId,
      participantId,
      userId: null,
      summaryData: {} as any,
      completed: true,
      completedAt: new Date(),
    }
  });
};

export const clearParticipantCompletion = async (
  competitionId: string,
  participantId: string | null | undefined
): Promise<void> => {
  if (!competitionId || !participantId) {
    return;
  }

  // Update checkout summary to mark as not completed
  await prisma.checkoutSummary.updateMany({
    where: {
      competitionId,
      participantId
    },
    data: {
      completed: false,
      completedAt: null,
    }
  });
};

// Competition Results Functions
export const saveCompetitionResult = async (result: MockCompetitionResult): Promise<void> => {
  console.log(`[db.service] Saving competition result for ID: "${result.competitionId}"`);
  
  await prisma.competitionResult.upsert({
    where: { competitionId: result.competitionId },
    update: {
      finalJudgeX: result.finalJudgeX,
      finalJudgeY: result.finalJudgeY,
      winners: result.winners as any,
      computedAt: result.computedAt,
    },
    create: {
      competitionId: result.competitionId,
      finalJudgeX: result.finalJudgeX,
      finalJudgeY: result.finalJudgeY,
      winners: result.winners as any,
      computedAt: result.computedAt,
    }
  });
};

export const getCompetitionResult = async (competitionId: string): Promise<MockCompetitionResult | null> => {
  console.log(`[db.service] Fetching competition result for ID: "${competitionId}"`);
  
  const result = await prisma.competitionResult.findUnique({
    where: { competitionId }
  });

  if (!result) {
    console.log(`[db.service] Result not found for ${competitionId}`);
    return null;
  }

  console.log(`[db.service] Result found: ${(result.winners as any).length} winners`);
  return {
    competitionId: result.competitionId,
    finalJudgeX: result.finalJudgeX,
    finalJudgeY: result.finalJudgeY,
    winners: result.winners as any as MockCompetitionWinner[],
    computedAt: result.computedAt,
  };
};

export const upsertCompetition = async (competition: MockCompetition): Promise<void> => {
  // Get admin (create a default one if doesn't exist)
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@wishmasters.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10),
        name: 'Admin',
      }
    });
  }

  await prisma.competition.upsert({
    where: { id: competition.id },
    update: {
      title: competition.title,
      imageUrl: competition.imageUrl,
      totalTickets: competition.maxEntries,
      pricePerTicket: competition.pricePerTicket,
      markersPerTicket: competition.markersPerTicket,
      password: competition.invitePasswordHash,
      status: competition.status === 'ACTIVE' ? CompetitionStatus.ACTIVE : CompetitionStatus.CLOSED,
      endDate: competition.endsAt,
      finalJudgeX: competition.finalJudgeX,
      finalJudgeY: competition.finalJudgeY,
    },
    create: {
      id: competition.id,
      title: competition.title,
      description: `Competition: ${competition.title}`,
      imageUrl: competition.imageUrl,
      totalTickets: competition.maxEntries,
      availableTickets: competition.maxEntries,
      pricePerTicket: competition.pricePerTicket,
      markersPerTicket: competition.markersPerTicket,
      password: competition.invitePasswordHash,
      status: competition.status === 'ACTIVE' ? CompetitionStatus.ACTIVE : CompetitionStatus.CLOSED,
      startDate: competition.createdAt,
      endDate: competition.endsAt,
      createdById: admin.id,
    }
  });
};

export const deleteCheckoutSummaryByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const result = await prisma.checkoutSummary.deleteMany({
      where: {
        userId: userId,
      }
    });
    return result.count;
  } catch (error) {
    console.error(`Error deleting checkout summary for user ${userId}:`, error);
    return 0;
  }
};
