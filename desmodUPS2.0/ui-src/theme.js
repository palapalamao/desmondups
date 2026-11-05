export const THEME_KEY='upsNew.theme';
export function readTheme(storage) { try { return storage?.getItem(THEME_KEY)==='dark'?'dark':'light'; } catch { return 'light'; } }
export function setTheme(theme,storage) { const valid=theme==='dark'?'dark':'light'; try { storage?.setItem(THEME_KEY,valid); } catch {} return valid; }
export function applyTheme(theme,doc=document) {
  const valid=theme==='dark'?'dark':'light'; doc.documentElement.dataset.theme=valid; doc.documentElement.style.colorScheme=valid;
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',valid==='dark'?'#0e1218':'#f3f6f8');
  const button=doc.querySelector('#theme-toggle');
  if(button){button.innerHTML=`<span class="theme-toggle__dot" aria-hidden="true"></span><span>${valid==='light'?'浅色模式':'深色模式'}</span>`;button.setAttribute('aria-label',`当前${valid==='light'?'浅色':'深色'}模式，切换至${valid==='light'?'深色':'浅色'}模式`);button.setAttribute('aria-pressed',String(valid==='dark'));}
  return valid;
}

