// ═══════════════════════════════════════════════════════════════
//  PdfExportService.ts — SudoX puzzle PDF export (Next.js port)
//
//  Port of downloadPDF.js for the React/Next.js architecture.
//  Uses jsPDF loaded via CDN (window.jspdf).
//
//  Reads the puzzle grid directly from the DOM,
//  so it captures the current visual state exactly.
// ═══════════════════════════════════════════════════════════════

// ── Type declarations for jsPDF on window ──
declare global {
  interface Window {
    jspdf?: {
      jsPDF: new (opts: {
        orientation: string;
        unit: string;
        format: string;
      }) => JsPDFDoc;
    };
  }
}

interface JsPDFDoc {
  setFillColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setLineWidth(w: number): void;
  setFont(name: string, style: string): void;
  setFontSize(size: number): void;
  setCharSpace(space: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  text(text: string, x: number, y: number, opts?: { align?: string }): void;
  addImage(imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array, format: string, x: number, y: number, w: number, h: number): void;
  save(filename: string): void;
}

// ── COLOUR PALETTE (light-mode, matches globals.css tokens) ──
const PDF_PALETTE = {
  warmBg:    [254, 249, 240] as const,
  cardBg:    [255, 253, 248] as const,
  primary:   [180,  83,   9] as const,
  textMain:  [ 45,  42,  36] as const,
  textMuted: [156, 144, 132] as const,
  gridDark:  [ 45,  42,  36] as const,
  clueText:  [ 45,  42,  36] as const,
  altCell:   [254, 243, 199] as const,
  diagCell:  [180,  83,   9] as const,
  winCell:   [180,  83,   9] as const,
  correctBg: [239, 246, 255] as const,
  correctTx: [ 29,  78, 216] as const,
  wrongBg:   [255, 241, 242] as const,
  wrongTx:   [190,  18,  60] as const,
  whitish:   [255, 255, 255] as const,
  borderSoft:[195, 190, 180] as const,
};

// ── PAGE LAYOUT (all values in mm, A4 portrait) ──
const PDF_LAYOUT = {
  pageW:      210,
  pageH:      297,
  margin:      18,
  headerH:     28,
  footerGap:   22,
  sectionGap:  10,
};

const PDF_FOOTER_TEXT = "© rathodnk — SudoX Sudoku Variants";

const PDF_BORDER = {
  thin:  0.3,
  thick: 1.1,
};

// ─────────────────────────────────────────────────────────────
//  Event bridge:  MenuDrawer  ←→  GameActive
// ─────────────────────────────────────────────────────────────

/** Dispatch a custom event requesting PDF download. */
export function requestPdfDownload(): void {
  window.dispatchEvent(new CustomEvent('sudox:download-pdf'));
}

/** Listen for PDF download requests. Returns unsubscribe fn. */
export function onPdfDownloadRequest(handler: () => void): () => void {
  window.addEventListener('sudox:download-pdf', handler);
  return () => window.removeEventListener('sudox:download-pdf', handler);
}

// ─────────────────────────────────────────────────────────────
//  Internal PDF helpers (ported from downloadPDF.js)
// ─────────────────────────────────────────────────────────────

function _drawHeader(
  doc: JsPDFDoc,
  pidText: string,
  logoBase64: string | null,
) {
  const { pageW, margin, headerH } = PDF_LAYOUT;
  const { cardBg, primary, textMain, textMuted } = PDF_PALETTE;

  // Background
  doc.setFillColor(...cardBg);
  doc.rect(0, 0, pageW, headerH, "F");

  // Bottom rule
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.7);
  doc.line(0, headerH, pageW, headerH);

