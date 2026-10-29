#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include "../include/random_puzzle.cpp"
#include "../include/clues_config.hpp"

using namespace std;

const int CANVAS_SIZE = 12; // Grid 1: 0..7, Grid 2: 6..11
const int G2_OFFSET_R = 6;
const int G2_OFFSET_C = 6;
const int STEP_LIMIT = 3000;

struct Rect { int r1, r2, c1, c2; };

class Hybrid8x6Twodoku {
private:
    int board[CANVAS_SIZE][CANVAS_SIZE];
    int solution[CANVAS_SIZE][CANVAS_SIZE];
    mt19937 rng;
    int stepCount = 0;
    int solCount = 0;

    // Bitmasks for O(1) row, col, and block constraints
    uint16_t g1Row[8], g1Col[8], g1Block[8];
    uint16_t g2Row[6], g2Col[6], g2Block[6];

    // Grid 1 (8x8) custom block partition layout
    Rect g1Bounds[8] = {
        {0, 1, 0, 3}, {2, 3, 0, 3}, // Top-Left: two 2x4 horizontal
        {0, 3, 4, 5}, {0, 3, 6, 7}, // Top-Right: two 4x2 vertical
        {4, 7, 0, 1}, {4, 7, 2, 3}, // Bottom-Left: two 4x2 vertical
        {4, 5, 4, 7}, {6, 7, 4, 7}  // Bottom-Right: two 2x4 horizontal
    };

    int g1BlockMap[8][8];
    vector<pair<int, int>> prioritizedCells;
    vector<pair<int, int>> allActiveCells;

    inline bool inG1(int r, int c) const {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    inline bool inG2(int r, int c) const {
        return r >= G2_OFFSET_R && r < G2_OFFSET_R + 6 &&
               c >= G2_OFFSET_C && c < G2_OFFSET_C + 6;
    }

    inline bool inOverlap(int r, int c) const {
        return r >= 6 && r <= 7 && c >= 6 && c <= 7;
    }

    // Grid 2 (6x6) uses standard 3x2 vertical blocks
    inline int getG2Block(int lr, int lc) const {
        return (lr / 3) * 3 + (lc / 2);
    }

    void place(int r, int c, int val) {
        board[r][c] = val;
        uint16_t bit = (1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] |= bit;
            g1Col[c] |= bit;
            g1Block[g1BlockMap[r][c]] |= bit;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] |= bit;
            g2Col[lc] |= bit;
            g2Block[getG2Block(lr, lc)] |= bit;
        }
    }

    void remove(int r, int c, int val) {
        board[r][c] = 0;
        uint16_t mask = ~(1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] &= mask;
            g1Col[c] &= mask;
            g1Block[g1BlockMap[r][c]] &= mask;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] &= mask;
            g2Col[lc] &= mask;
            g2Block[getG2Block(lr, lc)] &= mask;
        }
    }

    uint16_t getCandidates(int r, int c) const {
        uint16_t used = 0;
        if (inG1(r, c)) {
            used |= g1Row[r] | g1Col[c] | g1Block[g1BlockMap[r][c]];
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            used |= g2Row[lr] | g2Col[lc] | g2Block[getG2Block(lr, lc)];
        }
        // Overlap cells or Grid 2 cells only hold 1..6; Grid 1 outside overlap holds 1..8
        uint16_t domain = (inOverlap(r, c) || inG2(r, c)) ? 0x03F : 0x0FF;
        return (~used) & domain;
    }

    bool solveFastMRV() {
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

        uint8_t vals[8];
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
            if (solveFastMRV()) return true;
            remove(bestR, bestC, vals[i]);
        }

        return false;
    }

    void countMRV() {
        if (solCount > 1) return;
        int bestR = -1, bestC = -1;
        int minChoices = 10;
        uint16_t bestMask = 0;

        for (const auto& cell : allActiveCells) {
            int r = cell.first, c = cell.second;
            if (board[r][c] == 0) {
                uint16_t mask = getCandidates(r, c);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return;
                if (ch < minChoices) {
                    minChoices = ch;
                    bestR = r;
                    bestC = c;
                    bestMask = mask;
                    if (ch == 1) break;
                }
            }
        }

        if (bestR == -1) {
            solCount++;
            return;
        }

        for (uint16_t m = bestMask; m; m &= m - 1) {
            int val = __builtin_ctz(m) + 1;
            place(bestR, bestC, val);
            countMRV();
            remove(bestR, bestC, val);
            if (solCount > 1) return;
        }
    }

    int countSolutions() {
        solCount = 0;
        countMRV();
        return solCount;
    }

    void extractGrid(int* g, int oR, int oC, int size) {
        for (int r = 0; r < size; r++)
            for (int c = 0; c < size; c++)
                g[r * size + c] = board[r + oR][c + oC];
    }

    void buildG1Map(int* gm) {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                gm[r * 8 + c] = g1BlockMap[r][c];
    }

    bool checkGrid8x8(const int* g, int maxClues) {
        int rC[8] = {}, cC[8] = {}, bC[8] = {};
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (g[r * 8 + c] != 0) {
                    rC[r]++;
                    cC[c]++;
                    bC[g1BlockMap[r][c]]++;
                }
            }
        }
        for (int i = 0; i < 8; i++) {
            if (rC[i] > maxClues || cC[i] > maxClues || bC[i] > maxClues)
                return false;
        }
        return true;
    }

    bool checkGrid6x6(const int* g, int maxClues) {
        int rC[6] = {}, cC[6] = {}, bC[6] = {};
        for (int r = 0; r < 6; r++) {
            for (int c = 0; c < 6; c++) {
                if (g[r * 6 + c] != 0) {
                    rC[r]++;
                    cC[c]++;
                    bC[getG2Block(r, c)]++;
                }
            }
        }
        for (int i = 0; i < 6; i++) {
            if (rC[i] > maxClues || cC[i] > maxClues || bC[i] > maxClues)
                return false;
        }
        return true;
    }

    bool checkBothGrids() {
        int g1[64], g2[36];
        extractGrid(g1, 0, 0, 8);
        extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C, 6);
        return checkGrid8x8(g1, 5) && checkGrid6x6(g2, 3);
    }

