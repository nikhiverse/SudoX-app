#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include "../include/random_puzzle.cpp"
#include "../include/clues_config.hpp"

using namespace std;

const int CANVAS_SIZE = 13;
const int G2_OFFSET_R = 5;
const int G2_OFFSET_C = 5;
const int STEP_LIMIT = 800; // Bail out and restart if branch path stalls

struct Rect { int r1, r2, c1, c2; };

class TurboDual8x8 {
private:
    int board[CANVAS_SIZE][CANVAS_SIZE];
    int solution[CANVAS_SIZE][CANVAS_SIZE];
    mt19937 rng;
    int stepCount = 0;
    int solCount = 0;

    uint16_t g1Row[8], g1Col[8], g1Block[8];
    uint16_t g2Row[8], g2Col[8], g2Block[8];

    Rect blockBounds[8] = {
        {0, 1, 0, 3}, {2, 3, 0, 3},
        {0, 3, 4, 5}, {0, 3, 6, 7},
        {4, 7, 0, 1}, {4, 7, 2, 3},
        {4, 5, 4, 7}, {6, 7, 4, 7}
    };

    int blockMap[8][8];
    vector<pair<int, int>> overlapCells;
    vector<pair<int, int>> remainingCells;
    vector<pair<int, int>> allActiveCells;

    inline bool inG1(int r, int c) const {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    inline bool inG2(int r, int c) const {
        return r >= G2_OFFSET_R && r < G2_OFFSET_R + 8 &&
               c >= G2_OFFSET_C && c < G2_OFFSET_C + 8;
    }

    inline bool inOverlap(int r, int c) const {
        return r >= 5 && r <= 7 && c >= 5 && c <= 7;
    }

    void place(int r, int c, int val) {
        board[r][c] = val;
        uint16_t bit = (1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] |= bit;
            g1Col[c] |= bit;
            g1Block[blockMap[r][c]] |= bit;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] |= bit;
            g2Col[lc] |= bit;
            g2Block[blockMap[lr][lc]] |= bit;
        }
    }

    void remove(int r, int c, int val) {
        board[r][c] = 0;
        uint16_t mask = ~(1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] &= mask;
            g1Col[c] &= mask;
            g1Block[blockMap[r][c]] &= mask;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] &= mask;
            g2Col[lc] &= mask;
            g2Block[blockMap[lr][lc]] &= mask;
        }
    }

    uint16_t getCandidates(int r, int c) const {
        uint16_t used = 0;
        if (inG1(r, c)) {
            used |= g1Row[r] | g1Col[c] | g1Block[blockMap[r][c]];
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            used |= g2Row[lr] | g2Col[lc] | g2Block[blockMap[lr][lc]];
        }
        return (~used) & 0x0FF;
    }

    bool solveOverlap(int idx) {
        if (idx == (int)overlapCells.size()) return true;

        int r = overlapCells[idx].first;
        int c = overlapCells[idx].second;

        uint16_t mask = getCandidates(r, c);
        uint8_t vals[8];
        int count = 0;
        for (uint16_t m = mask; m; m &= m - 1) {
            vals[count++] = __builtin_ctz(m) + 1;
        }

        for (int i = count - 1; i > 0; --i) {
            int j = rng() % (i + 1);
            swap(vals[i], vals[j]);
        }

        for (int i = 0; i < count; ++i) {
            place(r, c, vals[i]);
            if (solveOverlap(idx + 1)) return true;
            remove(r, c, vals[i]);
        }
        return false;
    }

    bool solveRemainingMRV() {
        if (++stepCount > STEP_LIMIT) return false;

        int bestR = -1, bestC = -1;
        int minChoices = 10;
        uint16_t bestMask = 0;

        for (const auto& cell : remainingCells) {
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
            if (solveRemainingMRV()) return true;
            remove(bestR, bestC, vals[i]);
        }

        return false;
    }

    int evalCount = 0;
    void countMRV() {
        if (++evalCount > 800) { solCount = 2; return; }
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
        evalCount = 0;
        countMRV();
        return solCount;
    }

    void extractGrid(int* g, int oR, int oC) {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                g[r * 8 + c] = board[r + oR][c + oC];
    }

    void buildGridMap(int* gm) {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                gm[r * 8 + c] = blockMap[r][c];
    }

    bool checkGrid8x8(const int* g, int maxClues) {
        int rC[8] = {}, cC[8] = {}, bC[8] = {};
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (g[r * 8 + c] != 0) {
                    rC[r]++;
                    cC[c]++;
                    bC[blockMap[r][c]]++;
                }
            }
        }
        for (int i = 0; i < 8; i++) {
            if (rC[i] > maxClues || cC[i] > maxClues || bC[i] > maxClues)
                return false;
        }
        return true;
    }

    bool checkBothGrids(const PuzzleConfig& config) {
        int g1[64], g2[64];
        extractGrid(g1, 0, 0);
        extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C);
        return checkGrid8x8(g1, config.max_per_row) &&
               checkGrid8x8(g2, config.max_per_row);
    }