  // Logo or badge
  if (logoBase64) {
    // 12x12 mm image
    doc.addImage(logoBase64, 'PNG', margin, 8, 12, 12);
  } else {
    doc.setFillColor(...primary);
    doc.roundedRect(margin, 8, 12, 12, 2, 2, "F");
    doc.setFont("Courier", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("SX", margin + 6, 16.5, { align: "center" });
  }

  // Brand name
  doc.setFont("Times", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...textMain);
  doc.text("SudoX", margin + 16, 17);

  // Puzzle ID
  doc.setFont("Courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...textMuted);
  doc.text(pidText, pageW - margin, 14, { align: "right" });

  // Date
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(dateStr, pageW - margin, 21, { align: "right" });
}

function _drawSectionLabel(doc: JsPDFDoc, yPos: number, variantName: string): number {
  const { margin } = PDF_LAYOUT;
  const { primary } = PDF_PALETTE;

  doc.setFont("Times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primary);
  doc.text(variantName.toUpperCase(), margin, yPos);

  return yPos + 6;
}

function _drawGrid(
  doc: JsPDFDoc,
  yPos: number,
  totalRows: number,
  totalCols: number,
  cellAt: (r: number, c: number) => HTMLElement | null,
): number {
  const { pageW, pageH, margin, footerGap } = PDF_LAYOUT;
  const contentW = pageW - margin * 2;

  const {
    gridDark, clueText, altCell, diagCell, winCell,
    whitish,
  } = PDF_PALETTE;

  const border = PDF_BORDER;

  // Base maximum cell size mapping based on columns to prevent giant grids
  let targetCellMM = 11.5; 
  if (totalCols >= 15) targetCellMM = 10;
  else if (totalCols >= 12) targetCellMM = 10.5;
  else if (totalCols <= 6) targetCellMM = 12;
  else if (totalCols <= 8) targetCellMM = 11.5;

  // Fit grid into the remaining vertical space
  const maxGridW = contentW;
  const maxGridH = pageH - yPos - footerGap;
  const cellMM = Math.min(
    targetCellMM,
    Math.floor(maxGridW / totalCols),
    Math.floor(maxGridH / totalRows),
  );
  
  const gridW = cellMM * totalCols;
  const gridH = cellMM * totalRows;
  const gridX = margin + (contentW - gridW) / 2;

  // Font size: cellMM is in mm, jsPDF fontSize is in pt (1 mm ≈ 2.835 pt)
  // Slightly reduced multiplier to prevent congested numbers
  const fontSize = Math.max(9, cellMM * 2.835 * 0.55);

  // ── Pass 1: backgrounds ──
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const el = cellAt(r, c);
      const x = gridX + c * cellMM;
      const y = yPos + r * cellMM;

      if (!el || el.classList.contains("inactive-cell")) {
        continue;
      }

      // Background colour (ignore correct/wrong state to print clean puzzle)
      let bg: readonly [number, number, number] = whitish;
      if      (el.classList.contains("both-cell"))      bg = diagCell;
      else if (el.classList.contains("diagonal-cell"))  bg = diagCell;
      else if (el.classList.contains("window-cell"))    bg = winCell;
      else if (el.classList.contains("alt-block"))      bg = altCell;

      doc.setFillColor(...bg);
      doc.rect(x, y, cellMM, cellMM, "F");

      // Number (only print clues, ignore player progress)
      if (el.classList.contains("clue")) {
        const val = el.textContent?.trim() ?? '';
        if (val) {
          let tx: readonly [number, number, number] = clueText;
          if (
            el.classList.contains("diagonal-cell") ||
            el.classList.contains("window-cell") ||
            el.classList.contains("both-cell")
          ) {
            tx = [255, 253, 248];
          }
          
          doc.setFont("Courier", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(...tx);
          doc.text(val, x + cellMM / 2, y + cellMM * 0.63, { align: "center" });
        }
      }
    }
  }

  // ── Pass 2: borders ──
  const parseBorder = (bStr: string): number | null => {
    if (!bStr) return null;
    return (bStr.includes("2.5px") || bStr.includes("2px"))
      ? border.thick
      : border.thin;
  };

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const el = cellAt(r, c);
      if (!el || el.classList.contains("inactive-cell")) continue;

      const x = gridX + c * cellMM;
      const y = yPos + r * cellMM;
      const st = el.style;

      doc.setDrawColor(...gridDark);

      const sides = [
        { w: parseBorder(st.borderTop),    x1: x,          y1: y,          x2: x + cellMM, y2: y          },
        { w: parseBorder(st.borderBottom), x1: x,          y1: y + cellMM, x2: x + cellMM, y2: y + cellMM },
        { w: parseBorder(st.borderLeft),   x1: x,          y1: y,          x2: x,           y2: y + cellMM },
        { w: parseBorder(st.borderRight),  x1: x + cellMM, y1: y,          x2: x + cellMM,  y2: y + cellMM },
      ];

      for (const s of sides) {
        if (s.w !== null) {
          if (s.w === border.thick) {
            doc.setDrawColor(...gridDark);
            doc.setLineWidth(border.thick);
          } else {
            doc.setDrawColor(...PDF_PALETTE.borderSoft);
            doc.setLineWidth(border.thin);
          }
          doc.line(s.x1, s.y1, s.x2, s.y2);
        }
      }
    }
  }

