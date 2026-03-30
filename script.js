/* ═══════════════════════════════════════════════
   Espectro UI — script.js
   ═══════════════════════════════════════════════ */

/* ─── Color math ─────────────────────────────── */

function hexToHsl(hex) {
  var r = parseInt(hex.slice(1,3),16)/255,
      g = parseInt(hex.slice(3,5),16)/255,
      b = parseInt(hex.slice(5,7),16)/255;
  var max=Math.max(r,g,b), min=Math.min(r,g,b), h, s, l=(max+min)/2;
  if (max===min) { h=s=0; } else {
    var d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if      (max===r) h=(g-b)/d+(g<b?6:0);
    else if (max===g) h=(b-r)/d+2;
    else              h=(r-g)/d+4;
    h/=6;
  }
  return {h:h*360, s:s*100, l:l*100};
}

function hslToHex(h,s,l) {
  l/=100;
  var a=s*Math.min(l,1-l)/100;
  function f(n){
    var k=(n+h/30)%12;
    var c=l-a*Math.max(Math.min(k-3,9-k,1),-1);
    return Math.round(255*c).toString(16).padStart(2,'0');
  }
  return '#'+f(0)+f(8)+f(4);
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16)
  };
}

function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(function(v){
    return Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0');
  }).join('');
}

function generatePalette(baseColor) {
  var hsl = hexToHsl(baseColor);
  var shades = [50,100,150,200,250,300,350,400,450,500,550,600,650,700,750,800,850,900];
  var lums   = {50:95,100:90,150:85,200:80,250:75,300:70,350:65,400:60,
                450:55,500:50,550:45,600:40,650:35,700:30,750:25,800:20,850:15,900:10};
  var lDiff  = 50 - hsl.l;
  var pal    = {};
  shades.forEach(function(s){
    var l = Math.max(0, Math.min(100, lums[s]-lDiff));
    pal[s] = hslToHex(hsl.h, hsl.s, l);
  });
  pal[500] = baseColor;
  return pal;
}

function getLuminance(hex) {
  var rgb = hexToRgb(hex);
  var vals = [rgb.r, rgb.g, rgb.b].map(function(c){
    c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
  });
  return 0.2126*vals[0]+0.7152*vals[1]+0.0722*vals[2];
}

