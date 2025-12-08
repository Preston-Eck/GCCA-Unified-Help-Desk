const SCRIPT_PROP = PropertiesService.getScriptProperties();

// MASTER TAB MAP
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
  ATTACHMENTS: 'Ticket_Attachments',
  SCHEDULES: 'PM_Schedules',
  METERS: 'Meter_Readings_Log',
  SOPS: 'SOP_Library',
  DOCS: 'Document_Library',
  
  // Vendors & Inventory
  VENDORS: 'Vendors',
  VENDOR_RECS: 'Vendor_Recommendations',
  BIDS: 'Bids',
  REVIEWS: 'Reviews',
  MATERIALS: 'Materials_Library',
  USAGE: 'Materials_Used',
  PURCHASES: 'Purchase_Log',
  QUICKBOOKS: 'Quick Books Export'
};

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
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {};
    Object.keys(TABS).forEach(key => {
      const sheetName = TABS[key];
      const sheet = ss.getSheetByName(sheetName);
      data[key] = sheet ? sheetToJson(sheet) : [];
    });
    return data;
  } catch (e) {
    Logger.log("CRITICAL ERROR: " + e.toString());
    throw e;
  }
}

function sheetToJson(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  const data = values.slice(1);
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
       if (!h) return;
       let val = row[i];
       if (val instanceof Date) val = val.toISOString();
       obj[h] = val;
    });
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

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  
  // Dynamic Columns
  Object.keys(dataObj).forEach(k => {
    // Case insensitive check for existing column
    if (headers.findIndex(h => h.toLowerCase() === k.toLowerCase()) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(k);
      headers.push(k);
    }
  });

  const allData = sheet.getDataRange().getValues();
  const idValue = dataObj[idCol];
  const idIndex = headers.findIndex(h => h.toLowerCase() === idCol.toLowerCase());

  if (idValue && idIndex !== -1) {
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][idIndex]) === String(idValue)) {
        // Map dataObj keys to correct column index (case insensitive)
        const newRow = headers.map(h => {
          const key = Object.keys(dataObj).find(k => k.toLowerCase() === h.toLowerCase());
          return key ? dataObj[key] : allData[i][headers.indexOf(h)];
        });
        
        sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        return { success: true, action: 'updated', id: idValue };
      }
    }
  }

  // Create New
  const newRow = headers.map(h => {
     const key = Object.keys(dataObj).find(k => k.toLowerCase() === h.toLowerCase());
     return key ? dataObj[key] : '';
  });
  
  sheet.appendRow(newRow);
  return { success: true, action: 'created', id: idValue };
}

function deleteData(tabKey, idCol, idValue) {
  const sheetName = TABS[tabKey];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const colIdx = headers.findIndex(h => h.toLowerCase() === idCol.toLowerCase());
  
  if (colIdx === -1) return { success: false, message: 'ID Column not found' };
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'ID not found' };
}

// EXPORTS
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
// FORCE a stable ID 'MASTER' so we always update the same row
function updateConfig(d) { 
  d.ConfigID = 'MASTER'; 
  return saveData('CONFIG', 'ConfigID', d); 
}
function saveRole(d) { return saveData('ROLES', 'RoleName', d); }
function deleteRole(id) { return deleteData('ROLES', 'RoleName', id); }
function saveComment(d) { return saveData('COMMENTS', 'CommentID', d); }

function linkSOP(assetId, sopId) {
  return saveData('ASSET_SOP', 'Link_ID', {
    Link_ID: 'LNK-' + Date.now(),
    AssetID_Ref: assetId,
    SOP_ID_Ref: sopId
  });
}
function addColumn(sheet, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(sheet);
  if(s) s.getRange(1, s.getLastColumn()+1).setValue(header);
  return {success: true};
}
function getSchema() {
  const data = getDatabaseData();
  const schema = {};
  Object.keys(data).forEach(k => {
    if (data[k].length > 0) {
      schema[k] = Object.keys(data[k][0]);
    } else {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(TABS[k]);
      schema[k] = sheet ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
    }
  });
  return schema;
}

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
/**
 * MASTER CLEANUP FUNCTION
 * Runs schema sanitization and orphan data removal in one go.
 */
