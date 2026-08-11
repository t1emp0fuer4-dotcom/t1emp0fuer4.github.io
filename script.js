(function(){
"use strict";
const TAU=Math.PI*2;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- formato (coma decimal) ---------- */
function trimNum(n){
  let s;
  if(n>=100) s=n.toFixed(0);
  else if(n>=10) s=n.toFixed(1);
  else s=n.toFixed(2);
  return s.replace('.',',');
}

/* ---------- KaTeX ---------- */
let currentMaxMode='gaussE';
function renderMath(){
  if(!window.katex){setTimeout(renderMath,120);return;}
  $$('[data-tex]').forEach(el=>{
    katex.render(el.getAttribute('data-tex'),el,{throwOnError:false,displayMode:el.hasAttribute('data-display')});
  });
  if(window.__remax) window.__remax();
}

/* ---------- canvas helper ---------- */
function makeCanvas(id){
  const cv=document.getElementById(id);
  const ctx=cv.getContext('2d');
  let w=0,h=0;
  function resize(){
    const r=cv.getBoundingClientRect();
    const d=Math.min(2,window.devicePixelRatio||1);
    w=r.width;h=r.height;
    cv.width=Math.max(1,w*d);cv.height=Math.max(1,h*d);
    ctx.setTransform(d,0,0,d,0,0);
  }
  resize();
  window.addEventListener('resize',resize);
  return {cv,ctx,get w(){return w},get h(){return h}};
}

/* ---------- NAV ---------- */
const navBar=document.getElementById('navBar');
window.addEventListener('scroll',()=>{navBar.classList.toggle('nav-scrolled',window.scrollY>40);},{passive:true});

let menuOpen=false;
const drawer=$('#drawer'),backdrop=$('#backdrop'),iconMenu=$('#iconMenu'),iconX=$('#iconX');
const drawerLinks=$$('.drawer-link');
drawerLinks.forEach((a,i)=>{
  a.style.transition='opacity .45s ease, transform .45s ease, background-color .2s, color .2s';
  a.style.opacity=0;
  a.style.transform='translateX(24px)';
  a.style.transitionDelay=((i+1)*60)+'ms';
});
function setMenu(open){
  menuOpen=open;
  iconMenu.classList.toggle('rotate-90',open);
  iconMenu.classList.toggle('scale-0',open);
  iconMenu.classList.toggle('opacity-0',open);
  iconX.classList.toggle('-rotate-90',!open);
  iconX.classList.toggle('scale-0',!open);
  iconX.classList.toggle('opacity-0',!open);
  backdrop.classList.toggle('opacity-100',open);
  backdrop.classList.toggle('opacity-0',!open);
  backdrop.classList.toggle('pointer-events-none',!open);
  drawer.classList.toggle('translate-x-0',open);
  drawer.classList.toggle('translate-x-full',!open);
  document.body.style.overflow=open?'hidden':'';
  drawerLinks.forEach((a,i)=>{
    a.style.opacity=open?1:0;
    a.style.transform=open?'translateX(0)':'translateX(24px)';
    a.style.transitionDelay=open?((i+1)*60)+'ms':'0ms';
  });
}
$('#menuBtn').addEventListener('click',()=>setMenu(!menuOpen));
backdrop.addEventListener('click',()=>setMenu(false));
drawerLinks.forEach(a=>a.addEventListener('click',()=>setMenu(false)));

/* ---------- HERO ---------- */
const H=makeCanvas('heroCanvas');
let mx=-1e4,my=-1e4;
$('#inicio').addEventListener('pointermove',e=>{
  const r=H.cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;
});
$('#inicio').addEventListener('pointerleave',()=>{mx=-1e4;my=-1e4;});
const heroParts=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),s:.15+Math.random()*.5,r:.6+Math.random()*1.7,p:Math.random()*TAU}));
const heroLayers=[
  {y:.58,a:30,k:.008,sp:.9,col:'34,211,238',lw:2.2,blur:16},
  {y:.68,a:22,k:.012,sp:-.7,col:'45,212,191',lw:1.8,blur:12},
  {y:.48,a:16,k:.016,sp:1.4,col:'125,211,252',lw:1.4,blur:10}
];
function drawHero(t){
  const ctx=H.ctx,w=H.w,h=H.h;
  ctx.clearRect(0,0,w,h);
  heroParts.forEach(p=>{
    let py=(p.y - t*p.s*0.02)%1; if(py<0)py+=1;
    const tw=.35+.65*Math.abs(Math.sin(t*1.5+p.p));
    ctx.fillStyle='rgba(148,197,253,'+(tw*.5).toFixed(3)+')';
    ctx.beginPath();ctx.arc(p.x*w,py*h,p.r,0,TAU);ctx.fill();
  });
  heroLayers.forEach(L=>{
    ctx.beginPath();
    for(let x=0;x<=w;x+=5){
      const boost=1+1.4*Math.exp(-((x-mx)*(x-mx))/(2*130*130));
      const y=h*L.y+Math.sin(x*L.k+t*L.sp)*L.a*boost+Math.sin(x*L.k*2.3-t*L.sp*1.7)*L.a*.35;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba('+L.col+',.8)';
    ctx.lineWidth=L.lw;
    ctx.shadowColor='rgba('+L.col+',.9)';
    ctx.shadowBlur=L.blur;
    ctx.stroke();
    ctx.shadowBlur=0;
  });
}

/* ---------- scramble del título ---------- */
function scramble(el){
  const final=el.dataset.text;
  const glyphs='∇∂ΦΨΩλμπ×+−01';
  let step=0;const total=42;
  const iv=setInterval(()=>{
    step++;
    const reveal=Math.floor((step/total)*final.length);
    let out='';
    for(let i=0;i<final.length;i++){
      if(i<reveal||final[i]===' ') out+=final[i];
      else out+=glyphs[Math.floor(Math.random()*glyphs.length)];
    }
    el.textContent=out;
    if(step>=total){el.textContent=final;clearInterval(iv);}
  },34);
}

/* ---------- MAXWELL ---------- */
const M=makeCanvas('maxCanvas');
const MODES={
  gaussE:{
    title:'Ley de Gauss (eléctrica)',tex:'\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0}',
    desc:'Las cargas eléctricas son las fuentes del campo eléctrico: el flujo que atraviesa cualquier superficie cerrada es proporcional a la carga encerrada.',
    app:'Explica los pararrayos, el blindaje de los cables coaxiales y por qué tu jaula de Faraday (el ascensor) te deja sin cobertura.',
    draw(ctx,w,h,t){
      const cx=w/2,cy=h/2,R=Math.min(w,h)*.44;
      ctx.strokeStyle='rgba(34,211,238,0.12)';ctx.lineWidth=1;
      for(let a=0;a<14;a++){const ang=a/14*TAU;ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*16,cy+Math.sin(ang)*16);ctx.lineTo(cx+Math.cos(ang)*R,cy+Math.sin(ang)*R);ctx.stroke();}
      for(let a=0;a<14;a++){for(let j=0;j<5;j++){
        const prog=((t*.3)+(a*.071)+(j*.2))%1;
        const r=16+prog*(R-16);
        const ang=a/14*TAU;
        ctx.fillStyle='rgba(103,232,249,'+(0.85*(1-prog)).toFixed(3)+')';
        ctx.shadowColor='rgba(34,211,238,.8)';ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,2.4*(1-prog)+.6,0,TAU);ctx.fill();
        ctx.shadowBlur=0;
      }}
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,40);
      g.addColorStop(0,'rgba(56,189,248,.5)');g.addColorStop(1,'rgba(56,189,248,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,40,0,TAU);ctx.fill();
      ctx.fillStyle='#0ea5e9';ctx.strokeStyle='#e0f2fe';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,11,0,TAU);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(cx-5,cy);ctx.lineTo(cx+5,cy);ctx.moveTo(cx,cy-5);ctx.lineTo(cx,cy+5);ctx.stroke();
    }
  },
  gaussB:{
    title:'Ley de Gauss magnética',tex:'\\nabla\\cdot\\mathbf{B}=0',
    desc:'No existen monopolos magnéticos: las líneas de campo magnético siempre se cierran sobre sí mismas, sin principio ni fin.',
    app:'Parte un imán de nevera y obtendrás dos imanes completos: jamás un polo norte o sur aislado.',
    draw(ctx,w,h,t){
      const cx=w/2,cy=h/2,mw=110,mh=30;
      ctx.setLineDash([6,10]);ctx.lineDashOffset=-t*36;
      ctx.strokeStyle='rgba(251,191,36,.5)';ctx.lineWidth=1.6;
      [60,95,130,165].forEach(L=>{
        ctx.beginPath();
        for(let th=.08;th<Math.PI-.08;th+=.06){
          const r=L*Math.sin(th)*Math.sin(th);
          const x=cx+r*Math.cos(th),y=cy-r*Math.sin(th);
          th<=.081?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
        ctx.beginPath();
        for(let th=.08;th<Math.PI-.08;th+=.06){
          const r=L*Math.sin(th)*Math.sin(th);
          const x=cx+r*Math.cos(th),y=cy+r*Math.sin(th);
          th<=.081?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle='#3b82f6';ctx.fillRect(cx-mw/2,cy-mh/2,mw/2,mh);
      ctx.fillStyle='#f43f5e';ctx.fillRect(cx,cy-mh/2,mw/2,mh);
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.strokeRect(cx-mw/2,cy-mh/2,mw,mh);
      ctx.fillStyle='#fff';ctx.font='bold 14px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('S',cx-mw/4,cy);ctx.fillText('N',cx+mw/4,cy);
    }
  },
  faraday:{
    title:'Ley de Faraday',tex:'\\nabla\\times\\mathbf{E}=-\\frac{\\partial\\mathbf{B}}{\\partial t}',
    desc:'Un campo magnético que cambia en el tiempo induce un campo eléctrico: si el circuito está cerrado, nace una corriente.',
    app:'Generadores eléctricos, transformadores, cocinas de inducción y la carga inalámbrica de tu móvil.',
    draw(ctx,w,h,t){
      const cy=h/2+20,ry=h*.22,x0=w*.62,sp=14,loops=5;
      const xm=w*.28+Math.sin(t*1.3)*w*.10;
      const emf=Math.cos(t*1.3);
      ctx.setLineDash([5,8]);ctx.lineDashOffset=-t*30;
      ctx.strokeStyle='rgba(148,163,184,.35)';ctx.lineWidth=1.4;
      [-ry*.4,0,ry*.4].forEach(dy=>{ctx.beginPath();ctx.moveTo(xm+52,cy+dy);ctx.lineTo(x0-8,cy+dy);ctx.stroke();});
      ctx.setLineDash([]);
      ctx.fillStyle='#3b82f6';ctx.fillRect(xm-50,cy-14,50,28);
      ctx.fillStyle='#f43f5e';ctx.fillRect(xm,cy-14,50,28);
      ctx.fillStyle='#fff';ctx.font='bold 13px "JetBrains Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('S',xm-25,cy);ctx.fillText('N',xm+25,cy);
      ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;
      for(let i=0;i<loops;i++){ctx.beginPath();ctx.ellipse(x0+i*sp,cy,8,ry,0,0,TAU);ctx.stroke();}
      const lx=x0+2*sp,ly=cy-ry-38;
      ctx.strokeStyle='#64748b';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x0,cy-ry);ctx.lineTo(x0,ly);ctx.lineTo(lx-14,ly);ctx.moveTo(lx+14,ly);ctx.lineTo(x0+4*sp,ly);ctx.lineTo(x0+4*sp,cy-ry);ctx.stroke();
      const glow=Math.abs(emf);
      ctx.fillStyle='rgba(250,204,21,'+(0.15+0.75*glow).toFixed(3)+')';
      ctx.shadowColor='rgba(250,204,21,.9)';ctx.shadowBlur=26*glow;
      ctx.beginPath();ctx.arc(lx,ly,13,0,TAU);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='#fde68a';ctx.stroke();
      const dir=emf>0?1:-1;
      ctx.fillStyle='rgba(253,224,71,.9)';
      [x0+14,x0+3*sp].forEach(ax=>{
        ctx.beginPath();
        ctx.moveTo(ax+6*dir,ly);ctx.lineTo(ax-4*dir,ly-5);ctx.lineTo(ax-4*dir,ly+5);ctx.closePath();ctx.fill();
      });
      ctx.fillStyle='rgba(148,163,184,.8)';ctx.font='11px "JetBrains Mono",monospace';
      ctx.fillText('corriente inducida',lx,ly+30);
    }
  },
  ampere:{
    title:'Ley de Ampère–Maxwell',tex:'\\nabla\\times\\mathbf{B}=\\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\frac{\\partial\\mathbf{E}}{\\partial t}',
    desc:'Las corrientes eléctricas —y los campos eléctricos variables— generan campos magnéticos circulares. El término añadido por Maxwell predijo las ondas electromagnéticas.',
    app:'Electroimanes, motores, altavoces, antenas… y la propia luz como onda electromagnética.',
    draw(ctx,w,h,t){
      const cx=w/2,cy=h/2;
      [36,62,88,114].forEach((R,i)=>{
        ctx.setLineDash([5,9]);ctx.lineDashOffset=-t*30;
        ctx.strokeStyle='rgba(34,211,238,'+(0.65-i*0.12).toFixed(2)+')';ctx.lineWidth=1.6;
        ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();ctx.setLineDash([]);
        const th=-t*.9+i*.8;
        const px=cx+Math.cos(th)*R,py=cy+Math.sin(th)*R;
        const tx=-Math.sin(th),ty=Math.cos(th);
        ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(ty,tx));
        ctx.fillStyle='rgba(103,232,249,.95)';
        ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5,-5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle='#0f172a';ctx.strokeStyle='#94a3b8';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,13,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#e2e8f0';ctx.beginPath();ctx.arc(cx,cy,3,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(148,163,184,.8)';ctx.font='11px "JetBrains Mono",monospace';ctx.textAlign='center';
      ctx.fillText('corriente saliendo de la pantalla ⊙',cx,cy+34);
    }
  }
};
function setMaxMode(m){
  currentMaxMode=m;
  const d=MODES[m];
  $('#maxTitle').textContent=d.title;
  $('#maxDesc').textContent=d.desc;
  $('#maxApp').textContent=d.app;
  if(window.katex) katex.render(d.tex,$('#maxTex'),{throwOnError:false,displayMode:true});
  $$('#maxTabs .tab').forEach(b=>{
    const on=b.dataset.mode===m;
    b.classList.toggle('border-cyan-300/60',on);
    b.classList.toggle('bg-cyan-400/10',on);
  });
}
window.__remax=()=>setMaxMode(currentMaxMode);
$$('#maxTabs .tab').forEach(b=>b.addEventListener('click',()=>setMaxMode(b.dataset.mode)));
function drawMax(t){const d=MODES[currentMaxMode];M.ctx.clearRect(0,0,M.w,M.h);d.draw(M.ctx,M.w,M.h,t);}

/* ---------- LABORATORIO DE CAMPOS ---------- */
const F=makeCanvas('fieldCanvas');
let charges=[{nx:.38,ny:.5,q:1},{nx:.62,ny:.5,q:-1}];
let tool='pos',dragCh=null;
$$('.tool-btn').forEach(b=>b.addEventListener('click',()=>{
  tool=b.dataset.tool;
  $$('.tool-btn').forEach(x=>x.classList.toggle('sel',x===b));
}));
$('#clearBtn').addEventListener('click',()=>{charges=[{nx:.38,ny:.5,q:1},{nx:.62,ny:.5,q:-1}];});
function fPos(e){const r=F.cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function findCharge(p){
  for(let i=charges.length-1;i>=0;i--){
    const c=charges[i];
    if(Math.hypot(p.x-c.nx*F.w,p.y-c.ny*F.h)<16) return c;
  }
  return null;
}
F.cv.addEventListener('pointerdown',e=>{
  const p=fPos(e),c=findCharge(p);
  if(c&&tool!=='erase'){dragCh=c;F.cv.setPointerCapture(e.pointerId);}
  else if(tool==='erase'){if(c)charges.splice(charges.indexOf(c),1);}
  else charges.push({nx:clamp(p.x/F.w,.02,.98),ny:clamp(p.y/F.h,.02,.98),q:tool==='pos'?1:-1});
});
F.cv.addEventListener('pointermove',e=>{
  if(!dragCh)return;
  const p=fPos(e);
  dragCh.nx=clamp(p.x/F.w,.02,.98);dragCh.ny=clamp(p.y/F.h,.02,.98);
});
F.cv.addEventListener('pointerup',()=>{dragCh=null;});
F.cv.addEventListener('dblclick',e=>{
  const c=findCharge(fPos(e));
  if(c)charges.splice(charges.indexOf(c),1);
});
function mix3(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
function drawField(t){
  const ctx=F.ctx,w=F.w,h=F.h;
  ctx.clearRect(0,0,w,h);
  const step=28;
  for(let gx=step/2;gx<w;gx+=step){
    for(let gy=step/2;gy<h;gy+=step){
      let Ex=0,Ey=0;
      for(const c of charges){
        const dx=gx-c.nx*w,dy=gy-c.ny*h;
        const d2=dx*dx+dy*dy+150;
        const d=Math.sqrt(d2);
        const f=c.q*6000/(d2*d);
        Ex+=f*dx;Ey+=f*dy;
      }
      const mag=Math.hypot(Ex,Ey);
      if(mag<0.06)continue;
      const ux=Ex/mag,uy=Ey/mag;
      const len=Math.min(12,2+mag*3);
      const tt=Math.min(1,mag/4);
      let col=tt<.5?mix3([71,85,105],[34,211,238],tt*2):mix3([34,211,238],[251,191,36],(tt-.5)*2);
      const al=.25+.6*tt;
      ctx.strokeStyle='rgba('+(col[0]|0)+','+(col[1]|0)+','+(col[2]|0)+','+al.toFixed(2)+')';
      ctx.lineWidth=1.5;
      const x1=gx-ux*len/2,y1=gy-uy*len/2,x2=gx+ux*len/2,y2=gy+uy*len/2;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
      ctx.lineTo(x2-ux*4-uy*2.5,y2-uy*4+ux*2.5);
      ctx.moveTo(x2,y2);
      ctx.lineTo(x2-ux*4+uy*2.5,y2-uy*4-ux*2.5);
      ctx.stroke();
    }
  }
  charges.forEach((c,i)=>{
    const px=c.nx*w,py=c.ny*h;
    const r=11*(1+0.08*Math.sin(t*3+i*2));
    ctx.shadowColor=c.q>0?'rgba(251,113,133,.9)':'rgba(56,189,248,.9)';
    ctx.shadowBlur=20;
    ctx.fillStyle=c.q>0?'#fb7185':'#38bdf8';
    ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px-5,py);ctx.lineTo(px+5,py);
    if(c.q>0){ctx.moveTo(px,py-5);ctx.lineTo(px,py+5);}
    ctx.stroke();
  });
}

/* ---------- ESPECTRO ---------- */
const S=makeCanvas('specWave');
const BANDS=[
  {name:'Ondas de radio',max:8.477,col:'#60a5fa',desc:'Emisoras de radio y televisión, radar y comunicaciones de larga distancia: atraviesan paredes y ciudades sin problema.'},
  {name:'Microondas',max:11.477,col:'#38bdf8',desc:'Wifi, Bluetooth, hornos microondas y antenas de telefonía móvil viven en esta banda.'},
  {name:'Infrarrojo',max:12.633,col:'#fb923c',desc:'El calor que sientes cerca de una fogata; mandos a distancia, cámaras térmicas y fibras ópticas.'},
  {name:'Luz visible',max:12.875,col:'#4ade80',desc:'La única franja del espectro que tus ojos detectan: un arcoíris de 380 a 750 nanómetros.'},
  {name:'Ultravioleta',max:14.477,col:'#c084fc',desc:'Llega del Sol: broncea, esteriliza superficies y hace brillar ciertos materiales.'},
  {name:'Rayos X',max:19.477,col:'#e2e8f0',desc:'Atraviesan tejido blando pero no el hueso: radiografías médicas y escáneres de seguridad.'},
  {name:'Rayos gamma',max:99,col:'#fb7185',desc:'Las ondas más energéticas del universo: supernovas, reactores nucleares y radioterapia contra el cáncer.'}
];
function waveRGB(nm){
  let r=0,g=0,b=0;
  if(nm<440){r=-(nm-440)/60;b=1;}
  else if(nm<490){g=(nm-440)/50;b=1;}
  else if(nm<510){g=1;b=-(nm-510)/20;}
  else if(nm<580){r=(nm-510)/70;g=1;}
  else if(nm<645){r=1;g=-(nm-645)/65;}
  else{r=1;}
  let f=1;
  if(nm>700)f=.3+.7*(750-nm)/50;else if(nm<420)f=.3+.7*(nm-380)/40;
  return [Math.round(255*Math.pow(r*f,.8)),Math.round(255*Math.pow(g*f,.8)),Math.round(255*Math.pow(b*f,.8))];
}
const specState={lf:4+620/1000*18,col:'#4ade80'};
function fmtFreq(f){
  const u=[[1e18,'EHz'],[1e15,'PHz'],[1e12,'THz'],[1e9,'GHz'],[1e6,'MHz'],[1e3,'kHz'],[1,'Hz']];
  for(const[v,n]of u)if(f>=v)return trimNum(f/v)+' '+n;
  return trimNum(f)+' Hz';
}
function fmtLen(m){
  const u=[[1e3,'km'],[1,'m'],[1e-2,'cm'],[1e-3,'mm'],[1e-6,'µm'],[1e-9,'nm'],[0,'pm']];
  for(const[v,n]of u){if(v===0)return trimNum(m/1e-12)+' pm';if(m>=v)return trimNum(m/v)+' '+n;}
}
function fmtE(e){
  const u=[[1e9,'GeV'],[1e6,'MeV'],[1e3,'keV'],[1,'eV'],[1e-3,'meV'],[1e-6,'µeV'],[0,'neV']];
  for(const[v,n]of u){if(v===0)return trimNum(e/1e-9)+' neV';if(e>=v)return trimNum(e/v)+' '+n;}
}
function updateSpectrum(){
  const v=+$('#specRange').value;
  const lf=4+v/1000*18;
  const f=Math.pow(10,lf);
  const lam=299792458/f;
  const band=BANDS.find(b=>lf<b.max);
  let col=band.col;
  const nm=lam*1e9;
  if(nm>=380&&nm<=750){const rgb=waveRGB(nm);col='rgb('+rgb.join(',')+')';}
  specState.lf=lf;specState.col=col;
  $('#fVal').textContent=fmtFreq(f);
  $('#lambdaVal').textContent=fmtLen(lam);
  $('#energyVal').textContent=fmtE(4.135667696e-15*f);
  $('#bandName').textContent=band.name;
  $('#bandSwatch').style.background=col;
  $('#bandDesc').textContent=band.desc;
  $('#specMarker').style.left=(v/10)+'%';
}
$('#specRange').addEventListener('input',updateSpectrum);
function drawSpec(t){
  const ctx=S.ctx,w=S.w,h=S.h;
  ctx.clearRect(0,0,w,h);
  const cycles=2+(specState.lf-4)/18*18;
  ctx.strokeStyle='rgba(148,163,184,.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
  ctx.beginPath();
  for(let x=0;x<=w;x+=3){
    const y=h/2+Math.sin(x/w*TAU*cycles - t*3)*h*.3;
    x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.strokeStyle=specState.col;ctx.lineWidth=2;
  ctx.shadowColor=specState.col;ctx.shadowBlur=10;
  ctx.stroke();ctx.shadowBlur=0;
}

/* ---------- LEY DE OHM ---------- */
const ohmV=$('#ohmV'),ohmR=$('#ohmR');
const ohmPath=$('#ohmPath');
const dotsG=$('#dotsG');
const ND=16;
for(let i=0;i<ND;i++){
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('r','2.6');c.setAttribute('fill','#7dd3fc');
  dotsG.appendChild(c);
}
let ohmLen=0,ohmOff=0,ohmI=0;
function updateOhm(){
  const V=parseFloat(ohmV.value),R=parseFloat(ohmR.value);
  ohmI=V/R;
  const P=V*ohmI;
  $('#vOut').textContent=trimNum(V)+' V';
  $('#rOut').textContent=trimNum(R)+' Ω';
  $('#iOut').textContent=ohmI<1?trimNum(ohmI*1000)+' mA':trimNum(ohmI)+' A';
  $('#pOut').textContent=P<1?trimNum(P*1000)+' mW':trimNum(P)+' W';
  const b=Math.min(1,P/48);
  const glow=$('#ledGlow');
  glow.setAttribute('opacity',(0.12+0.6*b).toFixed(2));
  glow.setAttribute('r',(14+12*b).toFixed(1));
  $('#ledCore').setAttribute('fill-opacity',(0.25+0.75*b).toFixed(2));
}
ohmV.addEventListener('input',updateOhm);
ohmR.addEventListener('input',updateOhm);
function drawOhm(dt){
  if(!ohmLen)ohmLen=ohmPath.getTotalLength();
  const speed=Math.min(260,30*ohmI);
  ohmOff=(ohmOff+speed*dt)%ohmLen;
  const dots=dotsG.children;
  for(let i=0;i<ND;i++){
    const p=ohmPath.getPointAtLength((ohmOff+i*ohmLen/ND)%ohmLen);
    dots[i].setAttribute('cx',p.x);dots[i].setAttribute('cy',p.y);
    dots[i].setAttribute('opacity',ohmI>0?'.9':'.25');
  }
}

/* ---------- CÓDIGO DE COLORES ---------- */
const DIG=[['negro','#111111',0],['marrón','#7c4a21',1],['rojo','#ef4444',2],['naranja','#f97316',3],['amarillo','#facc15',4],['verde','#22c55e',5],['azul','#3b82f6',6],['violeta','#8b5cf6',7],['gris','#94a3b8',8],['blanco','#f8fafc',9]];
const MULT=[['negro','#111111',1],['marrón','#7c4a21',10],['rojo','#ef4444',100],['naranja','#f97316',1e3],['amarillo','#facc15',1e4],['verde','#22c55e',1e5],['azul','#3b82f6',1e6],['violeta','#8b5cf6',1e7],['oro','#ca8a04',0.1],['plata','#cbd5e1',0.01]];
const TOL=[['marrón','#7c4a21','±1 %'],['rojo','#ef4444','±2 %'],['verde','#22c55e','±0,5 %'],['azul','#3b82f6','±0,25 %'],['violeta','#8b5cf6','±0,1 %'],['gris','#94a3b8','±0,05 %'],['oro','#ca8a04','±5 %'],['plata','#cbd5e1','±10 %']];
const sel={b1:1,b2:0,m:2,t:6};
function buildRow(id,arr,key){
  const row=document.getElementById(id);
  arr.forEach((it,idx)=>{
    const b=document.createElement('button');
    b.className='swatch h-7 w-7 rounded-full border-2 border-white/20 transition hover:scale-110';
    b.style.background=it[1];
    b.title=it[0];b.setAttribute('aria-label',it[0]);
    b.addEventListener('click',()=>{sel[key]=idx;renderResistor();});
    row.appendChild(b);
  });
}
buildRow('b1row',DIG,'b1');buildRow('b2row',DIG,'b2');buildRow('mrow',MULT,'m');buildRow('trow',TOL,'t');
function fmtOhm(v){
  if(v>=1e6)return trimNum(v/1e6)+' MΩ';
  if(v>=1e3)return trimNum(v/1e3)+' kΩ';
  return trimNum(v)+' Ω';
}
function renderResistor(){
  $('#band0').setAttribute('fill',DIG[sel.b1][1]);
  $('#band1').setAttribute('fill',DIG[sel.b2][1]);
  $('#band2').setAttribute('fill',MULT[sel.m][1]);
  $('#band3').setAttribute('fill',TOL[sel.t][1]);
  const v=(DIG[sel.b1][2]*10+DIG[sel.b2][2])*MULT[sel.m][1];
  $('#resVal').textContent=fmtOhm(v)+'  '+TOL[sel.t][2];
  const rows={b1row:'b1',b2row:'b2',mrow:'m',trow:'t'};
  Object.keys(rows).forEach(rid=>{
    const key=rows[rid];
    Array.from(document.getElementById(rid).children).forEach((b,i)=>b.classList.toggle('sel',i===sel[key]));
  });
}

/* ---------- CURIOSIDADES ---------- */
const FACTS=[
  'Un rayo alcanza unos 30 000 °C: casi cinco veces la temperatura de la superficie del Sol.',
  'Tu cerebro funciona con unos 20 W de potencia: menos que una bombilla LED potente.',
  'El primer transistor (1947) cabía en la palma de la mano; hoy tu móvil integra miles de millones en un chip.',
  'Si partes un imán por la mitad obtienes dos imanes completos: nunca un polo aislado.',
  'La luz visible es solo una franja diminuta del espectro electromagnético: el resto es invisible para ti.',
  'Las señales de tu wifi viajan a la velocidad de la luz: tardarían 1,3 segundos en llegar a la Luna.',
  'El GPS corrige los relojes de sus satélites por relatividad: sin ello, erraría por kilómetros cada día.',
  'El efecto túnel cuántico hace posibles las memorias flash… y la fusión nuclear del Sol.'
];
let factIdx=0,factTimer=null;
const factDots=$('#factDots');
FACTS.forEach((_,i)=>{
  const d=document.createElement('button');
  d.className='h-2 w-2 rounded-full bg-white/20 transition';
  d.setAttribute('aria-label','Dato '+(i+1));
  d.addEventListener('click',()=>{showFact(i);restartFactTimer();});
  factDots.appendChild(d);
});
function showFact(i){
  factIdx=(i+FACTS.length)%FACTS.length;
  const box=$('#factBox');
  box.style.opacity=0;
  setTimeout(()=>{box.textContent=FACTS[factIdx];box.style.opacity=1;},450);
  Array.from(factDots.children).forEach((d,j)=>d.className='h-2 w-2 rounded-full transition '+(j===factIdx?'bg-cyan-300':'bg-white/20'));
}
function restartFactTimer(){clearInterval(factTimer);factTimer=setInterval(()=>showFact(factIdx+1),7000);}
$('#factPrev').addEventListener('click',()=>{showFact(factIdx-1);restartFactTimer();});
$('#factNext').addEventListener('click',()=>{showFact(factIdx+1);restartFactTimer();});
$('#factBox').textContent=FACTS[0];
Array.from(factDots.children)[0].className='h-2 w-2 rounded-full transition bg-cyan-300';
restartFactTimer();

/* ---------- QUIZ ---------- */
const QS=[
  {q:'¿Quién formuló las cuatro ecuaciones que unifican electricidad y magnetismo?',o:['Isaac Newton','James Clerk Maxwell','Albert Einstein','Michael Faraday'],a:1,ex:'Maxwell las publicó en 1865 y, de paso, predijo las ondas electromagnéticas.'},
  {q:'¿Cuál es la velocidad de la luz en el vacío?',o:['300 000 km/s','300 000 km/h','30 000 km/s','3 000 000 km/s'],a:0,ex:'c ≈ 299 792 458 m/s: el límite de velocidad del universo.'},
  {q:'¿Qué ley relaciona voltaje, corriente y resistencia?',o:['Ley de Faraday','Ley de Ohm','Ley de Coulomb','Ley de Ampère'],a:1,ex:'V = I·R: la ecuación que sostiene toda la electrónica.'},
  {q:'¿Qué partícula lleva carga negativa en el átomo?',o:['Protón','Neutrón','Electrón','Fotón'],a:2,ex:'El electrón, descubierto por J. J. Thomson en 1897.'}
];
let qi=0,qScore=0;
function renderQuiz(){
  const box=$('#quiz');
  const q=QS[qi];
  box.innerHTML='<p class="font-code text-xs text-slate-500">Pregunta '+(qi+1)+' de '+QS.length+' · aciertos: '+qScore+'</p>'+
    '<h4 class="mt-2 text-lg font-semibold text-white">'+q.q+'</h4>'+
    '<div class="mt-4 grid gap-2">'+q.o.map((o,i)=>'<button data-i="'+i+'" class="qopt rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10">'+o+'</button>').join('')+'</div>'+
    '<p class="qex mt-4 hidden text-sm leading-relaxed text-slate-400"></p>'+
    '<button class="qnext mt-4 hidden rounded-full px-5 py-2.5 text-sm font-semibold text-slate-950 bg-gradient-to-b from-cyan-300 to-teal-400 hover:opacity-90 transition">'+(qi===QS.length-1?'Ver resultado':'Siguiente →')+'</button>';
  let answered=false;
  box.querySelectorAll('.qopt').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(answered)return;answered=true;
      const i=+btn.dataset.i;
      const opts=box.querySelectorAll('.qopt');
      opts.forEach((o,j)=>{
        o.style.pointerEvents='none';
        if(j===q.a){o.style.borderColor='rgba(52,211,153,.6)';o.style.background='rgba(52,211,153,.12)';}
        else if(j===i){o.style.borderColor='rgba(251,113,133,.6)';o.style.background='rgba(251,113,133,.12)';}
      });
      if(i===q.a)qScore++;
      const ex=box.querySelector('.qex');
      ex.textContent=(i===q.a?'✔ ¡Correcto! ':'✘ Casi. ')+q.ex;
      ex.classList.remove('hidden');
      box.querySelector('.qnext').classList.remove('hidden');
    });
  });
  box.querySelector('.qnext').addEventListener('click',()=>{
    if(qi<QS.length-1){qi++;renderQuiz();}
    else{
      const msg=qScore===QS.length?'¡Nivel Maxwell! Dominas las chispas.':qScore>=QS.length-1?'¡Muy bien! Casi perfecto, como un buen circuito.':qScore>=2?'Buen comienzo: la curiosidad ya está encendida.':'Todo gran científico empezó preguntando. ¡Sigue explorando!';
      box.innerHTML='<p class="font-code text-xs text-slate-500">Resultado final</p>'+
        '<p class="font-display mt-3 text-4xl font-bold text-white">'+qScore+'<span class="text-slate-500"> / '+QS.length+'</span></p>'+
        '<p class="mt-3 text-sm text-slate-300">'+msg+'</p>'+
        '<button class="qrestart mt-5 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-950 bg-gradient-to-b from-cyan-300 to-teal-400 hover:opacity-90 transition">Repetir quiz</button>';
      box.querySelector('.qrestart').addEventListener('click',()=>{qi=0;qScore=0;renderQuiz();});
    }
  });
}

/* ---------- REVEAL ---------- */
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

/* ---------- BUCLE PRINCIPAL ---------- */
let lastT=performance.now();
function loop(now){
  const t=now/1000;
  const dt=Math.min(.05,(now-lastT)/1000);
  lastT=now;
  drawHero(t);
  drawMax(t);
  drawField(t);
  drawSpec(t);
  drawOhm(dt);
  requestAnimationFrame(loop);
}

/* ---------- INIT ---------- */
setMaxMode('gaussE');
updateSpectrum();
updateOhm();
renderResistor();
renderQuiz();
renderMath();
scramble($('#heroTitle'));
requestAnimationFrame(loop);
})();
