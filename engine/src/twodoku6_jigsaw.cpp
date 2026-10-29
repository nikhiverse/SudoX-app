// twodoku6_jigsaw.cpp — Twodoku 6 Jigsaw puzzle generator
// Two overlapping 6x6 jigsaw-sudoku grids (grid1: rows 0-5 cols 0-5,
// grid2: rows 4-9 cols 4-9, overlap 2x2 at rows 4-5, cols 4-5).
// Uses PuzzleGenerator with TWODOKU6_JIGSAW_CONFIG: 18-28 clues, max 3/row/col/group.

#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include "../include/random_puzzle.cpp"

using namespace std;

const int BOARD_SIZE = 10;
const int GS = 6;      // Grid size
const int OO = 4;      // Offset: G2 starts at row 4, col 4

struct Point { int r, c; };

class TwodokuJigsaw6 {
private:
    int board[BOARD_SIZE * BOARD_SIZE];
    int solution[BOARD_SIZE * BOARD_SIZE];
    int g1Groups[GS * GS];  // Jigsaw groups for grid 1
    int g2Groups[GS * GS];  // Jigsaw groups for grid 2
    mt19937 rng;
    int shapeSteps;

    bool inG1(int r, int c) { return r >= 0 && r < GS && c >= 0 && c < GS; }
    bool inG2(int r, int c) { return r >= OO && r < OO + GS && c >= OO && c < OO + GS; }
    bool isActive(int r, int c) { return inG1(r, c) || inG2(r, c); }

    // ── Jigsaw shape generator ──
    bool growGroup(vector<Point>& cells, int* groupGrid, int groupId, int size) {
        if (++shapeSteps > 3000) return false;
        if ((int)cells.size() == size) return true;
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        vector<Point> cands;
        for (auto& p : cells) {
            for (int i = 0; i < 4; i++) {
                int nr = p.r + dr[i], nc = p.c + dc[i];
                if (nr >= 0 && nr < size && nc >= 0 && nc < size && groupGrid[nr * size + nc] == -1) {
                    bool dup = false;
                    for (auto& x : cands) if (x.r == nr && x.c == nc) { dup = true; break; }
                    if (!dup) cands.push_back({nr, nc});
                }
            }
        }
        if (cands.empty()) return false;
        shuffle(cands.begin(), cands.end(), rng);
        for (auto& c : cands) {
            groupGrid[c.r * size + c.c] = groupId;
            cells.push_back(c);
            if (growGroup(cells, groupGrid, groupId, size)) return true;
            cells.pop_back();
            groupGrid[c.r * size + c.c] = -1;
        }
        return false;
    }

