"use client";

import * as XLSX from 'xlsx';

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
  static async loadTrafficData(filename: string = 'SPEED-AND-TRAFFIC-VOLUME.xlsx'): Promise<ExcelTrafficRow[]> {
    try {
      const response = await fetch(`/api/admin/files/${encodeURIComponent(filename)}`);
      if (!response.ok) {
        return [];
      }

      try {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return XLSX.utils.sheet_to_json(worksheet) as ExcelTrafficRow[];
      } catch {
        return [];
      }
    } catch (error) {
      console.error("Excel Parsing Error:", error);
      throw error;
    }
  }
}
