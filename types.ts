
// --- Database Schema Types ---

export interface User {
  UserID: string;
  Email: string;
  Name: string;
  User_Type: string; // e.g., "Approver, Chair"
  Department: string; // "IT" or "Facilities"
}

export interface SiteConfig {
  appName: string;
  unauthorizedMessage: string;
  supportContact: string;
  announcementBanner: string;
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

export interface TicketComment {
  CommentID: string;
  Author_Email: string;
  Timestamp: string;
  Text: string;
  IsStatusChange?: boolean; // If true, this is a system log
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
  BuildingID_Ref?: string;
  LocationID_Ref: string;
  Related_AssetID_Ref?: string; 
  Title: string;
  Description: string;
  Category: 'IT' | 'Facilities';
  Status: 'New' | 'Pending Approval' | 'Assigned' | 'Completed' | 'Resolved';
  Priority?: Priority;
  Assigned_Staff?: string; // Email
  AI_Suggested_Plan?: string;
  AI_Questions?: string;
  
  // New Fields
  Comments: TicketComment[];
  IsPublic: boolean;
}

// --- Helper Types for UI ---
export interface ViewState {
  currentView: 'form' | 'dashboard' | 'admin' | 'assets';
}

export interface UserConfig {
  email: string;
  name: string;
  role: string;
  department?: string;
  campus?: string;
}