    bool createShapes(int* groupGrid, int numGroups, int size) {
        if (numGroups == 0) return true;
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (groupGrid[r * size + c] == -1) {
                    groupGrid[r * size + c] = 0;
                    vector<Point> curr = {{r, c}};
                    shapeSteps = 0;
                    if (growGroup(curr, groupGrid, 0, size))
                        return createShapesFrom(groupGrid, 1, numGroups, size);
                    groupGrid[r * size + c] = -1;
                    return false;
                }
            }
        }
        return true;
    }

    bool createShapesFrom(int* groupGrid, int gId, int numGroups, int size) {
        if (gId == numGroups) return true;
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                if (groupGrid[r * size + c] == -1) {
                    groupGrid[r * size + c] = gId;
                    vector<Point> curr = {{r, c}};
                    shapeSteps = 0;
                    if (growGroup(curr, groupGrid, gId, size))
                        if (createShapesFrom(groupGrid, gId + 1, numGroups, size)) return true;
                    for (int i = 0; i < size * size; i++) if (groupGrid[i] == gId) groupGrid[i] = -1;
                    return false;
                }
            }
        }
        return true;
    }

    // ── Per-grid 6x6 jigsaw solver ──
    uint16_t rowM[GS], colM[GS], grpM[GS];

    void initMasks6() {
        for (int i = 0; i < GS; i++) rowM[i] = colM[i] = grpM[i] = 0;
    }

    void initMasksWithGrid(int* grid, int* groupGrid) {
        initMasks6();
        for (int r = 0; r < GS; r++) {
            for (int c = 0; c < GS; c++) {
                int pos = r * GS + c;
                if (grid[pos] != 0) {
                    uint16_t bit = 1 << (grid[pos] - 1);
                    rowM[r] |= bit;
                    colM[c] |= bit;
                    grpM[groupGrid[pos]] |= bit;
                }
            }
        }
    }

    uint16_t getPoss6(int r, int c, int* groupGrid) {
        return ~(rowM[r] | colM[c] | grpM[groupGrid[r * GS + c]]) & 0x3F;
    }

    bool solveMRV6(int* grid, int* groupGrid) {
        int bestPos = -1, minCh = 7;
        uint16_t bestMask = 0;
        for (int pos = 0; pos < GS * GS; pos++) {
            if (grid[pos] == 0) {
                int r = pos / GS, c = pos % GS;
                uint16_t mask = getPoss6(r, c, groupGrid);
                int ch = __builtin_popcount(mask);
                if (ch == 0) return false;
                if (ch < minCh) { minCh = ch; bestPos = pos; bestMask = mask; }
                if (minCh == 1) goto found;
            }
        }
    found:
        if (bestPos == -1) return true;
        int r = bestPos / GS, c = bestPos % GS;
        vector<int> nums;
        for (int i = 0; i < GS; i++) if (bestMask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);
        for (int n : nums) {
            uint16_t bit = 1 << (n - 1);
            grid[bestPos] = n;
            rowM[r] |= bit; colM[c] |= bit; grpM[groupGrid[bestPos]] |= bit;
            if (solveMRV6(grid, groupGrid)) return true;
            rowM[r] &= ~bit; colM[c] &= ~bit; grpM[groupGrid[bestPos]] &= ~bit;
            grid[bestPos] = 0;
        }
        return false;
    }

    void extractGrid(int* g, int oR, int oC) {
        for (int r = 0; r < GS; r++)
            for (int c = 0; c < GS; c++)
                g[r * GS + c] = board[(r + oR) * BOARD_SIZE + (c + oC)];
    }

    void placeGrid(int* g, int oR, int oC) {
        for (int r = 0; r < GS; r++)
            for (int c = 0; c < GS; c++)
                board[(r + oR) * BOARD_SIZE + (c + oC)] = g[r * GS + c];
    }

    uint16_t getPossibleMask(int r, int c) {
        uint16_t used = 0;
        if (inG1(r, c)) {
            for (int i = 0; i < GS; i++) {
                if (board[r * BOARD_SIZE + i]) used |= (1 << (board[r * BOARD_SIZE + i] - 1));
                if (board[i * BOARD_SIZE + c]) used |= (1 << (board[i * BOARD_SIZE + c] - 1));
            }
            int g = g1Groups[r * GS + c];
            for (int i = 0; i < GS; i++)
                for (int j = 0; j < GS; j++)
                    if (g1Groups[i * GS + j] == g && board[i * BOARD_SIZE + j])
                        used |= (1 << (board[i * BOARD_SIZE + j] - 1));
        }
        if (inG2(r, c)) {
            for (int i = OO; i < OO + GS; i++) {
                if (board[r * BOARD_SIZE + i]) used |= (1 << (board[r * BOARD_SIZE + i] - 1));
                if (board[i * BOARD_SIZE + c]) used |= (1 << (board[i * BOARD_SIZE + c] - 1));
            }
            int lr = r - OO, lc = c - OO;
            int g = g2Groups[lr * GS + lc];
            for (int i = 0; i < GS; i++)
                for (int j = 0; j < GS; j++)
                    if (g2Groups[i * GS + j] == g && board[(i + OO) * BOARD_SIZE + (j + OO)])
                        used |= (1 << (board[(i + OO) * BOARD_SIZE + (j + OO)] - 1));
        }
        return (~used) & 0x3F;
    }

    int solCount;
    int evalCount;
    void countMRV() {
        if (++evalCount > 100000 || solCount > 1) return;
        int bestR = -1, bestC = -1, minCh = 7;
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                int pos = r * BOARD_SIZE + c;
                if (isActive(r, c) && board[pos] == 0) {
                    uint16_t mask = getPossibleMask(r, c);
                    int ch = __builtin_popcount(mask);
                    if (ch == 0) return;
                    if (ch < minCh) { minCh = ch; bestR = r; bestC = c; }
                    if (minCh == 1) goto search;
                }
            }
        }
    search:
        if (bestR == -1) { solCount++; return; }
        uint16_t mask = getPossibleMask(bestR, bestC);
        int pos = bestR * BOARD_SIZE + bestC;
        for (int i = 0; i < GS; i++) {
            if (mask & (1 << i)) {
                board[pos] = i + 1;
                countMRV();
                board[pos] = 0;
                if (solCount > 1) return;
            }
        }
    }

    int countSolutions() { solCount = 0; evalCount = 0; countMRV(); return solCount; }

    bool checkConstraints(int max_per) {
        int rC1[GS] = {}, cC1[GS] = {}, grC1[GS] = {};
        for (int r = 0; r < GS; r++) {
            for (int c = 0; c < GS; c++) {
                if (board[r * BOARD_SIZE + c]) {
                    rC1[r]++; cC1[c]++; grC1[g1Groups[r * GS + c]]++;
                }
            }
        }
        for (int i = 0; i < GS; i++) {
            if (rC1[i] > max_per || cC1[i] > max_per || grC1[i] > max_per) return false;
        }
        int rC2[GS] = {}, cC2[GS] = {}, grC2[GS] = {};
        for (int r = 0; r < GS; r++) {
            for (int c = 0; c < GS; c++) {
                if (board[(r + OO) * BOARD_SIZE + (c + OO)]) {
                    rC2[r]++; cC2[c]++; grC2[g2Groups[r * GS + c]]++;
                }
            }
        }
        for (int i = 0; i < GS; i++) {
            if (rC2[i] > max_per || cC2[i] > max_per || grC2[i] > max_per) return false;
        }
        return true;
    }

