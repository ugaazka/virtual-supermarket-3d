import React,{useMemo,useEffect} from 'react';
import * as THREE from 'three';
import {SHELVES,COUNTERS,assignPlacements,placement,REACH} from '../../shared/store.js';
import ProductModel from './ProductModel.jsx';
function Box({position,size,color='#e7e9e3',roughness=.65,metalness=0,emissive='#000000',emissiveIntensity=0,...props}){return <mesh position={position} receiveShadow onClick={e=>{if(!e.object.parent?.userData.checkout)e.stopPropagation();}} {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive} emissiveIntensity={emissiveIntensity}/></mesh>;}
function Sign({text,sub='',position,rotation=[0,0,0],width=3,height=.65,dark=true}){
  const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=dark?'#234a3c':'#f4f3ec';ctx.fillRect(0,0,768,192);ctx.textAlign='center';ctx.fillStyle=dark?'#f1f6e9':'#234a3c';ctx.font='bold 55px sans-serif';ctx.fillText(text,384,sub?90:115,710);if(sub){ctx.font='25px sans-serif';ctx.fillText(sub,384,145,700);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[text,sub,dark]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={position} rotation={rotation}><planeGeometry args={[width,height]}/><meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={.8}/></mesh>;
}
function TileFloor(){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#d9ddd5';x.fillRect(0,0,256,256);x.strokeStyle='#b9c1b9';x.lineWidth=2;x.strokeRect(1,1,254,254);x.strokeStyle='#eef1eb';x.lineWidth=7;x.strokeRect(5,5,246,246);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(13,17);t.anisotropy=4;return t;},[]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,.002,0]}><planeGeometry args={[30,39]}/><meshStandardMaterial map={texture} roughness={.72}/></mesh>;
}
function Shelf({shelf}){return <group position={[shelf.x,0,shelf.z]}>
  <Box position={[0,1.1,0]} size={[.09,2.2,6]} color="#7f9188" metalness={.35}/>
  {[-2.95,2.95].map(z=> <React.Fragment key={z}>{[-.73,.73].map(x=> <Box key={x} position={[x,1.16,z]} size={[.065,2.32,.065]} color="#87998d"/> )}</React.Fragment> )}
  {[.4,1.05,1.7,2.35].map(y=> <React.Fragment key={y}><Box position={[0,y,0]} size={[1.65,.075,6.05]} color="#eef0e9"/>{[-.84,.84].map(x=> <Box key={x} position={[x,y-.025,0]} size={[.035,.13,6.05]} color="#2f5945"/> )}</React.Fragment> )}
  <Box position={[0,.17,0]} size={[1.65,.34,6]} color="#263d34"/>
  <Sign text={shelf.category.toUpperCase()} sub={`AISLE ${shelf.id.split('-')[1]}`} position={[0,3.05,0]} width={3.3} height={.85}/>
  {[-1.15,1.15].map(x=> <Box key={x} position={[x,3.68,0]} size={[.02,.5,.02]} color="#64786a"/>)}
</group>;}
function Trolley(){return <group position={[-11,0,12]} rotation={[0,.2,0]}>
  {[.25,.75].map(y=> <Box key={y} position={[0,y,0]} size={[1.05,.035,1.5]} color="#85978d"/>)}
  {Array.from({length:10},(_,i)=> <React.Fragment key={i}>{[-.52,.52].map(x=> <Box key={x} position={[x,.62,-.65+i*.15]} size={[.022,.7,.022]} color="#a3b6ad"/> )}</React.Fragment> )}
  {[-.5,.5].map(x=> <Box key={x} position={[x,1,0]} size={[.04,.04,1.6]} color="#b8c8c0"/>)}
  <Box position={[0,1.1,.9]} size={[1.1,.075,.075]} color="#204b3b"/>
  {[-.4,.4].map(x=>[-.55,.55].map(z=> <mesh key={`${x}:${z}`} position={[x,.14,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,.07,12]}/><meshStandardMaterial color="#34423b"/></mesh> ))}
</group>;}
function PromoIsland({position,color='#b58a43',label='WEEKLY PICKS'}){
 return <group position={position} userData={{ignoreRay:true}}>
  <Box position={[0,.48,0]} size={[2.8,.96,1.35]} color="#344d40" roughness={.5}/>
  <Box position={[0,1.02,0]} size={[2.95,.08,1.45]} color="#eee9d9"/>
  <Box position={[0,1.36,0]} size={[2.2,.5,.06]} color={color} roughness={.42}/>
  <Sign text={label} position={[0,1.36,.055]} width={2.05} height={.42} dark={false}/>
 </group>;
}
function EntryArch(){
 return <group userData={{ignoreRay:true}}>
  <Box position={[-8,2.3,18.55]} size={[.28,4.6,.24]} color="#6e8178" metalness={.35}/>
  <Box position={[8,2.3,18.55]} size={[.28,4.6,.24]} color="#6e8178" metalness={.35}/>
  <Box position={[0,4.45,18.55]} size={[16,.28,.24]} color="#6e8178" metalness={.35}/>
  <Sign text="SUUQVERSE MARKET" sub="Fresh food • everyday essentials" position={[0,3.55,18.42]} rotation={[0,Math.PI,0]} width={7.4} height={1.05}/>
 </group>;
}
export default function World({products,target,onInspect,onCheckout,paused,worldRef}){
  const {placed}=useMemo(()=>assignPlacements(products),[products]);
  const filled=useMemo(()=>{const slots=[...placed];
    for(const shelf of SHELVES){
      const stock=placed.filter(p=>p.shelfId===shelf.id);if(!stock.length)continue;
      for(let slot=0;slot<18;slot++){
        if(stock.some(p=>p.slot===slot))continue;
        const item=stock[slot%stock.length];
        slots.push({...item,slot,...placement(shelf.id,slot)});
      }
    }
    return slots;},[placed]);
  const batches=useMemo(()=>{const groups=new Map();
    for(const item of filled){
      if(item.product.stock<1)continue;
      const group=groups.get(item.product._id)||{product:item.product,copies:[]};
      for(const offset of [-.5,0,.5])group.copies.push({position:[item.position[0],item.position[1],item.position[2]-offset*Math.sign(item.rotation)],rotation:item.rotation});
      groups.set(item.product._id,group);
    }
    return [...groups.values()];},[filled]);
  function select(e,p){e.stopPropagation();if(paused||document.pointerLockElement||e.delta>7||e.distance>REACH)return;e.nativeEvent?.preventDefault();e.sourceEvent?.preventDefault();onInspect(p);}
  return <group ref={worldRef}>
    {[-9,-3,3,9].map(x=> <pointLight key={x} intensity={1.8} distance={13} decay={2} color="#fff7df" position={[x,3.95,0]}/> )}
    <ambientLight intensity={.7} />
    <hemisphereLight args={['#f7fff5','#65756a',1.2]} />
    <directionalLight position={[8,12,8]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-.001} />
    <TileFloor />
    {[-15,15].map(x=> <Box key={x} position={[x,2.1,0]} size={[.3,4.2,39]} color="#e4e9df"/>)}
    <Box position={[0,2.1,-19.4]} size={[30,4.2,.3]} color="#e3e8de"/>
    <Box position={[0,4.3,0]} size={[30,.2,39]} color="#e8e9e3"/>
    {[-9,-3,3,9].map(x=> <group key={`ceiling-${x}`} position={[x,4.18,0]}><Box position={[0,0,0]} size={[.16,.08,37]} color="#aeb8af"/><Box position={[0,-.06,0]} size={[.1,.025,35]} color="#fffbea" emissive="#fff5c8" emissiveIntensity={1.6}/></group>)}
    {[-10,-5,0,5,10].map(x=>[-11,-3,5,12].map(z=> <group key={`${x}:${z}`} position={[x,4.16,z]}>
      <Box position={[0,0,0]} size={[.26,.08,3.5]} color="#9bab9d"/>
      <mesh position={[0,-.05,0]}><boxGeometry args={[.19,.025,3.35]}/><meshStandardMaterial color="#fbfff0" emissive="#efffdb" emissiveIntensity={2.3}/></mesh>
    </group> ))}
    <Sign text="SUUQVERSE" sub="Fresh finds. Everyday essentials." position={[0,3.05,-19.22]} width={7} height={1.3}/>
    <Sign text="FRESH MARKET" position={[-12.8,2.9,-5]} rotation={[0,Math.PI/2,0]} width={4}/>
    <Sign text="EVERYDAY ESSENTIALS" position={[12.8,2.9,2]} rotation={[0,-Math.PI/2,0]} width={5}/>
    <EntryArch />
    <PromoIsland position={[-10,0,10]} color="#bd8a43" label="FRESH TODAY"/>
    <PromoIsland position={[10,0,10]} color="#6d8d78" label="VALUE PICKS"/>
    <PromoIsland position={[0,0,-13]} color="#aa6e58" label="NEW IN STORE"/>
    {/* Glass storefront */}
    {[-9,-4,4,9].map(x=> <group key={x}>
      <mesh position={[x,2,19.25]}>
        <boxGeometry args={[x===-9||x===9?7:3,4,.07]}/>
        <meshStandardMaterial color="#accfc0" metalness={.1} roughness={.18} transparent opacity={.32}/>
      </mesh>
      <Box position={[x,2,19.31]} size={[.055,4,.06]} color="#7e9584"/>
    </group> )}
    <Sign text="WELCOME TO SUUQVERSE" sub="Your neighborhood, reimagined." position={[0,3.1,19.16]} rotation={[0,Math.PI,0]} width={5} height={1}/>
    <Box position={[0,.015,17.35]} size={[3,.025,2]} color="#4c6657"/>
    {SHELVES.map(s=> <Shelf key={s.id} shelf={s}/>)}
    {batches.map(({product:p,copies})=> <group key={p._id} userData={{product:p}} onClick={e=>select(e,p)}>
      <ProductModel product={p} copies={copies} highlight={target?._id===p._id}/>
    </group>)}
    {filled.map(({product:p,position,rotation,shelfId,slot})=> <group key={`${shelfId}:${slot}`} position={position} rotation={[0,rotation,0]} userData={{product:p}} onClick={e=>select(e,p)}>
      <Sign text={`$${Number(p.price).toFixed(2)}`} sub={p.stock<1?'OUT OF STOCK':p.name} position={[0,-.055,.21]} width={1.05} height={.17} dark={false}/>
    </group>)}
    {COUNTERS.map((c,i)=> <group key={i} position={[c.x,0,c.z]} userData={{checkout:true}} onClick={e=>{e.stopPropagation();if(!paused&&!document.pointerLockElement&&e.distance<REACH){e.nativeEvent?.preventDefault();e.sourceEvent?.preventDefault();onCheckout();}}}>
      <Box position={[0,.52,0]} size={[c.width,1.04,c.length]} color="#375b47"/>
      <Box position={[0,1.08,0]} size={[c.width+.1,.12,c.length+.1]} color="#e2e4d8"/>
      <Box position={[-.65,1.16,0]} size={[1.8,.05,1.5]} color="#3c4540"/>
      <Box position={[.8,1.35,-.5]} size={[.09,.45,.09]} color="#3a4841"/>
      <Box position={[.8,1.6,-.45]} size={[.6,.4,.08]} color="#1d3027"/>
      <Sign text="CHECKOUT" sub="E to review your basket" position={[0,2.9,0]} width={2.4} height={.7}/>
      <Sign text={`0${i+1}`} position={[1.35,.65,1.01]} width={.5} height={.4}/>
    </group>)}
    <Trolley/>
    {[-11.7,11.7].map(x=> <group key={x} position={[x,0,-14]}>
      <mesh position={[0,.35,0]}><cylinderGeometry args={[.42,.3,.7,12]}/><meshStandardMaterial color="#7b8a6a"/></mesh>
      {[-.2,0,.2].map((v,i)=> <mesh key={i} position={[v,1+i*.18,0]} scale={[.7,1.4,.7]}><sphereGeometry args={[.48,10,8]}/><meshStandardMaterial color="#537348"/></mesh> )}
    </group> )}
  </group>;
}
