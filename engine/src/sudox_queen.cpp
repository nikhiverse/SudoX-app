#include <iostream>
#include <vector>
#include <cmath>
#include <numeric>
#include <random>
#include <algorithm>

using namespace std;

// Fast SudoX Queen Generation Algorithm:
// Step 1: Place 9 non-attacking Queens (digit 9) satisfying:
//         - 1 per row, 1 per col, 1 per 3x3 box
//         - No 2 queens on the same diagonal anywhere (N-Queens constraint)
//         - At most 1 queen on main diagonals
// Step 2: Fill remaining digits 1..8 using fast MRV (Minimum Remaining Values) bitmask solver.

bool isQueenValid(const vector<int>& queenCol, int r, int c) {
    for (int prevR = 0; prevR < r; prevR++) {
        int prevC = queenCol[prevR];
        if (prevC == c) return false;
        if (abs(r - prevR) == abs(c - prevC)) return false; // Diagonal attack
        if ((r / 3 == prevR / 3) && (c / 3 == prevC / 3)) return false; // Same 3x3 block
    }
    return true;
}

bool placeQueens(vector<int>& queenCol, int r, mt19937& rng) {
    if (r == 9) {
        int mainDiag = 0, antiDiag = 0;
        for (int i = 0; i < 9; i++) {
            if (queenCol[i] == i) mainDiag++;
            if (queenCol[i] == 8 - i) antiDiag++;
        }
        return (mainDiag <= 1 && antiDiag <= 1);
    }

    vector<int> cols = {0, 1, 2, 3, 4, 5, 6, 7, 8};
    shuffle(cols.begin(), cols.end(), rng);

    for (int c : cols) {
        if (isQueenValid(queenCol, r, c)) {
            queenCol[r] = c;
            if (placeQueens(queenCol, r + 1, rng)) return true;
        }
    }
    return false;
}

int board[9][9];
uint16_t rowMask[9], colMask[9], boxMask[9];
uint16_t diag1Mask = 0, diag2Mask = 0;
int workNodes = 0;

uint16_t getCandidates(int r, int c) {
    uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)];
    if (r == c) used |= diag1Mask;
    if (r + c == 8) used |= diag2Mask;
    return (~used) & 0xFF; // numbers 1..8
}

bool solveRemaining(mt19937& rng) {
    if (++workNodes > 500) return false; // Fail fast to try next queen configuration

    int bestR = -1, bestC = -1, minChoices = 10;
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
    if (bestR == -1) return true;

    vector<int> nums;
    for (int i = 0; i < 8; i++) {
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
        if (bestR == bestC) diag1Mask |= bit;
        if (bestR + bestC == 8) diag2Mask |= bit;

        if (solveRemaining(rng)) return true;

        board[bestR][bestC] = 0;
        rowMask[bestR] &= ~bit;
        colMask[bestC] &= ~bit;
        boxMask[b] &= ~bit;
        if (bestR == bestC) diag1Mask &= ~bit;
        if (bestR + bestC == 8) diag2Mask &= ~bit;
    }
    return false;
}

void printJSON(const vector<vector<int>>& puzzle, const vector<vector<int>>& solution) {
    cout << "{\"type\":\"standard\",\"size\":9,\"subRows\":3,\"subCols\":3,\"diagonals\":true,\"grid\":[";
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

    vector<int> queenCol(9, -1);
    for (int trial = 0; trial < 1000; trial++) {
        fill(queenCol.begin(), queenCol.end(), -1);
        if (placeQueens(queenCol, 0, rng)) {
            for (int r = 0; r < 9; r++) {
                rowMask[r] = colMask[r] = boxMask[r] = 0;
                for (int c = 0; c < 9; c++) board[r][c] = 0;
            }
            diag1Mask = diag2Mask = 0;

            for (int r = 0; r < 9; r++) {
                board[r][queenCol[r]] = 9;
            }

            workNodes = 0;
            if (solveRemaining(rng)) {
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
    }

    cerr << "Failed to generate SudoX Queen board.\n";
    return 1;
}