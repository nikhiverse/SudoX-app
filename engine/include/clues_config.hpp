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

// Sudoku A: 9x9 puzzle.
inline const PuzzleConfig &getSudokuAConfig() {
  static const PuzzleConfig config =
      PuzzleConfig{getRandomClues("sudoku_a", 18, 27),
                   4,
                   4,
                   4,
                   9,
                   false,
                   false,
                   9,
                   false,
                   false};
  return config;
}
#define SUDOKU_A_CONFIG getSudokuAConfig()

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

#endif
