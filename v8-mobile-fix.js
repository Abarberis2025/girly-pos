(()=>{
  const canManage=()=>['admin','gerente'].includes(currentUser()?.role);

  function clarifyPoint(){
    const cardInput=document.querySelector('#cardMpFeePct');
    const cardHeading=cardInput?.closest('.form')?.previousElementSibling;
    if(cardHeading)cardHeading.textContent='Tarjeta de crédito por Point Mercado Pago';
    const mpLabel=cardInput?.closest('div')?.querySelector('label');
    if(mpLabel)mpLabel.textContent='Comisión del Point Mercado Pago (%)';
    const installment=document.querySelector('#cardInstallmentPct')?.closest('div')?.querySelector('label');
    if(installment)installment.textContent='Costo por cuotas del Point (%)';
  }

  function ruleSelect(value,kind,key){
    const encoded=encodeURIComponent(String(key));
    return `<select data-negative-kind="${kind}" data-negative-key="${encoded}" ${canManage()?'':'disabled'}>
      <option value="yes" ${value!==false?'selected':''}>Sí, permitir negativo</option>
      <option value="no" ${value===false?'selected':''}>No, bloquear venta</option>
    </select>`;
  }

  function renderNegativeStockSettings(){
    const settingsView=document.querySelector('#view-settings');
    if(!settingsView||typeof s==='undefined')return false;

    let card=document.querySelector('#negativeStockSettings');
    if(!card){
      card=document.createElement('div');
      card.id='negativeStockSettings';
      card.className='card';
      card.style.marginTop='14px';
      settingsView.appendChild(card);
    }

    const labels=(s.colors||[]).map(c=>`<div class="cart-item">
      <div style="display:flex;align-items:center;gap:9px"><span class="swatch" style="background:${c.hex}"></span><div><b>Etiqueta ${c.name}</b><div class="sub">Regla para todas las ventas de esta etiqueta.</div></div></div>
      <div style="min-width:210px">${ruleSelect(c.allowNegative,'label',c.name)}</div>
    </div>`).join('');

    const specific=(s.products||[]).filter(p=>p.type==='codigo').map(p=>`<div class="cart-item">
      <div><b>${p.name}</b><div class="sub">${p.code||'Sin código'} · Stock ${Number(p.stock||0)}</div></div>
      <div style="min-width:210px">${ruleSelect(p.allowNegative,'product',p.id)}</div>
    </div>`).join('');

    card.innerHTML=`<div class="section-title"><h2>Reglas de stock negativo</h2><span class="pill ${canManage()?'ok':'low'}">${canManage()?'Editable':'Solo lectura'}</span></div>
      <p class="sub">Ariel y Laura pueden decidir qué etiquetas y productos específicos se venden al llegar a cero.</p>
      <h3 style="margin:18px 0 8px">Productos por etiqueta</h3>${labels||'<div class="sub">No hay etiquetas configuradas.</div>'}
      <h3 style="margin:22px 0 8px">Productos con código propio</h3>${specific||'<div class="sub">Todavía no hay productos específicos cargados.</div>'}`;

    card.querySelectorAll('select[data-negative-kind]').forEach(select=>{
      select.onchange=()=>setNegativeStockRule(select.dataset.negativeKind,decodeURIComponent(select.dataset.negativeKey),select.value);
    });
    document.documentElement.dataset.girlyNegativeStock='ready';
    return true;
  }

  window.setNegativeStockRule=(kind,key,value)=>{
    if(!canManage()){alert('Solo administrador o gerente pueden modificar esta configuración.');renderNegativeStockSettings();return;}
    const allow=value==='yes';
    if(kind==='label'){
      const label=(s.colors||[]).find(c=>c.name===key);
      if(!label)return;
      label.allowNegative=allow;
    }else{
      const product=(s.products||[]).find(p=>String(p.id)===String(key));
      if(!product)return;
      product.allowNegative=allow;
    }
    save();
    renderNegativeStockSettings();
  };

  function install(){
    if(typeof renderSettings!=='function'||typeof s==='undefined')return false;
    if(!window.__girlyNegativeStockWrapped){
      const baseRenderSettings=renderSettings;
      renderSettings=function(){baseRenderSettings();clarifyPoint();renderNegativeStockSettings();};
      window.__girlyNegativeStockWrapped=true;
    }
    clarifyPoint();
    renderNegativeStockSettings();
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(install()||attempts>=40)clearInterval(timer);
  },100);
  window.addEventListener('load',install);
})();