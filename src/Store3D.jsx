import React,{Suspense,useRef,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {Move,Hand,Navigation} from 'lucide-react';
import World from './game/World.jsx';
import Player from './game/Player.jsx';
import Trolley from './game/Trolley.jsx';

function SceneFailure({error,onRetry,onBrowse}) {
  const message=error?.message||'WebGL 2 is unavailable in this browser.';
  const graphics=/webgl|graphics context|context.*lost|gpu/i.test(message);
  return <div className="scene-fallback" role="alert">
    <h2>{graphics?'3D graphics could not start':'The 3D scene stopped'}</h2>
    {graphics?<>
      <p>The store needs WebGL 2. If graphics acceleration is disabled, enable it and relaunch your browser.</p>
      <ol className="graphics-steps"><li>In Chrome, open <code>chrome://settings/system</code>.</li><li>Turn on <strong>Use graphics acceleration when available</strong>.</li><li>Click <strong>Relaunch</strong>, then return to this store.</li></ol>
    </>:<p>An unexpected scene error occurred. Try opening the 3D view again.</p>}
    <div className="graphics-actions"><button onClick={onRetry}>Retry 3D view</button>{onBrowse&&<button className="secondary" onClick={onBrowse}>Shop product list</button>}</div>
    <details className="graphics-details"><summary>Technical details</summary><pre>{message}</pre></details>
  </div>;
}
class SceneBoundary extends React.Component {
  state={error:null};
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error){console.error('3D scene:',error);this.props.onFailure?.();}
  render(){return this.state.error?<SceneFailure error={this.state.error} onRetry={this.props.onRetry} onBrowse={this.props.onBrowse}/>:this.props.children;}
}
export default function Store3D({products,cartItems=[],paused,onInspect,onCart,onReady,onBrowse}){
  const input=useRef({move:{x:0,z:0},look:{x:0,y:0}});
  const worldRef=useRef();const drag=useRef(null);const joystick=useRef(null);
  const [target,setTarget]=useState(null),[status,setStatus]=useState('ready');
  const [stick,setStick]=useState({x:0,y:0});
  const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
  function failure(){setFailed(true);setTarget(null);onReady?.();}
  function retry(){setFailed(false);setAttempt(n=>n+1);}

  const coarse=typeof matchMedia!=='undefined'&&matchMedia('(pointer: coarse)').matches;
  const trolleyCount=cartItems.reduce((sum,p)=>sum+p.quantity,0);
  const hiddenItems=Math.max(0,trolleyCount-(coarse?12:24));
  function inspect(p){if(p?.checkout)onCart();else if(p)onInspect(p);}
  function touchStart(e){if(paused||document.pointerLockElement||e.target.closest('button')||e.target.closest('.joystick'))return;if(e.pointerType==='mouse'&&e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};}
  function touchMove(e){const d=drag.current;if(!d||d.id!==e.pointerId||paused||document.pointerLockElement)return;input.current.look.x+=e.clientX-d.x;input.current.look.y+=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;}
  function stickMove(e){if(!joystick.current)return;const rect=e.currentTarget.getBoundingClientRect();let x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;const m=Math.max(1,Math.hypot(x,y)/35);x/=m;y/=m;input.current.move={x:x/35,z:y/35};setStick({x,y});}
  function stop(){joystick.current=null;input.current.move={x:0,z:0};setStick({x:0,y:0});}
  return <div className="game-viewport" onPointerDown={touchStart} onPointerMove={touchMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
    <SceneBoundary key={attempt} onFailure={failure} onRetry={retry} onBrowse={onBrowse}><Suspense fallback={<div className="scene-fallback">Preparing the store…</div>}>        <Canvas fallback={<p>Your browser cannot display a 3D canvas. Use the product list in the header.</p>} shadows={!coarse} dpr={[1,coarse?1.25:1.75]} camera={{position:[0,1.68,14],fov:68,near:.06,far:78}} gl={{antialias:!coarse,powerPreference:'default'}} onCreated={({gl})=>{gl.domElement.setAttribute('aria-label','Interactive 3D supermarket');onReady?.();}}>
      <color attach="background" args={['#c8d7ca']}/><fog attach="fog" args={['#d9e0d6',27,68]}/>
      <World products={products} target={target} onInspect={inspect} onCheckout={onCart} paused={paused} worldRef={worldRef}/>
      <Player paused={paused} input={input} onTarget={setTarget} onInspect={inspect} onCart={onCart} onStatus={setStatus} worldRef={worldRef}/>
      <Trolley items={cartItems} coarse={coarse}/>
    </Canvas></Suspense></SceneBoundary>
    {!paused&&!failed&&<><div className={`crosshair ${target?'has-target':''}`} aria-hidden="true"/>
      {target&&<button className="interaction-prompt" onClick={()=>inspect(target)}><Hand size={18}/><span><b>{target.name}</b><small>{coarse?'Tap to inspect':'Press E or click to inspect'}</small></span><kbd>E</kbd></button>}
      <button className="trolley-summary" onClick={onCart} aria-label={`Open trolley, ${trolleyCount} items`}><span>Your trolley</span><strong>{trolleyCount} {trolleyCount===1?'item':'items'}</strong>{hiddenItems>0&&<small>+{hiddenItems} more in cart</small>}</button>
      <div className="game-controls"><Move size={17}/><span>{coarse?'Left thumb to walk. Drag to look.':status==='locked'?'W A S D to walk   /   E to inspect   /   C for cart   /   Esc to release':'Click to explore   /   W A S D to walk   /   Drag to look'}</span></div>
      <div className="mobile-gamepad"><div className="joystick" role="application" aria-label="Movement joystick" onPointerDown={e=>{e.stopPropagation();joystick.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);stickMove(e);}} onPointerMove={e=>{e.stopPropagation();if(e.pointerId===joystick.current)stickMove(e);}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><Navigation size={17}/><span style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/></div><button className="touch-interact" disabled={!target} aria-label="Inspect nearby product" onClick={()=>inspect(target)}><Hand size={24}/></button></div>
    </>}
  </div>;
}