function getContrastRatio(c1,c2) {
  var l1=getLuminance(c1), l2=getLuminance(c2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

function complementary(hex) {
  var h=hexToHsl(hex); return hslToHex((h.h+180)%360,h.s,h.l);
}

/* ─── Daltonismo ─────────────────────────────── */
/* Matrices de simulación (Brettel et al.) */
var CB_MATRICES = {
  'Protanopia (rojo)': [
    [0.56667,0.43333,0],[0.55833,0.44167,0],[0,0.24167,0.75833]
  ],
  'Deuteranopia (verde)': [
    [0.625,0.375,0],[0.70,0.30,0],[0,0.30,0.70]
  ],
  'Tritanopia (azul)': [
    [0.95,0.05,0],[0,0.43333,0.56667],[0,0.475,0.525]
  ],
  'Acromatopsia': [
    [0.299,0.587,0.114],[0.299,0.587,0.114],[0.299,0.587,0.114]
  ]
};

function simulateColorblind(hex, matrix) {
  var c  = hexToRgb(hex);
  var r  = c.r/255, g=c.g/255, b=c.b/255;
  var nr = matrix[0][0]*r + matrix[0][1]*g + matrix[0][2]*b;
  var ng = matrix[1][0]*r + matrix[1][1]*g + matrix[1][2]*b;
  var nb = matrix[2][0]*r + matrix[2][1]*g + matrix[2][2]*b;
  return rgbToHex(nr*255, ng*255, nb*255);
}

/* ─── Armonías ───────────────────────────────── */
function buildHarmonies(hex) {
  var h = hexToHsl(hex);
  var harmonies = [
    {
      name: 'Análoga',
      desc: 'Colores adyacentes en el círculo cromático',
      colors: [
        hslToHex((h.h-30+360)%360, h.s, h.l),
        hslToHex((h.h-15+360)%360, h.s, h.l),
        hex,
        hslToHex((h.h+15)%360, h.s, h.l),
        hslToHex((h.h+30)%360, h.s, h.l)
      ]
    },
    {
      name: 'Complementaria',
      desc: 'Color opuesto en el círculo cromático',
      colors: [
        hslToHex(h.h, h.s, Math.min(h.l+20,90)),
        hex,
        hslToHex(h.h, h.s, Math.max(h.l-20,10)),
        hslToHex((h.h+180)%360, h.s, Math.min(h.l+20,90)),
        hslToHex((h.h+180)%360, h.s, h.l)
      ]
    },
    {
      name: 'Triádica',
      desc: 'Tres colores equidistantes a 120°',
      colors: [
        hex,
        hslToHex((h.h+120)%360, h.s, h.l),
        hslToHex((h.h+240)%360, h.s, h.l)
      ]
    },
    {
      name: 'Split-Complementaria',
      desc: 'Color base + dos adyacentes al complementario',
      colors: [
        hex,
        hslToHex((h.h+150)%360, h.s, h.l),
        hslToHex((h.h+210)%360, h.s, h.l)
      ]
    },
    {
      name: 'Tetrádica',
      desc: 'Cuatro colores equidistantes a 90°',
      colors: [
        hex,
        hslToHex((h.h+90)%360, h.s, h.l),
        hslToHex((h.h+180)%360, h.s, h.l),
        hslToHex((h.h+270)%360, h.s, h.l)
      ]
    },
    {
      name: 'Monocromática',
      desc: 'Variaciones de luminosidad del mismo tono',
      colors: [
        hslToHex(h.h, h.s, Math.min(h.l+40,95)),
        hslToHex(h.h, h.s, Math.min(h.l+20,90)),
        hex,
        hslToHex(h.h, h.s, Math.max(h.l-20,10)),
        hslToHex(h.h, h.s, Math.max(h.l-40,5))
      ]
    }
  ];
  return harmonies;
}

/* ─── Exportación ────────────────────────────── */
function buildExport(fmt, mainPal, secPal, neuPal) {
  var lines = [];
  var palettes = [
    {name:'primary',   pal:mainPal},
    {name:'secondary', pal:secPal},
    {name:'neutral',   pal:neuPal}
  ];

  if (fmt==='css') {
    lines.push(':root {');
    palettes.forEach(function(p){
      Object.keys(p.pal).forEach(function(s){
        lines.push('  --color-'+p.name+'-'+s+': '+p.pal[s]+';');
      });
    });
    lines.push('}');
  } else if (fmt==='json') {
    var obj = {};
    palettes.forEach(function(p){
      obj[p.name]={};
      Object.keys(p.pal).forEach(function(s){ obj[p.name][s]=p.pal[s]; });
    });
    return JSON.stringify(obj, null, 2);
  } else if (fmt==='tailwind') {
    lines.push("// tailwind.config.js");
    lines.push("module.exports = {");
    lines.push("  theme: {");
    lines.push("    extend: {");
    lines.push("      colors: {");
    palettes.forEach(function(p){
      lines.push("        "+p.name+": {");
      Object.keys(p.pal).forEach(function(s){
        lines.push("          '"+s+"': '"+p.pal[s]+"',");
      });
      lines.push("        },");
    });
    lines.push("      },");
    lines.push("    },");
    lines.push("  },");
    lines.push("};");
  } else if (fmt==='scss') {
    palettes.forEach(function(p){
      Object.keys(p.pal).forEach(function(s){
        lines.push('$color-'+p.name+'-'+s+': '+p.pal[s]+';');
      });
      lines.push('');
    });
  }
  return lines.join('\n');
}

/* ─── Toast ──────────────────────────────────── */
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },400); }, 1800);
}

/* ─── Panel helpers ──────────────────────────── */
function showPanel(el){ if(el) el.classList.remove('hidden'); }
function hidePanel(el){ if(el) el.classList.add('hidden'); }

