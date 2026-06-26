#include "../include/symmetric_puzzle.cpp"
#include <algorithm>
#include <iostream>
#include <numeric>
#include <random>
#include <string>
#include <vector>

using namespace std;

const int SIZE = 8;

// TilingSudoku / Jigsaw8: 8x8 matrix par custom varying rectangles overlap karte hain
class TilingSudoku {
private:
  int gridMap[SIZE * SIZE];
  int numberMap[SIZE * SIZE];
  int solution[SIZE * SIZE];
  
  // 4x4 Macro Grid where each cell represents a 2x2 chunk of the final board
  int macroGrid[4][4];

  // Bitmasks for fast verification checking setup
  uint16_t rowMask[SIZE], colMask[SIZE], blockMask[SIZE];

  mt19937 rng;
  long long solveCounter;

  void reset() {
    solveCounter = 0; // infinite loops bachane ke liye counter zaroori hai
    for (int i = 0; i < SIZE; i++) {
        rowMask[i] = colMask[i] = blockMask[i] = 0;
    }
    for (int pos = 0; pos < SIZE * SIZE; pos++) {
        gridMap[pos] = -1; // -1 khali jagah dikha raha hai
        numberMap[pos] = 0;
    }
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            macroGrid[i][j] = -1;
        }
    }
  }

  // --- STEP 1: Generate Geometry on a 4x4 Macro Level ---
  // vRem = 4x2 blocks (Vertical dominos)
  // hRem = 2x4 blocks (Horizontal dominos)
  // splitRem = 2x2 Wrapped Pairs (Split dominos)
  bool solveMacroGeometry(int vRem, int hRem, int splitRem) {
    int mr = -1, mc = -1;
    
    // Find the first empty 2x2 chunk space
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        if (macroGrid[i][j] == -1) {
          mr = i; 
          mc = j; 
          break;
        }
      }
      if (mr != -1) break;
    }

    // Saari jagah bhar gayi toh return True
    if (mr == -1) return true;

    vector<int> options;
    if (vRem > 0) options.push_back(0); // Option 0: 4x2 Block
    if (hRem > 0) options.push_back(1); // Option 1: 2x4 Block
    if (splitRem > 0) {
        options.push_back(2); // Option 2: Horizontal 2x2 wrap
        options.push_back(3); // Option 3: Vertical 2x2 wrap
    }
    shuffle(options.begin(), options.end(), rng);

    for (int opt : options) {
      // Calculate block ID dynamically based on placed pieces (0 to 7)
      int blockId = 8 - (vRem + hRem + splitRem); 

      if (opt == 0) { 
        // Try placing a Vertical Domino (Requires mr+1 to be empty)
        if (mr + 1 < 4 && macroGrid[mr + 1][mc] == -1) {
          macroGrid[mr][mc] = blockId;
          macroGrid[mr + 1][mc] = blockId;
          if (solveMacroGeometry(vRem - 1, hRem, splitRem)) return true;
          macroGrid[mr][mc] = -1;
          macroGrid[mr + 1][mc] = -1;
        }
      } 
      else if (opt == 1) { 
        // Try placing a Horizontal Domino (Requires mc+1 to be empty)
        if (mc + 1 < 4 && macroGrid[mr][mc + 1] == -1) {
          macroGrid[mr][mc] = blockId;
          macroGrid[mr][mc + 1] = blockId;
          if (solveMacroGeometry(vRem, hRem - 1, splitRem)) return true;
          macroGrid[mr][mc] = -1;
          macroGrid[mr][mc + 1] = -1;
        }
      } 
      else if (opt == 2) { 
        // Try Horizontal Wrap: Pairs Left edge with Right edge (Cols 0 and 3)
        if (mc == 0 && macroGrid[mr][3] == -1) {
          macroGrid[mr][0] = blockId;
          macroGrid[mr][3] = blockId;
          if (solveMacroGeometry(vRem, hRem, splitRem - 1)) return true;
          macroGrid[mr][0] = -1;
          macroGrid[mr][3] = -1;
        }
      } 
      else if (opt == 3) { 
        // Try Vertical Wrap: Pairs Top edge with Bottom edge (Rows 0 and 3)
        if (mr == 0 && macroGrid[3][mc] == -1) {
          macroGrid[0][mc] = blockId;
          macroGrid[3][mc] = blockId;
          if (solveMacroGeometry(vRem, hRem, splitRem - 1)) return true;
          macroGrid[0][mc] = -1;
          macroGrid[3][mc] = -1;
        }
      }
    }
    return false;
  }

  // --- STEP 2: MRV Solver (Number Placement Phase) ---
  uint16_t getPossible(int r, int c) {
    uint16_t used = rowMask[r] | colMask[c] | blockMask[gridMap[r * SIZE + c]];
    return (~used) & 0xFF; 
  }

  bool solveNumbers() {
    if (++solveCounter > 10000) return false; 

    int bR = -1, bC = -1, minChoices = 10;
    uint16_t bMask = 0;

    for (int r = 0; r < SIZE; r++) {
      for (int c = 0; c < SIZE; c++) {
        int pos = r * SIZE + c;
        if (numberMap[pos] == 0) { 
          uint16_t mask = getPossible(r, c);
          int count = 0;
          for (int i = 0; i < 8; i++)
            if (mask & (1 << i)) count++;
          
          if (count == 0) return false; 
          
          if (count < minChoices) {
            minChoices = count;
            bR = r; 
            bC = c; 
            bMask = mask;
          }
        }
      }
    }

    if (bR == -1) return true; // Completed

    vector<int> nums;
    for (int i = 0; i < 8; i++)
      if (bMask & (1 << i)) 
        nums.push_back(i + 1);
        
    shuffle(nums.begin(), nums.end(), rng); 

    int pos = bR * SIZE + bC;
    int bIdx = gridMap[pos]; 
    
    for (int n : nums) {
      uint16_t bit = 1 << (n - 1);
      
      numberMap[pos] = n; 
      rowMask[bR] |= bit;
      colMask[bC] |= bit;
      blockMask[bIdx] |= bit;

      if (solveNumbers()) return true;

      rowMask[bR] &= ~bit;
      colMask[bC] &= ~bit;
      blockMask[bIdx] &= ~bit;
      numberMap[pos] = 0;
    }
    return false;
  }

public:
  TilingSudoku() : rng(random_device{}()) {}

  void generate() {
    SymmetricPuzzleGenerator<SIZE, 2, 4> clueGen; 
    bool success = false;
    
    while (!success) {
      reset();
      
      // Request exactly: 3 of 4x2, 3 of 2x4, and 2 Wrapped Splits
      if (solveMacroGeometry(3, 3, 2)) {
        
        // Expand the 4x4 Macro Grid into the full 8x8 gridMap
        for (int i = 0; i < 4; i++) {
          for (int j = 0; j < 4; j++) {
            int bId = macroGrid[i][j];
            int r = i * 2;
            int c = j * 2;
            
            // Fill the 2x2 chunk with the assigned Block ID
            gridMap[r * SIZE + c] = bId;
            gridMap[r * SIZE + c + 1] = bId;
            gridMap[(r + 1) * SIZE + c] = bId;
            gridMap[(r + 1) * SIZE + c + 1] = bId;
          }
        }

        // Proceed to solve Sudoku digits based on the new grid
        if (solveNumbers()) {
          for(int i = 0; i < SIZE * SIZE; i++) solution[i] = numberMap[i];
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