/**
 * GCCA UNIFIED HELP DESK - COMPLETE SERVER BACKEND
 */

const SCRIPT_PROP = PropertiesService.getScriptProperties();

// EXACT Tab Names from your Spreadsheet
const TABS = {
  TICKETS: 'Tickets',
  USERS: 'Users',
  CAMPUSES: 'Campuses',
  BUILDINGS: 'Buildings',
  LOCATIONS: 'Locations',
  ASSETS: 'Assets',
  VENDORS: 'Vendors',
  SOP: 'SOP_Library',
  SCHEDULES: 'PM_Schedules',
  ATTACHMENTS: 'Ticket_Attachments',
  ROLES: 'Roles', // Ensure you have a 'Roles' tab or remove role logic
  REQUESTS: 'Account_Requests', // Ensure you have this tab
  BIDS: 'Bids', // Ensure you have this tab
  REVIEWS: 'Reviews', // Ensure you have this tab
  ASSET_SOP: 'Asset_SOP_Link'
};

/* =========================================
   1. CORE SETUP
   ========================================= */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('GCCA Unified Help Desk')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSessionUserEmail() {
  return Session.getActiveUser().getEmail();
}

/* =========================================
   2. DATA FETCHING (THE FIX FOR EMPTY VIEWS)
   ========================================= */

function getDatabaseData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {};
  
  // Read every tab defined in TABS
  Object.keys(TABS).forEach(key => {
    const tabName = TABS[key];
    const sheet = ss.getSheetByName(tabName);
    // We send the data back using the KEY name (e.g. "USERS") to avoid case issues
    data[key] = sheet ? sheetToJson(sheet) : [];
  });
  
  // Add Config if needed
  data['CONFIG'] = {
    appName: "GCCA Facilities",
    unauthorizedMessage: "Access Restricted. Please contact administration.",
    supportContact: "helpdesk@grovecitychristianacademy.com"
  };

  return data;
}

function sheetToJson(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const data = values.slice(1);
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

/* =========================================
   3. UNIVERSAL SAVE FUNCTION
   ========================================= */

// Helper to save ANY object to ANY sheet
function genericSave(tabName, idColumn, dataObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  
  // Auto-create sheet if missing (Safety net)
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(Object.keys(dataObj)); // Add headers
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const allData = sheet.getDataRange().getValues();
  const idValue = dataObj[idColumn];
  
  // 1. Try to UPDATE existing row
  for (let i = 1; i < allData.length; i++) {
    const rowId = allData[i][headers.indexOf(idColumn)];
    if (rowId == idValue) {
      const newRow = headers.map(h => dataObj.hasOwnProperty(h) ? dataObj[h] : allData[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return idValue; // Updated
    }
  }

  // 2. If not found, APPEND new row
  const newRow = headers.map(h => dataObj[h] || '');
  sheet.appendRow(newRow);
  return idValue;
}

function genericDelete(tabName, idColumn, idValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(idColumn);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIdx] == idValue) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

/* =========================================
   4. SPECIFIC HANDLERS (CONNECTING THE WIRES)
   ========================================= */

// --- TICKETS ---
function saveTicket(data) { return genericSave(TABS.TICKETS, 'TicketID', data); }
function updateTicketStatus(id, status, assignedTo) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TABS.TICKETS);
  // ... (Keep your existing robust update logic here if preferred, or use genericSave)
  // For simplicity, let's use genericSave logic:
  // We need to fetch the existing ticket to merge, but genericSave handles that if we pass the ID.
  // However, specific status update is faster with direct cell write:
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for(let i=1; i<data.length; i++) {
    if(data[i][headers.indexOf('TicketID')] == id) {
       sheet.getRange(i+1, headers.indexOf('Status')+1).setValue(status);
       if(assignedTo) sheet.getRange(i+1, headers.indexOf('Assigned_Staff')+1).setValue(assignedTo);
       return;
    }
  }
}

