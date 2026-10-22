//https://blog.maximeheckel.com/posts/shades-of-halftone/


#ifdef GL_ES
precision highp float;
#endif

const vec3 luma = vec3(0.3,0.6,0.1);

uniform vec2 u_resolution;

uniform float u_cellSize;
uniform float u_maxDotSizeInCell;
uniform float u_minDotSizeInCell;
uniform vec3 u_backgroundColor;
uniform vec3 u_dotColor;
uniform sampler2D u_videoFrame;


float circle(vec2 center, vec2 Pt, float r)
{
    float edge= 1.0;
    vec2 diff=Pt-center;
    float d=dot(diff,diff);
    float lowEnd=pow(r-edge,2.0);
    float highEnd=pow(r+edge,2.0);

    return 1.0- smoothstep(lowEnd,highEnd,d);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float ratio = uv.x/uv.y;
    vec2 uvRatio= uv * vec2(ratio,1.0);

    vec2 currentGrid=floor(gl_FragCoord.xy /vec2(u_cellSize)); //which box I'm in, in pixel
    vec2 offset= vec2( 0.5*u_cellSize * mod(currentGrid.y,2.0),0.0);


    vec2 correctedGrid=floor((gl_FragCoord.xy-offset) /vec2(u_cellSize)); //when the pixel is shifted, it starts to be treated as in then next grid
    vec2 center=correctedGrid*vec2(u_cellSize) + vec2(u_cellSize)*0.5+offset; //in pixel
    
    vec2 centerUv = (center/u_resolution.xy);
    vec2 centerUvFlipped = vec2(centerUv.x,1.0-centerUv.y);
    vec3 videoFrame = texture2D(u_videoFrame,centerUvFlipped).rgb;
     float sizeByLuma =dot(luma,videoFrame); // eyes are sensitive to g most, then r and b. so make g pixels bigger

    float r = mix(u_minDotSizeInCell ,u_maxDotSizeInCell ,sizeByLuma) * u_cellSize;

    float c=circle(center,gl_FragCoord.xy,r);
    vec3 finalColor= c * videoFrame;
    finalColor=vec3(c);


    gl_FragColor = vec4(finalColor, 1.0);
}
