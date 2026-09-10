#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_smile;

uniform ivec2 u_dotCount;
uniform float u_rMax;
uniform float u_rMin;
uniform float u_sumThresholdMin;
uniform float u_sumThresholdMax;
uniform vec3 u_saturation;
uniform vec3 u_backgroundColor;
uniform vec3 u_dotColor;

// const ivec2 DOT_COUNT = ivec2(100,60);
// const float R_MAX = 0.00005;
// const float R_MIN = 0.00002;

// const float SUM_THRESHOLD_MIN = 0.0;
// const float SUM_THRESHOLD_MAX = 3.0;
// const vec3 Saturation = vec3(.5);
const ivec2 NeighborEffect = ivec2(5);

float circle(vec2 uv,vec2 center, float r)
{
    return 1.0-step(r,length(uv-center));
}

float metaball2d(vec2 p, float r)
{
    return 1.0 / dot(p, p) * r;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 ratio=vec2(u_resolution.x/u_resolution.y,1.0);

    vec2 scaledUV=uv*ratio;

    vec2 OneOverDotCount = vec2(1.0)/vec2(u_dotCount);

    ivec2 currentCircle = ivec2(floor(uv * vec2(u_dotCount)));

    float field = 0.0;
    for(int x = -NeighborEffect.x; x<= NeighborEffect.x; ++x)
    {
        for(int y = -NeighborEffect.y; y<= NeighborEffect.y; ++y)
        {
            ivec2 center = currentCircle+ivec2(x,y);
            vec2 centerUV=vec2(center)*OneOverDotCount;

            centerUV += OneOverDotCount * vec2(0.5);
            vec2 flippedCenterUV=vec2(centerUV.x,1.0-centerUV.y);
            vec3 sampledTexture = texture2D(u_smile, flippedCenterUV).rgb;
            float dot = dot(sampledTexture,u_saturation);

            float r = mix(u_rMax, u_rMin, dot);
            float effect = 1.0-smoothstep(0.2,1.0,length(vec2(center-currentCircle)/vec2(NeighborEffect)));
            
            vec2 scaledCenterUV= centerUV * ratio;
            field += metaball2d( scaledCenterUV - scaledUV , r)*effect;

        }
    }
    field= smoothstep(u_sumThresholdMin,u_sumThresholdMax,field);

    vec3 finalColor=mix(u_backgroundColor,u_dotColor,field);
    gl_FragColor = vec4(finalColor, 1.0);
}

/*
TODO list
[] shift every half circle right if odd, left if even
[] blend diagonally, no shade ,but https://tr.pinterest.com/pin/151785449936276362/
[] being able to change background and dot color
*/