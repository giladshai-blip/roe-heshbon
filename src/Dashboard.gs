/**
 * ============================================================
 * רואה חשבון — Dashboard V5.6.1
 * ============================================================
 * דשבורד משפחתי ללא שעונים:
 * - כרטיסי KPI ברורים.
 * - יתרת עו״ש מסומנת כמחושבת, לא חיה.
 * - המלצות ומשימות דינמיות.
 * - אשראי: גם חשיפה משפחתית וגם הכרטיס בעל היחס הגבוה ביותר.
 * - יעד כרית ביטחון ממקור יחיד: גיליון יעדים.
 * ============================================================
 */

const DASHBOARD_V56 = {
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  DASHBOARD_SHEET_NAME: 'לוח מחוונים',
  VERSION: 'Dashboard V5.6.1',
  HELPER_START_COL: 25,
  HELPER_END_COL: 26
};

function installDashboardV56() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V56.SPREADSHEET_ID);
  const sheet = getDashboardV56Sheet_();

  ensureDashboardV56Grid_(sheet);
  sheet.getCharts().forEach(function(chart){ sheet.removeChart(chart); });
  sheet.getDataRange().breakApart();
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);

  try {
    sheet.showColumns(
      DASHBOARD_V56.HELPER_START_COL,
      DASHBOARD_V56.HELPER_END_COL - DASHBOARD_V56.HELPER_START_COL + 1
    );
  } catch (e) {}

  configureDashboardV56Grid_(sheet);
  buildDashboardV56HelperData_(sheet);
  buildDashboardV56Layout_(sheet);
  guardDashboardV561_(sheet);
  applyDashboardV56ConditionalFormatting_(sheet);

  sheet.hideColumns(
    DASHBOARD_V56.HELPER_START_COL,
    DASHBOARD_V56.HELPER_END_COL - DASHBOARD_V56.HELPER_START_COL + 1
  );

  SpreadsheetApp.flush();
  ss.setActiveSheet(sheet);
  sheet.getRange('A1').activate();
  setConfigParam_('גרסת דשבורד','V5.6.1','','Dashboard V5.6.1');
  ss.toast('Dashboard V5.6.1 נבנה בהצלחה', 'רואה חשבון', 8);
}

function refreshDashboardV56() { return installDashboardV56(); }

function clearDashboardV56() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V56.SPREADSHEET_ID);
  const sheet = getDashboardV56Sheet_();
  sheet.getCharts().forEach(function(chart){ sheet.removeChart(chart); });
  sheet.getDataRange().breakApart();
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);
  ss.toast('לוח המחוונים נוקה', 'רואה חשבון', 5);
}

// תאימות לשמות קודמים.
function installDashboardV55() { return installDashboardV56(); }
function refreshDashboardV55() { return refreshDashboardV56(); }
function clearDashboardV55() { return clearDashboardV56(); }
function installCleanDashboardV54() { return installDashboardV56(); }
function refreshCleanDashboardV54() { return refreshDashboardV56(); }
function clearCleanDashboardV54() { return clearDashboardV56(); }

