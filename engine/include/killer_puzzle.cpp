#ifndef KILLER_PUZZLE_CPP
#define KILLER_PUZZLE_CPP

#include <vector>
#include <algorithm>
#include <iostream>
#include <random>
#include <cstdint>
#include "uniqueness.cpp"
#include "clues_config.hpp"

using namespace std;

// Struct representing a Killer Sudoku Cage (Group of 2..6 cells)
struct KillerCageInfo {
    int id;
    int sum;
    int firstCellPos;        // Top-most, then left-most cell position (r * 9 + c)
    vector<int> cells;       // 1D indices (r * 9 + c) of cells belonging to this cage
};

// ============================================================================
// FAST KILLER UNIQUENESS CHECKER
// Checks solution uniqueness under BOTH Standard 9x9 Sudoku rules AND
// Killer Cage rules (no repeating digits in a cage + exact sum match).
// ============================================================================
class KillerUniquenessChecker {
private:
    static constexpr int SIZE = 9;
    static constexpr int NUM_BOXES = 9;
    static constexpr int MAX_CAGES = 45;

    int board[81];
    int cageLookup[81];
    int cageTargetSum[MAX_CAGES];
    int cageCurrentSum[MAX_CAGES];
    int cageUnfilledCount[MAX_CAGES];
    uint16_t cageMask[MAX_CAGES];

    uint16_t rowMask[9];
    uint16_t colMask[9];
    uint16_t boxMask[9];

    // Precomputed min/max sum of 'k' distinct digits from a bitmask
    // Evaluated in O(1) via bit-scanning
    inline bool isCageSumFeasible(uint16_t availCageDigits, int remCells, int remSum, uint16_t& validDigitsMask) const {
        if (remCells == 0) {
            validDigitsMask = 0;
            return remSum == 0;
        }
        if (remSum <= 0) return false;

        int availCount = __builtin_popcount(availCageDigits);
        if (availCount < remCells) return false;

        // If only 1 cell remains in the cage, the exact value MUST be remSum!
        if (remCells == 1) {
            if (remSum >= 1 && remSum <= 9 && (availCageDigits & (1 << (remSum - 1)))) {
                validDigitsMask = (1 << (remSum - 1));
                return true;
            }
            return false;
        }

        // Extract sorted available digits in this cage
        int digits[9];
        int n = 0;
        for (uint16_t m = availCageDigits; m; m &= m - 1) {
            digits[n++] = __builtin_ctz(m) + 1;
        }

        // Sum of smallest (remCells) digits vs largest (remCells) digits
        int minPossible = 0, maxPossible = 0;
        for (int i = 0; i < remCells; ++i) {
            minPossible += digits[i];
            maxPossible += digits[n - 1 - i];
        }
        if (remSum < minPossible || remSum > maxPossible) return false;

        // Filter out individual candidate digits d that would make the remaining (remCells - 1) unfeasible
        uint16_t feasibleMask = 0;
        for (int idx = 0; idx < n; ++idx) {
            int d = digits[idx];
            int targetAfterD = remSum - d;
            if (targetAfterD <= 0) continue;

            int minRem = 0, maxRem = 0;
            int picked = 0;
            for (int i = 0; i < n && picked < remCells - 1; ++i) {
                if (i == idx) continue;
                minRem += digits[i];
                picked++;
            }
            picked = 0;
            for (int i = n - 1; i >= 0 && picked < remCells - 1; --i) {
                if (i == idx) continue;
                maxRem += digits[i];
                picked++;
            }
            if (targetAfterD >= minRem && targetAfterD <= maxRem) {
                feasibleMask |= (1 << (d - 1));
            }
        }

        validDigitsMask = feasibleMask;
        return feasibleMask != 0;
    }

    int solutionCount = 0;
    int evalCount = 0;
    static constexpr int EVAL_LIMIT = 150000;

