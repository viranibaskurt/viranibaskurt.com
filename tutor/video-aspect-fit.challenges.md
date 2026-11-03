# video-aspect-fit — challenges
Challenge: video-aspect-fit — show the video with its true shape (no stretch) under the halftone
Continues: shades-of-halftone
Environment: WebGL 1 / GLSL ES 1.00, plain JS in webgl.js
Reference: none (open goal; the picture is the ground truth)

Starting point:
- Video `IMG_0665_extracted.mp4` is **1080 × 1920** (tall, portrait).
- The shader turns the dot middle (real px) into 0–1 by dividing by the **canvas** size.
- Video coords 0–1 always span the whole video → the video takes the canvas shape.
- Wide window → figure about 3× too wide. "Fat".

## 1. Tell the shader the video's size
- Motivation: the shader only knows the canvas size. It can't fix a shape it doesn't know.
- Challenge: add a uniform for the video size in px. Fill it from JS. The video reports its size only after its header has loaded (0 before that).
- Outcome: a quick debug test proves the number arrives (e.g. tint the screen if the video is taller than wide). Remove the test after.

## 2. Compare the two shapes
- Motivation: two sizes are not yet a fix. We need one number: how much wider (or taller) the screen is than the video.
- Challenge: work out each **aspect ratio** (width ÷ height) for canvas and video. Combine them into one scale number.
- Outcome: with a 16:9 window and a 9:16 video they can say the number (~3.16) and what it means.

## 3. Fit the whole video (contain)
- Motivation: with the scale number, we can undo the stretch.
- Challenge: rescale the canvas 0–1 position around the centre (0.5), on one axis only. Place it in the right spot of the chain: turn back → real middle → 0–1 → rescale → flip y → video.
- Outcome: the figure has the right shape. The left and right edges show smeared stripes.

## 4. Empty outside the video
- Motivation: coords outside 0–1 clamp to the edge pixel → smeared stripes.
- Challenge: when the sample spot is outside 0–1, treat that dot as empty (black, no dot).
- Outcome: clean black bars beside the video.

## 5. Fill the screen (cover) + switch
- Motivation: contain wastes screen space. Sometimes we want the video to fill it and crop.
- Challenge: add the cover rule (scale the other axis). Make a toggle uniform + slider/button in the debug panel.
- Outcome: switch between bars (contain) and cropped full screen (cover). Shape is right in both.

## 6. Any window shape
- Motivation: the fix must hold when the window is tall (phone) or square, and on resize.
- Challenge: test narrow, square, and wide windows. Trace one number to confirm the rescale order vs the y-flip.
- Outcome: right shape in every window. They can explain why flip-before vs flip-after does or doesn't matter.
