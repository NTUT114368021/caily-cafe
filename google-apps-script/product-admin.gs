const SHEET_NAME = "Products";
const ADMIN_TOKEN = "change-this-token";
const HEADERS = [
  "id",
  "category",
  "featured",
  "name",
  "description",
  "detail",
  "specs",
  "price",
  "label",
  "image",
  "visible"
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.token !== ADMIN_TOKEN) {
      return jsonResponse({ ok: false, error: "Invalid token" });
    }

    const sheet = getSheet();
    ensureHeaders(sheet);

    if (payload.action === "delete") {
      deleteProduct(sheet, payload.id);
    } else {
      upsertProduct(sheet, payload);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function deleteProduct(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (!id || lastRow < 2) return;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const foundIndex = ids.findIndex((rowId) => rowId === id);

  if (foundIndex >= 0) {
    sheet.deleteRow(foundIndex + 2);
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => current[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function upsertProduct(sheet, payload) {
  const values = HEADERS.map((header) => payload[header] || "");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    sheet.appendRow(values);
    return;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const foundIndex = ids.findIndex((id) => id === payload.id);

  if (foundIndex >= 0) {
    sheet.getRange(foundIndex + 2, 1, 1, HEADERS.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
