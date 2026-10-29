// twodoku9_jigsaw.cpp — Twodoku 9 Jigsaw puzzle generator
// Two overlapping 9x9 jigsaw-sudoku grids (grid1: rows 0-8 cols 0-8,
// grid2: rows 6-14 cols 6-14, overlap 3x3 at rows 6-8, cols 6-8).
// Uses PuzzleGenerator with TWODOKU9_JIGSAW_CONFIG: 72-81 clues, max 5/row/col/group.

#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <numeric>
#include "../include/random_puzzle.cpp"

using namespace std;

const int BOARD9J = 15;
const int GS9J = 9;
const int OO9J = 6;  // G2 offset

struct Point9J { int r, c; };

class TwodokuJigsaw9 {
private:
    int board[BOARD9J * BOARD9J];
    int solution[BOARD9J * BOARD9J];
    int g1Groups[GS9J * GS9J];
    int g2Groups[GS9J * GS9J];
    mt19937 rng;
    int shapeSteps;

    bool inG1(int r, int c) { return r >= 0 && r < GS9J && c >= 0 && c < GS9J; }
    bool inG2(int r, int c) { return r >= OO9J && r < OO9J + GS9J && c >= OO9J && c < OO9J + GS9J; }
    bool isActive(int r, int c) { return inG1(r, c) || inG2(r, c); }

    // ── Jigsaw shape generator ──
    bool growGroup(vector<Point9J>& cells, int* gg, int gId) {
        if (++shapeSteps > 8000) return false;
        if ((int)cells.size() == GS9J) return true;
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        vector<Point9J> cands;
        for (auto& p : cells) {
            for (int i = 0; i < 4; i++) {
                int nr = p.r + dr[i], nc = p.c + dc[i];
                if (nr >= 0 && nr < GS9J && nc >= 0 && nc < GS9J && gg[nr * GS9J + nc] == -1) {
                    bool dup = false;
                    for (auto& x : cands) if (x.r == nr && x.c == nc) { dup = true; break; }
                    if (!dup) cands.push_back({nr, nc});
                }
            }
        }
        if (cands.empty()) return false;
        shuffle(cands.begin(), cands.end(), rng);
        for (auto& c : cands) {
            gg[c.r * GS9J + c.c] = gId;
            cells.push_back(c);
            if (growGroup(cells, gg, gId)) return true;
            cells.pop_back();
            gg[c.r * GS9J + c.c] = -1;
        }
        return false;
    }

    bool createShapesG1(int* gg) {
        for (int i = 0; i < GS9J * GS9J; i++) gg[i] = -1;
        for (int r = 6; r < 9; r++) for (int c = 6; c < 9; c++) gg[r * GS9J + c] = 8;
        for (int g = 0; g < 8; g++) {
            bool found = false;
            for (int r = 0; r < GS9J && !found; r++) {
                for (int c = 0; c < GS9J && !found; c++) {
                    if (gg[r * GS9J + c] == -1) {
                        gg[r * GS9J + c] = g;
                        vector<Point9J> curr = {{r, c}};
                        shapeSteps = 0;
                        if (growGroup(curr, gg, g)) { found = true; break; }
                        for (int i = 0; i < GS9J * GS9J; i++) if (gg[i] == g) gg[i] = -1;
                        return false;
                    }
                }
            }
            if (!found) return false;
        }
        return true;
    }

    bool createShapesG2(int* gg) {
        for (int i = 0; i < GS9J * GS9J; i++) gg[i] = -1;
        for (int r = 0; r < 3; r++) for (int c = 0; c < 3; c++) gg[r * GS9J + c] = 8;
        for (int g = 0; g < 8; g++) {
            bool found = false;
            for (int r = 0; r < GS9J && !found; r++) {
                for (int c = 0; c < GS9J && !found; c++) {
                    if (gg[r * GS9J + c] == -1) {
                        gg[r * GS9J + c] = g;
                        vector<Point9J> curr = {{r, c}};
                        shapeSteps = 0;
                        if (growGroup(curr, gg, g)) { found = true; break; }
                        for (int i = 0; i < GS9J * GS9J; i++) if (gg[i] == g) gg[i] = -1;
                        return false;
                    }
                }
            }
            if (!found) return false;
        }
        return true;
    }

