/**
 * CLUBE PRIME SEO — Analytics Beacon (LGPD Compliant)
 * Sem cookies, sem fingerprinting. Apenas sendBeacon para Supabase.
 *
 * Este arquivo gera o snippet JS que vai inline em cada página SEO.
 */

export function getAnalyticsSnippet(supabaseUrl, supabaseAnonKey) {
  return `
<script>
(function(){
  var S='${supabaseUrl}/rest/v1/seo_analytics';
  var K='${supabaseAnonKey}';
  var P=location.pathname;
  var R=document.referrer;
  var D=/Mobile|Android|iPhone/i.test(navigator.userAgent)?'mobile':'desktop';
  var ref=new URLSearchParams(location.search).get('ref')||'';
  var startTime=Date.now();
  var maxScroll=0;

  function send(evt,extra){
    var body=Object.assign({evento:evt,path:P,referrer:R,device:D,affiliate_id:ref||null,user_agent:navigator.userAgent.substring(0,200)},extra||{});
    navigator.sendBeacon(S,new Blob([JSON.stringify(body)],{type:'application/json'}));
  }

  // Override sendBeacon com headers do Supabase
  var originalSend=navigator.sendBeacon.bind(navigator);
  function beacon(data){
    var xhr=new XMLHttpRequest();
    xhr.open('POST',S,true);
    xhr.setRequestHeader('apikey',K);
    xhr.setRequestHeader('Authorization','Bearer '+K);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.setRequestHeader('Prefer','return=minimal');
    xhr.send(data);
  }

  // Page view
  beacon(JSON.stringify({evento:'page_view',path:P,referrer:R,device:D,affiliate_id:ref||null,user_agent:navigator.userAgent.substring(0,200)}));

  // Scroll depth
  window.addEventListener('scroll',function(){
    var h=document.documentElement;
    var pct=Math.round(((window.scrollY+window.innerHeight)/h.scrollHeight)*100);
    if(pct>maxScroll)maxScroll=pct;
  },{passive:true});

  // Time on page + scroll (on unload)
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden'){
      var elapsed=Math.round((Date.now()-startTime)/1000);
      beacon(JSON.stringify({evento:'page_exit',path:P,scroll_depth:maxScroll,time_on_page:elapsed,device:D,affiliate_id:ref||null}));
    }
  });

  // Track clicks: WhatsApp share, CTA
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-track]');
    if(t){
      beacon(JSON.stringify({evento:t.dataset.track,path:P,device:D,affiliate_id:ref||null}));
    }
  });
})();
</script>`;
}