public:
    TwodokuJigsaw6() : rng(random_device{}()) {}

    bool generate() {
        bool generated = false;
        int outerAttempts = 0;
        const int MAX_OUTER = 500;

        while (!generated && outerAttempts++ < MAX_OUTER) {
            for (int i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) board[i] = 0;
            for (int i = 0; i < GS * GS; i++) g1Groups[i] = g2Groups[i] = -1;

            shapeSteps = 0;
            if (!createShapes(g1Groups, GS, GS)) continue;
            shapeSteps = 0;
            if (!createShapes(g2Groups, GS, GS)) continue;

            // 1. Solve Grid 1
            int g1[GS * GS];
            for (int i = 0; i < GS * GS; i++) g1[i] = 0;
            initMasks6();
            if (!solveMRV6(g1, g1Groups)) continue;

            // 2. Prefill Grid 2's overlap from Grid 1
            int g2[GS * GS];
            for (int i = 0; i < GS * GS; i++) g2[i] = 0;
            for (int r = 0; r < 2; r++) {
                for (int c = 0; c < 2; c++) {
                    g2[r * GS + c] = g1[(r + OO) * GS + (c + OO)];
                }
            }

            // Check if prefill violates Grid 2's jigsaw shapes
            bool prefillValid = true;
            for (int r = 0; r < 2 && prefillValid; r++) {
                for (int c = 0; c < 2 && prefillValid; c++) {
                    for (int r2 = 0; r2 < 2 && prefillValid; r2++) {
                        for (int c2 = 0; c2 < 2 && prefillValid; c2++) {
                            if (r == r2 && c == c2) continue;
                            if (g2[r * GS + c] == g2[r2 * GS + c2]) {
                                if (r == r2 || c == c2 || g2Groups[r * GS + c] == g2Groups[r2 * GS + c2]) {
                                    prefillValid = false;
                                }
                            }
                        }
                    }
                }
            }
            if (!prefillValid) continue;

            initMasksWithGrid(g2, g2Groups);
            if (!solveMRV6(g2, g2Groups)) continue;

            // 3. Place solution onto board
            placeGrid(g1, 0, 0);
            placeGrid(g2, OO, OO);
            for (int i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) solution[i] = board[i];

            // 4. Use PuzzleGenerator to reduce clues per grid
            PuzzleConfig gCfg = {14, 3, 3, 3, 6, false, false, 6, false, false};
            PuzzleGenerator<6, 2, 3> gen1;
            gen1.gridMap = g1Groups;
            if (!gen1.generate(g1, gCfg)) continue;

            PuzzleGenerator<6, 3, 2> gen2;
            gen2.gridMap = g2Groups;
            if (!gen2.generate(g2, gCfg)) continue;

            // Merge back
            for (int i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) board[i] = 0;
            placeGrid(g1, 0, 0);
            placeGrid(g2, OO, OO);

            int currentClues = 0;
            vector<int> candidates;
            for (int r = 0; r < BOARD_SIZE; r++) {
                for (int c = 0; c < BOARD_SIZE; c++) {
                    int pos = r * BOARD_SIZE + c;
                    if (isActive(r, c) && board[pos] != 0) {
                        currentClues++;
                        candidates.push_back(pos);
                    }
                }
            }

            if (countSolutions() != 1) continue;

            const PuzzleConfig& cfg = TWODOKU6_JIGSAW_CONFIG;
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

            if (currentClues >= 18 && currentClues <= 28 && countSolutions() == 1 && checkConstraints(3)) {
                generated = true;
            }
        }
        return generated;
    }

    void printJSON() {
        auto printGroups = [&](int* grp, int oR, int oC) {
            cout << "[";
            for (int r = 0; r < GS; r++) {
                if (r) cout << ",";
                cout << "[";
                for (int c = 0; c < GS; c++) {
                    if (c) cout << ",";
                    cout << grp[r * GS + c];
                }
                cout << "]";
            }
            cout << "]";
        };

        cout << "{\"type\":\"twodoku\",\"variant\":\"twodoku_jigsaw\",\"totalRows\":" << BOARD_SIZE << ",\"totalCols\":" << BOARD_SIZE << ",";
        cout << "\"grids\":[{\"r\":0,\"c\":0,\"size\":6,\"subR\":2,\"subC\":3,\"jigsaw\":true},"
             << "{\"r\":" << OO << ",\"c\":" << OO << ",\"size\":6,\"subR\":3,\"subC\":2,\"jigsaw\":true}],";
        cout << "\"g1Groups\":"; printGroups(g1Groups, 0, 0); cout << ",";
        cout << "\"g2Groups\":"; printGroups(g2Groups, OO, OO); cout << ",";
        cout << "\"blocks\":[";
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (c) cout << ",";
                int bid = -1;
                if (inG1(r, c) && inG2(r, c)) bid = g2Groups[(r - OO) * GS + (c - OO)] + GS;
                else if (inG1(r, c)) bid = g1Groups[r * GS + c];
                else if (inG2(r, c)) bid = g2Groups[(r - OO) * GS + (c - OO)] + GS;
                cout << bid;
            }
            cout << "]";
        }
        cout << "],";
        cout << "\"grid\":[";
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (c) cout << ",";
                cout << board[r * BOARD_SIZE + c];
            }
            cout << "]";
        }
        cout << "],\"active\":[";
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (c) cout << ",";
                cout << (isActive(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"overlap\":[";
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (c) cout << ",";
                cout << (inG1(r, c) && inG2(r, c) ? "true" : "false");
            }
            cout << "]";
        }
        cout << "],\"solution\":[";
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (c) cout << ",";
                cout << solution[r * BOARD_SIZE + c];
            }
            cout << "]";
        }
        cout << "]}" << endl;
    }
};

int main() {
    TwodokuJigsaw6 game;
    if (game.generate()) {
        game.printJSON();
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}