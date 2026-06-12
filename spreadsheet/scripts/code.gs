/**
 * ================================================
 * HR Leave & Attendance Tracker — Apps Script
 * ================================================
 */

// ── CONFIGURATION (reads from Settings tab) ──
const SETTINGS_SHEET  = "Settings";
const DASHBOARD_SHEET = "DashBord";  // match your tab name exactly
const EMAIL_CELL      = "B4";
const SUBJECT_CELL    = "B5";

// ── MENU ─────────────────────────────────────
/**
 * Creates the HR Tools menu when the sheet opens
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("HR Tools")
    .addItem("Send Report Now", "sendWeeklyReport")
    .addSeparator()
    .addItem("Install Weekly Auto-Trigger", "installWeeklyTrigger")
    .addItem("Remove All Triggers", "removeTriggers")
    .addSeparator()
    .addItem("Auto-Reject Expired Requests", "autoRejectExpired")
    .addToUi();
}

// ── SEND REPORT ───────────────────────────────
/**
 * Exports Dashboard as PDF and emails it.
 * Reads email and subject from Settings tab.
 */
function sendWeeklyReport() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const settings = ss.getSheetByName(SETTINGS_SHEET);

  // Read config from Settings — never hardcoded
  const recipientEmail = settings.getRange(EMAIL_CELL).getValue();
  const emailSubject   = settings.getRange(SUBJECT_CELL).getValue();

  if (!recipientEmail) {
    SpreadsheetApp.getUi().alert(
      "⚠️ No email found in Settings tab cell B3."
    );
    return;
  }

  // Generate PDF of Dashboard only
  const pdfBlob = exportDashboardAsPdf(ss);
  const dateStr = Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"
  );

  // Send email
  GmailApp.sendEmail(
    recipientEmail,
    emailSubject,
    "",
    {
      htmlBody: buildEmailBody(dateStr),
      attachments: [pdfBlob.setName(`HR_Report_${dateStr}.pdf`)],
      name: "HR Reporting Bot"
    }
  );

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✅ Report sent to ${recipientEmail}`, "Success", 5
  );
}

// ── PDF EXPORT ────────────────────────────────
/**
 * Exports only the Dashboard tab as a PDF blob
 */
function exportDashboardAsPdf(ss) {
  const dashboard = ss.getSheetByName(DASHBOARD_SHEET);
  const ssId      = ss.getId();
  const sheetId   = dashboard.getSheetId();

  const url = `https://docs.google.com/spreadsheets/d/${ssId}/export`
    + `?format=pdf`
    + `&size=A4`
    + `&portrait=false`
    + `&fitw=true`
    + `&fith=true`
    + `&top_margin=0.5`
    + `&bottom_margin=0.5`
    + `&left_margin=0.5`
    + `&right_margin=0.5`
    + `&sheetnames=false`
    + `&printtitle=false`
    + `&pagenumbers=false`
    + `&gridlines=false`
    + `&gid=${sheetId}`;

  const token    = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.getBlob().setContentType("application/pdf");
}

// ── EMAIL BODY ────────────────────────────────
/**
 * Builds a clean HTML email body
 */
function buildEmailBody(dateStr) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1A2744;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0">📊 Weekly HR Leave Report</h2>
        <p style="color:#93C5FD;margin:4px 0 0">Generated: ${dateStr}</p>
      </div>
      <div style="background:#F3F6FC;padding:20px;border-radius:0 0 8px 8px">
        <p style="color:#1E293B">
          Please find attached the weekly HR Leave & Attendance Dashboard.
        </p>
        <p style="color:#64748B;font-size:12px">
          This is an automated report. Do not reply to this email.<br>
          To update the recipient or subject, edit the Settings tab.
        </p>
      </div>
    </div>
  `;
}

// ── TRIGGERS ──────────────────────────────────
/**
 * Installs weekly trigger: every Monday at 8:00 AM
 */
function installWeeklyTrigger() {
  removeTriggers(); // clear existing first

  ScriptApp.newTrigger("sendWeeklyReport")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .nearMinute(0)
    .create();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "✅ Trigger set: Every Monday at 8:00 AM", "Trigger Installed", 5
  );
}

/**
 * Removes all sendWeeklyReport triggers
 */
function removeTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "sendWeeklyReport")
    .forEach(t => ScriptApp.deleteTrigger(t));
}

// ── BONUS: AUTO REJECT EXPIRED ────────────────
/**
 * Finds Pending requests where Start Date has passed
 * and automatically rejects them with a note
 */
function autoRejectExpired() {
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const depts    = ["Dept_1", "Dept_2", "Dept_3"];
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  let count      = 0;

  depts.forEach(deptName => {
    const sheet = ss.getSheetByName(deptName);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

    data.forEach((row, i) => {
      const startDate = new Date(row[2]); // Column C
      const status    = row[6];           // Column G
      const actualRow = i + 2;

      if (status === "Pending" && startDate < today) {
        // Update Status to Rejected
        sheet.getRange(actualRow, 7).setValue("Rejected");
        // Add note in column H
        sheet.getRange(actualRow, 8).setValue(
          "Auto-rejected: start date passed"
        );
        count++;
      }
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✅ ${count} expired request(s) auto-rejected.`, "Done", 5
  );
}
