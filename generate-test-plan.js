const fs = require('fs');
const { exec } = require('child_process');
const figures = require('figures');
const Excel = require('exceljs');

const generateTestPlan = () => {
  fs.unlink('test-plan.xlsx', (err) => {
    if (err) console.log(err); else console.log('test-plan.xlsx was deleted');
  });

  // eslint-disable-next-line no-unused-vars
  exec('npx codeceptjs dry-run', async (error, stdout, stderr) => {
    const book = new Excel.Workbook();
    const sheet = book.addWorksheet('IntegrationTests');
    const sheetMetrics = book.addWorksheet('Metrics');
    sheet.font = { name: 'Courier New' };
    let currentRow = 1;
    let suiteCount = 1;
    let testCount = 1;
    let automated = 0;
    let manual = 0;
    sheet.getCell(`A${currentRow}`).value = 'S.NO.';
    sheet.getCell(`B${currentRow}`).value = 'TEST';
    sheet.getCell(`C${currentRow}`).value = 'TYPE';
    sheet.getCell(`D${currentRow}`).value = 'RESULT';
    sheet.getCell(`E${currentRow}`).value = 'ENV';
    sheet.getCell(`F${currentRow}`).value = 'TESTED BY';
    sheet.getCell(`G${currentRow}`).value = 'JIRA ID';
    sheet.getRow(currentRow).font = { size: 16, bold: true };
    // sheet.getRow(currentRow).fill = { type: 'mediumGray' };
    currentRow += 1;
    const rows = stdout.split('\n');
    rows.forEach((row) => {
      if (row.includes('--')) {
        sheet.getCell(`A${currentRow}`).value = `SUITE ${suiteCount}`;
        suiteCount += 1;
        // eslint-disable-next-line prefer-destructuring
        sheet.getCell(`B${currentRow}`).value = row.split('--')[0];
        sheet.getRow(currentRow).font = { size: 14, italic: true };
        // sheet.getRow(currentRow).fill = { type: 'lightGray' };
        currentRow += 1;
      }
      if (row.includes(figures.checkboxOff)) {
        sheet.getCell(`A${currentRow}`).value = testCount;
        testCount += 1;
        sheet.getCell(`B${currentRow}`).value = row;
        sheet.getRow(currentRow).font = { size: 12 };
        if (row.includes('@manual')) {
          sheet.getCell(`C${currentRow}`).value = 'MANUAL';
          manual += 1;
        } else {
          sheet.getCell(`C${currentRow}`).value = 'AUTOMATED';
          sheet.getCell(`D${currentRow}`).value = '';
          sheet.getCell(`E${currentRow}`).value = 'jenkins';
          sheet.getCell(`F${currentRow}`).value = 'Jenkins';
          automated += 1;
        }
        currentRow += 1;
      }
    });
    // write metrics
    sheetMetrics.getCell('A1').value = 'SUITES';
    sheetMetrics.getCell('C1').value = suiteCount - 2;
    sheetMetrics.getCell('A2').value = 'TESTS';
    sheetMetrics.getCell('B2').value = 'AUTOMATED';
    sheetMetrics.getCell('B3').value = 'MANUAL';
    sheetMetrics.getCell('B3').value = 'TOTAL';
    sheetMetrics.getCell('C2').value = automated;
    sheetMetrics.getCell('C3').value = manual;
    sheetMetrics.getCell('C4').value = testCount - 1;
    await book.xlsx.writeFile('test-plan.xlsx');
  });
};

generateTestPlan();
