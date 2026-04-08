/**
 * CLUBE PRIME SEO — Conteúdo Diário
 *
 * Seleciona automaticamente o tipo de conteúdo baseado no dia da semana
 * e gera o artigo do dia com dados reais.
 *
 * Calendário:
 *   Segunda: Cotação + Análise Semanal
 *   Terça:   Raça ou Cruzamento
 *   Quarta:  Cotação + Do Campo ao Prato
 *   Quinta:  Região Produtora ou Tendência
 *   Sexta:   Cotação + Resumo Semanal
 *   Sábado:  Churrasco em Família
 *   Domingo: Momento em Família
 */

import { publicar, getDiaSemana, getDataFormatada } from './publicar.js';
import { getCotacaoHoje, getHistorico } from './cotacao-scraper.js';

// --- Banco de conteúdo rotativo ---

// Raças (terça-feira) — ciclo de ~14 semanas
const RACAS = [
  {
    slug: 'racas/angus',
    titulo: 'Angus: A Raça que Revolucionou a Pecuária de Corte no Brasil',
    tituloCurto: 'Angus',
    fotoKeyword: 'angus cattle',
    metaDescription: 'Conheça a raça Angus: origem, características de carcaça, marmoreio excepcional e por que o Angus se adaptou tão bem ao clima brasileiro.',
    ogDescription: 'Angus: marmoreio, precocidade e a melhor carne do pasto ao prato. Descubra por que é a raça mais valorizada.',
    blocoClube: 'O Empório Família Rodrigues trabalha com <strong>Angus certificado</strong> de produtores da Alta Mogiana. Membros do <strong>Clube Prime</strong> têm acesso antecipado a cortes especiais de Angus quando chegam — e eles esgotam rápido.',
    conteudo: `
        <p>O <strong>Angus</strong> — ou Aberdeen Angus, para usar o nome completo — é a raça de corte mais valorizada do mundo. Originária da Escócia, chegou ao Brasil nos anos 1960 e hoje é protagonista dos cruzamentos industriais que produzem a carne premium que você encontra nas melhores casas de carne.</p>

        <h2>Origem e História do Angus</h2>
        <p>A raça nasceu no nordeste da Escócia, nos condados de Aberdeen e Angus, no século XIX. Hugh Watson e William McCombie são considerados os pais da raça, que foi selecionada para precocidade, eficiência de conversão alimentar e qualidade de carcaça.</p>
        <p>O Angus é naturalmente mocho (sem chifres), o que facilita o manejo e reduz lesões no rebanho e na carcaça. Essa característica, combinada com temperamento dócil, fez da raça a preferida em sistemas intensivos e semi-intensivos ao redor do mundo.</p>

        <h2>Por Que o Angus Produz Carne Superior</h2>
        <p>A grande vantagem do Angus está no <strong>marmoreio</strong> — a gordura entremeada na fibra muscular que derrete durante o cozimento e dá aquele sabor incomparável. Em avaliações de carcaça, o Angus consistentemente alcança os maiores scores de marmoreio entre as raças britânicas.</p>
        <p>Além do marmoreio, o Angus se destaca por:</p>
        <ul>
            <li><strong>Precocidade:</strong> atinge ponto de abate mais cedo que a maioria das raças</li>
            <li><strong>Acabamento de gordura uniforme:</strong> cobertura por toda a carcaça, não concentrada</li>
            <li><strong>Rendimento de carcaça:</strong> entre 52% e 56%, acima da média</li>
            <li><strong>Maciez natural:</strong> fibras musculares finas e uniformes</li>
        </ul>

        <h2>Angus no Brasil: Adaptação e Cruzamentos</h2>
        <p>O Angus puro não lida bem com o calor tropical, carrapato e parasitas. Por isso, no Brasil, o grande jogo é o <strong>cruzamento industrial com Nelore</strong> — o famoso <strong>Anerê</strong> (Angus x Nelore).</p>
        <p>O cruzamento combina a rusticidade e resistência do Nelore com a qualidade de carcaça do Angus. O resultado é um animal que:</p>
        <ul>
            <li>Aguenta o calor do cerrado e do pantanal</li>
            <li>Resiste a carrapato e mosca-do-chifre</li>
            <li>Produz carne com marmoreio muito acima do Nelore puro</li>
            <li>Tem ganho de peso diário superior em confinamento</li>
        </ul>
        <p>A <strong>Alta Mogiana paulista</strong> e o <strong>Triângulo Mineiro</strong> são polos de produção de Angus e cruzamentos, com frigoríficos certificados que pagam ágio pelo boi Angus.</p>

        <h2>Certificação Angus e o Que Olhar na Hora da Compra</h2>
        <p>A <strong>Associação Brasileira de Angus</strong> certifica animais e carcaças. Quando você vê o selo "Carne Angus Certificada", significa que o animal foi tipificado e atende critérios mínimos de raça, idade e acabamento de gordura.</p>
        <p>Na hora de comprar carne Angus, observe:</p>
        <ul>
            <li>Cor vermelho-cereja brilhante (não escura ou opaca)</li>
            <li>Gordura entremeada visível (pontinhos brancos na fibra)</li>
            <li>Gordura de cobertura branca ou levemente amarelada</li>
            <li>Textura firme ao toque, não mole ou pegajosa</li>
        </ul>

        <h2>Melhores Cortes de Angus</h2>
        <p>Praticamente qualquer corte de Angus é superior ao mesmo corte de uma raça zebuína pura. Mas os destaques são:</p>
        <ul>
            <li><strong>Ribeye (Ancho):</strong> o corte que melhor expressa o marmoreio Angus</li>
            <li><strong>Picanha:</strong> capa de gordura generosa com sabor inconfundível</li>
            <li><strong>Prime Rib:</strong> costela premium, ideal para assados longos</li>
            <li><strong>Brisket (Peito):</strong> o preferido para defumação low & slow</li>
        </ul>
    `,
    faq: [
      {
        pergunta: 'Qual a diferença entre Angus e Nelore na qualidade da carne?',
        resposta: 'O Angus tem marmoreio (gordura entremeada) significativamente maior que o Nelore, resultando em carne mais macia e saborosa. O Nelore é mais magro e com fibras mais grossas. O cruzamento Angus x Nelore busca o melhor dos dois mundos: rusticidade do Nelore e qualidade de carcaça do Angus.'
      },
      {
        pergunta: 'Carne Angus é realmente melhor ou é marketing?',
        resposta: 'É comprovado cientificamente. Estudos de avaliação de carcaça mostram que o Angus atinge scores de marmoreio, maciez (medida por Warner-Bratzler) e suculência superiores. Porém, nem toda carne vendida como "Angus" é igual — busque a certificação da Associação Brasileira de Angus para garantia de procedência.'
      },
      {
        pergunta: 'Angus se adapta bem ao clima quente do Brasil?',
        resposta: 'O Angus puro sofre com calor extremo, carrapatos e parasitas tropicais. Por isso, no Brasil, o mais comum é o cruzamento Angus x Nelore (Anerê), que combina a resistência do zebu com a qualidade de carcaça do Angus. Regiões como Alta Mogiana e Triângulo Mineiro são polos de produção desse cruzamento.'
      }
    ],
    relacionados: [
      { slug: 'cruzamentos/angus-x-nelore', titulo: 'Anerê: O Melhor do Angus com Nelore', categoria: 'cruzamento' },
      { slug: 'cortes/picanha', titulo: 'Picanha: Guia Completo do Corte Mais Brasileiro', categoria: 'corte' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba do Boi Gordo Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 8
  },
  {
    slug: 'racas/hereford',
    titulo: 'Hereford: A Raça Britânica de Carne Macia e Saborosa',
    tituloCurto: 'Hereford',
    fotoKeyword: 'hereford cattle',
    metaDescription: 'Conheça a raça Hereford: origem inglesa, carne macia com gordura de cobertura ideal, adaptação ao Sul do Brasil e cruzamentos com Nelore.',
    ogDescription: 'Hereford: carne macia, gordura perfeita e tradição britânica nos pastos brasileiros.',
    blocoClube: 'O <strong>Clube Prime</strong> oferece acesso a cortes especiais de diversas raças, incluindo Hereford e cruzamentos selecionados.',
    conteudo: `
        <p>O <strong>Hereford</strong> é uma das raças de corte mais antigas e tradicionais do mundo. Com sua cara branca inconfundível e pelagem vermelha, é a raça que praticamente definiu o padrão de carne bovina de qualidade na Inglaterra.</p>

        <h2>Origem e Características do Hereford</h2>
        <p>Originário do condado de Herefordshire, na Inglaterra, o Hereford foi desenvolvido no século XVIII para produção de carne em pastagens naturais. É uma raça de porte médio a grande, com temperamento dócil e excelente capacidade de conversão alimentar.</p>
        <p>Características marcantes:</p>
        <ul>
            <li><strong>Cara branca e corpo vermelho:</strong> a marca registrada da raça</li>
            <li><strong>Rusticidade:</strong> adapta-se bem a climas frios e pastagens pobres</li>
            <li><strong>Gordura de cobertura:</strong> excelente acabamento de carcaça</li>
            <li><strong>Longevidade reprodutiva:</strong> vacas produtivas por muitos anos</li>
        </ul>

        <h2>Qualidade da Carne Hereford</h2>
        <p>A carne Hereford é reconhecida mundialmente pela <strong>maciez</strong> e pelo <strong>sabor característico</strong>. A raça produz uma gordura de cobertura uniforme que protege a carcaça durante a maturação, resultando em cortes suculentos.</p>
        <p>O marmoreio do Hereford é moderado — inferior ao Angus, mas significativamente superior ao das raças zebuínas. Isso faz do Hereford uma excelente opção para quem busca carne saborosa sem excesso de gordura entremeada.</p>

        <h2>Hereford no Brasil</h2>
        <p>O Hereford chegou ao Brasil pelo <strong>Rio Grande do Sul</strong>, onde encontrou clima e pastagens semelhantes à sua terra natal. O Sul do Brasil ainda concentra a maior parte do rebanho Hereford nacional.</p>
        <p>Assim como o Angus, o Hereford puro não se adapta ao calor tropical. O cruzamento com Nelore — chamado de <strong>Bonsmara</strong> ou Hereford x Nelore — é uma alternativa para expandir a raça para regiões mais quentes.</p>

        <h2>Hereford vs Angus: Qual é Melhor?</h2>
        <p>Não existe "melhor" absoluto — depende do sistema de produção e do objetivo:</p>
        <ul>
            <li><strong>Marmoreio:</strong> vantagem Angus</li>
            <li><strong>Gordura de cobertura:</strong> vantagem Hereford</li>
            <li><strong>Rusticidade em pastagem pobre:</strong> vantagem Hereford</li>
            <li><strong>Precocidade:</strong> semelhante nas duas raças</li>
            <li><strong>Valor de mercado:</strong> Angus tem maior ágio no Brasil atualmente</li>
        </ul>
    `,
    faq: [
      {
        pergunta: 'Qual a diferença entre Hereford e Angus?',
        resposta: 'O Angus tem mais marmoreio (gordura entremeada), enquanto o Hereford se destaca na gordura de cobertura e rusticidade em pastagens pobres. Ambas são raças britânicas de alta qualidade. O Angus é mocho (sem chifres) e o Hereford tem chifres (exceto a variante Polled Hereford).'
      },
      {
        pergunta: 'Onde se produz Hereford no Brasil?',
        resposta: 'A maior parte do rebanho Hereford brasileiro está no Rio Grande do Sul e em Santa Catarina, onde o clima mais frio favorece a raça. Cruzamentos com Nelore permitem a expansão para o Centro-Oeste.'
      },
      {
        pergunta: 'A carne Hereford é boa para churrasco?',
        resposta: 'Excelente. A gordura de cobertura uniforme do Hereford protege a carne durante o preparo no fogo, resultando em cortes suculentos. Picanha e costela de Hereford são particularmente valorizadas para churrasco.'
      }
    ],
    relacionados: [
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'cortes/picanha', titulo: 'Picanha: Guia Completo', categoria: 'corte' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba do Boi Gordo Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 7
  }
];

// Receitas/Churrasco (sábado) — ciclo rotativo
const CHURRASCO = [
  {
    slug: 'churrasco/receita-costela-fogo-de-chao',
    titulo: 'Costela no Fogo de Chão: Receita Completa com Tempo e Temperatura',
    tituloCurto: 'Costela no Fogo de Chão',
    fotoKeyword: 'beef ribs barbecue fire',
    categoria: 'churrasco',
    metaDescription: 'Aprenda a fazer costela no fogo de chão: preparação, tempero, tempo de cocção, controle de temperatura e dicas para carne macia que desfia.',
    ogDescription: 'Costela no fogo de chão que desfia: receita completa com todos os segredos do churrasqueiro.',
    blocoClube: 'A costela ideal para fogo de chão você encontra no <strong>Empório Família Rodrigues</strong>. Membros do <strong>Clube Prime</strong> podem reservar peças inteiras com antecedência e ganham desconto exclusivo.',
    conteudo: `
        <p>A <strong>costela no fogo de chão</strong> é o prato que transforma qualquer reunião em festa. Aquela carne que desfia no garfo, com crosta dourada por fora e suculenta por dentro. Mas o segredo não é mistério — é técnica, paciência e fogo controlado.</p>

        <h2>Escolhendo a Costela Certa</h2>
        <p>Para fogo de chão, você quer a <strong>costela minga</strong> (também chamada de ripa ou costela de tira) ou a <strong>costela ponta de agulha</strong>. A ponta de agulha é mais encorpada e ideal para cocções longas.</p>
        <p>Pontos para observar na compra:</p>
        <ul>
            <li><strong>Carne vermelha viva:</strong> nada de cor escura ou acinzentada</li>
            <li><strong>Gordura de cobertura:</strong> pelo menos 1cm de gordura por cima</li>
            <li><strong>Espessura uniforme:</strong> para cozimento igual por toda a peça</li>
            <li><strong>Peso ideal:</strong> 4 a 6 kg para fogo de chão (alimenta 8-12 pessoas)</li>
        </ul>

        <h2>Preparação e Tempero</h2>
        <p>A regra de ouro da costela: <strong>menos é mais</strong>. Sal grosso e fogo. Ponto final.</p>
        <ul>
            <li>Retire da geladeira 2 horas antes (temperatura ambiente)</li>
            <li>Sal grosso generoso: 1 colher de sopa por kg, distribuído por toda a superfície</li>
            <li>Não fure a carne — cada furo é suculência que escapa</li>
            <li>Gordura para cima na primeira metade do tempo</li>
        </ul>

        <h2>Fogo de Chão: Montagem e Controle</h2>
        <p>O fogo de chão é o método mais primitivo e eficaz de assar costela. Veja como montar:</p>
        <ul>
            <li><strong>Cava:</strong> 40-50cm de profundidade, 1m de comprimento</li>
            <li><strong>Carvão/lenha:</strong> acenda 1 hora antes de colocar a carne</li>
            <li><strong>Altura da grelha:</strong> 60-80cm acima das brasas</li>
            <li><strong>Temperatura:</strong> mão na altura da carne, aguentar 4-5 segundos = ideal</li>
        </ul>

        <h2>Tempo de Cocção</h2>
        <p>A costela no fogo de chão é um exercício de paciência. Tempos aproximados:</p>
        <ul>
            <li><strong>Costela de 4 kg:</strong> 5 a 6 horas</li>
            <li><strong>Costela de 6 kg:</strong> 7 a 8 horas</li>
            <li><strong>Teste do garfo:</strong> quando a carne se solta do osso facilmente, está pronta</li>
        </ul>
        <p>Dica: envolva em papel alumínio nas últimas 2 horas para reter umidade se a crosta já estiver formada.</p>

        <h2>Calculadora: Quantidade de Carne por Pessoa</h2>
        <p>Para costela com osso no fogo de chão:</p>
        <ul>
            <li><strong>Adultos (só costela):</strong> 500g por pessoa (com osso)</li>
            <li><strong>Adultos (com outros cortes):</strong> 350g por pessoa</li>
            <li><strong>Crianças:</strong> 200g por pessoa</li>
        </ul>
        <p>Exemplo: churrasco para 10 adultos e 4 crianças, com costela como carro-chefe → 10 × 400g + 4 × 200g = <strong>4,8 kg de costela</strong>.</p>
    `,
    faq: [
      {
        pergunta: 'Quanto tempo leva para assar costela no fogo de chão?',
        resposta: 'De 5 a 8 horas, dependendo do peso da peça. Uma costela de 4 kg leva cerca de 5-6 horas, enquanto uma de 6 kg pode levar 7-8 horas. O ponto certo é quando a carne se solta do osso com facilidade.'
      },
      {
        pergunta: 'Qual o melhor tempero para costela no fogo de chão?',
        resposta: 'Sal grosso. Apenas sal grosso, distribuído generosamente por toda a superfície. A costela tem gordura e sabor suficientes — temperos elaborados mascaram o sabor natural da carne. Se quiser inovar, uma leve defumação com lenha de jabuticabeira ou lichia adiciona aroma sutil.'
      },
      {
        pergunta: 'Costela vai com gordura para cima ou para baixo?',
        resposta: 'Comece com gordura para cima na primeira metade do tempo — isso protege a carne do calor direto e permite que a gordura derreta sobre a carne. Vire para selar a gordura e formar crosta nos últimos 30-60 minutos.'
      }
    ],
    relacionados: [
      { slug: 'churrasco/quantidade-carne-por-pessoa', titulo: 'Calculadora: Quantidade de Carne por Pessoa', categoria: 'churrasco' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' }
    ],
    schemaExtra: `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Costela no Fogo de Chão",
        "description": "Receita completa de costela bovina no fogo de chão, com tempo e temperatura para carne macia que desfia.",
        "author": {"@type": "Organization", "name": "Clube Prime — Empório Família Rodrigues"},
        "prepTime": "PT30M",
        "cookTime": "PT6H",
        "totalTime": "PT6H30M",
        "recipeYield": "10 porções",
        "recipeCategory": "Churrasco",
        "recipeCuisine": "Brasileira",
        "recipeIngredient": [
            "5 kg de costela bovina (ponta de agulha)",
            "Sal grosso (1 colher de sopa por kg)"
        ],
        "recipeInstructions": [
            {"@type": "HowToStep", "text": "Retire a costela da geladeira 2 horas antes do preparo."},
            {"@type": "HowToStep", "text": "Tempere com sal grosso generoso por toda a superfície."},
            {"@type": "HowToStep", "text": "Monte o fogo de chão com cava de 40-50cm e acenda o carvão 1 hora antes."},
            {"@type": "HowToStep", "text": "Coloque a costela na grelha a 60-80cm das brasas, gordura para cima."},
            {"@type": "HowToStep", "text": "Asse por 5-8 horas mantendo temperatura constante, virando na metade do tempo."},
            {"@type": "HowToStep", "text": "A costela está pronta quando a carne se solta do osso com facilidade."}
        ]
    }
    </script>`,
    tempoLeitura: 9
  }
];

// Cotação (segunda, quarta, sexta) — gerado dinamicamente
function gerarArtigoCotacao(tipo, cotacaoHoje, historico) {
  const data = getDataFormatada();
  const preco = cotacaoHoje ? `R$ ${cotacaoHoje.preco_rs}` : 'consulte o CEPEA';
  const variacao = cotacaoHoje?.variacao_pct;
  const varStr = variacao ? (variacao > 0 ? `+${variacao}%` : `${variacao}%`) : '';
  const trend = variacao > 0 ? 'alta' : variacao < 0 ? 'baixa' : 'estável';

  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const hoje = new Date();
  const mesNome = meses[hoje.getMonth()];
  const ano = hoje.getFullYear();

  // Gráfico: gerar dados inline para Chart.js
  const chartData = (historico || []).reverse().map(c => ({
    data: c.data,
    preco: c.preco_rs
  }));

  const chartLabels = chartData.map(c => {
    const [, m, d] = c.data.split('-');
    return `${d}/${m}`;
  });
  const chartValues = chartData.map(c => c.preco);

  let conteudoExtra = '';
  let tituloExtra = '';
  let slugExtra = '';

  if (tipo === 'analise') {
    tituloExtra = `Cotação da Arroba do Boi Gordo Hoje ${preco} — Análise Semanal ${mesNome} ${ano}`;
    slugExtra = 'cotacao-arroba-boi-gordo-hoje';
    conteudoExtra = `
        <p>A <strong>cotação da arroba do boi gordo</strong> hoje, ${new Date().toLocaleDateString('pt-BR')}, está em <strong>${preco}/@</strong> segundo o indicador CEPEA/Esalq${varStr ? `, com variação de ${varStr} em relação ao dia anterior` : ''}.</p>

        <div class="cotacao-destaque">
            <div>
                <div class="cotacao-label">Arroba do Boi Gordo — CEPEA/Esalq</div>
                <div class="cotacao-valor">${preco}/@</div>
                ${varStr ? `<div class="cotacao-var ${trend === 'alta' ? 'up' : 'down'}">${varStr} hoje</div>` : ''}
            </div>
        </div>

        <h2>Gráfico: Evolução dos Últimos 30 Dias</h2>
        <div class="chart-container">
            <canvas id="chart-cotacao"></canvas>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
        <script>
        new Chart(document.getElementById('chart-cotacao'),{
            type:'line',
            data:{
                labels:${JSON.stringify(chartLabels)},
                datasets:[{
                    label:'R$/@ (CEPEA)',
                    data:${JSON.stringify(chartValues)},
                    borderColor:'#C5A55A',
                    backgroundColor:'rgba(197,165,90,0.1)',
                    fill:true,
                    tension:0.3,
                    pointRadius:3,
                    pointBackgroundColor:'#C5A55A'
                }]
            },
            options:{
                responsive:true,
                plugins:{legend:{labels:{color:'#999'}},tooltip:{mode:'index'}},
                scales:{
                    x:{ticks:{color:'#666'},grid:{color:'#222'}},
                    y:{ticks:{color:'#666',callback:function(v){return'R$ '+v}},grid:{color:'#222'}}
                }
            }
        });
        <\/script>

        <h2>Análise Semanal do Mercado do Boi Gordo</h2>
        <p>O mercado pecuário inicia a semana com tendência de <strong>${trend}</strong>. ${trend === 'alta' ? 'A demanda firme do mercado interno e exportações para a China sustentam os preços.' : trend === 'baixa' ? 'Aumento de oferta de animais terminados pressiona os preços para baixo neste período.' : 'O mercado mostra equilíbrio entre oferta e demanda, sem grandes variações esperadas para os próximos dias.'}</p>
        <p>Fatores que influenciam a cotação esta semana:</p>
        <ul>
            <li><strong>Demanda interna:</strong> consumo doméstico segue como principal driver do mercado</li>
            <li><strong>Exportações:</strong> embarques para China e países árabes mantêm ritmo</li>
            <li><strong>Oferta de boi terminado:</strong> período de entressafra influencia disponibilidade</li>
            <li><strong>Custo do confinamento:</strong> milho e farelo de soja impactam custo de produção</li>
        </ul>

        <h2>O Que Esperar para os Próximos Dias</h2>
        <p>A tendência para a semana é de ${trend === 'alta' ? 'manutenção ou leve alta, sustentada pela demanda' : trend === 'baixa' ? 'possível estabilização caso a demanda absorva a oferta atual' : 'estabilidade, com variações pontuais dependendo da região'}. Acompanhe a cotação diariamente aqui no Clube Prime.</p>
    `;
  } else if (tipo === 'campo-prato') {
    tituloExtra = `Cotação da Arroba Hoje ${preco} — Do Campo ao Prato: Como o Preço do Boi Afeta Sua Carne`;
    slugExtra = 'cotacao-arroba-boi-gordo-hoje';
    conteudoExtra = `
        <p>A <strong>arroba do boi gordo</strong> está cotada em <strong>${preco}</strong> hoje (${new Date().toLocaleDateString('pt-BR')}) pelo indicador CEPEA/Esalq${varStr ? `, variação de ${varStr}` : ''}. Mas o que esse número significa para você, consumidor?</p>

        <div class="cotacao-destaque">
            <div>
                <div class="cotacao-label">Arroba do Boi Gordo — CEPEA/Esalq</div>
                <div class="cotacao-valor">${preco}/@</div>
                ${varStr ? `<div class="cotacao-var ${trend === 'alta' ? 'up' : 'down'}">${varStr} hoje</div>` : ''}
            </div>
        </div>

        <h2>Da Arroba ao Preço no Açougue</h2>
        <p>Uma arroba equivale a <strong>15 kg de carcaça</strong>. Mas entre o boi no pasto e o corte na sua mesa, existe uma cadeia que adiciona custo a cada etapa: frete, frigorífico, desossa, embalagem, logística, impostos e margem do varejo.</p>
        <p>Em média, o preço final ao consumidor é <strong>3 a 4 vezes o valor da arroba por kg</strong>. Se a arroba está a R$ 300, espere pagar entre R$ 60 e R$ 80/kg nos cortes nobres como picanha e filé mignon.</p>

        <h2>Por Que Alguns Cortes São Tão Mais Caros</h2>
        <p>Um boi de 500 kg vivo rende cerca de 250 kg de carcaça. Dessa carcaça:</p>
        <ul>
            <li><strong>Picanha:</strong> apenas 2 peças por boi (~2 kg total) — por isso é a mais cara</li>
            <li><strong>Filé mignon:</strong> 2 peças (~1,5 kg total) — ainda mais escasso</li>
            <li><strong>Costela:</strong> ~25 kg por boi — mais abundante, preço mais acessível</li>
            <li><strong>Dianteiro (acém, paleta):</strong> ~100 kg — maior volume, menor preço</li>
        </ul>

        <h2>Como o Manejo Afeta a Qualidade</h2>
        <p>A raça, alimentação e manejo do animal impactam diretamente o que chega ao seu prato:</p>
        <ul>
            <li><strong>Boi de pasto:</strong> carne mais magra, sabor mais pronunciado, gordura amarelada (betacaroteno)</li>
            <li><strong>Boi de confinamento:</strong> mais marmoreio, gordura branca, carne mais macia</li>
            <li><strong>Suplementação a pasto:</strong> meio-termo — rusticidade do pasto com acabamento de confinamento</li>
        </ul>

        <h2>Gráfico: Cotação dos Últimos 30 Dias</h2>
        <div class="chart-container">
            <canvas id="chart-cotacao"></canvas>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
        <script>
        new Chart(document.getElementById('chart-cotacao'),{
            type:'line',
            data:{
                labels:${JSON.stringify(chartLabels)},
                datasets:[{
                    label:'R$/@ (CEPEA)',
                    data:${JSON.stringify(chartValues)},
                    borderColor:'#C5A55A',
                    backgroundColor:'rgba(197,165,90,0.1)',
                    fill:true,
                    tension:0.3,
                    pointRadius:3,
                    pointBackgroundColor:'#C5A55A'
                }]
            },
            options:{
                responsive:true,
                plugins:{legend:{labels:{color:'#999'}},tooltip:{mode:'index'}},
                scales:{
                    x:{ticks:{color:'#666'},grid:{color:'#222'}},
                    y:{ticks:{color:'#666',callback:function(v){return'R$ '+v}},grid:{color:'#222'}}
                }
            }
        });
        <\/script>
    `;
  } else {
    // Resumo semanal (sexta)
    tituloExtra = `Cotação da Arroba ${preco} — Resumo Semanal do Mercado do Boi Gordo`;
    slugExtra = 'cotacao-arroba-boi-gordo-hoje';
    conteudoExtra = `
        <p>Encerramos a semana com a <strong>arroba do boi gordo</strong> cotada em <strong>${preco}</strong> pelo CEPEA/Esalq${varStr ? `, variação de ${varStr} no dia` : ''}.</p>

        <div class="cotacao-destaque">
            <div>
                <div class="cotacao-label">Arroba do Boi Gordo — CEPEA/Esalq</div>
                <div class="cotacao-valor">${preco}/@</div>
                ${varStr ? `<div class="cotacao-var ${trend === 'alta' ? 'up' : 'down'}">${varStr} hoje</div>` : ''}
            </div>
        </div>

        <h2>Resumo da Semana</h2>
        <p>Confira a evolução da cotação ao longo da semana no gráfico abaixo. A tendência geral foi de <strong>${trend}</strong>.</p>

        <div class="chart-container">
            <canvas id="chart-cotacao"></canvas>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
        <script>
        new Chart(document.getElementById('chart-cotacao'),{
            type:'line',
            data:{
                labels:${JSON.stringify(chartLabels)},
                datasets:[{
                    label:'R$/@ (CEPEA)',
                    data:${JSON.stringify(chartValues)},
                    borderColor:'#C5A55A',
                    backgroundColor:'rgba(197,165,90,0.1)',
                    fill:true,
                    tension:0.3,
                    pointRadius:3,
                    pointBackgroundColor:'#C5A55A'
                }]
            },
            options:{
                responsive:true,
                plugins:{legend:{labels:{color:'#999'}},tooltip:{mode:'index'}},
                scales:{
                    x:{ticks:{color:'#666'},grid:{color:'#222'}},
                    y:{ticks:{color:'#666',callback:function(v){return'R$ '+v}},grid:{color:'#222'}}
                }
            }
        });
        <\/script>

        <h2>Principais Movimentações</h2>
        <ul>
            <li>Mercado físico do boi gordo operou com tendência de ${trend} na maior parte da semana</li>
            <li>Frigoríficos mantiveram escalas de abate ajustadas à demanda</li>
            <li>Exportações seguiram com desempenho positivo para o período</li>
        </ul>

        <h2>Perspectiva para a Próxima Semana</h2>
        <p>Acompanhe a cotação da arroba diariamente aqui no Clube Prime. Na segunda-feira publicamos a análise semanal com projeções atualizadas.</p>
    `;
  }

  return {
    slug: slugExtra,
    titulo: tituloExtra,
    tituloCurto: 'Cotação Hoje',
    categoria: 'cotacao',
    fotoKeyword: tipo === 'campo-prato' ? 'premium beef cut raw' : 'cattle farm brazil sunset',
    metaDescription: `Cotação da arroba do boi gordo hoje: ${preco}/@ (CEPEA/Esalq). Gráfico de 30 dias, análise e tendência. Atualizado diariamente.`,
    ogDescription: `Arroba do boi gordo: ${preco}/@. Veja gráfico, análise e tendência.`,
    blocoClube: 'Acompanhe a <strong>cotação da arroba</strong> todo dia direto no app do <strong>Clube Prime</strong>. Além da cotação, membros ganham descontos exclusivos em cortes premium no Empório Família Rodrigues.',
    conteudo: conteudoExtra,
    faq: [
      {
        pergunta: 'Quanto está a arroba do boi gordo hoje?',
        resposta: `A arroba do boi gordo está cotada em ${preco} pelo indicador CEPEA/Esalq, referência para o mercado brasileiro. Acompanhe a atualização diária aqui no Clube Prime.`
      },
      {
        pergunta: 'O que é a arroba e como ela é calculada?',
        resposta: 'A arroba (símbolo @) equivale a 15 kg de carcaça bovina. O preço da arroba é calculado sobre o peso de carcaça (após abate), não sobre o peso vivo. Um boi de 500 kg vivo com rendimento de 52% produz cerca de 260 kg de carcaça, ou 17,3 arrobas.'
      },
      {
        pergunta: 'Onde consultar a cotação da arroba do boi gordo?',
        resposta: 'O indicador mais respeitado é o CEPEA/Esalq (Centro de Estudos Avançados em Economia Aplicada da USP). Aqui no Clube Prime atualizamos a cotação diariamente com base nos dados do CEPEA, incluindo gráfico de evolução e análise de mercado.'
      }
    ],
    relacionados: [
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'guia/carne-de-pasto-vs-confinamento', titulo: 'Pasto vs Confinamento: Diferença na Carne', categoria: 'guia' },
      { slug: 'churrasco/receita-costela-fogo-de-chao', titulo: 'Costela no Fogo de Chão', categoria: 'churrasco' }
    ],
    schemaExtra: `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "Cotação da Arroba do Boi Gordo — CEPEA/Esalq",
        "description": "Indicador diário de preço da arroba do boi gordo no mercado brasileiro, com base nos dados do CEPEA/Esalq.",
        "url": "https://carnesrodrigues.com.br/cotacao-arroba-boi-gordo-hoje",
        "temporalCoverage": "${ano}",
        "creator": {"@type": "Organization", "name": "CEPEA/Esalq — USP"}
    }
    </script>`,
    pushTitulo: `Arroba: ${preco}/@`,
    pushBody: `Boi gordo ${trend === 'alta' ? '📈 em alta' : trend === 'baixa' ? '📉 em baixa' : '➡️ estável'} — veja análise completa`,
    tempoLeitura: 6
  };
}

// --- Seletor de conteúdo por dia da semana ---

function calcularIndiceRotativo(items) {
  // Calcula qual item do array usar baseado na semana do ano
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return weekNumber % items.length;
}

async function selecionarConteudo() {
  const dia = process.env.DIA_OVERRIDE || getDiaSemana();
  console.log(`Dia da semana: ${dia}`);

  let cotacaoHoje = null;
  let historico = [];

  // Para dias de cotação, buscar dados
  if (['segunda', 'quarta', 'sexta'].includes(dia)) {
    try {
      cotacaoHoje = await getCotacaoHoje();
      historico = await getHistorico(30);
    } catch (e) {
      console.warn('Aviso: não foi possível buscar cotação do banco —', e.message);
    }
  }

  switch (dia) {
    case 'segunda':
      return gerarArtigoCotacao('analise', cotacaoHoje, historico);

    case 'terca': {
      const idx = calcularIndiceRotativo(RACAS);
      const raca = { ...RACAS[idx], categoria: 'raca' };
      return raca;
    }

    case 'quarta':
      return gerarArtigoCotacao('campo-prato', cotacaoHoje, historico);

    case 'quinta': {
      // Região produtora (TODO: expandir banco de regiões)
      return {
        slug: 'regioes/alta-mogiana',
        titulo: 'Alta Mogiana: A Região que Produz a Melhor Carne de São Paulo',
        tituloCurto: 'Alta Mogiana',
        categoria: 'regiao',
        fotoKeyword: 'cattle ranch sao paulo brazil',
        metaDescription: 'Alta Mogiana paulista: polo de produção de Angus e cruzamentos premium. Conheça a região e por que a carne daqui é diferente.',
        ogDescription: 'Alta Mogiana: onde nasce a carne premium que abastece o melhor de São Paulo.',
        blocoClube: 'O <strong>Empório Família Rodrigues</strong> trabalha com produtores da <strong>Alta Mogiana</strong>. Membros do <strong>Clube Prime</strong> têm acesso a cortes selecionados dessa região privilegiada.',
        conteudo: `
            <p>A <strong>Alta Mogiana</strong> é uma das regiões mais nobres da pecuária paulista. Localizada no nordeste de São Paulo, englobando cidades como Ribeirão Preto, Barretos, Franca e Jaboticabal, combina tradição agropecuária centenária com tecnologia de ponta.</p>

            <h2>Por Que a Alta Mogiana Produz Carne Superior</h2>
            <p>A região reúne condições ideais para pecuária de qualidade:</p>
            <ul>
                <li><strong>Solo fértil:</strong> terra roxa e latossolo vermelho, pastagens de alta qualidade</li>
                <li><strong>Água abundante:</strong> cortada por rios como o Pardo e o Grande</li>
                <li><strong>Tradição pecuária:</strong> mais de 100 anos de seleção genética</li>
                <li><strong>Proximidade de frigoríficos:</strong> cadeia completa na região</li>
                <li><strong>Centros de pesquisa:</strong> UNESP Jaboticabal, ESALQ/USP</li>
            </ul>

            <h2>Raças e Cruzamentos da Alta Mogiana</h2>
            <p>A região é polo de produção de cruzamentos industriais, especialmente <strong>Angus x Nelore</strong>. Os produtores da Alta Mogiana foram pioneiros na adoção de genética Angus no estado de São Paulo, e hoje a região concentra alguns dos melhores rebanhos de cruzamento do país.</p>

            <h2>Ribeirão Preto: Capital da Carne</h2>
            <p>Ribeirão Preto, maior cidade da Alta Mogiana, é um hub do agronegócio brasileiro. Sede da Agrishow (maior feira de tecnologia agrícola da América Latina), a cidade conecta produtores rurais, frigoríficos, exportadores e o consumidor final.</p>
            <p>É em Ribeirão Preto que o <strong>Empório de Carnes Família Rodrigues</strong> opera, com acesso direto aos melhores produtores da região.</p>
        `,
        faq: [
          {
            pergunta: 'Onde fica a Alta Mogiana?',
            resposta: 'A Alta Mogiana é uma região no nordeste do estado de São Paulo, centrada em Ribeirão Preto e abrangendo cidades como Barretos, Franca, Jaboticabal, Bebedouro e Olímpia. É uma das regiões agropecuárias mais importantes do Brasil.'
          },
          {
            pergunta: 'Por que a carne da Alta Mogiana é valorizada?',
            resposta: 'A região combina solo fértil (terra roxa), água abundante, tradição pecuária centenária e proximidade com centros de pesquisa como UNESP e ESALQ/USP. Isso resulta em rebanhos com genética superior e manejo técnico avançado.'
          },
          {
            pergunta: 'Quais raças são criadas na Alta Mogiana?',
            resposta: 'A região é forte em cruzamentos industriais, especialmente Angus x Nelore (Anerê). Também há rebanhos de Nelore selecionado, Hereford x Nelore e raças continentais como Simental em menor escala.'
          }
        ],
        relacionados: [
          { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
          { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' },
          { slug: 'guia/carne-de-pasto-vs-confinamento', titulo: 'Pasto vs Confinamento', categoria: 'guia' }
        ],
        tempoLeitura: 7
      };
    }

    case 'sexta':
      return gerarArtigoCotacao('resumo', cotacaoHoje, historico);

    case 'sabado': {
      const idx = calcularIndiceRotativo(CHURRASCO);
      return CHURRASCO[idx];
    }

    case 'domingo':
      return {
        slug: 'churrasco/tradicao-churrasco-familia',
        titulo: 'A Tradição do Churrasco em Família: Por Que a Carne Une Gerações',
        tituloCurto: 'Churrasco em Família',
        categoria: 'familia',
        fotoKeyword: 'family gathering outdoor barbecue',
        metaDescription: 'O churrasco como tradição familiar brasileira: memórias, receitas de avô, dicas para reunir a família ao redor da churrasqueira.',
        ogDescription: 'Churrasco é mais que carne — é família, tradição e memória afetiva.',
        blocoClube: 'O <strong>Clube Prime</strong> é para toda a família. Convide seus amigos e parentes — quem indica ganha benefícios por cada novo membro.',
        conteudo: `
            <p>Todo brasileiro tem uma memória de churrasco em família. O avô que acordava cedo para acender o carvão. A tia que fazia o arroz e a farofa. Os primos correndo no quintal enquanto a carne ficava pronta. O churrasco é, talvez, a tradição mais democrática e unificadora do Brasil.</p>

            <h2>O Ritual do Churrasco</h2>
            <p>O churrasco brasileiro é um ritual. Não é apenas cozinhar carne — é o ato de reunir, conversar, compartilhar. O churrasqueiro é o anfitrião, o guardião do fogo. O ponto da carne é motivo de debate eterno. E a sobremesa é sempre "mais uma carninha".</p>
            <p>Cada região tem seu estilo:</p>
            <ul>
                <li><strong>Gaúcho:</strong> espeto corrido, sal grosso, fogo de chão, chimichurri</li>
                <li><strong>Paulista:</strong> picanha na grelha, pão de alho, vinagrete, cerveja gelada</li>
                <li><strong>Mineiro:</strong> costela com mandioca, feijão tropeiro, queijo na brasa</li>
                <li><strong>Nordestino:</strong> carne de sol, linguiça, churrasquinho de rua</li>
            </ul>

            <h2>O Que Seu Avô Sabia Sobre Carne</h2>
            <p>A geração dos nossos avós não tinha YouTube, não lia blog de churrasco, não usava termômetro digital. Mas fazia uma carne incrível. Por quê?</p>
            <ul>
                <li><strong>Paciência:</strong> ninguém tinha pressa. A carne ficava pronta quando ficava pronta</li>
                <li><strong>Simplicidade:</strong> sal e fogo. Sem marinadas elaboradas, sem sous vide</li>
                <li><strong>Conhecimento do fogo:</strong> sabiam ler a brasa como ninguém</li>
                <li><strong>Respeito pela carne:</strong> não desperdiçavam nada, aproveitavam cada corte</li>
            </ul>

            <h2>Transmitindo a Tradição</h2>
            <p>O melhor presente que você pode dar aos seus filhos é ensiná-los a fazer um bom churrasco. Não é sobre a receita — é sobre o ritual: escolher a carne, preparar o fogo, esperar o ponto certo, servir com orgulho.</p>
            <p>Leve as crianças ao açougue. Deixe elas escolherem um corte. Ensine a diferença entre picanha e maminha. Explique por que o sal grosso funciona melhor. Crie memórias que elas vão carregar para sempre.</p>
        `,
        faq: [
          {
            pergunta: 'Qual o corte ideal para churrasco em família com crianças?',
            resposta: 'Costela é perfeita — cozimento longo dá tempo para brincar, e a carne fica tão macia que até criança come fácil. Fraldinha também é boa opção: sabor suave, macia e com preço acessível para grandes quantidades.'
          },
          {
            pergunta: 'Quanto de carne comprar para um churrasco em família?',
            resposta: 'Regra geral: 400g por adulto e 200g por criança (com acompanhamentos). Para 10 adultos e 5 crianças: 10 × 400g + 5 × 200g = 5 kg de carne. Se for só carne (sem muito acompanhamento), suba para 500g por adulto.'
          },
          {
            pergunta: 'Qual o melhor carvão para churrasco?',
            resposta: 'Carvão de eucalipto é o mais comum e funciona bem. Para sabor premium, lenha de jabuticabeira, lichia ou laranjeira adicionam aroma especial. Evite carvão de procedência desconhecida — pode conter madeira tratada com químicos.'
          }
        ],
        relacionados: [
          { slug: 'churrasco/receita-costela-fogo-de-chao', titulo: 'Costela no Fogo de Chão', categoria: 'churrasco' },
          { slug: 'churrasco/quantidade-carne-por-pessoa', titulo: 'Calculadora: Carne por Pessoa', categoria: 'churrasco' },
          { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' }
        ],
        tempoLeitura: 6
      };

    default:
      console.error(`Dia da semana não reconhecido: ${dia}`);
      process.exit(1);
  }
}

// --- Main ---

const dados = await selecionarConteudo();
await publicar(dados);