function buildDashboardV56HelperData_(sheet) {
  sheet.getRange('Y1:Z14').setValues([
    ['מדד','ערך'],['יתרת עו״ש מחושבת',''],['סוף חודש צפוי',''],['שפל 30 יום',''],
    ['יחס חיובים למסגרות — כרטיסים עם נתונים',''],['יעד כרית ביטחון',''],['כרית ביטחון נוכחית',''],
    ['פער כרית ביטחון',''],['מאזן חודשי',''],['סנכרון אחרון',''],['אימות עו״ש אחרון',''],
    ['יחס כרטיס מקסימלי',''],['כרטיס בעל יחס מקסימלי',''],['יעד יחס אשראי באחוזים','']
  ]);
  function numeric(expr) {return '=IFERROR(IF(ISNUMBER('+expr+'),'+expr+',"לא זמין"),"לא זמין")';}
  const balance='INDEX(\'הגדרות\'!B:B,MATCH("יתרת עו״ש מחושבת אוטומטית",\'הגדרות\'!A:A,0))';
  sheet.getRange('Z2').setFormula(numeric(balance));
  sheet.getRange('Z3').setFormula(numeric(endOfMonthFormula_().slice(1)));
  sheet.getRange('Z4').setFormula(forecastMinimumFormula_());
  const cards="'כרטיסי אשראי'!";
  const eligible=cards+'G2:G>0,ISNUMBER('+cards+'H2:H),'+cards+'A2:A<>"",REGEXMATCH('+cards+'I2:I,"זהות.*אימות")=FALSE';
  const ratios='FILTER('+cards+'H2:H,'+eligible+')';
  sheet.getRange('Z5').setFormula('=IFERROR(SUM(FILTER('+cards+'E2:E,'+eligible+'))/SUM(FILTER('+cards+'G2:G,'+eligible+'))*100,"לא זמין")');
  const goalRow=findGoalRow_();
  sheet.getRange('Z6').setFormula(numeric("'יעדים'!B"+goalRow));
  sheet.getRange('Z7').setFormula(numeric("'יעדים'!C"+goalRow));
  sheet.getRange('Z8').setFormula('=IF(AND(ISNUMBER(Z6),ISNUMBER(Z7)),MAX(0,Z6-Z7),"לא זמין")');
  sheet.getRange('Z9').setFormula('=IF(AND(ISNUMBER(\'גאנט תזרים שנתי\'!B5),ISNUMBER(\'גאנט תזרים שנתי\'!B7),ISNUMBER(\'גאנט תזרים שנתי\'!B9)),\'גאנט תזרים שנתי\'!B5+\'גאנט תזרים שנתי\'!B7-\'גאנט תזרים שנתי\'!B9,"לא זמין")');
  sheet.getRange('Z10').setFormula('=IFERROR(INDEX(\'הגדרות\'!B:B,MATCH("תאריך רענון אחרון",\'הגדרות\'!A:A,0)),"")');
  sheet.getRange('Z11').setFormula('=IFERROR(INDEX(\'הגדרות\'!B:B,MATCH("תאריך ושעת יתרת עו״ש",\'הגדרות\'!A:A,0)),"")');
  sheet.getRange('Z12').setFormula('=IFERROR(MAX('+ratios+')*100,"לא זמין")');
  // Filter labels and ratios using identical predicates; gaps do not shift the label.
  sheet.getRange('Z13').setFormula('=IFERROR(INDEX(FILTER('+cards+'C2:C,'+eligible+'),MATCH(MAX('+ratios+'),'+ratios+',0)),"לא זמין")');
  sheet.getRange('Z14').setFormula(numeric('INDEX(\'הגדרות\'!B:B,MATCH("יעד ניצול אשראי",\'הגדרות\'!A:A,0))*100'));
  sheet.getRange('Z2:Z4').setNumberFormat('#,##0.00 ₪');
  sheet.getRange('Z5').setNumberFormat('0.0');
  sheet.getRange('Z6:Z9').setNumberFormat('#,##0.00 ₪');
  sheet.getRange('Z10:Z11').setNumberFormat('dd/mm/yyyy hh:mm');
  sheet.getRange('Z12:Z14').setNumberFormat('0.0');
}

