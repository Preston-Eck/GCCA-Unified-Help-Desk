const SCRIPT_PROP = PropertiesService.getScriptProperties();

// MASTER TAB MAP (App Name -> Sheet Name)
const TABS = {
  // Core
  CONFIG: 'Config',
  USERS: 'Users',
  ROLES: 'Roles',
  REQUESTS: 'Account_Requests',
  MAPPINGS: 'Data_Mapping',
  IMAGES: 'App_Images',
  
  // Infrastructure
  CAMPUSES: 'Campuses',
  BUILDINGS: 'Buildings',
  LOCATIONS: 'Locations',
  LOC_SUBS: 'Location_Submissions',
  ASSETS: 'Assets',
  ASSET_SUBS: 'Asset Submissions',
  ASSET_SOP: 'Asset_SOP_Link',
  
  // Operations
  TICKETS: 'Tickets',
  FOLLOWERS: 'Followers',
  TASKS: 'Tasks',
  TASK_COMMENTS: 'Task_Comments',
  TASK_ATTACHMENTS: 'Task_Comment_Attachments',
  COMMENTS: 'Comments',
  TICKET_ATTACHMENTS: 'Ticket_Attachments',
  SCHEDULES: 'PM_Schedules',
  METERS: 'Meter_Readings_Log',
  SOPS: 'SOP_Library',
  DOCS: 'Document_Library',
  
  // Inventory & Vendors
  VENDORS: 'Vendors',
  VENDOR_RECS: 'Vendor_Recommendations',
  BIDS: 'Bids',
  REVIEWS: 'Reviews',
  MATERIALS: 'Materials_Library',
  USAGE: 'Materials_Used',
  PURCHASES: 'Purchase_Log',
  QUICKBOOKS: 'Quick Books Export'
};

/* =========================================
   1. CORE API
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

function getDatabaseData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {};
  
  Object.keys(TABS).forEach(key => {
    const sheetName = TABS[key];
    const sheet = ss.getSheetByName(sheetName);
    data[key] = sheet ? sheetToJson(sheet) : [];
  });
  
  return data;
}

/* =========================================
   2. DATA HANDLERS
   ========================================= */

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

function saveData(tabKey, idCol, dataObj) {
  const sheetName = TABS[tabKey];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(Object.keys(dataObj));
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Add missing columns dynamically
  Object.keys(dataObj).forEach(k => {
    if (headers.indexOf(k) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(k);
      headers.push(k);
    }
  });

  const allData = sheet.getDataRange().getValues();
  const idValue = dataObj[idCol];
  const idIndex = headers.indexOf(idCol);

  if (idValue) {
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][idIndex]) === String(idValue)) {
        const newRow = headers.map(h => dataObj.hasOwnProperty(h) ? dataObj[h] : allData[i][headers.indexOf(h)]);
        sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        return { success: true, action: 'updated', id: idValue };
      }
    }
  }

  const newRow = headers.map(h => dataObj[h] || '');
  sheet.appendRow(newRow);
  return { success: true, action: 'created', id: idValue };
}

function deleteData(tabKey, idCol, idValue) {
  const sheetName = TABS[tabKey];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  const colIdx = data[0].indexOf(idCol);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'ID not found' };
}

/* =========================================
   3. PUBLIC API (CRUD)
   ========================================= */

