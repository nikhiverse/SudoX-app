#include <iostream>
#include <vector>
#include <cmath>
#include <numeric>
#include <random>
#include <algorithm>
#include "../include/random_puzzle.cpp"
#include "../include/clues_config.hpp"

using namespace std;

// SudoX Royal:
// Combines King and Queen chess rules:
// 1. Standard 9x9 Sudoku constraints (Row, Col, 3x3 Box)
// 2. Anti-King constraint: No identical numbers can touch diagonally (chess King move)
// 3. 9 Non-Attacking Queens constraint on digit 9 (no two 9s can share any diagonal)
// Config: 28-38 total clues, max 5 clues per row/col/subgrid, random puzzle.

const int SIZE = 9;

int board[SIZE][SIZE];
uint16_t rowMask[SIZE], colMask[SIZE], boxMask[SIZE];
int workNodes = 0;

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
    if (r == SIZE) return true;

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

uint16_t getKingMask(int r, int c) {
    uint16_t mask = 0;
    const int dr[] = {-1, -1, 1, 1};
    const int dc[] = {-1,  1, -1, 1};
    for (int i = 0; i < 4; i++) {
        int nr = r + dr[i];
        int nc = c + dc[i];
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] != 0) {
            mask |= (1 << (board[nr][nc] - 1));
        }
    }
    return mask;
}

uint16_t getCandidates(int r, int c) {
    uint16_t used = rowMask[r] | colMask[c] | boxMask[(r / 3) * 3 + (c / 3)] | getKingMask(r, c);
    return (~used) & 0xFF; // numbers 1..8
}

bool solveRemaining(mt19937& rng) {
    if (++workNodes > 5000) return false; // Fail fast to try next queen configuration

    int bestR = -1, bestC = -1, minChoices = 10;
    uint16_t bestMask = 0;

    for (int r = 0; r < SIZE; r++) {
        for (int c = 0; c < SIZE; c++) {
            if (board[r][c] == 0) {
                uint16_t mask = getCandidates(r, c);
                int choices = __builtin_popcount(mask);
                if (choices == 0) return false;
                if (choices < minChoices) {
                    minChoices = choices;
                    bestR = r;
                    bestC = c;
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

        if (solveRemaining(rng)) return true;

        board[bestR][bestC] = 0;
        rowMask[bestR] &= ~bit;
        colMask[bestC] &= ~bit;
        boxMask[b] &= ~bit;
    }
    return false;
}

void printJSON(const vector<vector<int>>& puzzle, const vector<vector<int>>& solution) {
    cout << "{\"type\":\"standard\",\"variant\":\"sudox_royal\",\"size\":9,\"subRows\":3,\"subCols\":3,\"grid\":[";
    for (int r = 0; r < SIZE; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < SIZE; c++) {
            if (c) cout << ",";
            cout << puzzle[r][c];
        }
        cout << "]";
    }
    cout << "],\"solution\":[";
    for (int r = 0; r < SIZE; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < SIZE; c++) {
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

    vector<int> queenCol(SIZE, -1);
    while (true) {
        fill(queenCol.begin(), queenCol.end(), -1);
        if (placeQueens(queenCol, 0, rng)) {
            for (int r = 0; r < SIZE; r++) {
                rowMask[r] = colMask[r] = boxMask[r] = 0;
                for (int c = 0; c < SIZE; c++) board[r][c] = 0;
            }

            for (int r = 0; r < SIZE; r++) {
                int c = queenCol[r];
                board[r][c] = 9;
                uint16_t bit = 1 << 8;
                rowMask[r] |= bit;
                colMask[c] |= bit;
                boxMask[(r / 3) * 3 + (c / 3)] |= bit;
            }

            workNodes = 0;
            if (solveRemaining(rng)) {
                vector<vector<int>> solution(SIZE, vector<int>(SIZE, 0));
                int flatBoard[81];
                for (int r = 0; r < SIZE; r++) {
                    for (int c = 0; c < SIZE; c++) {
                        solution[r][c] = board[r][c];
                        flatBoard[r * SIZE + c] = board[r][c];
                    }
                }

                PuzzleConfig config = SUDOX_ROYAL_CONFIG;
                // Apply random puzzle generator as requested
                PuzzleGenerator<9, 3, 3> clueGen;
                if (clueGen.generate(flatBoard, config)) {
                    vector<vector<int>> puzzle(SIZE, vector<int>(SIZE, 0));
                    for (int r = 0; r < SIZE; r++) {
                        for (int c = 0; c < SIZE; c++) {
                            puzzle[r][c] = flatBoard[r * SIZE + c];
                        }
                    }
                    printJSON(puzzle, solution);
                    return 0;
                }
            }
        }
    }

    return 0;
}