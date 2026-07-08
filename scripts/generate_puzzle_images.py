#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import argparse
from datetime import datetime, timedelta, timezone

# Optional MongoDB dependency
try:
    from pymongo import MongoClient
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

# PIL/Pillow for image rendering
from PIL import Image, ImageDraw, ImageFont

# Define Supported Game Variants
VALID_GAMES = [
    'sudoku_mini', 'sudoku_easy', 'sudoku9', 'sudoku_a', 'sudokuX', 'dozaku',
    'windoku', 'windokuX', 'windoku_jigsaw', 'jigsaw8', 'jigsaw9', 'jigsawX',
    'twodoku_mini', 'twodoku8', 'twodoku9', 'sudoku12'
]

GAME_NAMES = {
    'sudoku_mini': 'Sudoku Mini',
    'sudoku_easy': 'Sudoku Eazy',
    'sudoku9': 'Sudoku 9',
    'sudoku_a': 'Sudoku A',
    'sudokuX': 'Sudoku X',
    'dozaku': 'Dozaku',
    'windoku': 'Windoku',
    'windokuX': 'Windoku X',
    'windoku_jigsaw': 'Windoku Jigsaw',
    'jigsaw8': 'Jigsaw 8',
    'jigsaw9': 'Jigsaw 9',
    'jigsawX': 'Jigsaw X',
    'twodoku_mini': 'Twodoku Mini',
    'twodoku8': 'Twodoku 8',
    'twodoku9': 'Twodoku 9',
    'sudoku12': 'Sudoku 12'
}

GAME_CODES = {
    'sudoku_mini': '06',
    'sudoku_easy': '90',
    'sudoku9': '91',
    'sudoku_a': '92',
    'sudokuX': '93',
    'dozaku': '13',
    'windoku': '94',
    'windokuX': '95',
    'windoku_jigsaw': '11',
    'jigsaw8': '08',
    'jigsaw9': '09',
    'jigsawX': '10',
    'twodoku_mini': '07',
    'twodoku8': '14',
    'twodoku9': '15',
    'sudoku12': '12'
}

# Aliases: games that use another game's binary (must match constants.ts)
GAME_ALIASES = {
    # Currently none - add here if a variant reuses another's binary
}

# Theme definitions
THEMES = {
    "light": {
        "background": "#fef9f0",
        "grid_line_thin": "#d0c9bd",
        "grid_line_thick": "#2d2a24",
        "grid_line_outer": "#000000",
        "cell_bg": "#fffdf8",
        "cell_alt": "#f5e6cc",      # Soft sand for checkerboard
        "cell_accent": "#b45309",   # Rich amber for diagonals/windows
        "cell_accent_2": "#92400e", # Slightly darker amber for overlaps
        "text_regular": "#2d2a24",
        "text_highlight": "#fffdf8",
        "correct_text": "#1d4ed8",  # Steel blue for solutions
        "brand_color": "#b45309",
        "text_secondary": "#6b6456",
        "text_muted": "#9c9084"
    },
    "dark": {
        "background": "#000000",
        "grid_line_thin": "#3a3a3c",
        "grid_line_thick": "#cccccc",
        "grid_line_outer": "#cccccc",
        "cell_bg": "#050505",
        "cell_alt": "#22190f",      # Deep dark amber
        "cell_accent": "#f97316",   # Vibrant orange for diagonals/windows
        "cell_accent_2": "#ea580c", # Overlap orange
        "text_regular": "#ededed",
        "text_highlight": "#000000",
        "correct_text": "#3b82f6",  # Vibrant blue for solutions
        "brand_color": "#fb923c",
        "text_secondary": "#a1a1aa",
        "text_muted": "#52525b"
    }
}

# Font resolution helper
FONT_PATHS = {
    "title_serif": "/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf",
    "text_serif": "/usr/share/fonts/truetype/crosextra/Caladea-Regular.ttf",
    "title_sans": "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
    "text_sans": "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
    "text_mono": "/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf",
    "solution_serif_italic": "/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf"
}

def get_font(font_key, size):
    path = FONT_PATHS.get(font_key)
    if path and os.path.exists(path):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

