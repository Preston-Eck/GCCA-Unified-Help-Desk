// types.ts

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
  User_Type: string; 
  Department: string;
  // Expanded Profile from CSV
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

export interface LocationSubmission {
  SubmissionID: string;
  TicketID_Ref: string;
  Submitter_Email: string;
  CampusID_Ref: string;
  BuildingID_Ref: string;
  New_Location_Name: string;
  Status: string;
  Admin_Review_Notes?: string;
  Admin_Corrected_BuildingID?: string;
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

export interface AssetSubmission {
  SubmissionID: string;
  TicketID_Ref: string;
  Submitter_Email: string;
  New_Asset_Name: string;
  New_Category?: string;
  Status: string;
  Admin_Review_Notes?: string;
}

export interface MeterReading {
  ReadingID: string;
  AssetID_Ref: string;
  Timestamp: string;
  Current_Reading: number;
  Logged_By_Email: string;
}

// --- 5. WORKFLOW (Tickets & Tasks) ---
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
  Location_Listed?: boolean;
  Asset_Listed?: boolean;
  AI_Questions?: string;
  User_Answers?: string;
  Date_Completed?: string;
  Exclude_from_Report?: boolean;
  Scheduled_Start_Date?: string;
}

export interface TicketFollower {
  FollowID: string;
  TicketID_Ref: string;
  Follower_Email: string;
  Follower_Type: 'Watcher' | 'Stakeholder' | 'CC';
}

export interface Task {
  TaskID: string;
  TicketID_Ref: string;
  Task_Name: string;
  Task_Status: 'Pending' | 'In Progress' | 'Done' | 'Blocked';
  Assigned_Staff?: string;
  Assigned_VendorID_Ref?: string;
  Delegation_Accepted?: boolean;
  Labor_Hours?: number;
  Material_Costs?: number;
  Vendor_Invoice_Total?: number;
}

export interface TaskComment {
  Task_Comment_ID: string;
  TaskID_Ref: string;
  Author_User: string;
  Timestamp: string;
  Comment_Text: string;
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
  Vendor_Name: string; // "Vendor_Name" in CSV vs "CompanyName" in old code
  Specialty?: string;
  Contact_Person?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Status?: string; // Derived from reviews/bids if not in CSV?
}

export interface VendorRecommendation {
  RecommendationID: string;
  Submitter_Email: string;
  Submission_Date: string;
  Vendor_Name: string;
  Specialty?: string;
  Contact_Person?: string;
  Phone?: string;
  Email?: string;
  Reason_for_Recommendation?: string;
  Status: 'Pending' | 'Approved' | 'Rejected';
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

// --- 8. DOCUMENTS & SOPs ---
export interface Document {
  DocumentID: string;
  Document_Name: string;
  Document_Type: string;
  Category: string;
  Document_File?: string;
  Document_Photo?: string;
  Upload_Date: string;
  Related_AssetID_Ref?: string;
  Related_TicketID_Ref?: string;
  Related_VendorID_Ref?: string;
  Related_LocationID_Ref?: string;
}

export interface SOP {
  SOP_ID: string;
  SOP_Title: string;
  Category?: string;
  Concise_Procedure_Text: string;
  Google_Doc_Link: string;
  AI_Prompt?: string;
  Last_Reviewed_By?: string;
  Last_Reviewed_Date?: string;
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
  | 'SOP_READ' | 'SOP_MANAGE' | 'DOC_MANAGE';

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