function buildDashboardV56Layout_(sheet) {
  mergeAndSetV56_(sheet,'A1:P2','המצב הכספי שלנו');
  sheet.getRange('A1:P2')
    .setBackground('#16324F').setFontColor('#FFFFFF').setFontSize(22)
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

  mergeAndSetV56_(
    sheet,'A3:P3',
    'תמונה פשוטה וברורה של המצב — יתרת העו״ש מחושבת מעוגן מאומת ועסקאות מסונכרנות, לא יתרה חיה מהבנק'
  );
  sheet.getRange('A3:P3')
    .setBackground('#EAF1F8').setFontColor('#38506A').setFontSize(10)
    .setHorizontalAlignment('center');

  buildMetricCardV56_(sheet,'A5:D8','יתרת עו״ש מחושבת','=Z2','#,##0 ₪');
  buildMetricCardV56_(sheet,'E5:H8','סוף חודש צפוי','=Z3','#,##0 ₪');
  buildMetricCardV56_(sheet,'I5:L8','שפל ב־30 יום','=Z4','#,##0 ₪');
  buildMetricCardV56_(sheet,'M5:P8','מאזן חודשי','=Z9','#,##0 ₪');

  buildSectionHeaderV56_(sheet,'A10:H10','מה זה אומר');
  mergeAndSetV56_(sheet,'A11:H14','');
  sheet.getRange('A11').setFormula(
    '=IF($Z$3<0,"אם לא נעשה שינוי, סוף החודש צפוי להיות במינוס של "&TEXT(ABS($Z$3),"#,##0 ₪")&". נקודת השפל הצפויה ב־30 יום היא "&TEXT($Z$4,"#,##0 ₪")&".",IF($Z$9<0,"התקציב החודשי עדיין שלילי ב־"&TEXT(ABS($Z$9),"#,##0 ₪")&" לחודש.","התזרים החודשי מאוזן או חיובי. אפשר לעבור בהדרגה לבניית כרית ביטחון וחיסכון."))'
  );
  styleTextPanelV56_(sheet.getRange('A11:H14'));

  buildSectionHeaderV56_(sheet,'I10:P10','המלצה מרכזית');
  mergeAndSetV56_(sheet,'I11:P14','');
  sheet.getRange('I11').setFormula(
    '=IF($Z$3<0,"המטרה הראשונה היא לצמצם את הפער עד סוף החודש בלי להגדיל אשראי חדש. בדקו הוצאות משתנות, תשלומים שניתן לדחות וחיובים שניתן להזיז למועד בטוח יותר.",IF($Z$9<0,"המטרה הבאה היא לסגור גירעון חודשי של "&TEXT(ABS($Z$9),"#,##0 ₪")&".",IF($Z$7<$Z$6,"התזרים יציב. עכשיו בונים כרית ביטחון. חסרים "&TEXT($Z$8,"#,##0 ₪")&" ליעד.","המצב יציב יחסית. אפשר להתקדם לחיסכון והשקעות בהתאם לסדר העדיפויות.")))'
  );
  styleTextPanelV56_(sheet.getRange('I11:P14'));
  sheet.getRange('I11:P14').setBackground('#FFF7E6');

  buildSectionHeaderV56_(sheet,'A16:P16','משימות לביצוע');
  buildTaskRowV56_(
    sheet,17,'1','=IF($Z$3<0,"דחוף","מעקב")',
    '=IF($Z$3<0,"עברו על ההוצאות עד סוף החודש וסמנו לפחות 3 הוצאות שניתן לדחות, לצמצם או לבטל.","שמרו על מסגרת ההוצאות עד סוף החודש.")'
  );
  buildTaskRowV56_(
    sheet,18,'2','=IF($Z$9<0,"חשוב","בוצע")',
    '=IF($Z$9<0,"מצאו שיפור קבוע של "&TEXT(ABS($Z$9),"#,##0 ₪")&" לחודש באמצעות צמצום הוצאה או תוספת הכנסה.","המאזן החודשי אינו שלילי כרגע — המשיכו לעקוב.")'
  );
  buildTaskRowV56_(
    sheet,19,'3','=IF($Z$12>=50,"דחוף",IF($Z$12>=30,"חשוב","תקין"))',
    '=IF($Z$12>=30,"היעד הוא פחות מ-30% לכל כרטיס. הכרטיס בעל היחס הגבוה ביותר הוא "&$Z$13&" עם "&TEXT($Z$12,"0.0")&"%. הימנעו מרכישות חדשות בתשלומים בכרטיס זה עד לירידה מתחת ליעד.","כל הכרטיסים המאומתים מתחת ליעד 30%.")'
  );
  buildTaskRowV56_(
    sheet,20,'4','=IF($Z$8>0,"בהמשך","בוצע")',
    '=IF($Z$8>0,"לאחר איזון התזרים, התחילו לבנות כרית ביטחון. חסרים ליעד "&TEXT($Z$8,"#,##0 ₪")&".","יעד כרית הביטחון הושלם.")'
  );

  buildSectionHeaderV56_(sheet,'A22:H22','יציבות פיננסית');
  mergeAndSetV56_(sheet,'A23:D23','אשראי');
  mergeAndSetV56_(sheet,'E23:H23','כרית ביטחון');
  sheet.getRange('A24:D26').merge();
  sheet.getRange('E24:H26').merge();
  sheet.getRange('A24').setFormula(
    '="משפחתי: "&TEXT($Z$5,"0.0")&"% | מקסימום בכרטיס: "&TEXT($Z$12,"0.0")&"% — "&$Z$13'
  );
  sheet.getRange('E24').setFormula('=TEXT($Z$7,"#,##0 ₪")&" מתוך "&TEXT($Z$6,"#,##0 ₪")');
  styleMiniMetricV56_(sheet.getRange('A23:D26'));
  styleMiniMetricV56_(sheet.getRange('E23:H26'));

  buildSectionHeaderV56_(sheet,'I22:P22','עדכניות הנתונים');
  mergeAndSetV56_(sheet,'I23:L23','סנכרון אחרון');
  mergeAndSetV56_(sheet,'M23:P23','אימות עו״ש אחרון');
  sheet.getRange('I24:L26').merge();
  sheet.getRange('M24:P26').merge();
  sheet.getRange('I24').setFormula('=IF($Z$10="","לא ידוע",TEXT($Z$10,"dd/mm/yyyy hh:mm"))');
  sheet.getRange('M24').setFormula('=IF($Z$11="","לא ידוע",TEXT($Z$11,"dd/mm/yyyy hh:mm"))');
  styleMiniMetricV56_(sheet.getRange('I23:L26'));
  styleMiniMetricV56_(sheet.getRange('M23:P26'));

  mergeAndSetV56_(sheet,'A28:P29','סדר העדיפויות: איזון חודשי → יציאה מהמינוס → כרית ביטחון → חיסכון → השקעות');
  sheet.getRange('A28:P29')
    .setBackground('#F2F5F8').setFontColor('#536273').setFontSize(10)
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
}

