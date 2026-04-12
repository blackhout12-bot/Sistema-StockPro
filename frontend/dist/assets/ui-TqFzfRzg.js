import{r as d}from"./vendor-VuXM2OFM.js";let W={data:""},G=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||W},Q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,X=/\/\*[^]*?\*\/|  +/g,P=/\n+/g,_=(e,t)=>{let o="",c="",n="";for(let r in e){let s=e[r];r[0]=="@"?r[1]=="i"?o=r+" "+s+";":c+=r[1]=="f"?_(s,r):r+"{"+_(s,r[1]=="k"?"":t)+"}":typeof s=="object"?c+=_(s,t?t.replace(/([^,])+/g,i=>r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,i):i?i+" "+l:l)):r):s!=null&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=_.p?_.p(r,s):r+":"+s+";")}return o+(t&&n?t+"{"+n+"}":n)+c},v={},O=e=>{if(typeof e=="object"){let t="";for(let o in e)t+=o+O(e[o]);return t}return e},Y=(e,t,o,c,n)=>{let r=O(e),s=v[r]||(v[r]=(l=>{let h=0,y=11;for(;h<l.length;)y=101*y+l.charCodeAt(h++)>>>0;return"go"+y})(r));if(!v[s]){let l=r!==e?e:(h=>{let y,p,k=[{}];for(;y=Q.exec(h.replace(X,""));)y[4]?k.shift():y[3]?(p=y[3].replace(P," ").trim(),k.unshift(k[0][p]=k[0][p]||{})):k[0][y[1]]=y[2].replace(P," ").trim();return k[0]})(e);v[s]=_(n?{["@keyframes "+s]:l}:l,o?"":"."+s)}let i=o&&v.g?v.g:null;return o&&(v.g=v[s]),((l,h,y,p)=>{p?h.data=h.data.replace(p,l):h.data.indexOf(l)===-1&&(h.data=y?l+h.data:h.data+l)})(v[s],t,c,i),s},J=(e,t,o)=>e.reduce((c,n,r)=>{let s=t[r];if(s&&s.call){let i=s(o),l=i&&i.props&&i.props.className||/^go/.test(i)&&i;s=l?"."+l:i&&typeof i=="object"?i.props?"":_(i,""):i===!1?"":i}return c+n+(s??"")},"");function z(e){let t=this||{},o=e.call?e(t.p):e;return Y(o.unshift?o.raw?J(o,[].slice.call(arguments,1),t.p):o.reduce((c,n)=>Object.assign(c,n&&n.call?n(t.p):n),{}):o,G(t.target),t.g,t.o,t.k)}let I,H,L;z.bind({g:1});let x=z.bind({k:1});function e1(e,t,o,c){_.p=t,I=e,H=o,L=c}function M(e,t){let o=this||{};return function(){let c=arguments;function n(r,s){let i=Object.assign({},r),l=i.className||n.className;o.p=Object.assign({theme:H&&H()},i),o.o=/ *go\d+/.test(l),i.className=z.apply(o,c)+(l?" "+l:"");let h=e;return e[0]&&(h=i.as||e,delete i.as),L&&h[0]&&L(i),I(h,i)}return n}}var t1=e=>typeof e=="function",C=(e,t)=>t1(e)?e(t):e,a1=(()=>{let e=0;return()=>(++e).toString()})(),R=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),o1=20,V="default",T=(e,t)=>{let{toastLimit:o}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,o)};case 1:return{...e,toasts:e.toasts.map(s=>s.id===t.toast.id?{...s,...t.toast}:s)};case 2:let{toast:c}=t;return T(e,{type:e.toasts.find(s=>s.id===c.id)?1:0,toast:c});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(s=>s.id===n||n===void 0?{...s,dismissed:!0,visible:!1}:s)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(s=>s.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let r=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(s=>({...s,pauseDuration:s.pauseDuration+r}))}}},N=[],U={toasts:[],pausedAt:void 0,settings:{toastLimit:o1}},f={},B=(e,t=V)=>{f[t]=T(f[t]||U,e),N.forEach(([o,c])=>{o===t&&c(f[t])})},F=e=>Object.keys(f).forEach(t=>B(e,t)),s1=e=>Object.keys(f).find(t=>f[t].toasts.some(o=>o.id===e)),A=(e=V)=>t=>{B(t,e)},c1={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},r1=(e={},t=V)=>{let[o,c]=d.useState(f[t]||U),n=d.useRef(f[t]);d.useEffect(()=>(n.current!==f[t]&&c(f[t]),N.push([t,c]),()=>{let s=N.findIndex(([i])=>i===t);s>-1&&N.splice(s,1)}),[t]);let r=o.toasts.map(s=>{var i,l,h;return{...e,...e[s.type],...s,removeDelay:s.removeDelay||((i=e[s.type])==null?void 0:i.removeDelay)||e?.removeDelay,duration:s.duration||((l=e[s.type])==null?void 0:l.duration)||e?.duration||c1[s.type],style:{...e.style,...(h=e[s.type])==null?void 0:h.style,...s.style}}});return{...o,toasts:r}},n1=(e,t="blank",o)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...o,id:o?.id||a1()}),b=e=>(t,o)=>{let c=n1(t,e,o);return A(c.toasterId||s1(c.id))({type:2,toast:c}),c.id},u=(e,t)=>b("blank")(e,t);u.error=b("error");u.success=b("success");u.loading=b("loading");u.custom=b("custom");u.dismiss=(e,t)=>{let o={type:3,toastId:e};t?A(t)(o):F(o)};u.dismissAll=e=>u.dismiss(void 0,e);u.remove=(e,t)=>{let o={type:4,toastId:e};t?A(t)(o):F(o)};u.removeAll=e=>u.remove(void 0,e);u.promise=(e,t,o)=>{let c=u.loading(t.loading,{...o,...o?.loading});return typeof e=="function"&&(e=e()),e.then(n=>{let r=t.success?C(t.success,n):void 0;return r?u.success(r,{id:c,...o,...o?.success}):u.dismiss(c),n}).catch(n=>{let r=t.error?C(t.error,n):void 0;r?u.error(r,{id:c,...o,...o?.error}):u.dismiss(c)}),e};var i1=1e3,d1=(e,t="default")=>{let{toasts:o,pausedAt:c}=r1(e,t),n=d.useRef(new Map).current,r=d.useCallback((p,k=i1)=>{if(n.has(p))return;let m=setTimeout(()=>{n.delete(p),s({type:4,toastId:p})},k);n.set(p,m)},[]);d.useEffect(()=>{if(c)return;let p=Date.now(),k=o.map(m=>{if(m.duration===1/0)return;let w=(m.duration||0)+m.pauseDuration-(p-m.createdAt);if(w<0){m.visible&&u.dismiss(m.id);return}return setTimeout(()=>u.dismiss(m.id,t),w)});return()=>{k.forEach(m=>m&&clearTimeout(m))}},[o,c,t]);let s=d.useCallback(A(t),[t]),i=d.useCallback(()=>{s({type:5,time:Date.now()})},[s]),l=d.useCallback((p,k)=>{s({type:1,toast:{id:p,height:k}})},[s]),h=d.useCallback(()=>{c&&s({type:6,time:Date.now()})},[c,s]),y=d.useCallback((p,k)=>{let{reverseOrder:m=!1,gutter:w=8,defaultPosition:E}=k||{},j=o.filter(g=>(g.position||E)===(p.position||E)&&g.height),K=j.findIndex(g=>g.id===p.id),D=j.filter((g,q)=>q<K&&g.visible).length;return j.filter(g=>g.visible).slice(...m?[D+1]:[0,D]).reduce((g,q)=>g+(q.height||0)+w,0)},[o]);return d.useEffect(()=>{o.forEach(p=>{if(p.dismissed)r(p.id,p.removeDelay);else{let k=n.get(p.id);k&&(clearTimeout(k),n.delete(p.id))}})},[o,r]),{toasts:o,handlers:{updateHeight:l,startPause:i,endPause:h,calculateOffset:y}}},l1=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,h1=x`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,y1=x`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,p1=M("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${l1} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${h1} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${y1} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,k1=x`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,u1=M("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${k1} 1s linear infinite;
`,m1=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,g1=x`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,f1=M("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${m1} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${g1} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,v1=M("div")`
  position: absolute;
`,x1=M("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,_1=x`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,M1=M("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${_1} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,b1=({toast:e})=>{let{icon:t,type:o,iconTheme:c}=e;return t!==void 0?typeof t=="string"?d.createElement(M1,null,t):t:o==="blank"?null:d.createElement(x1,null,d.createElement(u1,{...c}),o!=="loading"&&d.createElement(v1,null,o==="error"?d.createElement(p1,{...c}):d.createElement(f1,{...c})))},w1=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,$1=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,N1="0%{opacity:0;} 100%{opacity:1;}",C1="0%{opacity:1;} 100%{opacity:0;}",z1=M("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,A1=M("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,j1=(e,t)=>{let o=e.includes("top")?1:-1,[c,n]=R()?[N1,C1]:[w1(o),$1(o)];return{animation:t?`${x(c)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${x(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},q1=d.memo(({toast:e,position:t,style:o,children:c})=>{let n=e.height?j1(e.position||t||"top-center",e.visible):{opacity:0},r=d.createElement(b1,{toast:e}),s=d.createElement(A1,{...e.ariaProps},C(e.message,e));return d.createElement(z1,{className:e.className,style:{...n,...o,...e.style}},typeof c=="function"?c({icon:r,message:s}):d.createElement(d.Fragment,null,r,s))});e1(d.createElement);var H1=({id:e,className:t,style:o,onHeightUpdate:c,children:n})=>{let r=d.useCallback(s=>{if(s){let i=()=>{let l=s.getBoundingClientRect().height;c(e,l)};i(),new MutationObserver(i).observe(s,{subtree:!0,childList:!0,characterData:!0})}},[e,c]);return d.createElement("div",{ref:r,className:t,style:o},n)},L1=(e,t)=>{let o=e.includes("top"),c=o?{top:0}:{bottom:0},n=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:R()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(o?1:-1)}px)`,...c,...n}},V1=z`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,$=16,wt=({reverseOrder:e,position:t="top-center",toastOptions:o,gutter:c,children:n,toasterId:r,containerStyle:s,containerClassName:i})=>{let{toasts:l,handlers:h}=d1(o,r);return d.createElement("div",{"data-rht-toaster":r||"",style:{position:"fixed",zIndex:9999,top:$,left:$,right:$,bottom:$,pointerEvents:"none",...s},className:i,onMouseEnter:h.startPause,onMouseLeave:h.endPause},l.map(y=>{let p=y.position||t,k=h.calculateOffset(y,{reverseOrder:e,gutter:c,defaultPosition:t}),m=L1(p,k);return d.createElement(H1,{id:y.id,key:y.id,onHeightUpdate:h.updateHeight,className:y.visible?V1:"",style:m},y.type==="custom"?C(y.message,y):n?n(y):d.createElement(q1,{toast:y,position:p}))}))},$t=u;const Z=(...e)=>e.filter((t,o,c)=>!!t&&t.trim()!==""&&c.indexOf(t)===o).join(" ").trim();const E1=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();const D1=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,o,c)=>c?c.toUpperCase():o.toLowerCase());const S=e=>{const t=D1(e);return t.charAt(0).toUpperCase()+t.slice(1)};var P1={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};const S1=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1};const O1=d.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:c,className:n="",children:r,iconNode:s,...i},l)=>d.createElement("svg",{ref:l,...P1,width:t,height:t,stroke:e,strokeWidth:c?Number(o)*24/Number(t):o,className:Z("lucide",n),...!r&&!S1(i)&&{"aria-hidden":"true"},...i},[...s.map(([h,y])=>d.createElement(h,y)),...Array.isArray(r)?r:[r]]));const a=(e,t)=>{const o=d.forwardRef(({className:c,...n},r)=>d.createElement(O1,{ref:r,iconNode:t,className:Z(`lucide-${E1(S(e))}`,`lucide-${e}`,c),...n}));return o.displayName=S(e),o};const I1=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],Nt=a("activity",I1);const R1=[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]],Ct=a("arrow-down-right",R1);const T1=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],zt=a("arrow-left",T1);const U1=[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]],At=a("arrow-right-left",U1);const B1=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],jt=a("arrow-right",B1);const F1=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],qt=a("arrow-up-right",F1);const Z1=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],Ht=a("bell",Z1);const K1=[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]],Lt=a("box",K1);const W1=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],Vt=a("building-2",W1);const G1=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],Et=a("calculator",G1);const Q1=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],Dt=a("calendar",Q1);const X1=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],Pt=a("chart-column",X1);const Y1=[["path",{d:"M5 21v-6",key:"1hz6c0"}],["path",{d:"M12 21V3",key:"1lcnhd"}],["path",{d:"M19 21V9",key:"unv183"}]],St=a("chart-no-axes-column",Y1);const J1=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],Ot=a("check",J1);const ee=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],It=a("chevron-down",ee);const te=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],Rt=a("chevron-left",te);const ae=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],Tt=a("chevron-right",ae);const oe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Ut=a("circle-alert",oe);const se=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 8v8",key:"napkw2"}],["path",{d:"m8 12 4 4 4-4",key:"k98ssh"}]],Bt=a("circle-arrow-down",se);const ce=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 12-4-4-4 4",key:"177agl"}],["path",{d:"M12 16V8",key:"1sbj14"}]],Ft=a("circle-arrow-up",ce);const re=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Zt=a("circle-check-big",re);const ne=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Kt=a("circle-check",ne);const ie=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],Wt=a("circle-plus",ie);const de=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],Gt=a("circle-x",de);const le=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]],Qt=a("clock",le);const he=[["path",{d:"M12 13v8",key:"1l5pq0"}],["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"m8 17 4-4 4 4",key:"1quai1"}]],Xt=a("cloud-upload",he);const ye=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Yt=a("copy",ye);const pe=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],Jt=a("cpu",pe);const ke=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],ea=a("credit-card",ke);const ue=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],ta=a("crown",ue);const me=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],aa=a("database",me);const ge=[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]],oa=a("dollar-sign",ge);const fe=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],sa=a("download",fe);const ve=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],ca=a("eye-off",ve);const xe=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],ra=a("eye",xe);const _e=[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],na=a("file-text",_e);const Me=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],ia=a("funnel",Me);const be=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],da=a("globe",be);const we=[["path",{d:"m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9",key:"1hayfq"}],["path",{d:"m18 15 4-4",key:"16gjal"}],["path",{d:"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",key:"15ts47"}]],la=a("hammer",we);const $e=[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]],ha=a("hash",$e);const Ne=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],ya=a("history",Ne);const Ce=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],pa=a("image",Ce);const ze=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],ka=a("info",ze);const Ae=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]],ua=a("key",Ae);const je=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],ma=a("layers",je);const qe=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],ga=a("layout-dashboard",qe);const He=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],fa=a("layout-grid",He);const Le=[["path",{d:"M3 5h.01",key:"18ugdj"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 19h.01",key:"noohij"}],["path",{d:"M8 5h13",key:"1pao27"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 19h13",key:"m83p4d"}]],va=a("list",Le);const Ve=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],xa=a("loader-circle",Ve);const Ee=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],_a=a("lock",Ee);const De=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],Ma=a("log-out",De);const Pe=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],ba=a("mail",Pe);const Se=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],wa=a("map-pin",Se);const Oe=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],$a=a("menu",Oe);const Ie=[["path",{d:"M5 12h14",key:"1ays0h"}]],Na=a("minus",Ie);const Re=[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]],Ca=a("network",Re);const Te=[["path",{d:"M12 22V12",key:"d0xqtd"}],["path",{d:"m16 17 2 2 4-4",key:"uh5qu3"}],["path",{d:"M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753",key:"kpkbpo"}],["path",{d:"M3.29 7 12 12l8.71-5",key:"19ckod"}],["path",{d:"m7.5 4.27 8.997 5.148",key:"9yrvtv"}]],za=a("package-check",Te);const Ue=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Aa=a("package",Ue);const Be=[["path",{d:"M13 21h8",key:"1jsn5i"}],["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],ja=a("pen-line",Be);const Fe=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],qa=a("pen",Fe);const Ze=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],Ha=a("phone",Ze);const Ke=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],La=a("plus",Ke);const We=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],Va=a("qr-code",We);const Ge=[["path",{d:"M12 17V7",key:"pyj7ub"}],["path",{d:"M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8",key:"1elt7d"}],["path",{d:"M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z",key:"ycz6yz"}]],Ea=a("receipt",Ge);const Qe=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],Da=a("refresh-cw",Qe);const Xe=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],Pa=a("save",Xe);const Ye=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],Sa=a("search",Ye);const Je=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Oa=a("settings",Je);const et=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],Ia=a("shield-alert",et);const tt=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Ra=a("shield-check",tt);const at=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],Ta=a("shield",at);const ot=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],Ua=a("shopping-bag",ot);const st=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],Ba=a("shopping-cart",st);const ct=[["path",{d:"M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344",key:"2acyp4"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Fa=a("square-check-big",ct);const rt=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],Za=a("square-pen",rt);const nt=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]],Ka=a("square",nt);const it=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],Wa=a("star",it);const dt=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]],Ga=a("store",dt);const lt=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],Qa=a("trash-2",lt);const ht=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],Xa=a("trending-up",ht);const yt=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Ya=a("triangle-alert",yt);const pt=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],Ja=a("truck",pt);const kt=[["path",{d:"M9 14 4 9l5-5",key:"102s5s"}],["path",{d:"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",key:"f3b9sd"}]],e0=a("undo-2",kt);const ut=[["path",{d:"m16 11 2 2 4-4",key:"9rsbq5"}],["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],t0=a("user-check",ut);const mt=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],a0=a("user-plus",mt);const gt=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]],o0=a("user-x",gt);const ft=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],s0=a("user",ft);const vt=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],c0=a("users",vt);const xt=[["path",{d:"M18 21a8 8 0 0 0-16 0",key:"3ypg7q"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",key:"10s06x"}]],r0=a("users-round",xt);const _t=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],n0=a("x",_t);const Mt=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],i0=a("zap",Mt);export{Lt as $,jt as A,Vt as B,Ot as C,wt as D,Da as E,na as F,Ya as G,la as H,oa as I,Qa as J,Qt as K,_a as L,ba as M,Ca as N,ka as O,Aa as P,Va as Q,Ea as R,Ua as S,Ja as T,s0 as U,La as V,Na as W,n0 as X,ea as Y,i0 as Z,qt as _,Ta as a,Wt as a0,Za as a1,Pa as a2,ma as a3,Rt as a4,Xt as a5,ia as a6,Ut as a7,Dt as a8,ra as a9,Nt as aA,e0 as aB,Fa as aC,Ka as aD,qa as aa,Ha as ab,wa as ac,sa as ad,Et as ae,za as af,Ct as ag,ja as ah,ua as ai,t0 as aj,o0 as ak,ca as al,pa as am,Pt as an,ha as ao,da as ap,ta as aq,Xa as ar,Ft as as,Bt as at,Gt as au,aa as av,a0 as aw,fa as ax,Jt as ay,zt as az,Ra as b,Ht as c,Sa as d,xa as e,c0 as f,Ia as g,Kt as h,Yt as i,It as j,$a as k,Ga as l,Ma as m,u as n,Tt as o,va as p,Oa as q,St as r,Wa as s,ya as t,r0 as u,Ba as v,At as w,ga as x,Zt as y,$t as z};