public:
    Hybrid8x6Twodoku() : rng(random_device{}()) {
        for (int i = 0; i < 8; ++i) {
            for (int r = g1Bounds[i].r1; r <= g1Bounds[i].r2; ++r) {
                for (int c = g1Bounds[i].c1; c <= g1Bounds[i].c2; ++c) {
                    g1BlockMap[r][c] = i;
                }
            }
        }

        vector<pair<int, int>> overlapGroup;
        vector<pair<int, int>> boundaryGroup;
        vector<pair<int, int>> remainingGroup;

        for (int r = 0; r < CANVAS_SIZE; ++r) {
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (!inG1(r, c) && !inG2(r, c)) continue;
                allActiveCells.push_back({r, c});
                if (inOverlap(r, c)) {
                    overlapGroup.push_back({r, c});
                } else if ((r >= 5 && r <= 8) && (c >= 5 && c <= 8)) {
                    boundaryGroup.push_back({r, c});
                } else {
                    remainingGroup.push_back({r, c});
                }
            }
        }

        prioritizedCells.insert(prioritizedCells.end(), overlapGroup.begin(), overlapGroup.end());
        prioritizedCells.insert(prioritizedCells.end(), boundaryGroup.begin(), boundaryGroup.end());
        prioritizedCells.insert(prioritizedCells.end(), remainingGroup.begin(), remainingGroup.end());
    }

    bool solveCompleteBoard() {
        while (true) {
            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    board[r][c] = 0;

            for (int i = 0; i < 8; ++i) g1Row[i] = g1Col[i] = g1Block[i] = 0;
            for (int i = 0; i < 6; ++i) g2Row[i] = g2Col[i] = g2Block[i] = 0;

            stepCount = 0;
            if (solveFastMRV()) return true;
        }
    }

    bool generate() {
        const PuzzleConfig& config = TWODOKU_86_CONFIG;
        int g1Map[64];
        buildG1Map(g1Map);

        while (true) {
            if (!solveCompleteBoard()) continue;

            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    solution[r][c] = board[r][c];

            int g1[64], g2[36];
            extractGrid(g1, 0, 0, 8);
            extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C, 6);

            // Carve Grid 1 (8x8): max 5 per row/col/grid
            PuzzleConfig g1Cfg = {32, 5, 5, 5, 8, false, false, 8, false, false};
            PuzzleGenerator<8, 2, 4> gen1;
            gen1.gridMap = g1Map;
            if (!gen1.generate(g1, g1Cfg)) continue;

            // Carve Grid 2 (6x6): max 3 per row/col/grid (3x2 blocks)
            PuzzleConfig g2Cfg = {16, 3, 3, 3, 6, false, false, 6, false, false};
            PuzzleGenerator<6, 3, 2> gen2;
            if (!gen2.generate(g2, g2Cfg)) continue;

            // Merge back to canvas
            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    remove(r, c, board[r][c]);

            for (int r = 0; r < 8; ++r)
                for (int c = 0; c < 8; ++c)
                    if (g1[r * 8 + c] != 0)
                        place(r, c, g1[r * 8 + c]);

            for (int r = 0; r < 6; ++r) {
                for (int c = 0; c < 6; ++c) {
                    int val = g2[r * 6 + c];
                    if (val != 0) {
                        int br = r + G2_OFFSET_R, bc = c + G2_OFFSET_C;
                        if (board[br][bc] != 0) remove(br, bc, board[br][bc]);
                        place(br, bc, val);
                    }
                }
            }

            int fg1[64], fg2[36];
            extractGrid(fg1, 0, 0, 8);
            extractGrid(fg2, G2_OFFSET_R, G2_OFFSET_C, 6);
            if (!checkGrid8x8(fg1, 5) || !checkGrid6x6(fg2, 3)) continue;

            int totalClues = 0;
            for (const auto& cell : allActiveCells) {
                if (board[cell.first][cell.second] != 0) totalClues++;
            }

            if (totalClues < config.target_clues) continue;

            if (totalClues > config.target_clues) {
                vector<pair<int, int>> extras;
                for (const auto& cell : allActiveCells) {
                    if (board[cell.first][cell.second] != 0)
                        extras.push_back(cell);
                }
                shuffle(extras.begin(), extras.end(), rng);

                for (const auto& cell : extras) {
                    if (totalClues <= config.target_clues) break;
                    int r = cell.first, c = cell.second;
                    int bk = board[r][c];
                    remove(r, c, bk);
                    if (checkBothGrids() && countSolutions() == 1) {
                        totalClues--;
                    } else {
                        place(r, c, bk);
                    }
                }
            }

            if (totalClues == config.target_clues && countSolutions() == 1) {
                return true;
            }
        }
    }

    void printJSON() {
        cout << "{\"type\":\"twodoku\",\"totalRows\":12,\"totalCols\":12,";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":8,\"subR\":4,\"subC\":4},{\"r\":6,\"c\":6,\"size\":6,\"subR\":3,\"subC\":2}],";
        cout << "\"grid\":[";
        for (int r = 0; r < CANVAS_SIZE; ++r) {
            if (r) cout << ","; cout << "[";
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (c) cout << ","; cout << board[r][c];
            }
            cout << "]";
        }
        cout << "],\"blocks\":[";
        for (int r = 0; r < CANVAS_SIZE; ++r) {
            if (r) cout << ","; cout << "[";
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (c) cout << ",";
                int bid = -1;
                if (inG1(r, c) && inG2(r, c)) bid = getG2Block(r - G2_OFFSET_R, c - G2_OFFSET_C) + 8;
                else if (inG1(r, c)) bid = g1BlockMap[r][c];
                else if (inG2(r, c)) bid = getG2Block(r - G2_OFFSET_R, c - G2_OFFSET_C) + 8;
                cout << bid;
            }
            cout << "]";
        }
        cout << "],\"active\":[";
        for (int r = 0; r < CANVAS_SIZE; ++r) {
            if (r) cout << ","; cout << "[";
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (c) cout << ","; cout << (inG1(r, c) || inG2(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"overlap\":[";
        for (int r = 0; r < CANVAS_SIZE; ++r) {
            if (r) cout << ","; cout << "[";
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (c) cout << ","; cout << (inOverlap(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"solution\":[";
        for (int r = 0; r < CANVAS_SIZE; ++r) {
            if (r) cout << ","; cout << "[";
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (c) cout << ","; cout << solution[r][c];
            }
            cout << "]";
        }
        cout << "]}" << endl;
    }
};

int main() {
    Hybrid8x6Twodoku game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "Failed to generate twodoku86\n";
        return 1;
    }
    return 0;
}