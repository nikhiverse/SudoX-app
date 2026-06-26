// FIX #10: Never #include a .cpp file. The symmetric_puzzle dependency
// should be a proper header. Renamed to .hpp here.
#include "../include/symmetric_puzzle.hpp"
#include <algorithm>
#include <iostream>
#include <numeric>
#include <random>
#include <string>
#include <vector>

using namespace std;

const int SIZE = 8;

// TilingSudoku / Jigsaw8: 8x8 grid with custom irregular regions that can
// wrap around the board edges (toroidal topology).
class TilingSudoku {
private:
  int gridMap[SIZE * SIZE];
  int numberMap[SIZE * SIZE];
  int solution[SIZE * SIZE];

  // 4x4 Macro Grid: each cell represents a 2x2 chunk of the final 8x8 board.
  int macroGrid[4][4];

  // Bitmasks for O(1) constraint checking (bits 0-7 = digits 1-8).
  uint16_t rowMask[SIZE], colMask[SIZE], blockMask[SIZE];

  mt19937 rng;

  // FIX #2: Renamed from solveCounter. This is a total-work cap across all
  // recursive calls in one solve attempt, not an infinite-loop guard.
  // Declared as a member and reset explicitly in reset() before each attempt.
  long long backtrackNodeCount;

  void reset() {
    // FIX #2: Explicitly reset the backtrack counter before each solve attempt.
    backtrackNodeCount = 0;

    for (int i = 0; i < SIZE; i++) {
      rowMask[i] = colMask[i] = blockMask[i] = 0;
    }
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      gridMap[pos]   = -1;
      numberMap[pos] = 0;
      // FIX #11: Also reset solution[] so stale data from a failed attempt
      // is never visible if printJSON() were called prematurely.
      solution[pos]  = 0;
    }
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        macroGrid[i][j] = -1;
      }
    }
  }

  // --- STEP 1: Generate Geometry on a 4x4 Macro Level ---
  // vRem    = remaining 4x2 blocks  (Vertical  dominoes, 2 macro cells tall)
  // hRem    = remaining 2x4 blocks  (Horizontal dominoes, 2 macro cells wide)
  // splitRem= remaining Wrapped Pairs (2 non-adjacent macro cells that share
  //           a block ID across the toroidal edge)
  //
  // FIX #1: Block IDs are now tracked via a dedicated parameter (nextId)
  // instead of being inferred from remaining counts. This makes ID assignment
  // explicit and safe regardless of argument values, eliminating the overflow
  // risk when piece counts change.
  bool solveMacroGeometry(int vRem, int hRem, int splitRem, int nextId = 0) {
    int mr = -1, mc = -1;

    // Find the first empty macro-cell (top-left scan order).
    for (int i = 0; i < 4 && mr == -1; i++) {
      for (int j = 0; j < 4; j++) {
        if (macroGrid[i][j] == -1) { mr = i; mc = j; break; }
      }
    }

    // All 16 macro-cells filled → success.
    if (mr == -1) return true;

    // Build the option list based on remaining piece counts.
    // FIX #8 (partial): Use a small fixed-size array instead of heap vector.
    int options[4];
    int optCount = 0;
    if (vRem > 0)     options[optCount++] = 0; // 4x2 Vertical domino
    if (hRem > 0)     options[optCount++] = 1; // 2x4 Horizontal domino
    if (splitRem > 0) options[optCount++] = 2; // Horizontal wrap (cols 0↔3)
    if (splitRem > 0) options[optCount++] = 3; // Vertical   wrap (rows 0↔3)

    shuffle(options, options + optCount, rng);

    for (int k = 0; k < optCount; k++) {
      int opt = options[k];
      // nextId is now passed in, guaranteed to be in [0, 7].

      if (opt == 0) {
        // Vertical domino: occupies (mr,mc) and (mr+1,mc).
        if (mr + 1 < 4 && macroGrid[mr + 1][mc] == -1) {
          macroGrid[mr][mc]     = nextId;
          macroGrid[mr + 1][mc] = nextId;
          if (solveMacroGeometry(vRem - 1, hRem, splitRem, nextId + 1)) return true;
          macroGrid[mr][mc]     = -1;
          macroGrid[mr + 1][mc] = -1;
        }
      }
      else if (opt == 1) {
        // Horizontal domino: occupies (mr,mc) and (mr,mc+1).
        if (mc + 1 < 4 && macroGrid[mr][mc + 1] == -1) {
          macroGrid[mr][mc]     = nextId;
          macroGrid[mr][mc + 1] = nextId;
          if (solveMacroGeometry(vRem, hRem - 1, splitRem, nextId + 1)) return true;
          macroGrid[mr][mc]     = -1;
          macroGrid[mr][mc + 1] = -1;
        }
      }
      else if (opt == 2) {
        // FIX #4: Horizontal wrap — pair any left-edge cell (col 0) with the
        // matching right-edge cell (col 3) in the same row. Previously this
        // only fired when the scanner happened to land on col 0, which was
        // overly restrictive. Now we search for any available col-0 cell in
        // the current row (or any unfilled row) and pair it with col 3.
        //
        // The scanner always gives us the first empty cell, so if mc == 0 we
        // can use the current row directly; otherwise search for any row whose
        // col-0 and col-3 are both empty.
        {
          int wr = -1;
          if (mc == 0 && macroGrid[mr][3] == -1) {
            wr = mr; // current scan position is already col 0
          } else {
            // Find another row with both col 0 and col 3 free.
            for (int i = 0; i < 4; i++) {
              if (macroGrid[i][0] == -1 && macroGrid[i][3] == -1) {
                wr = i; break;
              }
            }
          }
          if (wr != -1) {
            macroGrid[wr][0] = nextId;
            macroGrid[wr][3] = nextId;
            if (solveMacroGeometry(vRem, hRem, splitRem - 1, nextId + 1)) return true;
            macroGrid[wr][0] = -1;
            macroGrid[wr][3] = -1;
          }
        }
      }
      else if (opt == 3) {
        // FIX #4: Vertical wrap — pair any top-edge cell (row 0) with the
        // matching bottom-edge cell (row 3) in the same column.
        {
          int wc = -1;
          if (mr == 0 && macroGrid[3][mc] == -1) {
            wc = mc;
          } else {
            for (int j = 0; j < 4; j++) {
              if (macroGrid[0][j] == -1 && macroGrid[3][j] == -1) {
                wc = j; break;
              }
            }
          }
          if (wc != -1) {
            macroGrid[0][wc] = nextId;
            macroGrid[3][wc] = nextId;
            if (solveMacroGeometry(vRem, hRem, splitRem - 1, nextId + 1)) return true;
            macroGrid[0][wc] = -1;
            macroGrid[3][wc] = -1;
          }
        }
      }
    }
    return false;
  }

  // --- STEP 2: MRV Solver (Number Placement Phase) ---

  // Returns a bitmask of valid digits (bits 0-7 → digits 1-8) for cell (r,c).
  inline uint16_t getPossible(int r, int c) const {
    uint16_t used = rowMask[r] | colMask[c] | blockMask[gridMap[r * SIZE + c]];
    return (~used) & 0x00FF;
  }

  // FIX #9: Track unfilled cells explicitly so solveNumbers() doesn't scan
  // all 64 cells on every recursive call. We store a flat list of positions
  // and swap-remove when a cell is filled, restoring on backtrack.
  //
  // unfilledCells[0..unfilledCount-1] = positions of cells not yet assigned.
  int  unfilledCells[SIZE * SIZE];
  int  unfilledCount;

  void initUnfilled() {
    unfilledCount = 0;
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      unfilledCells[unfilledCount++] = pos;
    }
  }

  bool solveNumbers() {
    // FIX #2: backtrackNodeCount counts total recursive calls (nodes), not
    // loop iterations. The cap prevents runaway solving on bad geometries.
    if (++backtrackNodeCount > 100000) return false;

    if (unfilledCount == 0) return true; // All cells filled → done.

    // MRV: find the unfilled cell with the fewest valid digit choices.
    int bestIdx   = -1;
    int minCount  = 9;
    uint16_t bestMask = 0;

    for (int k = 0; k < unfilledCount; k++) {
      int pos  = unfilledCells[k];
      int r    = pos / SIZE;
      int c    = pos % SIZE;
      uint16_t mask  = getPossible(r, c);
      // FIX #7: Use __builtin_popcount instead of manual bit-counting loop.
      int count = __builtin_popcount(mask);

      if (count == 0) return false; // Dead end — this cell has no valid digit.

      if (count < minCount) {
        minCount = count;
        bestIdx  = k;
        bestMask = mask;
        if (count == 1) break; // Can't do better than a naked single.
      }
    }

    // Swap-remove the chosen cell from the unfilled list.
    int chosenPos = unfilledCells[bestIdx];
    unfilledCells[bestIdx] = unfilledCells[--unfilledCount]; // swap with last
    // (unfilledCells[unfilledCount] still holds chosenPos's old slot — harmless)

    int r    = chosenPos / SIZE;
    int c    = chosenPos % SIZE;
    int bIdx = gridMap[chosenPos];

    // FIX #8: Use a fixed-size stack array instead of heap-allocated vector.
    int  nums[8];
    int  numCount = 0;
    for (int i = 0; i < 8; i++)
      if (bestMask & (1 << i)) nums[numCount++] = i + 1;

    shuffle(nums, nums + numCount, rng);

    for (int ni = 0; ni < numCount; ni++) {
      int      n   = nums[ni];
      uint16_t bit = 1 << (n - 1);

      numberMap[chosenPos] = n;
      rowMask[r]           |= bit;
      colMask[c]           |= bit;
      blockMask[bIdx]      |= bit;

      if (solveNumbers()) return true;

      rowMask[r]      &= ~bit;
      colMask[c]      &= ~bit;
      blockMask[bIdx] &= ~bit;
      numberMap[chosenPos] = 0;
    }

    // Restore the cell to the unfilled list on backtrack.
    unfilledCells[unfilledCount++] = chosenPos;
    return false;
  }

  // FIX #6: Validate that every cell in gridMap received a valid block ID
  // (0–7) after macro grid expansion. Returns false if any cell is still -1.
  bool validateGridMap() const {
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      if (gridMap[pos] < 0 || gridMap[pos] >= SIZE) return false;
    }
    return true;
  }

