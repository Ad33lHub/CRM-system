import ExcelJS from 'exceljs';
import path from 'path';

async function run() {
  const wb = new ExcelJS.Workbook();
  const filePath =
    'c:\\Users\\Administrator\\Desktop\\New Compressed (zipped) Folder\\CRM_Project_Tracker.xlsx';
  await wb.xlsx.readFile(filePath);
  console.log(
    'Worksheets:',
    wb.worksheets.map((w) => w.name)
  );
  for (const sheet of wb.worksheets) {
    console.log(`\n--- Sheet: ${sheet.name} ---`);
    let rowCount = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowCount < 25) {
        console.log(`Row ${rowNumber}:`, row.values);
        rowCount++;
      }
    });
  }
}

run().catch(console.error);
