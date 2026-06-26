#include "../include/symmetric_puzzle.cpp"
#include <algorithm>
#include <iostream>
#include <numeric>
#include <random>
#include <string>
#include <vector>

using namespace std;

const int SIZE = 8;

// TilingSudoku / Jigsaw8: 8x8 grid with irregular regions that can
// wrap around the board edges (toroidal topology).
// Har generation mein standard aur wraparound pieces ka mix randomize
// hota hai — visually distinct aur challenging layouts produce karta hai.
class TilingSudoku {
private:
  int gridMap[SIZE * SIZE];
  int numberMap[SIZE * SIZE];
  int solution[SIZE * SIZE];

  // 4x4 Macro Grid: har cell ek 2x2 chunk represent karta hai final 8x8 board ka.
  // Isse toroidal (edge-wrapping) geometries naturally express hoti hain.
  int macroGrid[4][4];

  // Bitmasks for O(1) constraint checking (bits 0-7 = digits 1-8)
  uint16_t rowMask[SIZE], colMask[SIZE], blockMask[SIZE];

  mt19937 rng;

  // Total recursive work cap — resets before each solve attempt
  long long backtrackNodeCount;

  // Unfilled cell tracking for fast MRV lookup (swap-remove pattern)
  int unfilledCells[SIZE * SIZE];
  int unfilledCount;