public:
  TilingSudoku() : rng(random_device{}()) {}

  void generate() {
    bool success = false;

    while (!success) {
      reset();

      // Request exactly: 3 vertical dominoes, 3 horizontal dominoes,
      // 2 wraparound split pairs  (3+3+2 = 8 pieces × 2 macro-cells = 16).
      if (solveMacroGeometry(3, 3, 2)) {

        // Expand 4x4 macro grid → full 8x8 gridMap.
        for (int i = 0; i < 4; i++) {
          for (int j = 0; j < 4; j++) {
            int bId = macroGrid[i][j];
            int r   = i * 2;
            int c   = j * 2;
            gridMap[ r      * SIZE + c    ] = bId;
            gridMap[ r      * SIZE + c + 1] = bId;
            gridMap[(r + 1) * SIZE + c    ] = bId;
            gridMap[(r + 1) * SIZE + c + 1] = bId;
          }
        }

        // FIX #6: Guard against any cell left unassigned before solving.
        if (!validateGridMap()) continue;

        // FIX #3: SymmetricPuzzleGenerator is now constructed inside the loop
        // so its internal state is clean on every retry attempt.
        SymmetricPuzzleGenerator<SIZE, 2, 4> clueGen;

        initUnfilled(); // FIX #9: Populate the unfilled-cell list.

        if (solveNumbers()) {
          for (int i = 0; i < SIZE * SIZE; i++) solution[i] = numberMap[i];
          clueGen.gridMap = gridMap;
          success = clueGen.generate(numberMap, JIGSAW_8_CONFIG);
        }
      }
    }
  }

  void printJSON() const {
    cout << "{\"type\":\"jigsaw\",\"size\":8,\"grid\":[";
    for (int r = 0; r < SIZE; r++) {
      if (r) cout << ",";
      cout << "[";
      for (int c = 0; c < SIZE; c++) {
        if (c) cout << ",";
        cout << numberMap[r * SIZE + c];
      }
      cout << "]";
    }
    cout << "],\"groups\":[";
    for (int r = 0; r < SIZE; r++) {
      if (r) cout << ",";
      cout << "[";
      for (int c = 0; c < SIZE; c++) {
        if (c) cout << ",";
        cout << gridMap[r * SIZE + c];
      }
      cout << "]";
    }
    cout << "],\"solution\":[";
    for (int r = 0; r < SIZE; r++) {
      if (r) cout << ",";
      cout << "[";
      for (int c = 0; c < SIZE; c++) {
        if (c) cout << ",";
        cout << solution[r * SIZE + c];
      }
      cout << "]";
    }
    cout << "]}" << endl;
  }
};

int main() {
  TilingSudoku game;
  game.generate();
  game.printJSON();
  return 0;
}
