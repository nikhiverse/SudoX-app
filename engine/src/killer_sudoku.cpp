#include <iostream>
#include <vector>
#include <random>
#include <algorithm>
#include <cstdint>
#include <chrono>
#include <iomanip>
#include <string>
#include "../include/killer_puzzle.cpp"

using namespace std;

const int SIZE = 9;

struct Point {
    int r, c;
    bool operator<(const Point& o) const {
        return (r != o.r) ? (r < o.r) : (c < o.c);
    }
};

struct Cage {
    int id;
    int sum;
    Point firstCell; // Top-most, then left-most cell
    vector<Point> cells;
    uint16_t digitMask;
};

class FastKillerSudoku {
private:
    int board[SIZE][SIZE];
    int solution[SIZE][SIZE];
    int cageMap[SIZE][SIZE];
    uint16_t rowMask[SIZE], colMask[SIZE], boxMask[SIZE];
    vector<Cage> cages;
    mt19937 rng;

    inline int getBox(int r, int c) const {
        return (r / 3) * 3 + (c / 3);
    }

    void place(int r, int c, int val) {
        board[r][c] = val;
        uint16_t bit = (1 << (val - 1));
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[getBox(r, c)] |= bit;
    }

    void remove(int r, int c, int val) {
        board[r][c] = 0;
        uint16_t mask = ~(1 << (val - 1));
        rowMask[r] &= mask;
        colMask[c] &= mask;
        boxMask[getBox(r, c)] &= mask;
    }

    inline uint16_t getCandidates(int r, int c) const {
        return (~(rowMask[r] | colMask[c] | boxMask[getBox(r, c)])) & 0x1FF;
    }

    // =========================================================
    // PHASE 1: BITMASK MRV SUDOKU SOLVER
    // =========================================================
    bool solveMRV() {
        int bestR = -1, bestC = -1, minChoices = 10;
        uint16_t bestMask = 0;

        for (int r = 0; r < SIZE; ++r) {
            for (int c = 0; c < SIZE; ++c) {
                if (board[r][c] == 0) {
                    uint16_t mask = getCandidates(r, c);
                    int choices = __builtin_popcount(mask);
                    if (choices == 0) return false;
                    if (choices < minChoices) {
                        minChoices = choices;
                        bestR = r;
                        bestC = c;
                        bestMask = mask;
                        if (choices == 1) goto found;
                    }
                }
            }
        }
    found:
        if (bestR == -1) return true;

        uint8_t vals[9];
        int count = 0;
        for (uint16_t m = bestMask; m; m &= m - 1) {
            vals[count++] = __builtin_ctz(m) + 1;
        }
        for (int i = count - 1; i > 0; --i) {
            swap(vals[i], vals[rng() % (i + 1)]);
        }

        for (int i = 0; i < count; ++i) {
            place(bestR, bestC, vals[i]);
            if (solveMRV()) return true;
            remove(bestR, bestC, vals[i]);
        }
        return false;
    }

    void generateBaseGrid() {
        while (true) {
            for (int i = 0; i < SIZE; ++i) {
                rowMask[i] = colMask[i] = boxMask[i] = 0;
                for (int j = 0; j < SIZE; ++j) board[i][j] = 0;
            }

            // Pre-fill the 3 independent diagonal 3x3 boxes (0, 4, 8) for instant speed
            for (int b = 0; b < 3; ++b) {
                uint8_t nums[9] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
                for (int i = 8; i > 0; --i) swap(nums[i], nums[rng() % (i + 1)]);
                int idx = 0;
                for (int r = b * 3; r < b * 3 + 3; ++r) {
                    for (int c = b * 3; c < b * 3 + 3; ++c) {
                        place(r, c, nums[idx++]);
                    }
                }
            }

            if (solveMRV()) break;
        }
    }

