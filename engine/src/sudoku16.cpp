#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include <chrono>

using namespace std;

const int SIZE = 16;
const int SUB = 4;
const uint32_t FULL_MASK = 0xFFFF; // 16 bits (values 1..16 -> 1..9, A..G)
const int STEP_LIMIT = 2000;

// Symbol lookup: index 0 is '.', 1..9 are '1'..'9', 10..16 are 'A'..'G'
const char SYMBOLS[17] = {
    '.',
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G'
};

class FastSudoku16x16 {
private:
    int board[SIZE * SIZE];
    int boxLookup[SIZE * SIZE];
    int boxCells[SIZE][SIZE];

    uint32_t rowMask[SIZE];
    uint32_t colMask[SIZE];
    uint32_t boxMask[SIZE];

    mt19937 rng;
    int stepCount = 0;

    void initLookups() {
        int bIdx[SIZE] = {0};
        for (int r = 0; r < SIZE; ++r) {
            for (int c = 0; c < SIZE; ++c) {
                int pos = r * SIZE + c;
                int b = (r / SUB) * SUB + (c / SUB);
                boxLookup[pos] = b;
                boxCells[b][bIdx[b]++] = pos;
            }
        }
    }

    inline void place(int pos, int val) {
        board[pos] = val;
        uint32_t bit = (1U << (val - 1));
        int r = pos / SIZE, c = pos % SIZE;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[boxLookup[pos]] |= bit;
    }

    inline void remove(int pos, int val) {
        board[pos] = 0;
        uint32_t mask = ~(1U << (val - 1));
        int r = pos / SIZE, c = pos % SIZE;
        rowMask[r] &= mask;
        colMask[c] &= mask;
        boxMask[boxLookup[pos]] &= mask;
    }

    // ====================================================================
    // MRV + HIDDEN SINGLES + DEAD-END UNIT PRUNING SOLVER
    // ====================================================================
    bool solve() {
        if (++stepCount > STEP_LIMIT) return false;

        int bestPos = -1;
        int minChoices = SIZE + 1;
        uint32_t bestMask = 0;
        uint32_t cellMask[SIZE * SIZE] = {0};

        // 1. Naked Singles / Minimum Remaining Values (MRV) Scan
        for (int pos = 0; pos < SIZE * SIZE; ++pos) {
            if (board[pos] == 0) {
                int r = pos / SIZE, c = pos % SIZE;
                uint32_t used = rowMask[r] | colMask[c] | boxMask[boxLookup[pos]];
                uint32_t mask = (~used) & FULL_MASK;
                if (mask == 0) return false; // Immediate dead end

                cellMask[pos] = mask;
                int choices = __builtin_popcount(mask);
                if (choices < minChoices) {
                    minChoices = choices;
                    bestPos = pos;
                    bestMask = mask;
                    if (choices == 1) goto commit_move; // Forced naked single
                }
            }
        }

        if (bestPos == -1) return true; // All 256 cells filled!

        // 2. Hidden Singles & Dead-Unit Pruning across Rows
        for (int r = 0; r < SIZE; ++r) {
            uint32_t unplaced = (~rowMask[r]) & FULL_MASK;
            uint32_t seenOnce = 0, seenMultiple = 0;
            int rowBase = r * SIZE;
            for (int c = 0; c < SIZE; ++c) {
                uint32_t m = cellMask[rowBase + c];
                seenMultiple |= (seenOnce & m);
                seenOnce |= m;
            }
            if ((seenOnce & unplaced) != unplaced) return false;

            uint32_t hidden = seenOnce & (~seenMultiple) & unplaced;
            if (hidden) {
                int bitIdx = __builtin_ctz(hidden);
                uint32_t targetBit = (1U << bitIdx);
                for (int c = 0; c < SIZE; ++c) {
                    if (cellMask[rowBase + c] & targetBit) {
                        bestPos = rowBase + c;
                        bestMask = targetBit;
                        goto commit_move;
                    }
                }
            }
        }

        // 3. Hidden Singles & Dead-Unit Pruning across Columns
        for (int c = 0; c < SIZE; ++c) {
            uint32_t unplaced = (~colMask[c]) & FULL_MASK;
            uint32_t seenOnce = 0, seenMultiple = 0;
            for (int r = 0; r < SIZE; ++r) {
                uint32_t m = cellMask[r * SIZE + c];
                seenMultiple |= (seenOnce & m);
                seenOnce |= m;
            }
            if ((seenOnce & unplaced) != unplaced) return false;

            uint32_t hidden = seenOnce & (~seenMultiple) & unplaced;
            if (hidden) {
                int bitIdx = __builtin_ctz(hidden);
                uint32_t targetBit = (1U << bitIdx);
                for (int r = 0; r < SIZE; ++r) {
                    if (cellMask[r * SIZE + c] & targetBit) {
                        bestPos = r * SIZE + c;
                        bestMask = targetBit;
                        goto commit_move;
                    }
                }
            }
        }

        // 4. Hidden Singles & Dead-Unit Pruning across 4x4 Subgrids
        for (int b = 0; b < SIZE; ++b) {
            uint32_t unplaced = (~boxMask[b]) & FULL_MASK;
            uint32_t seenOnce = 0, seenMultiple = 0;
            for (int i = 0; i < SIZE; ++i) {
                uint32_t m = cellMask[boxCells[b][i]];
                seenMultiple |= (seenOnce & m);
                seenOnce |= m;
            }
            if ((seenOnce & unplaced) != unplaced) return false;

            uint32_t hidden = seenOnce & (~seenMultiple) & unplaced;
            if (hidden) {
                int bitIdx = __builtin_ctz(hidden);
                uint32_t targetBit = (1U << bitIdx);
                for (int i = 0; i < SIZE; ++i) {
                    int pos = boxCells[b][i];
                    if (cellMask[pos] & targetBit) {
                        bestPos = pos;
                        bestMask = targetBit;
                        goto commit_move;
                    }
                }
            }
        }

    commit_move:
        uint8_t vals[SIZE];
        int count = 0;
        for (uint32_t m = bestMask; m; m &= m - 1) {
            vals[count++] = __builtin_ctz(m) + 1;
        }
        if (count > 1) {
            for (int i = count - 1; i > 0; --i) {
                swap(vals[i], vals[rng() % (i + 1)]);
            }
        }

        for (int i = 0; i < count; ++i) {
            place(bestPos, vals[i]);
            if (solve()) return true;
            remove(bestPos, vals[i]);
        }

        return false;
    }

public:
    FastSudoku16x16() : rng(random_device{}()) {
        initLookups();
    }

