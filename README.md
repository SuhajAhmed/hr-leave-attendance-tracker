# 📊 HR Leave & Attendance Tracker — Google Sheets

A fully automated HR leave management system built in Google Sheets with Apps Script.

## Features
- 3 department sheets tracking employee leave requests
- Live dashboard with charts and KPIs
- Auto-reject expired pending requests
- Weekly PDF report emailed automatically every Monday
- Configurable settings tab (email, allowances)

## Dashboard Preview
![Dashboard](Screenshot 2026-06-12 221153.png)

## Department Sheets

**Dept 1**
![Dept 1](Screenshot_2026-06-12_221153.png)

**Dept 2**
![Dept 2](Screenshot_2026-06-12_221219.png)

**Dept 3**
![Dept 3](Screenshot_2026-06-12_221232.png)

## Settings
![Settings](Screenshot_2026-06-12_221306.png)

## Tech Stack
- Google Sheets
- Google Apps Script
- Gmail API (for automated reports)

## How It Works
1. HR staff enter leave requests in each department tab
2. Dashboard auto-calculates totals, pending count, and leave distribution
3. Weekly trigger emails a PDF of the dashboard every Monday at 8 AM
4. Expired pending requests are auto-rejected with one click
4. Expired pending requests are auto-rejected with one click
