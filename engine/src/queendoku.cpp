#include <iostream>
#include <vector>
#include <numeric>
#include <random>
#include <algorithm>
#include <queue>
#include <iomanip>

using namespace std;

const int N = 10;

// 8 directions (queen personal bubble / exclusion zone)
const int dr8[] = {-1, -1, -1,  0, 0,  1, 1, 1};
const int dc8[] = {-1,  0,  1, -1, 1, -1, 0, 1};

// 4 orthogonal directions (for contiguous region growth)
const int dr4[] = {-1, 1, 0, 0};
const int dc4[] = {0, 0, -1, 1};

// ANSI terminal color codes to visually distinguish 10 regions
const string COLORS[10] = {
    "\033[41m\033[30m", // Red bg, black text
    "\033[42m\033[30m", // Green bg, black text
    "\033[43m\033[30m", // Yellow bg, black text
    "\033[44m\033[37m", // Blue bg, white text
    "\033[45m\033[37m", // Magenta bg, white text
    "\033[46m\033[30m", // Cyan bg, black text
    "\033[101m\033[30m",// Light Red bg, black text
    "\033[102m\033[30m",// Light Green bg, black text
    "\033[103m\033[30m",// Light Yellow bg, black text
    "\033[106m\033[30m" // Light Cyan bg, black text
};
const string RESET = "\033[0m";

// Checks if placing a queen at (row, col) is safe
bool isQueenSafe(const vector<vector<int>>& board, int row, int col) {
    // 1. Column check
    for (int r = 0; r < row; r++) {
        if (board[r][col] == 1) return false;
    }

    // 2. 8-neighborhood check (no touching, even diagonally)
    for (int i = 0; i < 8; i++) {
        int nr = row + dr8[i];
        int nc = col + dc8[i];
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            if (board[nr][nc] == 1) return false;
        }
    }

    return true;
}

// Backtracking solver to place 10 queens
bool placeQueens(vector<vector<int>>& board, int row, mt19937& rng) {
    if (row == N) return true;

    vector<int> cols(N);
    iota(cols.begin(), cols.end(), 0);
    shuffle(cols.begin(), cols.end(), rng);

    for (int col : cols) {
        if (isQueenSafe(board, row, col)) {
            board[row][col] = 1;
            if (placeQueens(board, row + 1, rng)) {
                return true;
            }
            board[row][col] = 0; // Backtrack
        }
    }
    return false;
}

// Generates 10 contiguous irregular zones anchored around each Queen
vector<vector<int>> buildIrregularZones(const vector<vector<int>>& board, mt19937& rng) {
    vector<vector<int>> regions(N, vector<int>(N, -1));
    queue<pair<int, int>> q;

    int regionId = 0;
    // Anchor each zone at each queen's position
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < N; c++) {
            if (board[r][c] == 1) {
                regions[r][c] = regionId++;
                q.push({r, c});
            }
        }
    }

    // Random multi-source flood fill expands outward until board is covered
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();

        vector<int> dirs = {0, 1, 2, 3};
        shuffle(dirs.begin(), dirs.end(), rng);

        for (int d : dirs) {
            int nr = r + dr4[d];
            int nc = c + dc4[d];
            if (nr >= 0 && nr < N && nc >= 0 && nc < N && regions[nr][nc] == -1) {
                regions[nr][nc] = regions[r][c];
                q.push({nr, nc});
            }
        }
    }

    return regions;
}

void printJSON(const vector<vector<int>>& regions, const vector<vector<int>>& solution) {
    cout << "{\"type\":\"jigsaw\",\"size\":" << N << ",\"grid\":[";
    for (int r = 0; r < N; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < N; c++) {
            if (c) cout << ",";
            cout << 0; // Empty grid for player to place Queens
        }
        cout << "]";
    }
    cout << "],\"groups\":[";
    for (int r = 0; r < N; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < N; c++) {
            if (c) cout << ",";
            cout << regions[r][c];
        }
        cout << "]";
    }
    cout << "],\"solution\":[";
    for (int r = 0; r < N; r++) {
        if (r) cout << ",";
        cout << "[";
        for (int c = 0; c < N; c++) {
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

    vector<vector<int>> board(N, vector<int>(N, 0));

    // Step 1: Place 10 non-touching Queens (1 per row & col)
    if (!placeQueens(board, 0, rng)) {
        cerr << "Failed to place queens.\n";
        return 1;
    }

    // Step 2: Flood-fill 10 irregular contiguous regions from the queen anchors
    vector<vector<int>> regions = buildIrregularZones(board, rng);

    printJSON(regions, board);

    return 0;
}