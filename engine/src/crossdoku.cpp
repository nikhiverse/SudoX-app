// crossdoku.cpp — Crossdoku puzzle generator
// 9x9 grid with standard 3x3 box constraints + bishop diagonal constraints (no row/col uniqueness).
// Uses PuzzleGenerator with CROSSDOKU_CONFIG: 40 clues, max 5 per row/col/subgrid.

#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <cstdint>
#include "../include/random_puzzle.cpp"

using namespace std;

const int SIZE = 9;
const int NUM_DIAGS = 2 * SIZE - 1; // 17 bishop diagonals each direction

class CrossdokuGenerator {
private:
    int board[SIZE * SIZE];
    int solution[SIZE * SIZE];
    mt19937 rng;

    // Bitmasks for O(1) constraint tracking
    uint16_t boxMask[SIZE];         // Nine 3x3 subgrids
    uint16_t diag1Mask[NUM_DIAGS];  // (\) diagonals: r - c + (SIZE - 1)
    uint16_t diag2Mask[NUM_DIAGS];  // (/) diagonals: r + c

    // Row/col masks needed for PuzzleGenerator clue elimination
    uint16_t rowMask[SIZE], colMask[SIZE];

    inline int getBoxIdx(int r, int c) const { return (r / 3) * 3 + (c / 3); }
    inline int getDiag1Idx(int r, int c) const { return r - c + (SIZE - 1); }
    inline int getDiag2Idx(int r, int c) const { return r + c; }

    void reset() {
        for (int i = 0; i < SIZE; i++) rowMask[i] = colMask[i] = boxMask[i] = 0;
        for (int i = 0; i < NUM_DIAGS; i++) diag1Mask[i] = diag2Mask[i] = 0;
        for (int i = 0; i < SIZE * SIZE; i++) board[i] = 0;
    }

    void place(int r, int c, int val) {
        board[r * SIZE + c] = val;
        uint16_t bit = (1 << (val - 1));
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[getBoxIdx(r, c)] |= bit;
        diag1Mask[getDiag1Idx(r, c)] |= bit;
        diag2Mask[getDiag2Idx(r, c)] |= bit;
    }

    void remove(int r, int c, int val) {
        board[r * SIZE + c] = 0;
        uint16_t mask = ~(uint16_t)(1 << (val - 1));
        rowMask[r] &= mask;
        colMask[c] &= mask;
        boxMask[getBoxIdx(r, c)] &= mask;
        diag1Mask[getDiag1Idx(r, c)] &= mask;
        diag2Mask[getDiag2Idx(r, c)] &= mask;
    }

    // Crossdoku: uniqueness constrained by box + bishop diagonals (no row/col)
    inline uint16_t getCandidates(int r, int c) const {
        uint16_t used = boxMask[getBoxIdx(r, c)]
                      | diag1Mask[getDiag1Idx(r, c)]
                      | diag2Mask[getDiag2Idx(r, c)];
        return (~used) & 0x1FF;
    }

    // MRV backtracking solver
    bool solve() {
        int bestR = -1, bestC = -1, minChoices = 10;
        uint16_t bestMask = 0;

        for (int pos = 0; pos < SIZE * SIZE; pos++) {
            if (board[pos] == 0) {
                int r = pos / SIZE, c = pos % SIZE;
                uint16_t mask = getCandidates(r, c);
                int choices = __builtin_popcount(mask);
                if (choices == 0) return false;
                if (choices < minChoices) {
                    minChoices = choices;
                    bestR = r; bestC = c; bestMask = mask;
                }
                if (minChoices == 1) goto found;
            }
        }

    found:
        if (bestR == -1) return true;

        uint8_t vals[9]; int count = 0;
        for (uint16_t m = bestMask; m; m &= m - 1)
            vals[count++] = __builtin_ctz(m) + 1;
        for (int i = count - 1; i > 0; --i) swap(vals[i], vals[rng() % (i + 1)]);

        for (int i = 0; i < count; ++i) {
            place(bestR, bestC, vals[i]);
            if (solve()) return true;
            remove(bestR, bestC, vals[i]);
        }
        return false;
    }

public:
    CrossdokuGenerator() : rng(random_device{}()) {}

    bool generate() {
        PuzzleGenerator<SIZE, 3, 3> clueGen;
        bool success = false;
        int attempts = 0;
        const int MAX_ATTEMPTS = 1000;

        while (!success && attempts < MAX_ATTEMPTS) {
            attempts++;
            reset();
            if (!solve()) continue;
            for (int i = 0; i < SIZE * SIZE; i++) solution[i] = board[i];
            success = clueGen.generate(board, CROSSDOKU_CONFIG);
        }
        return success;
    }

    void printJSON() {
        cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"variant\":\"crossdoku\",\"grid\":[";
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
    CrossdokuGenerator game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}