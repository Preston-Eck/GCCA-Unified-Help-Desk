
import { Ticket, TicketStatus, Department, UserConfig, Priority } from "../types";

// --- Mock Database (Simulating the Sheet) ---
// Note: This file seems redundant with dataService.ts but fixing types as requested.
let tickets: Ticket[] = [
  {
    TicketID: 'T-1001',
    Submitter_Email: 'teacher@gcca.edu',
    Category: Department.IT,
    CampusID_Ref: 'CAMP-MAD',
    LocationID_Ref: 'Room 302',
    Title: 'Projector Issue',
    Description: 'Projector is flickering blue.',
    Status: TicketStatus.NEW,
    Priority: Priority.MEDIUM,
    Date_Submitted: new Date(Date.now() - 86400000).toISOString()
  },
  {
    TicketID: 'T-1002',
    Submitter_Email: 'coach@gcca.edu',
    Category: Department.FACILITIES,
    CampusID_Ref: 'CAMP-MIL',
    LocationID_Ref: 'Gymnasium',
    Title: 'Bleacher Stuck',
    Description: 'Bleacher motor stuck.',
    Status: TicketStatus.PENDING_APPROVAL,
    Priority: Priority.HIGH,
    Date_Submitted: new Date(Date.now() - 172800000).toISOString()
  },
  {
    TicketID: 'T-1003',
    Submitter_Email: 'admin@gcca.edu',
    Category: Department.FACILITIES,
    CampusID_Ref: 'CAMP-MAD',
    LocationID_Ref: 'Main Office',
    Title: 'Wall Paint',
    Description: 'Wall paint chipping.',
    Status: TicketStatus.PENDING_APPROVAL,
    Priority: Priority.LOW,
    Date_Submitted: new Date(Date.now() - 40000000).toISOString()
  }
];

// --- Mock Config Tab ---
export const MOCK_USERS: UserConfig[] = [
  { email: 'staff@gcca.edu', name: 'Standard Staff', role: 'Staff' },
  { email: 'it.chair@gcca.edu', name: 'IT Chair (Jaron)', role: 'Chair', department: Department.IT },
  { email: 'fac.chair@gcca.edu', name: 'Facilities Chair', role: 'Chair', department: Department.FACILITIES },
  { email: 'principal.madison@gcca.edu', name: 'Principal Madison', role: 'Approver', campus: 'CAMP-MAD' },
  { email: 'principal.mill@gcca.edu', name: 'Principal Mill', role: 'Approver', campus: 'CAMP-MIL' },
  { email: 'tech.it@gcca.edu', name: 'IT Technician', role: 'Tech', department: Department.IT },
];

// --- Logic Implementation ---

export const submitTicket = (ticketData: Omit<Ticket, 'TicketID' | 'Date_Submitted' | 'Status'>): Ticket => {
  let initialStatus = TicketStatus.NEW;

  // WORKFLOW LOGIC:
  if (ticketData.Category === Department.FACILITIES) {
    if (ticketData.CampusID_Ref === 'CAMP-MAD' || ticketData.CampusID_Ref === 'CAMP-MIL') {
      initialStatus = TicketStatus.PENDING_APPROVAL;
    }
  }

  const newTicket: Ticket = {
    ...ticketData,
    TicketID: `T-${Math.floor(1000 + Math.random() * 9000)}`,
    Date_Submitted: new Date().toISOString(),
    Status: initialStatus
  };

  tickets = [newTicket, ...tickets];
  return newTicket;
};

export const getTicketsForUser = (user: UserConfig): Ticket[] => {
  // DASHBOARD LOGIC (View Permissions):
  
  // 1. Chairs see ALL tickets for their department
  if (user.role === 'Chair') {
    return tickets.filter(t => t.Category === user.department);
  }

  // 2. Approvers (Principals) only see Pending Approval tickets for their specific campus
  if (user.role === 'Approver') {
    return tickets.filter(t => 
      t.Status === TicketStatus.PENDING_APPROVAL && 
      t.Category === Department.FACILITIES && 
      t.CampusID_Ref === user.campus
    );
  }

  // 3. Techs only see tickets assigned to them OR unassigned New tickets in their department
  if (user.role === 'Tech') {
    return tickets.filter(t => 
      (t.Assigned_Staff === user.email) || 
      (t.Category === user.department && t.Status === TicketStatus.NEW && !t.Assigned_Staff)
    );
  }

  // 4. Regular staff see only their own tickets
  return tickets.filter(t => t.Submitter_Email === user.email);
};

export const approveTicket = (ticketId: string) => {
  tickets = tickets.map(t => t.TicketID === ticketId ? { ...t, Status: TicketStatus.NEW } : t);
};

export const resolveTicket = (ticketId: string) => {
  tickets = tickets.map(t => t.TicketID === ticketId ? { ...t, Status: TicketStatus.RESOLVED } : t);
};