/* ─── Estado ─────────────────────────────────── */
var state = {
  mainColor:        '#dd1389',
  secondary1:       '#266bd9',
  secondary2:       '#747c86',
  activePaletteKey: 'principal',
  darkMode:         false,
  textColor:        '#ffffff',
  bgColor:          '#1e3a5f',
  showRatio45:      true,
  showRatio7:       true,
  activeTab:        'paletas',
  exportFmt:        'css'
};

/* ─── Nodos ──────────────────────────────────── */
var n = {};
function grabNodes() {
  var ids = {
    mainPicker:'mainColorPicker', mainInput:'mainColorInput',
    sec1Picker:'secondary1Picker', sec1Input:'secondary1Input',
    sec2Picker:'secondary2Picker', sec2Input:'secondary2Input',
    btnComplement:'btn-complement', swapBtn:'swapColors',
    btnExport:'btn-export',
    mainPalette:'mainPalette', secPalette:'secondaryPalette', neuPalette:'neutralPalette',
    swMain:'sw-main', swSec:'sw-sec', swNeu:'sw-neu',
    buttonsExample:'buttonsExample', contrasts:'contrasts',
    pieSvg:'pieSvg', pieLegend:'pieLegend',
    toggleDark:'toggle-dark', appRoot:'app',
    textColorPicker:'textColorPicker', textColorInput:'textColorInput',
    bgColorPicker:'bgColorPicker', bgColorInput:'bgColorInput',
    swapAccess:'swapAccess',
    normalPreview:'normalPreview', largePreview:'largePreview',
    normalPass:'normalPass', largePass:'largePass',
    contrastValue:'contrastValue', wcagBadges:'wcag-badges',
    show45:'show45', show7:'show7', ratioResults:'ratioResults',
    colorblindGrid:'colorblind-grid', harmoniesGrid:'harmonies-grid',
    exportModal:'exportModal', closeExportModal:'closeExportModal',
    closeExportModal2:'closeExportModal2', exportOutput:'exportOutput',
    copyExport:'copyExport'
  };
  Object.keys(ids).forEach(function(k){ n[k]=document.getElementById(ids[k]); });
  n.tabBtns    = document.querySelectorAll('.tab-btn');
  n.tabPanels  = document.querySelectorAll('.tab-panel');
  n.radios     = document.getElementsByName('activePalette');
  n.exportTabs = document.querySelectorAll('.export-tab');
}

/* ─── Tema ───────────────────────────────────── */
function applyTheme() {
  var dark = state.darkMode;
  document.documentElement.style.setProperty('--bg',    dark?'#0b1220':'#f3f4f6');
  document.documentElement.style.setProperty('--card',  dark?'#0f1724':'#ffffff');
  document.documentElement.style.setProperty('--muted', dark?'#9ca3af':'#6b7280');
  document.documentElement.style.setProperty('--text',  dark?'#e6eef8':'#111827');
  document.documentElement.style.setProperty('--border',dark?'#1e2d40':'#e5e7eb');
  document.body.classList.toggle('dark', dark);
  document.querySelectorAll('.text-input').forEach(function(el){
    el.style.background  = dark?'#1f2937':'#f9fafb';
    el.style.borderColor = dark?'#374151':'#d1d5db';
    el.style.color       = dark?'#e6eef8':'#111827';
  });
}

/* ─── Init ───────────────────────────────────── */
function initValues() {
  n.mainPicker.value      = state.mainColor;
  n.mainInput.value       = state.mainColor;
  n.sec1Picker.value      = state.secondary1;
  n.sec1Input.value       = state.secondary1;
  n.sec2Picker.value      = state.secondary2;
  n.sec2Input.value       = state.secondary2;
  n.textColorPicker.value = state.textColor;
  n.textColorInput.value  = state.textColor;
  n.bgColorPicker.value   = state.bgColor;
  n.bgColorInput.value    = state.bgColor;
  n.toggleDark.checked    = state.darkMode;
  applyTheme();
}

/* ─── Render paletas ─────────────────────────── */
function bestTextColor(hex) {
  return getLuminance(hex) > 0.35 ? '#000000' : '#ffffff';
}