    // ── Per-grid 9x9 jigsaw solver ──
    uint16_t rowM9[GS9J], colM9[GS9J], grpM9[GS9J];

    void initMasks9() {
        for (int i = 0; i < GS9J; i++) rowM9[i] = colM9[i] = grpM9[i] = 0;
    }

    uint16_t getPoss9(int r, int c, int* gg) {
        return ~(rowM9[r] | colM9[c] | grpM9[gg[r * GS9J + c]]) & 0x1FF;
    }

    bool solve9(int* g, int* gg, int pos) {
        if (pos == GS9J * GS9J) return true;
        if (g[pos] != 0) return solve9(g, gg, pos + 1);
        int r = pos / GS9J, c = pos % GS9J;
        uint16_t mask = getPoss9(r, c, gg);
        vector<int> nums;
        for (int i = 0; i < GS9J; i++) if (mask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            g[pos] = n;
            rowM9[r] |= bit; colM9[c] |= bit; grpM9[gg[pos]] |= bit;
            if (solve9(g, gg, pos + 1)) return true;
            rowM9[r] &= ~bit; colM9[c] &= ~bit; grpM9[gg[pos]] &= ~bit;
            g[pos] = 0;
        }
        return false;
    }

    void initMasksWithGrid9(int* grid, int* groupGrid) {
        initMasks9();
        for (int r = 0; r < GS9J; r++) {
            for (int c = 0; c < GS9J; c++) {
                int pos = r * GS9J + c;
                if (grid[pos] != 0) {
                    uint16_t bit = 1 << (grid[pos] - 1);
                    rowM9[r] |= bit;
                    colM9[c] |= bit;
                    grpM9[groupGrid[pos]] |= bit;
                }
            }
        }
    }

    bool solveMRV9(int* grid, int* groupGrid) {
        int bestPos = -1, minCh = 10;
        uint16_t bestMask = 0;
        for (int pos = 0; pos < GS9J * GS9J; pos++) {
            if (grid[pos] == 0) {
                int r = pos / GS9J, c = pos % GS9J;
                uint16_t mask = getPoss9(r, c, groupGrid);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return false;
                if (ch < minCh) { minCh = ch; bestPos = pos; bestMask = mask; }
                if (minCh == 1) goto found;
            }
        }
    found:
        if (bestPos == -1) return true;
        int r = bestPos / GS9J, c = bestPos % GS9J;
        vector<int> nums;
        for (int i = 0; i < GS9J; i++) if (bestMask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            grid[bestPos] = n;
            rowM9[r] |= bit; colM9[c] |= bit; grpM9[groupGrid[bestPos]] |= bit;
            if (solveMRV9(grid, groupGrid)) return true;
            rowM9[r] &= ~bit; colM9[c] &= ~bit; grpM9[groupGrid[bestPos]] &= ~bit;
            grid[bestPos] = 0;
        }
        return false;
    }

    void extractGrid9(int* g, int oR, int oC) {
        for (int r = 0; r < GS9J; r++)
            for (int c = 0; c < GS9J; c++)
                g[r * GS9J + c] = board[(r + oR) * BOARD9J + (c + oC)];
    }

    void placeGrid9(int* g, int oR, int oC) {
        for (int r = 0; r < GS9J; r++)
            for (int c = 0; c < GS9J; c++)
                board[(r + oR) * BOARD9J + (c + oC)] = g[r * GS9J + c];
    }

    // Uniqueness checker for full overlapping board
    uint16_t rowM1[GS9J], colM1[GS9J], grpM1[GS9J];
    uint16_t rowM2[GS9J], colM2[GS9J], grpM2[GS9J];

    void initFullMasks() {
        for (int i = 0; i < GS9J; i++) {
            rowM1[i] = colM1[i] = grpM1[i] = 0;
            rowM2[i] = colM2[i] = grpM2[i] = 0;
        }
        for (int r = 0; r < BOARD9J; r++) {
            for (int c = 0; c < BOARD9J; c++) {
                int v = board[r * BOARD9J + c];
                if (v != 0) {
                    uint16_t bit = 1 << (v - 1);
                    if (inG1(r, c)) {
                        rowM1[r] |= bit;
                        colM1[c] |= bit;
                        grpM1[g1Groups[r * GS9J + c]] |= bit;
                    }
                    if (inG2(r, c)) {
                        int lr = r - OO9J, lc = c - OO9J;
                        rowM2[lr] |= bit;
                        colM2[lc] |= bit;
                        grpM2[g2Groups[lr * GS9J + lc]] |= bit;
                    }
                }
            }
        }
    }

