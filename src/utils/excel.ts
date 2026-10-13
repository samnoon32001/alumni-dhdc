import * as XLSX from 'xlsx';

export interface AlumniImportRow {
  admissionNumber: string;
  name: string;
  passoutBatchYear: string;
  completedClass?: string;
  zoneName?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  currentStatus?: string;
  currentInstitution?: string;
  courseOrDegree?: string;
  currentCity?: string;
  currentState?: string;
  permanentAddress?: string;
  bloodGroup?: string;
  gender?: string;
}

export interface ValidatedImportResult {
  totalRows: number;
  validRows: AlumniImportRow[];
  invalidRows: { rowNumber: number; reason: string; data: any }[];
  errors: string[];
}

export const PREDEFINED_ZONES = [
  'Malappuram Central',
  'Edappal / Ponnani (Home Zone)',
  'Kozhikode & Northern Kerala',
  'Ernakulam & Southern Kerala',
  'GCC - UAE (Dubai / Abu Dhabi)',
  'GCC - Saudi Arabia (Jeddah / Riyadh)',
  'GCC - Qatar & Gulf Chapters',
  'Bangalore / Rest of India',
  'Overseas / Other',
];

/**
 * Generates and downloads the official DHDC Alumni Excel Demo Template
 */
export function downloadAlumniDemoTemplate() {
  const sampleData = [
    {
      'Admission No *': '1001',
      'Full Name *': 'Ahmad Bilal EK',
      'Batch *': '2024',
      'Completed Class': '10th Standard',
      'Zone / Chapter': 'Edappal / Ponnani (Home Zone)',
      'Phone Number': '9847123456',
      'WhatsApp Number': '9847123456',
      'Email': 'ahmad.bilal@example.com',
      'Gender': 'Male',
      'Blood Group': 'O+',
      'Current Status': 'Higher Studies',
      'Current College or Org': 'Farook College, Calicut',
      'Course or Designation': 'Higher Secondary (Science)',
      'Current City': 'Edappal',
      'State': 'Kerala',
      'Permanent Address': 'Baitul Noor, Manoor PO, Edappal',
    },
    {
      'Admission No *': '1002',
      'Full Name *': 'Sayyid Salman Al-Bukhari',
      'Batch *': '2023',
      'Completed Class': '10th Standard',
      'Zone / Chapter': 'GCC - UAE (Dubai / Abu Dhabi)',
      'Phone Number': '+971501234567',
      'WhatsApp Number': '+971501234567',
      'Email': 'salman.uae@example.com',
      'Gender': 'Male',
      'Blood Group': 'B+',
      'Current Status': 'Employed',
      'Current College or Org': 'Al Zahra Medical Logistics, Dubai',
      'Course or Designation': 'Operations Coordinator',
      'Current City': 'Dubai',
      'State': 'Dubai / UAE',
      'Permanent Address': 'Madeena Manzil, Ponnani',
    },
    {
      'Admission No *': '1003',
      'Full Name *': 'Shabeer Rahman PT',
      'Batch *': '2025',
      'Completed Class': '10th Standard',
      'Zone / Chapter': 'Malappuram Central',
      'Phone Number': '9447654321',
      'WhatsApp Number': '9447654321',
      'Email': 'shabeer.pt@example.com',
      'Gender': 'Male',
      'Blood Group': 'A+',
      'Current Status': 'Higher Studies',
      'Current College or Org': 'Darul Huda Islamic University',
      'Course or Designation': 'Degree Secondary',
      'Current City': 'Chemmad',
      'State': 'Kerala',
      'Permanent Address': 'Puthanveettil, Manoor',
    },
  ];

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Alumni Data Template
  const dataSheet = XLSX.utils.json_to_sheet(sampleData);
  dataSheet['!cols'] = [
    { wch: 16 }, // Admission No
    { wch: 28 }, // Full Name
    { wch: 16 }, // Batch
    { wch: 18 }, // Completed Class
    { wch: 32 }, // Zone / Chapter
    { wch: 16 }, // Phone Number
    { wch: 16 }, // WhatsApp
    { wch: 26 }, // Email
    { wch: 10 }, // Gender
    { wch: 12 }, // Blood Group
    { wch: 18 }, // Current Status
    { wch: 30 }, // Current College
    { wch: 26 }, // Course
    { wch: 16 }, // Current City
    { wch: 16 }, // State
    { wch: 36 }, // Address
  ];
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Alumni Import');

  // Sheet 2: Institutional Zones Reference
  const zonesData = PREDEFINED_ZONES.map((z, idx) => ({
    'Sl No': idx + 1,
    'Institutional Zone Name': z,
    'Region': z.includes('GCC') ? 'International' : z.includes('Bangalore') ? 'India' : 'Kerala',
    'Notes': 'Copy exact zone name to Alumni Import sheet',
  }));
  const zonesSheet = XLSX.utils.json_to_sheet(zonesData);
  zonesSheet['!cols'] = [{ wch: 8 }, { wch: 36 }, { wch: 16 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, zonesSheet, 'Allowed Zones Reference');

  // Instructions Sheet
  const instructions = [
    { 'FALAH DHDC ALUMNI BULK IMPORT GUIDE': '1. Columns marked with (*) are MANDATORY (Admission No, Full Name, Batch).' },
    { 'FALAH DHDC ALUMNI BULK IMPORT GUIDE': '2. Admission No must be unique. Duplicate admission numbers will update existing records.' },
    { 'FALAH DHDC ALUMNI BULK IMPORT GUIDE': '3. Batch should be the batch year (e.g., 2024, 2025).' },
    { 'FALAH DHDC ALUMNI BULK IMPORT GUIDE': '4. Initial login accounts will automatically be generated using Admission Number.' },
    { 'FALAH DHDC ALUMNI BULK IMPORT GUIDE': '5. Alumni will complete any remaining steps (Zone/Photo/Address) during initial login.' },
  ];
  const guideSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Instructions');

  XLSX.writeFile(workbook, 'FALAH_DHDC_Alumni_Import_Template.xlsx');
}

/**
 * Parses uploaded Excel file into raw objects
 */
export async function parseAlumniExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Validates parsed Excel rows against Alumni requirements
 */
export function validateAlumniRows(rows: any[]): ValidatedImportResult {
  const validRows: AlumniImportRow[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
  const errors: string[] = [];
  const seenAdmissionNumbers = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Accounting for 1-based index and header row

    // Find admission number column dynamically
    const admKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('admission') || k.toLowerCase().includes('ad.no') || k.toLowerCase().includes('adno')
    );
    const nameKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('name')
    );
    const batchKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('batch') || k.toLowerCase().includes('passout') || k.toLowerCase().includes('year')
    );
    const zoneKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('zone') || k.toLowerCase().includes('chapter')
    );
    const phoneKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile')
    );
    const emailKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('email')
    );
    const statusKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('status') || k.toLowerCase().includes('occupation')
    );
    const orgKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('college') || k.toLowerCase().includes('org') || k.toLowerCase().includes('institution')
    );
    const courseKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('course') || k.toLowerCase().includes('designation')
    );
    const cityKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('city') || k.toLowerCase().includes('place')
    );
    const addressKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('address')
    );

    const rawAdm = admKey ? String(row[admKey] || '').trim().replace(/\.0$/, '') : '';
    const rawName = nameKey ? String(row[nameKey] || '').trim() : '';
    const rawBatch = batchKey ? String(row[batchKey] || '').trim().replace(/\.0$/, '') : '';

    if (!rawAdm) {
      invalidRows.push({ rowNumber: rowNum, reason: 'Missing Admission Number', data: row });
      return;
    }
    if (!rawName) {
      invalidRows.push({ rowNumber: rowNum, reason: 'Missing Full Name', data: row });
      return;
    }
    if (!rawBatch) {
      invalidRows.push({ rowNumber: rowNum, reason: 'Missing Batch', data: row });
      return;
    }
    if (seenAdmissionNumbers.has(rawAdm)) {
      invalidRows.push({ rowNumber: rowNum, reason: `Duplicate Admission Number in spreadsheet: ${rawAdm}`, data: row });
      return;
    }

    seenAdmissionNumbers.add(rawAdm);

    validRows.push({
      admissionNumber: rawAdm,
      name: rawName,
      passoutBatchYear: rawBatch,
      completedClass: row['Completed Class'] || '10th Standard',
      zoneName: zoneKey ? String(row[zoneKey] || '').trim() : undefined,
      phone: phoneKey ? String(row[phoneKey] || '').trim() : undefined,
      whatsappNumber: row['WhatsApp Number'] ? String(row['WhatsApp Number']).trim() : undefined,
      email: emailKey ? String(row[emailKey] || '').trim() : undefined,
      currentStatus: statusKey ? String(row[statusKey] || '').trim() : 'Higher Studies',
      currentInstitution: orgKey ? String(row[orgKey] || '').trim() : undefined,
      courseOrDegree: courseKey ? String(row[courseKey] || '').trim() : undefined,
      currentCity: cityKey ? String(row[cityKey] || '').trim() : undefined,
      currentState: row['State'] ? String(row['State']).trim() : 'Kerala',
      permanentAddress: addressKey ? String(row[addressKey] || '').trim() : undefined,
      bloodGroup: row['Blood Group'] ? String(row['Blood Group']).trim() : undefined,
      gender: row['Gender'] ? String(row['Gender']).trim() : undefined,
    });
  });

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    errors,
  };
}

