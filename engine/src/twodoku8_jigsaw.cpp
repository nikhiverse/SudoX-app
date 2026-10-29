// twodoku8_jigsaw.cpp — Twodoku 8 Jigsaw puzzle generator
// Two overlapping 8x8 jigsaw-sudoku grids (grid1: rows 0-7 cols 0-7,
// grid2: rows 4-11 cols 4-11, overlap 4x4 at rows 4-7, cols 4-7).
// Uses PuzzleGenerator with TWODOKU8_JIGSAW_CONFIG: 54-62 clues, max 4/row/col/group.

#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <numeric>
#include "../include/random_puzzle.cpp"

using namespace std;

const int BOARD8 = 12;
const int GS8 = 8;
const int OO8 = 4;  // G2 offset

struct Point8 { int r, c; };

class TwodokuJigsaw8 {
private:
    int board[BOARD8 * BOARD8];
    int solution[BOARD8 * BOARD8];
    int g1Groups[GS8 * GS8];
    int g2Groups[GS8 * GS8];
    mt19937 rng;
    int shapeSteps;

    bool inG1(int r, int c) { return r >= 0 && r < GS8 && c >= 0 && c < GS8; }
    bool inG2(int r, int c) { return r >= OO8 && r < OO8 + GS8 && c >= OO8 && c < OO8 + GS8; }
    bool isActive(int r, int c) { return inG1(r, c) || inG2(r, c); }

    // ── Jigsaw shape generator (each group has exactly GS8 cells) ──
    bool growGroup(vector<Point8>& cells, int* gg, int gId) {
        if (++shapeSteps > 5000) return false;
        if ((int)cells.size() == GS8) return true;
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        vector<Point8> cands;
        for (auto& p : cells) {
            for (int i = 0; i < 4; i++) {
                int nr = p.r + dr[i], nc = p.c + dc[i];
                if (nr >= 0 && nr < GS8 && nc >= 0 && nc < GS8 && gg[nr * GS8 + nc] == -1) {
                    bool dup = false;
                    for (auto& x : cands) if (x.r == nr && x.c == nc) { dup = true; break; }
                    if (!dup) cands.push_back({nr, nc});
                }
            }
        }
        if (cands.empty()) return false;
        shuffle(cands.begin(), cands.end(), rng);
        for (auto& c : cands) {
            gg[c.r * GS8 + c.c] = gId;
            cells.push_back(c);
            if (growGroup(cells, gg, gId)) return true;
            cells.pop_back();
            gg[c.r * GS8 + c.c] = -1;
        }
        return false;
    }

    bool createShapesG1(int* gg) {
        for (int i = 0; i < GS8 * GS8; i++) gg[i] = -1;
        for (int r = 4; r < 8; r++) for (int c = 4; c < 6; c++) gg[r * GS8 + c] = 6;
        for (int r = 4; r < 8; r++) for (int c = 6; c < 8; c++) gg[r * GS8 + c] = 7;
        for (int g = 0; g < 6; g++) {
            bool found = false;
            for (int r = 0; r < GS8 && !found; r++) {
                for (int c = 0; c < GS8 && !found; c++) {
                    if (gg[r * GS8 + c] == -1) {
                        gg[r * GS8 + c] = g;
                        vector<Point8> curr = {{r, c}};
                        shapeSteps = 0;
                        if (growGroup(curr, gg, g)) { found = true; break; }
                        for (int i = 0; i < GS8 * GS8; i++) if (gg[i] == g) gg[i] = -1;
                        return false;
                    }
                }
            }
            if (!found) return false;
        }
        return true;
    }

    bool createShapesG2(int* gg) {
        for (int i = 0; i < GS8 * GS8; i++) gg[i] = -1;
        for (int r = 0; r < 4; r++) for (int c = 0; c < 2; c++) gg[r * GS8 + c] = 6;
        for (int r = 0; r < 4; r++) for (int c = 2; c < 4; c++) gg[r * GS8 + c] = 7;
        for (int g = 0; g < 6; g++) {
            bool found = false;
            for (int r = 0; r < GS8 && !found; r++) {
                for (int c = 0; c < GS8 && !found; c++) {
                    if (gg[r * GS8 + c] == -1) {
                        gg[r * GS8 + c] = g;
                        vector<Point8> curr = {{r, c}};
                        shapeSteps = 0;
                        if (growGroup(curr, gg, g)) { found = true; break; }
                        for (int i = 0; i < GS8 * GS8; i++) if (gg[i] == g) gg[i] = -1;
                        return false;
                    }
                }
            }
            if (!found) return false;
        }
        return true;
    }

    // ── Per-grid 8x8 jigsaw solver ──
    uint16_t rowM8[GS8], colM8[GS8], grpM8[GS8];

