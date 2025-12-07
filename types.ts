// --- 1. CORE CONFIGURATION ---
export interface SiteConfig {
  appName: string;
  unauthorizedMessage: string;
  supportContact: string;
  announcementBanner: string;
  ticketCategories: string[]; 
  priorities: string[];       
}

// --- 2. USERS & PROFILES ---
export interface User {
  UserID: string;
  Email: string;
  Name: string;
  User_Type: string; // Comma-separated (e.g. "Admin, Tech")
  Department: string; // Comma-separated
  // Extended Profile Fields (from CSV)
  Primary_Building?: string;
  Primary_Room?: string;
  Grades_Taught?: string;
  Subjects_Taught?: string;
  Account_Status: 'Active' | 'Suspended' | 'Pending';
  Employment_Status?: 'Employee' | 'Volunteer' | 'Contractor';
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

// --- 3. INFRASTRUCTURE ---
export interface Campus {
  CampusID: string;
  Campus_Name: string;
  Address?: string;
  Phone_Number?: string;
  Campus_Map?: string;
}

export interface Building {
  BuildingID: string;
  CampusID_Ref: string;
  Building_Name: string;
  Building_Floor_Plan?: string;
  Building_Cover_Photo?: string;
}

export interface Location {
  LocationID: string;
  BuildingID_Ref: string;
  Parent_LocationID_Ref?: string;
  Location_Name: string;
  Category?: string;
  Length?: number;
  Width?: number;
  Height?: number;
  Square_Footage?: number;
  Paint_Color?: string;
  Paint_Type?: string;
  Floor_Type?: string;
}

// --- 4. ASSETS & MAINTENANCE ---
export interface Asset {
  AssetID: string;
  LocationID_Ref: string;
  Asset_Name: string;
  Category?: string;
  Serial_Number?: string;
  Warranty_Expires?: string;
  Last_Known_Meter_Reading?: number;
  Last_Meter_Reading_Date?: string;
  Parent_AssetID_Ref?: string; 
  Model_Number?: string;       
  InstallDate?: string;        
}

export interface MeterReading {
  ReadingID: string;
  AssetID_Ref: string;
  Timestamp: string;
  Current_Reading: number;
  Logged_By_Email: string;
}

// --- 5. WORKFLOW (Tickets & Tasks) ---
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
  RESOLVED = 'Resolved',
  CLOSED = 'Closed'
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
  Category: string;
  Status: string; 
  Priority?: string;
  Assigned_Staff?: string;
  Assigned_VendorID_Ref?: string;
  Is_Public: boolean;
  // Advanced Triage
  Submitter_Priority?: string;
  Is_Urgent?: boolean;
  Is_Important?: boolean;
  Priority_Quadrant?: number;
  AI_Suggested_Plan?: string;
  AI_Questions?: string;
  User_Answers?: string;
  Date_Completed?: string;
  Exclude_from_Report?: boolean;
  Scheduled_Start_Date?: string;
  Comments?: TicketComment[];
}

export interface TicketComment {
  CommentID: string;
  TicketID_Ref: string;
  Author_Email: string;
  Timestamp: string;
  Comment_Text: string;
  Visibility: 'Public' | 'Internal';
}

export interface TicketAttachment {
  AttachmentID: string;
  TicketID_Ref: string;
  File_Name: string;
  Drive_URL: string;
  Mime_Type: string;
  Attachment_Type?: string;
}

export interface Task {
  TaskID: string;
  TicketID_Ref: string;
  Task_Name: string;
  Task_Status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
  Assigned_Staff?: string;
  Assigned_VendorID_Ref?: string;
  Labor_Hours?: number;
  Material_Costs?: number;
  Vendor_Invoice_Total?: number;
}

// --- 6. INVENTORY & MATERIALS ---
export interface Material {
  MaterialID: string;
  Material_Name: string;
  Category: string;
  Location: string;
  Purchase_Unit_Name: string; 
  Purchase_Unit_Cost: number;
  Items_per_Unit: number;
  Quantity_on_Hand: number;
  Reorder_Point: number;
}