    // =========================================================
    // PHASE 2: KILLER CAGE PARTITIONING (SIZES 2..6 ONLY)
    // =========================================================
    bool buildKillerCages() {
        int dr[] = {-1, 1, 0, 0};
        int dc[] = {0, 0, -1, 1};
        int attempts = 0;

        while (attempts++ < 100) {
            cages.clear();
            for (int r = 0; r < SIZE; ++r)
                for (int c = 0; c < SIZE; ++c)
                    cageMap[r][c] = -1;

            vector<Point> allCells;
            for (int r = 0; r < SIZE; ++r)
                for (int c = 0; c < SIZE; ++c)
                    allCells.push_back({r, c});
            shuffle(allCells.begin(), allCells.end(), rng);

            for (const auto& start : allCells) {
                if (cageMap[start.r][start.c] != -1) continue;

                // Target cage size randomly chosen from {2, 3, 4, 5, 6}
                int targetSize = 2 + (rng() % 5);
                int cid = (int)cages.size();

                Cage cg;
                cg.id = cid;
                cg.sum = board[start.r][start.c];
                cg.cells.push_back(start);
                cg.digitMask = (1 << (board[start.r][start.c] - 1));
                cageMap[start.r][start.c] = cid;

                while ((int)cg.cells.size() < targetSize) {
                    vector<pair<int, Point>> candidates; // <score, Point>

                    for (const auto& p : cg.cells) {
                        for (int d = 0; d < 4; ++d) {
                            int nr = p.r + dr[d], nc = p.c + dc[d];
                            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && cageMap[nr][nc] == -1) {
                                int val = board[nr][nc];
                                // Killer rule: no duplicate numbers inside a cage
                                if (cg.digitMask & (1 << (val - 1))) continue;

                                bool alreadyListed = false;
                                for (const auto& item : candidates) {
                                    if (item.second.r == nr && item.second.c == nc) {
                                        alreadyListed = true;
                                        break;
                                    }
                                }
                                if (!alreadyListed) {
                                    // Bonus score if neighbor crosses into a new 3x3 subgrid, row, or col
                                    int score = rng() % 10;
                                    if (getBox(nr, nc) != getBox(p.r, p.c)) score += 25;
                                    if (nr != p.r) score += 5;
                                    if (nc != p.c) score += 5;
                                    candidates.push_back({score, {nr, nc}});
                                }
                            }
                        }
                    }

                    if (candidates.empty()) break;

                    sort(candidates.begin(), candidates.end(), [](const auto& a, const auto& b) {
                        return a.first > b.first;
                    });

                    Point chosen = candidates[0].second;
                    int val = board[chosen.r][chosen.c];
                    cageMap[chosen.r][chosen.c] = cid;
                    cg.cells.push_back(chosen);
                    cg.sum += val;
                    cg.digitMask |= (1 << (val - 1));
                }

                cages.push_back(cg);
            }

            // Absorb any leftover 1-cell cages into neighboring cages of size < 6
            bool allValid = true;
            for (size_t i = 0; i < cages.size(); ++i) {
                if (cages[i].cells.size() == 1) {
                    Point p = cages[i].cells[0];
                    int val = board[p.r][p.c];
                    int bestTargetCid = -1;
                    int minNeighborSize = 10;

                    for (int d = 0; d < 4; ++d) {
                        int nr = p.r + dr[d], nc = p.c + dc[d];
                        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                            int nCid = cageMap[nr][nc];
                            if (nCid != (int)i && cages[nCid].cells.size() < 6) {
                                if (!(cages[nCid].digitMask & (1 << (val - 1)))) {
                                    if ((int)cages[nCid].cells.size() < minNeighborSize) {
                                        minNeighborSize = (int)cages[nCid].cells.size();
                                        bestTargetCid = nCid;
                                    }
                                }
                            }
                        }
                    }

                    if (bestTargetCid != -1) {
                        cageMap[p.r][p.c] = bestTargetCid;
                        cages[bestTargetCid].cells.push_back(p);
                        cages[bestTargetCid].sum += val;
                        cages[bestTargetCid].digitMask |= (1 << (val - 1));
                        cages[i].cells.clear();
                    } else {
                        allValid = false;
                        break;
                    }
                }
            }

            if (!allValid) continue; // Retry cage partitioning if any singleton couldn't merge

