(()=>{
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

  const previousRenderSettings=renderSettings;
  renderSettings=function(){
    previousRenderSettings();
    clarifyPoint();
  };

  clarifyPoint();
  document.documentElement.dataset.girlyVersion='8-beta-1-mobile-fix';
})();