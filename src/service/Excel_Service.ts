"use client";

export interface ExcelTrafficRow {
  'Road Name'?: string;
  'Coordinates'?: string;
  'Traffic Volume'?: number;
  'Status'?: string;
  [key: string]: any;
}

export class ExcelService {
  /**
   * Fetches and parses the XLSX file from the server
   */
  static async loadTrafficData(url: string): Promise<ExcelTrafficRow[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }

      // The spreadsheet parser is optional in this workspace. When it is not installed,
      // we return an empty registry instead of failing the build/runtime.
      try {
        const arrayBuffer = await response.arrayBuffer();
        const globalXlsx = (globalThis as typeof globalThis & {
          XLSX?: {
            read: (data: ArrayBuffer, options: { type: 'array' }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
            utils: { sheet_to_json: (sheet: unknown) => ExcelTrafficRow[] };
          };
        }).XLSX;

        if (!globalXlsx) return [];

        const workbook = globalXlsx.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return globalXlsx.utils.sheet_to_json(worksheet) as ExcelTrafficRow[];
      } catch {
        return [];
      }
    } catch (error) {
      console.error("Excel Parsing Error:", error);
      throw error;
    }
  }
}
