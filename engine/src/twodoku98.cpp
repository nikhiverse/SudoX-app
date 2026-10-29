#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include "../include/random_puzzle.cpp"
#include "../include/clues_config.hpp"

using namespace std;

const int CANVAS_SIZE = 15;
const int G2_OFFSET_R = 7;
const int G2_OFFSET_C = 7;
const int STEP_LIMIT = 3000; // Fast-restart limit

struct Rect { int r1, r2, c1, c2; };

class TurboHybridTwodoku {
private:
    int board[CANVAS_SIZE][CANVAS_SIZE];
    int solution[CANVAS_SIZE][CANVAS_SIZE];
    mt19937 rng;
    int stepCount = 0;
    int solCount = 0;

    // Bitmasks for O(1) state tracking
    uint16_t g1Row[9], g1Col[9], g1Box[9];
    uint16_t g2Row[8], g2Col[8], g2Block[8];

    Rect g2Bounds[8] = {
        {0, 3, 0, 1}, {0, 3, 2, 3}, // Left-top 4x2
        {0, 1, 4, 7}, {2, 3, 4, 7}, // Right-top 2x4
        {4, 5, 0, 3}, {6, 7, 0, 3}, // Left-bottom 2x4
        {4, 7, 4, 5}, {4, 7, 6, 7}  // Right-bottom 4x2
    };

    int g2BlockMap[8][8];
    vector<pair<int, int>> prioritizedCells;
    vector<pair<int, int>> allActiveCells;

    inline bool inG1(int r, int c) const { 
        return r >= 0 && r < 9 && c >= 0 && c < 9; 
    }
    
    inline bool inG2(int r, int c) const { 
        return r >= G2_OFFSET_R && r < G2_OFFSET_R + 8 && 
               c >= G2_OFFSET_C && c < G2_OFFSET_C + 8; 
    }
    
    inline bool inOverlap(int r, int c) const { 
        return r >= 7 && r <= 8 && c >= 7 && c <= 8; 
    }

    void place(int r, int c, int val) {
        board[r][c] = val;
        uint16_t bit = (1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] |= bit;
            g1Col[c] |= bit;
            g1Box[(r / 3) * 3 + (c / 3)] |= bit;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] |= bit;
            g2Col[lc] |= bit;
            g2Block[g2BlockMap[lr][lc]] |= bit;
        }
    }

    void remove(int r, int c, int val) {
        board[r][c] = 0;
        uint16_t mask = ~(1 << (val - 1));
        if (inG1(r, c)) {
            g1Row[r] &= mask;
            g1Col[c] &= mask;
            g1Box[(r / 3) * 3 + (c / 3)] &= mask;
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            g2Row[lr] &= mask;
            g2Col[lc] &= mask;
            g2Block[g2BlockMap[lr][lc]] &= mask;
        }
    }

    uint16_t getCandidates(int r, int c) const {
        uint16_t used = 0;
        if (inG1(r, c)) {
            used |= g1Row[r] | g1Col[c] | g1Box[(r / 3) * 3 + (c / 3)];
        }
        if (inG2(r, c)) {
            int lr = r - G2_OFFSET_R, lc = c - G2_OFFSET_C;
            used |= g2Row[lr] | g2Col[lc] | g2Block[g2BlockMap[lr][lc]];
        }
        uint16_t domain = (inOverlap(r, c) || inG2(r, c)) ? 0x0FF : 0x1FF;
        return (~used) & domain;
    }

    bool solveFastMRV() {
        if (++stepCount > STEP_LIMIT) return false;

        int bestR = -1, bestC = -1;
        int minChoices = 11;
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
            if (solveFastMRV()) return true;
            remove(bestR, bestC, vals[i]);
        }

        return false;
    }

    int evalCount = 0;
    void countMRV() {
        if (++evalCount > 800) { solCount = 2; return; }
        if (solCount > 1) return;
        int bestR = -1, bestC = -1;
        int minChoices = 11;
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

    void extractGrid(int* g, int oR, int oC, int size) {
        for (int r = 0; r < size; r++)
            for (int c = 0; c < size; c++)
                g[r * size + c] = board[r + oR][c + oC];
    }

    void buildG2Map(int* gm) {
        for (int r = 0; r < 8; r++)
            for (int c = 0; c < 8; c++)
                gm[r * 8 + c] = g2BlockMap[r][c];
    }

    bool checkGrid9x9(const int* g, int maxClues) {
        int rC[9] = {}, cC[9] = {}, bC[9] = {};
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (g[r * 9 + c] != 0) {
                    rC[r]++;
                    cC[c]++;
                    bC[(r / 3) * 3 + (c / 3)]++;
                }
            }
        }
        for (int i = 0; i < 9; i++) {
            if (rC[i] > maxClues || cC[i] > maxClues || bC[i] > maxClues)
                return false;
        }
        return true;
    }

    bool checkGrid8x8(const int* g, int maxClues) {
        int rC[8] = {}, cC[8] = {}, bC[8] = {};
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (g[r * 8 + c] != 0) {
                    rC[r]++;
                    cC[c]++;
                    bC[g2BlockMap[r][c]]++;
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
        int g1[81], g2[64];
        extractGrid(g1, 0, 0, 9);
        extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C, 8);
        return checkGrid9x9(g1, config.max_per_row) &&
               checkGrid8x8(g2, config.max_per_row);
    }

