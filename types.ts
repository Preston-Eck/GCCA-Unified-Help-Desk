export enum Department {
  IT = 'IT',
  FACILITIES = 'Facilities'
}

export enum Campus {
  MADISON_AVE = 'Madison Ave',
  MILL_ST = 'Mill St',
  OTHER = 'Other'
}

export enum TicketStatus {
  NEW = 'New',
  PENDING_APPROVAL = 'Pending Approval',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface Ticket {
  id: string;
  requestorEmail: string;
  department: Department;
  campus: Campus;
  locationDetails: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: number;
  assignedTo?: string; // Email of tech
}

// Configuration Types
export interface UserConfig {
  email: string;
  name: string;
  role: 'Admin' | 'Chair' | 'Approver' | 'Tech' | 'Staff';
  department?: Department; // For Chairs/Techs
  campus?: Campus; // For Approvers (Principals)
}
