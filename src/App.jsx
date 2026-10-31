import React,{lazy,Suspense,useCallback,useEffect,useMemo,useState} from 'react';
import {ShoppingCart,Store,LayoutDashboard,Search,Map,HelpCircle,ArrowRight,Leaf,Navigation,X,RefreshCw} from 'lucide-react';
import Store3D from './Store3D.jsx';
import Modal from './components/Modal.jsx';
import {Cart,Checkout,Inspection,ProductImage,Receipt} from './components/Shopping.jsx';
import {api,money} from './api.js';
import {SHELVES,sanitizeCart,assignPlacements} from '../shared/store.js';
const Admin=lazy(()=>import('./components/Admin.jsx'));
export default function App(){
 const [admin,setAdmin]=useState(location.hash==='#admin'),[products,setProducts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[persistent,setPersistent]=useState(null),[panel,setPanel]=useState(null),[selectedId,setSelectedId]=useState(null),[notice,setNotice]=useState(''),[receipt,setReceipt]=useState(null),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[welcome,setWelcome]=useState(true),[ready,setReady]=useState(false);
 const [cart,setCart]=useState(()=>{try{return sanitizeCart(JSON.parse(localStorage.getItem('suuq-cart')));}catch{return{};}});
 const refresh=useCallback(async()=>{try{const [p,h]=await Promise.all([api('/products'),api('/health')]);if(!Array.isArray(p))throw Error('Invalid inventory response');setProducts(p);setPersistent(h.persistent);setError('');return p;}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
 useEffect(()=>{refresh();const id=setInterval(()=>{if(!document.hidden)refresh();},15000);const focus=()=>refresh();window.addEventListener('focus',focus);return()=>{clearInterval(id);window.removeEventListener('focus',focus);};},[refresh]);
 useEffect(()=>{try{localStorage.setItem('suuq-cart',JSON.stringify(cart));}catch{setNotice('Cart storage is unavailable in this browser. Keep this tab open.');}},[cart]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(id);},[notice]);
 useEffect(()=>{const handler=()=>setAdmin(location.hash==='#admin');window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
 useEffect(()=>{
  const shortcut=e=>{
   if(e.key.toLowerCase()==='c'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!admin&&!panel&&!receipt&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){
    e.preventDefault();setPanel('cart');setSelectedId(null);setWelcome(false);
   }
  };
  window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);
 },[admin,panel,receipt]);
 const close=useCallback(()=>{setPanel(null);setSelectedId(null);setReceipt(null);},[]);
 function navigateAdmin(value){close();location.hash=value?'admin':'';setAdmin(value);}
 const selected=products.find(p=>p._id===selectedId);
 useEffect(()=>{if(selectedId&&!loading&&!selected){setSelectedId(null);setPanel(null);setNotice('This product is no longer available.');}},[selected,selectedId,loading]);
 const items=Object.entries(cart).map(([id,quantity])=>({...products.find(p=>p._id===id),quantity})).filter(p=>p._id);
 const missing=Object.keys(cart).filter(id=>!products.some(p=>p._id===id));
 const count=items.reduce((n,p)=>n+p.quantity,0),total=items.reduce((n,p)=>n+p.price*p.quantity,0);
 const paused=admin||!!panel||!!receipt;
 useEffect(()=>{if(paused&&document.pointerLockElement)document.exitPointerLock();},[paused]);
 function openCart(){setPanel('cart');setSelectedId(null);setWelcome(false);}
 function inspect(p){setSelectedId(p._id);setPanel('product');setWelcome(false);}
 function add(p,quantity){setCart(old=>({...old,[p._id]:Math.min(p.stock,100,(old[p._id]||0)+quantity)}));setNotice(`${p.name} added to your cart`);close();}
 function remove(id){setCart(old=>{const next={...old};delete next[id];return next;});}
 const filtered=products.filter(p=>(category==='All'||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase()));
 const overflow=useMemo(()=>assignPlacements(products).unplaced,[products]);
 return <div className={admin?'app admin-mode':'app'}><header className="topbar"><button className="brand" onClick={()=>navigateAdmin(false)} aria-label="SuuqVerse home"><span className="brand-mark"><Store size={22}/></span><span>SUUQ<span className="brand-light">VERSE</span><small>YOUR NEIGHBORHOOD, IN 3D</small></span></button><nav aria-label="Main navigation"><button className={!admin?'active':''} onClick={()=>navigateAdmin(false)}><Navigation size={16}/><span>Explore store</span></button><button onClick={()=>{setPanel('directory');setWelcome(false);}}><Map size={16}/><span>Store guide</span></button></nav><div className="header-actions"><button className="icon-button product-list-button" aria-label="Open product list" onClick={()=>setPanel('products')}><Search size={19}/></button><button className="icon-button help-button" aria-label="Help and controls" onClick={()=>setPanel('help')}><HelpCircle size={19}/></button><button className="cart-trigger" onClick={openCart}><ShoppingCart size={19}/><span>Cart</span><b>{count}</b></button><button className="icon-button admin-link" aria-label="Admin" onClick={()=>navigateAdmin(true)}><LayoutDashboard size={18}/></button></div></header>
 {admin?<Suspense fallback={<p className="admin-shell">Loading administration…</p>}><Admin onBack={()=>navigateAdmin(false)} onInventoryChange={refresh}/></Suspense>:<main className="experience"><Store3D products={products} cartItems={items} paused={paused} onInspect={inspect} onCart={openCart} onReady={()=>setReady(true)} onBrowse={()=>setPanel('products')}/><div className="world-label"><Leaf size={16}/><span>THE MARKET</span><i/>{products.length} products to discover</div>{welcome&&!paused&&ready&&!loading&&<aside className="welcome-card"><button className="welcome-close icon-button" aria-label="Dismiss welcome" onClick={()=>setWelcome(false)}><X size={16}/></button><span className="welcome-icon"><Navigation size={24}/></span><h1>Your next grocery run.<br/>A whole new perspective.</h1><p>Walk the aisles. Find your favorites.<br/>Fill your cart as you go.</p><button className="primary" onClick={()=>{setWelcome(false);document.querySelector('canvas')?.click();}}>Start exploring<ArrowRight size={17}/></button><small>Click to look around. Press Esc anytime.</small></aside>}
 <div className="location-label"><span>SUUQVERSE MARKET</span><b>Entrance & checkout</b><button onClick={()=>setPanel('directory')} aria-label="Open store map"><Map size={17}/></button></div>
 {(loading||!ready)&&<div className="loading-store"><Store size={32}/><h2>Preparing your store</h2><p>Stocking the shelves…</p></div>}
 </main>}
 {error&&<div className="connection-error" role="alert"><span>{error}</span><button onClick={refresh}><RefreshCw size={15}/>Retry</button></div>}
 {persistent===false&&<div className="demo-note">Demo store: orders and inventory reset when the API restarts.</div>}
 {notice&&<div className="toast" role="status">{notice}<button className="icon-button" aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={16}/></button></div>}
 {panel==='product'&&selected&&<Inspection key={selected._id} product={selected} onClose={close} onAdd={add}/>}
 {panel==='cart'&&<Cart items={items} total={total} onClose={close} onChange={(id,n)=>setCart(old=>({...old,[id]:Math.min(100,Math.max(1,n))}))} onRemove={remove} onCheckout={()=>setPanel('checkout')}/>}
 {panel==='cart'&&missing.length>0&&!loading&&<div className="cart-reconcile" role="status">{missing.length} unavailable item(s) hidden from your cart. <button onClick={()=>setCart(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!missing.includes(id))))}>Remove unavailable items</button></div>}
 {panel==='checkout'&&<Checkout items={items} total={total} onClose={close} onStockChange={refresh} onSuccess={o=>{setReceipt(o);setPanel(null);setCart({});refresh();}}/>}
 {receipt&&<Receipt order={receipt} onClose={close}/>}
 {panel==='directory'&&<Modal title="Find your aisle" onClose={close}><p className="muted">From the entrance, walk straight ahead into the central aisle. Signs hang above each department.</p><div className="store-map" aria-label="Store floor plan"><div className="map-back">SUUQVERSE</div>{SHELVES.map(s=><div className="map-shelf" key={s.id}><small>AISLE {s.id.split('-')[1]}</small><b>{s.category}</b></div>)}<div className="map-entrance">Checkout & entrance · You start here</div></div><p className="small muted">Each shelf has products on both sides. Approach within arm’s reach and press E to inspect.</p><button className="secondary wide" onClick={()=>setPanel('products')}><Search size={16}/>Browse all products</button></Modal>}
 {panel==='help'&&<Modal title="Make yourself at home" onClose={close}><div className="help-controls"><p><kbd>W A S D</kbd><span>Walk through the aisles</span></p><p><kbd>Mouse</kbd><span>Click the scene to capture the mouse, then look around. Drag if capture is unavailable.</span></p><p><kbd>E</kbd><span>Inspect the product under the crosshair or use a checkout counter</span></p><p><kbd>C</kbd><span>Open your cart</span></p><p><kbd>Esc</kbd><span>Release the mouse or close a panel</span></p></div><p className="muted">On mobile, use the left joystick to walk. Drag anywhere else to look around, then tap a nearby product or the hand button.</p><button className="primary wide" onClick={close}>Let’s explore</button></Modal>}
 {panel==='products'&&<Modal title="Product list" drawer onClose={close}><p className="muted">A quick way to shop when you prefer a list.</p><label className="search-field"><Search size={17}/><input aria-label="Search products" placeholder="Search the store…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Filter category" value={category} onChange={e=>setCategory(e.target.value)}>{['All',...new Set(products.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select>{overflow.length>0&&<p className="muted small">{overflow.length} products are available here while shelf space is full.</p>}<div className="quick-products">{filtered.map(p=><button key={p._id} onClick={()=>inspect(p)}><ProductImage product={p}/><span><b>{p.name}</b><small>{p.category} · {p.stock} available</small></span><strong>{money(p.price)}</strong></button>)}{!filtered.length&&<p>No products found.</p>}</div></Modal>}
 </div>;
}
