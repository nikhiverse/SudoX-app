#include "../include/random_puzzle.cpp"
#include <iostream>
#include <vector>
#include <random>
#include <algorithm>

using namespace std;

const int SIZE = 6;

struct Point { int r, c; };

// JigsawSudoku: 6x6 grid with randomized connected shapes (hexominoes)
class JigsawSudoku {
private:
    int groupGrid[SIZE * SIZE];
    int board[SIZE * SIZE];
    int solution[SIZE * SIZE];
    uint16_t rowMask[SIZE], colMask[SIZE], groupMask[SIZE];
    mt19937 rng;
    int solveCounter;
    int shapeSteps;

    void reset() {
        solveCounter = 0;
        shapeSteps = 0;
        for (int i = 0; i < SIZE; i++) {
            rowMask[i] = colMask[i] = groupMask[i] = 0;
        }
        for (int pos = 0; pos < SIZE * SIZE; pos++) {
            groupGrid[pos] = -1;
            board[pos] = 0;
        }
    }

    bool growGroup(vector<Point>& currentCells, int groupId) {
        if (++shapeSteps > 1500) return false;
        if (currentCells.size() == SIZE) return true;
        
        int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};
        vector<Point> candidates;
        
        for (auto& p : currentCells) {
            for (int i = 0; i < 4; i++) {
                int nr = p.r + dr[i], nc = p.c + dc[i];
                if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && groupGrid[nr * SIZE + nc] == -1) {
                    bool exists = false;
                    for (auto& cand : candidates) {
                        if (cand.r == nr && cand.c == nc) { exists = true; break; }
                    }
                    if (!exists) candidates.push_back({nr, nc});
                }
            }
        }
        if (candidates.empty()) return false;
        
        shuffle(candidates.begin(), candidates.end(), rng);
        
        for (auto& c : candidates) {
            groupGrid[c.r * SIZE + c.c] = groupId;
            currentCells.push_back(c);
            
            if (growGroup(currentCells, groupId)) return true;
            
            currentCells.pop_back();
            groupGrid[c.r * SIZE + c.c] = -1;
        }
        return false;
    }

    bool createShapes(int groupId) {
        if (groupId == SIZE) return true;
        
        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                int pos = r * SIZE + c;
                if (groupGrid[pos] == -1) {
                    groupGrid[pos] = groupId;
                    vector<Point> curr = {{r, c}};
                    
                    if (growGroup(curr, groupId)) {
                        if (createShapes(groupId + 1)) return true;
                    }
                    
                    groupGrid[pos] = -1;
                    return false;
                }
            }
        }
        return true;
    }

    // Possibility mask: 6 bits for numbers 1 to 6 (0x3F)
    uint16_t getPossible(int r, int c) {
        return ~(rowMask[r] | colMask[c] | groupMask[groupGrid[r * SIZE + c]]) & 0x3F;
    }

    bool solve() {
        if (++solveCounter > 5000) return false;

        int bestR = -1, bestC = -1, minChoices = SIZE + 1;
        uint16_t bestMask = 0;

        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                int pos = r * SIZE + c;
                if (board[pos] == 0) {
                    uint16_t mask = getPossible(r, c);
                    int choices = 0;
                    for (int i = 0; i < SIZE; i++) if (mask & (1 << i)) choices++;
                    
                    if (choices == 0) return false;
                    
                    if (choices < minChoices) {
                        minChoices = choices; bestR = r; bestC = c; bestMask = mask;
                    }
                    if (minChoices == 1) goto found;
                }
            }
        }

    found:
        if (bestR == -1) return true;

        vector<int> nums;
        for (int i = 0; i < SIZE; i++) if (bestMask & (1 << i)) nums.push_back(i + 1);
        shuffle(nums.begin(), nums.end(), rng);

        int pos = bestR * SIZE + bestC;

        for (int n : nums) {
            int bit = 1 << (n - 1);
            board[pos] = n;
            rowMask[bestR] |= bit; colMask[bestC] |= bit; groupMask[groupGrid[pos]] |= bit;
            
            if (solve()) return true;
            
            rowMask[bestR] &= ~bit; colMask[bestC] &= ~bit; groupMask[groupGrid[pos]] &= ~bit;
            board[pos] = 0;
        }
        return false;
    }

public:
    JigsawSudoku() : rng(random_device{}()) {}

    void generate() {
        // (6 / 2) * (6 / 3) = 6 regions to match 6 groups
        PuzzleGenerator<SIZE, 2, 3> clueGen;
        bool success = false;
        while (!success) {
            reset();
            if (createShapes(0)) {
                if (solve()) {
                    for (int i = 0; i < SIZE * SIZE; i++) solution[i] = board[i];
                    clueGen.gridMap = groupGrid;
                    success = clueGen.generate(board, JIGSAW_MINI_CONFIG);
                }
            }
        }
    }

    void printJSON() {
        cout << "{\"type\":\"jigsaw\",\"size\":" << SIZE << ",\"grid\":[";
        for (int r = 0; r < SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; c++) {
                if (c) cout << ",";
                cout << board[r * SIZE + c];
            }
            cout << "]";
        }
        cout << "],\"groups\":[";
        for (int r = 0; r < SIZE; r++) {
            if (r) cout << ",";
            cout << "[";
            for (int c = 0; c < SIZE; c++) {
                if (c) cout << ",";
                cout << groupGrid[r * SIZE + c];
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
    JigsawSudoku game;
    game.generate();
    game.printJSON();
    return 0;
}