function renderPaletteNode(container, palette) {
  if (!container) return;
  container.innerHTML = '';
  Object.keys(palette).forEach(function(shade){
    var color = palette[shade];
    var textC = bestTextColor(color);
    var ratioW = getContrastRatio(color,'#ffffff');
    var ratioB = getContrastRatio(color,'#000000');
    var best   = ratioW>=ratioB ? ratioW : ratioB;
    var dotColor = best>=4.5 ? '#22c55e' : (best>=3 ? '#f59e0b' : '#ef4444');

    var d = document.createElement('div');
    d.className = 'swatch';
    d.style.background = color;
    d.style.color = textC;
    d.title = shade+' — '+color+' | Contraste: '+best.toFixed(1)+':1';
    d.innerHTML =
      '<div class="wcag-dot" style="background:'+dotColor+'" title="'+
        (best>=4.5?'AA/AAA':'best>=3?AA grande:Falla WCAG')+'"></div>'+
      '<div style="text-align:center;line-height:1.3;font-size:10px">'+shade+
      '<div style="opacity:.85">'+color+'</div></div>';

    d.addEventListener('click', function(){
      if (navigator.clipboard) {
        navigator.clipboard.writeText(color).then(function(){ showToast('Copiado '+color); });
      } else { showToast(color); }
    });
    container.appendChild(d);
  });
}

function renderPalettes() {
  var mp = generatePalette(state.mainColor);
  var sp = generatePalette(state.secondary1);
  var np = generatePalette(state.secondary2);
  renderPaletteNode(n.mainPalette, mp);
  renderPaletteNode(n.secPalette,  sp);
  renderPaletteNode(n.neuPalette,  np);
  if (n.swMain) n.swMain.style.background = mp[500];
  if (n.swSec)  n.swSec.style.background  = sp[500];
  if (n.swNeu)  n.swNeu.style.background  = np[500];
  renderExamples();
  renderHarmonies();
  renderExportOutput();
}

/* ─── Ejemplos ───────────────────────────────── */
function getActivePalette() {
  if (state.activePaletteKey==='secundario') return generatePalette(state.secondary1);
  if (state.activePaletteKey==='neutral')    return generatePalette(state.secondary2);
  return generatePalette(state.mainColor);
}