// =========================================================================
// IFLAH FUND COLLECTION EXCEL UTILITIES
// =========================================================================

export interface IflahFundImportRow {
  admissionNumber: string;
  name?: string;
  levelName: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
}

export interface ValidatedIflahFundImportResult {
  totalRows: number;
  validRows: IflahFundImportRow[];
  invalidRows: { rowNumber: number; reason: string; data: any }[];
  errors: string[];
}

/**
 * Downloads official Excel template for IFLAH Fund Collection
 */
export function downloadIflahFundTemplate() {
  const sampleData = [
    {
      'Admission No *': '501',
      'Alumni Name': 'Mohamed Rashid',
      'Level (Rabee / Ramadan / Both) *': "Rabee'",
      'Amount (₹) *': 600,
      'Payment Mode': 'UPI',
      'Transaction Ref': 'UPI-492817291',
      'Payment Date (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Remarks / Notes': "Rabee' instalment contribution",
    },
    {
      'Admission No *': '502',
      'Alumni Name': 'Abdurahman K',
      'Level (Rabee / Ramadan / Both) *': 'Ramadan',
      'Amount (₹) *': 600,
      'Payment Mode': 'Bank Transfer',
      'Transaction Ref': 'NEFT-88291039',
      'Payment Date (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Remarks / Notes': 'Ramadan fund collection',
    },
    {
      'Admission No *': '503',
      'Alumni Name': 'ASHIQ CP',
      'Level (Rabee / Ramadan / Both) *': 'Both',
      'Amount (₹) *': 1200,
      'Payment Mode': 'UPI',
      'Transaction Ref': 'UPI-552019283',
      'Payment Date (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Remarks / Notes': 'Full annual payment (Rabee + Ramadan)',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 16 }, // Admission No
    { wch: 22 }, // Alumni Name
    { wch: 32 }, // Level
    { wch: 14 }, // Amount
    { wch: 16 }, // Payment Mode
    { wch: 22 }, // Transaction Ref
    { wch: 24 }, // Payment Date
    { wch: 32 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IFLAH_Fund_Collection');
  XLSX.writeFile(workbook, 'IFLAH_Fund_Collection_Demo_Template.xlsx');
}

/**
 * Parse an uploaded Excel file for IFLAH Fund imports
 */
export async function parseIflahFundExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rawJson);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate parsed IFLAH Fund rows
 */
export function validateIflahFundRows(
  rows: any[],
  knownAdmissionNumbers?: Set<string>
): ValidatedIflahFundImportResult {
  const validRows: IflahFundImportRow[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const admKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('admission') || k.toLowerCase().includes('ad.no') || k.toLowerCase().includes('adno')
    );
    const amountKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('amount') || k.toLowerCase().includes('paid') || k.toLowerCase().includes('fee')
    );
    const levelKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('level') || k.toLowerCase().includes('term') || k.toLowerCase().includes('installment')
    );
    const nameKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('name')
    );
    const modeKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('mode') || k.toLowerCase().includes('method')
    );
    const refKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('ref') || k.toLowerCase().includes('transaction') || k.toLowerCase().includes('utr')
    );
    const dateKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('date')
    );
    const notesKey = Object.keys(row).find((k) =>
      k.toLowerCase().includes('note') || k.toLowerCase().includes('remark')
    );

    const rawAdm = admKey ? String(row[admKey] || '').trim().replace(/\.0$/, '') : '';
    const rawAmountStr = amountKey ? String(row[amountKey] || '').trim() : '';
    const numAmount = parseFloat(rawAmountStr);

    if (!rawAdm) {
      invalidRows.push({ rowNumber: rowNum, reason: 'Missing Admission Number', data: row });
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      invalidRows.push({ rowNumber: rowNum, reason: `Invalid Amount: "${rawAmountStr}" (must be > 0)`, data: row });
      return;
    }

    if (knownAdmissionNumbers && knownAdmissionNumbers.size > 0 && !knownAdmissionNumbers.has(rawAdm)) {
      invalidRows.push({ rowNumber: rowNum, reason: `Admission Number "${rawAdm}" not found in Alumni Directory`, data: row });
      return;
    }

    const rawLevel = levelKey ? String(row[levelKey] || '').trim() : "Rabee'";
    const rawName = nameKey ? String(row[nameKey] || '').trim() : '';
    const rawMode = modeKey ? String(row[modeKey] || '').trim() : 'UPI';
    const rawRef = refKey ? String(row[refKey] || '').trim() : '';
    const rawDate = dateKey ? String(row[dateKey] || '').trim() : '';
    const rawNotes = notesKey ? String(row[notesKey] || '').trim() : '';

    validRows.push({
      admissionNumber: rawAdm,
      name: rawName || undefined,
      levelName: rawLevel || "Rabee'",
      amount: numAmount,
      paymentMethod: rawMode || 'UPI',
      transactionRef: rawRef || undefined,
      paymentDate: rawDate || undefined,
      notes: rawNotes || undefined,
    });
  });

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    errors,
  };
}

