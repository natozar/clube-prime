/**
 * Teste de push notification — roda localmente
 * Uso: ONESIGNAL_REST_KEY=xxx node seo/scripts/test-push.js
 */

const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

if (!ONESIGNAL_REST_KEY) {
  console.error('Defina ONESIGNAL_REST_KEY como variável de ambiente');
  console.error('Uso: ONESIGNAL_REST_KEY=xxx node seo/scripts/test-push.js');
  process.exit(1);
}

async function testPush() {
  // 1. Verificar app info e subscribers
  console.log('1/3 Consultando app info...');
  const appRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, {
    headers: { 'Authorization': `Key ${ONESIGNAL_REST_KEY}` }
  });
  if (appRes.ok) {
    const app = await appRes.json();
    console.log(`  App: ${app.name}`);
    console.log(`  Players (subscribers): ${app.players || 'N/A'}`);
    console.log(`  Messageable players: ${app.messageable_players || 'N/A'}`);
    if ((app.messageable_players || 0) === 0) {
      console.error('\n✗ ZERO subscribers! A push não será recebida por ninguém.');
      console.error('  Possíveis causas:');
      console.error('  - Ninguém aceitou as notificações no site');
      console.error('  - O Service Worker não está registrado corretamente');
      console.error('  - O domínio configurado no OneSignal não bate com carnesrodrigues.com.br');
      console.error('  Verifique: https://dashboard.onesignal.com → Audience → All Users');
    }
  } else {
    console.error(`  Erro ao consultar app: ${appRes.status} ${await appRes.text()}`);
  }

  // 2. Listar segmentos disponíveis
  console.log('\n2/3 Listando segmentos...');
  const segRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/segments`, {
    headers: { 'Authorization': `Key ${ONESIGNAL_REST_KEY}` }
  });
  if (segRes.ok) {
    const segs = await segRes.json();
    console.log(`  Segmentos: ${(segs.segments || []).map(s => s.name).join(', ') || 'nenhum'}`);
  } else {
    console.warn(`  Erro ao listar segmentos: ${segRes.status}`);
  }

  // 3. Enviar push de teste
  console.log('\n3/3 Enviando push de teste...');
  const pushRes = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      target_channel: 'push',
      included_segments: ['Total Subscriptions'],
      headings: { pt: 'Teste Clube Prime', en: 'Test' },
      contents: { pt: 'Se voce esta lendo isso, push funciona!', en: 'Push test successful!' },
      url: 'https://carnesrodrigues.com.br/',
      web_url: 'https://carnesrodrigues.com.br/',
      chrome_web_icon: 'https://carnesrodrigues.com.br/icon-192.png',
    })
  });

  const pushBody = await pushRes.text();
  console.log(`  Status: ${pushRes.status}`);
  console.log(`  Resposta: ${pushBody}`);

  if (pushRes.ok) {
    try {
      const result = JSON.parse(pushBody);
      if ((result.recipients || 0) > 0) {
        console.log(`\n✓ PUSH ENVIADA PARA ${result.recipients} RECIPIENT(S)!`);
      } else {
        console.warn('\n⚠ Push aceita pela API mas 0 recipients — verifique subscribers no dashboard');
      }
    } catch(e) {
      console.log('\n✓ Push enviada (resposta não-JSON)');
    }
  } else {
    // Retry com "All" se "Total Subscriptions" falhou
    console.log('  Tentando com segmento "All"...');
    const retryRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        included_segments: ['All'],
        headings: { pt: 'Teste Clube Prime', en: 'Test' },
        contents: { pt: 'Se voce esta lendo isso, push funciona!', en: 'Push test successful!' },
        url: 'https://carnesrodrigues.com.br/',
        chrome_web_icon: 'https://carnesrodrigues.com.br/icon-192.png',
      })
    });
    console.log(`  Retry status: ${retryRes.status}`);
    console.log(`  Retry resposta: ${await retryRes.text()}`);
  }
}

testPush().catch(e => { console.error('Erro fatal:', e); process.exit(1); });