    void solveMRV() {
        if (++evalCount > EVAL_LIMIT) return;
        if (solutionCount > 1) return;

        int bestPos = -1;
        int minChoices = 10;
        uint16_t bestMask = 0;

        for (int pos = 0; pos < 81; ++pos) {
            if (board[pos] == 0) {
                int r = pos / 9, c = pos % 9;
                int b = (r / 3) * 3 + (c / 3);
                int cid = cageLookup[pos];

                uint16_t sudokuUsed = rowMask[r] | colMask[c] | boxMask[b] | cageMask[cid];
                uint16_t sudokuAvail = (~sudokuUsed) & 0x1FF;
                if (sudokuAvail == 0) return;

                // Apply Killer Cage arithmetic pruning
                uint16_t cageAvail = (~cageMask[cid]) & 0x1FF;
                int remCells = cageUnfilledCount[cid];
                int remSum = cageTargetSum[cid] - cageCurrentSum[cid];

                uint16_t validCageDigits = 0;
                if (!isCageSumFeasible(cageAvail, remCells, remSum, validCageDigits)) {
                    return; // Cage sum cannot be satisfied -> immediate prune!
                }

                uint16_t mask = sudokuAvail & validCageDigits;
                int choices = __builtin_popcount(mask);
                if (choices == 0) return;

                if (choices < minChoices) {
                    minChoices = choices;
                    bestPos = pos;
                    bestMask = mask;
                    if (choices == 1) break; // Forced naked/cage single
                }
            }
        }

        if (bestPos == -1) {
            solutionCount++;
            return;
        }

        int r = bestPos / 9, c = bestPos % 9;
        int b = (r / 3) * 3 + (c / 3);
        int cid = cageLookup[bestPos];

        for (uint16_t m = bestMask; m; m &= m - 1) {
            int valIdx = __builtin_ctz(m);
            int val = valIdx + 1;
            uint16_t bit = (1 << valIdx);

            // Place digit
            board[bestPos] = val;
            rowMask[r] |= bit;
            colMask[c] |= bit;
            boxMask[b] |= bit;
            cageMask[cid] |= bit;
            cageCurrentSum[cid] += val;
            cageUnfilledCount[cid]--;

            solveMRV();

            // Undo placement
            cageUnfilledCount[cid]++;
            cageCurrentSum[cid] -= val;
            cageMask[cid] &= ~bit;
            boxMask[b] &= ~bit;
            colMask[c] &= ~bit;
            rowMask[r] &= ~bit;
            board[bestPos] = 0;

            if (solutionCount > 1) return;
        }
    }

public:
    int count(const int* inputBoard, const vector<KillerCageInfo>& cages) {
        for (int i = 0; i < 9; ++i) {
            rowMask[i] = colMask[i] = boxMask[i] = 0;
        }

        int numCages = (int)cages.size();
        for (int i = 0; i < numCages; ++i) {
            cageTargetSum[i] = cages[i].sum;
            cageCurrentSum[i] = 0;
            cageUnfilledCount[i] = (int)cages[i].cells.size();
            cageMask[i] = 0;
            for (int pos : cages[i].cells) {
                cageLookup[pos] = i;
            }
        }

        for (int pos = 0; pos < 81; ++pos) {
            int val = inputBoard[pos];
            board[pos] = val;
            if (val != 0) {
                int r = pos / 9, c = pos % 9;
                int b = (r / 3) * 3 + (c / 3);
                int cid = cageLookup[pos];
                uint16_t bit = (1 << (val - 1));

                rowMask[r] |= bit;
                colMask[c] |= bit;
                boxMask[b] |= bit;
                cageMask[cid] |= bit;
                cageCurrentSum[cid] += val;
                cageUnfilledCount[cid]--;
            }
        }

        solutionCount = 0;
        evalCount = 0;
        solveMRV();
        return solutionCount;
    }
};

// ============================================================================
// KILLER PUZZLE GENERATOR
// Removes clues while enforcing:
// 1. Group size 2      -> 0 or 1 clue max (<= 1)
// 2. Group size 3 or 4 -> 0, 1, or 2 clues max (<= 2)
// 3. Group size 5 or 6 -> 0, 1, 2, or 3 clues max (<= 3)
// 4. Each Row, Col, and 3x3 Subgrid -> max 5 clues (<= 5)
// 5. Unique solution guaranteed (via KillerUniquenessChecker or Standard UniquenessChecker)
// ============================================================================
class KillerPuzzleGenerator {
private:
    static constexpr int SIZE = 9;
    static constexpr int MAX_UNIT_CLUES = 5; // Max 5 clues per row, col, and 3x3 subgrid
    mt19937 rng;

public:
    bool useKillerSumUniqueness = true; // Set false if clues alone must be unique without cage sums

    KillerPuzzleGenerator() : rng(random_device{}()) {}

    // Max allowed clues for a cage of given size:
    // Size 2   -> max 1 (0, 1)
    // Size 3,4 -> max 2 (0, 1, 2)
    // Size 5,6 -> max 3 (0, 1, 2, 3)
    static inline int getMaxCluesForCageSize(int cageSize) {
        if (cageSize <= 2) return 1;
        if (cageSize <= 4) return 2;
        return 3; // For size 5 and 6
    }