function renderExamples() {
  var active = getActivePalette();

  /* Botones */
  if (n.buttonsExample) {
    n.buttonsExample.innerHTML='';
    [['600','Predeterminado'],['700','Encima (hover)'],['800','Presionado']].forEach(function(pair){
      var btn=document.createElement('button');
      btn.textContent=pair[1];
      btn.style.cssText='background:'+active[pair[0]]+';border:none;padding:9px 14px;border-radius:7px;color:#fff;font-weight:600;cursor:pointer;width:100%';
      n.buttonsExample.appendChild(btn);
    });
    var dis=document.createElement('button');
    dis.textContent='Deshabilitado';
    dis.disabled=true;
    dis.style.cssText='background:'+(state.darkMode?'#374151':'#e5e7eb')+';color:#9ca3af;padding:9px 14px;border-radius:7px;border:none;width:100%';
    n.buttonsExample.appendChild(dis);
  }

  /* Contrastes */
  if (n.contrasts) {
    n.contrasts.innerHTML='';
    var entries=[
      {bg:active[50], iconBg:active[100], labelText:active[900], labelSub:active[600], icon:'🛒'},
      {bg:active[100],iconBg:active[200], labelText:active[900], labelSub:active[600], icon:'🌐'},
      {bg:active[200],iconBg:active[400], labelText:active[700], labelSub:active[900], icon:'💳'},
      {bg:active[700],iconBg:active[600], labelText:'#fff',       labelSub:'#ffffffaa', icon:'🏠'}
    ];
    entries.forEach(function(e){
      var r=document.createElement('div');
      r.style.cssText='display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;background:'+e.bg;
      r.innerHTML=
        '<div style="width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:'+e.iconBg+';font-size:16px">'+e.icon+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;font-weight:700;color:'+e.labelText+'">Elemento de lista</div>'+
        '<div style="font-size:11px;color:'+e.labelSub+'">Subtexto descriptivo</div></div>'+
        '<div style="color:'+active[500]+'">›</div>';
      n.contrasts.appendChild(r);
    });
  }

  /* Pie */
  if (n.pieSvg) {
    n.pieSvg.innerHTML=
      '<circle cx="50" cy="50" r="40" fill="none" stroke="'+active[600]+'" stroke-width="20" stroke-dasharray="100 151" transform="rotate(-90 50 50)"></circle>'+
      '<circle cx="50" cy="50" r="40" fill="none" stroke="'+active[400]+'" stroke-width="20" stroke-dasharray="62.5 188.5" stroke-dashoffset="-100" transform="rotate(-90 50 50)"></circle>'+
      '<circle cx="50" cy="50" r="40" fill="none" stroke="'+active[200]+'" stroke-width="20" stroke-dasharray="37.5 213.5" stroke-dashoffset="-162.5" transform="rotate(-90 50 50)"></circle>'+
      '<circle cx="50" cy="50" r="20" fill="'+(state.darkMode?'#0f1724':'#ffffff')+'"></circle>';
  }
  if (n.pieLegend) {
    n.pieLegend.innerHTML=
      '<li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:'+active[600]+'"></span> Categoría A (40%)</li>'+
      '<li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:'+active[400]+'"></span> Categoría B (25%)</li>'+
      '<li><span style="display:inline-block;width:10px;height:10px;border-radius:999px;background:'+active[200]+'"></span> Categoría C (35%)</li>';
  }

  /* Mensajería */
  var msg=document.querySelector('.message-sample');
  if (msg) {
    msg.style.background=state.darkMode?'#0f1724':'#ffffff';
    var p=msg.querySelector('p');
    if(p) p.style.color=state.darkMode?'#e6eef8':'#111827';
    msg.querySelectorAll('.link-like,.link-reply,.link-more').forEach(function(b){ b.style.color=active[600]; });
  }
}

/* ─── Accesibilidad ──────────────────────────── */
function updateContrast() {
  var ratio = getContrastRatio(state.textColor, state.bgColor);
  var passAA    = ratio >= 4.5;
  var passAAA   = ratio >= 7.0;
  var passLarge = ratio >= 3.0;

  if (n.normalPreview){ n.normalPreview.style.background=state.bgColor; n.normalPreview.style.color=state.textColor; }
  if (n.largePreview) { n.largePreview.style.background=state.bgColor;  n.largePreview.style.color=state.textColor; }

  if (n.normalPass) {
    n.normalPass.textContent     = passAA ? '✓ AA Pasa' : '✗ AA Falla';
    n.normalPass.style.background= passAA ? '#DCFCE7' : '#FEE2E2';
    n.normalPass.style.color     = passAA ? '#166534' : '#991b1b';
  }
  if (n.largePass) {
    n.largePass.textContent     = passLarge ? '✓ AA Pasa' : '✗ Falla';
    n.largePass.style.background= passLarge ? '#DCFCE7' : '#FEE2E2';
    n.largePass.style.color     = passLarge ? '#166534' : '#991b1b';
  }
  if (n.contrastValue) n.contrastValue.textContent = ratio.toFixed(2)+':1';

  /* WCAG badges */
  if (n.wcagBadges) {
    var badges=[
      {label:'AA Normal', pass:passAA},
      {label:'AA Grande', pass:passLarge},
      {label:'AAA Normal', pass:passAAA},
      {label:'AAA Grande', pass:ratio>=4.5}
    ];
    n.wcagBadges.innerHTML='';
    badges.forEach(function(b){
      var s=document.createElement('span');
      s.textContent=(b.pass?'✓ ':'✗ ')+b.label;
      s.style.cssText='padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;background:'+(b.pass?'#DCFCE7':'#FEE2E2')+';color:'+(b.pass?'#166534':'#991b1b');
      n.wcagBadges.appendChild(s);
    });
  }

  var html='';
  if (state.showRatio45) {
    html+='<div style="margin-bottom:4px">Nivel AA (4.5:1) texto normal → <strong style="color:'+(passAA?'#16A34A':'#DC2626')+'">'+(passAA?'✓ Pasa':'✗ Falla')+'</strong></div>';
  }
  if (state.showRatio7) {
    html+='<div>Nivel AAA (7.0:1) texto normal → <strong style="color:'+(passAAA?'#16A34A':'#DC2626')+'">'+(passAAA?'✓ Pasa':'✗ Falla')+'</strong></div>';
  }
  if (n.ratioResults) n.ratioResults.innerHTML=html;

  renderColorblind();
}