    inline uint16_t getFullPoss(int r, int c) {
        uint16_t used = 0;
        if (inG1(r, c)) used |= rowM1[r] | colM1[c] | grpM1[g1Groups[r * GS9J + c]];
        if (inG2(r, c)) {
            int lr = r - OO9J, lc = c - OO9J;
            used |= rowM2[lr] | colM2[lc] | grpM2[g2Groups[lr * GS9J + lc]];
        }
        return (~used) & 0x1FF;
    }

    int solCount;
    int evalCount;
    void countMRV() {
        if (++evalCount > 100000 || solCount > 1) return;
        int bestR = -1, bestC = -1, minCh = 10;
        uint16_t bestMask = 0;
        for (int r = 0; r < BOARD9J; r++) {
            for (int c = 0; c < BOARD9J; c++) {
                if (!isActive(r, c) || board[r * BOARD9J + c] != 0) continue;
                uint16_t mask = getFullPoss(r, c);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return;
                if (ch < minCh) { minCh = ch; bestR = r; bestC = c; bestMask = mask; }
                if (minCh == 1) goto search;
            }
        }
    search:
        if (bestR == -1) { solCount++; return; }
        int pos = bestR * BOARD9J + bestC;
        bool ig1 = inG1(bestR, bestC);
        bool ig2 = inG2(bestR, bestC);
        int lr = bestR - OO9J, lc = bestC - OO9J;
        int g1 = ig1 ? g1Groups[bestR * GS9J + bestC] : -1;
        int g2 = ig2 ? g2Groups[lr * GS9J + lc] : -1;

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
        int rC1[GS9J] = {}, cC1[GS9J] = {}, grC1[GS9J] = {};
        for (int r = 0; r < GS9J; r++) {
            for (int c = 0; c < GS9J; c++) {
                if (board[r * BOARD9J + c]) {
                    rC1[r]++; cC1[c]++; grC1[g1Groups[r * GS9J + c]]++;
                }
            }
        }
        for (int i = 0; i < GS9J; i++) {
            if (rC1[i] > max_per || cC1[i] > max_per || grC1[i] > max_per) return false;
        }
        int rC2[GS9J] = {}, cC2[GS9J] = {}, grC2[GS9J] = {};
        for (int r = 0; r < GS9J; r++) {
            for (int c = 0; c < GS9J; c++) {
                if (board[(r + OO9J) * BOARD9J + (c + OO9J)]) {
                    rC2[r]++; cC2[c]++; grC2[g2Groups[r * GS9J + c]]++;
                }
            }
        }
        for (int i = 0; i < GS9J; i++) {
            if (rC2[i] > max_per || cC2[i] > max_per || grC2[i] > max_per) return false;
        }
        return true;
    }

public:
    TwodokuJigsaw9() : rng(random_device{}()) {}

