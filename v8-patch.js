(()=>{
const defaultsV8={
 qrFeePct:0.968,qrFixedFee:0,qrTaxPct:0,qrDelayDays:0,
 cardMpFeePct:7.442,cardInstallmentPct:14.749,cardFixedFee:0,cardTaxPct:0,cardDelayDays:0
};
s.settings={...defaultsV8,...(s.settings||{})};
s.colors=s.colors.map(c=>({...c,allowNegative:c.allowNegative!==false}));

const paymentBox=document.querySelector('#confirmSale')?.previousElementSibling;
if(paymentBox?.classList.contains('choices')) paymentBox.innerHTML=`
<button class="choice payment" data-pay="Efectivo">💵 Efectivo<br><small>${s.settings.cashDiscount}% OFF</small></button>
<button class="choice payment" data-pay="Transferencia">🏦 Transferencia<br><small>Sin comisión</small></button>
<button class="choice payment" data-pay="QR">📱 QR<br><small>Comisión configurable</small></button>
<button class="choice payment" data-pay="Tarjeta de crédito">💳 Tarjeta de crédito<br><small>Cargos configurables</small></button>`;

const mpCard=document.querySelector('#mpFeePct')?.closest('.card');
if(mpCard) mpCard.innerHTML=`
<h2>Medios de cobro electrónicos</h2>
<p class="sub">Cada venta guarda la regla aplicada. Los cambios futuros no modifican operaciones anteriores.</p>
<h3 style="margin:14px 0 8px">QR</h3>
<div class="form">
 <div><label>Comisión QR (%)</label><input type="number" step="0.001" min="0" id="qrFeePct"></div>
 <div><label>Cargo fijo</label><input type="number" step="0.01" min="0" id="qrFixedFee"></div>
 <div><label>Impuesto sobre cargos (%)</label><input type="number" step="0.01" min="0" id="qrTaxPct"></div>
 <div><label>Días de acreditación</label><input type="number" min="0" id="qrDelayDays"></div>
</div>
<div class="notice" id="qrExample" style="margin-top:10px"></div>
<h3 style="margin:18px 0 8px">Tarjeta de crédito</h3>
<div class="form">
 <div><label>Costo Mercado Pago (%)</label><input type="number" step="0.001" min="0" id="cardMpFeePct"></div>
 <div><label>Interés por cuotas (%)</label><input type="number" step="0.001" min="0" id="cardInstallmentPct"></div>
 <div><label>Cargo fijo</label><input type="number" step="0.01" min="0" id="cardFixedFee"></div>
 <div><label>Impuesto sobre cargos (%)</label><input type="number" step="0.01" min="0" id="cardTaxPct"></div>
 <div><label>Días de acreditación</label><input type="number" min="0" id="cardDelayDays"></div>
</div>
<div class="notice" id="cardExample" style="margin-top:10px"></div>
<button id="savePaymentSettingsV8" class="btn primary" style="margin-top:10px">Guardar medios de cobro</button>`;

function ruleFor(payment){
 if(payment==='QR'||payment==='Transferencia / QR') return {mpPct:Number(s.settings.qrFeePct||0),installmentPct:0,fixed:Number(s.settings.qrFixedFee||0),taxPct:Number(s.settings.qrTaxPct||0),delayDays:Number(s.settings.qrDelayDays||0)};
 if(payment==='Tarjeta de crédito') return {mpPct:Number(s.settings.cardMpFeePct||0),installmentPct:Number(s.settings.cardInstallmentPct||0),fixed:Number(s.settings.cardFixedFee||0),taxPct:Number(s.settings.cardTaxPct||0),delayDays:Number(s.settings.cardDelayDays||0)};
 return {mpPct:0,installmentPct:0,fixed:0,taxPct:0,delayDays:0};
}
function paymentCosts(total,payment,rule=ruleFor(payment)){
 const gross=Number(total||0);
 const mpAmount=gross*Number(rule.mpPct||0)/100;
 const installmentAmount=gross*Number(rule.installmentPct||0)/100;
 const base=mpAmount+installmentAmount+Number(rule.fixed||0);
 const taxAmount=base*Number(rule.taxPct||0)/100;
 const fee=Math.min(gross,base+taxAmount);
 return {gross,mpAmount,installmentAmount,fixed:Number(rule.fixed||0),taxAmount,fee,net:gross-fee,rule};
}
paymentFeeFor=(total,payment='QR')=>paymentCosts(total,payment);
saleNetMp=v=>['QR','Tarjeta de crédito','Transferencia / QR'].includes(v.payment)?Number(v.paymentNet??paymentCosts(v.total,v.payment,v.paymentFeeRule).net):0;

function bindPayments(){
 document.querySelectorAll('.payment').forEach(b=>{
  b.classList.toggle('selected',selectedPay===b.dataset.pay);
  b.onclick=()=>{selectedPay=b.dataset.pay;renderPOS()};
 });
}
const baseRenderPOS=renderPOS;
renderPOS=function(){
 baseRenderPOS();
 bindPayments();
 const sub=sum(cart,x=>x.price),disc=selectedPay==='Efectivo'?sub*s.settings.cashDiscount/100:0;
 const costs=paymentCosts(sub-disc,selectedPay||'Transferencia');
 const totalLabel=document.querySelector('#total')?.closest('.grand');
 document.querySelector('#paymentCostPreview')?.remove();
 if(totalLabel&&['QR','Tarjeta de crédito'].includes(selectedPay)){
  totalLabel.insertAdjacentHTML('afterend',`<div id="paymentCostPreview" class="notice" style="margin-top:8px">Costo estimado: <b>${money(costs.fee)}</b> · Neto a acreditar: <b>${money(costs.net)}</b></div>`);
 }
};

const confirm=document.querySelector('#confirmSale');
confirm.onclick=()=>{
 const shift=openShift();
 if(!shift){notice(document.querySelector('#posMsg'),'Primero abrí una caja');return}
 if(!cart.length){notice(document.querySelector('#posMsg'),'Agregá artículos');return}
 if(!selectedPay){notice(document.querySelector('#posMsg'),'Elegí el medio de pago');return}
 for(const item of cart){
  if(!item.productId)continue;
  const p=s.products.find(x=>x.id===item.productId);
  if(!p)return;
  if(p.stock<=0&&!productAllowsNegative(p)){notice(document.querySelector('#posMsg'),'No hay stock suficiente de '+item.name);return}
  p.stock--;addStockMovement(p,-1,'Venta','POS');
 }
 const subtotal=sum(cart,x=>x.price),discount=selectedPay==='Efectivo'?subtotal*s.settings.cashDiscount/100:0,total=subtotal-discount;
 const costs=paymentCosts(total,selectedPay);
 s.sales.unshift({id:id(),date:new Date().toISOString(),userId:currentUser().id,shiftId:shift.id,items:[...cart],payment:selectedPay,subtotal,discount,total,cost:sum(cart,x=>x.cost),paymentFee:costs.fee,paymentNet:costs.net,paymentFeeBreakdown:{mpAmount:costs.mpAmount,installmentAmount:costs.installmentAmount,fixed:costs.fixed,taxAmount:costs.taxAmount},paymentFeeRule:costs.rule});
 cart=[];selectedPay=null;save();notice(document.querySelector('#posMsg'),'Venta registrada',true);
};

renderCash=function(){
 const sh=openShift(),sales=sh?s.sales.filter(x=>x.shiftId===sh.id):[];
 const by=p=>sales.filter(x=>x.payment===p);
 const cash=sum(by('Efectivo'),x=>x.total),transfer=sum(by('Transferencia'),x=>x.total);
 const qrSales=[...by('QR'),...by('Transferencia / QR')],cardSales=by('Tarjeta de crédito');
 const qrGross=sum(qrSales,x=>x.total),cardGross=sum(cardSales,x=>x.total);
 const qrFees=sum(qrSales,x=>Number(x.paymentFee??paymentCosts(x.total,x.payment,x.paymentFeeRule).fee));
 const cardFees=sum(cardSales,x=>Number(x.paymentFee??paymentCosts(x.total,x.payment,x.paymentFeeRule).fee));
 const qrNet=sum(qrSales,x=>Number(x.paymentNet??paymentCosts(x.total,x.payment,x.paymentFeeRule).net));
 const cardNet=sum(cardSales,x=>Number(x.paymentNet??paymentCosts(x.total,x.payment,x.paymentFeeRule).net));
 document.querySelector('#cashKpis').innerHTML=[['Turno',sh?'Abierto':'Cerrado'],['Efectivo',money(cash)],['Transferencias',money(transfer)],['MP neto',money(qrNet+cardNet)]].map(([l,v])=>`<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');
 if(!sh){
  const last=s.shifts.filter(x=>x.closedAt).sort((a,b)=>new Date(b.closedAt)-new Date(a.closedAt))[0];
  document.querySelector('#shiftPanel').innerHTML=`<p class="sub">El fondo sugerido es el efectivo contado en el cierre anterior.</p><label>Efectivo inicial</label><input type="number" id="openingInput" value="${last?.countedCash||0}"><button class="btn primary" id="openShiftBtn" style="margin-top:9px">Abrir turno</button>`;
  document.querySelector('#openShiftBtn').onclick=()=>{s.shifts.unshift({id:id(),userId:currentUser().id,openedAt:new Date().toISOString(),openingCash:Number(document.querySelector('#openingInput').value||0),closedAt:null});save()};
 }else{
  const cashExpenses=sum(s.expenses.filter(x=>x.shiftId===sh.id&&x.payment==='Efectivo'),x=>x.amount);
  const cashPurch=sum(s.purchases.filter(x=>x.shiftId===sh.id&&x.payment==='Efectivo'),x=>x.total);
  const expectedCash=sh.openingCash+cash-cashExpenses-cashPurch;
  document.querySelector('#shiftPanel').innerHTML=`
  <div class="total-row"><span>Fondo inicial</span><b>${money(sh.openingCash)}</b></div>
  <div class="total-row"><span>Ventas efectivo</span><b>${money(cash)}</b></div>
  <div class="total-row"><span>Compras/gastos efectivo</span><b>-${money(cashExpenses+cashPurch)}</b></div>
  <div class="total-row grand"><span>Efectivo esperado</span><b>${money(expectedCash)}</b></div>
  <div class="form" style="margin-top:12px"><div><label>Efectivo contado</label><input id="countedCash" type="number"></div><div><label>Transferencias verificadas</label><input id="countedTransfer" type="number" value="${transfer}"></div><div><label>Saldo QR acreditado</label><input id="countedQr" type="number"></div><div><label>Saldo tarjeta acreditado</label><input id="countedCard" type="number"></div><div><label>Observaciones</label><input id="closeNotes"></div></div>
  <h3>Transferencias</h3><div class="total-row grand"><span>Esperado</span><b>${money(transfer)}</b></div>
  <h3>QR</h3><div class="total-row"><span>Bruto</span><b>${money(qrGross)}</b></div><div class="total-row"><span>Comisiones y cargos</span><b>-${money(qrFees)}</b></div><div class="total-row grand"><span>Neto esperado</span><b>${money(qrNet)}</b></div>
  <h3>Tarjeta de crédito</h3><div class="total-row"><span>Bruto</span><b>${money(cardGross)}</b></div><div class="total-row"><span>Comisiones, cuotas e impuestos</span><b>-${money(cardFees)}</b></div><div class="total-row grand"><span>Neto esperado</span><b>${money(cardNet)}</b></div>
  <button id="closeShiftBtn" class="btn primary">Cerrar turno</button>`;
  document.querySelector('#closeShiftBtn').onclick=()=>{
   const countedCash=Number(document.querySelector('#countedCash').value||0),countedTransfer=Number(document.querySelector('#countedTransfer').value||0),countedQr=Number(document.querySelector('#countedQr').value||0),countedCard=Number(document.querySelector('#countedCard').value||0);
   Object.assign(sh,{closedAt:new Date().toISOString(),countedCash,countedTransfer,countedQr,countedCard,expectedCash,expectedTransfer:transfer,expectedQr:qrNet,expectedCard:cardNet,cashDifference:countedCash-expectedCash,transferDifference:countedTransfer-transfer,qrDifference:countedQr-qrNet,cardDifference:countedCard-cardNet,notes:document.querySelector('#closeNotes').value});save();
  };
 }
 document.querySelector('#shiftHistory').innerHTML=s.shifts.filter(x=>x.closedAt).slice(0,12).map(x=>`<tr><td>${new Date(x.openedAt).toLocaleString('es-AR')}</td><td>${s.users.find(u=>u.id===x.userId)?.name||''}</td><td>${money(x.countedCash)}</td><td>${money((x.countedQr||0)+(x.countedCard||x.countedMp||0))}</td><td>${money((x.cashDifference||0)+(x.qrDifference||0)+(x.cardDifference||x.mpDifference||0))}</td></tr>`).join('');
};

const baseRenderSettings=renderSettings;
renderSettings=function(){
 baseRenderSettings();
 const set=(id,v)=>{const e=document.querySelector('#'+id);if(e)e.value=v};
 set('qrFeePct',s.settings.qrFeePct);set('qrFixedFee',s.settings.qrFixedFee);set('qrTaxPct',s.settings.qrTaxPct);set('qrDelayDays',s.settings.qrDelayDays);
 set('cardMpFeePct',s.settings.cardMpFeePct);set('cardInstallmentPct',s.settings.cardInstallmentPct);set('cardFixedFee',s.settings.cardFixedFee);set('cardTaxPct',s.settings.cardTaxPct);set('cardDelayDays',s.settings.cardDelayDays);
 const qr=paymentCosts(10000,'QR'),card=paymentCosts(10000,'Tarjeta de crédito');
 if(document.querySelector('#qrExample'))document.querySelector('#qrExample').innerHTML=`Sobre ${money(10000)}: cargos ${money(qr.fee)} · neto <b>${money(qr.net)}</b>`;
 if(document.querySelector('#cardExample'))document.querySelector('#cardExample').innerHTML=`Sobre ${money(10000)}: MP ${money(card.mpAmount)} · cuotas ${money(card.installmentAmount)} · otros/impuestos ${money(card.fixed+card.taxAmount)} · neto <b>${money(card.net)}</b>`;
 document.querySelector('#colorSettings').innerHTML=s.colors.map((c,i)=>`<div class="cart-item"><div style="display:flex;align-items:center;gap:8px"><span class="swatch" style="background:${c.hex}"></span><div><b>${c.name}</b><div class="sub">Stock negativo: ${c.allowNegative!==false?'permitido':'bloqueado'}</div></div></div><div style="display:flex;gap:6px;align-items:center"><input aria-label="precio" type="number" value="${c.price}" style="width:110px" onchange="setColor(${i},'price',this.value)"><input aria-label="costo %" type="number" value="${c.costPct}" style="width:82px" onchange="setColor(${i},'costPct',this.value)"><select style="width:145px" onchange="setColorNegative(${i},this.value)"><option value="yes" ${c.allowNegative!==false?'selected':''}>Permitir negativo</option><option value="no" ${c.allowNegative===false?'selected':''}>Bloquear negativo</option></select></div></div>`).join('');
 document.querySelector('#savePaymentSettingsV8').onclick=()=>{
  const n=id=>Number(document.querySelector('#'+id).value||0);
  Object.assign(s.settings,{qrFeePct:n('qrFeePct'),qrFixedFee:n('qrFixedFee'),qrTaxPct:n('qrTaxPct'),qrDelayDays:n('qrDelayDays'),cardMpFeePct:n('cardMpFeePct'),cardInstallmentPct:n('cardInstallmentPct'),cardFixedFee:n('cardFixedFee'),cardTaxPct:n('cardTaxPct'),cardDelayDays:n('cardDelayDays')});save();alert('Medios de cobro actualizados');
 };
};
window.setColorNegative=(i,v)=>{
 if(!['admin','gerente'].includes(currentUser()?.role)){alert('Solo administrador o gerente pueden cambiar esta regla');return}
 s.colors[i].allowNegative=v==='yes';save();
};

const baseOpenProduct=openProduct;
openProduct=function(p){baseOpenProduct(p);const sel=document.querySelector('#pAllowNegative');if(sel)sel.disabled=!['admin','gerente'].includes(currentUser()?.role)};

const originalPnl=pnl;
pnl=function(m){
 const base=originalPnl(m),fees=sum(salesForMonth(m),x=>Number(x.paymentFee||0));
 return {...base,paymentFees:fees,expenses:base.expenses+fees,result:base.result-fees};
};

document.title='Girly POS v8 · Beta 1';
save();
})();