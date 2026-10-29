#include <iostream>
#include <vector>
#include <numeric>
#include <random>
#include <algorithm>
#include <queue>

using namespace std;

const int N = 10;

// 8 directions (flag exclusion bubble - no touching, even diagonally)
const int dr8[] = {-1, -1, -1,  0, 0,  1, 1, 1};
const int dc8[] = {-1,  0,  1, -1, 1, -1, 0, 1};

// 4 orthogonal directions (for contiguous region growth)
const int dr4[] = {-1, 1, 0, 0};
const int dc4[] = {0, 0, -1, 1};

// Checks if placing a flag at (row, col) is safe (1 per col + no 8-adjacency)
bool isFlagSafe(const vector<vector<int>>& board, int row, int col) {
    for (int r = 0; r < row; r++) {
        if (board[r][col] == 1) return false;
    }
    for (int i = 0; i < 8; i++) {
        int nr = row + dr8[i];
        int nc = col + dc8[i];
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            if (board[nr][nc] == 1) return false;
        }
    }
    return true;
}

// Backtracking solver to place 10 non-touching flags (1 per row and col)
bool placeFlags(vector<vector<int>>& board, int row, mt19937& rng) {
    if (row == N) return true;

    vector<int> cols(N);
    iota(cols.begin(), cols.end(), 0);
    shuffle(cols.begin(), cols.end(), rng);

    for (int col : cols) {
        if (isFlagSafe(board, row, col)) {
            board[row][col] = 1;
            if (placeFlags(board, row + 1, rng)) {
                return true;
            }
            board[row][col] = 0;
        }
    }
    return false;
}

// Generates 10 contiguous irregular zones anchored around each flag position
vector<vector<int>> buildIrregularZones(const vector<vector<int>>& board, mt19937& rng) {
    vector<vector<int>> regions(N, vector<int>(N, -1));
    queue<pair<int, int>> q;

    int regionId = 0;
    for (int r = 0; r < N; r++) {
        for (int c = 0; c < N; c++) {
            if (board[r][c] == 1) {
                regions[r][c] = regionId++;
                q.push({r, c});
            }
        }
    }

    while (!q.empty()) {
        pair<int, int> curr = q.front();
        int r = curr.first;
        int c = curr.second;
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
            cout << 0; // Empty grid for player to place Flags
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

    // Place 10 non-touching flags (instantaneous execution)
    if (!placeFlags(board, 0, rng)) {
        cerr << "Failed to place flags.\n";
        return 1;
    }

    // Build 10 irregular contiguous regions around flag anchors
    vector<vector<int>> regions = buildIrregularZones(board, rng);

    printJSON(regions, board);

    return 0;
}
