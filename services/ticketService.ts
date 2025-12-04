import { Ticket, TicketStatus, Department, Campus, UserConfig, Priority } from "../types";

// --- Mock Database (Simulating the Sheet) ---
let tickets: Ticket[] = [
  {
    id: 'T-1001',
    requestorEmail: 'teacher@gcca.edu',
    department: Department.IT,
    campus: Campus.MADISON_AVE,
    locationDetails: 'Room 302',
    description: 'Projector is flickering blue.',
    status: TicketStatus.NEW,
    priority: Priority.MEDIUM,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'T-1002',
    requestorEmail: 'coach@gcca.edu',
    department: Department.FACILITIES,
    campus: Campus.MILL_ST,
    locationDetails: 'Gymnasium',
    description: 'Bleacher motor stuck.',
    status: TicketStatus.PENDING_APPROVAL, // Logic: Mill St Facilities needs approval
    priority: Priority.HIGH,
    createdAt: Date.now() - 172800000
  },
  {
    id: 'T-1003',
    requestorEmail: 'admin@gcca.edu',
    department: Department.FACILITIES,
    campus: Campus.MADISON_AVE,
    locationDetails: 'Main Office',
    description: 'Wall paint chipping.',
    status: TicketStatus.PENDING_APPROVAL, // Logic: Madison Ave Facilities needs approval
    priority: Priority.LOW,
    createdAt: Date.now() - 40000000
  }
];

// --- Mock Config Tab ---
export const MOCK_USERS: UserConfig[] = [
  { email: 'staff@gcca.edu', name: 'Standard Staff', role: 'Staff' },
  { email: 'it.chair@gcca.edu', name: 'IT Chair (Jaron)', role: 'Chair', department: Department.IT },
  { email: 'fac.chair@gcca.edu', name: 'Facilities Chair', role: 'Chair', department: Department.FACILITIES },
  { email: 'principal.madison@gcca.edu', name: 'Principal Madison', role: 'Approver', campus: Campus.MADISON_AVE },
  { email: 'principal.mill@gcca.edu', name: 'Principal Mill', role: 'Approver', campus: Campus.MILL_ST },
  { email: 'tech.it@gcca.edu', name: 'IT Technician', role: 'Tech', department: Department.IT },
];

// --- Logic Implementation (The "Code.gs" equivalent) ---

export const submitTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'status'>): Ticket => {
  let initialStatus = TicketStatus.NEW;

  // WORKFLOW LOGIC:
  // 1. If IT -> New
  // 2. If Facilities AND (Madison OR Mill) -> Pending Approval
  if (ticketData.department === Department.FACILITIES) {
    if (ticketData.campus === Campus.MADISON_AVE || ticketData.campus === Campus.MILL_ST) {
      initialStatus = TicketStatus.PENDING_APPROVAL;
    }
  }

  const newTicket: Ticket = {
    ...ticketData,
    id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: Date.now(),
    status: initialStatus
  };

  tickets = [newTicket, ...tickets];
  return newTicket;
};

export const getTicketsForUser = (user: UserConfig): Ticket[] => {
  // DASHBOARD LOGIC (View Permissions):
  
  // 1. Chairs see ALL tickets for their department
  if (user.role === 'Chair') {
    return tickets.filter(t => t.department === user.department);
  }

  // 2. Approvers (Principals) only see Pending Approval tickets for their specific campus
  if (user.role === 'Approver') {
    return tickets.filter(t => 
      t.status === TicketStatus.PENDING_APPROVAL && 
      t.department === Department.FACILITIES && 
      t.campus === user.campus
    );
  }

  // 3. Techs only see tickets assigned to them OR unassigned New tickets in their department
  if (user.role === 'Tech') {
    return tickets.filter(t => 
      (t.assignedTo === user.email) || 
      (t.department === user.department && t.status === TicketStatus.NEW && !t.assignedTo)
    );
  }

  // 4. Regular staff see only their own tickets
  return tickets.filter(t => t.requestorEmail === user.email);
};

export const approveTicket = (ticketId: string) => {
  tickets = tickets.map(t => t.id === ticketId ? { ...t, status: TicketStatus.NEW } : t);
};

export const resolveTicket = (ticketId: string) => {
  tickets = tickets.map(t => t.id === ticketId ? { ...t, status: TicketStatus.RESOLVED } : t);
};