function saveTicket(d) { return saveData('TICKETS', 'TicketID', d); }
function saveTask(d) { return saveData('TASKS', 'TaskID', d); }
function saveUser(d) { return saveData('USERS', 'UserID', d); }
function deleteUser(id) { return deleteData('USERS', 'UserID', id); }
function saveAsset(d) { return saveData('ASSETS', 'AssetID', d); }
function deleteAsset(id) { return deleteData('ASSETS', 'AssetID', id); }
function saveMaterial(d) { return saveData('MATERIALS', 'MaterialID', d); }
function saveCampus(d) { return saveData('CAMPUSES', 'CampusID', d); }
function deleteCampus(id) { return deleteData('CAMPUSES', 'CampusID', id); }
function saveBuilding(d) { return saveData('BUILDINGS', 'BuildingID', d); }
function deleteBuilding(id) { return deleteData('BUILDINGS', 'BuildingID', id); }
function saveLocation(d) { return saveData('LOCATIONS', 'LocationID', d); }
function deleteLocation(id) { return deleteData('LOCATIONS', 'LocationID', id); }
function saveVendor(d) { return saveData('VENDORS', 'VendorID', d); }
function saveSOP(d) { return saveData('SOPS', 'SOP_ID', d); }
function saveSchedule(d) { return saveData('SCHEDULES', 'PM_ID', d); }
function saveMapping(d) { return saveData('MAPPINGS', 'MappingID', d); }
function deleteMapping(id) { return deleteData('MAPPINGS', 'MappingID', id); }
function updateConfig(d) { return saveData('CONFIG', 'appName', d); } // Config hack
function addColumn(sheet, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(sheet);
  if(s) s.getRange(1, s.getLastColumn()+1).setValue(header);
  return {success: true};
}

// Schema Fetcher
function getSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = {};
  Object.keys(TABS).forEach(key => {
    const sheet = ss.getSheetByName(TABS[key]);
    schema[TABS[key]] = sheet ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
  });
  return schema;
}

/* =========================================
   4. UTILS & AUTH
   ========================================= */

function requestOtp(email) {
  email = email.trim().toLowerCase();
  const data = getDatabaseData();
  const users = data.USERS || [];
  if (!users.some(u => String(u.Email).trim().toLowerCase() === email)) {
    return { success: false, message: "Email not found." };
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  CacheService.getScriptCache().put("OTP_" + email, code, 600);
  try {
    MailApp.sendEmail({ to: email, subject: "GCCA Login", htmlBody: `Code: <b>${code}</b>` });
    return { success: true };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function verifyOtp(email, code) {
  const c = CacheService.getScriptCache();
  if (c.get("OTP_" + email.trim().toLowerCase()) === code) {
    c.remove("OTP_" + email);
    return true;
  }
  return false;
}

function uploadFile(data, filename, mimeType, parentId) {
  try {
    const folder = DriveApp.getFolderById(SCRIPT_PROP.getProperty('DRIVE_FOLDER_ID'));
    const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, filename);
    const file = folder.createFile(blob);
    saveData('ATTACHMENTS', 'AttachmentID', {
      AttachmentID: 'ATT-' + Date.now(), TicketID_Ref: parentId,
      File_Name: filename, Drive_URL: file.getUrl(), Mime_Type: mimeType
    });
    return file.getUrl();
  } catch (e) { throw new Error(e.toString()); }
}

function callGemini(prompt) {
  const key = SCRIPT_PROP.getProperty('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const options = {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  };
  try {
    return JSON.parse(UrlFetchApp.fetch(url, options).getContentText()).candidates[0].content.parts[0].text;
  } catch (e) { return "AI Unavailable"; }
}

/* =========================================
   5. SCHEMA MIGRATION SCRIPT (RUN ONCE)
   ========================================= */
function updateSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Normalize Header Names (Remove spaces, standardized casing)
  // Add specific mappings here if you want to rename "Phone Number" to "Phone_Number" automatically
  const renames = {
    'Phone Number': 'Phone_Number',
    'Date Submitted': 'Date_Submitted',
    'Campus Map': 'Campus_Map',
    'Next Due Date': 'Next_Due_Date'
  };
  
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    const headers = range.getValues()[0];
    const newHeaders = headers.map(h => renames[h] || h);
    
    if (JSON.stringify(headers) !== JSON.stringify(newHeaders)) {
      range.setValues([newHeaders]);
      console.log(`Updated headers in ${sheet.getName()}`);
    }
  });
}