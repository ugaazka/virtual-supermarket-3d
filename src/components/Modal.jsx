import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export default function Modal({title,onClose,children,drawer=false,className=''}){
 const ref=useRef();
 useEffect(()=>{
  const previous=document.activeElement;
  const root=ref.current;root.focus();
  const handler=e=>{
   if(e.key==='Escape'){e.stopPropagation();onClose();}
   if(e.key==='Tab'){
    const items=[...root.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
    const first=items[0],last=items.at(-1);if(!first){e.preventDefault();return;}
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===root)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===root)){e.preventDefault();first.focus();}
   }
  };root.addEventListener('keydown',handler);return()=>{root.removeEventListener('keydown',handler);previous?.focus?.();};
 },[onClose]);
 return <div className={`overlay ${drawer?'drawer-overlay':''}`} onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`${drawer?'drawer':'modal'} ${className}`}><div className="panel-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label={`Close ${title}`}><X size={21}/></button></div>{children}</section></div>;
}
