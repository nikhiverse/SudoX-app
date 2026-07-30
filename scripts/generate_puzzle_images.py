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

GAME_ALIASES = {}

# Theme definitions synchronized with PdfExportService.ts CSS Palette
# Modified for premium UI: distinctly lighter inner borders, darker outer borders, black text.
THEMES = {
    "light": {
        "background": "#fdfaf2",      
        "grid_line_thin": "#d6d3d1",  # Lighter for subtle inner borders
        "grid_line_thick": "#44403c", # Darker for clear subgrid separation
        "grid_line_outer": "#1c1917", # Near black for strong outer frame
        "cell_bg": "#ffffff",         
        "cell_alt": "#fef3c7",        
        "cell_accent": "#d97706",     
        "cell_accent_2": "#b45309",   
        "text_regular": "#000000",    # Enforced Black
        "text_highlight": "#000000",  # Enforced Black
        "correct_text": "#1d4ed8",    
        "wrong_text": "#be123c",      
        "brand_color": "#b45309",     
        "text_secondary": "#9c9084",  
        "text_muted": "#9c9084"
    },
    "dark": {
        "background": "#000000",
        "grid_line_thin": "#3a3a3c",
        "grid_line_thick": "#8a8a8e",
        "grid_line_outer": "#cccccc",
        "cell_bg": "#050505",
        "cell_alt": "#22190f",
        "cell_accent": "#f97316",
        "cell_accent_2": "#ea580c",
        "text_regular": "#ffffff",
        "text_highlight": "#ffffff",
        "correct_text": "#3b82f6",
        "wrong_text": "#fb7185",
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
    ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(ist) + timedelta(days=offset_days)
    return now.strftime("%Y-%m-%d")

def build_unique_id(game, date_str):
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
    if v == 0:
        return ''
    if v <= 9:
        return str(v)
    return chr(65 + v - 10)

def compile_and_run_cpp(game, workspace_path):
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
    try:
        # We add timeout=10 here
        output = subprocess.run(
            [bin_path], 
            capture_output=True, 
            text=True, 
            check=True, 
            timeout=10
        ).stdout
    except subprocess.TimeoutExpired:
        # If it takes more than 10 seconds, this catches the error and moves on
        raise ValueError(f"No JSON output. C++ engine timed out for {actual_game}.")
    
    import re
    clean_output = re.sub(r'\x1b\[[0-9;]*m', '', output)
    json_start = clean_output.find('{')
    if json_start == -1:
        raise ValueError(f"No JSON output from {game} binary.")
        
    return json.loads(clean_output[json_start:])

def query_database_puzzle(game, date_str):
    if not HAS_PYMONGO:
        return None
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        return None
        
    try:
        client = MongoClient(uri)
        db = client["sudox"]
        collection = db["daily_puzzles"]
        
        puzzle_doc = collection.find_one({"game": game, "date": date_str, "type": "puzzle"})
        if not puzzle_doc:
            return None
            
        puzzle_data = puzzle_doc["puzzleData"]
        solved_doc = collection.find_one({"game": game, "date": date_str, "type": "solution"})
        if solved_doc:
            puzzle_data["solution"] = solved_doc["solution"]
            
        return puzzle_data
    except Exception as e:
        print(f"⚠️ Error querying database: {e}")
        return None

def get_cell_borders(puzzle_data, r, c, game):
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

        if r == 0:
            borders["top"] = "thin" if (groups[size - 1][c] == gid) else "outer"
        else:
            borders["top"] = "thick" if is_diff_group(r - 1, c) else "thin"

        if r == size - 1:
            borders["bottom"] = "thin" if (groups[0][c] == gid) else "outer"
        else:
            borders["bottom"] = "thick" if is_diff_group(r + 1, c) else "thin"

        if c == 0:
            borders["left"] = "thin" if (groups[r][size - 1] == gid) else "outer"
        else:
            borders["left"] = "thick" if is_diff_group(r, c - 1) else "thin"

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

def render_puzzle_image(puzzle_data, game, output_path, theme="light", style="soft", solved=False, date_str=None):
    colors = THEMES[theme]
    img = Image.new("RGBA", (1200, 1200), color=colors["background"])
    draw = ImageDraw.Draw(img)
    
    game_display_name = GAME_NAMES.get(game, game.replace("_", " ").title())
    if solved:
        game_display_name += " (Solution)"
        
    puzz_id = build_unique_id(game, date_str or get_ist_date_string())
    
    # ── DYNAMIC GRID SIZING ──
    ptype = puzzle_data.get("type", "standard")
    
    if ptype == "twodoku":
        total_rows = puzzle_data["totalRows"]
        total_cols = puzzle_data["totalCols"]
    else:
        total_rows = puzzle_data["size"]
        total_cols = puzzle_data["size"]
        
    if total_cols <= 6:
        grid_size = 720  
    elif total_cols <= 9:
        grid_size = 960  
    else:
        grid_size = 1000 

    # ── BALANCED MARGINS & LAYOUT ──
    grid_w = grid_size
    grid_h = grid_size
    grid_left = (1200 - grid_w) // 2
    grid_top = (1200 - grid_h) // 2
    
    cell_w = grid_w / total_cols
    cell_h = grid_h / total_rows
    
    # ── HEADER TITLE ──
    header_text = f"{game_display_name} · {puzz_id}"
    font_title = get_font("text_serif", 36) 
    title_x = grid_left
    title_y = grid_top - 60 # Clean breathing room above grid
    draw.text((title_x, title_y), header_text, fill=colors["text_regular"], font=font_title)
    
    cells = []
    for r in range(total_rows):
        for c in range(total_cols):
            is_cell_active = True
            if ptype == "twodoku":
                is_cell_active = bool(puzzle_data["active"][r][c])
                
            if not is_cell_active:
                continue
                
            x1 = grid_left + c * cell_w
            y1 = grid_top + r * cell_h
            x2 = x1 + cell_w
            y2 = y1 + cell_h
            
            is_window = False
            if "windows" in puzzle_data:
                for wr, wc in puzzle_data["windows"]:
                    if wr <= r < wr + 3 and wc <= c < wc + 3:
                        is_window = True
                        break
            if ptype == "jigsaw" and "windows" in puzzle_data:
                for wr, wc in puzzle_data["windows"]:
                    if wr <= r < wr + 3 and wc <= c < wc + 3:
                        is_window = True
                        break
                        
            is_diagonal = False
            if puzzle_data.get("diagonals"):
                if ptype == "standard" or ptype == "jigsaw":
                    size = puzzle_data["size"]
                    is_diagonal = (r == c) or (r + c == size - 1)
            elif "X" in game or "x" in game:
                if ptype in ("standard", "jigsaw"):
                    size = puzzle_data["size"]
                    is_diagonal = (r == c) or (r + c == size - 1)
                    
            is_both = is_window and is_diagonal
            
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
            
            if is_both:
                bg_color = colors["cell_accent"]
            elif is_diagonal or is_window:
                bg_color = colors["cell_accent"]
            elif is_alt_block:
                bg_color = colors["cell_alt"] if style == "soft" else colors["cell_accent"]
            else:
                bg_color = colors["cell_bg"]
                
            borders = get_cell_borders(puzzle_data, r, c, game)
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
            
    # Draw Backgrounds
    for cell in cells:
        draw.rectangle([cell["x1"], cell["y1"], cell["x2"], cell["y2"]], fill=cell["bg_color"])
        
    # Draw Background Watermark
    font_wm = get_font("title_sans", 80)
    txt_img = Image.new("RGBA", (800, 200), (255, 255, 255, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((400, 100), "SudoX Daily", fill=(45, 42, 36, 30), font=font_wm, anchor="mm")
    txt_img_rotated = txt_img.rotate(45, expand=True, resample=Image.BICUBIC)
    
    grid_center_x = grid_left + (grid_w // 2)
    grid_center_y = grid_top + (grid_h // 2)
    paste_x = int(grid_center_x - txt_img_rotated.width // 2)
    paste_y = int(grid_center_y - txt_img_rotated.height // 2)
    
    img.alpha_composite(txt_img_rotated, (paste_x, paste_y))
    draw = ImageDraw.Draw(img)

    # ── DRAW BORDERS (DISTINCT HIERARCHY) ──
    # Thin: 1px, Thick (Subgrid): 3px, Outer: 8px
    for border_weight, width in [("thin", 1), ("thick", 6), ("outer", 6)]:
        
        # Apply specific colors to clearly distinguish border depths
        if border_weight == "thin":
            border_color = colors.get("grid_line_thin", "#FFFFF0")
        elif border_weight == "thick":
            border_color = colors.get("grid_line_thick", "#1c1917")
        else:
            border_color = colors.get("grid_line_outer", "#1c1917")
            
        for cell in cells:
            borders = cell["borders"]
            x1, y1, x2, y2 = cell["x1"], cell["y1"], cell["x2"], cell["y2"]
            
            if borders["top"] == border_weight:
                draw.line([(x1, y1), (x2, y1)], fill=border_color, width=width)
            if borders["bottom"] == border_weight:
                draw.line([(x1, y2), (x2, y2)], fill=border_color, width=width)
            if borders["left"] == border_weight:
                draw.line([(x1, y1), (x1, y2)], fill=border_color, width=width)
            if borders["right"] == border_weight:
                draw.line([(x2, y1), (x2, y2)], fill=border_color, width=width)

    # ── DRAW TYPOGRAPHY VALUES (BLACK NUMBERS) ──
    font_mono_bold = get_font("text_mono", int(cell_h * 0.55)) 
    font_sans_normal = get_font("text_sans", int(cell_h * 0.52)) 
    
    for cell in cells:
        x1, y1, x2, y2 = cell["x1"], cell["y1"], cell["x2"], cell["y2"]
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        
        val_str = ""
        is_clue = cell["clue_val"] > 0
        
        if solved:
            val_to_render = cell["sol_val"] if cell["sol_val"] > 0 else cell["clue_val"]
            val_str = display_val(val_to_render)
        else:
            if is_clue:
                val_str = display_val(cell["clue_val"])
                
        if val_str:
            if is_clue:
                # Force black text for clues regardless of highlight
                text_color = "#000000" if theme == "light" else colors["text_regular"]
                font = font_mono_bold
            else:
                if cell["is_highlighted"]:
                    text_color = "#000000" if theme == "light" else "#60a5fa"
                else:
                    text_color = colors["correct_text"]
                font = font_sans_normal
                
            draw.text((cx, cy), val_str, fill=text_color, font=font, anchor="mm")

    # ── FOOTER ──
# ── FOOTER ──
   # ── FOOTER ──
    font_watermark = get_font("title_sans", 22)
    footer_y1 = grid_top + grid_h + 40
    
    # 1. Split the text into two parts
    text_prefix = "Play at "
    text_url = "https://sudox-app.vercel.app/"
    
    # 2. Measure the widths of both parts
    width_prefix = draw.textlength(text_prefix, font=font_watermark)
    width_url = draw.textlength(text_url, font=font_watermark)
    total_width = width_prefix + width_url
    
    # 3. Calculate the starting X coordinate so the combined text stays centered at 600
    start_x = 600 - (total_width / 2)
    
    # 4. Draw "Play at " in the subtle secondary color
    # We use anchor="lm" (left-middle) now because we are drawing left-to-right
    draw.text((start_x, footer_y1), text_prefix, fill=colors["text_secondary"], font=font_watermark, anchor="lm")
    
    # 5. Draw the URL in the strong regular color right where the prefix ends
    url_x = start_x + width_prefix
    draw.text((url_x, footer_y1), text_url, fill=colors["text_regular"], font=font_watermark, anchor="lm")

    # ── COPYRIGHT LINE ──
    watermark_text2 = "© 2026 SudoX Daily"
    font_watermark2 = get_font("text_sans", 18)
    footer_y2 = footer_y1 + 30 
    draw.text((600, footer_y2), watermark_text2, fill=colors["text_secondary"], font=font_watermark2, anchor="mm")
    
    img.save(output_path, "PNG")
    print(f"📸 Image generated successfully: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="SudoX Social Media Image Generator")
    parser.add_argument("--game", choices=["all"] + VALID_GAMES, default="all", help="Game variant to generate")
    parser.add_argument("--theme", choices=["light", "dark"], default="light", help="Color theme (light or dark)")
    parser.add_argument("--style", choices=["soft", "website"], default="soft", help="Rendering style (soft pastel or website raw accent)")
    parser.add_argument("--solved", action="store_true", help="Generate solved puzzle images (solutions)")
    parser.add_argument("--date", help="Target date YYYY-MM-DD (defaults to today IST)")
    parser.add_argument("--out-dir", default="public/social", help="Output directory for generated PNGs")
    parser.add_argument("--daily", action="store_true", help="Fetch daily puzzles from DB instead of local engine generator")
    
    args = parser.parse_args()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_path = os.path.dirname(script_dir)
    
    load_env_local(workspace_path)
    date_str = args.date or get_ist_date_string()
    
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
        
        if args.daily:
            print(f"🔌 Querying database for {game} on {date_str}...")
            puzzle_data = query_database_puzzle(game, date_str)
            if not puzzle_data:
                print("❌ Puzzle not found in database daily collection.")
                
        if not puzzle_data:
            try:
                puzzle_data = compile_and_run_cpp(game, workspace_path)
            except Exception as e:
                print(f"❌ C++ compilation/execution failed for {game}: {e}")
                fail_count += 1
                continue
                
        try:
            puzz_id = build_unique_id(game, date_str)
            solved_suffix = "_sol" if args.solved else ""
            filename = f"{puzz_id}{solved_suffix}.png"
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