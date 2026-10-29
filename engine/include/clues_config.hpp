#ifndef CLUES_CONFIG_HPP
#define CLUES_CONFIG_HPP

#include <cstdlib>
#include <fstream>
#include <map>
#include <random>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#ifdef _WIN32
// No-op or alternative lock for Windows environments
class FileLock {
public:
  FileLock(const std::string &) {}
  ~FileLock() {}
};
#else
#include <fcntl.h>
#include <sys/file.h>
#include <unistd.h>

class FileLock {
private:
  int fd = -1;

public:
  FileLock(const std::string &lock_path) {
    fd = open(lock_path.c_str(), O_RDONLY | O_CREAT, 0666);
    if (fd != -1) {
      flock(fd, LOCK_EX); // Blocks until exclusive lock is acquired
    }
  }
  ~FileLock() {
    if (fd != -1) {
      flock(fd, LOCK_UN); // Release lock
      close(fd);
    }
  }
};
#endif

// Thread-safe random clue generator with persistent swap-and-pop pool
// (numbpool2 logic) Separates state files/ranges by specific game variant to
// prevent collision
inline int getRandomClues(const std::string &game_name, int min, int max) {
  if (min > max) {
    return min; // Fallback underflow mitigation
  }

  // Get state path from environment or default to local file
  const char *env_path = std::getenv("SUDOX_CLUES_STATE_PATH");
  const std::string filepath = env_path ? env_path : "clues_pool_state.txt";
  const std::string lockpath = filepath + ".lock";

  // Acquire cross-process/cross-thread lock for the entire read-modify-write
  // duration
  FileLock lock(lockpath);

  // Read all existing pools to keep them intact
  std::map<std::string, std::pair<std::pair<int, int>, std::vector<int>>> pools;

  std::ifstream infile(filepath);
  if (infile.is_open()) {
    std::string line;
    while (std::getline(infile, line)) {
      if (line.empty())
        continue;
      size_t colon_pos = line.find(':');
      if (colon_pos == std::string::npos)
        continue;

      std::string key_part = line.substr(0, colon_pos);
      std::string val_part = line.substr(colon_pos + 1);

      std::stringstream key_ss(key_part);
      std::string name;
      int min_val, max_val;
      if (key_ss >> name >> min_val >> max_val) {
        std::vector<int> elements;
        std::stringstream val_ss(val_part);
        int val;
        while (val_ss >> val) {
          elements.push_back(val);
        }
        pools[name] = {{min_val, max_val}, elements};
      }
    }
    infile.close();
  }

  // Retrieve or initialize the specific pool for this game variant
  auto &pool_info = pools[game_name];
  pool_info.first = {min, max};
  auto &pool = pool_info.second;

  if (pool.empty()) {
    for (int i = min; i <= max; ++i) {
      pool.push_back(i);
    }
  }

  thread_local std::random_device rd;
  thread_local std::mt19937 gen(rd());
  std::uniform_int_distribution<> distr(0, pool.size() - 1);
  int randomIndex = distr(gen);

  int selectedNumber = pool[randomIndex];

  // Swap-and-Pop (numbpool2 logic)
  pool[randomIndex] = pool.back();
  pool.pop_back();

  // Save all pools atomically: write to temp file first, then rename
  std::string temp_filepath = filepath + ".tmp";
  std::ofstream outfile(temp_filepath);
  if (outfile.is_open()) {
    for (const auto &pair : pools) {
      outfile << pair.first << " " << pair.second.first.first << " "
              << pair.second.first.second << " :";
      for (int val : pair.second.second) {
        outfile << " " << val;
      }
      outfile << "\n";
    }
    outfile.close();
    std::rename(temp_filepath.c_str(), filepath.c_str());
  }

  return selectedNumber;
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
  bool check_king = false;
  bool check_queens = false;
};

// ==========================================
// FIXED CONFIGURATIONS
// ==========================================

// Sudoku Easy: 9x9 puzzle. Total clues = 45, max per row/col/grid = 5
const PuzzleConfig SUDOKU_EASY_CONFIG = {45,    5,     5, 5,     9,
                                         false, false, 9, false, false};

// Sudoku 9: 9x9 puzzle. Total clues = 40, max per row/col/grid = 5
const PuzzleConfig SUDOKU_9_CONFIG = {40,    5,     5, 5,     9,
                                      false, false, 9, false, false};

// Sudoku Medium: 9x9 puzzle. Total clues = 36, max per row/col/grid = 5
const PuzzleConfig SUDOKU_MEDIUM_CONFIG = {36,    5,     5, 5,     9,
                                           false, false, 9, false, false};

// Sudoku Hard: 9x9 puzzle. Total clues = 27, max per row/col/grid = 4
const PuzzleConfig SUDOKU_HARD_CONFIG = {27,    4,     4, 4,     9,
                                         false, false, 9, false, false};

// Sudoku A: 9x9 puzzle. Total clues = 18, max per row/col/grid = 4
const PuzzleConfig SUDOKU_A_CONFIG = {18,    4,     4, 4,     9,
                                      false, false, 9, false, false};