def load_env_local(workspace_path):
    """Load MongoDB environment variable from .env.local if present."""
    env_path = os.path.join(workspace_path, ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key, val = parts[0].strip(), parts[1].strip()
                        val = val.strip("'\"")
                        os.environ[key] = val

def get_ist_date_string(offset_days=0):
    """Returns date string in India Standard Time (IST) YYYY-MM-DD."""
    ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(ist) + timedelta(days=offset_days)
    return now.strftime("%Y-%m-%d")

def format_display_date(date_str):
    """Format 'YYYY-MM-DD' into a friendly display format like 'July 7, 2026'."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%B %d, %Y")
    except Exception:
        return date_str

def build_unique_id(game, date_str):
    """Build the 8-digit unique ID: yymmddcc."""
    try:
        parts = date_str.split("-")
        yy = parts[0][-2:]
        mm = parts[1]
        dd = parts[2]
        cc = GAME_CODES.get(game, "00")
        return f"{yy}{mm}{dd}{cc}"
    except Exception:
        return "00000000"

def display_val(v):
    """Convert grid cell value to character."""
    if v == 0:
        return ''
    if v <= 9:
        return str(v)
    return chr(65 + v - 10)  # 10->A, 11->B, etc.

def compile_and_run_cpp(game, workspace_path):
    """Compile C++ source if missing and run it to get puzzle data."""
    actual_game = GAME_ALIASES.get(game, game)
    bin_dir = os.path.join(workspace_path, "engine", "bin")
    os.makedirs(bin_dir, exist_ok=True)
    bin_path = os.path.join(bin_dir, actual_game)
    src_path = os.path.join(workspace_path, "engine", "src", f"{actual_game}.cpp")
    include_dir = os.path.join(workspace_path, "engine", "include")
    
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"C++ source file not found: {src_path}")
        
    needs_compile = not os.path.exists(bin_path)
    if not needs_compile:
        src_time = os.path.getmtime(src_path)
        bin_time = os.path.getmtime(bin_path)
        needs_compile = src_time > bin_time
        
    if needs_compile:
        print(f"🛠️ Compiling generator engine: {actual_game}...")
        cmd = ["g++", "-O2", "-std=c++17", f"-I{include_dir}", "-o", bin_path, src_path]
        subprocess.run(cmd, check=True)
        
    print(f"🎲 Running generator engine: {actual_game}...")
    output = subprocess.run([bin_path], capture_output=True, text=True, check=True).stdout
    
    # Strip ANSI colors if any
    import re
    clean_output = re.sub(r'\x1b\[[0-9;]*m', '', output)
    json_start = clean_output.find('{')
    if json_start == -1:
        raise ValueError(f"No JSON output from {game} binary.")
        
    return json.loads(clean_output[json_start:])

def query_database_puzzle(game, date_str):
    """Query puzzle from MongoDB daily_puzzles collection."""
    if not HAS_PYMONGO:
        print("⚠️ pymongo is not installed. Database query skipped.")
        return None
        
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("⚠️ MONGODB_URI is not set in environment. Database query skipped.")
        return None
        
    try:
        client = MongoClient(uri)
        db = client["sudox"]
        collection = db["daily_puzzles"]
        
        # Pull puzzle doc
        puzzle_doc = collection.find_one({"game": game, "date": date_str, "type": "puzzle"})
        if not puzzle_doc:
            return None
            
        puzzle_data = puzzle_doc["puzzleData"]
        
        # Pull solution doc if it exists separately
        solved_doc = collection.find_one({"game": game, "date": date_str, "type": "solution"})
        if solved_doc:
            puzzle_data["solution"] = solved_doc["solution"]
            
        return puzzle_data
    except Exception as e:
        print(f"⚠️ Error querying database: {e}")
        return None

def get_cell_borders(puzzle_data, r, c, game):
    """Compute cell borders based on puzzle type and coordinates."""
    ptype = puzzle_data.get("type", "standard")
    borders = {"top": "thin", "bottom": "thin", "left": "thin", "right": "thin"}
    
    if ptype == "standard":
        size = puzzle_data["size"]
        sub_rows = puzzle_data["subRows"]
        sub_cols = puzzle_data["subCols"]
        
        if r % sub_rows == 0:
            borders["top"] = "outer" if r == 0 else "thick"
        if (r + 1) % sub_rows == 0 or r == size - 1:
            borders["bottom"] = "outer" if r == size - 1 else "thick"
        if c % sub_cols == 0:
            borders["left"] = "outer" if c == 0 else "thick"
        if (c + 1) % sub_cols == 0 or c == size - 1:
            borders["right"] = "outer" if c == size - 1 else "thick"
            
    elif ptype == "jigsaw":
        size = puzzle_data["size"]
        groups = puzzle_data["groups"]
        gid = groups[r][c]
        
        def is_diff_group(nr, nc):
            if nr < 0 or nr >= size or nc < 0 or nc >= size:
                return True
            return groups[nr][nc] != gid

        # Top border: wraps vertically if top row shares group with bottom row
        if r == 0:
            borders["top"] = "thin" if (groups[size - 1][c] == gid) else "outer"
        else:
            borders["top"] = "thick" if is_diff_group(r - 1, c) else "thin"

        # Bottom border: wraps vertically if bottom row shares group with top row
        if r == size - 1:
            borders["bottom"] = "thin" if (groups[0][c] == gid) else "outer"
        else:
            borders["bottom"] = "thick" if is_diff_group(r + 1, c) else "thin"

        # Left border: wraps horizontally if leftmost column shares group with rightmost column
        if c == 0:
            borders["left"] = "thin" if (groups[r][size - 1] == gid) else "outer"
        else:
            borders["left"] = "thick" if is_diff_group(r, c - 1) else "thin"

        # Right border: wraps horizontally if rightmost column shares group with leftmost column
        if c == size - 1:
            borders["right"] = "thin" if (groups[r][0] == gid) else "outer"
        else:
            borders["right"] = "thick" if is_diff_group(r, c + 1) else "thin"
        
    elif ptype == "twodoku":
        active = puzzle_data["active"]
        total_rows = puzzle_data["totalRows"]
        total_cols = puzzle_data["totalCols"]
        
        def is_active(nr, nc):
            if nr < 0 or nr >= total_rows or nc < 0 or nc >= total_cols:
                return False
            return bool(active[nr][nc])
            
        if not is_active(r - 1, c):
            borders["top"] = "outer"
        if not is_active(r + 1, c):
            borders["bottom"] = "outer"
        if not is_active(r, c - 1):
            borders["left"] = "outer"
        if not is_active(r, c + 1):
            borders["right"] = "outer"
            
        grids = puzzle_data.get("grids", [])
        for g in grids:
            gr, gc = g["r"], g["c"]
            gsize = g["size"]
            sub_r, sub_c = g.get("subR", 3), g.get("subC", 3)
            
            if gr <= r < gr + gsize and gc <= c < gc + gsize:
                if r > gr and (r - gr) % sub_r == 0:
                    borders["top"] = "thick"
                if r < gr + gsize - 1 and (r - gr + 1) % sub_r == 0:
                    borders["bottom"] = "thick"
                if c > gc and (c - gc) % sub_c == 0:
                    borders["left"] = "thick"
                if c < gc + gsize - 1 and (c - gc + 1) % sub_c == 0:
                    borders["right"] = "thick"
                    
        blocks = puzzle_data.get("blocks")
        if blocks:
            bid = blocks[r][c]
            if bid >= 0:
                def is_diff_block(nr, nc):
                    if not is_active(nr, nc):
                        return False
                    return blocks[nr][nc] != bid and blocks[nr][nc] >= 0
                    
                if is_diff_block(r - 1, c):
                    borders["top"] = "thick"
                if is_diff_block(r + 1, c):
                    borders["bottom"] = "thick"
                if is_diff_block(r, c - 1):
                    borders["left"] = "thick"
                if is_diff_block(r, c + 1):
                    borders["right"] = "thick"
                    
    return borders

def draw_logo_mark(draw, x, y, size, colors):
    """Draw a cute 3x3 grid logo mark next to the brand name."""
    cell_s = size / 3
    for r in range(3):
        for c in range(3):
            cx1 = x + c * cell_s
            cy1 = y + r * cell_s
            cx2 = cx1 + cell_s
            cy2 = cy1 + cell_s
            
            fill = colors["cell_accent"] if (r + c) % 2 == 1 else colors["cell_bg"]
            draw.rectangle([cx1, cy1, cx2, cy2], fill=fill, outline=colors["grid_line_thick"], width=1)

def render_puzzle_image(puzzle_data, game, output_path, theme="light", style="soft", solved=False, date_str=None):
    """Render a premium social-media JPEG image for the puzzle."""
    colors = THEMES[theme]
    
    # 1. Create base canvas
    img = Image.new("RGB", (1200, 1200), color=colors["background"])
    draw = ImageDraw.Draw(img)
    
    # 2. Draw SudoX Logo
    draw_logo_mark(draw, 80, 80, 36, colors)
    font_brand = get_font("title_serif", 38)
    draw.text((130, 72), "SudoX", fill=colors["brand_color"], font=font_brand)
    
    # 3. Draw Header Title and metadata
    game_display_name = GAME_NAMES.get(game, game.replace("_", " ").title())
    if solved:
        game_display_name += " (Solution)"
        
    font_title = get_font("title_serif", 46)
    draw.text((80, 140), game_display_name, fill=colors["text_regular"], font=font_title)
    
    # Date & Details
    date_display = format_display_date(date_str or get_ist_date_string())
    puzz_id = build_unique_id(game, date_str or get_ist_date_string())
    metadata_text = f"Daily Challenge  •  {date_display}  •  ID: #{puzz_id}"
    font_meta = get_font("text_sans", 20)
    draw.text((80, 205), metadata_text, fill=colors["text_secondary"], font=font_meta)
    
    # 4. Calculate grid dimensions and center it
    ptype = puzzle_data.get("type", "standard")
    
    if ptype == "twodoku":
        total_rows = puzzle_data["totalRows"]
        total_cols = puzzle_data["totalCols"]
    else:
        total_rows = puzzle_data["size"]
        total_cols = puzzle_data["size"]
        
    # Grid area: 720x720px centered at X=600, Y=695
    grid_size = 720
    if total_cols > 9:
        grid_size = 750
        
    grid_w = grid_size
    grid_h = grid_size
    grid_left = 600 - grid_w // 2
    grid_top = 680 - grid_h // 2
    
    cell_w = grid_w / total_cols
    cell_h = grid_h / total_rows
    
    # Pre-calculate cell details
    cells = []
    
    for r in range(total_rows):
        for c in range(total_cols):
            # Check if active
            is_cell_active = True
            if ptype == "twodoku":
                is_cell_active = bool(puzzle_data["active"][r][c])
                
            if not is_cell_active:
                continue
                
            x1 = grid_left + c * cell_w
            y1 = grid_top + r * cell_h
            x2 = x1 + cell_w
            y2 = y1 + cell_h
            
            # Compute cell flags
            is_window = False
            if "windows" in puzzle_data:
                for wr, wc in puzzle_data["windows"]:
                    if wr <= r < wr + 3 and wc <= c < wc + 3:
                        is_window = True
                        break
            
            # Jigsaw windows
            if ptype == "jigsaw" and "windows" in puzzle_data:
                for wr, wc in puzzle_data["windows"]:
                    if wr <= r < wr + 3 and wc <= c < wc + 3:
                        is_window = True
                        break
                        
            is_diagonal = False
            if puzzle_data.get("diagonals"):
                if ptype == "standard":
                    size = puzzle_data["size"]
                    is_diagonal = (r == c) or (r + c == size - 1)
                elif ptype == "jigsaw":
                    size = puzzle_data["size"]
                    is_diagonal = (r == c) or (r + c == size - 1)
            elif "X" in game or "x" in game:
                # Fallback check for engine names
                if ptype in ("standard", "jigsaw"):
                    size = puzzle_data["size"]
                    is_diagonal = (r == c) or (r + c == size - 1)
                    
            is_both = is_window and is_diagonal
            
            # Checkerboard blocks
            is_alt_block = False
            if ptype == "standard":
                if "altSubRows" in puzzle_data and "altSubCols" in puzzle_data:
                    asr = puzzle_data["altSubRows"]
                    asc = puzzle_data["altSubCols"]
                    is_alt_block = ((r // asr) + (c // asc)) % 2 == 0
                elif not puzzle_data.get("diagonals") and not puzzle_data.get("windows"):
                    sr = puzzle_data.get("subRows", 3)
                    sc = puzzle_data.get("subCols", 3)
                    is_alt_block = ((r // sr) + (c // sc)) % 2 == 1
            elif ptype == "twodoku":
                for gi, g in enumerate(puzzle_data.get("grids", [])):
                    gr, gc = g["r"], g["c"]
                    gsize = g["size"]
                    sub_r, sub_c = g.get("subR", 3), g.get("subC", 3)
                    if gr <= r < gr + gsize and gc <= c < gc + gsize:
                        bR = (r - gr) // sub_r
                        bC = (c - gc) // sub_c
                        parity = (1 if gi % 2 == 0 else 0) if game == "twodoku_mini" else 1
                        is_alt_block = ((bR + bC) % 2 == parity)
                        break
            
            # Select background color
            if is_both:
                bg_color = colors["cell_accent_2"]
            elif is_diagonal or is_window:
                bg_color = colors["cell_accent"]
            elif is_alt_block:
                bg_color = colors["cell_alt"] if style == "soft" else colors["cell_accent"]
            else:
                bg_color = colors["cell_bg"]
                
            borders = get_cell_borders(puzzle_data, r, c, game)
            
            # Retrieve value
            clue_val = puzzle_data["grid"][r][c]
            sol_val = puzzle_data.get("solution", [[]])[r][c] if "solution" in puzzle_data else 0
            
            cells.append({
                "r": r, "c": c,
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "bg_color": bg_color,
                "borders": borders,
                "clue_val": clue_val,
                "sol_val": sol_val,
                "is_highlighted": is_both or is_diagonal or is_window or (is_alt_block and style == "website")
            })
            
    # 5. Step 1: Draw cell backgrounds
    for cell in cells:
        draw.rectangle([cell["x1"], cell["y1"], cell["x2"], cell["y2"]], fill=cell["bg_color"])
        
    # 6. Step 2: Draw borders in layers (thin -> thick -> outer)
    # We define coordinate offsets slightly to align lines perfectly
    for border_weight, width, color_key in [("thin", 2, "grid_line_thin"), ("thick", 4, "grid_line_thick"), ("outer", 6, "grid_line_outer")]:
        border_color = colors[color_key]
        for cell in cells:
            borders = cell["borders"]
            x1, y1, x2, y2 = cell["x1"], cell["y1"], cell["x2"], cell["y2"]
            
            # Top
            if borders["top"] == border_weight:
                draw.line([(x1, y1), (x2, y1)], fill=border_color, width=width)
            # Bottom
            if borders["bottom"] == border_weight:
                draw.line([(x1, y2), (x2, y2)], fill=border_color, width=width)
            # Left
            if borders["left"] == border_weight:
                draw.line([(x1, y1), (x1, y2)], fill=border_color, width=width)
            # Right
            if borders["right"] == border_weight:
                draw.line([(x2, y1), (x2, y2)], fill=border_color, width=width)

    # 7. Step 3: Draw values (Clues and Solutions)
    font_mono_bold = get_font("text_mono", int(cell_h * 0.55))
    font_serif_italic = get_font("solution_serif_italic", int(cell_h * 0.52))
    
    for cell in cells:
        x1, y1, x2, y2 = cell["x1"], cell["y1"], cell["x2"], cell["y2"]
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        
        val_str = ""
        is_clue = cell["clue_val"] > 0
        
        if solved:
            # Render both clues and solved values
            val_to_render = cell["sol_val"] if cell["sol_val"] > 0 else cell["clue_val"]
            val_str = display_val(val_to_render)
        else:
            # Render clues only
            if is_clue:
                val_str = display_val(cell["clue_val"])
                
        if val_str:
            # Decide text color
            if is_clue:
                text_color = colors["text_highlight"] if cell["is_highlighted"] else colors["text_regular"]
                font = font_mono_bold
            else:
                # Solved value
                if cell["is_highlighted"]:
                    text_color = "#93c5fd" if theme == "light" else "#60a5fa"
                else:
                    text_color = colors["correct_text"]
                font = font_serif_italic
                
            # Draw centered text
            # Pillow 9+ anchors: "mm" places the text centered horizontally and vertically
            draw.text((cx, cy), val_str, fill=text_color, font=font, anchor="mm")

    # 8. Draw bottom brand footer
    watermark_text = "Play online at:  sudox.xyz"
    font_watermark = get_font("text_sans", 22)
    draw.text((600, 1115), watermark_text, fill=colors["text_secondary"], font=font_watermark, anchor="mm")
    
    # 9. Save image
    img.save(output_path, "JPEG", quality=95)
    print(f"📸 Image generated successfully: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="SudoX Social Media Image Generator")
    parser.add_argument("--game", choices=["all"] + VALID_GAMES, default="all", help="Game variant to generate")
    parser.add_argument("--theme", choices=["light", "dark"], default="light", help="Color theme (light or dark)")
    parser.add_argument("--style", choices=["soft", "website"], default="soft", help="Rendering style (soft pastel or website raw accent)")
    parser.add_argument("--solved", action="store_true", help="Generate solved puzzle images (solutions)")
    parser.add_argument("--date", help="Target date YYYY-MM-DD (defaults to today IST)")
    parser.add_argument("--out-dir", default="public/social", help="Output directory for generated JPEGs")
    parser.add_argument("--daily", action="store_true", help="Fetch daily puzzles from DB instead of local engine generator")
    
    args = parser.parse_args()
    
    # Resolve workspace paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_path = os.path.dirname(script_dir)
    
    load_env_local(workspace_path)
    
    # Determine date
    date_str = args.date or get_ist_date_string()
    
    # Determine output folder
    out_dir_path = os.path.join(workspace_path, args.out_dir)
    os.makedirs(out_dir_path, exist_ok=True)
    
    games_to_process = VALID_GAMES if args.game == "all" else [args.game]
    
    print(f"🚀 Starting social graphic generation (Theme: {args.theme}, Style: {args.style}, Solved: {args.solved})")
    print(f"📅 Target date: {date_str}")
    print(f"📁 Output folder: {out_dir_path}")
    print("-" * 60)
    
    success_count = 0
    fail_count = 0
    
    for game in games_to_process:
        print(f"\n👉 Processing variant: {game}")
        puzzle_data = None
        
        # 1. Try DB first if requested
        if args.daily:
            print(f"🔌 Querying database for {game} on {date_str}...")
            puzzle_data = query_database_puzzle(game, date_str)
            if not puzzle_data:
                print("❌ Puzzle not found in database daily collection.")
                
        # 2. Fallback to C++ generator
        if not puzzle_data:
            try:
                puzzle_data = compile_and_run_cpp(game, workspace_path)
            except Exception as e:
                print(f"❌ C++ compilation/execution failed for {game}: {e}")
                fail_count += 1
                continue
                
        # 3. Render image
        try:
            solved_suffix = "_solved" if args.solved else ""
            filename = f"{game}_{date_str}{solved_suffix}.jpg"
            output_filepath = os.path.join(out_dir_path, filename)
            
            render_puzzle_image(
                puzzle_data=puzzle_data,
                game=game,
                output_path=output_filepath,
                theme=args.theme,
                style=args.style,
                solved=args.solved,
                date_str=date_str
            )
            success_count += 1
        except Exception as e:
            print(f"❌ Rendering failed for {game}: {e}")
            import traceback
            traceback.print_exc()
            fail_count += 1
            
    print("\n" + "=" * 60)
    print(f"📊 Summary: {success_count} succeeded, {fail_count} failed.")
    print("=" * 60)
    
if __name__ == "__main__":
    main()
