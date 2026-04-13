/**
 * CLUBE PRIME — Diagnóstico e teste de Push Notification
 *
 * Uso: ONESIGNAL_REST_KEY=xxx node seo/scripts/test-push.js
 *
 * Verifica: app info, subscribers, segmentos, e envia push de teste.
 */

const ONESIGNAL_APP_ID = '204a1304-2cc4-44b8-af83-f35ceaabd504';
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

if (!ONESIGNAL_REST_KEY) {
  console.error('❌ Defina ONESIGNAL_REST_KEY como variável de ambiente.');
  console.error('   Uso: ONESIGNAL_REST_KEY=sua_key node seo/scripts/test-push.js');
  process.exit(1);
}

const headers = {
  'Authorization': `Key ${ONESIGNAL_REST_KEY}`,
  'Content-Type': 'application/json',
};

async function testPush() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  CLUBE PRIME — Diagnóstico Push Notification     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Verificar app info e subscribers
  console.log('1/4 Consultando app info...');
  let messageable = 0;
  try {
    const appRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}`, { headers });
    if (appRes.ok) {
      const app = await appRes.json();
      messageable = app.messageable_players || 0;
      console.log(`  ✓ App: ${app.name}`);
      console.log(`  ✓ Players (total): ${app.players || 'N/A'}`);
      console.log(`  ✓ Messageable players: ${messageable}`);
      if (messageable === 0) {
        console.error('\n  ❌ ZERO subscribers! Ninguém pode receber push.');
        console.error('  Possíveis causas:');
        console.error('    - Ninguém aceitou as notificações no site');
        console.error('    - O Service Worker não está registrado corretamente');
        console.error('    - O domínio no OneSignal não bate com carnesrodrigues.com.br');
        console.error('  → Verifique: https://dashboard.onesignal.com → Audience → All Users\n');
      }
    } else {
      const errText = await appRes.text();
      console.error(`  ❌ Erro ao consultar app: HTTP ${appRes.status}`);
      console.error(`     ${errText}`);
      if (appRes.status === 401 || appRes.status === 403) {
        console.error('     → A REST API Key está incorreta ou expirada!');
      }
    }
  } catch (e) {
    console.error(`  ❌ Erro de rede: ${e.message}`);
  }

  // 2. Listar segmentos disponíveis
  console.log('\n2/4 Listando segmentos...');
  let segmentNames = [];
  try {
    const segRes = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/segments`, { headers });
    if (segRes.ok) {
      const segs = await segRes.json();
      segmentNames = (segs.segments || []).map(s => s.name);
      console.log(`  ✓ Segmentos: ${segmentNames.join(', ') || 'nenhum'}`);
      if (!segmentNames.includes('Total Subscriptions') && !segmentNames.includes('All')) {
        console.warn('  ⚠ Nem "Total Subscriptions" nem "All" encontrados — push pode falhar');
      }
    } else {
      console.warn(`  ⚠ Não foi possível listar segmentos: HTTP ${segRes.status}`);
    }
  } catch (e) {
    console.warn(`  ⚠ Erro ao listar segmentos: ${e.message}`);
  }

  // 3. Escolher melhor segmento
  const segment = segmentNames.includes('Total Subscriptions') ? 'Total Subscriptions'
    : segmentNames.includes('Subscribed Users') ? 'Subscribed Users'
    : 'All';
  console.log(`\n3/4 Segmento escolhido para teste: "${segment}"`);

  // 4. Enviar push de teste
  if (messageable === 0) {
    console.log('\n4/4 Pulando envio — 0 subscribers (não faz sentido enviar).');
    console.log('\n══════════════════════════════════════════════════');
    console.log('RESULTADO: ❌ Push não pode funcionar sem subscribers.');
    console.log('AÇÃO: Acesse carnesrodrigues.com.br, aceite notificações,');
    console.log('       e rode este script novamente.');
    console.log('══════════════════════════════════════════════════\n');
    process.exit(1);
  }

  console.log('\n4/4 Enviando push de teste...');
  try {
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: [segment],
      headings: { pt: '🔔 Teste Clube Prime', en: '🔔 Push Test' },
      contents: { pt: 'Se você está lendo isso, push funciona! ✓', en: 'Push test successful!' },
      url: 'https://carnesrodrigues.com.br/',
      web_url: 'https://carnesrodrigues.com.br/',
      chrome_web_icon: 'https://carnesrodrigues.com.br/icon-192.png',
    };

    const pushRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const pushBody = await pushRes.text();
    console.log(`  Status: ${pushRes.status}`);

    if (pushRes.ok) {
      const result = JSON.parse(pushBody);
      const recipients = result.recipients || 0;

      if (recipients > 0) {
        console.log(`\n══════════════════════════════════════════════════`);
        console.log(`RESULTADO: ✓ PUSH ENVIADA PARA ${recipients} RECIPIENT(S)!`);
        console.log(`ID: ${result.id}`);
        console.log(`Você deve receber a notificação em alguns segundos.`);
        console.log(`══════════════════════════════════════════════════\n`);
      } else {
        console.warn(`\n══════════════════════════════════════════════════`);
        console.warn(`RESULTADO: ⚠ API aceitou mas 0 recipients.`);
        console.warn(`Resposta: ${pushBody}`);
        console.warn(`AÇÃO: Verifique subscribers no dashboard OneSignal.`);
        console.warn(`══════════════════════════════════════════════════\n`);
      }

      if (result.errors && result.errors.length > 0) {
        console.warn(`  Erros reportados: ${JSON.stringify(result.errors)}`);
      }
    } else {
      console.error(`  ❌ Push falhou: ${pushBody}`);

      // Retry com segmento alternativo
      if (segment !== 'All') {
        console.log(`  Tentando com segmento "All"...`);
        payload.included_segments = ['All'];
        const retryRes = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const retryBody = await retryRes.text();
        console.log(`  Retry status: ${retryRes.status}`);
        console.log(`  Retry resposta: ${retryBody}`);
      }
    }
  } catch (e) {
    console.error(`  