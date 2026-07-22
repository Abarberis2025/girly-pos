(()=>{
 function canManage(){return ['admin','gerente'].includes(currentUser()?.role)}
 function ensureLabelProduct(color){
  let p=s.products.find(x=>x.type==='color'&&x.color===color.name);
  if(!p){
   p={id:id(),name:`Etiqueta ${color.name}`,category:'Stock por etiqueta',code:'',type:'color',color:color.name,price:Number(color.price||0),cost:Number(color.price||0)*Number(color.costPct||0)/100,stock:0,minStock:0,allowNegative:null};
   s.products.push(p);save();
  }
  return p;
 }
 function bindLabelSale(){
  const add=document.querySelector('#addItem');
  if(!add)return;
  add.onclick=()=>{
   if(!selectedCat||!selectedColor){notice(document.querySelector('#posMsg'),'Elegí rubro y etiqueta');return}
   const color=s.colors.find(c=>c.name===selectedColor);
   if(!color){notice(document.querySelector('#posMsg'),'No se encontró la etiqueta seleccionada');return}
   const p=ensureLabelProduct(color);
   const allowNegative=color.allowNegative!==false;
   if(Number(p.stock||0)<=0&&!allowNegative){notice(document.querySelector('#posMsg'),'Sin stock. Esta etiqueta no permite saldo negativo');return}
   cart.push({name:selectedCat,category:selectedCat,detail:'Etiqueta '+selectedColor,price:Number(color.price||0),cost:Number(p.cost||0)||Number(color.price||0)*Number(color.costPct||0)/100,productId:p.id,labelColor:selectedColor});
   selectedCat=null;selectedColor=null;renderPOS();
  };
 }
 function ensurePaymentSettings(){
  if(!canManage())return;
  let card=document.querySelector('#pointPaymentSettingsV8');
  if(!card){
   card=document.createElement('section');card.id='pointPaymentSettingsV8';card.className='card';
   card.innerHTML=`<h2>Mercado Pago Point</h2><p class="sub">Configuración de cobros procesados por Mercado Pago. QR y tarjeta guardan una copia de estas reglas en cada venta.</p><h3 style="margin:14px 0 8px">QR</h3><div class="form"><div><label>Comisión QR (%)</label><input type="number" step="0.001" min="0" id="qrFeePctHot"></div><div><label>Cargo fijo</label><input type="number" step="0.01" min="0" id="qrFixedFeeHot"></div><div><label>Impuestos sobre cargos (%)</label><input type="number" step="0.01" min="0" id="qrTaxPctHot"></div><div><label>Días de acreditación</label><input type="number" min="0" id="qrDelayDaysHot"></div></div><h3 style="margin:18px 0 8px">Tarjeta de crédito por Point</h3><div class="form"><div><label>Comisión Mercado Pago / Point (%)</label><input type="number" step="0.001" min="0" id="cardMpFeePctHot"></div><div><label>Costo por cuotas (%)</label><input type="number" step="0.001" min="0" id="cardInstallmentPctHot"></div><div><label>Cargo fijo</label><input type="number" step="0.01" min="0" id="cardFixedFeeHot"></div><div><label>Impuestos sobre cargos (%)</label><input type="number" step="0.01" min="0" id="cardTaxPctHot"></div><div><label>Días de acreditación</label><input type="number" min="0" id="cardDelayDaysHot"></div></div><button id="savePointSettingsHot" class="btn primary" style="margin-top:12px">Guardar configuración de Point</button>`;
   const anchor=document.querySelector('#colorSettings')?.closest('.card');
   if(anchor)anchor.parentNode.insertBefore(card,anchor);else document.querySelector('main')?.appendChild(card);
  }
  const set=(id,v)=>{const e=document.querySelector('#'+id);if(e)e.value=Number(v||0)};
  set('qrFeePctHot',s.settings.qrFeePct);set('qrFixedFeeHot',s.settings.qrFixedFee);set('qrTaxPctHot',s.settings.qrTaxPct);set('qrDelayDaysHot',s.settings.qrDelayDays);
  set('cardMpFeePctHot',s.settings.cardMpFeePct);set('cardInstallmentPctHot',s.settings.cardInstallmentPct);set('cardFixedFeeHot',s.settings.cardFixedFee);set('cardTaxPctHot',s.settings.cardTaxPct);set('cardDelayDaysHot',s.settings.cardDelayDays);
  document.querySelector('#savePointSettingsHot').onclick=()=>{
   const n=id=>Number(document.querySelector('#'+id)?.value||0);
   Object.assign(s.settings,{qrFeePct:n('qrFeePctHot'),qrFixedFee:n('qrFixedFeeHot'),qrTaxPct:n('qrTaxPctHot'),qrDelayDays:n('qrDelayDaysHot'),cardMpFeePct:n('cardMpFeePctHot'),cardInstallmentPct:n('cardInstallmentPctHot'),cardFixedFee:n('cardFixedFeeHot'),cardTaxPct:n('cardTaxPctHot'),cardDelayDays:n('cardDelayDaysHot')});save();alert('Configuración de Mercado Pago Point actualizada');
  };
 }
 const previousRenderPOS=renderPOS;
 renderPOS=function(){previousRenderPOS();bindLabelSale()};
 const previousRenderSettings=renderSettings;
 renderSettings=function(){previousRenderSettings();ensurePaymentSettings()};
 s.colors=s.colors.map(c=>({...c,allowNegative:c.allowNegative!==false}));
 save();bindLabelSale();
})();