function configureDashboardV56Grid_(sheet) {
  for (let c=1;c<=16;c++) sheet.setColumnWidth(c,78);
  for (let r=1;r<=35;r++) sheet.setRowHeight(r,30);
  sheet.setRowHeight(1,34); sheet.setRowHeight(2,34); sheet.setRowHeight(3,28);
  sheet.setRowHeights(11,4,34); sheet.setRowHeights(17,4,34); sheet.setRowHeights(24,3,34);
}

function buildMetricCardV56_(sheet,rangeA1,label,formula,numberFormat) {
  const range=sheet.getRange(rangeA1), row=range.getRow(), col=range.getColumn(), cols=range.getNumColumns();
  sheet.getRange(row,col,1,cols).merge();
  sheet.getRange(row+1,col,range.getNumRows()-1,cols).merge();
  sheet.getRange(row,col).setValue(label).setFontSize(10).setFontWeight('bold').setFontColor('#5B6B7A').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.getRange(row+1,col).setFormula(formula).setNumberFormat(numberFormat).setFontSize(20).setFontWeight('bold').setFontColor('#16324F').setHorizontalAlignment('center').setVerticalAlignment('middle');
  range.setBackground('#FFFFFF').setBorder(true,true,true,true,false,false,'#D7E0E8',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function buildSectionHeaderV56_(sheet,rangeA1,text) {
  mergeAndSetV56_(sheet,rangeA1,text);
  sheet.getRange(rangeA1).setBackground('#DCEAF7').setFontColor('#16324F').setFontSize(12).setFontWeight('bold').setHorizontalAlignment('right').setVerticalAlignment('middle');
}

function buildTaskRowV56_(sheet,row,number,priorityFormula,taskFormula) {
  sheet.getRange(row,1,1,2).merge();
  sheet.getRange(row,3,1,3).merge();
  sheet.getRange(row,6,1,11).merge();
  sheet.getRange(row,1).setValue(number).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(row,3).setFormula(priorityFormula).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(row,6).setFormula(taskFormula).setWrap(true).setHorizontalAlignment('right');
  sheet.getRange(row,1,1,16).setBackground('#FFFFFF').setVerticalAlignment('middle').setBorder(false,false,true,false,false,false,'#E3E8ED',SpreadsheetApp.BorderStyle.SOLID);
}

function styleTextPanelV56_(range) {
  range.setBackground('#FFFFFF').setFontColor('#2B3A48').setFontSize(11).setWrap(true).setHorizontalAlignment('right').setVerticalAlignment('middle').setBorder(true,true,true,true,false,false,'#D7E0E8',SpreadsheetApp.BorderStyle.SOLID);
}

function styleMiniMetricV56_(range) {
  range.setBackground('#FFFFFF').setFontColor('#2B3A48').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true,true,true,true,false,false,'#D7E0E8',SpreadsheetApp.BorderStyle.SOLID);
  const sh=range.getSheet(), row=range.getRow(), col=range.getColumn(), rows=range.getNumRows(), cols=range.getNumColumns();
  sh.getRange(row,col,1,cols).setFontWeight('bold').setFontColor('#5B6B7A');
  sh.getRange(row+1,col,Math.max(1,rows-1),cols).setFontSize(14).setFontWeight('bold').setFontColor('#16324F').setWrap(true);
}

function applyDashboardV56ConditionalFormatting_(sheet) {
  const rules=[];
  addCardRulesV56_(rules,sheet,'A5:D8','$Z$2');
  addCardRulesV56_(rules,sheet,'E5:H8','$Z$3');
  addCardRulesV56_(rules,sheet,'I5:L8','$Z$4');
  addCardRulesV56_(rules,sheet,'M5:P8','$Z$9');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(ISNUMBER($Z$12),ISNUMBER($Z$14),$Z$12>=$Z$14)').setBackground('#FFF7E6').setRanges([sheet.getRange('A23:D26')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(ISNUMBER($Z$12),ISNUMBER($Z$14),$Z$12<$Z$14)').setBackground('#ECF8F0').setRanges([sheet.getRange('A23:D26')]).build()
  );
  sheet.setConditionalFormatRules(rules);
}

