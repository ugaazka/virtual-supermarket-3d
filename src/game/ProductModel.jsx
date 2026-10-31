import {useMemo, useEffect, useLayoutEffect, useRef, useState} from 'react';
import * as THREE from 'three';

function labelTexture(product) {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const c=canvas.getContext('2d');
  c.fillStyle=product.color||'#377963';c.fillRect(0,0,256,256);
  c.fillStyle='#f8f6eb';c.fillRect(10,12,236,232);
  c.fillStyle=product.color||'#377963';c.fillRect(10,12,236,48);
  c.textAlign='center';c.fillStyle='#ffffff';c.font='bold 20px sans-serif';c.fillText('SUUQVERSE',128,43);
  c.fillStyle='#193e32';c.font='bold 27px sans-serif';
  const words=product.name.split(' ');const lines=[];let line='';
  for(const word of words){if(c.measureText(`${line} ${word}`).width>215){lines.push(line);line=word;}else line=`${line} ${word}`.trim();}lines.push(line);
  lines.slice(0,3).forEach((t,i)=>c.fillText(t,128,105+i*32));
  c.font='15px sans-serif';c.fillText(product.category||'Everyday essentials',128,211);
  c.fillStyle='#193e32';for(let i=0;i<42;i++)if(i%3!==0)c.fillRect(45+i*4,225,1+(i%2),17);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export function useLabel(product){
  const generated=useMemo(()=>labelTexture(product),[product.name,product.category,product.color]);
  const [uploaded,setUploaded]=useState(null);
  useEffect(()=>{setUploaded(null);if(!product.image?.startsWith('/uploads/'))return;let cancelled=false;let loaded;new THREE.TextureLoader().load(product.image,t=>{loaded=t;t.colorSpace=THREE.SRGBColorSpace;if(cancelled)t.dispose();else setUploaded(t);},undefined,()=>{});return()=>{cancelled=true;loaded?.dispose();};},[product.image]);
  useEffect(()=>()=>generated.dispose(),[generated]);
  return uploaded||generated;
}
function Part({copies,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1],children}) {
  const ref=useRef();
  useLayoutEffect(()=>{
    if(!copies||!ref.current)return;
    const base=new THREE.Object3D();base.position.fromArray(position);base.rotation.set(...rotation);base.scale.fromArray(scale);base.updateMatrix();
    const parent=new THREE.Object3D();const matrix=new THREE.Matrix4();
    copies.forEach((copy,i)=>{parent.position.fromArray(copy.position);parent.rotation.set(0,copy.rotation,0);parent.updateMatrix();matrix.multiplyMatrices(parent.matrix,base.matrix);ref.current.setMatrixAt(i,matrix);});
    ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();
  },[copies,...position,...rotation,...scale]);
  return copies?<instancedMesh ref={ref} args={[null,null,copies.length]}>{children}</instancedMesh>:<mesh position={position} rotation={rotation} scale={scale}>{children}</mesh>;
}
function ShelfLabel({copies,texture,position,scale=[1,1,1]}) {
 return <Part copies={copies} position={position} scale={scale}><planeGeometry args={[1,1]}/><meshStandardMaterial map={texture} roughness={.62}/></Part>;
}
export default function ProductModel({product,highlight=false,scale=1,copies=null,...props}){
  const texture=useLabel(product);
  const kind=product.shape||'box';const color=product.color||'#3b8060';
  const material={color,roughness:.55,emissive:highlight?'#5ca887':'#000000',emissiveIntensity:highlight?.28:0};
  const round=['bottle','can','pump','roll'].includes(kind);
  const fruit=['apple','orange','banana'].includes(kind);
  return <group scale={scale} {...props}>
    {fruit?<>
      {kind==='banana'?<Part copies={copies} position={[0,.17,0]} rotation={[0,0,-.5]}><torusGeometry args={[.15,.055,8,16,Math.PI*1.2]}/><meshStandardMaterial {...material}/></Part>:<Part copies={copies} position={[0,.18,0]} scale={kind==='apple'?[1,.9,1]:[1,1,1]}><sphereGeometry args={[.17,16,12]}/><meshStandardMaterial {...material}/></Part>}
      <Part copies={copies} position={[0,.35,0]} rotation={[0,0,.2]}><cylinderGeometry args={[.012,.014,.07,5]}/><meshStandardMaterial color="#615235"/></Part>
      <Part copies={copies} position={[.05,.36,0]} rotation={[0,0,-.5]} scale={[1,.25,.5]}><sphereGeometry args={[.07,8,6]}/><meshStandardMaterial color="#426b32"/></Part>
    </>:<>
      {round?<Part copies={copies} position={[0,kind==='can'?.22:.23,0]}><cylinderGeometry args={[kind==='bottle'?.09:.14,.14,kind==='can'?.4:.46,16]}/><meshStandardMaterial {...material} metalness={kind==='can'?.5:.05}/></Part>:<Part copies={copies} position={[0,.25,0]} scale={kind==='bag'?[1,.95,.85]:[1,1,1]}><boxGeometry args={[.34,.5,.23]}/><meshStandardMaterial {...material}/></Part>}
      {['bottle','pump'].includes(kind)&&<><Part copies={copies} position={[0,.49,0]}><cylinderGeometry args={[.055,.08,.12,12]}/><meshStandardMaterial {...material}/></Part><Part copies={copies} position={[0,.56,0]}><cylinderGeometry args={[.065,.065,.04,12]}/><meshStandardMaterial color="#eceee8"/></Part>{kind==='pump'&&<Part copies={copies} position={[.04,.6,0]}><boxGeometry args={[.16,.04,.05]}/><meshStandardMaterial color="#e7e9e2"/></Part>}</>}
      {kind==='carton'&&<Part copies={copies} position={[0,.54,0]} rotation={[0,0,Math.PI/4]} scale={[1,.55,1]}><boxGeometry args={[.24,.24,.22]}/><meshStandardMaterial color="#f6f6ed"/></Part>}
      <ShelfLabel copies={copies} texture={texture} position={[0,.25,round?.143:.121]} scale={[round?.23:.30,kind==='can'?.30:.39,1]}/>
      {kind==='can'&&<Part copies={copies} position={[0,.426,0]}><cylinderGeometry args={[.133,.133,.012,16]}/><meshStandardMaterial color="#c6d0cf" metalness={.8} roughness={.2}/></Part>}
    </>}
    {highlight&&<Part copies={copies} position={[0,.28,0]}><boxGeometry args={[.43,.67,.37]}/><meshBasicMaterial color="#9fdbac" wireframe transparent opacity={.4}/></Part>}
  </group>;
}