    void initMasks8() {
        for (int i = 0; i < GS8; i++) rowM8[i] = colM8[i] = grpM8[i] = 0;
    }

    uint16_t getPoss8(int r, int c, int* gg) {
        return ~(rowM8[r] | colM8[c] | grpM8[gg[r * GS8 + c]]) & 0xFF;
    }

    bool solve8(int* g, int* gg, int pos) {
        if (pos == GS8 * GS8) return true;
        if (g[pos] != 0) return solve8(g, gg, pos + 1);
        int r = pos / GS8, c = pos % GS8;
        uint16_t mask = getPoss8(r, c, gg);
        vector<int> nums;
        for (int i = 0; i < GS8; i++) if (mask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            g[pos] = n;
            rowM8[r] |= bit; colM8[c] |= bit; grpM8[gg[pos]] |= bit;
            if (solve8(g, gg, pos + 1)) return true;
            rowM8[r] &= ~bit; colM8[c] &= ~bit; grpM8[gg[pos]] &= ~bit;
            g[pos] = 0;
        }
        return false;
    }

    void initMasksWithGrid8(int* grid, int* groupGrid) {
        initMasks8();
        for (int r = 0; r < GS8; r++) {
            for (int c = 0; c < GS8; c++) {
                int pos = r * GS8 + c;
                if (grid[pos] != 0) {
                    uint16_t bit = 1 << (grid[pos] - 1);
                    rowM8[r] |= bit;
                    colM8[c] |= bit;
                    grpM8[groupGrid[pos]] |= bit;
                }
            }
        }
    }

    bool solveMRV8(int* grid, int* groupGrid) {
        int bestPos = -1, minCh = 9;
        uint16_t bestMask = 0;
        for (int pos = 0; pos < GS8 * GS8; pos++) {
            if (grid[pos] == 0) {
                int r = pos / GS8, c = pos % GS8;
                uint16_t mask = getPoss8(r, c, groupGrid);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return false;
                if (ch < minCh) { minCh = ch; bestPos = pos; bestMask = mask; }
                if (minCh == 1) goto found;
            }
        }
    found:
        if (bestPos == -1) return true;
        int r = bestPos / GS8, c = bestPos % GS8;
        vector<int> nums;
        for (int i = 0; i < GS8; i++) if (bestMask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            grid[bestPos] = n;
            rowM8[r] |= bit; colM8[c] |= bit; grpM8[groupGrid[bestPos]] |= bit;
            if (solveMRV8(grid, groupGrid)) return true;
            rowM8[r] &= ~bit; colM8[c] &= ~bit; grpM8[groupGrid[bestPos]] &= ~bit;
            grid[bestPos] = 0;
        }
        return false;
    }

    void extractGrid8(int* g, int oR, int oC) {
        for (int r = 0; r < GS8; r++)
            for (int c = 0; c < GS8; c++)
                g[r * GS8 + c] = board[(r + oR) * BOARD8 + (c + oC)];
    }

    void placeGrid8(int* g, int oR, int oC) {
        for (int r = 0; r < GS8; r++)
            for (int c = 0; c < GS8; c++)
                board[(r + oR) * BOARD8 + (c + oC)] = g[r * GS8 + c];
    }

    // Uniqueness checker for full overlapping board
    uint16_t rowM1[GS8], colM1[GS8], grpM1[GS8];
    uint16_t rowM2[GS8], colM2[GS8], grpM2[GS8];

    void initFullMasks() {
        for (int i = 0; i < GS8; i++) {
            rowM1[i] = colM1[i] = grpM1[i] = 0;
            rowM2[i] = colM2[i] = grpM2[i] = 0;
        }
        for (int r = 0; r < BOARD8; r++) {
            for (int c = 0; c < BOARD8; c++) {
                int v = board[r * BOARD8 + c];
                if (v != 0) {
                    uint16_t bit = 1 << (v - 1);
                    if (inG1(r, c)) {
                        rowM1[r] |= bit;
                        colM1[c] |= bit;
                        grpM1[g1Groups[r * GS8 + c]] |= bit;
                    }
                    if (inG2(r, c)) {
                        int lr = r - OO8, lc = c - OO8;
                        rowM2[lr] |= bit;
                        colM2[lc] |= bit;
                        grpM2[g2Groups[lr * GS8 + lc]] |= bit;
                    }
                }
            }
        }
    }

    inline uint16_t getFullPoss(int r, int c) {
        uint16_t used = 0;
        if (inG1(r, c)) used |= rowM1[r] | colM1[c] | grpM1[g1Groups[r * GS8 + c]];
        if (inG2(r, c)) {
            int lr = r - OO8, lc = c - OO8;
            used |= rowM2[lr] | colM2[lc] | grpM2[g2Groups[lr * GS8 + lc]];
        }
        return (~used) & 0xFF;
    }