public:
    TurboDual8x8() : rng(random_device{}()) {
        for (int i = 0; i < 8; ++i) {
            for (int r = blockBounds[i].r1; r <= blockBounds[i].r2; ++r) {
                for (int c = blockBounds[i].c1; c <= blockBounds[i].c2; ++c) {
                    blockMap[r][c] = i;
                }
            }
        }

        for (int r = 0; r < CANVAS_SIZE; ++r) {
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (inOverlap(r, c)) {
                    overlapCells.push_back({r, c});
                    allActiveCells.push_back({r, c});
                } else if (inG1(r, c) || inG2(r, c)) {
                    remainingCells.push_back({r, c});
                    allActiveCells.push_back({r, c});
                }
            }
        }
    }

    bool solveCompleteBoard() {
        while (true) {
            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    board[r][c] = 0;

            for (int i = 0; i < 8; ++i) {
                g1Row[i] = g1Col[i] = g1Block[i] = 0;
                g2Row[i] = g2Col[i] = g2Block[i] = 0;
            }

            shuffle(overlapCells.begin(), overlapCells.end(), rng);

            if (solveOverlap(0)) {
                stepCount = 0;
                if (solveRemainingMRV()) return true;
            }
        }
    }

    bool generate() {
        const PuzzleConfig& config = TWODOKU_89_CONFIG;
        int gMap[64];
        buildGridMap(gMap);

        while (true) {
            if (!solveCompleteBoard()) continue;

            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    solution[r][c] = board[r][c];

            int g1[64], g2[64];
            extractGrid(g1, 0, 0);
            extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C);

            int targetEach = max(28, (config.target_clues + 4) / 2);
            PuzzleConfig gCfg = {targetEach, 5, 5, 5, 8, false, false, 8, false, false};
            PuzzleGenerator<8, 2, 4> gen1;
            gen1.gridMap = gMap;
            if (!gen1.generate(g1, gCfg)) continue;

            PuzzleGenerator<8, 2, 4> gen2;
            gen2.gridMap = gMap;
            if (!gen2.generate(g2, gCfg)) continue;

            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    remove(r, c, board[r][c]);

            for (int r = 0; r < 8; ++r)
                for (int c = 0; c < 8; ++c)
                    if (g1[r * 8 + c] != 0)
                        place(r, c, g1[r * 8 + c]);

            for (int r = 0; r < 8; ++r) {
                for (int c = 0; c < 8; ++c) {
                    int val = g2[r * 8 + c];
                    if (val != 0) {
                        int br = r + G2_OFFSET_R, bc = c + G2_OFFSET_C;
                        if (board[br][bc] != 0) remove(br, bc, board[br][bc]);
                        place(br, bc, val);
                    }
                }
            }

            int fg1[64];
            extractGrid(fg1, 0, 0);
            if (!checkGrid8x8(fg1, config.max_per_row)) continue;

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
                    if (checkBothGrids(config) && countSolutions() == 1) {
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
        cout << "{\"type\":\"twodoku\",\"totalRows\":13,\"totalCols\":13,";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":8,\"subR\":4,\"subC\":4},{\"r\":5,\"c\":5,\"size\":8,\"subR\":4,\"subC\":4}],";
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
                if (inG1(r, c) && inG2(r, c)) bid = blockMap[r - G2_OFFSET_R][c - G2_OFFSET_C] + 8;
                else if (inG1(r, c)) bid = blockMap[r][c];
                else if (inG2(r, c)) bid = blockMap[r - G2_OFFSET_R][c - G2_OFFSET_C] + 8;
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
    TurboDual8x8 game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "Failed to generate twodoku89\n";
        return 1;
    }
    return 0;
}