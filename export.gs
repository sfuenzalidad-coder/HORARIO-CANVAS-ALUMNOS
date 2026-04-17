/*******************************
 * STATIC EXPORT FOR GITHUB PAGES
 * --------------------------------
 * Use this Apps Script only to export static JSON files
 * from your spreadsheet. Students should NOT use this
 * script directly.
 *******************************/
const SPREADSHEET_ID = '';
// If bound to the same spreadsheet, leave empty.
// If standalone, place the Google Sheet ID here.

const SHEET_NAME = 'HORARIO';
const PROFESORES_SHEET_NAME = 'PROFESORES';

const HEADER_ROW = 0;
// Leave 0 to auto-detect.

const EXPORT_FOLDER_ID = 'PUT_DRIVE_FOLDER_ID_HERE';
// Drive folder where data.json, config.json and profesores.json will be written.

/*******************************
 * MANUAL ENTRY POINTS
 *******************************/
function exportAllStaticFiles() {
  exportHorarioStaticData();
  exportConfigStaticData();
  exportProfesoresStaticData();
}

function exportHorarioStaticData() {
  const payload = buildStaticPayload_();
  writeJsonFile_('data.json', payload);
}

function exportConfigStaticData() {
  const payload = {
    planOptions: ['PE2026', 'PE 2020, 2022, etc.']
  };
  writeJsonFile_('config.json', payload);
}

function exportProfesoresStaticData() {
  // WARNING:
  // This creates a JSON file containing RUTs. If you publish it in a public
  // GitHub Pages site, anyone could inspect/download it.
  // Only use this if you accept that limitation.
  const sh = getProfesoresSheet_();
  const values = sh.getDataRange().getDisplayValues();
  const ruts = new Set();

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const norm = normalizeRut_(values[r][c]);
      if (norm && /^[0-9K]+$/i.test(norm)) {
        ruts.add(norm);
      }
    }
  }

  writeJsonFile_('profesores.json', {
    generatedAt: new Date().toISOString(),
    ruts: [...ruts].sort()
  });
}

/*******************************
 * OPTIONAL MENU
 *******************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Exportación Web')
    .addItem('Exportar archivos estáticos', 'exportAllStaticFiles')
    .addToUi();
}

/*******************************
 * FILE WRITING
 *******************************/
function writeJsonFile_(fileName, payload) {
  if (!EXPORT_FOLDER_ID || EXPORT_FOLDER_ID === 'PUT_DRIVE_FOLDER_ID_HERE') {
    throw new Error('Debes definir EXPORT_FOLDER_ID antes de exportar.');
  }

  const folder = DriveApp.getFolderById(EXPORT_FOLDER_ID);
  const json = JSON.stringify(payload, null, 2);

  const existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  folder.createFile(fileName, json, MimeType.PLAIN_TEXT);
}

/*******************************
 * SPREADSHEET HELPERS
 *******************************/
function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSourceSheet_() {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    throw new Error(
      `No se encontró la hoja "${SHEET_NAME}". Hojas disponibles: ` +
      ss.getSheets().map(s => s.getName()).join(' | ')
    );
  }

  return sh;
}

function getProfesoresSheet_() {
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(PROFESORES_SHEET_NAME);

  if (!sh) {
    throw new Error(`No se encontró la hoja "${PROFESORES_SHEET_NAME}".`);
  }

  return sh;
}

/*******************************
 * TEXT HELPERS
 *******************************/
