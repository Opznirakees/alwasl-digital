import ExcelJS from 'exceljs';

export type ExcelCellValue = string | number | boolean | Date | null | undefined;
export type ExcelExportRow = Record<string, ExcelCellValue>;

interface ExcelWorkbookInput {
  sheetName: string;
  rows: ExcelExportRow[];
}

function safeSheetName(name: string) {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim();
  return (cleaned || 'Export').slice(0, 31);
}

function columnWidth(header: string, rows: ExcelExportRow[]) {
  const maxValueLength = rows.reduce((max, row) => {
    const value = row[header];
    const text = value instanceof Date ? value.toISOString() : value === null || value === undefined ? '' : String(value);
    return Math.max(max, text.length);
  }, header.length);

  return Math.min(Math.max(maxValueLength + 2, 12), 42);
}

export async function createExcelWorkbookBuffer(input: ExcelWorkbookInput) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Al-Wasl Digital';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(safeSheetName(input.sheetName), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headers = input.rows.length ? Object.keys(input.rows[0]) : ['message'];
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: columnWidth(header, input.rows),
  }));

  if (input.rows.length) {
    worksheet.addRows(input.rows);
  } else {
    worksheet.addRow({ message: 'No data available' });
  }

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(input.rows.length + 1, 2), column: headers.length },
  };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}
