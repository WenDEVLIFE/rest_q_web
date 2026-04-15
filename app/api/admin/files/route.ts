import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { readdirSync, statSync } from 'fs';

const MODELS_DIR = path.join(process.cwd(), 'models');

// Ensure directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// ============================================================================
// STRICT VALIDATION - ONLY 3 APPROVED FILES ALLOWED
// ============================================================================

const ALLOWED_FILES = [
  'VEHICLE SPEED.kml',
  'TRAFFIC VOLUME.kml',
  'SPEED-AND-TRAFFIC-VOLUME.xlsx'
];

const FILE_SCHEMAS: Record<string, any> = {
  'VEHICLE SPEED.kml': {
    type: 'KML',
    requiredFields: ['Latitude', 'Longitude', 'Speed'],
    maxSize: 50 * 1024 * 1024,
    description: 'GPS traces with vehicle speed vectors',
    format: 'KML with <Placemark> elements containing latitude, longitude, speed attributes'
  },
  'TRAFFIC VOLUME.kml': {
    type: 'KML',
    requiredFields: ['Latitude', 'Longitude', 'VehicleCount', 'Hour'],
    maxSize: 50 * 1024 * 1024,
    description: 'Vehicle count per road segment hourly',
    format: 'KML with road segments and volume data in properties'
  },
  'SPEED-AND-TRAFFIC-VOLUME.xlsx': {
    type: 'XLSX',
    requiredFields: ['Road_Segment', 'Speed', 'Volume', 'Occupancy', 'Risk_Score'],
    maxSize: 50 * 1024 * 1024,
    description: 'Correlated traffic metrics',
    format: 'Excel sheet with columns: Road_Segment, Speed (km/h), Volume (count), Occupancy (%), Risk_Score (0-10)'
  }
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function validateFileFormat(filename: string, content: Buffer): { valid: boolean; error?: string } {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.kml') {
    const kmlText = content.toString('utf-8', 0, Math.min(5000, content.length));
    
    if (!kmlText.includes('<?xml') || !kmlText.includes('<kml')) {
      return { valid: false, error: 'Invalid KML: missing XML declaration or KML root element' };
    }
    if (!kmlText.includes('<Placemark>')) {
      return { valid: false, error: 'Invalid KML: no Placemark elements found' };
    }
    if (!kmlText.includes('<coordinates>')) {
      return { valid: false, error: 'Invalid KML: no coordinate data found' };
    }
    return { valid: true };
  }

  if (ext === '.xlsx' || ext === '.xls') {
    if (content.length < 4) {
      return { valid: false, error: 'Invalid XLSX: file too small' };
    }
    const magicBytes = content.slice(0, 4).toString('hex');
    if (!magicBytes.startsWith('504b')) {
      return { valid: false, error: 'Invalid XLSX: not a valid Excel file' };
    }
    return { valid: true };
  }

  return { valid: false, error: `Unsupported format: ${ext}. Only .kml and .xlsx allowed.` };
}

export async function GET() {
  try {
    const files = readdirSync(MODELS_DIR);
    const fileDetails = files.map(file => {
      const filePath = path.join(MODELS_DIR, file);
      const stats = statSync(filePath);
      const schema = FILE_SCHEMAS[file];
      
      return {
        name: file,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        type: path.extname(file).toLowerCase(),
        modifiedAt: stats.mtime,
        isValid: !!schema,
        schema: schema || null,
      };
    });

    return NextResponse.json({ success: true, files: fileDetails }, { status: 200 });
  } catch (error) {
    console.error('Error reading models directory:', error);
    return NextResponse.json({ success: false, error: 'Failed to read files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    // VALIDATION 1: Filename must be in allowlist
    if (!ALLOWED_FILES.includes(filename)) {
      return NextResponse.json({
        success: false,
        error: `❌ REJECTED: "${filename}" not in approved list.\nAllowed: ${ALLOWED_FILES.join(', ')}`
      }, { status: 400 });
    }

    // VALIDATION 2: File size check
    const schema = FILE_SCHEMAS[filename];
    if (file.size > schema.maxSize) {
      return NextResponse.json({
        success: false,
        error: `❌ REJECTED: File too large. Max: ${formatFileSize(schema.maxSize)}, got: ${formatFileSize(file.size)}`
      }, { status: 400 });
    }

    // VALIDATION 3: Format validation (KML/XLSX structure)
    const buffer = await file.arrayBuffer();
    const bufferData = Buffer.from(buffer);
    const formatValidation = validateFileFormat(filename, bufferData);
    
    if (!formatValidation.valid) {
      return NextResponse.json({
        success: false,
        error: `❌ REJECTED: ${formatValidation.error}`
      }, { status: 400 });
    }

    // VALIDATION 4: Malicious content check
    const content = bufferData.toString('utf-8', 0, Math.min(2000, bufferData.length));
    if (content.includes('<script>') || content.includes('javascript:')) {
      return NextResponse.json({
        success: false,
        error: '❌ REJECTED: File contains malicious code'
      }, { status: 400 });
    }

    // ALL VALIDATIONS PASSED - Save file
    const filePath = path.join(MODELS_DIR, filename);

    try {
      await fs.promises.writeFile(filePath, bufferData);
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save file to disk'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ SUCCESS: "${filename}" validated and loaded`,
      file: filename,
      schema: schema,
      validation: {
        size: formatFileSize(file.size),
        format: schema.type,
        requiredFields: schema.requiredFields
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      success: false,
      error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { filename } = await req.json();

    if (!ALLOWED_FILES.includes(filename)) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete "${filename}". Only specific model files can be removed.`
      }, { status: 403 });
    }

    const filePath = path.join(MODELS_DIR, filename);

    if (!filePath.startsWith(MODELS_DIR)) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete file'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ "${filename}" deleted`
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