function normalizeText_(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function normalizeRut_(value) {
  return String(value == null ? '' : value)
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function valueAt_(row, index) {
  return index >= 0 ? row[index] : '';
}

function formatCell_(v) {
  return v == null ? '' : String(v);
}

/*******************************
 * HEADER DETECTION
 *******************************/
function detectHeaderRow_(values) {
  if (HEADER_ROW && HEADER_ROW > 0) return HEADER_ROW - 1;

  const maxRows = Math.min(values.length, 25);

  for (let r = 0; r < maxRows; r++) {
    const row = values[r].map(normalizeText_);
    const rowSet = new Set(row);

    let score = 0;
    if (rowSet.has('AREA')) score++;
    if (rowSet.has('PLAN DE ESTUDIO')) score++;
    if (rowSet.has('MATERIA')) score++;
    if (rowSet.has('CURSO')) score++;
    if (rowSet.has('SECC.') || rowSet.has('SECCION') || rowSet.has('SECCIONES')) score++;
    if (rowSet.has('TITULO')) score++;
    if (rowSet.has('NRC')) score++;
    if (rowSet.has('SALA')) score++;
    if (rowSet.has('LUNES')) score++;
    if (rowSet.has('MARTES')) score++;
    if (rowSet.has('MIERCOLES') || rowSet.has('MIÉRCOLES')) score++;
    if (rowSet.has('JUEVES')) score++;
    if (rowSet.has('VIERNES')) score++;
    if (rowSet.has('INICIO')) score++;
    if (rowSet.has('FIN')) score++;
    if (rowSet.has('TIPO') || rowSet.has('TIPO DE REUNION')) score++;

    if (score >= 5) return r;
  }

  throw new Error(
    'No se pudo detectar automáticamente la fila de encabezados. Define HEADER_ROW manualmente.'
  );
}

/*******************************
 * HEADER MAP
 *******************************/
function headerMap_(headers) {
  const map = {};
  headers.forEach((h, i) => {
    map[normalizeText_(h)] = i;
  });
  return map;
}

function findHeaderIndex_(map, candidates) {
  for (const c of candidates) {
    const idx = map[normalizeText_(c)];
    if (idx !== undefined) return idx;
  }
  return -1;
}

function getColumnIndexes_(headers) {
  const map = headerMap_(headers);

  return {
    area: findHeaderIndex_(map, ['AREA']),
    plan: findHeaderIndex_(map, ['PLAN DE ESTUDIO']),
    nrc: findHeaderIndex_(map, ['NRC']),
    conector: findHeaderIndex_(map, ['CONECTOR DE LIGA', 'CONECTOR']),
    lc: findHeaderIndex_(map, ['LC']),
    materia: findHeaderIndex_(map, ['MATERIA']),
    curso: findHeaderIndex_(map, ['CURSO']),
    seccion: findHeaderIndex_(map, ['SECC.', 'SECCIONES', 'SECCION']),
    titulo: findHeaderIndex_(map, ['TITULO']),
    lunes: findHeaderIndex_(map, ['LUNES']),
    martes: findHeaderIndex_(map, ['MARTES']),
    miercoles: findHeaderIndex_(map, ['MIERCOLES', 'MIÉRCOLES']),
    jueves: findHeaderIndex_(map, ['JUEVES']),
    viernes: findHeaderIndex_(map, ['VIERNES']),
    inicio: findHeaderIndex_(map, ['INICIO']),
    fin: findHeaderIndex_(map, ['FIN']),
    sala: findHeaderIndex_(map, ['SALA']),
    tipo: findHeaderIndex_(map, ['TIPO DE REUNION', 'TIPO']),
    profesor: findHeaderIndex_(map, ['PROFESOR', 'NOMBRE PROFESOR', 'PROFESOR 1'])
  };
}

/*******************************
 * DATA LOADING
 *******************************/
function getData_() {
  const sheet = getSourceSheet_();
  const range = sheet.getDataRange();

  const displayValues = range.getDisplayValues();
  const rawValues = range.getValues();
  const backgrounds = range.getBackgrounds();
  const fontColors = range.getFontColors();

  if (!displayValues || !displayValues.length) {
    return { headers: [], rows: [], idx: {}, legendRows: [] };
  }

  const headerRowIndex = detectHeaderRow_(displayValues);
  const headers = displayValues[headerRowIndex];
  const idx = getColumnIndexes_(headers);

  const legendRows = [];
  for (let r = 0; r < headerRowIndex; r++) {
    const rowValues = displayValues[r];
    if (!rowValues.some(v => String(v).trim() !== '')) continue;

    legendRows.push({
      cells: rowValues.map((v, c) => ({
        value: formatCell_(v),
        bg: backgrounds[r][c],
        color: fontColors[r][c]
      }))
    });
  }

  const rows = [];
  for (let r = headerRowIndex + 1; r < displayValues.length; r++) {
    const rowValues = displayValues[r];
    if (!rowValues.some(v => String(v).trim() !== '')) continue;

    rows.push({
      values: rowValues,
      rawValues: rawValues[r],
      backgrounds: backgrounds[r],
      fontColors: fontColors[r]
    });
  }

  return { headers, rows, idx, legendRows };
}

/*******************************
 * SORT
 *******************************/
function parseDateForSort_(rawValue, displayValue) {
  if (Object.prototype.toString.call(rawValue) === '[object Date]' && !isNaN(rawValue)) {
    return rawValue.getTime();
  }

  const txt = String(displayValue || '').trim();
  if (!txt) return Number.MAX_SAFE_INTEGER;

  const m = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    return new Date(y, mo, d).getTime();
  }

  const parsed = Date.parse(txt);
  return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

/*******************************
 * EXPORT PAYLOAD
 *******************************/
function buildStaticPayload_() {
  const { headers, rows, idx, legendRows } = getData_();

  const mappedRows = rows.map(row => ({
    cells: row.values.map((v, c) => ({
      value: formatCell_(v),
      bg: row.backgrounds[c],
      color: row.fontColors[c]
    })),
    meta: {
      area: formatCell_(valueAt_(row.values, idx.area)),
      plan: formatCell_(valueAt_(row.values, idx.plan)),
      nrc: formatCell_(valueAt_(row.values, idx.nrc)),
      conector: formatCell_(valueAt_(row.values, idx.conector)),
      lc: formatCell_(valueAt_(row.values, idx.lc)),
      materia: formatCell_(valueAt_(row.values, idx.materia)),
      curso: formatCell_(valueAt_(row.values, idx.curso)),
      seccion: formatCell_(valueAt_(row.values, idx.seccion)),
      titulo: formatCell_(valueAt_(row.values, idx.titulo)),
      lunes: formatCell_(valueAt_(row.values, idx.lunes)),
      martes: formatCell_(valueAt_(row.values, idx.martes)),
      miercoles: formatCell_(valueAt_(row.values, idx.miercoles)),
      jueves: formatCell_(valueAt_(row.values, idx.jueves)),
      viernes: formatCell_(valueAt_(row.values, idx.viernes)),
      inicio: formatCell_(valueAt_(row.values, idx.inicio)),
      fin: formatCell_(valueAt_(row.values, idx.fin)),
      sala: formatCell_(valueAt_(row.values, idx.sala)),
      tipo: formatCell_(valueAt_(row.values, idx.tipo)),
      profesor: formatCell_(valueAt_(row.values, idx.profesor))
    },
    sortInicio: parseDateForSort_(row.rawValues[idx.inicio], row.values[idx.inicio])
  }));

  mappedRows.sort((a, b) => a.sortInicio - b.sortInicio);

  return {
    generatedAt: new Date().toISOString(),
    headers,
    legendRows,
    rows: mappedRows
  };
}
