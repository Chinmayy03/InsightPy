import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { APP_CONFIG } from '../config';
import type { DataRow, ParsedFileResult } from '../types/analysis';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

export function validateUploadFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!hasValidExt) {
    return `Unsupported file format for "${file.name}". Please upload a .csv, .xlsx, or .xls file.`;
  }
  if (file.size === 0) {
    return `The selected file "${file.name}" is empty (0 bytes).`;
  }
  if (file.size > APP_CONFIG.MAX_FILE_SIZE_BYTES) {
    return `File exceeds the ${APP_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB browser limit.`;
  }
  return null;
}

export async function inspectExcelWorkbook(file: File): Promise<{
  workbook: XLSX.WorkBook;
  sheetNames: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error(`No worksheets found inside "${file.name}".`);
  }
  return { workbook, sheetNames: workbook.SheetNames };
}

export function extractSheetRows(
  workbook: XLSX.WorkBook,
  sheetName: string
): DataRow[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" could not be read.`);
  }
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: true,
  });

  if (jsonRows.length === 0) {
    throw new Error(`Worksheet "${sheetName}" has no data rows.`);
  }

  return jsonRows.map((row) => {
    const normalized: DataRow = {};
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) {
        normalized[k] = Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
        normalized[k] = v;
      } else {
        normalized[k] = String(v);
      }
    }
    return normalized;
  });
}

export async function parseCsvFile(file: File): Promise<ParsedFileResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`CSV parsing failed: ${results.errors[0].message}`));
          return;
        }
        const rows = results.data as DataRow[];
        if (rows.length === 0) {
          reject(new Error(`"${file.name}" contains no rows after header parsing.`));
          return;
        }
        const columns = Object.keys(rows[0] ?? {});
        if (columns.length === 0) {
          reject(new Error(`"${file.name}" contains no valid column headers.`));
          return;
        }
        resolve({
          fileName: file.name,
          sourceType: 'csv',
          sheetNames: [],
          rows,
        });
      },
      error: (err) => {
        reject(new Error(`Failed to read CSV "${file.name}": ${err.message}`));
      },
    });
  });
}
