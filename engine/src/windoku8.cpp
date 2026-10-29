#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include "../include/random_puzzle.cpp"
#include "../include/clues_config.hpp"

using namespace std;

const int SIZE = 9;
const int STEP_LIMIT = 2000;

struct Rect {
    int r1, r2, c1, c2;
};

const CustomWindow WINDOKU8_WINDOWS[4] = {
    {1, 4, 1, 2, 8}, // 4x2 (rows 1..4, cols 1..2) -> digits 1..8
    {1, 2, 4, 7, 8}, // 2x4 (rows 1..2, cols 4..7) -> digits 1..8
    {4, 7, 6, 7, 8}, // 4x2 (rows 4..7, cols 6..7) -> digits 1..8
    {6, 7, 1, 4, 8}  // 2x4 (rows 6..7, cols 1..4) -> digits 1..8
};

class PinwheelWindoku {
private:
    int board[SIZE][SIZE];
    mt19937 rng;
    int stepCount = 0;

    uint16_t rowMask[SIZE];
    uint16_t colMask[SIZE];
    uint16_t boxMask[SIZE];
    uint16_t winMask[4];

    Rect windows[4] = {
        {1, 4, 1, 2},
        {1, 2, 4, 7},
        {4, 7, 6, 7},
        {6, 7, 1, 4}
    };

    int winMap[SIZE][SIZE];
    vector<pair<int, int>> prioritizedCells;

    inline bool inWindow(int r, int c) const {
        return winMap[r][c] != -1;
    }

    void place(int r, int c, int val) {
        board[r][c] = val;
        uint16_t bit = (1 << (val - 1));
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[(r / 3) * 3 + (c / 3)] |= bit;
        int w = winMap[r][c];
        if (w != -1) {
            winMask[w] |= bit;
        }
    }

    void remove(int r, int c, int val) {
        board[r][c] = 0;
        uint16_t mask = ~(1 << (val - 1));
        rowMask[r] &= mask;
        colMask[c] &= mask;
        boxMask[(r / 3) * 3 + (c / 3)] &= mask;
        int w = winMap[r][c];
        if (w != -1) {
            winMask[w] &= mask;
        }
    }

    inline uint16_t getCandidates(int r, int c) const {
        uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)];
        int w = winMap[r][c];
        if (w != -1) {
            used |= winMask[w];
        }
        uint16_t domain = (w != -1) ? 0x0FF : 0x1FF;
        return (~used) & domain;
    }

    bool solveMRV() {
        if (++stepCount > STEP_LIMIT) return false;

        int bestR = -1, bestC = -1;
        int minChoices = 10;
        uint16_t bestMask = 0;

        for (const auto& cell : prioritizedCells) {
            int r = cell.first, c = cell.second;
            if (board[r][c] == 0) {
                uint16_t mask = getCandidates(r, c);
                int choices = __builtin_popcount(mask);
                if (choices == 0) return false;
                if (choices < minChoices) {
                    minChoices = choices;
                    bestR = r;
                    bestC = c;
                    bestMask = mask;
                    if (choices == 1) break;
                }
            }
        }

        if (bestR == -1) return true;

        uint8_t vals[9];
        int count = 0;
        for (uint16_t m = bestMask; m; m &= m - 1) {
            vals[count++] = __builtin_ctz(m) + 1;
        }

        for (int i = count - 1; i > 0; --i) {
            int j = rng() % (i + 1);
            swap(vals[i], vals[j]);
        }

        for (int i = 0; i < count; ++i) {
            place(bestR, bestC, vals[i]);
            if (solveMRV()) return true;
            remove(bestR, bestC, vals[i]);
        }

        return false;
    }