function runDataCleanup() {
  const schemaLog = updateSchema();
  const orphanLog = cleanOrphanData();
  const finalLog = `--- DATA CLEANUP REPORT ---\n\n${schemaLog}\n\n${orphanLog}`;
  
  Logger.log(finalLog);
  return finalLog;
}

/**
 * 1. SCHEMA SANITIZER
 * Iterates through all 30+ tabs defined in TABS.
 * Ensures headers have no spaces (replaces with '_') and removes special chars like '?'.
 */
function updateSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = "Schema Update Log:\n";

  // Iterate through every table defined in your global TABS object
  Object.keys(TABS).forEach(key => {
    const sheetName = TABS[key];
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      log += `[WARN] Sheet '${sheetName}' not found.\n`;
      return;
    }

    // Get current headers
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return; // Empty sheet

    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    const headers = headerRange.getValues()[0];
    let hasChanges = false;

    // Process headers
    const newHeaders = headers.map(h => {
      let clean = String(h).trim();
      
      // 1. Replace spaces with underscores
      clean = clean.replace(/\s+/g, '_');
      
      // 2. Remove illegal characters (like '?' in "Location_Listed?")
      // Keeping only letters, numbers, and underscores
      clean = clean.replace(/[^a-zA-Z0-9_]/g, '');

      if (clean !== String(h)) {
        hasChanges = true;
      }
      return clean;
    });

    // Write back if changes detected
    if (hasChanges) {
      headerRange.setValues([newHeaders]);
      log += `[FIXED] Updated headers in '${sheetName}'.\n`;
    } else {
      log += `[OK] '${sheetName}' headers are clean.\n`;
    }
  });

  return log;
}

/**
 * 2. ORPHAN DATA SANITIZER
 * Specifically looks for rows in Tickets and Assets that lack a primary ID.
 * Based on your CSV analysis:
 * - Tickets: Row 3 missing 'TicketID'
 * - Assets: Last row missing 'AssetID'
 */
function cleanOrphanData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = "Orphan Data Cleanup Log:\n";

  // Configuration for tables that need strict ID checks
  const targets = [
    { key: 'TICKETS', idCol: 'TicketID' },
    { key: 'ASSETS', idCol: 'AssetID' }
  ];

  targets.forEach(target => {
    const sheetName = TABS[target.key];
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return; // Only headers

    const headers = data[0];
    // Find the column index for the ID (e.g., TicketID)
    // We strictly search for the clean name, assuming updateSchema() ran first
    const idIndex = headers.findIndex(h => h.trim() === target.idCol);

    if (idIndex === -1) {
      log += `[ERROR] Could not find ID column '${target.idCol}' in ${sheetName}.\n`;
      return;
    }

    // Iterate BACKWARDS to delete rows without messing up indices
    let deletedCount = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      const rowId = data[i][idIndex];
      
      // Check if ID is empty, null, or undefined
      if (!rowId || String(rowId).trim() === '') {
        sheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
        deletedCount++;
        log += `[DELETED] Removed orphan row ${i + 1} in '${sheetName}' (Missing ${target.idCol}).\n`;
      }
    }

    if (deletedCount === 0) {
      log += `[OK] No orphans found in '${sheetName}'.\n`;
    }
  });

  return log;
}
/* =========================================
   6. DEBUG & EXPORT TOOLS
   ========================================= */

function emailDatabaseExport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const blobs = [];
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const data = sheet.getDataRange().getValues();
    const csvString = data.map(row => 
      row.map(cell => {
        let cellStr = String(cell).replace(/"/g, '""'); 
        if (cellStr.search(/("|,|\n)/g) >= 0) cellStr = `"${cellStr}"`;
        return cellStr;
      }).join(",")
    ).join("\n");
    blobs.push(Utilities.newBlob(csvString, 'text/csv', `${name}.csv`));
  });
  
  const zip = Utilities.zip(blobs, 'GCCA_Database_Export.zip');
  const recipient = Session.getActiveUser().getEmail();
  
  MailApp.sendEmail({
    to: recipient,
    subject: "GCCA Database CSV Export",
    body: "Attached is the full export of your spreadsheet tables.",
    attachments: [zip]
  });
  
  return "Sent export to " + recipient;
}