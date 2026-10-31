export async function api(endpoint,options={}){
  let response;
  try{response=await fetch(`/api${endpoint}`,{credentials:'include',...options,headers:{'Content-Type':'application/json',...options.headers}});}catch{throw new Error('Cannot reach the store. Check your connection and try again.');}
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data){const error=new Error(data?.error||'The store API is unavailable. Please try again.');error.status=response.status;throw error;}
  return data;
}
export const money=value=>`$${Number(value||0).toFixed(2)}`;
