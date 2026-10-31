import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
const CHECKOUT_TARGET={_id:'checkout',name:'Checkout',checkout:true};
import {EYE_HEIGHT, movePlayer, lookAngles, REACH} from '../../shared/store.js';

export default function Player({paused, input, onTarget, onInspect, onCart, onStatus, worldRef}) {
  const {camera,gl} = useThree();
  const keys = useRef({});
  const angles = useRef({yaw:0,pitch:0});
  const velocity = useRef({x:0,z:0});
  const target = useRef(null);
  const ray = useRef(new THREE.Raycaster());
  const elapsed = useRef(0);
  const lastTarget = useRef(null);
  const callbacks=useRef({onTarget,onInspect,onCart,onStatus,paused});
  callbacks.current={onTarget,onInspect,onCart,onStatus,paused};
  useEffect(()=>{
    camera.rotation.order='YXZ';
    const canvas=gl.domElement;
    const reset=()=>{keys.current={};input.current.move={x:0,z:0};velocity.current={x:0,z:0};};
    const down=e=>{
      if(e.key==='Escape'&&document.pointerLockElement===canvas){document.exitPointerLock();return;}
      if(callbacks.current.paused || /INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k=e.key.toLowerCase();
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','c'].includes(k))e.preventDefault();
      keys.current[k]=true;
      if(k==='e'&&!e.repeat&&target.current)callbacks.current.onInspect(target.current);
    };
    const up=e=>{keys.current[e.key.toLowerCase()]=false;};
    const mouse=e=>{if(document.pointerLockElement===canvas&&!callbacks.current.paused){angles.current=lookAngles(angles.current.yaw,angles.current.pitch,e.movementX,e.movementY);}};
    const lock=()=>{const locked=document.pointerLockElement===canvas;if(locked&&callbacks.current.paused){document.exitPointerLock();return;}if(!locked)reset();callbacks.current.onStatus(locked?'locked':'ready');};
    const failed=()=>callbacks.current.onStatus('drag');
    const click=e=>{
      if(e.defaultPrevented||callbacks.current.paused||e.pointerType==='touch')return;
      if(document.pointerLockElement===canvas){if(target.current)callbacks.current.onInspect(target.current);}
      else if(canvas.requestPointerLock){try{canvas.requestPointerLock()?.catch(failed);}catch{failed();}}
      else failed();
      canvas.focus();
    };
    canvas.tabIndex=0;
    canvas.addEventListener('click',click);
    document.addEventListener('pointerlockchange',lock);document.addEventListener('pointerlockerror',failed);
    document.addEventListener('mousemove',mouse);
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);
    document.addEventListener('visibilitychange',reset);
    return()=>{reset();canvas.removeEventListener('click',click);document.removeEventListener('pointerlockchange',lock);document.removeEventListener('pointerlockerror',failed);document.removeEventListener('mousemove',mouse);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};
  },[camera,gl,input]);
  useEffect(()=>{if(paused){keys.current={};velocity.current={x:0,z:0};input.current.move={x:0,z:0};input.current.look={x:0,y:0};if(document.pointerLockElement)document.exitPointerLock();}},[paused,input]);
  useFrame((_,delta)=>{
    const dt=Math.min(delta,.05);
    if(!paused){
      const look=input.current.look;
      if(look.x||look.y){angles.current=lookAngles(angles.current.yaw,angles.current.pitch,look.x,look.y,.004);look.x=0;look.y=0;}
      camera.rotation.set(angles.current.pitch,angles.current.yaw,0,'YXZ');
      const k=keys.current;
      let x=(Number(!!(k.d||k.arrowright))-Number(!!(k.a||k.arrowleft)))+input.current.move.x;
      let z=(Number(!!(k.s||k.arrowdown))-Number(!!(k.w||k.arrowup)))+input.current.move.z;
      const length=Math.max(1,Math.hypot(x,z));x/=length;z/=length;
      const yaw=angles.current.yaw;
      const tx=(x*Math.cos(yaw)+z*Math.sin(yaw))*3.2;
      const tz=(z*Math.cos(yaw)-x*Math.sin(yaw))*3.2;
      const smooth=1-Math.exp(-16*dt);
      velocity.current.x=THREE.MathUtils.lerp(velocity.current.x,tx,smooth);
      velocity.current.z=THREE.MathUtils.lerp(velocity.current.z,tz,smooth);
      const next=movePlayer(camera.position,velocity.current.x*dt,velocity.current.z*dt);
      camera.position.set(next.x,EYE_HEIGHT,next.z);
    }
    elapsed.current+=dt;
    if(elapsed.current<.09)return;
    elapsed.current=0;
    let next=null;
    if(!paused&&worldRef.current){
      ray.current.setFromCamera(new THREE.Vector2(0,0),camera);ray.current.far=REACH;
      const hits=ray.current.intersectObject(worldRef.current,true);
      for(const hit of hits){
        if(hit.object.userData.ignoreRay)continue;
        let obj=hit.object;
        while(obj&&!obj.userData.product&&!obj.userData.checkout)obj=obj.parent;
        if(obj?.userData.product)next=obj.userData.product;
        if(obj?.userData.checkout)next=CHECKOUT_TARGET;
        break;
      }
    }
    target.current=next;
    if(lastTarget.current!==next){lastTarget.current=next;callbacks.current.onTarget(next);}
    // Development-only telemetry lets browser tests assert real camera movement.
    if(import.meta.env.DEV||import.meta.env.MODE==='test'){gl.domElement.dataset.position=JSON.stringify([camera.position.x,camera.position.y,camera.position.z]);gl.domElement.dataset.rotation=JSON.stringify([camera.rotation.x,camera.rotation.y]);gl.domElement.dataset.target=next?._id||'';}
  });
  return null;
}
