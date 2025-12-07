const SCRIPT_PROP = PropertiesService.getScriptProperties();

const TABS = {
  CONFIG: 'Config',
  USERS: 'Users',
  ROLES: 'Roles',
  REQUESTS: 'Account_Requests',
  MAPPINGS: 'Data_Mapping',
  IMAGES: 'App_Images',
  CAMPUSES: 'Campuses',
  BUILDINGS: 'Buildings',
  LOCATIONS: 'Locations',
  LOC_SUBS: 'Location_Submissions',
  ASSETS: 'Assets',
  ASSET_SUBS: 'Asset Submissions',
  ASSET_SOP: 'Asset_SOP_Link',
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
  
  Object.keys(dataObj).forEach(k => {
    if (headers.indexOf(k) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(k);
      headers.push(k);
    }
  });

  const allData = sheet.getDataRange().getValues();
  const idValue = dataObj[idCol];
  // FIX: Case Insensitive ID Match
  const idIndex = headers.findIndex(h => h.toLowerCase() === idCol.toLowerCase());

  if (idValue && idIndex !== -1) {
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

// ... (KEEP ALL OTHER FUNCTIONS: saveTicket, saveTask, requestOtp, uploadFile, callGemini, etc. - Copy them from previous turn or keep existing) ...
// NOTE: Ensure you keep ALL specific save/delete functions below this point.
// I am omitting them here for brevity, but they MUST exist. 
// Just replace the top half of your file with this improved logic.

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
function updateConfig(d) { return saveData('CONFIG', 'appName', d); } 
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
function updateSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const renames = {
    'Phone Number': 'Phone_Number',
    'Date Submitted': 'Date_Submitted',
    'Campus Map': 'Campus_Map',
    'Next Due Date': 'Next_Due_Date',
    'Building Floor Plan': 'Building_Floor_Plan',
    'Building Cover Photo': 'Building_Cover_Photo',
    'Purchase Unit Cost': 'Purchase_Unit_Cost',
    'Items per Unit': 'Items_per_Unit'
  };
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;
    const range = sheet.getRange(1, 1, 1, lastCol);
    const headers = range.getValues()[0];
    let changed = false;
    const newHeaders = headers.map(h => {
      if (renames[h]) { changed = true; return renames[h]; }
      if (typeof h === 'string' && h.includes(' ') && !h.includes('_')) {
         changed = true;
         return h.replace(/ /g, '_');
      }
      return h;
    });
    if (changed) {
      range.setValues([newHeaders]);
      console.log(`Updated headers in ${sheet.getName()}`);
    }
  });
  return "Schema Sync Complete";
}
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