    bool generate() {
        while (true) {
            for (int i = 0; i < SIZE; ++i) {
                rowMask[i] = colMask[i] = boxMask[i] = 0;
            }
            for (int i = 0; i < SIZE * SIZE; ++i) {
                board[i] = 0;
            }

            // Seed the 4 independent diagonal 4x4 boxes (Boxes 0, 5, 10, 15)
            for (int d = 0; d < SUB; ++d) {
                uint8_t nums[SIZE];
                for (int i = 0; i < SIZE; ++i) nums[i] = i + 1;
                for (int i = SIZE - 1; i > 0; --i) {
                    swap(nums[i], nums[rng() % (i + 1)]);
                }
                int b = d * SUB + d;
                for (int i = 0; i < SIZE; ++i) {
                    place(boxCells[b][i], nums[i]);
                }
            }

            stepCount = 0;
            if (solve()) return true;
        }
    }

    void print() const {
        cout << "\n================ COMPLETED 16x16 SUDOKU (1-9, A-G) ================\n\n";
        for (int r = 0; r < SIZE; ++r) {
            if (r > 0 && r % SUB == 0) {
                cout << "---------+---------+---------+---------\n";
            }
            for (int c = 0; c < SIZE; ++c) {
                if (c > 0 && c % SUB == 0) cout << " |";
                cout << " " << SYMBOLS[board[r * SIZE + c]];
            }
            cout << "\n";
        }
        cout << "\nLegend: Symbols {1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F, G}\n";
        cout << "        (where A=10, B=11, C=12, D=13, E=14, F=15, G=16)\n";
    }

    bool verify() const {
        for (int i = 0; i < SIZE; ++i) {
            if (rowMask[i] != FULL_MASK || colMask[i] != FULL_MASK || boxMask[i] != FULL_MASK) {
                return false;
            }
        }
        for (int pos = 0; pos < SIZE * SIZE; ++pos) {
            if (board[pos] < 1 || board[pos] > SIZE) return false;
        }
        return true;
    }
};

int main() {
    FastSudoku16x16 solver;
    auto start = chrono::high_resolution_clock::now();
    if (solver.generate()) {
        auto end = chrono::high_resolution_clock::now();
        chrono::duration<double, milli> elapsed = end - start;
        solver.print();
        if (solver.verify()) {
            cout << "\nVerification: SUCCESS (All 16 rows, 16 columns, and 16 4x4 boxes verified 1-9 & A-G).\n";
        } else {
            cout << "\nVerification: FAILED.\n";
        }
        cout << "Execution Time: " << elapsed.count() << " ms\n";
    }
    return 0;
}