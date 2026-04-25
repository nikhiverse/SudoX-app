// ═══════════════════════════════════════════
// SudoX — Puzzle Data Validator
// ═══════════════════════════════════════════
// Validates C++ output JSON before storing in MongoDB.

import type { PuzzleData } from './types';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that puzzle data from C++ output is well-formed.
 */
export function validatePuzzleData(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data is not an object' };
  }

  const d = data as Record<string, unknown>;

  if (!d.type || typeof d.type !== 'string') {
    return { valid: false, error: 'Missing or invalid "type" field' };
  }

  switch (d.type) {
    case 'standard':
      return validateStandard(d);
    case 'jigsaw':
      return validateJigsaw(d);
    case 'twodoku':
      return validateTwodoku(d);
    default:
      return { valid: false, error: `Unknown puzzle type: ${d.type}` };
  }
}

function validateGrid(grid: unknown, expectedRows: number, expectedCols: number): ValidationResult {
  if (!Array.isArray(grid)) {
    return { valid: false, error: 'Grid is not an array' };
  }
  if (grid.length !== expectedRows) {
    return { valid: false, error: `Grid has ${grid.length} rows, expected ${expectedRows}` };
  }
  for (let r = 0; r < expectedRows; r++) {
    if (!Array.isArray(grid[r])) {
      return { valid: false, error: `Grid row ${r} is not an array` };
    }
    if (grid[r].length !== expectedCols) {
      return { valid: false, error: `Grid row ${r} has ${grid[r].length} cols, expected ${expectedCols}` };
    }
  }
  return { valid: true };
}

function validateStandard(d: Record<string, unknown>): ValidationResult {
  const size = d.size;
  if (typeof size !== 'number' || size < 4 || size > 16) {
    return { valid: false, error: `Invalid size: ${size}` };
  }

  if (typeof d.subRows !== 'number' || typeof d.subCols !== 'number') {
    return { valid: false, error: 'Missing subRows or subCols' };
  }

  const gridResult = validateGrid(d.grid, size, size);
  if (!gridResult.valid) return gridResult;

  return { valid: true };
}

function validateJigsaw(d: Record<string, unknown>): ValidationResult {
  const size = d.size;
  if (typeof size !== 'number' || size < 4 || size > 16) {
    return { valid: false, error: `Invalid size: ${size}` };
  }

  const gridResult = validateGrid(d.grid, size, size);
  if (!gridResult.valid) return gridResult;

  // Validate groups
  const groupsResult = validateGrid(d.groups, size, size);
  if (!groupsResult.valid) {
    return { valid: false, error: `Groups: ${groupsResult.error}` };
  }

  return { valid: true };
}

function validateTwodoku(d: Record<string, unknown>): ValidationResult {
  const totalRows = d.totalRows;
  const totalCols = d.totalCols;

  if (typeof totalRows !== 'number' || typeof totalCols !== 'number') {
    return { valid: false, error: 'Missing totalRows or totalCols' };
  }

  const gridResult = validateGrid(d.grid, totalRows, totalCols);
  if (!gridResult.valid) return gridResult;

  // Validate active mask
  if (!Array.isArray(d.active)) {
    return { valid: false, error: 'Missing active mask' };
  }

  const activeResult = validateGrid(d.active, totalRows, totalCols);
  if (!activeResult.valid) {
    return { valid: false, error: `Active mask: ${activeResult.error}` };
  }

  // Validate grids metadata
  if (!Array.isArray(d.grids) || d.grids.length < 2) {
    return { valid: false, error: 'Missing or invalid grids metadata' };
  }

  return { valid: true };
}
