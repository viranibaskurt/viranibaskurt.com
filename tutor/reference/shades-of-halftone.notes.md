# Tutor notes — "Shades of Halftone" (Maxime Heckel)
Source: https://blog.maximeheckel.com/posts/shades-of-halftone/
Spoiler key for the tutor. Don't paste to the user unless they explicitly ask for code.
Article is WebGL 2 / three.js postprocessing. Adapt to WebGL 1: `texture2D`, `#extension GL_OES_standard_derivatives : enable` + `gl.getExtension('OES_standard_derivatives')` in JS.

Article sections: Behind the Dot Pattern → Rendering a grid of dots → Applying Halftone → Not just dots → Multichannel Halftoning and Interferences → Moiré Pattern → Digital vs Physical color blending → CMYK halftone → Breaking the Grid → Cell wall → Gooey halftone → Displaced dots.

## Grid + dot
    vec2 cellUv = fract(vUv * uGridSize);
    float dist = length(cellUv - 0.5);
    float circle = step(0.35, dist);
(Our syllabus uses pixel units instead: gridUV = fragCoord / pixelSize → square cells for free.)

## Pixelate
    vec2 normalizedPixelSize = pixelSize / resolution;
    vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
    vec4 color = texture(inputBuffer, uvPixel);
(Article samples the cell corner; sampling the centre (+0.5) is better. Our video needs the y-flip the user already knows.)

## Luma radius
    float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);
    float radius = uRadius * (0.1 + luma);

## Stagger
    float rowIndex = floor(uv.y / normalizedPixelSize.y);
    if (mod(rowIndex, 2.0) == 1.0) offsetUv.x += normalizedPixelSize.x * 0.5;

## Rings
    float radius = uRadius * (0.2 + luma);
    float innerRadius = radius - ringThickness;   // 0.1
    float outerCircle = smoothstep(radius - 0.01, radius + 0.01, dist);
    float innerCircle = smoothstep(innerRadius - 0.01, innerRadius + 0.01, dist);
    float ring = innerCircle * (1.0 - outerCircle);

## fwidth AA
    float edgeWidth = fwidth(dist);
    float circle = smoothstep(radius - edgeWidth, radius + edgeWidth, dist);

## Rotation
    mat2 rotate(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }
    vec2 toGridUV(vec2 uv, float angleDeg){ return rot(angleDeg) * (uv * resolution) / pixelSize; }
    vec2 getCellCenterUV(vec2 uv, float angleDeg){
      vec2 gridUV = toGridUV(uv, angleDeg);
      vec2 cellCenter = floor(gridUV) + 0.5;
      vec2 centerScreen = rot(-angleDeg) * cellCenter * pixelSize;
      return centerScreen / resolution;
    }
Trap: GLSL mat2 constructor is column-major. Rotate around canvas centre or corner — either works for the halftone; centre spins nicer.

## CMYK
    vec4 RGBtoCMYK(vec3 rgb){
      float k = min(1.0-rgb.r, min(1.0-rgb.g, 1.0-rgb.b));
      vec3 cmy = vec3(0.0); float invK = 1.0 - k;
      if (invK != 0.0) { cmy = (1.0 - rgb - k) / invK; }
      return clamp(vec4(cmy, k), 0.0, 1.0);
    }
    angles: C 15°, M 75°, Y 0°, K 45°
    float r = dotSize * sqrt(clamp(coverage, 0.0, 1.0));
    outColor = vec3(1.0);
    outColor.r *= (1.0 - CYAN_STRENGTH * dotC);
    outColor.g *= (1.0 - MAGENTA_STRENGTH * dotM);
    outColor.b *= (1.0 - YELLOW_STRENGTH * dotY);
    outColor *= (1.0 - BLACK_STRENGTH * dotK);
Sample per channel at that channel's rotated cell centre (not per pixel).

## Cell wall (3×3)
    vec2 baseCellIndex = floor(pixelCoord / uPixelSize);
    for dx,dy in -1..1:
      cellCenter = (baseCellIndex + vec2(dx,dy) + 0.5) * uPixelSize;
      dist = length(pixelCoord - cellCenter);
      circle = 1.0 - smoothstep(radius - aa, radius + aa, dist);
      keep max circle (+ its colour)
Radius is per neighbour: sample at each neighbour's centre.

## Gooey
Article gives no code. Standard polynomial smin on signed distances (dist - r):
    h = clamp(0.5 + 0.5*(b-a)/k, 0, 1); smin = mix(b, a, h) - k*h*(1-h)
Ink = 1 - smoothstep(-aa, aa, sminDist). Known limit (found in metaball-halftone): smin unions leave pinched "imploded square" gaps; a summed Gaussian field gives round holes — possible extension if the user dislikes the gaps.

## Displaced dots
Article uses a mouse-trail velocity texture (FBO), 4×4 kernel:
    vec2 brushVel = clamp(texture2D(brush, cellCenter/res).rg, -0.45, 0.45);
    float I = length(brushVel); vec2 fwd = I>0.001 ? brushVel/I : vec2(0);
    vec2 perp = vec2(-fwd.y, fwd.x); float side = sign(random(cellCenter)-0.5);
    float t = smoothstep(0.0, 0.5, I);
    cellCenter += (fwd*0.75 + perp*side*0.25) * mouseStrength * t;
Our syllabus simplifies to a u_mouse distance push first; a velocity trail is an optional extension.