function addCardRulesV56_(rules,sheet,rangeA1,helperRef) {
  const range=sheet.getRange(rangeA1);
  rules.push(
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(ISNUMBER('+helperRef+'),'+helperRef+'<0)').setBackground('#FDECEC').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(ISNUMBER('+helperRef+'),'+helperRef+'>=0,'+helperRef+'<1500)').setBackground('#FFF7E6').setRanges([range]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(ISNUMBER('+helperRef+'),'+helperRef+'>=1500)').setBackground('#ECF8F0').setRanges([range]).build()
  );
}

function mergeAndSetV56_(sheet,rangeA1,value) {
  const range=sheet.getRange(rangeA1);
  range.merge();
  range.getCell(1,1).setValue(value);
  return range;
}

function ensureDashboardV56Grid_(sheet) {
  const requiredColumns=26, requiredRows=35;
  if(sheet.getMaxColumns()<requiredColumns) sheet.insertColumnsAfter(sheet.getMaxColumns(),requiredColumns-sheet.getMaxColumns());
  if(sheet.getMaxRows()<requiredRows) sheet.insertRowsAfter(sheet.getMaxRows(),requiredRows-sheet.getMaxRows());
}

function getDashboardV56Sheet_() {
  const ss=SpreadsheetApp.openById(DASHBOARD_V56.SPREADSHEET_ID);
  const sheet=ss.getSheetByName(DASHBOARD_V56.DASHBOARD_SHEET_NAME);
  if(!sheet) throw new Error('לא נמצא גיליון בשם "'+DASHBOARD_V56.DASHBOARD_SHEET_NAME+'".');
  return sheet;
}

