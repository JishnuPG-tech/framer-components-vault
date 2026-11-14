import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

interface Slide {image?:{src:string;srcSet?:string;alt?:string};title?:string;link?:string;newTab?:boolean}
interface Props {style?:React.CSSProperties;slides?:Slide[];columns?:number;background?:string;ambient?:boolean;colorStrength?:number;accent?:string;depth?:number;tilt?:number;gap?:number;radius?:string;speed?:number;motion?:boolean;captions?:boolean;paused?:boolean}
const SAMPLES:Slide[]=[{"image":{"src":"https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"silver porsche 911 on road during daytime"},"title":"Silver / 01","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1761668572765-0f0d9be78797?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A dark grey sports car with a large rear spoiler"},"title":"Aero / 25","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1717342963325-fb0ba99f60bc?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a yellow sports car parked in a parking lot"},"title":"Acid yellow / 13","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1683217253769-d72ce68f3a65?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white sports car parked in front of a building"},"title":"White edition / 26","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1634673970798-a15ae56f6c65?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"a grey porsche gtr parked in front of a building"},"title":"After hours / 02","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1598814165187-ed79437d7490?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"black car on forest during daytime"},"title":"Pines / 27","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1717342963290-8b22dccadda1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a yellow sports car parked in a parking lot"},"title":"Rear aero / 14","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1778432999466-1f0a0705d481?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A dark grey porsche drives on a winding mountain road"},"title":"Mountain pass / 28","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1611651338412-8403fa6e3599?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"black car in grayscale photography"},"title":"Sculpted / 03","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1658863567312-fcaf9a15bc6f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a black sports car"},"title":"Roofline / 29","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1658863567540-b8d86757bdf1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a black sports car"},"title":"Carbon / 15","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1775407492017-cb6142214815?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A white porsche gt3 drives down a country road"},"title":"Country road / 30","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1613921568536-555645be4032?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"A white Porsche sports car with yellow headlights in a modern showroom"},"title":"Track ready / 04","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1611651186486-415f04eb78e4?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"grayscale photo of car on road"},"title":"Rain / 31","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1682176837690-ba1052e7cd66?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white car with red rims parked in a garage"},"title":"Weissach / 16","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1688398658141-d39eda099217?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A white sports car with a black hood on a forest road"},"title":"Green route / 32","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1732624696535-68022a5b84dc?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"A car parked on the side of the road at sunset"},"title":"Last light / 05","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1704712375640-e7bfe18c7ad0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white sports car parked in front of a building"},"title":"Concrete / 33","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1743889291783-e9c726aef9ea?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A white porsche with red wheels is parked"},"title":"Autumn / 17","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1716738703767-e277c57b2a90?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a black sports car parked in front of a garage"},"title":"Pit lane / 34","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1701806244887-391677f29718?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white sports car driving down the road"},"title":"Alpine run / 06","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1775407495330-fa147be4acaf?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A white porsche 911 gt3 drives on a road"},"title":"Rolling / 35","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1722389515045-d1bb8c22286b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A yellow sports car driving on a track"},"title":"Golden hour / 18","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1699325524552-555bd48866b6?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a porsche car parked in front of a building"},"title":"Downforce / 36","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1680553986778-e833de3ffd0b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"a couple of cars parked in a parking lot"},"title":"Garage / 07","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1766819755230-c98b557e33fe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"Rear view of a dark blue porsche 911 carrera"},"title":"Carrera S / 37","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1689406393659-a47bc1d94eab?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a yellow sports car parked on the side of the road"},"title":"Yellow wing / 19","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1759001462231-cd26545a499e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"White porsche gt3 rs with red wheels"},"title":"Red wheels / 38","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1711962842423-28f28b5bbf1d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200","alt":"a grey sports car parked in front of a building"},"title":"Still motion / 08","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1763567061050-e9b7cb51eda6?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A beige porsche drives on a wet road"},"title":"Electric / 39","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1732624696692-a841984e9b99?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A black sports car parked on the side of a road"},"title":"Sunset / 20","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1777197503545-46245551cbb3?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A dark grey porsche taycan parked outdoors near trees"},"title":"Graphite / 40","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1727754005954-3d8cfae516b8?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","alt":"A close up of a wheel on a car"},"title":"Precision / 09","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1642911041553-297e5295276b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white sports car parked in front of a house"},"title":"Chalk / 41","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1777669936371-64905c5c93f0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"White porsche parked on a sunny street"},"title":"Palm drive / 21","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1760441471209-c6ef2465ba9d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A rose gold porsche drives down a city street"},"title":"Rose gold / 42","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1615125468484-088e3dfcabb6?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","alt":"black and gray car steering wheel"},"title":"Cockpit / 10","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1772772876593-9d54e5f05a5b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A dark gray porsche taycan parked outdoors under palm trees"},"title":"Palms / 43","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1614244788272-f6dcdfd8df9f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A silver sports car with a large rear wing on a city street"},"title":"Ice blue / 22","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1693149372829-7e0602d5809e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a white sports car parked on the side of the road"},"title":"Wing detail / 44","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1610379361814-e571eaca6159?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","alt":"grey and orange multi spoke car wheel"},"title":"Ceramic / 11","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1699325536076-91d01d5e2ad5?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"a close up of the tail lights of a car"},"title":"Lightbar / 45","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1758675704119-5324a332e692?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A sleek, light gray porsche 911 drives down a street"},"title":"Touring / 23","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1570374910698-6db3d787e6fb?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"white Porsche turbo S"},"title":"Turbo S / 46","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1633348570573-2c70fe9129de?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1000","alt":"the interior of a car with a steering wheel and dashboard"},"title":"Driver / 12","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1789489399545-789debfd9c11?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"The rear quarter of a metallic green sports car with a large spoiler"},"title":"Olive / 47","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1732624697571-e877b2b4f5ba?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"A car driving down a road with a sunset in the background"},"title":"Dusk / 24","link":"","newTab":false},{"image":{"src":"https://images.unsplash.com/photo-1570432215913-b66fff4a50a4?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"white sedan on black surface"},"title":"Electric light / 48","link":"","newTab":false}]
const mod=(v:number,n:number)=>(v%n+n)%n
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v))
const vertex=`
precision highp float;
attribute vec2 aUV;
uniform vec2 uView,uSize,uCenter,uPointer;
uniform float uDepth,uTilt,uHover,uShadow;
varying vec2 vUV;
varying float vLight;
float ridge(float x){float p=(x-uView.x*.5)/uView.x;return uView.y*.48+p*p*uView.y*.30;}
float lift(vec2 p){float t=(p.y-ridge(p.x))/max(75.,uView.y*.19);return uDepth*exp(-t*t);}
float slope(vec2 p){float width=max(75.,uView.y*.19);float t=(p.y-ridge(p.x))/width;return -2.*t*lift(p)/width;}
// Keep this eight-step arc-length walk identical to projectPoint in the renderer.
vec3 surface(vec2 uv){
 vec2 local=(uv-.5)*uSize*(1.+uHover*.018);
 vec2 p=vec2(uCenter.x+local.x,uCenter.y);
 float ds=local.y/8.;
 for(int i=0;i<8;i++){float d=slope(p);float mid=p.y+ds*.5/sqrt(1.+d*d);float m=slope(vec2(p.x,mid));p.y+=ds/sqrt(1.+m*m);}
 vec2 delta=uv-uPointer;float curl=uHover*54.*exp(-dot(delta,delta)*5.);float z=lift(p)+uHover*10.+curl;
 return vec3(p,z);
}
void main(){
 vec2 uv=mix(aUV,(aUV-.5)*(uSize+100.)/uSize+.5,uShadow);
 vec3 p=surface(uv);
 float sy=slope(p.xy);
 float sx=(lift(p.xy+vec2(1.,0.))-lift(p.xy-vec2(1.,0.)))*.5;
 vec2 delta=aUV-uPointer;float curl=uHover*54.*exp(-dot(delta,delta)*5.);sx+=-10.*delta.x*curl/uSize.x;sy+=-10.*delta.y*curl/uSize.y;vec3 normal=normalize(vec3(-sx,-sy,1.));
 vLight=.73+.31*max(0.,dot(normal,normalize(vec3(-.28,-.38,1.))))+.06*pow(max(0.,normal.z),12.);
 if(uShadow>.5){p.xy+=vec2(7.,19.)+vec2(p.z*.025,p.z*.055);p.z=max(0.,p.z-55.);}
 vec2 q=p.xy-uView*.5;
 q=mat2(cos(uTilt),sin(uTilt),-sin(uTilt),cos(uTilt))*q;
 float scale=1700./(1700.-p.z);
 vec2 screen=uView*.5+q*scale;
 gl_Position=vec4(screen.x/uView.x*2.-1.,1.-screen.y/uView.y*2.,0.,1.);
 vUV=uv;
}
`
const fragment=`
precision highp float;
uniform sampler2D uImage;
uniform vec2 uSize,uFit;
uniform vec4 uRadius;
uniform float uShadow,uFocus;
varying vec2 vUV;
varying float vLight;
void main(){
 vec2 p=(vUV-.5)*uSize;
 float r=p.y<0.?(p.x<0.?uRadius.x:uRadius.y):(p.x<0.?uRadius.w:uRadius.z);
 r=clamp(r,0.,min(uSize.x,uSize.y)*.49);
 vec2 q=abs(p)-uSize*.5+r;
 float d=length(max(q,0.))+min(max(q.x,q.y),0.)-r;
 if(uShadow>.5){float a=(.21*(1.-smoothstep(-22.,36.,d))+.07*(1.-smoothstep(-5.,12.,d)))*(1.-smoothstep(38.,50.,d));gl_FragColor=vec4(.12,.10,.085,a);return;}
 float alpha=1.-smoothstep(-.75,.75,d);
 if(alpha<=0.)discard;
 vec2 uv=(vUV-.5)*uFit+.5;
 vec3 rgb=texture2D(uImage,uv).rgb*vLight;
 if(uFocus>.5){float outer=smoothstep(-5.,-4.,d);float inner=smoothstep(-8.,-7.,d);rgb=mix(rgb,vec3(1.),inner);rgb=mix(rgb,vec3(.14,.22,.17),outer);}
 gl_FragColor=vec4(rgb,alpha);
}
`
type Settings={w:number;h:number;cw:number;ch:number;step:number;gap:number;rows:number;columns:number;depth:number;tilt:number;speed:number;radius:string;paused:boolean;static:boolean;ambient:boolean;colorStrength:number;background:string}
function readColor(color:string):number[]{const c=document.createElement("canvas");c.width=c.height=1;const ctx=c.getContext("2d")!;ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3)}
function photoColor(img:HTMLImageElement):number[]{
 const c=document.createElement("canvas");c.width=c.height=24;const ctx=c.getContext("2d",{willReadFrequently:true})!;ctx.drawImage(img,0,0,24,24);
 const pixels=ctx.getImageData(0,0,24,24).data,bins=Array.from({length:24},()=>({weight:0,h:0,s:0}));
 for(let i=0;i<pixels.length;i+=4){const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(d<.055||l<.12||l>.88)continue;const sat=d/(1-Math.abs(2*l-1));let h=max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4;h/=6;const weight=sat*sat*(.3+Math.sin(l*Math.PI));const bin=bins[Math.floor(h*24)%24];bin.weight+=weight;bin.h+=h*weight;bin.s+=sat*weight}
 const winner=bins.reduce((a,b)=>a.weight>b.weight?a:b);if(winner.weight<.15)return [207,211,214];
 const hue=winner.h/winner.weight,sat=clamp(winner.s/winner.weight*.7,.22,.52),light=.74;
 const a=sat*Math.min(light,1-light),f=(n:number)=>{const k=(n+hue*12)%12;return 255*(light-a*Math.max(-1,Math.min(k-3,9-k,1)))};
 return [f(0),f(8),f(4)]
}
class PaperRenderer {
 canvas:HTMLCanvasElement;gl:WebGLRenderingContext;program:WebGLProgram;vb:WebGLBuffer;ib:WebGLBuffer;indices=0; uniforms:Record<string,WebGLUniformLocation|null>={}
 settings:Settings;items:Slide[];links:(HTMLAnchorElement|null)[];textures:{texture:WebGLTexture;aspect:number}[]=[];images:HTMLImageElement[]=[];palettes:number[][]=[];baseColor:number[]=[221,216,207];currentColor:number[]=[221,216,207]
 frame=0;last=0;live=true;visible=true;loaded=false;presented=false;travel=0;target=0;flow=0;inertia=0;swell=0;dragging=false;hover=-1;focus=-1;lifts:number[]=[];cursorX=.5;cursorY=.5;paperX=.5;paperY=.5;observer:IntersectionObserver;onReady:()=>void;onFail:()=>void
 constructor(canvas:HTMLCanvasElement,items:Slide[],links:(HTMLAnchorElement|null)[],s:Settings,onReady:()=>void,onFail:()=>void){
  this.canvas=canvas;this.baseColor=readColor(s.background);this.currentColor=[...this.baseColor];this.settings=s;this.items=items;this.links=links;this.onReady=onReady;this.onFail=onFail
  const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true})
  if(!gl)throw Error("WebGL unavailable")
  this.gl=gl
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message||"Shader compilation failed")}return shader}
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs)
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||"Shader link failed")
  this.program=program;gl.useProgram(program)
  const vertices:number[]=[],indices:number[]=[],nx=18,ny=52
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)vertices.push(x/nx,y/ny)
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1)}
  this.indices=indices.length;this.vb=gl.createBuffer()!;this.ib=gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER,this.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW)
  const attr=gl.getAttribLocation(program,"aUV");gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0)
  for(const key of ["View","Size","Center","Depth","Tilt","Hover","Shadow","Image","Fit","Radius","Focus","Pointer"])this.uniforms[key]=gl.getUniformLocation(program,"u"+key)
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0)
  let remaining=items.length
  items.forEach((item,i)=>{
   const img=new Image();img.crossOrigin="anonymous";this.images.push(img)
   img.onload=()=>{if(!this.live)return;try{
    const texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
    const upload=document.createElement("canvas"),scale=Math.min(1,1024/Math.max(img.naturalWidth,img.naturalHeight));upload.width=Math.max(1,Math.round(img.naturalWidth*scale));upload.height=Math.max(1,Math.round(img.naturalHeight*scale));upload.getContext("2d")!.drawImage(img,0,0,upload.width,upload.height);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,upload)
    try{this.palettes[i]=photoColor(img)}catch{this.palettes[i]=this.baseColor}
    this.textures[i]={texture,aspect:img.naturalWidth/img.naturalHeight}
    if(--remaining===0){this.loaded=true;this.wake()}
   }catch{this.onFail()}}
   img.onerror=()=>{if(this.live)this.onFail()};img.src=item.image!.src
  })
  this.observer=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;this.visibility()});this.observer.observe(canvas)
  document.addEventListener("visibilitychange",this.visibility)
  window.addEventListener("focus",this.visibility)
  window.addEventListener("pageshow",this.visibility)
  canvas.addEventListener("webglcontextlost",this.contextLost)
 }
 contextLost=(e:Event)=>{e.preventDefault();this.onFail()}
 visibility=()=>{
  // Framer/browser suspension can discard a queued RAF; never retain its stale ID.
  cancelAnimationFrame(this.frame);this.frame=0;this.last=0
  if(this.live&&this.visible&&!document.hidden)this.wake()
 }
 wake=()=>{if(this.live&&!this.frame)this.frame=requestAnimationFrame(this.tick)}
 update(s:Settings){if(s.background!==this.settings.background)this.baseColor=readColor(s.background);this.settings=s;this.wake()}
 nudge(delta:number){if(this.settings.paused||this.focus>=0)return;this.target+=delta;this.wake()}
 drag(delta:number){this.target+=delta;this.inertia=clamp(delta*12,-500,500);this.wake()}
 focusCard(i:number){
  this.focus=i;const s=this.settings,lane=i%s.columns,row=Math.floor(i/s.columns),direction=lane%2===1?-.72:1
  this.target=(row*s.step+lane*s.step*.31-(s.h-s.ch)/2)/direction;this.travel=this.target;this.inertia=0;this.wake()
 }
 // Must match surface() in the vertex shader, including its midpoint integration.
 projectPoint(cx:number,cy:number,u:number,v:number,lift:number,depth:number){
  const s=this.settings,x=cx+(u-.5)*s.cw*(1+lift*.018);let y=cy
  const width=Math.max(75,s.h*.19),ridge=s.h*.48+Math.pow((x-s.w*.5)/s.w,2)*s.h*.30
  const zAt=(yy:number)=>depth*Math.exp(-Math.pow((yy-ridge)/width,2))
  const slope=(yy:number)=>-2*(yy-ridge)*zAt(yy)/(width*width)
  const ds=(v-.5)*s.ch*(1+lift*.018)/8
  for(let i=0;i<8;i++){const d=slope(y),mid=y+ds*.5/Math.sqrt(1+d*d),m=slope(mid);y+=ds/Math.sqrt(1+m*m)}
  const dx=u-this.paperX,dy=v-this.paperY;const z=zAt(y)+lift*10+lift*54*Math.exp(-(dx*dx+dy*dy)*5),angle=s.tilt*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),xx=x-s.w*.5,yy=y-s.h*.5,k=1700/(1700-z)
  return {x:s.w*.5+(xx*c-yy*sn)*k,y:s.h*.5+(xx*sn+yy*c)*k,z}
 }
 tick=(now:number)=>{
  this.frame=0;if(!this.live||!this.loaded||!this.visible||document.hidden)return
  const s=this.settings,dt=this.last?Math.min(.05,(now-this.last)/1000):1/60;this.last=now
  this.paperX+=(this.cursorX-this.paperX)*(1-Math.exp(-dt*8));this.paperY+=(this.cursorY-this.paperY)*(1-Math.exp(-dt*8));const active=!s.static&&!s.paused&&this.focus<0&&!this.dragging
  this.flow+=((active?s.speed:0)-this.flow)*(1-Math.exp(-dt*7))
  if(active)this.target+=(this.flow+this.inertia)*dt
  this.inertia*=Math.exp(-dt*4)
  const before=this.travel
  this.travel+=(this.target-this.travel)*(1-Math.exp(-dt*(this.dragging?22:11)))
  const speed=Math.abs((this.travel-before)/dt)
  const swellTarget=active?clamp(speed/800,0,1):0
  this.swell+=(swellTarget-this.swell)*(1-Math.exp(-dt*5))
  const depth=s.depth*(1+this.swell*.12),gl=this.gl,dpr=Math.min(window.devicePixelRatio||1,2)
  const w=Math.round(s.w*dpr),h=Math.round(s.h*dpr)
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}
  gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program)
  gl.uniform2f(this.uniforms.View,s.w,s.h);gl.uniform2f(this.uniforms.Size,s.cw,s.ch)
  gl.uniform2f(this.uniforms.Pointer,this.paperX,this.paperY);gl.uniform1f(this.uniforms.Depth,depth);gl.uniform1f(this.uniforms.Tilt,s.tilt*Math.PI/180);gl.uniform1i(this.uniforms.Image,0)
  const vals=String(s.radius).split(/\s+/).map(v=>(parseFloat(v)||0)*(v.includes("%")?Math.min(s.cw,s.ch)/100:1))
  const r=vals.length===1?[vals[0],vals[0],vals[0],vals[0]]:vals.length===2?[vals[0],vals[1],vals[0],vals[1]]:vals.length===3?[vals[0],vals[1],vals[2],vals[1]]:vals
  gl.uniform4f(this.uniforms.Radius,...r.slice(0,4) as [number,number,number,number])
  const cycle=s.rows*s.step,margin=s.ch*2+s.w*.45+depth,draws:{i:number;x:number;y:number;lift:number;z:number}[]=[]
  for(let i=0;i<s.rows*s.columns;i++){
   const lane=i%s.columns,row=Math.floor(i/s.columns),direction=lane%2===1?-.72:1
   const phase=s.static?s.step*.38:this.travel*direction
   const y=mod(row*s.step+lane*s.step*.31-phase+margin,cycle)-margin+s.ch/2
   const x=s.w*.5+(lane-(s.columns-1)/2)*(s.cw+s.gap)
   const safeMargin=s.ch*1.2+s.w*.4+depth+150
   if(y < -safeMargin || y > s.h+safeMargin){const el=this.links[i];if(el){el.style.pointerEvents="none";el.style.transform="translate3d(-10000px,-10000px,0)"}continue}
   const picked=!this.dragging&&(this.hover===i||this.focus===i)
   const lift=(this.lifts[i]||0)+((picked?1:0)-(this.lifts[i]||0))*(1-Math.exp(-dt*6));this.lifts[i]=lift
   const link=this.links[i]
   const points:{x:number;y:number;z:number}[]=[]
   for(let n=0;n<=12;n++)points.push(this.projectPoint(x,y,0,n/12,lift,depth))
   for(let n=12;n>=0;n--)points.push(this.projectPoint(x,y,1,n/12,lift,depth))
   const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y))
   const visible=maxY> -45&&minY<s.h+45&&maxX> -45&&minX<s.w+45
   if(link){
    link.style.pointerEvents=visible?"auto":"none"
    link.style.transform="translate3d("+minX+"px,"+minY+"px,0)"
    link.style.width=Math.max(1,maxX-minX)+"px";link.style.height=Math.max(1,maxY-minY)+"px"
    link.style.clipPath="polygon("+points.map(p=>(p.x-minX)+"px "+(p.y-minY)+"px").join(",")+")"
    link.style.zIndex=String(Math.round(this.projectPoint(x,y,.5,.5,lift,depth).z))
   }
   if(visible)draws.push({i,x,y,lift,z:this.projectPoint(x,y,.5,.5,lift,depth).z})
  }
  const anchorLane=Math.floor(s.columns/2);
  const centered=draws.filter(d=>d.i%s.columns===anchorLane).reduce<typeof draws[number]|null>((best,d)=>!best||Math.abs(d.y-s.h*.5)<Math.abs(best.y-s.h*.5)?d:best,null);
  const picked=draws.find(d=>d.i===this.hover||d.i===this.focus);
  const palette=this.palettes[(picked||centered)?.i%this.items.length]||this.baseColor;
  const mix=s.ambient?s.colorStrength/100:0,alpha=s.static?1:1-Math.exp(-dt*1.4);
  this.currentColor=this.currentColor.map((v,i)=>v+(this.baseColor[i]*(1-mix)+palette[i]*mix-v)*alpha);
  this.canvas.parentElement?.style.setProperty("--gallery-bg","rgb("+this.currentColor.map(v=>v.toFixed(2)).join(",")+")");
  draws.sort((a,b)=>a.z-b.z)
  for(let pass=0;pass<2;pass++){
   gl.uniform1f(this.uniforms.Shadow,pass===0?1:0)
   for(const d of draws){
    const tex=this.textures[d.i%this.items.length];if(!tex)continue
    gl.uniform2f(this.uniforms.Center,d.x,d.y);gl.uniform1f(this.uniforms.Hover,d.lift);gl.uniform1f(this.uniforms.Focus,this.focus===d.i?1:0)
    const aspect=s.cw/s.ch
    gl.uniform2f(this.uniforms.Fit,Math.min(1,aspect/tex.aspect),Math.min(1,tex.aspect/aspect))
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex.texture);gl.drawElements(gl.TRIANGLES,this.indices,gl.UNSIGNED_SHORT,0)
   }
  }
  if(!this.presented){this.presented=true;this.onReady()}
  if(!s.static)this.wake()
 }
 destroy(){
  this.live=false;cancelAnimationFrame(this.frame);this.observer.disconnect();document.removeEventListener("visibilitychange",this.visibility);window.removeEventListener("focus",this.visibility);window.removeEventListener("pageshow",this.visibility);this.canvas.removeEventListener("webglcontextlost",this.contextLost)
  this.images.forEach(i=>{i.onload=null;i.onerror=null})
  this.textures.forEach(t=>this.gl.deleteTexture(t.texture));this.gl.deleteBuffer(this.vb);this.gl.deleteBuffer(this.ib);this.gl.deleteProgram(this.program)
 }
}
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 850
 * @framerDisableUnlink
 */
