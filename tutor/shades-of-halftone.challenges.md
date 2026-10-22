# shades-of-halftone — challenges
Challenge: shades-of-halftone — a print-style halftone of the video, built by following Maxime Heckel's "Shades of Halftone": dot grid → tone-sized dots → rotated CMYK screens → dots that break the grid and merge → bonus ink on paper
Continues: metaball-halftone (cancelled before Step 1; this syllabus replaces it)
Environment: WebGL 1 / GLSL ES 1.00 — new file `shaders/halftone.frag` (rename the empty `metaball_halftone.frag`), wired through `webgl.js`. The video arrives as the `u_smile` texture.
Reference: https://blog.maximeheckel.com/posts/shades-of-halftone/ (tutor notes + article code: tutor/reference/shades-of-halftone.notes.md — tutor's spoiler key)

WebGL 1 notes (the article uses WebGL 2 / three.js):
- `texture2D`, not `texture`.
- `fwidth` needs the standard-derivatives extension, turned on in the shader **and** in JS.
- Loop bounds must be compile-time constants.

## 1. A grid of dots, measured in pixels
- Motivation: Every halftone is built on a **grid of cells** (equal squares tiling the screen), with one dot per cell. Measuring cells in **pixels** makes them square for free — no aspect fix needed.
- Challenge: Turn the pixel position into cell coordinates using a `u_pixelSize` uniform (cell width in pixels). Use **`fract`** (keeps only the part after the decimal point → position inside the cell, 0 to 1) to get each pixel's place in its cell. Draw a hard dot of fixed radius at the middle of every cell.
- Outcome: Identical round dots in a square grid. They stay round at any window shape. A bigger `u_pixelSize` gives fewer, bigger cells.

## 2. One colour per cell (pixelate)
- Motivation: The dots carry no picture yet. To show the video, each cell needs **one** colour, read once for the whole cell.
- Challenge: Use `floor` to find which cell the pixel is in. Sample the video at that cell's centre. Show that flat colour over the whole cell (no dot yet).
- Outcome: The video, pixelated into blocks, each block exactly one cell.

## 3. Brightness sets the dot size
- Motivation: Flat blocks look like pixels, not print. Halftone fakes shades with dot size: one ink, many sizes.
- Challenge: Turn the cell's colour into **luma** (perceived brightness, a weighted sum of red, green, blue — green counts most). Map luma to the dot radius with a `u_radius` uniform. Draw the dot in the cell's colour on black.
- Outcome: The video built from dots: bright areas big dots, dark areas small dots.

## 4. Crisp edges at any size
- Motivation: A hard cut gives jagged stair-step edges. A soft band of a fixed width looks blurry when cells are big and jagged when small.
- Challenge: Use **`fwidth`** (how much a value changes from one pixel to its neighbour — a built-in, screen-space measure) to size the soft edge to about one pixel. Turn on the extension it needs.
- Outcome: Smooth, sharp edges on every dot, at every `u_pixelSize`.

## 5. Stagger the rows
- Motivation: Square rows leave big white gaps. Shifting every other row packs dots tighter.
- Challenge: Shift odd rows by half a cell, before finding the cell and its sample point.
- Outcome: A honeycomb-like pattern. Each dot still shows its own cell's colour.

## 6. Not just dots: rings
- Motivation: The dot is just one shape test. Combining two tests makes new shapes.
- Challenge: Draw a ring: inside an outer circle but outside an inner circle. Ring size still follows luma. Use a `u_shape` toggle to switch dot ↔ ring.
- Outcome: A "terminal screen" look made of hollow rings.

## 7. Turn the grid, and meet moiré
- Motivation: Printers tilt each ink's grid to a different angle. Staggering only fakes one angle. A **rotation** turns the grid by any angle.
- Challenge: Rotate the pixel position by `u_angle` before finding the cell. Rotate the cell centre **back** before sampling the video. Then overlay a second grid at a slightly different angle to see **moiré** (big wavy stripes that appear when two similar grids overlap).
- Outcome: A tilted dot grid that still shows the right picture, plus a moiré demo you can explain.

## 8. Ink on white paper: dot area = darkness
- Motivation: Print is **subtractive**: paper starts white and ink takes light away. So darkness, not brightness, should grow the dot. Also, the eye reads the dot's **area**, not its radius.
- Challenge: Switch to dark ink on white paper. Use **coverage** (how much ink this cell needs, 0 to 1) from darkness. Set the radius from the square root of coverage, scaled by `u_dotSize`. Rotate to 45°.
- Outcome: A black-and-white newspaper print. Mid-greys look correctly mid-grey.

## 9. Split colour into four inks (CMYK)
- Motivation: One ink gives only greys. Printers use four inks: **CMYK** = cyan, magenta, yellow and **K**ey (black).
- Challenge: Convert the cell's colour to CMYK coverages. Give each ink its own grid at its own angle (C 15°, M 75°, Y 0°, K 45°). Add a `u_channel` switch to view one ink's dot layer at a time.
- Outcome: Four separate dot layers, each at its own angle, each matching its ink in the picture.

## 10. Print all four layers
- Motivation: Separate layers are not a picture. Inks stack: each one takes away its own part of the light.
- Challenge: Start from white paper. For each ink, multiply the colour so that ink's dot removes its light (cyan removes red, magenta removes green, yellow removes blue, black removes all). Add a strength uniform per ink.
- Outcome: A full-colour print with tiny rosette patterns and almost no moiré.

## 11. Break the cell walls
- Motivation: A dot bigger than half a cell gets cut flat at the cell edge. Each pixel only looks at its own cell.
- Challenge: Check the 3×3 **neighbourhood** (the pixel's cell plus the 8 around it) in each ink's rotated grid. Keep the strongest dot coverage found.
- Outcome: Big dots overlap their neighbours instead of being clipped. No straight cut edges.

## 12. Gooey dots
- Motivation: Overlapping dots just stack as circles. Real ink spreads and joins.
- Challenge: Work with each dot's **signed distance** (distance to its edge: negative inside, positive outside). Combine the neighbours with a **smooth minimum** (like taking the smallest, but blended where two values are close). Add a `u_goo` uniform for the blend width.
- Outcome: Dots that pull into each other with liquid necks in dark areas.

## 13. Displaced dots
- Motivation: The grid is rigid. Moving the cell centres before drawing brings it to life.
- Challenge: Push each cell centre away based on the mouse: closer cells move more. Give each cell a small random sideways nudge. Widen the neighbourhood so moved dots aren't clipped.
- Outcome: Dots swoop away from the cursor and settle back.

## 14. Bonus: ink on paper
- Motivation: The render is a perfect vector shape. A real print has wobbly edges, ink grain and paper texture.
- Challenge: Add a `u_paper` colour. Wobble each dot's edge distance by a few pixels of **noise** (smooth random values) with `u_rough`. Knock pinholes and mottling out of the ink with `u_grain`. Add a faint horizontal fibre to the paper with `u_paperTex`. Size all texture in screen pixels, not cells.
- Outcome: Something that reads as ink pressed into real paper.
