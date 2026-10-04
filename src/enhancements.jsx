// Optional React island. Installed dependencies are required for build:enhanced.
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {motion,MotionConfig,AnimatePresence} from 'framer-motion';
import {Minus,Plus} from 'lucide-react';
const host=document.getElementById('serving-enhancement');
function Servings(){
 const [count,setCount]=useState(Number(host.dataset.servings));
 useEffect(()=>{const update=e=>setCount(e.detail);window.addEventListener('recipe:servings-update',update);return()=>window.removeEventListener('recipe:servings-update',update);},[]);
 const change=delta=>window.dispatchEvent(new CustomEvent('recipe:servings-change',{detail:count+delta}));
 return <MotionConfig reducedMotion="user"><div className="serving-widget">
  <motion.button whileHover={{backgroundColor:'#e8e9df'}} whileTap={{scale:.94}} aria-label="Уменьшить число порций" disabled={count<=1} onClick={()=>change(-1)}><Minus size={18}/></motion.button>
  <output aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.span key={count} style={{display:'inline-block'}} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.12}}>{count} {count===1?'порция':count<5?'порции':'порций'}</motion.span></AnimatePresence></output>
  <motion.button whileHover={{backgroundColor:'#e8e9df'}} whileTap={{scale:.94}} aria-label="Увеличить число порций" disabled={count>=20} onClick={()=>change(1)}><Plus size={18}/></motion.button>
 </div></MotionConfig>;
}
if(host)createRoot(host).render(<Servings/>);