function renderColorblind() {
  if (!n.colorblindGrid) return;
  n.colorblindGrid.innerHTML='';
  Object.keys(CB_MATRICES).forEach(function(name){
    var matrix = CB_MATRICES[name];
    var simText = simulateColorblind(state.textColor, matrix);
    var simBg   = simulateColorblind(state.bgColor,   matrix);
    var card=document.createElement('div');
    card.className='colorblind-card';
    card.innerHTML=
      '<div class="colorblind-preview" style="background:'+simBg+';color:'+simText+'">'+
        'El diseño accesible beneficia a todos.'+
      '</div>'+
      '<div class="colorblind-label">'+name+'</div>';
    n.colorblindGrid.appendChild(card);
  });
}

/* ─── Armonías ───────────────────────────────── */
function renderHarmonies() {
  if (!n.harmoniesGrid) return;
  n.harmoniesGrid.innerHTML='';
  buildHarmonies(state.mainColor).forEach(function(h){
    var card=document.createElement('div');
    card.className='harmony-card';
    var swatchesHtml='';
    h.colors.forEach(function(c){
      swatchesHtml+='<span style="background:'+c+'"></span>';
    });
    var hexesHtml='';
    h.colors.forEach(function(c){
      hexesHtml+='<span class="harmony-hex" data-color="'+c+'" title="Copiar '+c+'">'+c+'</span>';
    });
    card.innerHTML=
      '<div class="harmony-swatches">'+swatchesHtml+'</div>'+
      '<div class="harmony-info">'+
        '<h5>'+h.name+'</h5>'+
        '<p class="muted small" style="margin:0 0 8px">'+h.desc+'</p>'+
        '<div class="harmony-colors">'+hexesHtml+'</div>'+
      '</div>';
    card.querySelectorAll('.harmony-hex').forEach(function(el){
      el.addEventListener('click',function(){
        var c=el.dataset.color;
        if(navigator.clipboard){ navigator.clipboard.writeText(c).then(function(){ showToast('Copiado '+c); }); }
        else showToast(c);
      });
    });
    n.harmoniesGrid.appendChild(card);
  });
}

/* ─── Exportar ───────────────────────────────── */
function renderExportOutput() {
  if (!n.exportOutput) return;
  var mp = generatePalette(state.mainColor);
  var sp = generatePalette(state.secondary1);
  var np = generatePalette(state.secondary2);
  n.exportOutput.value = buildExport(state.exportFmt, mp, sp, np);
}

/* ─── Tabs ───────────────────────────────────── */
function switchTab(tabId) {
  state.activeTab = tabId;
  n.tabBtns.forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.tab===tabId);
  });
  n.tabPanels.forEach(function(panel){
    panel.classList.toggle('hidden', panel.id!=='tab-'+tabId);
  });
}