public:
    PinwheelWindoku() : rng(random_device{}()) {
        for (int r = 0; r < SIZE; ++r) {
            for (int c = 0; c < SIZE; ++c) {
                winMap[r][c] = -1;
                for (int w = 0; w < 4; ++w) {
                    if (r >= windows[w].r1 && r <= windows[w].r2 &&
                        c >= windows[w].c1 && c <= windows[w].c2) {
                        winMap[r][c] = w;
                        break;
                    }
                }
            }
        }

        vector<pair<int, int>> windowCells;
        vector<pair<int, int>> standardCells;

        for (int r = 0; r < SIZE; ++r) {
            for (int c = 0; c < SIZE; ++c) {
                if (inWindow(r, c)) {
                    windowCells.push_back({r, c});
                } else {
                    standardCells.push_back({r, c});
                }
            }
        }

        prioritizedCells.insert(prioritizedCells.end(), windowCells.begin(), windowCells.end());
        prioritizedCells.insert(prioritizedCells.end(), standardCells.begin(), standardCells.end());
    }

    bool generate() {
        while (true) {
            for (int r = 0; r < SIZE; ++r) {
                rowMask[r] = colMask[r] = boxMask[r] = 0;
                for (int c = 0; c < SIZE; ++c) {
                    board[r][c] = 0;
                }
            }
            for (int w = 0; w < 4; ++w) winMask[w] = 0;

            stepCount = 0;
            if (solveMRV()) return true;
        }
    }

    int getCell(int r, int c) const {
        return board[r][c];
    }
};

int main() {
    PinwheelWindoku solver;
    while (true) {
        if (solver.generate()) {
            int solution[81];
            int flatBoard[81];
            for (int r = 0; r < SIZE; r++) {
                for (int c = 0; c < SIZE; c++) {
                    int val = solver.getCell(r, c);
                    solution[r * SIZE + c] = val;
                    flatBoard[r * SIZE + c] = val;
                }
            }

            PuzzleConfig config = WINDOKU8_CONFIG;
            PuzzleGenerator<9, 3, 3> clueGen;
            clueGen.customWindows = WINDOKU8_WINDOWS;
            clueGen.numCustomWindows = 4;

            clueGen.customConstraints = [&](const int* b, const PuzzleConfig& cfg) -> bool {
                int clues = 0;
                int rowCounts[9] = {0}, colCounts[9] = {0}, gridCounts[9] = {0};
                int winCounts[4] = {0};
                for (int r = 0; r < 9; r++) {
                    for (int c = 0; c < 9; c++) {
                        int pos = r * 9 + c;
                        if (b[pos] != 0) {
                            clues++;
                            rowCounts[r]++;
                            colCounts[c]++;
                            gridCounts[(r / 3) * 3 + (c / 3)]++;
                            for (int w = 0; w < 4; w++) {
                                if (r >= WINDOKU8_WINDOWS[w].r1 && r <= WINDOKU8_WINDOWS[w].r2 &&
                                    c >= WINDOKU8_WINDOWS[w].c1 && c <= WINDOKU8_WINDOWS[w].c2) {
                                    winCounts[w]++;
                                }
                            }
                        }
                    }
                }
                if (clues != cfg.target_clues) return false;
                for (int i = 0; i < 9; i++) {
                    if (rowCounts[i] > cfg.max_per_row) return false;
                    if (colCounts[i] > cfg.max_per_col) return false;
                    if (gridCounts[i] > cfg.max_per_grid) return false;
                }
                for (int w = 0; w < 4; w++) {
                    if (winCounts[w] > cfg.max_per_window) return false;
                }
                return true;
            };

            if (clueGen.generate(flatBoard, config)) {
                cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"windows\":[[1,1,4,2],[1,4,2,4],[4,6,4,2],[6,1,2,4]],\"grid\":[";
                for (int r = 0; r < 9; r++) {
                    if (r) cout << ",";
                    cout << "[";
                    for (int c = 0; c < 9; c++) {
                        if (c) cout << ",";
                        cout << flatBoard[r * 9 + c];
                    }
                    cout << "]";
                }
                cout << "],\"solution\":[";
                for (int r = 0; r < 9; r++) {
                    if (r) cout << ",";
                    cout << "[";
                    for (int c = 0; c < 9; c++) {
                        if (c) cout << ",";
                        cout << solution[r * 9 + c];
                    }
                    cout << "]";
                }
                cout << "]}" << endl;
                return 0;
            }
        }
    }
    return 0;
}