public:
    TurboHybridTwodoku() : rng(random_device{}()) {
        for (int i = 0; i < 8; ++i) {
            for (int r = g2Bounds[i].r1; r <= g2Bounds[i].r2; ++r) {
                for (int c = g2Bounds[i].c1; c <= g2Bounds[i].c2; ++c) {
                    g2BlockMap[r][c] = i;
                }
            }
        }

        vector<pair<int, int>> overlapGroup;
        vector<pair<int, int>> nearOverlapGroup;
        vector<pair<int, int>> otherGroup;

        for (int r = 0; r < CANVAS_SIZE; ++r) {
            for (int c = 0; c < CANVAS_SIZE; ++c) {
                if (!inG1(r, c) && !inG2(r, c)) continue;
                allActiveCells.push_back({r, c});
                if (inOverlap(r, c)) {
                    overlapGroup.push_back({r, c});
                } else if ((r >= 6 && r <= 9) && (c >= 6 && c <= 9)) {
                    nearOverlapGroup.push_back({r, c});
                } else {
                    otherGroup.push_back({r, c});
                }
            }
        }

        prioritizedCells.insert(prioritizedCells.end(), overlapGroup.begin(), overlapGroup.end());
        prioritizedCells.insert(prioritizedCells.end(), nearOverlapGroup.begin(), nearOverlapGroup.end());
        prioritizedCells.insert(prioritizedCells.end(), otherGroup.begin(), otherGroup.end());
    }

    bool solveCompleteBoard() {
        while (true) {
            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    board[r][c] = 0;

            for (int i = 0; i < 9; ++i) g1Row[i] = g1Col[i] = g1Box[i] = 0;
            for (int i = 0; i < 8; ++i) g2Row[i] = g2Col[i] = g2Block[i] = 0;

            stepCount = 0;
            if (solveFastMRV()) return true;
        }
    }

    bool generate() {
        const PuzzleConfig& config = TWODOKU_98_CONFIG;
        int g2Map[64];
        buildG2Map(g2Map);

        while (true) {
            if (!solveCompleteBoard()) continue;

            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    solution[r][c] = board[r][c];

            int g1[81], g2[64];
            extractGrid(g1, 0, 0, 9);
            extractGrid(g2, G2_OFFSET_R, G2_OFFSET_C, 8);

            int targetG1 = max(36, (config.target_clues * 9) / 17 + 2);
            int targetG2 = max(28, (config.target_clues * 8) / 17 + 2);
            PuzzleConfig g1Cfg = {targetG1, 5, 5, 5, 9, false, false, 9, false, false};
            PuzzleGenerator<9, 3, 3> gen1;
            if (!gen1.generate(g1, g1Cfg)) continue;

            PuzzleConfig g2Cfg = {targetG2, 5, 5, 5, 8, false, false, 8, false, false};
            PuzzleGenerator<8, 2, 4> gen2;
            gen2.gridMap = g2Map;
            if (!gen2.generate(g2, g2Cfg)) continue;

            for (int r = 0; r < CANVAS_SIZE; ++r)
                for (int c = 0; c < CANVAS_SIZE; ++c)
                    remove(r, c, board[r][c]);

            for (int r = 0; r < 9; ++r)
                for (int c = 0; c < 9; ++c)
                    if (g1[r * 9 + c] != 0)
                        place(r, c, g1[r * 9 + c]);

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

            int fg1[81], fg2[64];
            extractGrid(fg1, 0, 0, 9);
            extractGrid(fg2, G2_OFFSET_R, G2_OFFSET_C, 8);
            if (!checkGrid9x9(fg1, config.max_per_row) || !checkGrid8x8(fg2, config.max_per_row)) continue;

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
        cout << "{\"type\":\"twodoku\",\"totalRows\":15,\"totalCols\":15,";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":9,\"subR\":3,\"subC\":3},{\"r\":7,\"c\":7,\"size\":8,\"subR\":4,\"subC\":4}],";
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
                if (inG1(r, c) && inG2(r, c)) bid = g2BlockMap[r - G2_OFFSET_R][c - G2_OFFSET_C] + 9;
                else if (inG1(r, c)) bid = (r / 3) * 3 + (c / 3);
                else if (inG2(r, c)) bid = g2BlockMap[r - G2_OFFSET_R][c - G2_OFFSET_C] + 9;
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
    TurboHybridTwodoku game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "Failed to generate twodoku98\n";
        return 1;
    }
    return 0;
}