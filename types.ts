export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status?: 'Active' | 'Inactive';
  lastLogin?: string;
}

export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Pending = 'Pending'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  type: string;
  assignedTo?: string;
  createdBy?: string;
  createdAt?: string;
  isPublic?: boolean;
}

export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

// --- NEW: Task Interface (Fixed Missing Export) ---
export interface Task {
  id?: string;
  TaskID: string;
  Task_Name: string;
  Task_Status: string;
  TicketID_Ref: string;
  Assigned_To?: string;
  Due_Date?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Pending';
  rating: number;
  services: string[];
}

export interface VendorBid {
  id: string;
  vendorName: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface VendorReview {
  id: string;
  vendorId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  content: string;
  version: string;
  lastUpdated: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipment: string;
  task: string;
  frequency: string;
  nextDue: string;
  status: string;
  assignedTo: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minLevel: number;
  location: string;
  lastRestocked: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minLevel: number;
  unit: string;
  location: string;
  lastUpdated?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  locationId: string;
  status: string;
  serialNumber?: string;
  purchaseDate?: string;
  notes?: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
}

export interface Building {
  id: string;
  campusId: string;
  name: string;
  type?: string; 
}

export interface Location {
  id: string;
  buildingId: string;
  name: string;
  type: string;
}

export interface SiteConfig {
  siteName: string;
  supportEmail: string;
  primaryColor: string;
  logoUrl?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  author: string;
}

export interface AccountRequest {
  id: string;
  applicantName: string;
  department: string;
  role: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
  type: string;
  details?: string;
}