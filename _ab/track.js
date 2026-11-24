/* Rastreamento: lê window.EP (config da página) e dispara os eventos do plano.
   Eventos: <p>_view, <p>_pricing_view, <p>_price_click, <p>_lead, <p>_purchase, b2b_demo */
(function(){
  var C=window.EP,P=C.prefix,q=new URLSearchParams(location.search);
  var utm={};["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){if(q.get(k))sessionStorage.setItem(k,q.get(k));utm[k]=sessionStorage.getItem(k)||""});
  /* Meta Pixel */
  if(C.metaPixel){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",C.metaPixel);fbq("track","PageView")}
  /* GA4 */
  if(C.ga4){var g=document.createElement("script");g.async=1;g.src="https://www.googletagmanager.com/gtag/js?id="+C.ga4;document.head.appendChild(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",C.ga4)}
  /* LinkedIn Insight (só B2B) */
  if(C.linkedin){window._linkedin_partner_id=C.linkedin;window._linkedin_data_partner_ids=[C.linkedin];var l=document.createElement("script");l.async=1;l.src="https://snap.licdn.com/li.lazyload/main/insight.min.js";document.head.appendChild(l)}
  /* Clarity */
  if(C.clarity){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",C.clarity)}
  var fired={};
  function ev(name,data,once){if(once&&fired[name])return;fired[name]=1;var full=P+"_"+name;
    if(window.fbq)fbq("trackCustom",full,data||{});
    if(window.gtag)gtag("event",full,data||{});
    if(window.clarity)clarity("event",full);
    if(window.lintrk&&C.linkedinConv&&C.linkedinConv[name])lintrk("track",{conversion_id:C.linkedinConv[name]});
    (window.dataLayer=window.dataLayer||[]).push({event:full,data:data});
    if(C.debug)console.log("[track]",full,data||"")}
  window.EPtrack=ev;
  ev("view",{},true);
  var pr=document.getElementById("planos");
  if(pr&&"IntersectionObserver"in window){new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){ev("pricing_view",{},true);o.disconnect()}})},{threshold:.35}).observe(pr)}
  /* modal */
  var m=document.getElementById("modal"),f=document.getElementById("lead-form"),plan="",src="";
  function open(p,s){plan=p||"";src=s||"";m.classList.add("open");document.body.style.overflow="hidden";var t=document.getElementById("plan-name");if(t)t.textContent=plan?("Plano escolhido: "+plan):"";setTimeout(function(){f.querySelector("input").focus()},50)}
  function close(){m.classList.remove("open");document.body.style.overflow=""}
  document.querySelectorAll("[data-plan]").forEach(function(b){b.addEventListener("click",function(){var p=b.getAttribute("data-plan");ev("price_click",{plan:p});open(p,"preco")})});
  document.querySelectorAll("[data-gancho]").forEach(function(b){b.addEventListener("click",function(){ev("gancho_click",{});open("","gancho")})});
  document.querySelectorAll("[data-demo]").forEach(function(b){b.addEventListener("click",function(){open(b.getAttribute("data-demo")||"","demo")})});
  m.addEventListener("click",function(e){if(e.target===m||e.target.classList.contains("x"))close()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
  function maskPhone(el){el.addEventListener("input",function(){var d=el.value.replace(/\D/g,"").slice(0,11);el.value=d.length>10?d.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3"):d.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3").replace(/-$/,"")})}
  maskPhone(f.querySelector("[name=whatsapp]"));
  function save(extra,cb){var d=Object.fromEntries(new FormData(f).entries());d.plano=plan;d.origem=src;d.variante=P;d.pagina=location.pathname;d.quando=new Date().toISOString();Object.assign(d,utm,extra||{});
    if(C.leadEndpoint){fetch(C.leadEndpoint,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(d),keepalive:true}).catch(function(){})}
    try{var a=JSON.parse(localStorage.getItem("ep_leads")||"[]");a.push(d);localStorage.setItem("ep_leads",JSON.stringify(a))}catch(e){}
    cb&&cb(d)}
  function finish(msg){f.style.display="none";var d=document.getElementById("done");d.style.display="block";d.querySelector("p").textContent=msg}
  f.addEventListener("submit",function(e){e.preventDefault();if(!f.reportValidity())return;
    var pay=e.submitter&&e.submitter.value==="pay";
    save({reserva:pay?"sim":"nao"},function(d){
      ev("lead",{plan:plan,reserva:d.reserva});
      if(src==="demo"&&P==="b2b")ev("demo",{plan:plan});
      if(pay&&C.checkoutUrl){location.href=C.checkoutUrl+(C.checkoutUrl.indexOf("?")>-1?"&":"?")+"plan="+encodeURIComponent(plan)+"&utm_campaign="+encodeURIComponent(utm.utm_campaign)}
      else if(pay){finish("Checkout do Pix ainda não configurado (EP.checkoutUrl). Seu cadastro foi salvo.")}
      else finish("Pronto. Você entrou na lista e a gente chama no WhatsApp em até 24 horas.")})});
  /* reserva paga: o checkout deve voltar para ?paid=1; o evento definitivo deve vir do webhook, este é só reforço */
  if(q.get("paid")==="1")ev("purchase",{value:19,currency:"BRL"},true);
})();
