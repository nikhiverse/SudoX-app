#include <iostream>
#include <vector>
#include <numeric>
#include <random>
#include <algorithm>

using namespace std;

// Fast Anti-King Sudoku Generation with MRV and Bitmasks:
// 1. Standard Sudoku constraints (Row, Col, 3x3 Box)
// 2. Anti-King constraint: No identical number in any of the 8 King-move neighbors

int board[9][9];
uint16_t rowMask[9], colMask[9], boxMask[9];

uint16_t getKingMask(int r, int c) {
    uint16_t mask = 0;
    const int dr[] = {-1, -1, 1, 1};
    const int dc[] = {-1,  1, -1, 1};
    for (int i = 0; i < 4; i++) {
        int nr = r + dr[i];
        int nc = c + dc[i];
        if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && board[nr][nc] != 0) {
            mask |= (1 << (board[nr][nc] - 1));
        }
    }
    return mask;
}

uint16_t getCandidates(int r, int c) {
    uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)] | getKingMask(r, c);
    return (~used) & 0x1FF; // numbers 1..9
}

bool solveAntiKingMRV(mt19937& rng) {
    int bestR = -1, bestC = -1, minChoices = 11;
    uint16_t bestMask = 0;

    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            if (board[r][c] == 0) {
                uint16_t mask = getCandidates(r, c);
                int choices = __builtin_popcount(mask);
                if (choices == 0) return false;
                if (choices < minChoices) {
                    minChoices = choices;
                    bestR = r; bestC = c;
                    bestMask = mask;
                    if (minChoices == 1) goto found;
                }
            }
        }
    }
found:
    if (bestR == -1) return true; // all filled!

    vector<int> nums;
    for (int i = 0; i < 9; i++) {
        if (bestMask & (1 << i)) nums.push_back(i + 1);
    }
    shuffle(nums.begin(), nums.end(), rng);

    int b = (bestR / 3) * 3 + (bestC / 3);
    for (int num : nums) {
        uint16_t bit = 1 << (num - 1);
        board[bestR][bestC] = num;
        rowMask[bestR] |= bit;
        colMask[bestC] |= bit;
        boxMask[b] |= bit;

        if (solveAntiKingMRV(rng)) return true;

        board[bestR][bestC] = 0;
        rowMask[bestR] &= ~bit;
        colMask[bestC] &= ~bit;
        boxMask[b] &= ~bit;
    }
    return false;
}

void printJSON(const vector<vector<int>>& puzzle, const vector<vector<int>>& solution) {
    cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"grid\":[";
    for (int r = 0; r < 9; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < 9; c++) {
            if (c) cout << ",";
            cout << puzzle[r][c];
        }
        cout << "]";
    }
    cout << "],\"solution\":[";
    for (int r = 0; r < 9; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < 9; c++) {
            if (c) cout << ",";
            cout << solution[r][c];
        }
        cout << "]";
    }
    cout << "]}" << endl;
}

int main() {
    random_device rd;
    mt19937 rng(rd());

    for (int trial = 0; trial < 100; trial++) {
        for (int r = 0; r < 9; r++) {
            rowMask[r] = colMask[r] = boxMask[r] = 0;
            for (int c = 0; c < 9; c++) board[r][c] = 0;
        }

        if (solveAntiKingMRV(rng)) {
            vector<vector<int>> solution(9, vector<int>(9, 0));
            for (int r = 0; r < 9; r++) {
                for (int c = 0; c < 9; c++) {
                    solution[r][c] = board[r][c];
                }
            }

            // Initial clues: 32 given clues for first iteration
            vector<vector<int>> puzzle = solution;
            vector<int> positions(81);
            iota(positions.begin(), positions.end(), 0);
            shuffle(positions.begin(), positions.end(), rng);

            for (int i = 0; i < 49; i++) {
                int r = positions[i] / 9;
                int c = positions[i] % 9;
                puzzle[r][c] = 0;
            }

            printJSON(puzzle, solution);
            return 0;
        }
    }

    cerr << "Failed to generate Anti-King grid.\n";
    return 1;
}