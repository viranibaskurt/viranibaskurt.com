#ifdef GL_ES
precision highp float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_smile;

const float COUNT_X  = 70.0;  // number of circles horizontally
const float COUNT_Y  = 40.0;  // number of circles vertically
const float FILL_MIN = 2.1;   // circle size in white areas (fraction of cell half-size)
const float FILL_MAX = 4.0;  // circle size in dark areas (fraction of cell half-size)

float circle(vec2 c, float r)
{
    return 1.0 - step(r, length(gl_FragCoord.xy - c));
}

float metaball2d(vec2 p, float r)
{
    return 1.0 / dot(p, p) * r;
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 cell = u_resolution / vec2(COUNT_X, COUNT_Y);
    float col = floor(gl_FragCoord.x / cell.x);
    float colOffset = mod(col, 2.0) * 0.5 * cell.y;
    vec2 cell_id = vec2(col, floor((gl_FragCoord.y - colOffset) / cell.y));
    float halfCell = min(cell.x, cell.y) * 0.5;

    float field = 0.0;
    for (int ix = -5; ix <= 5; ix++) {
        for (int iy = -5; iy <= 5; iy++) {
            vec2 nid = cell_id + vec2(ix, iy);
            float nColOffset = mod(nid.x, 2.0) * 0.5 * cell.y;
            vec2 center = vec2((nid.x + 0.5) * cell.x, (nid.y + 0.5) * cell.y + nColOffset);
            vec2 uv = vec2(center.x, u_resolution.y - center.y) / u_resolution;
            float brightness = dot(texture2D(u_smile, uv).rgb, vec3(0.6, 0.6, 0.7));
            float morph = 1.0 - brightness;
            float rnd = hash(nid);
            float sinScale = 1.0 + sin(u_time * (0.9 + rnd) + rnd * 6.2831) * 0.5 * morph;
            float radius = halfCell * mix(FILL_MAX, FILL_MIN, brightness) * sinScale;
            field += metaball2d(center - gl_FragCoord.xy, radius);
        }
    }

    float mask = smoothstep(0.95, 1.05, field);
    vec3 dotColor = vec3(0.2, 0.4, 0.8);
    vec3 bgColor  = vec3(1.0);
    gl_FragColor = vec4(mix(bgColor, dotColor, mask), 1.0);
}
