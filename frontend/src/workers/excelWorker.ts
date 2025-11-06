// Web Worker to parse large Excel files off the main thread
// Uses xlsx to read an ArrayBuffer and returns sheet metadata and paginated rows

/// <reference lib="webworker" />

// We import the ESM build which works in Vite workers
import * as XLSX from 'xlsx';

type LoadMessage = {
  type: 'load';
  fileBuffer: ArrayBuffer;
};

type PageMessage = {
  type: 'page';
  sheetName: string;
  offset: number;
  limit: number;
};

type WorkerMessage = LoadMessage | PageMessage;

type SheetCache = {
  sheetName: string;
  headers: string[];
  rows: (Record<string, unknown>)[];
};

let workbookCache: {
  sheetNames: string[];
  sheets: Map<string, SheetCache>;
} | null = null;

function toRows(worksheet: XLSX.WorkSheet): { headers: string[]; rows: Record<string, unknown>[] } {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: false,
    blankrows: false,
  });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];
  return { headers, rows: json };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  try {
    if (msg.type === 'load') {
      const wb = XLSX.read(msg.fileBuffer, { type: 'array' });
      const sheetNames = wb.SheetNames;
      const sheets = new Map<string, SheetCache>();
      // Lazily materialize sheets on first page request to save time upfront
      workbookCache = { sheetNames, sheets };
      self.postMessage({ type: 'loaded', sheetNames });
      return;
    }

    if (msg.type === 'page') {
      if (!workbookCache) {
        self.postMessage({ type: 'error', message: 'Workbook not loaded' });
        return;
      }
      const { sheetName, offset, limit } = msg;
      let cache = workbookCache.sheets.get(sheetName);
      if (!cache) {
        // Load and cache this sheet now
        // We need the original file again, which we don't keep; instead, require sheets to be materialized at load
        // As a workaround, when first page request comes we cannot re-read without buffer; so we choose to eagerly cache all sheets on first page access using a retained ArrayBuffer
        // To support this, we store the last ArrayBuffer inside the cache when loaded
      }
      // The above comment indicates we need the buffer retained. Implement retention now by piggy-backing on a hidden global; if absent, return error.
      const anySelf = self as unknown as { __excelBuffer?: ArrayBuffer };
      if (!cache) {
        const buf = anySelf.__excelBuffer;
        if (!buf) {
          self.postMessage({ type: 'error', message: 'Internal buffer missing; reload file' });
          return;
        }
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          self.postMessage({ type: 'error', message: `Sheet not found: ${sheetName}` });
          return;
        }
        const { headers, rows } = toRows(ws);
        cache = { sheetName, headers, rows };
        workbookCache.sheets.set(sheetName, cache);
      }

      const total = cache.rows.length;
      const start = Math.max(0, offset);
      const end = Math.min(total, start + Math.max(0, limit));
      const pageRows = cache.rows.slice(start, end);
      self.postMessage({
        type: 'pageData',
        sheetName,
        headers: cache.headers,
        total,
        offset: start,
        limit,
        rows: pageRows,
      });
      return;
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: (err as Error)?.message || 'Unknown worker error' });
  }
};

// Keep the last loaded ArrayBuffer so we can materialize sheets lazily
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === 'load') {
    (self as unknown as { __excelBuffer?: ArrayBuffer }).__excelBuffer = event.data.fileBuffer;
  }
});

export {}; // make this a module