export default function InfiniteSlipstream(props:Props){
 const {style,columns:columnCount=4,background="#ddd8cf",ambient=true,colorStrength=85,accent="#443e35",depth=165,tilt=-12,gap=34,radius="6px",speed=42,motion=true,captions=false,paused=false}=props
 const supplied=props.slides?.filter(s=>s.image?.src),items=supplied?.length?supplied:SAMPLES
 const root=React.useRef<HTMLDivElement>(null),canvasRef=React.useRef<HTMLCanvasElement>(null),links=React.useRef<(HTMLAnchorElement|null)[]>([]),engine=React.useRef<PaperRenderer|null>(null)
 const [size,setSize]=React.useState({w:1200,h:850,measured:false}),[ready,setReady]=React.useState(false),[failed,setFailed]=React.useState(false),[reduced,setReduced]=React.useState(false),[stopped,setStopped]=React.useState(paused)
 const pointer=React.useRef({down:false,start:0,last:0,moved:false})
 const rt=RenderTarget.current(),staticView=rt===RenderTarget.canvas||rt===RenderTarget.thumbnail||rt===RenderTarget.export
 const flat=!motion||(reduced&&!staticView)||failed
 const columns=size.w<600?1:Math.min(size.w<1000?3:5,Math.max(1,Math.round(columnCount))),cw=columns===1?size.w*.76:Math.min(342,(size.w*.86-(columns-1)*gap)/columns),ch=cw*1.22,step=ch+gap
 // Both recycle boundaries stay outside the viewport even after the maximum perspective and tilt.
 const margin=ch*2+size.w*.45+depth*1.12
 const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a
 const sequenceRows=items.length/gcd(items.length,columns)
 const rows=Math.ceil(Math.max(sequenceRows,Math.ceil((size.h+2*margin+ch)/step)+1)/sequenceRows)*sequenceRows
 const count=rows*columns, signature=items.map(i=>i.image?.src).join("|")
 const settings:Settings={w:size.w,h:size.h,cw,ch,step,gap,rows,columns,depth,tilt:columns===1?tilt*.4:tilt,speed,radius,paused:stopped,static:staticView,ambient,colorStrength,background}
 React.useEffect(()=>setStopped(paused),[paused])
 React.useEffect(()=>{const mq=matchMedia("(prefers-reduced-motion: reduce)"),fn=()=>setReduced(mq.matches);fn();mq.addEventListener("change",fn);return()=>mq.removeEventListener("change",fn)},[])
 React.useEffect(()=>{const el=root.current;if(!el)return;const ro=new ResizeObserver(([e])=>{const w=Math.max(1,e.contentRect.width),h=Math.max(1,e.contentRect.height);setSize(old=>old.measured&&old.w===w&&old.h===h?old:{w,h,measured:true})});ro.observe(el);return()=>ro.disconnect()},[])
 React.useEffect(()=>{
  if(flat||!canvasRef.current||!size.measured)return
  setReady(false)
  try{engine.current=new PaperRenderer(canvasRef.current,items,links.current,settings,()=>setReady(true),()=>setFailed(true))}catch(error){console.warn("Infinite Slipstream: using image fallback.",error);setFailed(true)}
  return()=>{engine.current?.destroy();engine.current=null}
 },[signature,flat,size.measured])
 React.useEffect(()=>{engine.current?.update(settings)},[size.w,size.h,depth,tilt,gap,radius,speed,stopped,columns,rows,staticView,ambient,colorStrength,background])
 React.useEffect(()=>{const el=root.current;if(!el)return;const wheel=(e:WheelEvent)=>{if(!flat)engine.current?.nudge(e.deltaY*(e.deltaMode===1?12:1)*.65)};el.addEventListener("wheel",wheel,{passive:true});return()=>el.removeEventListener("wheel",wheel)},[flat])
 const grid=<div style={{height:"100%",overflowY:"auto",display:"grid",gridTemplateColumns:"repeat("+columns+",1fr)",gap,padding:24,alignContent:"start"}}>{items.map((s,i)=><a key={i} href={s.link||undefined} target={s.newTab?"_blank":undefined} rel={s.newTab?"noopener noreferrer":undefined} aria-label={s.title||s.image?.alt} tabIndex={flat&&s.link?0:-1} style={{position:"relative",display:"block",aspectRatio:"4/5",borderRadius:radius,overflow:"hidden"}}><img src={s.image?.src} srcSet={s.image?.srcSet} alt={s.image?.alt||s.title||""} style={{width:"100%",height:"100%",objectFit:"cover"}}/>{captions&&<span style={{position:"absolute",bottom:0,left:0,right:0,padding:16,color:"white",background:"#0007",font:"12px system-ui"}}>{s.title}</span>}</a>)}</div>
 return <div data-infinite-slipstream="" ref={root} style={{position:"relative",width:"100%",height:"100%",...style,background:flat?background:"var(--gallery-bg,"+background+")",overflow:"clip"}}>
 <style>{`[data-infinite-slipstream] a:focus-visible,[data-infinite-slipstream] button:focus-visible{outline:3px solid ${accent};outline-offset:4px}[data-infinite-slipstream] button:not(:focus-visible),[data-infinite-slipstream] a:not(:focus-visible){outline:none}`}</style>
 {flat?grid:<>

 <canvas ref={canvasRef} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:ready?1:0,transition:staticView?"none":"opacity .35s ease",pointerEvents:"none"}}/>
 <div style={{position:"absolute",inset:0,touchAction:"pan-x",opacity:ready?1:0,pointerEvents:ready?"auto":"none"}}
 onPointerDown={e=>{if(e.button!==0)return;pointer.current={down:true,start:e.clientY,last:e.clientY,moved:false};if(engine.current){engine.current.dragging=true;engine.current.inertia=0}}}
 onPointerMove={e=>{const p=pointer.current;if(!p.down)return;if(Math.abs(e.clientY-p.start)>6){p.moved=true;e.currentTarget.setPointerCapture(e.pointerId)}engine.current?.drag(p.last-e.clientY);p.last=e.clientY}}
 onPointerUp={e=>{pointer.current.down=false;if(engine.current)engine.current.dragging=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
 onPointerCancel={()=>{pointer.current.down=false;pointer.current.moved=true;if(engine.current){engine.current.dragging=false;engine.current.inertia=0}}}
 onPointerLeave={()=>{if(engine.current)engine.current.hover=-1;if(!pointer.current.moved){pointer.current.down=false;if(engine.current)engine.current.dragging=false}}}>
 {Array.from({length:count},(_,i)=>{const s=items[i%items.length];return <a key={i} ref={el=>{links.current[i]=el}} href={s.link||undefined} target={s.newTab?"_blank":undefined} rel={s.newTab?"noopener noreferrer":undefined} tabIndex={ready&&s.link&&i<items.length?0:-1} aria-label={s.title||s.image?.alt||"Image "+(i%items.length+1)} aria-hidden={i>=items.length||!ready?true:undefined} draggable={false}
 onClick={e=>{if(pointer.current.moved&&e.detail!==0){e.preventDefault();pointer.current.moved=false}}}
 onFocus={e=>{if(e.currentTarget.matches(":focus-visible"))engine.current?.focusCard(i)}}
 onBlur={()=>{if(engine.current){engine.current.focus=-1;engine.current.wake()}}}
 onPointerMove={e=>{const renderer=engine.current;if(!renderer||e.pointerType==="touch")return;const rect=e.currentTarget.getBoundingClientRect();renderer.cursorX=clamp((e.clientX-rect.left)/rect.width,.05,.95);renderer.cursorY=clamp((e.clientY-rect.top)/rect.height,.05,.95)}}
 onPointerEnter={e=>{if(engine.current&&e.pointerType!=="touch"){engine.current.hover=i;engine.current.wake()}}}
 onPointerLeave={()=>{if(engine.current)engine.current.hover=-1}}
 style={{position:"absolute",left:0,top:0,width:cw,height:ch,cursor:s.link?"pointer":"grab",userSelect:"none",textDecoration:"none",color:"white",background:"transparent"}}>
 {captions&&<span style={{position:"absolute",bottom:12,left:18,right:18,font:"12px system-ui",textShadow:"0 1px 5px #000",pointerEvents:"none"}}>{s.title}</span>}
 </a>})}
 </div>
 <div aria-hidden="true" style={{position:"absolute",inset:"0 0 auto",height:55,background:"linear-gradient(var(--gallery-bg,"+background+"),transparent)",pointerEvents:"none",zIndex:300}}/>
 <div aria-hidden="true" style={{position:"absolute",inset:"auto 0 0",height:65,background:"linear-gradient(transparent,var(--gallery-bg,"+background+"))",pointerEvents:"none",zIndex:300}}/>
 </>}
 </div>
}
InfiniteSlipstream.displayName = "Infinite Slipstream"
addPropertyControls(InfiniteSlipstream,{
 slides:{type:ControlType.Array,title:"Images",maxCount:100,control:{type:ControlType.Object,controls:{image:{type:ControlType.ResponsiveImage,title:"Image"},title:{type:ControlType.String,title:"Caption"},link:{type:ControlType.Link,title:"Link"},newTab:{type:ControlType.Boolean,title:"New Tab",defaultValue:false}}},defaultValue:SAMPLES},
 columns:{type:ControlType.Number,title:"Columns",min:1,max:5,step:1,displayStepper:true,defaultValue:4},
 background:{type:ControlType.Color,title:"Background",defaultValue:"#ddd8cf"},
 ambient:{type:ControlType.Boolean,title:"Image Colors",defaultValue:true},
 colorStrength:{type:ControlType.Number,title:"Color Strength",min:0,max:100,unit:"%",defaultValue:85,hidden:p=>!p.ambient},
 accent:{type:ControlType.Color,title:"Accent",defaultValue:"#443e35"},
 depth:{type:ControlType.Number,title:"Bend",min:0,max:230,defaultValue:165},
 tilt:{type:ControlType.Number,title:"Tilt",min:-25,max:25,defaultValue:-12,unit:"°"},
 gap:{type:ControlType.Number,title:"Gap",min:12,max:80,defaultValue:34},
 radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"6px"},
 speed:{type:ControlType.Number,title:"Speed",min:-120,max:120,defaultValue:42},
 paused:{type:ControlType.Boolean,title:"Start Paused",defaultValue:false},
 captions:{type:ControlType.Boolean,title:"Captions",defaultValue:false},
 motion:{type:ControlType.Boolean,title:"Motion",defaultValue:true,description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"}
})
