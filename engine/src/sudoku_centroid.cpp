// sudoku_centroid.cpp — Sudoku Centroid puzzle generator
// 9x9 standard Sudoku. Clues are never placed in the center cell (position [1][1] in local coords)
// of any 3x3 subgrid. Uses PuzzleGenerator with SUDOKU_CENTROID_CONFIG: 30-38 clues, max 5/row/col/subgrid.

#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <numeric>
#include "../include/random_puzzle.cpp"

using namespace std;

const int SIZE = 9;

// The 9 center-cells of each 3x3 subgrid (global positions in 9x9):
// subgrid (br, bc) has its center at (br*3+1, bc*3+1)
static bool isCenterCell(int r, int c) {
    // Row within subgrid = r % 3, col within subgrid = c % 3
    // Center = row%3 == 1 && col%3 == 1
    return (r % 3 == 1) && (c % 3 == 1);
}

class SudokuCentroid {
private:
    int board[SIZE * SIZE];
    int solution[SIZE * SIZE];

    uint16_t rowMask[SIZE], colMask[SIZE], boxMask[SIZE];
    mt19937 rng;

    void reset() {
        for (int i = 0; i < SIZE; i++) rowMask[i] = colMask[i] = boxMask[i] = 0;
        for (int i = 0; i < SIZE * SIZE; i++) board[i] = 0;
    }

    uint16_t getPossible(int r, int c) {
        uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)];
        return (~used) & 0x1FF;
    }

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
                        bestR = r; bestC = c; bestMask = mask;
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
    SudokuCentroid() : rng(random_device{}()) {}

    bool generate() {
        PuzzleGenerator<SIZE, 3, 3> clueGen;
        bool success = false;
        int attempts = 0;
        const int MAX_ATTEMPTS = 1000;

        while (!success && attempts < MAX_ATTEMPTS) {
            attempts++;
            reset();
            solve();
            for (int i = 0; i < SIZE * SIZE; i++) solution[i] = board[i];

            // Get config and use a custom constraint function that blocks center cells
            PuzzleConfig cfg = SUDOKU_CENTROID_CONFIG;

            // Use customConstraints to enforce no clues on center cells
            clueGen.customConstraints = [](const int* board, const PuzzleConfig& cfg) -> bool {
                int clues = 0;
                int rowCounts[9] = {}, colCounts[9] = {}, gridCounts[9] = {};
                for (int r = 0; r < 9; r++) {
                    for (int c = 0; c < 9; c++) {
                        int pos = r * 9 + c;
                        if (board[pos] != 0) {
                            // Reject if a clue is on any subgrid center cell
                            if (isCenterCell(r, c)) return false;
                            clues++;
                            rowCounts[r]++;
                            colCounts[c]++;
                            gridCounts[(r / 3) * 3 + (c / 3)]++;
                        }
                    }
                }
                if (clues != cfg.target_clues) return false;
                for (int i = 0; i < 9; i++) {
                    if (rowCounts[i] > cfg.max_per_row) return false;
                    if (colCounts[i] > cfg.max_per_col) return false;
                    if (gridCounts[i] > cfg.max_per_grid) return false;
                }
                return true;
            };

            // Pre-clear center cells to guide elimination faster
            for (int r = 0; r < SIZE; r++)
                for (int c = 0; c < SIZE; c++)
                    if (isCenterCell(r, c)) board[r * SIZE + c] = 0;

            success = clueGen.generate(board, cfg);

            // Restore board from solution for next attempt if failed
            if (!success)
                for (int i = 0; i < SIZE * SIZE; i++) board[i] = solution[i];
        }
        return success;
    }

    void printJSON() {
        cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"variant\":\"centroid\",\"grid\":[";
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
    SudokuCentroid game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}