    int solCount;
    int evalCount;
    void countMRV() {
        if (++evalCount > 100000 || solCount > 1) return;
        int bestR = -1, bestC = -1, minCh = 9;
        uint16_t bestMask = 0;
        for (int r = 0; r < BOARD8; r++) {
            for (int c = 0; c < BOARD8; c++) {
                if (!isActive(r, c) || board[r * BOARD8 + c] != 0) continue;
                uint16_t mask = getFullPoss(r, c);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return;
                if (ch < minCh) { minCh = ch; bestR = r; bestC = c; bestMask = mask; }
                if (minCh == 1) goto search;
            }
        }
    search:
        if (bestR == -1) { solCount++; return; }
        int pos = bestR * BOARD8 + bestC;
        bool ig1 = inG1(bestR, bestC);
        bool ig2 = inG2(bestR, bestC);
        int lr = bestR - OO8, lc = bestC - OO8;
        int g1 = ig1 ? g1Groups[bestR * GS8 + bestC] : -1;
        int g2 = ig2 ? g2Groups[lr * GS8 + lc] : -1;

        for (uint16_t m = bestMask; m; m &= m - 1) {
            int v = __builtin_ctz(m);
            uint16_t bit = 1 << v;
            board[pos] = v + 1;
            if (ig1) { rowM1[bestR] |= bit; colM1[bestC] |= bit; grpM1[g1] |= bit; }
            if (ig2) { rowM2[lr] |= bit; colM2[lc] |= bit; grpM2[g2] |= bit; }

            countMRV();

            if (ig1) { rowM1[bestR] &= ~bit; colM1[bestC] &= ~bit; grpM1[g1] &= ~bit; }
            if (ig2) { rowM2[lr] &= ~bit; colM2[lc] &= ~bit; grpM2[g2] &= ~bit; }
            board[pos] = 0;

            if (solCount > 1) return;
        }
    }

    int countSolutions() {
        solCount = 0;
        evalCount = 0;
        initFullMasks();
        countMRV();
        return solCount;
    }

    bool checkConstraints(int max_per) {
        int rC1[GS8] = {}, cC1[GS8] = {}, grC1[GS8] = {};
        for (int r = 0; r < GS8; r++) {
            for (int c = 0; c < GS8; c++) {
                if (board[r * BOARD8 + c]) {
                    rC1[r]++; cC1[c]++; grC1[g1Groups[r * GS8 + c]]++;
                }
            }
        }
        for (int i = 0; i < GS8; i++) {
            if (rC1[i] > max_per || cC1[i] > max_per || grC1[i] > max_per) return false;
        }
        int rC2[GS8] = {}, cC2[GS8] = {}, grC2[GS8] = {};
        for (int r = 0; r < GS8; r++) {
            for (int c = 0; c < GS8; c++) {
                if (board[(r + OO8) * BOARD8 + (c + OO8)]) {
                    rC2[r]++; cC2[c]++; grC2[g2Groups[r * GS8 + c]]++;
                }
            }
        }
        for (int i = 0; i < GS8; i++) {
            if (rC2[i] > max_per || cC2[i] > max_per || grC2[i] > max_per) return false;
        }
        return true;
    }

public:
    TwodokuJigsaw8() : rng(random_device{}()) {}

