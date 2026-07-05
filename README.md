# SudoX 🧩

SudoX is a modern, high-performance, and deeply customizable Sudoku platform. Powered by a lightning-fast C++ generation engine and a sleek Next.js (React) frontend, it offers a vast variety of unique puzzles that go far beyond classic Sudoku. 

With carefully crafted UI, responsive themes, daily puzzle persistence, and robust puzzle variations, SudoX is built for both casual players and hardcore Sudoku enthusiasts.

## 🌟 Features
- **Extensive Puzzle Variations**: 16 unique game types including Jigsaw, Windoku, Twodoku, and Dozaku.
- **High-Performance Generator**: Custom-built C++ engine ensures puzzles are generated efficiently and have unique solutions.
- **Beautiful & Responsive UI**: Clean design, responsive grid layouts, and full support for Light/Dark themes.
- **Daily Challenges**: Puzzles are generated dynamically based on the day.
- **Interactive Gameplay**: Highlight tracking, mistake feedback, intelligent cursors, and custom controls.

---

## 🎮 Game Variations

SudoX features 16 distinct variations of Sudoku across different grid sizes and logic paradigms:

### Classic & Grids
- **Sudoku Mini (6x6)**: A smaller, faster 6x6 grid. Perfect for beginners or quick sessions.
- **Sudoku Eazy (9x9)**: A relaxed, simpler variant of the classic 9x9 game.
- **Sudoku 9 (9x9)**: The traditional, classic 9x9 Sudoku experience.
- **Sudoku A (9x9)**: An advanced logic spin on the classic 9x9 formula.
- **Sudoku 12 (12x12)**: A massive 12x12 grid with 3x4 blocks for a longer, more challenging experience.
- **Dozaku (12x12)**: A unique and intricate 12x12 puzzle paradigm.

### X & Diagonal Logic
- **Sudoku X (9x9)**: Classic 9x9 rules, plus both main diagonals must contain digits 1-9.
- **Jigsaw X (9x9)**: Irregular blocks combined with the X-diagonal constraint.
- **Windoku X (9x9)**: The 4 extra hyper-blocks of Windoku combined with the X-diagonal constraint.

### Jigsaw (Irregular Shapes)
- **Jigsaw 8 (8x8)**: Instead of standard squares, blocks are drawn as irregular, interlocking 8-cell shapes.
- **Jigsaw 9 (9x9)**: The classic 9x9 grid divided into 9 irregular, non-square regions.
- **Windoku Jigsaw (9x9)**: A challenging combination of Windoku constraints and irregular Jigsaw blocks.

### Windoku (Hyper Sudoku)
- **Windoku (9x9)**: Classic rules, plus 4 extra interior 3x3 regions (windows) that must also contain digits 1-9.

### Twodoku (Overlapping Grids)
- **Twodoku Mini (Overlapping 6x6)**: Two 6x6 Sudoku grids overlapping each other sharing a quadrant.
- **Twodoku 8 (Overlapping 8x8)**: Two 8x8 grids fused together to create a multi-grid puzzle.
- **Twodoku 9 (Overlapping 9x9)**: The ultimate overlapping challenge featuring two interconnected 9x9 grids.

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play SudoX.

## 🛠 Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS for complex grid rendering
- **Puzzle Engine**: Custom C++ Binaries for instantaneous puzzle generation and constraints resolution
- **Persistence**: MongoDB (for daily puzzle storage) + LocalStorage (for user progress)
