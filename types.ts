
// --- Database Schema Types ---

export interface User {
  UserID: string;
  Email: string;
  Name: string;
  User_Type: string; // e.g., "Approver, Chair"
  Department: string; // "IT" or "Facilities"
}

export interface Campus {
  CampusID: string;
  Campus_Name: string;
}

export interface Building {
  BuildingID: string;
  CampusID_Ref: string;
  Building_Name: string;
}

export interface Location {
  LocationID: string;
  BuildingID_Ref: string;
  Location_Name: string;
}

export interface Asset {
  AssetID: string;
  LocationID_Ref: string;
  Asset_Name: string;
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum TicketStatus {
  NEW = 'New',
  PENDING_APPROVAL = 'Pending Approval',
  ASSIGNED = 'Assigned',
  COMPLETED = 'Completed',
  RESOLVED = 'Resolved'
}

export enum Department {
  IT = 'IT',
  FACILITIES = 'Facilities'
}

export interface Ticket {
  TicketID: string;
  Date_Submitted: string; // ISO String
  Submitter_Email: string;
  CampusID_Ref: string;
  BuildingID_Ref?: string; // Added to support Dashboard view
  LocationID_Ref: string;
  Related_AssetID_Ref?: string; // Optional
  Title: string;
  Description: string;
  Category: 'IT' | 'Facilities';
  Status: 'New' | 'Pending Approval' | 'Assigned' | 'Completed' | 'Resolved';
  Priority?: Priority;
  Assigned_Staff?: string; // Email
  AI_Suggested_Plan?: string;
  AI_Questions?: string;
}

// --- Helper Types for UI ---
export interface ViewState {
  currentView: 'form' | 'dashboard';
}

export interface UserConfig {
  email: string;
  name: string;
  role: string;
  department?: string;
  campus?: string;
}
