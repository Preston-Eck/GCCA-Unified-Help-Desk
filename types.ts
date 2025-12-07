// --- Database Schema Types ---

export interface User {
  UserID: string;
  Email: string;
  Name: string;
  User_Type: string; 
  Department: string; 
}

export interface AccountRequest {
  RequestID: string;
  Name: string;
  Email: string;
  RequestedRole: string; 
  Department?: string;
  Reason: string;
  DateSubmitted: string;
  Status: 'Pending' | 'Approved' | 'Rejected';
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
  Address?: string;       // <--- NEW
  PhoneNumber?: string;   // <--- NEW
  MapURL?: string;        // <--- NEW (for PDF/Image link)
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
  Model_Number?: string;
  Serial_Number?: string;
  InstallDate?: string;
  Notes?: string;
}

export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface MaintenanceSchedule {
  ScheduleID: string;
  AssetID_Ref: string;
  TaskName: string;
  Frequency: Frequency;
  LastPerformed?: string;
  NextDue: string;
  SOP_ID_Ref?: string;
}

export interface SOP {
  SOP_ID: string;
  SOP_Title: string;
  Concise_Procedure_Text: string;
  Google_Doc_Link: string;
}

export interface AssetSOPLink {
  Link_ID: string;
  AssetID_Ref: string;
  SOP_ID_Ref: string;
}

export interface TicketAttachment {
  AttachmentID: string;
  TicketID_Ref: string;
  BidID_Ref?: string;
  File_Name: string;
  Drive_URL: string;
  Mime_Type: string;
}

export interface TicketComment {
  CommentID: string;
  Author_Email: string;
  Timestamp: string;
  Text: string;
  IsStatusChange?: boolean;
}

// --- Vendor Types ---
export interface Vendor {
  VendorID: string;
  CompanyName: string;
  ContactName: string;
  Email: string;
  Phone: string;
  Address?: string; // <--- NEW
  Website?: string; // <--- NEW
  ServiceType: 'IT' | 'Facilities' | 'General';
  Status: 'Pending' | 'Approved' | 'Rejected' | 'Archived';
  DateJoined: string;
}

export interface VendorBid {
  BidID: string;
  TicketID_Ref: string;
  VendorID_Ref: string;
  VendorName: string; 
  Amount: number;
  Notes: string;
  DateSubmitted: string;
  Status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface VendorReview {
  ReviewID: string;
  VendorID_Ref: string;
  TicketID_Ref: string;
  Author_Email: string;
  Rating: number; 
  Comment: string;
  Timestamp: string;
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
  OPEN_FOR_BID = 'Open for Bid',
  COMPLETED = 'Completed',
  RESOLVED = 'Resolved'
}

export enum Department {
  IT = 'IT',
  FACILITIES = 'Facilities'
}

export interface Ticket {
  TicketID: string;
  Date_Submitted: string; 
  Submitter_Email: string;
  CampusID_Ref: string;
  BuildingID_Ref?: string;
  LocationID_Ref: string;
  Related_AssetID_Ref?: string; 
  Title: string;
  Description: string;
  Category: 'IT' | 'Facilities';
  Status: 'New' | 'Pending Approval' | 'Assigned' | 'Open for Bid' | 'Completed' | 'Resolved';
  Priority?: Priority;
  Assigned_Staff?: string; 
  Assigned_VendorID_Ref?: string; 
  AI_Suggested_Plan?: string;
  AI_Questions?: string;
  Comments: TicketComment[];
  IsPublic: boolean;
  ParentTicketID?: string;
  TicketType?: 'Incident' | 'Task' | 'Maintenance';
}

// --- Helper Types for UI ---
export interface ViewState {
  currentView: 'form' | 'dashboard' | 'admin' | 'assets' | 'users' | 'vendors' | 'portal' | 'request-account' | 'roles' | 'operations';
}

export interface UserConfig {
  email: string;
  name: string;
  role: string;
  department?: string;
  campus?: string;
}

export interface Recommendation {
  Type: 'Asset' | 'Location';
  Name: string;
  ParentID: string;
  Status: 'Pending';
}

// --- RBAC & Permissions ---

export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'SUBMIT_TICKETS'
  | 'VIEW_MY_TICKETS'
  | 'VIEW_DEPT_TICKETS'
  | 'VIEW_CAMPUS_TICKETS'
  | 'VIEW_ALL_BIDS'
  | 'MANAGE_ASSETS'
  | 'MANAGE_USERS'
  | 'MANAGE_VENDORS'
  | 'MANAGE_ROLES'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_SOPS'
  | 'MANAGE_SCHEDULES'
  | 'ASSIGN_TICKETS'
  | 'APPROVE_TICKETS'
  | 'CLAIM_TICKETS'
  | 'MERGE_TICKETS';

export interface RoleDefinition {
  RoleName: string;
  Description: string;
  Permissions: Permission[];
}

// --- MAPPING TYPES ---
export interface SheetColumn {
  sheetName: string;
  header: string;
}

export interface AppField {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
}

export interface FieldMapping {
  MappingID: string;
  SheetName: string;
  SheetHeader: string;
  AppFieldID: string;
  Description?: string;
}