  void reset() {
    backtrackNodeCount = 0;
    for (int i = 0; i < SIZE; i++) {
      rowMask[i] = colMask[i] = blockMask[i] = 0;
    }
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      gridMap[pos]   = -1;
      numberMap[pos] = 0;
      solution[pos]  = 0;
    }
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        macroGrid[i][j] = -1;
      }
    }
  }

  // --- STEP 1: Macro-Level Geometry with Toroidal Wrapping ---
  // vRem     = remaining vertical dominoes   (2x1 macro = 4x2 real cells)
  // hRem     = remaining horizontal dominoes  (1x2 macro = 2x4 real cells)
  // splitRem = remaining wraparound pairs     (non-adjacent macro cells linked across edges)
  // nextId   = explicit block ID counter      (0 to 7, safe for any piece mix)
  bool solveMacroGeometry(int vRem, int hRem, int splitRem, int nextId = 0) {
    int mr = -1, mc = -1;

    // Pehla khali macro-cell dhundho (top-left scan order)
    for (int i = 0; i < 4 && mr == -1; i++) {
      for (int j = 0; j < 4; j++) {
        if (macroGrid[i][j] == -1) { mr = i; mc = j; break; }
      }
    }

    // Sab 16 macro-cells bhar gaye → success
    if (mr == -1) return true;

    // Build option list from remaining piece counts
    int options[4];
    int optCount = 0;
    if (vRem > 0)     options[optCount++] = 0; // Vertical domino
    if (hRem > 0)     options[optCount++] = 1; // Horizontal domino
    if (splitRem > 0) options[optCount++] = 2; // Horizontal edge wrap (col 0 ↔ col 3)
    if (splitRem > 0) options[optCount++] = 3; // Vertical edge wrap   (row 0 ↔ row 3)

    shuffle(options, options + optCount, rng);

    for (int k = 0; k < optCount; k++) {
      int opt = options[k];

      if (opt == 0) {
        // Vertical domino: occupies (mr,mc) aur (mr+1,mc) — 2 rows, 1 col macro mein
        if (mr + 1 < 4 && macroGrid[mr + 1][mc] == -1) {
          macroGrid[mr][mc]     = nextId;
          macroGrid[mr + 1][mc] = nextId;
          if (solveMacroGeometry(vRem - 1, hRem, splitRem, nextId + 1)) return true;
          macroGrid[mr][mc]     = -1;
          macroGrid[mr + 1][mc] = -1;
        }
      }
      else if (opt == 1) {
        // Horizontal domino: occupies (mr,mc) aur (mr,mc+1) — 1 row, 2 cols macro mein
        if (mc + 1 < 4 && macroGrid[mr][mc + 1] == -1) {
          macroGrid[mr][mc]     = nextId;
          macroGrid[mr][mc + 1] = nextId;
          if (solveMacroGeometry(vRem, hRem - 1, splitRem, nextId + 1)) return true;
          macroGrid[mr][mc]     = -1;
          macroGrid[mr][mc + 1] = -1;
        }
      }
      else if (opt == 2) {
        // Horizontal wrap: col 0 aur col 3 ko same row mein pair karo (toroidal edge)
        // Scanner ke current position se try, warna koi bhi available row dhundho
        int wr = -1;
        if (mc == 0 && macroGrid[mr][3] == -1) {
          wr = mr; // Current scan position already col 0 pe hai
        } else {
          // Koi aur row dhundho jahan col 0 aur col 3 dono khali hain
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
      else if (opt == 3) {
        // Vertical wrap: row 0 aur row 3 ko same column mein pair karo (toroidal edge)
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
    return false;
  }

  // --- STEP 2: MRV Solver with Optimized Backtracking ---
  // Returns bitmask of valid digits (bits 0-7 → digits 1-8) for cell (r,c)
  inline uint16_t getPossible(int r, int c) const {
    uint16_t used = rowMask[r] | colMask[c] | blockMask[gridMap[r * SIZE + c]];
    return (~used) & 0x00FF;
  }

  void initUnfilled() {
    unfilledCount = 0;
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      unfilledCells[unfilledCount++] = pos;
    }
  }

  bool solveNumbers() {
    // backtrackNodeCount total recursive calls count karta hai — bad geometries ke liye cap
    if (++backtrackNodeCount > 100000) return false;

    if (unfilledCount == 0) return true; // Sab cells filled → done

    // MRV: unfilled cell dhundho jisme sabse kam valid digit choices hain
    int bestIdx   = -1;
    int minCount  = 9;
    uint16_t bestMask = 0;

    for (int k = 0; k < unfilledCount; k++) {
      int pos  = unfilledCells[k];
      int r    = pos / SIZE;
      int c    = pos % SIZE;
      uint16_t mask  = getPossible(r, c);
      int count = __builtin_popcount(mask);

      if (count == 0) return false; // Dead end — is cell ke liye koi valid digit nahi

      if (count < minCount) {
        minCount = count;
        bestIdx  = k;
        bestMask = mask;
        if (count == 1) break; // Naked single — isse better nahi ho sakta
      }
    }

    // Swap-remove chosen cell from unfilled list
    int chosenPos = unfilledCells[bestIdx];
    unfilledCells[bestIdx] = unfilledCells[--unfilledCount];

    int r    = chosenPos / SIZE;
    int c    = chosenPos % SIZE;
    int bIdx = gridMap[chosenPos];

    // Stack-allocated candidates (no heap allocation in hot path)
    int nums[8];
    int numCount = 0;
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

    // Backtrack pe cell wapas unfilled list mein daaldo
    unfilledCells[unfilledCount++] = chosenPos;
    return false;
  }

  // Validate ki har cell ko valid block ID (0-7) mila hai expansion ke baad
  bool validateGridMap() const {
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
      if (gridMap[pos] < 0 || gridMap[pos] >= SIZE) return false;
    }
    return true;
  }

public:
  TilingSudoku() : rng(random_device{}()) {}

  // Main puzzle generation — har baar naya random piece distribution
  void generate() {
    bool success = false;

    while (!success) {
      reset();

      // Randomize piece distribution har attempt mein — visual variety ke liye:
      // splitCount (wraparound pairs): 1 to 3 — ensures har puzzle mein toroidal regions hon
      // Baaki pieces vertical aur horizontal dominoes mein split hote hain randomly
      int splitCount = uniform_int_distribution<int>(1, 3)(rng);
      int remaining  = 8 - splitCount;
      int vCount     = uniform_int_distribution<int>(1, remaining - 1)(rng);
      int hCount     = remaining - vCount;

      if (solveMacroGeometry(vCount, hCount, splitCount)) {

        // Expand 4x4 macro grid → full 8x8 gridMap
        // Har macro cell ek 2x2 real cell chunk ban jaata hai
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

        // Guard against any cell left unassigned before solving
        if (!validateGridMap()) continue;

        // Fresh clue generator construction — clean state har retry pe
        SymmetricPuzzleGenerator<SIZE, 2, 4> clueGen;

        initUnfilled(); // Populate unfilled-cell list for MRV

        if (solveNumbers()) {
          for (int i = 0; i < SIZE * SIZE; i++) solution[i] = numberMap[i];
          clueGen.gridMap = gridMap;
          success = clueGen.generate(numberMap, JIGSAW_8_CONFIG);
        }
      }
    }
  }

  void printJSON() {
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