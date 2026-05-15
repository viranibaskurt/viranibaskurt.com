#ifdef GL_ES
precision mediump float;
#endif

//https://www.grid-type.com/
//https://www.4rknova.com/blog/2025/09/21/blob-3d

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

#define CI vec3(.3,.5,.6)
#define CO vec3(.2)
#define CM vec3(.0)
#define CE vec3(.8,.7,.5)

const int NUM_LETTERS = 6;
const int GRID_SIZE_X=3;
const int GRID_SIZE_Y=3;
const int GAP_SIZE=1;

float circle(vec2 uv,vec2 c,float r)
{
    return 1.0-step(r,distance(uv,c));
}

float metaball(vec2 p, float r) {
    return r / max(dot(p, p), 0.000001);
}

// Returns 1.0 if the cell is ON, 0.0 if OFF
// Edit the grid comments to change each letter shape:
// col:  0 1 2
float getCell(int letter, int row, int col) {
    // V:  1 0 1
    //     1 0 1
    //     0 1 0
    if (letter == 0) {
        if (row == 0 && (col == 0 || col == 2)) return 1.0;
        if (row == 1 && (col == 0 || col == 2)) return 1.0;
        if (row == 2 &&  col == 1)              return 1.0;
        return 0.0;
    }
    // i:  0 1 0
    //     0 1 0
    //     0 1 0
    if (letter == 1 || letter == 5) {
        if (col == 1) return 1.0;
        return 0.0;
    }
    // r:  0 1 1
    //     0 1 0
    //     0 1 0
    if (letter == 2) {
        if (col == 1) return 1.0;
        if (row == 0 && col == 2) return 1.0;
        return 0.0;
    }
    // a:  0 1 1
    //     1 0 1
    //     0 1 1
    if (letter == 3) {
        if (row == 0 && (col == 1 || col == 2)) return 1.0;
        if (row == 1 && (col == 0 || col == 2)) return 1.0;
        if (row == 2 && (col == 1 || col == 2)) return 1.0;
        return 0.0;
    }
    // n:  1 1 1
    //     1 0 1
    //     1 0 1
    if (letter == 4) {
        if (row == 0) return 1.0;
        if (col == 0 || col == 2) return 1.0;
        return 0.0;
    }

    return 0.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv -= 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    // Each cell is cellSize units wide/tall.
    // Each letter is 3 cols wide + 1 col gap = 4 cols per letter.
    // Total x span: 6 letters * 4 - 1 gap = 23 cols → center at col 11.
    const float cellSize = 0.06;
    float center=(float(NUM_LETTERS)*float(GRID_SIZE_X+GAP_SIZE) -1.0)  * 0.5;
    float energy = 0.0;
    for (int l = 0; l < NUM_LETTERS; l++) {
        for (int row = 0; row < GRID_SIZE_Y; row++) {
            for (int col = 0; col < GRID_SIZE_X; col++) {
                if (getCell(l, row, col) > 0.5) {
                    float cx = (float(l) * float(GRID_SIZE_X+GAP_SIZE) + float(col) - center) * cellSize;
                    float cy = (1.0 - float(row)) * cellSize;
                    energy += metaball(uv - vec2(cx, cy), 0.00006*fract(sin(u_time)));
                }
            }
        }
    }

    vec3 clr = vec3(step(0.1, energy)) * CE;
    gl_FragColor = vec4(clamp(clr, 0.0, 1.0), 1.0);
}