            // Compact cages and compute the top-left-most "firstCell" for each cage
            vector<Cage> finalCages;
            for (auto& cg : cages) {
                if (cg.cells.empty()) continue;
                int newId = (int)finalCages.size();
                sort(cg.cells.begin(), cg.cells.end()); // Sorts by row ascending, then col ascending
                cg.id = newId;
                cg.firstCell = cg.cells[0];
                for (const auto& pt : cg.cells) {
                    cageMap[pt.r][pt.c] = newId;
                }
                finalCages.push_back(cg);
            }
            cages = move(finalCages);
            return true;
        }
        return false;
    }

    // Helper: Convert integer to small Unicode superscript string for top-right display
    string toSmallFont(int num) const {
        const string superDigits[10] = {"⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"};
        string s = to_string(num);
        string out = "";
        for (char ch : s) {
            out += superDigits[ch - '0'];
        }
        return out;
    }

public:
    FastKillerSudoku() : rng(random_device{}()) {}

    bool generate() {
        for (int attempt = 0; attempt < 50; attempt++) {
            generateBaseGrid();
            if (!buildKillerCages()) continue;

            // Store full solution
            for (int r = 0; r < SIZE; ++r) {
                for (int c = 0; c < SIZE; ++c) {
                    solution[r][c] = board[r][c];
                }
            }

            // Convert to 1D board and KillerCageInfo vector for KillerPuzzleGenerator
            int board1D[81];
            for (int r = 0; r < SIZE; ++r) {
                for (int c = 0; c < SIZE; ++c) {
                    board1D[r * 9 + c] = board[r][c];
                }
            }

            vector<KillerCageInfo> killerCages;
            killerCages.reserve(cages.size());
            for (const auto& cg : cages) {
                KillerCageInfo kci;
                kci.id = cg.id;
                kci.sum = cg.sum;
                kci.firstCellPos = cg.firstCell.r * 9 + cg.firstCell.c;
                for (const auto& pt : cg.cells) {
                    kci.cells.push_back(pt.r * 9 + pt.c);
                }
                killerCages.push_back(kci);
            }

            KillerPuzzleGenerator puzzleGen;
            const PuzzleConfig& config = KILLER_SUDOKU_CONFIG;
            if (!puzzleGen.generate(board1D, killerCages, config)) continue;

            // Copy back the generated puzzle clues to board
            for (int r = 0; r < SIZE; ++r) {
                for (int c = 0; c < SIZE; ++c) {
                    board[r][c] = board1D[r * 9 + c];
                }
            }

            return true;
        }
        return false;
    }

    void printVisualBoard() const {
        // Lookup table for first-cell sums
        int firstCellSum[SIZE][SIZE] = {0};
        for (const auto& cg : cages) {
            firstCellSum[cg.firstCell.r][cg.firstCell.c] = cg.sum;
        }

        cout << "\n================ KILLER SUDOKU (CAGE SUMS IN TOP-RIGHT SMALL FONT) ================\n\n";

        for (int r = 0; r < SIZE; ++r) {
            // 1. Print top boundary of row
            cout << " ";
            for (int c = 0; c < SIZE; ++c) {
                cout << "+";
                bool sameCageUp = (r > 0 && cageMap[r][c] == cageMap[r - 1][c]);
                if (r % 3 == 0) {
                    cout << (sameCageUp ? " - - - " : "=======");
                } else {
                    cout << (sameCageUp ? "       " : "-------");
                }
            }
            cout << "+\n";

            // 2. Print TOP-RIGHT line of each cell (Small font sum on first cell of group)
            cout << " ";
            for (int c = 0; c < SIZE; ++c) {
                bool sameCageLeft = (c > 0 && cageMap[r][c] == cageMap[r][c - 1]);
                if (c % 3 == 0) cout << (sameCageLeft ? ":" : "‖");
                else cout << (sameCageLeft ? " " : "|");

                int sum = firstCellSum[r][c];
                if (sum > 0) {
                    string smallSum = toSmallFont(sum);
                    int digits = (sum >= 10) ? 2 : 1;
                    cout << string(7 - digits, ' ') << smallSum;
                } else {
                    cout << "       ";
                }
            }
            cout << "‖\n";

            // 3. Print CENTER line of each cell (Main Sudoku digit + group ID)
            cout << " ";
            for (int c = 0; c < SIZE; ++c) {
                bool sameCageLeft = (c > 0 && cageMap[r][c] == cageMap[r][c - 1]);
                if (c % 3 == 0) cout << (sameCageLeft ? ":" : "‖");
                else cout << (sameCageLeft ? " " : "|");

                char groupTag = 'A' + (cageMap[r][c] % 26);
                cout << "  " << board[r][c] << "(" << groupTag << ") ";
            }
            cout << "‖\n";
        }

        // Bottom border
        cout << " ";
        for (int c = 0; c < SIZE; ++c) cout << "+=======";
        cout << "+\n";

        cout << "\nLegend:\n";
        cout << " - Top-Right Superscript (e.g. ²⁴): Sum of the cage written on the 1st cell of the group.\n";
        cout << " - Center Value X(A)              : Solved digit X and Cage Group label (A-Z).\n";
        cout << " - Total Cages Generated          : " << cages.size() << " (All sizes strictly in {2, 3, 4, 5, 6}).\n";
    }

    bool verify() const {
        // 1. Check standard Sudoku row/col/box uniqueness
        for (int i = 0; i < SIZE; ++i) {
            if (rowMask[i] != 0x1FF || colMask[i] != 0x1FF || boxMask[i] != 0x1FF)
                return false;
        }
        // 2. Check Killer Cage sizes (2..6), sums, and digit uniqueness inside each cage
        int totalCells = 0;
        for (const auto& cg : cages) {
            int sz = (int)cg.cells.size();
            if (sz < 2 || sz > 6) return false;
            int calcSum = 0;
            uint16_t mask = 0;
            for (const auto& p : cg.cells) {
                int v = board[p.r][p.c];
                if (mask & (1 << (v - 1))) return false; // Duplicate in cage
                mask |= (1 << (v - 1));
                calcSum += v;
                totalCells++;
            }
            if (calcSum != cg.sum) return false;
        }
        return totalCells == 81;
    }
    void printJSON() const {
        cout << "{\"type\":\"standard\",\"variant\":\"killer_sudoku\",\"size\":9,\"subRows\":3,\"subCols\":3,";
        cout << "\"grid\":[";
        for (int r = 0; r < SIZE; ++r) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; ++c) {
                if (c) cout << ",";
                cout << board[r][c];
            }
            cout << "]";
        }
        cout << "],\"solution\":[";
        for (int r = 0; r < SIZE; ++r) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; ++c) {
                if (c) cout << ",";
                cout << solution[r][c];
            }
            cout << "]";
        }
        cout << "],\"cages\":[";
        for (size_t i = 0; i < cages.size(); ++i) {
            if (i) cout << ",";
            const auto& cg = cages[i];
            cout << "{\"id\":" << cg.id << ",\"sum\":" << cg.sum
                 << ",\"firstCell\":[" << cg.firstCell.r << "," << cg.firstCell.c << "],\"cells\":[";
            for (size_t j = 0; j < cg.cells.size(); ++j) {
                if (j) cout << ",";
                cout << "[" << cg.cells[j].r << "," << cg.cells[j].c << "]";
            }
            cout << "]}";
        }
        cout << "],\"cageMap\":[";
        for (int r = 0; r < SIZE; ++r) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; ++c) {
                if (c) cout << ",";
                cout << cageMap[r][c];
            }
            cout << "]";
        }
        cout << "]}" << endl;
    }
};

int main(int argc, char* argv[]) {
    FastKillerSudoku killer;
    if (killer.generate()) {
        if (argc > 1 && string(argv[1]) == "--visual") {
            killer.printVisualBoard();
        } else {
            killer.printJSON();
        }
    } else {
        cerr << "{\"error\": \"Generation timed out. Adjust config or check constraints.\"}" << endl;
        return 1;
    }
    return 0;
}