/* ─── Eventos ────────────────────────────────── */
function wireEvents() {
  /* color pickers */
  function bindColor(picker, input, stateKey) {
    if(picker) picker.addEventListener('input',function(e){
      state[stateKey]=e.target.value;
      if(input) input.value=state[stateKey];
      renderPalettes();
    });
    if(input) input.addEventListener('change',function(e){
      var v=e.target.value.trim();
      if(/^#[0-9a-f]{6}$/i.test(v)){
        state[stateKey]=v;
        if(picker) picker.value=v;
        renderPalettes();
      }
    });
  }
  bindColor(n.mainPicker, n.mainInput, 'mainColor');
  bindColor(n.sec1Picker, n.sec1Input, 'secondary1');
  bindColor(n.sec2Picker, n.sec2Input, 'secondary2');

  if(n.btnComplement) n.btnComplement.addEventListener('click',function(){
    state.secondary1=complementary(state.mainColor);
    n.sec1Picker.value=state.secondary1;
    n.sec1Input.value=state.secondary1;
    renderPalettes();
  });
  if(n.swapBtn) n.swapBtn.addEventListener('click',function(){
    var t=state.mainColor; state.mainColor=state.secondary1; state.secondary1=t;
    n.mainPicker.value=state.mainColor; n.mainInput.value=state.mainColor;
    n.sec1Picker.value=state.secondary1; n.sec1Input.value=state.secondary1;
    renderPalettes();
  });

  /* radio paleta activa */
  Array.from(n.radios||[]).forEach(function(r){
    r.addEventListener('change',function(e){ state.activePaletteKey=e.target.value; renderExamples(); });
  });

  /* tabs */
  n.tabBtns.forEach(function(btn){
    btn.addEventListener('click',function(){ switchTab(btn.dataset.tab); });
  });

  /* tema oscuro */
  if(n.toggleDark) n.toggleDark.addEventListener('change',function(e){
    state.darkMode=e.target.checked;
    applyTheme();
    renderPalettes();
    updateContrast();
  });

  /* accesibilidad */
  function bindAccess(picker, input, key) {
    if(picker) picker.addEventListener('input',function(e){
      state[key]=e.target.value;
      if(input) input.value=state[key];
      updateContrast();
    });
    if(input) input.addEventListener('change',function(e){
      var v=e.target.value.trim();
      if(/^#[0-9a-f]{6}$/i.test(v)){
        state[key]=v;
        if(picker) picker.value=v;
        updateContrast();
      }
    });
  }
  bindAccess(n.textColorPicker, n.textColorInput, 'textColor');
  bindAccess(n.bgColorPicker,   n.bgColorInput,   'bgColor');

  if(n.swapAccess) n.swapAccess.addEventListener('click',function(){
    var t=state.textColor; state.textColor=state.bgColor; state.bgColor=t;
    n.textColorPicker.value=state.textColor; n.textColorInput.value=state.textColor;
    n.bgColorPicker.value=state.bgColor;     n.bgColorInput.value=state.bgColor;
    updateContrast();
  });
  if(n.show45) n.show45.addEventListener('change',function(e){ state.showRatio45=e.target.checked; updateContrast(); });
  if(n.show7)  n.show7.addEventListener('change',function(e){ state.showRatio7=e.target.checked;   updateContrast(); });

  /* exportar */
  if(n.btnExport) n.btnExport.addEventListener('click',function(){
    renderExportOutput(); showPanel(n.exportModal);
  });
  function closeExport(){ hidePanel(n.exportModal); }
  if(n.closeExportModal)  n.closeExportModal.addEventListener('click',  closeExport);
  if(n.closeExportModal2) n.closeExportModal2.addEventListener('click', closeExport);
  if(n.exportModal) n.exportModal.addEventListener('click',function(e){
    if(e.target===n.exportModal) closeExport();
  });
  n.exportTabs.forEach(function(tab){
    tab.addEventListener('click',function(){
      state.exportFmt=tab.dataset.fmt;
      n.exportTabs.forEach(function(t){ t.classList.toggle('active', t===tab); });
      renderExportOutput();
    });
  });
  if(n.copyExport) n.copyExport.addEventListener('click',function(){
    if(navigator.clipboard){
      navigator.clipboard.writeText(n.exportOutput.value).then(function(){ showToast('¡Copiado al portapapeles!'); });
    } else {
      n.exportOutput.select();
      document.execCommand('copy');
      showToast('¡Copiado!');
    }
  });

  /* Escape */
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') hidePanel(n.exportModal);
  });
}

/* ─── Boot ───────────────────────────────────── */
function boot() {
  grabNodes();
  initValues();
  wireEvents();
  renderPalettes();
  updateContrast();
  switchTab('paletas');
}

document.addEventListener('DOMContentLoaded', boot);