  return yPos + gridH;
}

function _drawFooter(doc: JsPDFDoc) {
  const { pageW, pageH, margin } = PDF_LAYOUT;
  const { primary, textMuted } = PDF_PALETTE;

  const footerY = pageH - 16;

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 6, pageW - margin, footerY - 6);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(PDF_FOOTER_TEXT, pageW / 2, footerY, { align: "center" });
}

// ─────────────────────────────────────────────────────────────
//  Main export function
// ─────────────────────────────────────────────────────────────

function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No 2d context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Generate and download a styled A4 PDF of the currently
 * displayed puzzle.  Reads grid cells directly from the DOM.
 */
export async function exportPuzzleToPdf(
  gameName: string,
  puzzleId: string,
): Promise<void> {
  // Check jsPDF availability
  if (!window.jspdf) {
    alert('PDF library is still loading. Please try again in a moment.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Query the grid from the DOM
  const gridEl = document.querySelector('.sudoku-grid') as HTMLElement | null;
  if (!gridEl) {
    alert('No puzzle grid found to export.');
    return;
  }

  // Determine grid dimensions from the CSS grid
  const gridStyle = getComputedStyle(gridEl);
  const colTemplate = gridStyle.gridTemplateColumns;
  const rowTemplate = gridStyle.gridTemplateRows;
  const totalCols = colTemplate ? colTemplate.split(' ').length : 0;
  const totalRows = rowTemplate ? rowTemplate.split(' ').length : 0;

  if (totalRows === 0 || totalCols === 0) {
    alert('Could not determine grid dimensions.');
    return;
  }

  // Cell accessor — reads from DOM by grid position
  const allCells = gridEl.querySelectorAll('.grid-cell');
  const cellAt = (r: number, c: number): HTMLElement | null => {
    const idx = r * totalCols + c;
    return (allCells[idx] as HTMLElement) ?? null;
  };

  const pidText = `#${puzzleId}`;
  const logoBase64 = await loadImageAsBase64('/favicon.png').catch(() => null);

  // ── Build PDF ──

  // Page background
  doc.setFillColor(...PDF_PALETTE.warmBg);
  doc.rect(0, 0, PDF_LAYOUT.pageW, PDF_LAYOUT.pageH, "F");

  // Header
  _drawHeader(doc, pidText, logoBase64);

  // Section label
  let yPos = PDF_LAYOUT.headerH + PDF_LAYOUT.sectionGap;
  yPos = _drawSectionLabel(doc, yPos, gameName);

  // Grid
  _drawGrid(doc, yPos, totalRows, totalCols, cellAt);

  // Footer
  _drawFooter(doc);

  // Save — filename uses puzzle ID or fallback
  const pid = puzzleId.replace(/[^a-zA-Z0-9_-]/g, "");
  doc.save(`${pid || "sudox_puzzle"}.pdf`);
}