    // Verify all Killer clue distribution rules
    bool satisfiesKillerConstraints(
        const int* board,
        const vector<KillerCageInfo>& cages,
        int targetClues = -1
    ) const {
        int totalClues = 0;
        int rowCounts[9] = {0};
        int colCounts[9] = {0};
        int boxCounts[9] = {0};

        for (int r = 0; r < 9; ++r) {
            for (int c = 0; c < 9; ++c) {
                int pos = r * 9 + c;
                if (board[pos] != 0) {
                    totalClues++;
                    rowCounts[r]++;
                    colCounts[c]++;
                    boxCounts[(r / 3) * 3 + (c / 3)]++;
                }
            }
        }

        if (targetClues != -1 && totalClues != targetClues) {
            return false;
        }

        // Check Row, Col, and 3x3 Subgrid max 5 clues rule
        for (int i = 0; i < 9; ++i) {
            if (rowCounts[i] > MAX_UNIT_CLUES) return false;
            if (colCounts[i] > MAX_UNIT_CLUES) return false;
            if (boxCounts[i] > MAX_UNIT_CLUES) return false;
        }

        // Check Cage size clue limits:
        // Size 2 -> {0,1}, Size 3,4 -> {0,1,2}, Size 5,6 -> {0,1,2,3}
        for (const auto& cg : cages) {
            int cgClues = 0;
            for (int pos : cg.cells) {
                if (board[pos] != 0) cgClues++;
            }
            int maxAllowed = getMaxCluesForCageSize((int)cg.cells.size());
            if (cgClues > maxAllowed) return false;
        }

        return true;
    }

