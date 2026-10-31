import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import ProductModel from './ProductModel.jsx';

function Bar({position,size,color='#9eafa6'}){
 return <mesh position={position}><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={.65} roughness={.32}/></mesh>;
}
export function ShoppingBasket({scale=1,...props}){
 return <group scale={scale} {...props}>
  <Bar position={[0,0,0]} size={[.47,.035,.32]} color="#3d7153"/>
  {[-.23,.23].map(x=><Bar key={x} position={[x,.14,0]} size={[.025,.28,.34]} color="#3d7153"/>)}
  {[-.16,.16].map(z=><Bar key={z} position={[0,.14,z]} size={[.47,.28,.025]} color="#3d7153"/>)}
  {[-.2,.2].map(x=><Bar key={x} position={[x,.4,0]} size={[.025,.3,.025]} color="#263e30"/>)}
  <Bar position={[0,.55,0]} size={[.43,.025,.025]} color="#263e30"/>
 </group>;
}
function TrolleyFrame(){
 return <>
  <Bar position={[0,.54,0]} size={[.93,.035,.86]}/>
  {[.57,.73,.89,1.05].map(y=><group key={y}>
   {[-.48,.48].map(x=><Bar key={x} position={[x,y,0]} size={[.022,.022,.91]}/>)}
   {[-.45,.45].map(z=><Bar key={z} position={[0,y,z]} size={[.98,.022,.022]}/>)}
  </group>)}
  {Array.from({length:9},(_,i)=>-.43+i*.1075).map(x=>[-.45,.45].map(z=><Bar key={`${x}:${z}`} position={[x,.8,z]} size={[.014,.51,.014]}/>))}
  {Array.from({length:7},(_,i)=>-.4+i*.133).map(z=>[-.48,.48].map(x=><Bar key={`${x}:${z}`} position={[x,.8,z]} size={[.014,.51,.014]}/>))}
  {[-.49,.49].map(x=><group key={x}>
   <Bar position={[x,.45,.46]} size={[.035,.85,.035]}/>
   <Bar position={[x,.58,-.4]} size={[.035,.8,.035]}/>
   <Bar position={[x,1.08,.61]} size={[.035,.2,.035]}/>
  </group>)}
  <Bar position={[0,1.17,.62]} size={[1.09,.065,.065]} color="#315e44"/>
  <Bar position={[0,.24,0]} size={[.9,.035,.9]}/>
  {[-.4,.4].map(x=>[-.36,.4].map(z=><mesh key={`${x}:${z}`} position={[x,.14,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.1,.1,.07,10]}/><meshStandardMaterial color="#34463c" roughness={.8}/></mesh>))}
 </>;
}
// This is a view model: it stays in the lower view as you walk and look,
// outside the shelf raycast root so it never blocks product interaction.
export default function Trolley({items=[],coarse=false}){
 const ref=useRef();const {camera,gl,size}=useThree();
 const compact=size.width/size.height<.85;
 const capacity=coarse?12:24;
 const visible=[];
 // Represent distinct products before using remaining space for extra units.
 for(let unit=0;visible.length<capacity;unit++){
  let added=false;
  for(const item of items){if(item.quantity>unit&&visible.length<capacity){visible.push({product:item,unit});added=true;}}
  if(!added)break;
 }
 const count=items.reduce((sum,p)=>sum+p.quantity,0);
 const elapsed=useRef(0);
 useFrame((_,delta)=>{
  if(!ref.current)return;
  ref.current.position.copy(camera.position);ref.current.quaternion.copy(camera.quaternion);
  elapsed.current+=delta;
  if(elapsed.current>.2&&(import.meta.env.DEV||import.meta.env.MODE==='test')){
   elapsed.current=0;
   gl.domElement.dataset.trolleyCount=String(count);
   gl.domElement.dataset.trolleyVisibleCount=String(visible.length);
   gl.domElement.dataset.trolleyProducts=JSON.stringify([...new Set(visible.map(p=>p.product._id))]);
   gl.domElement.dataset.trolleyPosition=JSON.stringify(ref.current.position.toArray());
  }
 });
 return <group ref={ref} name="player-trolley" userData={{ignoreRay:true}}>
  <group position={[0,compact?-1.03:-1.45,-1.65]} scale={compact?.68:1}>
   <TrolleyFrame/>
   {visible.map(({product,unit},i)=>{
    const layer=Math.floor(i/9),slot=i%9;
    return <ProductModel key={`${product._id}:${unit}`} product={product} scale={.65} position={[-.29+(slot%3)*.29,.57+layer*.23,-.28+Math.floor(slot/3)*.28]} rotation={[0,(i%3-1)*.18,0]}/>;
   })}
  </group>
 </group>;
}
