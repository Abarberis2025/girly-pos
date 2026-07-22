(()=>{
  const canManageNegativeStock=()=>['admin','gerente'].includes(currentUser()?.role);

  const clarifyPoint=()=>{
    const cardInput=document.querySelector('#cardMpFeePct');
    const cardHeading=cardInput?.closest('.form')?.previousElementSibling;
    if(cardHeading) cardHeading.textContent='Tarjeta de crédito por Point Mercado Pago';

    const mpLabel=cardInput?.closest('div')?.querySelector('label');
    if(mpLabel) mpLabel.textContent='Comisión del Point Mercado Pago (%)';

    const installment=document.querySelector('#cardInstallmentPct')?.closest('div')?.querySelector('label');
    if(installment) installment.textContent='Costo por cuotas del Point (%)';

    const intro=document.querySelector('#qrFeePct')?.closest('.card')?.querySelector('.sub');
    if(intro) intro.textContent='QR y tarjetas cobradas por Point se acreditan en Mercado Pago. Cada venta conserva una copia de la configuración aplicada.';
  };

  const negativeSelect=(value,kind,key)=>`
    <select ${canManageNegativeStock()?'':'disabled'} onchange="window.setNegativeStockRule('${kind}',decodeURIComponent('${encodeURIComponent(key)}'),this.value)">
      <option value="yes" ${value!==false?'selected':''}>Sí, permitir negativo</option>
      <option value="no" ${value===false?'selected':''}>No, bloquear venta</option>
    </select>`;

  const renderNegativeStockSettings=()=>{
    const settingsView=document.querySelector('#view-settings');
    if(!settingsView)return;

    let card=document.querySelector('#negativeStockSettings');
    if(!card){
      card=document.createElement('div');
      card.id='negativeStockSettings';
      card.className='card';
      card.style.marginTop='14px';
      settingsView.appendChild(card);
    }

    const labels=(s.colors||[]).map(c=>`
      <div class="cart-item">
        <div style="display:flex;align-items:center;gap:9px">
          <span class="swatch" style="background:${c.hex}"></span>
          <div><b>Etiqueta ${c.name}</b><div class="sub">La regla se aplica a todas las ventas de esta etiqueta.</div></div>
        </div>
        <div style="min-width:210px">${negativeSelect(c.allowNegative,'label',c.name)}</div>
      </div>`).join('');

    const specific=(s.products||[]).filter(p=>p.type==='codigo').map(p=>`
      <div class="cart-item">
        <div><b>${p.name}</b><div class="sub">${p.code||'Sin código'} · ${p.category||'Sin rubro'} · Stock ${Number(p.stock||0)}</div></div>
        <div style="min-width:210px">${negativeSelect(p.allowNegative,'product',p.id)}</div>
      </div>`).join('');

    card.innerHTML=`
      <div class="section-title"><h2>Reglas de stock negativo</h2><span class="pill ${canManageNegativeStock()?'ok':'low'}">${canManageNegativeStock()?'Editable':'Solo lectura'}</span></div>
      <p class="sub">Ariel y Laura pueden decidir si una etiqueta o un producto específico se puede vender cuando su stock llega a cero. Al bloquearlo, el POS impedirá la venta.</p>
      <h3 style="margin:18px 0 8px">Productos por etiqueta</h3>
      ${labels||'<div class="sub">No hay etiquetas configuradas.</div>'}
      <h3 style="margin:22px 0 8px">Productos con código propio</h3>
      ${specific||'<div class="sub">Todavía no hay productos específicos cargados.</div>'}`;
  };

  window.setNegativeStockRule=(kind,key,value)=>{
    if(!canManageNegativeStock()){
      alert('Solo administrador o gerente pueden modificar esta configuración.');
      renderNegativeStockSettings();
      return;
    }
    const allow=value==='yes';
    if(kind==='label'){
      const label=(s.colors||[]).find(c=>c.name===key);
      if(!label)return;
      label.allowNegative=allow;
      (s.products||[]).filter(p=>p.type==='color'&&p.color===key&&p.allowNegative==null).forEach(p=>p.allowNegative=null);
    }else{
      const product=(s.products||[]).find(p=>p.id===key);
      if(!product)return;
      product.allowNegative=allow;
    }
    save();
  };

  const previousRenderSettings=renderSettings;
  renderSettings=function(){
    previousRenderSettings();
    clarifyPoint();
    renderNegativeStockSettings();
  };

  clarifyPoint();
  renderNegativeStockSettings();
  document.documentElement.dataset.girlyVersion='8-beta-1-negative-stock-settings';
})();