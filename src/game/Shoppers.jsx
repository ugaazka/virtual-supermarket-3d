import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {SHOPPERS,shopperState,stepShopper} from '../../shared/shoppers.js';
import {ShoppingBasket} from './Trolley.jsx';
function Shape({position,size,color,rotation,...props}){return <mesh position={position} rotation={rotation} scale={[size[0]/.22,size[1]/.55,size[2]/.22]} {...props}><capsuleGeometry args={[.22,.55,6,12]}/><meshStandardMaterial color={color} roughness={.72}/></mesh>;}
function Shopper({config,paused}){
 const root=useRef(),leftLeg=useRef(),rightLeg=useRef(),leftArm=useRef(),rightArm=useRef();
 const state=useRef(shopperState(config));const {camera}=useThree();
 useFrame((_,delta)=>{
  const walking=!paused&&stepShopper(state.current,config,delta,camera.position).walking;
  const current=state.current;
  root.current.position.set(current.x,0,current.z);
  const difference=Math.atan2(Math.sin(current.yaw-root.current.rotation.y),Math.cos(current.yaw-root.current.rotation.y));
  root.current.rotation.y+=difference*(1-Math.exp(-7*Math.min(delta,.05)));
  const swing=walking?Math.sin(current.phase)*.36:0;
  leftLeg.current.rotation.x=THREE.MathUtils.lerp(leftLeg.current.rotation.x,swing,.22);
  rightLeg.current.rotation.x=THREE.MathUtils.lerp(rightLeg.current.rotation.x,-swing,.22);
  leftArm.current.rotation.x=THREE.MathUtils.lerp(leftArm.current.rotation.x,-swing*.75,.22);
  rightArm.current.rotation.x=THREE.MathUtils.lerp(rightArm.current.rotation.x,swing*.3,.22);
 });
 return <group ref={root} name={`shopper-${config.id}`} position={[state.current.x,0,state.current.z]}>
  <Shape position={[0,1.19,0]} size={[.48,.68,.3]} color={config.shirt}/>
  {config.headscarf&&<Shape position={[0,.93,0]} size={[.43,.24,.27]} color={config.shirt}/>}
  <mesh position={[0,1.6,0]}><cylinderGeometry args={[.09,.1,.16,12]}/><meshStandardMaterial color={config.skin} roughness={.8}/></mesh>
  <mesh position={[0,1.78,0]} scale={[.86,1.06,.86]}><sphereGeometry args={[.17,20,16]}/><meshStandardMaterial color={config.skin} roughness={.8}/></mesh>
  {config.headscarf?<mesh position={[0,1.8,-.025]} scale={[1.03,1.08,.96]}><sphereGeometry args={[.18,20,16,0,Math.PI*2,0,Math.PI*.7]}/><meshStandardMaterial color={config.shirt} side={THREE.DoubleSide} roughness={.9}/></mesh>:<mesh position={[0,1.85,-.02]} scale={[1.02,1.04,.98]}><sphereGeometry args={[.175,20,12,0,Math.PI*2,0,Math.PI*.58]}/><meshStandardMaterial color={config.hair} roughness={.9}/></mesh>}
  {[-.06,.06].map(x=><mesh key={x} position={[x,1.8,.145]}><sphereGeometry args={[.014,8,6]}/><meshStandardMaterial color="#30332f" roughness={.6}/></mesh>)}
  <mesh position={[0,1.76,.16]}><sphereGeometry args={[.023,8,6]}/><meshStandardMaterial color={config.skin}/></mesh>
  {[-1,1].map(side=><group key={side} ref={side<0?leftLeg:rightLeg} position={[side*.115,.95,0]}>
   <Shape position={[0,-.34,0]} size={[.17,.72,.2]} color={config.trousers}/>
   <Shape position={[0,-.79,.08]} size={[.2,.14,.34]} color="#303b37"/>
  </group>)}
  {[-1,1].map(side=><group key={side} ref={side<0?leftArm:rightArm} position={[side*.27,1.4,0]} rotation={[0,0,side*.08]}>
   <Shape position={[0,-.14,0]} size={[.15,.35,.19]} color={config.shirt}/>
   <Shape position={[0,-.4,0]} size={[.11,.28,.14]} color={config.skin}/>
   <mesh position={[0,-.56,0]}><sphereGeometry args={[.07,10,8]}/><meshStandardMaterial color={config.skin} roughness={.8}/></mesh>
   {side>0&&<group position={[.08,-1.02,0]}><ShoppingBasket scale={.85}/><Shape position={[0,.27,0]} size={[.12,.36,.13]} color="#c5ad72"/><mesh position={[.13,.27,.03]}><sphereGeometry args={[.07,8,6]}/><meshStandardMaterial color="#b65d42"/></mesh></group>}
  </group>)}
 </group>;
}
export default function Shoppers({paused=false}){
 const root=useRef();const {gl}=useThree();const clock=useRef(0);
 useFrame((_,delta)=>{
  if(!(import.meta.env.DEV||import.meta.env.MODE==='test'))return;
  clock.current+=delta;if(clock.current<.25)return;clock.current=0;
  gl.domElement.dataset.shoppers=JSON.stringify(root.current.children.map(person=>({id:person.name,x:person.position.x,z:person.position.z})));
 });
 return <group ref={root} name="ambient-shoppers" userData={{ignoreRay:true}}>{SHOPPERS.map(config=><Shopper key={config.id} config={config} paused={paused}/>)}</group>;
}
