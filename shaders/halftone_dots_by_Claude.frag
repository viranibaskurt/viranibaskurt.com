#ifdef GL_ES
precision highp float;
#endif

// Halftone metaball plate.
// A grid of dots whose radius is driven by a scalar field; neighbouring dots are
// joined with a smooth-min so that fat ones fuse into blobs with curved necks
// while thin ones stay as isolated screen dots.

uniform vec2  u_resolution;   // panel size in pixels
uniform vec2  u_origin;       // panel lower-left corner in pixels (quad view)
uniform float u_time;
uniform float u_seed;

// --- lattice ---
uniform float u_cells;        // dots across the short axis
uniform float u_hex;          // 0 = square lattice, 1 = staggered (hex) rows
uniform float u_jitter;       // random per-cell offset, in cell units

// --- dots ---
uniform float u_rMin;         // smallest radius, cell units (field = 0)
uniform float u_rMax;         // largest radius, cell units (field = 1)
uniform float u_merge;        // smooth-min radius -> neck thickness
uniform float u_soft;         // edge width in pixels

// --- field ---
uniform float u_scale;        // noise frequency
uniform float u_gain;         // contrast around 0.5
uniform float u_bias;         // overall lift
uniform float u_ramp;         // extra density towards the bottom
uniform float u_detail;       // octave falloff of the fbm
uniform float u_speed;        // drift speed

// --- print ---
uniform vec3  u_ink;
uniform vec3  u_paper;
uniform float u_grain;

#define NEIGHBOURS 1          // half-width of the cell window we test

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21) + u_seed);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float sum = 0.0;
    float norm = 0.0;
    float amp = 1.0;
    for (int i = 0; i < 4; ++i) {
        sum  += amp * vnoise(p);
        norm += amp;
        p = p * 2.03 + 7.1;
        amp *= u_detail;
    }
    return sum / norm;
}

// Polynomial smooth minimum: the fillet between two surfaces that come within k.
float smin(float a, float b, float k) {
    if (k < 0.0001) return min(a, b);
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// 0..1 ink coverage wanted at a point, p normalised so that y spans 0..1.
float density(vec2 p) {
    float f = fbm(p * u_scale + vec2(u_time * u_speed, 0.0));
    f = (f - 0.5) * u_gain + 0.5 + u_bias;
    f += (1.0 - p.y) * u_ramp;
    return clamp(f, 0.0, 1.0);
}

// Centre of a lattice cell, in cell units.
vec2 cellCentre(vec2 cell) {
    vec2 c = cell + 0.5;
    c.x += u_hex * 0.5 * mod(cell.y, 2.0);
    c += (vec2(hash21(cell + 3.7), hash21(cell + 9.1)) - 0.5) * u_jitter;
    return c;
}

void main() {
    vec2 uv  = (gl_FragCoord.xy - u_origin) / u_resolution;
    vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p   = uv * asp;          // square units, y in 0..1
    vec2 g   = p * u_cells;       // cell units
    vec2 cell0 = floor(g);

    float d = 1e9;
    for (int y = -NEIGHBOURS; y <= NEIGHBOURS; ++y) {
        for (int x = -NEIGHBOURS; x <= NEIGHBOURS; ++x) {
            vec2 cell = cell0 + vec2(float(x), float(y));
            vec2 c = cellCentre(cell);
            float r = mix(u_rMin, u_rMax, density(c / u_cells));
            // distance to this dot; empty cells are pushed out of range
            float di = length(g - c) - r + step(r, 0.002) * 1e3;
            d = smin(d, di, u_merge);
        }
    }

    float cellPx = u_resolution.y / u_cells;      // pixels per cell
    float aa = max(u_soft, 0.01) / cellPx;        // edge width in cell units
    float ink = 1.0 - smoothstep(-aa, aa, d);

    vec3 col = mix(u_paper, u_ink, ink);

    // paper tooth + ink mottle
    float fibre = hash21(gl_FragCoord.xy * 0.37) - 0.5;
    float blotch = fbm(uv * 9.0) - 0.5;
    col += (fibre * 0.75 + blotch * 0.45) * u_grain * mix(0.7, 1.5, ink);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