inline const PuzzleConfig &getSudokuEasyConfig() { return SUDOKU_EASY_CONFIG; }
inline const PuzzleConfig &getSudoku9Config() { return SUDOKU_9_CONFIG; }
inline const PuzzleConfig &getSudokuMediumConfig() { return SUDOKU_MEDIUM_CONFIG; }
inline const PuzzleConfig &getSudokuHardConfig() { return SUDOKU_HARD_CONFIG; }
inline const PuzzleConfig &getSudokuAConfig() { return SUDOKU_A_CONFIG; }

// Crossdoku: 9x9 puzzle with bishop-diagonal + 3x3 box constraints. Total clues = 40, max per row/col/grid = 5
const PuzzleConfig CROSSDOKU_CONFIG = {40,    5,     5, 5,     9,
                                       false, false, 9, false, false};

// Sudoku Centroid: 9x9 puzzle. Total clues = 30-38 (dynamic), max per row/col/grid = 5.
// Clues are never placed in the center cell of each 3x3 subgrid.
inline const PuzzleConfig &getSudokuCentroidConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudoku_centroid", 30, 38),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define SUDOKU_CENTROID_CONFIG getSudokuCentroidConfig()

// Twodoku 6 Jigsaw: Overlapping 6x6 jigsaw grids. Total clues = 18-28, max per row/col/group = 3
inline const PuzzleConfig &getTwodoku6JigsawConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku6_jigsaw", 18, 28),
                   3,
                   3,
                   3,
                   6,
                   false,
                   false,
                   6,
                   false,
                   false};
  return config;
}
#define TWODOKU6_JIGSAW_CONFIG getTwodoku6JigsawConfig()

// Twodoku 8 Jigsaw: Overlapping 8x8 jigsaw grids. Total clues = 54-62, max per row/col/group = 4
inline const PuzzleConfig &getTwodoku8JigsawConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku8_jigsaw", 54, 62),
                   4,
                   4,
                   4,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define TWODOKU8_JIGSAW_CONFIG getTwodoku8JigsawConfig()

// Twodoku 9 Jigsaw: Overlapping 9x9 jigsaw grids. Total clues = 72-81, max per row/col/group = 5
inline const PuzzleConfig &getTwodoku9JigsawConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku9_jigsaw", 72, 81),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define TWODOKU9_JIGSAW_CONFIG getTwodoku9JigsawConfig()

// Killer Sudoku: 9x9 puzzle with cages of size 2..6.
// Total clues = 16-24 (dynamic), max per row/col/grid = 5
inline const PuzzleConfig &getKillerSudokuConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("killer_sudoku", 16, 24),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define KILLER_SUDOKU_CONFIG getKillerSudokuConfig()

// ==========================================
// DYNAMIC CONFIGURATIONS (Macro Definitions)
// ==========================================

// Sudoku Mini: 6x6 puzzle.
inline const PuzzleConfig &getSudokuMiniConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudoku_mini", 10, 15),
                   3,
                   3,
                   3,
                   6,
                   false,
                   false,
                   6,
                   false,
                   false};
  return config;
}
#define SUDOKU_MINI_CONFIG getSudokuMiniConfig()

// Sudoku X: 9x9 puzzle.
inline const PuzzleConfig &getSudokuXConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudoku_x", 27, 40),
                   5,
                   5,
                   5,
                   5,
                   true,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define SUDOKU_X_CONFIG getSudokuXConfig()

// Windoku: 9x9 puzzle.
inline const PuzzleConfig &getWindokuConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku", 27, 40),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   5,
                   true,
                   false};
  return config;
}
#define WINDOKU_CONFIG getWindokuConfig()

// Windoku X: 9x9 puzzle.
inline const PuzzleConfig &getWindokuXConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku_x", 27, 36),
                   4,
                   4,
                   4,
                   4,
                   true,
                   false,
                   4,
                   true,
                   false};
  return config;
}
#define WINDOKU_X_CONFIG getWindokuXConfig()

// Jigsaw 8: 8x8 puzzle.
inline const PuzzleConfig &getJigsaw8Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("jigsaw_8", 21, 32),
                   5,
                   5,
                   5,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define JIGSAW_8_CONFIG getJigsaw8Config()

// Jigsaw 9: 9x9 puzzle.
inline const PuzzleConfig &getJigsaw9Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("jigsaw_9", 27, 36),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define JIGSAW_9_CONFIG getJigsaw9Config()

// Jigsaw X: 9x9 puzzle.
inline const PuzzleConfig &getJigsawXConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("jigsaw_x", 27, 36),
                   5,
                   5,
                   5,
                   5,
                   true,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define JIGSAW_X_CONFIG getJigsawXConfig()

// Windoku Jigsaw: 9x9 puzzle.
inline const PuzzleConfig &getWindokuJigsawConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku_jigsaw", 27, 36),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   5,
                   true,
                   false};
  return config;
}
#define WINDOKU_JIGSAW_CONFIG getWindokuJigsawConfig()