export interface MaterialTransaction {
  UsedID: string;
  TicketID_Ref?: string;
  TaskID_Ref?: string;
  AssetID_Ref?: string;
  LocationID_Ref?: string;
  MaterialID_Ref: string;
  Quantity_Used: number;
  Timestamp: string;
  Logged_By_Ref: string;
}

export interface PurchaseLog {
  PurchaseID: string;
  Purchase_Date: string;
  MaterialID_Ref: string;
  VendorID_Ref: string;
  Quantity_Purchased: number;
  Total_Cost_for_Item: number;
  Receipt_Type?: string;
  Receipt_Image?: string;
  Receipt_File?: string;
}

// --- 7. VENDORS & PROCUREMENT ---
export interface Vendor {
  VendorID: string;
  Vendor_Name: string; 
  Specialty?: string;
  Contact_Person?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Website?: string;
  Status?: string;
  ServiceType?: string;
  DateJoined?: string;
}

export interface VendorBid {
  BidID: string;
  TicketID_Ref: string;
  VendorID_Ref: string;
  VendorName?: string; 
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

// --- 8. OPERATIONS ---
export interface MaintenanceSchedule {
  PM_ID: string;
  AssetID_Ref: string;
  Task_Name: string;
  Frequency: string;
  Next_Due_Date: string;
  Meter_Frequency_Trigger?: number;
  Meter_Type?: string;
  Meter_Trigger_At?: number;
}

export interface SOP {
  SOP_ID: string;
  SOP_Title: string;
  Category?: string;
  Concise_Procedure_Text: string;
  Google_Doc_Link: string;
  AI_Prompt?: string;
}

export interface AssetSOPLink {
  Link_ID: string;
  AssetID_Ref: string;
  SOP_ID_Ref: string;
}

export interface Document {
  DocumentID: string;
  Document_Name: string;
  Document_Type: string;
  Category: string;
  Document_File?: string;
  Upload_Date: string;
}

// --- 9. PERMISSIONS (GRANULAR) ---
export type Permission = 
  | 'VIEW_DASHBOARD' | 'VIEW_ADMIN_PANEL'
  | 'TICKET_CREATE' | 'TICKET_READ_OWN' | 'TICKET_READ_DEPT' | 'TICKET_READ_ALL' | 'TICKET_UPDATE_OWN' | 'TICKET_UPDATE_ALL' | 'TICKET_DELETE' | 'TICKET_ASSIGN' | 'TICKET_APPROVE' | 'TICKET_MERGE'
  | 'TASK_CREATE' | 'TASK_UPDATE' | 'TASK_DELETE'
  | 'ASSET_READ' | 'ASSET_CREATE' | 'ASSET_UPDATE' | 'ASSET_DELETE'
  | 'INVENTORY_READ' | 'INVENTORY_ADJUST' | 'INVENTORY_PURCHASE'
  | 'VENDOR_READ' | 'VENDOR_MANAGE' | 'VENDOR_APPROVE'
  | 'USER_READ' | 'USER_MANAGE' | 'ROLE_MANAGE'
  | 'SOP_READ' | 'SOP_MANAGE' | 'DOC_MANAGE'
  | 'VIEW_MY_TICKETS' | 'VIEW_DEPT_TICKETS' | 'VIEW_CAMPUS_TICKETS' | 'VIEW_ALL_BIDS' 
  | 'MANAGE_ASSETS' | 'MANAGE_USERS' | 'MANAGE_VENDORS' | 'MANAGE_ROLES' | 'MANAGE_SETTINGS' 
  | 'MANAGE_SOPS' | 'MANAGE_SCHEDULES' | 'ASSIGN_TICKETS' | 'APPROVE_TICKETS' | 'CLAIM_TICKETS' | 'MERGE_TICKETS';

export interface RoleDefinition {
  RoleName: string;
  Description: string;
  Permissions: Permission[];
}

// --- 10. MAPPINGS ---
export interface AppField {
  id: string;
  category: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'email' | 'url';
}

export interface FieldMapping {
  MappingID: string;
  SheetName: string;
  SheetHeader: string;
  AppFieldID: string;
  Description?: string;
}