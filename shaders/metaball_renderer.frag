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

// #define OneOverDotCount vec2(1.0)/vec2(u_dotCount)
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

float metaball2d_2(float pSquare,float r)
{
    return 1.0 / (pSquare) * r;
}

float dotDistToLine(vec2 P1,vec2 P2,vec2 Pt)
{
    vec2 e1=P2-P1;
    vec2 e2=Pt-P1;
    float recArea=dot(e1,e1);
    float val=dot(e1,e2);
    float fraction=clamp(val/recArea,0.0,1.0);
    vec2 fractionOnLine=P1+e1*fraction;

    vec2 diff=Pt-fractionOnLine;
    return dot(diff,diff);

    //https://www.sunshine2k.de/coding/java/PointOnLine/PointOnLine.html
    // vec2 e1=P2-P1;
    // vec2 e2=Pt-P1;
    // float recArea=dot(e1,e1);
    // float val=dot(e1,e2);

    // float isLineOnSegment=float(val>0.0 && val<recArea);

    // float A = P2.y-P1.y;
    // float B = P2.x-P1.x;
    // float C = P1.x * P2.y - P1.y * P2.x;

    // float distToLine= abs(-A * Pt.x + B * Pt.y + C) / sqrt( A*A + B*B );
    // return isLineOnSegment*distToLine;
}

vec2 cellToUv(ivec2 center,vec2 OneOverDotCount)
{
    vec2 centerUV=vec2(center)*OneOverDotCount;

    centerUV.x += -OneOverDotCount.x * 0.5 +( mod(float(center.y),2.0)*OneOverDotCount.x * 0.5);
    centerUV.y += OneOverDotCount.y * 0.5;
    return centerUV;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 ratio=vec2(u_resolution.x/u_resolution.y,1.0);

    vec2 scaledUV=uv*ratio;

    vec2 OneOverDotCount = vec2(1.0)/vec2(u_dotCount);

    ivec2 currentCircle = ivec2(floor(uv * vec2(u_dotCount)));

    float field1 = 0.0;
    float field2 = 0.0;

    for(int x = -NeighborEffect.x; x<= NeighborEffect.x; ++x)
    {
        for(int y = -NeighborEffect.y; y<= NeighborEffect.y; ++y)
        {
            ivec2 center = currentCircle+ivec2(x,y);
            vec2 centerUV=cellToUv(center,OneOverDotCount);
            vec2 leftUpUv=cellToUv(center+ivec2(-1,+1),OneOverDotCount);
            vec2 rightUpUv=cellToUv(center+ivec2(+1,+1),OneOverDotCount);
            float distToLine1=dotDistToLine(leftUpUv,centerUV,uv);
            float distToLine2=dotDistToLine(rightUpUv,centerUV,uv);


            vec2 flippedCenterUV=vec2(centerUV.x,1.0-centerUV.y);
            vec3 sampledTexture = texture2D(u_smile, flippedCenterUV).rgb;
            float dot = dot(sampledTexture,u_saturation);

            float r = mix(u_rMax, u_rMin, dot);
            float dist=length(vec2(center-currentCircle)/vec2(NeighborEffect));
            float effect = 1.0-smoothstep(0.2,1.0,dist);
            
            vec2 scaledCenterUV= centerUV * ratio;
            //field += metaball2d( scaledCenterUV - scaledUV , r)*effect;
            field1 += metaball2d_2( distToLine1,r)*effect;
            field2 += metaball2d_2( distToLine2,r)*effect;

        }
    }
    float field= smoothstep(u_sumThresholdMin,u_sumThresholdMax,field1+field2);

    vec3 finalColor=mix(u_backgroundColor,u_dotColor,field);
    gl_FragColor = vec4(finalColor, 1.0);

    //gl_FragColor=(vec4(field2,field2,field2,1.0));
    
}

/*
TODO list
[] shift every half circle right if odd, left if even
[] blend diagonally, no shade ,but https://tr.pinterest.com/pin/151785449936276362/
[] being able to change background and dot color
*/