    // Generate the Killer Sudoku clues on 'board'
    // If config.target_clues <= 0, it automatically selects a valid clue target
    // from the feasible cage & unit capacities.
    bool generate(int* board, const vector<KillerCageInfo>& cages, int targetClues = -1) {
        int original[81];
        for (int i = 0; i < 81; ++i) original[i] = board[i];

        int numCages = (int)cages.size();
        int cageLookup[81];
        int cageMaxClues[45];

        int maxPossibleByCages = 0;
        for (int i = 0; i < numCages; ++i) {
            int sz = (int)cages[i].cells.size();
            cageMaxClues[i] = getMaxCluesForCageSize(sz);
            maxPossibleByCages += cageMaxClues[i];
            for (int pos : cages[i].cells) {
                cageLookup[pos] = i;
            }
        }

        // Cap targetClues to the theoretical maximum allowed by the cages and 5-per-row limit (45)
        int upperBound = min(45, maxPossibleByCages);
        if (targetClues > upperBound) {
            targetClues = upperBound;
        }

        KillerUniquenessChecker killerChecker;
        UniquenessChecker<9, 3, 3> standardChecker;

        auto isUnique = [&](const int* b) -> bool {
            if (useKillerSumUniqueness) {
                return killerChecker.count(b, cages) == 1;
            } else {
                return standardChecker.count(b) == 1;
            }
        };

        int attempts = 0;
        while (attempts < 250) {
            attempts++;

            // Reset board to full solution
            for (int i = 0; i < 81; ++i) board[i] = original[i];

            int currentClues = 81;
            int rowCounts[9] = {9, 9, 9, 9, 9, 9, 9, 9, 9};
            int colCounts[9] = {9, 9, 9, 9, 9, 9, 9, 9, 9};
            int boxCounts[9] = {9, 9, 9, 9, 9, 9, 9, 9, 9};
            int cageCounts[45];
            for (int i = 0; i < numCages; ++i) {
                cageCounts[i] = (int)cages[i].cells.size();
            }

            // Pick a randomized target clue budget if not explicitly locked
            int effectiveTarget = targetClues;
            if (effectiveTarget < 0) {
                // Randomize target clue count per cage within {0..maxAllowed}
                int sumTarget = 0;
                for (int i = 0; i < numCages; ++i) {
                    int m = cageMaxClues[i];
                    sumTarget += uniform_int_distribution<int>(0, m)(rng);
                }
                effectiveTarget = min(sumTarget, 45);
            }

            int stuckCount = 0;

            while ((currentClues > effectiveTarget || !satisfiesKillerConstraints(board, cages, -1)) && stuckCount < 6) {
                vector<int> candidates;
                candidates.reserve(81);

                for (int pos = 0; pos < 81; ++pos) {
                    if (board[pos] != 0) {
                        candidates.push_back(pos);
                    }
                }

                shuffle(candidates.begin(), candidates.end(), rng);

                // Priority heuristic:
                // Heavily prioritize removing clues from cages or rows/cols/boxes that currently VIOLATE
                // their maximum clue cap, so constraints are satisfied as early as possible.
                stable_sort(candidates.begin(), candidates.end(), [&](int pA, int pB) {
                    int rA = pA / 9, cA = pA % 9, bA = (rA / 3) * 3 + (cA / 3), cgA = cageLookup[pA];
                    int rB = pB / 9, cB = pB % 9, bB = (rB / 3) * 3 + (cB / 3), cgB = cageLookup[pB];

                    int vA = 0, vB = 0;
                    if (cageCounts[cgA] > cageMaxClues[cgA]) vA += 1000 * (cageCounts[cgA] - cageMaxClues[cgA]);
                    if (rowCounts[rA] > MAX_UNIT_CLUES)      vA += 500 * (rowCounts[rA] - MAX_UNIT_CLUES);
                    if (colCounts[cA] > MAX_UNIT_CLUES)      vA += 500 * (colCounts[cA] - MAX_UNIT_CLUES);
                    if (boxCounts[bA] > MAX_UNIT_CLUES)      vA += 500 * (boxCounts[bA] - MAX_UNIT_CLUES);

                    if (cageCounts[cgB] > cageMaxClues[cgB]) vB += 1000 * (cageCounts[cgB] - cageMaxClues[cgB]);
                    if (rowCounts[rB] > MAX_UNIT_CLUES)      vB += 500 * (rowCounts[rB] - MAX_UNIT_CLUES);
                    if (colCounts[cB] > MAX_UNIT_CLUES)      vB += 500 * (colCounts[cB] - MAX_UNIT_CLUES);
                    if (boxCounts[bB] > MAX_UNIT_CLUES)      vB += 500 * (boxCounts[bB] - MAX_UNIT_CLUES);

                    if (vA != vB) return vA > vB;

                    int densityA = rowCounts[rA] + colCounts[cA] + boxCounts[bA] + cageCounts[cgA] * 2;
                    int densityB = rowCounts[rB] + colCounts[cB] + boxCounts[bB] + cageCounts[cgB] * 2;
                    return densityA > densityB;
                });

                bool removedAny = false;
                for (int pos : candidates) {
                    int backup = board[pos];
                    board[pos] = 0;

                    if (isUnique(board)) {
                        int r = pos / 9, c = pos % 9, b = (r / 3) * 3 + (c / 3), cg = cageLookup[pos];
                        rowCounts[r]--;
                        colCounts[c]--;
                        boxCounts[b]--;
                        cageCounts[cg]--;
                        currentClues--;
                        removedAny = true;
                        break;
                    } else {
                        board[pos] = backup;
                    }
                }

                // If we already satisfy all unit & cage upper bounds and reached targetClues, stop!
                if (targetClues == -1 && satisfiesKillerConstraints(board, cages, -1) && currentClues <= effectiveTarget) {
                    return true;
                }
                if (targetClues != -1 && currentClues == targetClues && satisfiesKillerConstraints(board, cages, targetClues)) {
                    return true;
                }

                if (!removedAny) {
                    stuckCount++;
                    // Perturbation recovery: put back 3 random removed cells to escape local minima
                    vector<int> emptyCells;
                    for (int pos = 0; pos < 81; ++pos) {
                        if (board[pos] == 0) emptyCells.push_back(pos);
                    }
                    if (emptyCells.size() < 2) break;
                    shuffle(emptyCells.begin(), emptyCells.end(), rng);
                    int putBack = min(3, (int)emptyCells.size());
                    for (int i = 0; i < putBack; ++i) {
                        int pos = emptyCells[i];
                        board[pos] = original[pos];
                        int r = pos / 9, c = pos % 9, b = (r / 3) * 3 + (c / 3), cg = cageLookup[pos];
                        rowCounts[r]++;
                        colCounts[c]++;
                        boxCounts[b]++;
                        cageCounts[cg]++;
                        currentClues++;
                    }
                }
            }

            if (satisfiesKillerConstraints(board, cages, targetClues)) {
                return true;
            }
        }

        return false;
    }

    // Overload accepting PuzzleConfig directly (matches random_puzzle.cpp interface)
    bool generate(int* board, const vector<KillerCageInfo>& cages, const PuzzleConfig& config) {
        return generate(board, cages, config.target_clues);
    }
};

#endif