/**
 * Export full IFLAH Fund Collection ledger to Excel (.xlsx)
 */
export function exportIflahFundLedger(donations: any[], cycleLabel: string) {
  const exportData = donations.map((d, index) => {
    const isCompleted = d.status === 'COMPLETED' || d.paidAmount >= d.targetAmount;
    const isPartial = d.paidAmount > 0 && d.paidAmount < d.targetAmount;
    const statusText = isCompleted ? 'FULLY PAID' : isPartial ? 'PARTIALLY PAID' : 'UNPAID / DUE';

    // Levels breakdown summary if available
    const levelsStr = d.levelsBreakdown
      ? d.levelsBreakdown.map((l: any) => `${l.levelName}: ₹${l.paid}/₹${l.target} (${l.isPaid ? 'PAID' : 'DUE'})`).join(' | ')
      : '';

    return {
      'Sl. No': index + 1,
      'Admission No': d.admissionNumber,
      'Alumnus Name': d.alumniName,
      'Batch': d.alumni?.passoutBatchYear || '',
      'Zone / Chapter': d.alumni?.zoneName || '',
      'Phone': d.alumni?.phone || '',
      'Collection Cycle': d.cycle?.label || cycleLabel,
      'Target Amount (₹)': d.targetAmount,
      'Amount Paid (₹)': d.paidAmount,
      'Balance Due (₹)': d.balanceAmount,
      'Status': statusText,
      'Levels Breakdown': levelsStr,
      'Last Payment Date': d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString('en-IN') : '',
      'Receipt No': d.receiptNumber || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 8 },  // Sl. No
    { wch: 14 }, // Admission No
    { wch: 24 }, // Name
    { wch: 10 }, // Batch
    { wch: 22 }, // Zone
    { wch: 16 }, // Phone
    { wch: 30 }, // Cycle
    { wch: 16 }, // Target
    { wch: 16 }, // Paid
    { wch: 16 }, // Balance
    { wch: 16 }, // Status
    { wch: 40 }, // Levels Breakdown
    { wch: 18 }, // Last Payment Date
    { wch: 22 }, // Receipt No
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IFLAH_Fund_Ledger');
  const safeLabel = cycleLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `IFLAH_Fund_Ledger_${safeLabel}.xlsx`);
}
