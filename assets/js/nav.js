// assets/js/nav.js
export function initNav(){
  const burger = document.querySelector('.burger');
  const drawer = document.getElementById('mobile-drawer');
  if(!(burger && drawer)) return;
  const closeDrawer = ()=>{ drawer.hidden = true; burger.setAttribute('aria-expanded','false'); };
  const openDrawer  = ()=>{ drawer.hidden = false; burger.setAttribute('aria-expanded','true'); };

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    open ? closeDrawer() : openDrawer();
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('click', (e)=>{
    const within = drawer.contains(e.target) || burger.contains(e.target);
    if(!within){ closeDrawer(); }
  });
}