    bool generate() {
        bool generated = false;
        int outerAttempts = 0;
        const int MAX_OUTER = 500;

        while (!generated && outerAttempts++ < MAX_OUTER) {
            for (int i = 0; i < BOARD9J * BOARD9J; i++) board[i] = 0;
            for (int i = 0; i < GS9J * GS9J; i++) g1Groups[i] = g2Groups[i] = -1;

            shapeSteps = 0;
            if (!createShapesG1(g1Groups)) continue;
            shapeSteps = 0;
            if (!createShapesG2(g2Groups)) continue;

            // 1. Solve Grid 1
            int g1[GS9J * GS9J];
            for (int i = 0; i < GS9J * GS9J; i++) g1[i] = 0;
            initMasks9();
            if (!solveMRV9(g1, g1Groups)) continue;

            // 2. Prefill Grid 2's overlap (3x3) from Grid 1
            int g2[GS9J * GS9J];
            for (int i = 0; i < GS9J * GS9J; i++) g2[i] = 0;
            for (int r = 0; r < 3; r++) {
                for (int c = 0; c < 3; c++) {
                    g2[r * GS9J + c] = g1[(r + OO9J) * GS9J + (c + OO9J)];
                }
            }

            initMasksWithGrid9(g2, g2Groups);
            if (!solveMRV9(g2, g2Groups)) continue;

            // 3. Place solution onto board
            placeGrid9(g1, 0, 0);
            placeGrid9(g2, OO9J, OO9J);
            for (int i = 0; i < BOARD9J * BOARD9J; i++) solution[i] = board[i];

            // 4. Eliminate clues using PuzzleGenerator on each grid (target 40 clues per grid)
            PuzzleConfig gCfg = {40, 5, 5, 5, 9, false, false, 9, false, false};
            PuzzleGenerator<GS9J, 3, 3> gen1;
            gen1.gridMap = g1Groups;
            if (!gen1.generate(g1, gCfg)) continue;

            PuzzleGenerator<GS9J, 3, 3> gen2;
            gen2.gridMap = g2Groups;
            if (!gen2.generate(g2, gCfg)) continue;

            // Merge back
            for (int i = 0; i < BOARD9J * BOARD9J; i++) board[i] = 0;
            placeGrid9(g1, 0, 0);
            placeGrid9(g2, OO9J, OO9J);

            int currentClues = 0;
            vector<int> candidates;
            for (int r = 0; r < BOARD9J; r++) {
                for (int c = 0; c < BOARD9J; c++) {
                    int pos = r * BOARD9J + c;
                    if (isActive(r, c) && board[pos] != 0) {
                        currentClues++;
                        candidates.push_back(pos);
                    }
                }
            }

            if (countSolutions() != 1) continue;

            const PuzzleConfig& cfg = TWODOKU9_JIGSAW_CONFIG;
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

            // Total clues must be within 72-81 and max per row/col/group <= 5
            if (currentClues >= 72 && currentClues <= 81 && countSolutions() == 1 && checkConstraints(5)) {
                generated = true;
            }
        }
        return generated;
    }

    void printJSON() {
        auto printGroups9 = [&](int* grp) {
            cout << "[";
            for (int r = 0; r < GS9J; r++) {
                if (r) cout << ",";
                cout << "[";
                for (int c = 0; c < GS9J; c++) {
                    if (c) cout << ",";
                    cout << grp[r * GS9J + c];
                }
                cout << "]";
            }
            cout << "]";
        };

        cout << "{\"type\":\"twodoku\",\"variant\":\"twodoku_jigsaw\",\"totalRows\":" << BOARD9J << ",\"totalCols\":" << BOARD9J << ",";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":9,\"subR\":3,\"subC\":3,\"jigsaw\":true},"
             << "{\"r\":" << OO9J << ",\"c\":" << OO9J << ",\"size\":9,\"subR\":3,\"subC\":3,\"jigsaw\":true}],";
        cout << "\"g1Groups\":"; printGroups9(g1Groups); cout << ",";
        cout << "\"g2Groups\":"; printGroups9(g2Groups); cout << ",";
        cout << "\"blocks\":[";
        for (int r = 0; r < BOARD9J; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD9J; c++) {
                if (c) cout << ",";
                int bid = -1;
                if (inG1(r, c) && inG2(r, c)) bid = g2Groups[(r - OO9J) * GS9J + (c - OO9J)] + GS9J;
                else if (inG1(r, c)) bid = g1Groups[r * GS9J + c];
                else if (inG2(r, c)) bid = g2Groups[(r - OO9J) * GS9J + (c - OO9J)] + GS9J;
                cout << bid;
            }
            cout << "]";
        }
        cout << "],";
        cout << "\"grid\":[";
        for (int r = 0; r < BOARD9J; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD9J; c++) {
                if (c) cout << ",";
                cout << board[r * BOARD9J + c];
            }
            cout << "]";
        }
        cout << "],\"active\":[";
        for (int r = 0; r < BOARD9J; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD9J; c++) {
                if (c) cout << ",";
                cout << (isActive(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"overlap\":[";
        for (int r = 0; r < BOARD9J; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD9J; c++) {
                if (c) cout << ",";
                cout << (inG1(r, c) && inG2(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"solution\":[";
        for (int r = 0; r < BOARD9J; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD9J; c++) {
                if (c) cout << ",";
                cout << solution[r * BOARD9J + c];
            }
            cout << "]";
        }
        cout << "]}" << endl;
    }
};

int main() {
    TwodokuJigsaw9 game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}