// --- USERS ---
function saveUser(data) { return genericSave(TABS.USERS, 'UserID', data); }
function deleteUser(id) { genericDelete(TABS.USERS, 'UserID', id); }

// --- ASSETS & LOCATIONS ---
function addBuilding(campusId, name) { 
  return genericSave(TABS.BUILDINGS, 'BuildingID', { 
    BuildingID: 'BLD-' + Date.now(), CampusID_Ref: campusId, Building_Name: name 
  }); 
}
function deleteBuilding(id) { genericDelete(TABS.BUILDINGS, 'BuildingID', id); }

function addLocation(buildingId, name) {
  return genericSave(TABS.LOCATIONS, 'LocationID', {
    LocationID: 'LOC-' + Date.now(), BuildingID_Ref: buildingId, Location_Name: name
  });
}
function deleteLocation(id) { genericDelete(TABS.LOCATIONS, 'LocationID', id); }

function addAsset(locationId, name) {
  return genericSave(TABS.ASSETS, 'AssetID', {
    AssetID: 'AST-' + Date.now(), LocationID_Ref: locationId, Asset_Name: name
  });
}
function updateAsset(data) { return genericSave(TABS.ASSETS, 'AssetID', data); }
function deleteAsset(id) { genericDelete(TABS.ASSETS, 'AssetID', id); }

// --- VENDORS ---
function saveVendor(data) { return genericSave(TABS.VENDORS, 'VendorID', data); }
function deleteVendor(id) { genericDelete(TABS.VENDORS, 'VendorID', id); }

// --- OPERATIONS (SOPs, Schedules) ---
function saveSOP(data) { return genericSave(TABS.SOP, 'SOP_ID', data); }
function deleteSOP(id) { genericDelete(TABS.SOP, 'SOP_ID', id); }
function linkSOP(assetId, sopId) {
  return genericSave(TABS.ASSET_SOP, 'Link_ID', {
    Link_ID: 'LNK-' + Date.now(), AssetID_Ref: assetId, SOP_ID_Ref: sopId
  });
}
function saveMaintenanceSchedule(data) { return genericSave(TABS.SCHEDULES, 'ScheduleID', data); }
function deleteMaintenanceSchedule(id) { genericDelete(TABS.SCHEDULES, 'ScheduleID', id); }

// --- ADMIN ---
function saveRole(data) { return genericSave(TABS.ROLES, 'RoleName', data); } // Assuming RoleName is unique ID
function deleteRole(id) { genericDelete(TABS.ROLES, 'RoleName', id); }
function submitAccountRequest(data) { return genericSave(TABS.REQUESTS, 'RequestID', data); }
function deleteAccountRequest(id) { genericDelete(TABS.REQUESTS, 'RequestID', id); }

// --- BIDS ---
function submitBid(data) { return genericSave(TABS.BIDS, 'BidID', data); }
function updateBid(data) { return genericSave(TABS.BIDS, 'BidID', data); }
function saveReview(data) { return genericSave(TABS.REVIEWS, 'ReviewID', data); }


/* =========================================
   5. FILE UPLOADS & AI (Keep your existing working code)
   ========================================= */
function uploadFile(data, filename, mimeType, ticketId) {
  try {
    const folderId = SCRIPT_PROP.getProperty('DRIVE_FOLDER_ID');
    const folder = DriveApp.getFolderById(folderId);
    const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, filename);
    const file = folder.createFile(blob);
    
    genericSave(TABS.ATTACHMENTS, 'AttachmentID', {
      AttachmentID: 'ATT-' + Math.floor(Math.random() * 100000),
      TicketID_Ref: ticketId,
      File_Name: filename,
      Drive_URL: file.getUrl(),
      Mime_Type: mimeType
    });
    return file.getUrl();
  } catch (e) { throw new Error("Upload Failed: " + e.toString()); }
}

function callGemini(promptText) {
  const apiKey = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
      muteHttpExceptions: true
    });
    return JSON.parse(response.getContentText()).candidates[0].content.parts[0].text;
  } catch (e) { return "AI Service Unavailable"; }
}