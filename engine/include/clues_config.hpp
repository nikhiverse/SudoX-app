#ifndef CLUES_CONFIG_HPP
#define CLUES_CONFIG_HPP

#include <random>

// Thread-safe random clue generator
inline int getRandomClues(int min, int max) {
  thread_local std::random_device rd;
  thread_local std::mt19937 gen(rd());
  std::uniform_int_distribution<> distr(min, max);
  return distr(gen);
}

struct PuzzleConfig {
  int target_clues;
  int max_per_row;
  int max_per_col;
  int max_per_grid;
  int max_per_diagonal;
  bool check_diagonals;
  bool exact_diagonal;
  int max_per_window;
  bool check_windows;
  bool exact_window;
};

// ==========================================
// FIXED CONFIGURATIONS
// ==========================================

// Sudoku Easy: 9x9 puzzle. Total clues = 45, max per row/col/grid = 5
const PuzzleConfig SUDOKU_EASY_CONFIG = {45,    5,     5, 5,     9,
                                         false, false, 9, false, false};

// Sudoku 9: 9x9 puzzle. Total clues = 36, max per row/col/grid = 5
const PuzzleConfig SUDOKU_9_CONFIG = {36,    5,     5, 5,     9,
                                      false, false, 9, false, false};

// ==========================================
// DYNAMIC CONFIGURATIONS (Macro Definitions)
// ==========================================

// Sudoku Mini: 6x6 puzzle.
#define SUDOKU_MINI_CONFIG                                                     \
  (PuzzleConfig{getRandomClues(12, 15), 3, 3, 3, 6, false, false, 6, false,    \
                false})

// Sudoku A: 9x9 puzzle.
#define SUDOKU_A_CONFIG                                                        \
  (PuzzleConfig{getRandomClues(18, 27), 4, 4, 4, 9, false, false, 9, false,    \
                false})

// Sudoku X: 9x9 puzzle.
#define SUDOKU_X_CONFIG                                                        \
  (PuzzleConfig{getRandomClues(28, 40), 5, 5, 5, 5, true, false, 9, false,      \
                false})

// Windoku: 9x9 puzzle.
#define WINDOKU_CONFIG                                                         \
  (PuzzleConfig{getRandomClues(28, 40), 5, 5, 5, 9, false, false, 5, true,     \
                false})

// Windoku X: 9x9 puzzle.
#define WINDOKU_X_CONFIG                                                       \
  (PuzzleConfig{getRandomClues(27, 36), 4, 4, 4, 4, true, false, 4, true, false})

// Jigsaw 8: 8x8 puzzle.
#define JIGSAW_8_CONFIG                                                        \
  (PuzzleConfig{getRandomClues(23, 32), 5, 5, 5, 8, false, false, 8, false,    \
                false})

// Jigsaw 9: 9x9 puzzle.
#define JIGSAW_9_CONFIG                                                        \
  (PuzzleConfig{getRandomClues(28, 40), 5, 5, 5, 9, false, false, 9, false,    \
                false})

// Jigsaw X: 9x9 puzzle.
#define JIGSAW_X_CONFIG                                                        \
  (PuzzleConfig{getRandomClues(28, 40), 5, 5, 5, 5, true, false, 9, false,      \
                false})

// Windoku Jigsaw: 9x9 puzzle.
#define WINDOKU_JIGSAW_CONFIG                                                  \
  (PuzzleConfig{getRandomClues(28, 40), 5, 5, 5, 9, false, false, 5, true,     \
                false})

// Sudoku 12: 12x12 puzzle.
#define SUDOKU_12_CONFIG                                                       \
  (PuzzleConfig{getRandomClues(54, 72), 7, 7, 7, 12, false, false, 12, false,  \
                false})

// Dozaku: 12x12 with 3x4 and 4x3 grids.
#define DOZAKU_CONFIG                                                          \
  (PuzzleConfig{getRandomClues(54, 72), 7, 7, 7, 12, false, false, 12, false,  \
                false})

// Twodoku Mini: Overlapping 6x6 grids.
#define TWODOKU_MINI_CONFIG                                                    \
  (PuzzleConfig{getRandomClues(24, 30), 3, 3, 3, 6, false, false, 6, false,    \
                false})

// Twodoku 8: Overlapping 8x8 grids.
#define TWODOKU_8_CONFIG                                                       \
  (PuzzleConfig{getRandomClues(48, 56), 5, 5, 5, 8, false, false, 8, false,    \
                false})

// Twodoku 9: Overlapping 9x9 grids.
#define TWODOKU_9_CONFIG                                                       \
  (PuzzleConfig{getRandomClues(72, 81), 5, 5, 5, 9, false, false, 9, false,    \
                false})

#endif