// Sudoku 12: 12x12 puzzle.
inline const PuzzleConfig &getSudoku12Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudoku_12", 48, 72),
                   7,
                   7,
                   7,
                   12,
                   false,
                   false,
                   12,
                   false,
                   false};
  return config;
}
#define SUDOKU_12_CONFIG getSudoku12Config()

// Dozaku: 12x12 with 3x4 and 4x3 grids.
inline const PuzzleConfig &getDozakuConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("dozaku", 48, 72),
                   7,
                   7,
                   7,
                   12,
                   false,
                   false,
                   12,
                   false,
                   false};
  return config;
}
#define DOZAKU_CONFIG getDozakuConfig()

// Twodoku Mini: Overlapping 6x6 grids.
inline const PuzzleConfig &getTwodokuMiniConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku_mini", 18, 30),
                   3,
                   3,
                   3,
                   6,
                   false,
                   false,
                   6,
                   false,
                   false};
  return config;
}
#define TWODOKU_MINI_CONFIG getTwodokuMiniConfig()

// Twodoku 8: Overlapping 8x8 grids.
inline const PuzzleConfig &getTwodoku8Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku_8", 41, 56),
                   5,
                   5,
                   5,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define TWODOKU_8_CONFIG getTwodoku8Config()

// Twodoku 9: Overlapping 9x9 grids.
inline const PuzzleConfig &getTwodoku9Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku_9", 62, 81),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define TWODOKU_9_CONFIG getTwodoku9Config()

// Twodoku 84: 8x8 grids with 2x2 overlap.
inline const PuzzleConfig &getTwodoku84Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku84", 54, 62),
                   5,
                   5,
                   5,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define TWODOKU_84_CONFIG getTwodoku84Config()

// Twodoku 86: 8x8 and 6x6 hybrid grids with 2x2 overlap.
inline const PuzzleConfig &getTwodoku86Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku86", 40, 48),
                   5,
                   5,
                   5,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define TWODOKU_86_CONFIG getTwodoku86Config()

// Twodoku 89: 8x8 grids with 3x3 overlap.
inline const PuzzleConfig &getTwodoku89Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku89", 52, 60),
                   5,
                   5,
                   5,
                   8,
                   false,
                   false,
                   8,
                   false,
                   false};
  return config;
}
#define TWODOKU_89_CONFIG getTwodoku89Config()

// Twodoku 98: 9x9 and 8x8 hybrid grids with 2x2 overlap.
inline const PuzzleConfig &getTwodoku98Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("twodoku98", 61, 70),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define TWODOKU_98_CONFIG getTwodoku98Config()

// SudoX King: 9x9 puzzle.
inline const PuzzleConfig &getSudoXKingConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudox_king", 28, 40),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false,
                   true,
                   false};
  return config;
}
#define SUDOX_KING_CONFIG getSudoXKingConfig()

// SudoX Queen: 9x9 puzzle.
inline const PuzzleConfig &getSudoXQueenConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudox_queen", 28, 40),
                   5,
                   5,
                   5,
                   5,
                   true,
                   false,
                   9,
                   false,
                   false,
                   false,
                   true};
  return config;
}
#define SUDOX_QUEEN_CONFIG getSudoXQueenConfig()

// SudoX Royal: 9x9 puzzle. Total clues = 28-38, max per row/col/subgrid = 5.
inline const PuzzleConfig &getSudoXRoyalConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudox_royal", 28, 38),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false,
                   true,
                   true};
  return config;
}
#define SUDOX_ROYAL_CONFIG getSudoXRoyalConfig()

// Jigsaw Mini: 6x6 puzzle.
inline const PuzzleConfig &getJigsawMiniConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("jigsaw_mini", 10, 15),
                   3,
                   3,
                   3,
                   6,
                   false,
                   false,
                   6,
                   false,
                   false};
  return config;
}
#define JIGSAW_MINI_CONFIG getJigsawMiniConfig()

// Windoku 6: 9x9 puzzle with four 6-cell windows (2x3 and 3x2).
// Total clues = 32-40, max per row/col/grid = 5, max per window = 3
inline const PuzzleConfig &getWindoku6Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku6", 32, 40),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   3,
                   true,
                   false};
  return config;
}
#define WINDOKU6_CONFIG getWindoku6Config()

// Windoku 8: 9x9 puzzle with four 8-cell pinwheel windows (2x4 and 4x2).
// Total clues = 32-40, max per row/col/grid = 5, max per window = 4
inline const PuzzleConfig &getWindoku8Config() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku8", 32, 40),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   4,
                   true,
                   false};
  return config;
}
#define WINDOKU8_CONFIG getWindoku8Config()

// Windoku Mixed: 9x9 puzzle with four mixed windows (4x2, 2x4, 3x3, 2x3).
// Total clues = 32-40, max per row/col/grid = 5, default window max = 4
inline const PuzzleConfig &getWindokuMixedConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("windoku_mixed", 32, 40),
                   5,
                   5,
                   5,
                   9,
                   false,
                   false,
                   4,
                   true,
                   false};
  return config;
}
#define WINDOKU_MIXED_CONFIG getWindokuMixedConfig()

#endif
