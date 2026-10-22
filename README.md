# 🐱 3x3 Grid Path Builder (Tom and Jerry)

A browser-based puzzle game where you guide a cat 🐱 to catch a rat 🐀 by arranging arrow tiles on a grid. Built with plain HTML, CSS and JavaScript, with the board drawn on an HTML5 `<canvas>`. No frameworks, no build step.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 🎮 How to Play

1. Pick a level (the game starts on Level 2).
2. The grid is divided into **3x3 blocks**. Click any block to select it (it gets a red outline).
3. Use the buttons to rearrange the selected block:
   - **🔄 Rotate**: rotates every arrow in the block by 90°.
   - **↔️ Change Layout**: switches between the block's 3 possible arrow layouts. Cell positions never move, only the arrows change.
4. Build a connected route of arrows from the **cat** (left side) to the **rat** (right side).
5. Click **✅ Validate**. If the path is correct, the cat hops along the route and catches the rat!
6. Click **Next puzzle** in the popup to play a brand-new randomly generated puzzle.

GET A VIEW :
CATCH THE RAT : [https://pawan11kumar.github.io/catch-the-rat/]

### Tile types

| Tile | Meaning |
|------|---------|
| 🟨 Yellow cell with an arrow | Path slot. Sends the cat in the arrow's direction. |
| 🪷 Lily pad | Empty track cell. The cat keeps moving in its current direction. |
| 🌊 Pond (no tile) | Blocked. If the path reaches it, the path breaks. |

### Levels

| Level | Grid size | Blocks |
|-------|-----------|--------|
| 1 | 6x6 | 2x2 |
| 2 | 6x6 | 2x2 |
| 3 | 9x9 | 3x3 |
| 4 | 9x9 | 3x3 |

Every puzzle is randomly generated and always has at least one valid solution.

### Validation messages

- **Exited at the wrong row.** The path leaves the grid, but not at the rat's row.
- **The path left the grid.** The cat walked out of the board from the top, bottom or left.
- **Path breaks at row X, column Y.** The cat stepped onto a blocked (pond) cell.
- **The path loops forever.** The arrows send the cat in a circle.

### Buttons

- **↺ Reset Level**: restores the puzzle to its starting scramble. After a win, it generates a brand-new puzzle instead.

## 🧠 How It Works

- **Level generation:** a random left-to-right path is built from the cat's row to the rat's row, and each cell on it stores the arrow pointing to the next cell. A few extra lily pads are added, and the grid is split into 3x3 blocks.
- **Block scrambling:** each block gets 3 possible layouts (the solution plus 2 shuffled versions) and a random rotation, so the puzzle starts scrambled.
- **Validation:** the game follows the arrows from the cat's starting cell, tracking visited cells to detect loops, out-of-bounds moves and broken paths.
- **Animation:** on success, the cat hops from cell to cell using `requestAnimationFrame`, with a shadow, flip and tilt effect.

## 📁 Project Structure

```
├── index.html      # Page structure, buttons and the win popup
├── index.css       # Styling
├── index.js        # Game logic, level generation, drawing and animation
└── images/
    ├── background.svg
    ├── cat.webp
    ├── rat.webp
    └── pond.webp
```

> Make sure `background.svg`, `cat.webp`, `rat.webp` and `pond.webp` are placed inside an `images/` folder, because the code loads them from `images/`.

## 🚀 Getting Started

### Run locally

```bash
# Clone the repository
git clone https://github.com/MYNAMEPK11/<your-repo-name>.git
cd <your-repo-name>

# Open the game
# Option 1: double-click index.html
# Option 2: serve it locally
python -m http.server 8000
# then visit http://localhost:8000
```

### Host on GitHub Pages

1. Go to your repository **Settings → Pages**.
2. Under **Source**, choose the `main` branch and the `/ (root)` folder.
3. Save, and your game will be live at `https://MYNAMEPK11.github.io/<your-repo-name>/`.

## 🛠️ Customization

You can tweak the game at the top of `index.js`:

```js
const LEVEL_SIZES = [6, 6, 9, 9];   // grid size of each level (must be multiples of 3)
const CELL = 60;                    // cell size in pixels
const MARGIN = 76;                  // space around the grid for the cat and rat
```

## 🔮 Ideas for Future Improvements

- Move counter and timer
- Score and level progression
- Sound effects
- More levels and larger grids
- Touch-friendly controls for mobile

## 👤 Author

**Pawan Kumar Nayak**

- GitHub: [@MYNAMEPK11](https://github.com/MYNAMEPK11)
- LinkedIn: [akpawan71](https://linkedin.com/in/akpawan71)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
