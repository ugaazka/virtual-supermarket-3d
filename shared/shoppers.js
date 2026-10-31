// All routes use open aisle centers and cross aisles, clear of store fixtures.
export const SHOPPERS=[
 {id:'amina',shirt:'#8e786e',trousers:'#394b41',skin:'#895d43',hair:'#292b29',headscarf:true,offset:2,route:[[0,8.4],[0,2],[0,-5],[0,-12],[-6,-12],[-6,-3],[-6,8.4]]},
 {id:'yusuf',shirt:'#69848b',trousers:'#485260',skin:'#a27555',hair:'#302c29',offset:8,route:[[-6,8.4],[-6,1],[-6,-6],[-6,-12],[0,-12],[0,-4],[0,8.4]]},
 {id:'sahra',shirt:'#aa9570',trousers:'#586350',skin:'#6d4938',hair:'#312a28',headscarf:true,offset:15,route:[[6,8.4],[6,2],[6,-5],[6,-12],[11.4,-12],[11.4,-4],[11.4,8.4]]},
 {id:'omar',shirt:'#6c8066',trousers:'#4a4d4b',skin:'#b68b65',hair:'#40362c',offset:23,route:[[-11.4,-12],[-11.4,-4],[-11.4,8.4],[-6,8.4],[-6,-3],[-6,-12]]},
];
export function shopperState(config){
 const index=Math.floor(config.offset/7)%config.route.length;
 return {x:config.route[index][0],z:config.route[index][1],next:(index+1)%config.route.length,yaw:0,wait:config.offset%3,phase:config.offset};
}
export function stepShopper(state,config,delta,player){
 const dt=Math.min(Math.max(delta,0),.05);
 if(state.wait>0){state.wait=Math.max(0,state.wait-dt);return {walking:false};}
 const target=config.route[state.next],dx=target[0]-state.x,dz=target[1]-state.z,distance=Math.hypot(dx,dz);
 if(distance<.055){
  const arrived=state.next;state.next=(state.next+1)%config.route.length;
  state.wait=arrived%3===1?3.5:1;
  if(arrived%3===1)state.yaw=state.x<=0?Math.PI/2:-Math.PI/2;
  return {walking:false};
 }
 const speed=.62,step=Math.min(speed*dt,distance),x=state.x+dx/distance*step,z=state.z+dz/distance*step;
 // Shoppers yield when moving toward the player instead of walking into them.
 if(player&&Math.hypot(x-player.x,z-player.z)<1.25&&Math.hypot(x-player.x,z-player.z)<Math.hypot(state.x-player.x,state.z-player.z))return {walking:false};
 state.x=x;state.z=z;state.yaw=Math.atan2(dx,dz);state.phase+=dt*5.8;
 return {walking:true};
}
