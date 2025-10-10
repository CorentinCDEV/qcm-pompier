// assets/js/data.js
import { MANIFEST_URL } from './config.js';

let MANIFEST = null;
let THEME_BANK = {}; // themeKey -> {questions:[], answers:{}}

export async function loadManifest(){
  if(MANIFEST) return MANIFEST;
  const res = await fetch(MANIFEST_URL, {cache:'no-store'});
  if(!res.ok) throw new Error('manifest HTTP '+res.status);
  MANIFEST = await res.json();
  return MANIFEST;
}

export async function loadTheme(themeKey){
  await loadManifest();
  if(THEME_BANK[themeKey]) return THEME_BANK[themeKey];
  const theme = MANIFEST.themes.find(t=>t.key===themeKey);
  if(!theme) throw new Error('Thème inconnu: '+themeKey);
  const [qRes, aRes] = await Promise.all([ fetch(theme.questions, {cache:'no-store'}), fetch(theme.answers, {cache:'no-store'}) ]);
  const questions = await qRes.json();
  const answers = await aRes.json(); // plain map
  THEME_BANK[themeKey] = {questions, answers};
  return THEME_BANK[themeKey];
}

export async function loadAllThemes(){
  await loadManifest();
  await Promise.all(MANIFEST.themes.map(t=>loadTheme(t.key)));
  return THEME_BANK;
}

export function getThemeBank(){ return THEME_BANK; }
