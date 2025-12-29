/* script.js - lógica reimplementada desde el componente React TSX */

/* -----------------------
   Utilidades color / HSL
   ----------------------- */

function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l){
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generatePalette(baseColor){
  const baseHsl = hexToHsl(baseColor);
  const palette = {};
  const shades = [50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900];
  const luminosities = {
    50:95,100:90,150:85,200:80,250:75,300:70,350:65,400:60,450:55,500:50,550:45,600:40,650:35,700:30,750:25,800:20,850:15,900:10
  };
  const baseL = baseHsl.l;
  const lDiff = 50 - baseL;

  shades.forEach(shade => {
    let l = luminosities[shade] - lDiff;
    l = Math.max(0, Math.min(100, l));
    palette[shade] = hslToHex(baseHsl.h, baseHsl.s, l);
  });
  palette[500] = baseColor;
  return palette;
}

function getContrastRatio(color1, color2){
  function getLuminance(hex){
    const rgb = parseInt(hex.slice(1),16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const [rs,gs,bs] = [r,g,b].map(c => {
      c = c/255;
      return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
    });
    return 0.2126*rs + 0.7152*gs + 0.0722*bs;
  }
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1,lum2);
  const darkest = Math.min(lum1,lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getComplementaryColor(hex){
  const hsl = hexToHsl(hex);
  const complementaryH = (hsl.h + 180) % 360;
  return hslToHex(complementaryH, hsl.s, hsl.l);
}

/* -----------------------
   Estado y referencias DOM
   ----------------------- */

const state = {
  mainColor: '#dd1389',
  secondary1: '#266bd9',
  secondary2: '#747c86',
  activePaletteKey: 'principal',
  darkMode: false,
  textColor: '#3B82F6',
  bgColor: '#0D0D0D',
  showRatio45: true,
  showRatio7: true,
  showModal: false,
  showAccess: false
};

/* DOM nodes */
const nodes = {
  mainPicker: document.getElementById('mainColorPicker'),
  mainInput: document.getElementById('mainColorInput'),
  sec1Picker: document.getElementById('secondary1Picker'),
  sec1Input: document.getElementById('secondary1Input'),
  sec2Picker: document.getElementById('secondary2Picker'),
  sec2Input: document.getElementById('secondary2Input'),
  btnComplement: document.getElementById('btn-complement'),
  swapBtn: document.getElementById('swapColors'),
  mainPalette: document.getElementById('mainPalette'),
  secondaryPalette: document.getElementById('secondaryPalette'),
  neutralPalette: document.getElementById('neutralPalette'),
  swMain: document.getElementById('sw-main'),
  swSec: document.getElementById('sw-sec'),
  swNeu: document.getElementById('sw-neu'),
  activeRadios: document.getElementsByName('activePalette'),
  buttonsExample: document.getElementById('buttonsExample'),
  contrasts: document.getElementById('contrasts'),
  pieSvg: document.getElementById('pieSvg'),
  pieLegend: document.getElementById('pieLegend'),
  note50: document.getElementById('note50'),
  note100: document.getElementById('note100'),
  note150: document.getElementById('note150'),
  showNoticeBtn: document.getElementById('showNotice'),
  modal: document.getElementById('modal'),
  closeModal: document.getElementById('closeModal'),
  modalBack: document.getElementById('modalBack'),
  modalAccept: document.getElementById('modalAccept'),
  btnGenerate: document.getElementById('btn-generate'),
  toggleDark: document.getElementById('toggle-dark'),
  appRoot: document.getElementById('app'),
  accessPanel: document.getElementById('accessPanel'),
  btnAccess: document.getElementById('btn-accessibility'),
  closeAccess: document.getElementById('closeAccess'),
  closeAccessBtn: document.getElementById('closeAccessBtn'),
  textColorPicker: document.getElementById('textColorPicker'),
  textColorInput: document.getElementById('textColorInput'),
  bgColorPicker: document.getElementById('bgColorPicker'),
  bgColorInput: document.getElementById('bgColorInput'),
  swapAccess: document.getElementById('swapAccess'),
  normalPreview: document.getElementById('normalPreview'),
  largePreview: document.getElementById('largePreview'),
  normalPass: document.getElementById('normalPass'),
  largePass: document.getElementById('largePass'),
  contrastValue: document.getElementById('contrastValue'),
  show45: document.getElementById('show45'),
  show7: document.getElementById('show7'),
  ratioResults: document.getElementById('ratioResults'),
  btnAccessibility: document.getElementById('btn-accessibility'),
  showNotice: document.getElementById('showNotice'),
};

/* -----------------------
   Inicialización UI
   ----------------------- */

function initValues(){
  nodes.mainPicker.value = state.mainColor;
  nodes.mainInput.value = state.mainColor;
  nodes.sec1Picker.value = state.secondary1;
  nodes.sec1Input.value = state.secondary1;
  nodes.sec2Picker.value = state.secondary2;
  nodes.sec2Input.value = state.secondary2;

  nodes.textColorPicker.value = state.textColor;
  nodes.textColorInput.value = state.textColor;
  nodes.bgColorPicker.value = state.bgColor;
  nodes.bgColorInput.value = state.bgColor;

  nodes.toggleDark.checked = state.darkMode;
  applyTheme();
}

function applyTheme(){
  if(state.darkMode){
    document.documentElement.style.setProperty('--bg','#0b1220');
    document.documentElement.style.setProperty('--card','#0f1724');
    document.documentElement.style.setProperty('--muted','#9ca3af');
    document.documentElement.style.setProperty('--text','#e6eef8');
  } else {
    document.documentElement.style.setProperty('--bg','#f3f4f6');
    document.documentElement.style.setProperty('--card','#ffffff');
    document.documentElement.style.setProperty('--muted','#6b7280');
    document.documentElement.style.setProperty('--text','#111827');
  }
  nodes.appRoot.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg');
}

/* -----------------------
   Render paletas / UI
   ----------------------- */

function renderPalettes(){
  const mainPal = generatePalette(state.mainColor);
  const secPal = generatePalette(state.secondary1);
  const neuPal = generatePalette(state.secondary2);

  renderPaletteNode(nodes.mainPalette, mainPal);
  renderPaletteNode(nodes.secondaryPalette, secPal);
  renderPaletteNode(nodes.neutralPalette, neuPal);

  // update swatches
  nodes.swMain.style.background = mainPal[500];
  nodes.swSec.style.background = secPal[500];
  nodes.swNeu.style.background = neuPal[500];

  // update notes
  nodes.note50.style.borderLeftColor = mainPal[600];
  nodes.note50.style.background = mainPal[50];
  nodes.note100.style.borderLeftColor = mainPal[600];
  nodes.note100.style.background = mainPal[100];
  nodes.note150.style.borderLeftColor = mainPal[600];
  nodes.note150.style.background = mainPal[150];

  renderExamples();
}

function renderPaletteNode(container, palette){
  container.innerHTML = '';
  Object.keys(palette).forEach(shade => {
    const color = palette[shade];
    const d = document.createElement('div');
    d.className = 'swatch';
    d.style.background = color;
    d.style.color = parseInt(shade) >= 500 ? '#fff' : '#000';
    d.title = `${shade} — ${color}`;
    d.innerHTML = `<div style="text-align:center">${shade}<div style="font-size:10px;opacity:0.85">${color}</div></div>`;
    d.addEventListener('click', () => {
      navigator.clipboard?.writeText(color).then(()=> {
        alert('Copiado: ' + color);
      }).catch(()=> {
        alert('Color: ' + color);
      });
    });
    container.appendChild(d);
  });
}

/* -----------------------
   Ejemplos dinámicos
   ----------------------- */

function getActivePalette(){
  if(state.activePaletteKey === 'secundario') return generatePalette(state.secondary1);
  if(state.activePaletteKey === 'neutral') return generatePalette(state.secondary2);
  return generatePalette(state.mainColor);
}

function renderExamples(){
  const active = getActivePalette();
  // botones
  nodes.buttonsExample.innerHTML = '';
  ['600','700','800'].forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = key === '600' ? 'Predeterminado' : (key === '700' ? 'Encima' : 'Presionado');
    btn.style.background = active[key] || active[600];
    btn.style.border = 'none';
    btn.style.padding = '8px';
    btn.style.borderRadius = '6px';
    btn.style.color = '#fff';
    btn.style.marginBottom = '6px';
    nodes.buttonsExample.appendChild(btn);
  });
  const disabled = document.createElement('button');
  disabled.textContent = 'Deshabilitado';
  disabled.disabled = true;
  disabled.style.background = state.darkMode ? '#374151' : '#e5e7eb';
  disabled.style.color = '#9ca3af';
  disabled.style.padding = '8px';
  disabled.style.borderRadius = '6px';
  nodes.buttonsExample.appendChild(disabled);

  // contrasts
  nodes.contrasts.innerHTML = '';
  const entries = [
    {bg: active[50], iconBg: active[100], labelBg: active[600], labelText: active[900], icon:'🛒', iconColor: active[600]},
    {bg: active[100], iconBg: active[200], labelBg: active[600], labelText: active[900], icon:'🌐', iconColor: active[600]},
    {bg: active[200], iconBg: active[400], labelBg: active[900], labelText: active[700], icon:'💳', iconColor: active[600]},
    {bg: active[700], iconBg: active[600], labelBg: '#fff', labelText: '#fff', icon:'🏠', iconColor: '#fff', white:true},
  ];
  entries.forEach(e => {
    const r = document.createElement('div');
    r.className = 'contrast-row';
    r.style.display = 'flex';
    r.style.alignItems = 'center';
    r.style.gap = '12px';
    r.style.padding = '10px';
    r.style.borderRadius = '8px';
    r.style.background = e.bg;
    r.innerHTML = `<div style="width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:${e.iconBg};">${e.icon}</div>
      <div style="flex:1">
        <div style="font-size:12px;color:${e.labelText};font-weight:600">Fondo contraste</div>
        <div style="font-size:12px;color:${e.labelBg}">Fondo icono</div>
      </div>
      <div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:${active[400]};">›</div>`;
    nodes.contrasts.appendChild(r);
  });

  // pie
  nodes.pieSvg.innerHTML = `
    <circle cx="50" cy="50" r="40" fill="none" stroke="${active[600]}" stroke-width="20" stroke-dasharray="100 151" transform="rotate(-90 50 50)"></circle>
    <circle cx="50" cy="50" r="40" fill="none" stroke="${active[400]}" stroke-width="20" stroke-dasharray="62.5 188.5" stroke-dashoffset="-100" transform="rotate(-90 50 50)"></circle>
    <circle cx="50" cy="50" r="40" fill="none" stroke="${active[200]}" stroke-width="20" stroke-dasharray="37.5 213.5" stroke-dashoffset="-162.5" transform="rotate(-90 50 50)"></circle>
    <circle cx="50" cy="50" r="20" fill="#ffffff" />
  `;
  nodes.pieLegend.innerHTML = `
    <li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${active[600]};"></span> Contraste 600</li>
    <li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${active[400]};"></span> Contraste 400</li>
    <li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:${active[200]};"></span> Contraste 200</li>
  `;

  // message actions colored
  const msg = document.querySelector('.message-sample');
  msg.style.background = state.darkMode ? '#0f1724' : '#ffffff';
  msg.querySelector('p').style.color = state.darkMode ? '#e6eef8' : '#111827';
  // action buttons
  document.querySelectorAll('.link-like, .link-reply, .link-more').forEach(btn=>{
    btn.style.color = active[600];
  });

  // button that opens modal colored by active palette 600
  nodes.modalAccept.style.background = active[600];
  nodes.showNotice.style.borderColor = state.darkMode ? '#374151' : '#e6e7eb';
}

/* -----------------------
   Interacciones
   ----------------------- */

function wireEvents(){
  // color inputs
  nodes.mainPicker.addEventListener('input', (e)=> {
    state.mainColor = e.target.value;
    nodes.mainInput.value = state.mainColor;
    renderPalettes();
  });
  nodes.mainInput.addEventListener('change', (e)=> {
    state.mainColor = e.target.value;
    nodes.mainPicker.value = state.mainColor;
    renderPalettes();
  });

  nodes.sec1Picker.addEventListener('input', (e)=> {
    state.secondary1 = e.target.value;
    nodes.sec1Input.value = state.secondary1;
    renderPalettes();
  });
  nodes.sec1Input.addEventListener('change', (e)=> {
    state.secondary1 = e.target.value;
    nodes.sec1Picker.value = state.secondary1;
    renderPalettes();
  });

  nodes.sec2Picker.addEventListener('input', (e)=> {
    state.secondary2 = e.target.value;
    nodes.sec2Input.value = state.secondary2;
    renderPalettes();
  });
  nodes.sec2Input.addEventListener('change', (e)=> {
    state.secondary2 = e.target.value;
    nodes.sec2Picker.value = state.secondary2;
    renderPalettes();
  });

  // complementary
  nodes.btnComplement.addEventListener('click', ()=>{
    state.secondary1 = getComplementaryColor(state.mainColor);
    nodes.sec1Picker.value = state.secondary1;
    nodes.sec1Input.value = state.secondary1;
    renderPalettes();
  });

  // swap principal/secondary
  nodes.swapBtn.addEventListener('click', ()=>{
    const tmp = state.mainColor;
    state.mainColor = state.secondary1;
    state.secondary1 = tmp;
    nodes.mainPicker.value = state.mainColor;
    nodes.mainInput.value = state.mainColor;
    nodes.sec1Picker.value = state.secondary1;
    nodes.sec1Input.value = state.secondary1;
    renderPalettes();
  });

  // palette radio
  Array.from(nodes.activeRadios).forEach(r=>{
    r.addEventListener('change', (ev)=>{
      state.activePaletteKey = ev.target.value === 'principal' ? 'principal' : (ev.target.value === 'secundario' ? 'secundario' : 'neutral');
      renderExamples();
    });
  });

  // modal
  nodes.showNotice.addEventListener('click', ()=> {
    nodes.modal.classList.remove('hidden');
  });
  nodes.closeModal.addEventListener('click', ()=> nodes.modal.classList.add('hidden'));
  nodes.modalBack.addEventListener('click', ()=> nodes.modal.classList.add('hidden'));
  nodes.modalAccept.addEventListener('click', ()=> nodes.modal.classList.add('hidden'));

  // generate button (dummy)
  nodes.btnGenerate.addEventListener('click', ()=> {
    alert('Generar - funcionalidad extra (placeholder)');
  });

  // darkmode toggle
  nodes.toggleDark.addEventListener('change', (e)=> {
    state.darkMode = e.target.checked;
    applyTheme();
    renderPalettes();
  });

  // accessibility panel
  nodes.btnAccess.addEventListener('click', ()=> {
    nodes.accessPanel.classList.remove('hidden');
  });
  nodes.closeAccess.addEventListener('click', ()=> nodes.accessPanel.classList.add('hidden'));
  nodes.closeAccessBtn.addEventListener('click', ()=> nodes.accessPanel.classList.add('hidden'));

  // access color pickers
  nodes.textColorPicker.addEventListener('input', (e)=>{
    state.textColor = e.target.value;
    nodes.textColorInput.value = state.textColor;
    updateContrastPreviews();
  });
  nodes.textColorInput.addEventListener('change', (e)=>{
    state.textColor = e.target.value;
    nodes.textColorPicker.value = state.textColor;
    updateContrastPreviews();
  });

  nodes.bgColorPicker.addEventListener('input', (e)=>{
    state.bgColor = e.target.value;
    nodes.bgColorInput.value = state.bgColor;
    updateContrastPreviews();
  });
  nodes.bgColorInput.addEventListener('change', (e)=>{
    state.bgColor = e.target.value;
    nodes.bgColorPicker.value = state.bgColor;
    updateContrastPreviews();
  });

  nodes.swapAccess.addEventListener('click', ()=>{
    const tmp = state.textColor;
    state.textColor = state.bgColor;
    state.bgColor = tmp;
    nodes.textColorPicker.value = state.textColor;
    nodes.textColorInput.value = state.textColor;
    nodes.bgColorPicker.value = state.bgColor;
    nodes.bgColorInput.value = state.bgColor;
    updateContrastPreviews();
  });

  nodes.show45.addEventListener('change', (e)=> {
    state.showRatio45 = e.target.checked;
    updateContrastPreviews();
  });
  nodes.show7.addEventListener('change', (e)=> {
    state.showRatio7 = e.target.checked;
    updateContrastPreviews();
  });
}

/* -----------------------
   Contraste & previsualización
   ----------------------- */

function updateContrastPreviews(){
  const ratio = getContrastRatio(state.textColor, state.bgColor);
  const normalPass = ratio >= 4.5;
  const largePass = ratio >= 3.0;

  nodes.normalPreview.style.background = state.bgColor;
  nodes.normalPreview.style.color = state.textColor;
  nodes.largePreview.style.background = state.bgColor;
  nodes.largePreview.style.color = state.textColor;

  nodes.normalPass.textContent = normalPass ? 'Pasa' : 'Falla';
  nodes.normalPass.style.background = normalPass ? '#DCFCE7' : '#FEE2E2';
  nodes.largePass.textContent = largePass ? 'Pasa' : 'Falla';
  nodes.largePass.style.background = largePass ? '#DCFCE7' : '#FEE2E2';

  nodes.contrastValue.textContent = ratio.toFixed(2) + ' / 1';

  let html = '';
  if(state.showRatio45){
    html += `<div>Ratio mínimo <strong>4.5</strong> → <strong style="color:${(ratio>=4.5)?'#16A34A':'#DC2626'}">${(ratio>=4.5)?'Pasa':'Falla'}</strong></div>`;
  }
  if(state.showRatio7){
    html += `<div>Ratio mínimo <strong>7.0</strong> → <strong style="color:${(ratio>=7)?'#16A34A':'#DC2626'}">${(ratio>=7)?'Pasa':'Falla'}</strong></div>`;
  }
  nodes.ratioResults.innerHTML = html;
}

/* -----------------------
   Boot
   ----------------------- */

function boot(){
  initValues();
  wireEvents();
  renderPalettes();
  updateContrastPreviews();
}

document.addEventListener('DOMContentLoaded', boot);