function forecastMinimumFormula_() {
  return '=IFERROR(LET(d,{\'תזרים\'!A2:A32;\'גאנט תזרים שנתי\'!A16:A380},v,{\'תזרים\'!G2:G32;\'גאנט תזרים שנתי\'!I16:I380},valid,(d>=TODAY())*(d<TODAY()+30)*ISNUMBER(v),IF(COUNTUNIQUE(FILTER(d,valid))=30,MIN(FILTER(v,valid)),"לא זמין")),"לא זמין")';
}

function guardDashboardV561_(sheet) {
  sheet.getRange('A3').setValue('יתרת העו״ש היא אומדן מעוגן מאומת. התחזיות תלויות בתאריכים ובהנחות שבמערכת.');
  const essential='AND(ISNUMBER($Z$2),ISNUMBER($Z$3),ISNUMBER($Z$4),ISNUMBER($Z$6),ISNUMBER($Z$7),ISNUMBER($Z$8),ISNUMBER($Z$9))';
  ['A11','I11','F17','F18'].forEach(function(cell){
    const old=sheet.getRange(cell).getFormula();
    sheet.getRange(cell).setFormula('=IF('+essential+','+old.slice(1)+',"חסרים נתונים לתמונה מלאה. יש לבדוק את הסנכרון, העוגן ותחזית 30 הימים.")');
  });
  ['C17','C18'].forEach(function(cell){
    const old=sheet.getRange(cell).getFormula();
    sheet.getRange(cell).setFormula('=IF('+essential+','+old.slice(1)+',"דורש בדיקה")');
  });
  sheet.getRange('C19').setFormula('=IF(AND(ISNUMBER($Z$12),ISNUMBER($Z$14)),IF($Z$12>=$Z$14,"חשוב","מעקב"),"דורש אימות")');
  sheet.getRange('F19').setFormula('=IF(AND(ISNUMBER($Z$12),ISNUMBER($Z$14)),IF($Z$12>=$Z$14,"יחס החיוב הגבוה ביותר הוא "&TEXT($Z$12,"0.0")&"% בכרטיס "&$Z$13&"; היעד הוא "&TEXT($Z$14,"0.0")&"%. בדקו את היתרה הפנויה אצל המנפיק.","בכרטיסים עם נתונים זמינים יחס החיוב מתחת ליעד; המדד אינו כולל את כלל ההתחייבויות."),"יש להשלים או לאמת מסגרות, חיובים וזהות כרטיסים.")');
  sheet.getRange('A24').setFormula('=IF(AND(ISNUMBER($Z$5),ISNUMBER($Z$12)),"יחס חיובים מצרפי: "&TEXT($Z$5,"0.0")&"% | מקסימום: "&TEXT($Z$12,"0.0")&"% — "&$Z$13,"נתוני אשראי חלקיים — דורש אימות")');
  sheet.getRange('A24').setNote('יחס החיוב הקרוב למסגרת בלבד, לא ניצול כולל. כרטיסים ללא מסגרת/חיוב או עם סתירת זהות מוחרגים; מסגרות משותפות עשויות לגרום לכפל במכנה.');
  sheet.getRange('E24').setFormula('=IF(AND(ISNUMBER($Z$7),ISNUMBER($Z$6)),TEXT($Z$7,"#,##0 ₪")&" מתוך "&TEXT($Z$6,"#,##0 ₪"),"לא זמין")');
  ['C20','F20'].forEach(function(cell){
    const old=sheet.getRange(cell).getFormula();sheet.getRange(cell).setFormula('=IF(ISNUMBER($Z$8),'+old.slice(1)+',"דורש אימות")');
  });
}
