#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <numeric>
#include "../include/symmetric_puzzle.cpp"

using namespace std;

const int SIZE = 9;

// Sudoku Medium: 9x9 normal sudoku with 36 clues, symmetric removal, max 5 clues per row/col/subgrid.
class SudokuMedium {
private:
    int board[SIZE * SIZE];
    int solution[SIZE * SIZE];
    
    // Bitmasks array: Fast uniqueness constraint checking (O(1) time complexity)
    uint16_t rowMask[SIZE], colMask[SIZE], boxMask[SIZE];
    
    mt19937 rng;

    void reset() {
        for (int i = 0; i < SIZE; i++) {
            rowMask[i] = colMask[i] = boxMask[i] = 0;
        }
        for (int i = 0; i < SIZE * SIZE; i++) {
            board[i] = 0;
        }
    }

    uint16_t getPossible(int r, int c) {
        uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)];
        return (~used) & 0x1FF; 
    }

    // Minimum Remaining Values (MRV) heuristic with backtracking
    bool solve() {
        int bestR = -1, bestC = -1, minChoices = 10;
        uint16_t bestMask = 0;

        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                int pos = r * SIZE + c;
                if (board[pos] == 0) {
                    uint16_t mask = getPossible(r, c);
                    int choices = __builtin_popcount(mask);
                    if (choices == 0) return false; 
                    
                    if (choices < minChoices) {
                        minChoices = choices;
                        bestR = r; bestC = c;
                        bestMask = mask;
                    }
                    if (minChoices == 1) goto found; 
                }
            }
        }
        
    found:
        if (bestR == -1) return true; 

        vector<int> nums;
        for (int i = 0; i < 9; i++) if (bestMask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);

        int pos = bestR * SIZE + bestC;
        int bIdx = (bestR / 3) * 3 + (bestC / 3);
        
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            board[pos] = n;
            rowMask[bestR] |= bit; colMask[bestC] |= bit; boxMask[bIdx] |= bit;

            if (solve()) return true;

            rowMask[bestR] &= ~bit; colMask[bestC] &= ~bit; boxMask[bIdx] &= ~bit;
            board[pos] = 0;
        }
        return false;
    }

public:
    SudokuMedium() : rng(random_device{}()) {}

    bool generate() {
        SymmetricPuzzleGenerator<SIZE, 3, 3> clueGen;
        bool success = false;
        int attempts = 0;
        const int MAX_ATTEMPTS = 1000;

        while (!success && attempts < MAX_ATTEMPTS) {
            attempts++;
            reset();
            solve();
            for (int i = 0; i < SIZE * SIZE; i++) solution[i] = board[i];
            success = clueGen.generate(board, SUDOKU_MEDIUM_CONFIG); 
        }
        
        return success;
    }

    void printJSON() {
        cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"grid\":[";
        for (int r = 0; r < SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; c++) {
                if (c) cout << ",";
                cout << board[r * SIZE + c];
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
    SudokuMedium game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}