    bool generate() {
        bool generated = false;
        int outerAttempts = 0;
        const int MAX_OUTER = 500;

        while (!generated && outerAttempts++ < MAX_OUTER) {
            for (int i = 0; i < BOARD8 * BOARD8; i++) board[i] = 0;
            for (int i = 0; i < GS8 * GS8; i++) g1Groups[i] = g2Groups[i] = -1;

            shapeSteps = 0;
            if (!createShapesG1(g1Groups)) continue;
            shapeSteps = 0;
            if (!createShapesG2(g2Groups)) continue;

            // 1. Solve Grid 1
            int g1[GS8 * GS8];
            for (int i = 0; i < GS8 * GS8; i++) g1[i] = 0;
            initMasks8();
            if (!solveMRV8(g1, g1Groups)) continue;

            // 2. Prefill Grid 2's overlap (4x4) from Grid 1
            int g2[GS8 * GS8];
            for (int i = 0; i < GS8 * GS8; i++) g2[i] = 0;
            for (int r = 0; r < 4; r++) {
                for (int c = 0; c < 4; c++) {
                    g2[r * GS8 + c] = g1[(r + OO8) * GS8 + (c + OO8)];
                }
            }

            initMasksWithGrid8(g2, g2Groups);
            if (!solveMRV8(g2, g2Groups)) continue;

            // 3. Place solution onto board
            placeGrid8(g1, 0, 0);
            placeGrid8(g2, OO8, OO8);
            for (int i = 0; i < BOARD8 * BOARD8; i++) solution[i] = board[i];

            // 4. Eliminate clues using PuzzleGenerator on each grid (target 30 clues per grid)
            PuzzleConfig gCfg = {30, 4, 4, 4, 8, false, false, 8, false, false};
            PuzzleGenerator<GS8, 2, 4> gen1;
            gen1.gridMap = g1Groups;
            if (!gen1.generate(g1, gCfg)) continue;

            PuzzleGenerator<GS8, 4, 2> gen2;
            gen2.gridMap = g2Groups;
            if (!gen2.generate(g2, gCfg)) continue;

            // Merge back
            for (int i = 0; i < BOARD8 * BOARD8; i++) board[i] = 0;
            placeGrid8(g1, 0, 0);
            placeGrid8(g2, OO8, OO8);

            int currentClues = 0;
            vector<int> candidates;
            for (int r = 0; r < BOARD8; r++) {
                for (int c = 0; c < BOARD8; c++) {
                    int pos = r * BOARD8 + c;
                    if (isActive(r, c) && board[pos] != 0) {
                        currentClues++;
                        candidates.push_back(pos);
                    }
                }
            }

            if (countSolutions() != 1) continue;

            const PuzzleConfig& cfg = TWODOKU8_JIGSAW_CONFIG;
            int targetClues = cfg.target_clues;

            int stuckCount = 0;
            while (currentClues > targetClues && stuckCount < 5) {
                shuffle(candidates.begin(), candidates.end(), rng);
                bool removedAny = false;
                for (int pos : candidates) {
                    if (board[pos] != 0) {
                        int backup = board[pos];
                        board[pos] = 0;
                        if (countSolutions() == 1) {
                            currentClues--;
                            removedAny = true;
                            break;
                        } else {
                            board[pos] = backup;
                        }
                    }
                }
                if (!removedAny) stuckCount++;
            }

            // Total clues must be within 54-62 and max per row/col/group <= 4
            if (currentClues >= 54 && currentClues <= 62 && countSolutions() == 1 && checkConstraints(4)) {
                generated = true;
            }
        }
        return generated;
    }

    void printJSON() {
        auto printGroups8 = [&](int* grp) {
            cout << "[";
            for (int r = 0; r < GS8; r++) {
                if (r) cout << ",";
                cout << "[";
                for (int c = 0; c < GS8; c++) {
                    if (c) cout << ",";
                    cout << grp[r * GS8 + c];
                }
                cout << "]";
            }
            cout << "]";
        };

        cout << "{\"type\":\"twodoku\",\"variant\":\"twodoku_jigsaw\",\"totalRows\":" << BOARD8 << ",\"totalCols\":" << BOARD8 << ",";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":8,\"subR\":2,\"subC\":4,\"jigsaw\":true},"
             << "{\"r\":" << OO8 << ",\"c\":" << OO8 << ",\"size\":8,\"subR\":4,\"subC\":2,\"jigsaw\":true}],";
        cout << "\"g1Groups\":"; printGroups8(g1Groups); cout << ",";
        cout << "\"g2Groups\":"; printGroups8(g2Groups); cout << ",";
        cout << "\"blocks\":[";
        for (int r = 0; r < BOARD8; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD8; c++) {
                if (c) cout << ",";
                int bid = -1;
                if (inG1(r, c) && inG2(r, c)) bid = g2Groups[(r - OO8) * GS8 + (c - OO8)] + GS8;
                else if (inG1(r, c)) bid = g1Groups[r * GS8 + c];
                else if (inG2(r, c)) bid = g2Groups[(r - OO8) * GS8 + (c - OO8)] + GS8;
                cout << bid;
            }
            cout << "]";
        }
        cout << "],";
        cout << "\"grid\":[";
        for (int r = 0; r < BOARD8; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD8; c++) {
                if (c) cout << ",";
                cout << board[r * BOARD8 + c];
            }
            cout << "]";
        }
        cout << "],\"active\":[";
        for (int r = 0; r < BOARD8; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD8; c++) {
                if (c) cout << ",";
                cout << (isActive(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"overlap\":[";
        for (int r = 0; r < BOARD8; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD8; c++) {
                if (c) cout << ",";
                cout << (inG1(r, c) && inG2(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"solution\":[";
        for (int r = 0; r < BOARD8; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD8; c++) {
                if (c) cout << ",";
                cout << solution[r * BOARD8 + c];
            }
            cout << "]";
        }
        cout << "]}" << endl;
    }
};

int main() {
    TwodokuJigsaw8 game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}