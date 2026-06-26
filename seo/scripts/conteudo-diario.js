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
import { getResumoMercado } from './mercado-scraper.js';
import { gerarPainelMercado } from './gerar-artigo.js';
import { LOCAL_COMERCIAL } from './artigos-locais.js';

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
  },
  {
    slug: 'racas/nelore',
    titulo: 'Nelore: A Raça Zebuína que Domina a Pecuária Brasileira',
    tituloCurto: 'Nelore',
    fotoKeyword: 'nelore cattle brazil white',
    metaDescription: 'Conheça a raça Nelore: origem indiana, adaptação ao trópico, carne magra e saborosa, e por que 80% do rebanho brasileiro tem sangue Nelore.',
    ogDescription: 'Nelore: rusticidade tropical, carne magra e a base genética da pecuária do Brasil.',
    blocoClube: 'O <strong>Empório Família Rodrigues</strong> trabalha com Nelore selecionado e cruzamentos industriais. No <strong>Clube Prime</strong>, você tem acesso aos melhores cortes com procedência garantida.',
    conteudo: `
        <p>O <strong>Nelore</strong> é sinônimo de pecuária brasileira. De origem indiana, essa raça zebuína se adaptou perfeitamente ao clima tropical e hoje representa cerca de <strong>80% do rebanho de corte nacional</strong>. Se existe uma raça que construiu a indústria de carne bovina do Brasil, é o Nelore.</p>

        <h2>Origem e Chegada ao Brasil</h2>
        <p>O Nelore (ou Ongole, como é conhecido na Índia) é originário do estado de Andhra Pradesh, na costa leste da Índia. Chegou ao Brasil no início do século XX e encontrou aqui condições semelhantes ao seu habitat natural: calor, umidade e pastagens extensivas.</p>
        <p>A adaptação foi tão bem-sucedida que o Nelore brasileiro é hoje geneticamente superior ao indiano em termos de produção de carne, graças a décadas de seleção genética focada em ganho de peso e musculatura.</p>

        <h2>Por Que o Nelore Domina o Brasil</h2>
        <p>O Nelore tem vantagens imbatíveis para o trópico:</p>
        <ul>
            <li><strong>Resistência ao calor:</strong> pele pigmentada e pelos curtos dissipam calor</li>
            <li><strong>Tolerância a parasitas:</strong> resistente a carrapato, berne e mosca-do-chifre</li>
            <li><strong>Eficiência a pasto:</strong> converte capim de baixa qualidade em carne</li>
            <li><strong>Longevidade reprodutiva:</strong> vacas Nelore produzem por 12-15 anos</li>
            <li><strong>Baixo custo de produção:</strong> não precisa de confinamento obrigatório</li>
        </ul>

        <h2>Qualidade da Carne Nelore</h2>
        <p>A carne de Nelore é mais <strong>magra</strong> que a de raças britânicas, com fibras musculares mais grossas e menos gordura entremeada (marmoreio). Isso não significa que seja inferior — é uma carne com <strong>sabor pronunciado</strong>, especialmente quando o animal é bem manejado.</p>
        <p>Fatores que elevam a qualidade do Nelore:</p>
        <ul>
            <li><strong>Terminação em confinamento:</strong> últimos 90-120 dias com ração melhoram marmoreio</li>
            <li><strong>Suplementação a pasto:</strong> creep feeding e sal proteinado fazem diferença</li>
            <li><strong>Maturação:</strong> 14-21 dias de maturação amaciando naturalmente a carne</li>
            <li><strong>Cruzamento industrial:</strong> Nelore x Angus combina rusticidade com marmoreio</li>
        </ul>

        <h2>Nelore vs Angus: Qual Comprar?</h2>
        <p>Depende do objetivo:</p>
        <ul>
            <li><strong>Para churrasco rápido (grelha):</strong> Angus ou cruzamento, pelo marmoreio</li>
            <li><strong>Para assados longos (costela, cupim):</strong> Nelore brilha — a gordura externa derrete lentamente</li>
            <li><strong>Para o dia a dia:</strong> Nelore maturado é excelente custo-benefício</li>
            <li><strong>Para cortes nobres:</strong> cruzamento F1 (Angus x Nelore) é o melhor dos dois mundos</li>
        </ul>

        <h2>Cortes Estrela do Nelore</h2>
        <ul>
            <li><strong>Cupim:</strong> exclusivo do zebu — gordura intramuscular que derrete no cozimento longo</li>
            <li><strong>Picanha com capa gorda:</strong> Nelore com boa terminação tem capa de gordura generosa</li>
            <li><strong>Costela:</strong> abundante e perfeita para fogo de chão</li>
            <li><strong>Acém:</strong> corte de dianteiro excepcional para cozidos e sopas</li>
        </ul>
    `,
    faq: [
      {
        pergunta: 'A carne de Nelore é boa?',
        resposta: 'Sim. A carne de Nelore bem manejado é saborosa e magra. Para melhorar a maciez, opte por peças maturadas (14-21 dias) ou de animais que passaram por terminação em confinamento. Cortes como cupim, costela e picanha de Nelore são excelentes.'
      },
      {
        pergunta: 'Qual a diferença entre Nelore e Angus?',
        resposta: 'Nelore é uma raça zebuína (indiana), adaptada ao calor tropical, com carne mais magra e fibras mais grossas. Angus é uma raça britânica com mais marmoreio e maciez natural. O cruzamento Angus x Nelore (Anerê) combina as vantagens de ambas.'
      },
      {
        pergunta: 'O que é o cupim e por que só existe no Nelore?',
        resposta: 'O cupim é uma corcova de gordura e músculo sobre o pescoço, exclusiva de raças zebuínas como o Nelore. É um corte rico em gordura intramuscular que derrete em cozimentos longos, resultando em carne extremamente macia e saborosa.'
      }
    ],
    relacionados: [
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'cruzamentos/angus-x-nelore', titulo: 'Anerê: O Melhor do Angus com Nelore', categoria: 'cruzamento' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba do Boi Gordo Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 8
  },
  {
    slug: 'racas/brahman',
    titulo: 'Brahman: Força e Rusticidade na Pecuária Tropical',
    tituloCurto: 'Brahman',
    fotoKeyword: 'brahman cattle gray',
    metaDescription: 'Raça Brahman: origem americana a partir de zebuínos indianos, rusticidade extrema, cruzamentos e qualidade de carne para o trópico.',
    ogDescription: 'Brahman: a raça zebuína americana que conquista o Brasil com rusticidade e eficiência.',
    blocoClube: 'No <strong>Empório Família Rodrigues</strong>, trabalhamos com diversas raças e cruzamentos selecionados. Membros do <strong>Clube Prime</strong> recebem cortes premium com rastreabilidade completa.',
    conteudo: `
        <p>O <strong>Brahman</strong> é uma raça que nasceu nos Estados Unidos a partir de zebuínos indianos — Gir, Nelore, Guzerá e Krishna Valley — selecionados para produção de carne no clima quente do sul americano. É a prova de que seleção genética inteligente cria resultados superiores.</p>

        <h2>Origem e Desenvolvimento</h2>
        <p>No início do século XX, pecuaristas do Texas e da Louisiana importaram zebuínos da Índia e começaram um programa de seleção focado em três pilares: ganho de peso, musculatura e tolerância ao calor. O resultado foi uma raça que supera o Nelore em ganho de peso e se aproxima das britânicas em rendimento de carcaça.</p>

        <h2>Características do Brahman</h2>
        <ul>
            <li><strong>Porte grande:</strong> touros podem ultrapassar 1.000 kg</li>
            <li><strong>Cupim desenvolvido:</strong> reserva energética natural</li>
            <li><strong>Orelhas longas e pele solta:</strong> adaptações ao calor</li>
            <li><strong>Resistência:</strong> carrapato, moscas e doenças tropicais</li>
            <li><strong>Habilidade materna:</strong> vacas Brahman são mães protetoras e leiteiras</li>
        </ul>

        <h2>Brahman no Brasil</h2>
        <p>O Brahman vem ganhando espaço no Brasil, especialmente no Centro-Oeste e Norte. O cruzamento <strong>Brahman x Nelore</strong> produz animais com vigor híbrido excepcional, e o <strong>Brahman x Angus</strong> (Brangus) é cada vez mais popular em sistemas intensivos.</p>

        <h2>Qualidade da Carne</h2>
        <p>A carne do Brahman é intermediária entre Nelore e raças britânicas em termos de maciez e marmoreio. Com terminação adequada em confinamento, o Brahman produz carcaças com bom acabamento e rendimento acima de 54%.</p>
    `,
    faq: [
      {
        pergunta: 'Qual a diferença entre Brahman e Nelore?',
        resposta: 'Ambos são zebuínos, mas o Brahman foi selecionado nos EUA para ganho de peso e musculatura, enquanto o Nelore brasileiro foi selecionado para eficiência a pasto. O Brahman tende a ter maior rendimento de carcaça e ganho de peso em confinamento.'
      },
      {
        pergunta: 'O que é Brangus?',
        resposta: 'Brangus é o cruzamento Brahman x Angus, combinando a rusticidade tropical do Brahman com o marmoreio e maciez do Angus. É uma raça sintética muito popular para produção de carne premium em clima quente.'
      }
    ],
    relacionados: [
      { slug: 'racas/nelore', titulo: 'Nelore: A Base da Pecuária Brasileira', categoria: 'raca' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 7
  },
  {
    slug: 'racas/senepol',
    titulo: 'Senepol: A Raça Tropical de Carne Macia e Sem Chifres',
    tituloCurto: 'Senepol',
    fotoKeyword: 'senepol cattle red tropical',
    metaDescription: 'Raça Senepol: origem caribenha, naturalmente mocha, tolerante ao calor, carne macia com marmoreio. A raça que cresce mais rápido no Brasil.',
    ogDescription: 'Senepol: mocha, tropical e com carne que rivaliza com raças britânicas em maciez.',
    blocoClube: 'No <strong>Clube Prime</strong>, buscamos as melhores genéticas para nossos membros. Cortes de Senepol e cruzamentos selecionados com disponibilidade exclusiva.',
    conteudo: `
        <p>O <strong>Senepol</strong> é a raça que está revolucionando a pecuária tropical brasileira. Originária da ilha de St. Croix, no Caribe, combina tolerância extrema ao calor com qualidade de carne que surpreende até os criadores de raças britânicas.</p>

        <h2>Origem: Do Caribe ao Cerrado</h2>
        <p>A raça foi desenvolvida na ilha de St. Croix (Ilhas Virgens Americanas) a partir do cruzamento entre N'Dama africano e Red Poll britânico. O resultado: um animal naturalmente <strong>mocho</strong> (sem chifres), de pelagem vermelha, que produz carne de qualidade em clima tropical sem ar-condicionado.</p>

        <h2>Vantagens do Senepol</h2>
        <ul>
            <li><strong>Mocho natural:</strong> sem chifres = menos lesões, manejo mais fácil</li>
            <li><strong>Pelo curto e liso:</strong> dissipa calor, menos estresse térmico</li>
            <li><strong>Precocidade:</strong> atinge ponto de abate 2-3 meses antes do Nelore</li>
            <li><strong>Marmoreio:</strong> superior ao Nelore, comparável a cruzamentos F1</li>
            <li><strong>Temperamento dócil:</strong> facilita manejo e reduz estresse pré-abate</li>
        </ul>

        <h2>Senepol no Brasil</h2>
        <p>O Senepol chegou ao Brasil no início dos anos 2000 e cresceu exponencialmente. Mato Grosso, Goiás e Minas Gerais concentram os maiores plantéis. O cruzamento <strong>Senepol x Nelore</strong> é particularmente promissor — combina a rusticidade do Nelore com a maciez e precocidade do Senepol.</p>

        <h2>Qualidade da Carne</h2>
        <p>Estudos da Embrapa e UNESP mostram que a carne de Senepol tem:</p>
        <ul>
            <li>Marmoreio 30-40% superior ao Nelore puro</li>
            <li>Maciez medida por Warner-Bratzler comparável ao Angus x Nelore</li>
            <li>Rendimento de carcaça entre 52% e 55%</li>
            <li>Gordura de cobertura uniforme, ideal para maturação</li>
        </ul>
    `,
    faq: [
      {
        pergunta: 'Senepol é melhor que Nelore?',
        resposta: 'Depende do sistema. O Senepol é mais precoce e produz carne mais macia, mas o Nelore é mais rústico em pastagens pobres e tem custo de aquisição menor. O cruzamento Senepol x Nelore é uma excelente opção que combina as vantagens de ambas as raças.'
      },
      {
        pergunta: 'Por que o Senepol não tem chifres?',
        resposta: 'O Senepol é naturalmente mocho — o gene para ausência de chifres é dominante na raça, herdado do Red Poll britânico. Isso é uma grande vantagem no manejo: menos lesões no rebanho, na carcaça e nos trabalhadores.'
      }
    ],
    relacionados: [
      { slug: 'racas/nelore', titulo: 'Nelore: A Base da Pecuária Brasileira', categoria: 'raca' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 7
  },
  {
    slug: 'racas/wagyu',
    titulo: 'Wagyu: A Raça Japonesa da Carne Mais Valorizada do Mundo',
    tituloCurto: 'Wagyu',
    fotoKeyword: 'wagyu beef marbling premium',
    metaDescription: 'Raça Wagyu: origem japonesa, marmoreio extremo, produção no Brasil e por que a carne Wagyu é a mais cara e cobiçada do planeta.',
    ogDescription: 'Wagyu: marmoreio extremo, sabor inigualável e a carne mais premium que existe.',
    blocoClube: 'Cortes Wagyu são raros e exclusivos. Membros do <strong>Clube Prime</strong> têm acesso prioritário quando lotes especiais chegam ao <strong>Empório Família Rodrigues</strong>.',
    conteudo: `
        <p>Se existe uma carne que se tornou sinônimo de luxo absoluto, é a <strong>Wagyu</strong>. Originária do Japão, essa raça produz a carne com o maior nível de <strong>marmoreio</strong> do mundo — gordura entremeada tão abundante que a peça parece um mármore branco e vermelho.</p>

        <h2>Origem e Significado</h2>
        <p>"Wagyu" significa literalmente "boi japonês" (wa = Japão, gyu = boi). As quatro linhagens principais são Japanese Black (Kuroge), Japanese Brown (Akage), Japanese Shorthorn e Japanese Polled. A Japanese Black, que produz o famoso Kobe Beef, representa mais de 90% da produção.</p>

        <h2>O Segredo do Marmoreio Wagyu</h2>
        <p>O marmoreio do Wagyu não é acidente — é resultado de séculos de seleção genética e um sistema de criação único:</p>
        <ul>
            <li><strong>Genética:</strong> genes específicos para deposição de gordura intramuscular</li>
            <li><strong>Alimentação:</strong> dieta controlada com grãos por 400-600 dias</li>
            <li><strong>Manejo:</strong> baixo estresse, espaço amplo, abate tardio (28-32 meses)</li>
            <li><strong>Classificação:</strong> escala BMS (Beef Marbling Score) de 1 a 12, com BMS 10+ sendo o topo</li>
        </ul>

        <h2>Wagyu no Brasil</h2>
        <p>O Brasil tem um rebanho Wagyu em crescimento, concentrado em São Paulo, Minas Gerais e Mato Grosso do Sul. A maioria da produção nacional é de <strong>cruzamento Wagyu x Angus</strong> ou <strong>Wagyu x Nelore</strong>, que atinge BMS 4-7 — excelente para o mercado premium sem o custo do Wagyu fullblood.</p>

        <h2>Quanto Custa e Vale a Pena?</h2>
        <p>Wagyu fullblood (puro) pode custar de R$ 300 a R$ 800 por kg dependendo do corte e BMS. Cruzamentos brasileiros ficam entre R$ 120 e R$ 300/kg. Para quem aprecia carne, experimentar pelo menos uma vez é uma experiência gastronômica transformadora.</p>
    `,
    faq: [
      {
        pergunta: 'Wagyu e Kobe são a mesma coisa?',
        resposta: 'Não. Wagyu é a raça; Kobe é uma denominação de origem. Kobe Beef deve ser Wagyu da linhagem Tajima, criado na região de Hyogo, Japão, e classificado com BMS 6 ou superior. Todo Kobe é Wagyu, mas nem todo Wagyu é Kobe.'
      },
      {
        pergunta: 'Existe Wagyu brasileiro de qualidade?',
        resposta: 'Sim. O Brasil tem produtores sérios de Wagyu, tanto fullblood quanto cruzamentos. Os cruzamentos Wagyu x Angus brasileiros atingem BMS 4-7, que é excelente. Procure produtores certificados pela Associação Brasileira de Wagyu (ABWB).'
      }
    ],
    relacionados: [
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'guia/carne-de-pasto-vs-confinamento', titulo: 'Pasto vs Confinamento', categoria: 'guia' },
      { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' }
    ],
    tempoLeitura: 8
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
  },
  {
    slug: 'churrasco/picanha-perfeita',
    titulo: 'Picanha Perfeita na Grelha: O Guia Definitivo do Corte Mais Brasileiro',
    tituloCurto: 'Picanha na Grelha',
    fotoKeyword: 'picanha steak grill brazilian barbecue',
    categoria: 'churrasco',
    metaDescription: 'Como fazer picanha perfeita na grelha: escolha da peça, corte, tempero, tempo de cada lado e ponto ideal. Guia completo do churrasqueiro.',
    ogDescription: 'Picanha perfeita: sal grosso, brasa forte e o ponto certo. O guia que todo churrasqueiro precisa.',
    blocoClube: 'A melhor picanha de Ribeirão Preto está no <strong>Empório Família Rodrigues</strong>. Membros do <strong>Clube Prime</strong> escolhem peças especiais com capa de gordura perfeita.',
    conteudo: `
        <p>A <strong>picanha</strong> é o corte sagrado do churrasco brasileiro. São apenas <strong>dois pedaços por boi</strong>, totalizando cerca de 2 kg — o que faz dela um dos cortes mais nobres e disputados. Mas fazer picanha perfeita na grelha exige técnica, não sorte.</p>

        <h2>Como Escolher a Picanha Ideal</h2>
        <p>Na hora da compra, observe:</p>
        <ul>
            <li><strong>Capa de gordura:</strong> entre 1,5 e 2 cm — não muito fina (seca) nem muito grossa (excesso)</li>
            <li><strong>Cor:</strong> vermelho-cereja vivo, gordura branca ou levemente creme</li>
            <li><strong>Peso:</strong> 1 a 1,5 kg por peça é o ideal</li>
            <li><strong>Marmorização:</strong> pontinhos brancos na carne indicam qualidade superior</li>
            <li><strong>Origem:</strong> Angus, cruzamento ou Nelore com terminação — pergunte ao açougueiro</li>
        </ul>

        <h2>Preparo e Tempero</h2>
        <p>A picanha pede simplicidade:</p>
        <ul>
            <li>Retire da geladeira 30-40 minutos antes (não precisa de 2 horas como na costela)</li>
            <li><strong>Sal grosso</strong> — generoso, por toda a superfície e na gordura</li>
            <li>Não fure, não marine, não coloque alho. Sal e fogo. Ponto.</li>
        </ul>

        <h2>Na Grelha: Técnica e Tempo</h2>
        <p>A picanha pode ir inteira ou em fatias (bifes). Para peça inteira:</p>
        <ul>
            <li><strong>Gordura para baixo primeiro:</strong> 15-20 minutos em brasa forte para selar</li>
            <li><strong>Virar:</strong> quando a gordura estiver dourada e crocante</li>
            <li><strong>Lado da carne:</strong> 10-15 minutos dependendo da espessura</li>
            <li><strong>Ponto:</strong> use o teste do dedo — selada por fora, rosada por dentro</li>
            <li><strong>Descanso:</strong> 5 minutos antes de fatiar (sucos se redistribuem)</li>
        </ul>

        <h2>Fatiar: A Arte Final</h2>
        <p>Fatiar a picanha corretamente faz diferença enorme:</p>
        <ul>
            <li>Sempre <strong>contra as fibras</strong> — fatias perpendiculares ao comprimento da peça</li>
            <li>Espessura de 1 a 1,5 cm — nem tão fina que resseque, nem tão grossa que perca a crosta</li>
            <li>Cada fatia deve ter um pedaço de gordura — é a assinatura do corte</li>
        </ul>
    `,
    faq: [
      {
        pergunta: 'Quanto tempo para assar picanha na grelha?',
        resposta: 'Peça inteira: 25-35 minutos total (15-20 com gordura para baixo + 10-15 do lado da carne). Bifes de 2cm: 3-4 minutos de cada lado para ponto mal passado a ao ponto. Brasa forte, grelha a 15-20cm das brasas.'
      },
      {
        pergunta: 'Picanha vai com gordura para cima ou para baixo?',
        resposta: 'Comece com gordura para baixo na grelha — isso sela a gordura, cria crosta crocante e protege a carne. Vire quando dourar (15-20 min). No espeto, gordura para cima nos primeiros giros para a gordura derreter sobre a carne.'
      },
      {
        pergunta: 'Qual o peso ideal de picanha por pessoa?',
        resposta: 'Se a picanha for o único corte: 250-300g por pessoa. Com outros cortes (linguiça, fraldinha): 150-200g por pessoa. Uma peça de 1,2 kg serve 4-5 pessoas confortavelmente quando há acompanhamentos.'
      }
    ],
    relacionados: [
      { slug: 'churrasco/receita-costela-fogo-de-chao', titulo: 'Costela no Fogo de Chão', categoria: 'churrasco' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' },
      { slug: 'churrasco/quantidade-carne-por-pessoa', titulo: 'Calculadora: Carne por Pessoa', categoria: 'churrasco' }
    ],
    schemaExtra: `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Picanha Perfeita na Grelha",
        "description": "Guia completo para fazer picanha perfeita na grelha: escolha, tempero, tempo e ponto ideal.",
        "author": {"@type": "Organization", "name": "Clube Prime — Empório Família Rodrigues"},
        "prepTime": "PT40M",
        "cookTime": "PT35M",
        "totalTime": "PT1H15M",
        "recipeYield": "5 porções",
        "recipeCategory": "Churrasco",
        "recipeCuisine": "Brasileira",
        "recipeIngredient": [
            "1,2 kg de picanha",
            "Sal grosso a gosto"
        ],
        "recipeInstructions": [
            {"@type": "HowToStep", "text": "Retire a picanha da geladeira 30-40 minutos antes."},
            {"@type": "HowToStep", "text": "Tempere com sal grosso generoso por toda a superfície."},
            {"@type": "HowToStep", "text": "Coloque na grelha com gordura para baixo em brasa forte."},
            {"@type": "HowToStep", "text": "Asse 15-20 minutos até a gordura dourar e ficar crocante."},
            {"@type": "HowToStep", "text": "Vire e asse mais 10-15 minutos do lado da carne."},
            {"@type": "HowToStep", "text": "Descanse 5 minutos e fatie contra as fibras em fatias de 1-1,5cm."}
        ]
    }
    </script>`,
    tempoLeitura: 8
  },
  {
    slug: 'churrasco/fraldinha-na-brasa',
    titulo: 'Fraldinha na Brasa: Corte Subestimado que Rouba a Cena no Churrasco',
    tituloCurto: 'Fraldinha na Brasa',
    fotoKeyword: 'flank steak grilled barbecue',
    categoria: 'churrasco',
    metaDescription: 'Fraldinha na brasa: como preparar, temperar e acertar o ponto deste corte subestimado. Sabor intenso, preço justo e resultado incrível.',
    ogDescription: 'Fraldinha: o corte custo-benefício que todo churrasqueiro deveria dominar.',
    blocoClube: 'Fraldinha selecionada no <strong>Empório Família Rodrigues</strong>. Membros <strong>Clube Prime</strong> têm acesso a cortes especiais e descontos exclusivos.',
    conteudo: `
        <p>A <strong>fraldinha</strong> é o segredo dos churrasqueiros experientes. Enquanto todos disputam picanha e costela, quem conhece sabe que a fraldinha entrega <strong>sabor intenso, suculência</strong> e um preço que cabe no bolso. É o melhor custo-benefício do churrasco.</p>

        <h2>O Que É a Fraldinha</h2>
        <p>A fraldinha (também chamada de vazio ou aba de filé em algumas regiões) é um corte que fica na parte inferior do boi, entre a costela e o traseiro. Cada boi produz aproximadamente <strong>4 a 6 kg de fraldinha</strong>, muito mais que picanha (2 kg).</p>
        <p>É um músculo que trabalha bastante, por isso tem fibras longas e visíveis — mas é justamente isso que dá o sabor. Com o preparo correto, fica extremamente macia.</p>

        <h2>Escolhendo a Fraldinha</h2>
        <ul>
            <li><strong>Cor:</strong> vermelho vivo e brilhante</li>
            <li><strong>Gordura:</strong> alguma gordura de cobertura e infiltração entre as fibras</li>
            <li><strong>Espessura:</strong> uniforme, entre 3 e 5 cm</li>
            <li><strong>Membrana:</strong> peça sem membrana prateada é mais fácil de preparar</li>
        </ul>

        <h2>Preparo na Brasa</h2>
        <ul>
            <li><strong>Tempero:</strong> sal grosso é suficiente. Se quiser inovar: sal, pimenta-do-reino e alho granulado</li>
            <li><strong>Grelha alta:</strong> 20-25cm das brasas — calor médio-alto</li>
            <li><strong>Tempo:</strong> 8-10 minutos de cada lado para ponto ao ponto</li>
            <li><strong>Descanso:</strong> 5-8 minutos antes de fatiar — essencial</li>
            <li><strong>Corte:</strong> SEMPRE contra as fibras em fatias finas (0,5-1cm)</li>
        </ul>

        <h2>O Segredo: Fatiar Contra as Fibras</h2>
        <p>A fraldinha tem fibras longas e visíveis. Se você fatiar no sentido das fibras, fica mastigável como borracha. Fatiando <strong>perpendicular às fibras</strong>, cada pedaço fica macio e derrete na boca. Esse é O segredo da fraldinha perfeita.</p>
    `,
    faq: [
      {
        pergunta: 'Fraldinha é um corte bom para churrasco?',
        resposta: 'Excelente. A fraldinha tem sabor intenso, é suculenta e tem ótimo preço. O segredo é não passar do ponto (ao ponto é ideal) e fatiar contra as fibras. É o corte favorito de churrasqueiros profissionais pelo custo-benefício.'
      },
      {
        pergunta: 'Quanto tempo para assar fraldinha?',
        resposta: 'Em grelha com brasa média-alta: 8-10 minutos de cada lado para ponto ao ponto. Total de 16-20 minutos. Não ultrapasse — fraldinha bem passada fica seca e dura. Deixe descansar 5-8 minutos antes de fatiar.'
      }
    ],
    relacionados: [
      { slug: 'churrasco/picanha-perfeita', titulo: 'Picanha Perfeita na Grelha', categoria: 'churrasco' },
      { slug: 'churrasco/quantidade-carne-por-pessoa', titulo: 'Calculadora: Carne por Pessoa', categoria: 'churrasco' },
      { slug: 'racas/nelore', titulo: 'Nelore: A Base da Pecuária Brasileira', categoria: 'raca' }
    ],
    tempoLeitura: 7
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
    slugExtra = `mercado/analise-semanal-${data}`;
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
    slugExtra = `mercado/campo-ao-prato-${data}`;
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
    slugExtra = `mercado/resumo-semanal-${data}`;
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
    fotoKeyword: tipo === 'campo-prato' ? 'premium beef steak butcher shop' : tipo === 'resumo' ? 'livestock market cattle auction' : 'cattle herd pasture sunrise brazil',
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

function calcularIndiceRotativo(items, offset = 0) {
  // Calcula qual item do array usar baseado na semana do ano.
  // offset permite que dois dias da mesma semana (ex: segunda e sexta) caiam
  // em itens diferentes do mesmo array, evitando publicar o mesmo na semana.
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return (weekNumber + offset) % items.length;
}

async function selecionarConteudo() {
  const dia = process.env.DIA_OVERRIDE || getDiaSemana();
  console.log(`Dia da semana: ${dia}`);

  let cotacaoHoje = null;
  let historico = [];

  // Para dias de cotação, buscar dados. Agora só quarta gera artigo de cotação
  // nacional (segunda e sexta passaram a publicar conteúdo local-comercial).
  if (['quarta'].includes(dia)) {
    try {
      cotacaoHoje = await getCotacaoHoje();
      historico = await getHistorico(30);
    } catch (e) {
      console.warn('Aviso: não foi possível buscar cotação do banco —', e.message);
    }
  }

  switch (dia) {
    case 'segunda':
      // Página comercial local (Ribeirão Preto) — intenção de compra
      return LOCAL_COMERCIAL[calcularIndiceRotativo(LOCAL_COMERCIAL)];

    case 'terca': {
      const idx = calcularIndiceRotativo(RACAS);
      const raca = { ...RACAS[idx], categoria: 'raca' };
      return raca;
    }

    case 'quarta':
      return gerarArtigoCotacao('campo-prato', cotacaoHoje, historico);

    case 'quinta': {
      const REGIOES = [
        {
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
        },
        {
          slug: 'regioes/triangulo-mineiro',
          titulo: 'Triângulo Mineiro: A Potência Pecuária de Minas Gerais',
          tituloCurto: 'Triângulo Mineiro',
          categoria: 'regiao',
          fotoKeyword: 'cattle ranch minas gerais brazil pasture',
          metaDescription: 'Triângulo Mineiro: confinamento de ponta, genética Angus e Nelore de elite, e a região que abastece os maiores frigoríficos do Brasil.',
          ogDescription: 'Triângulo Mineiro: confinamento, genética de elite e carne premium que abastece o Brasil.',
          blocoClube: 'O <strong>Empório Família Rodrigues</strong> recebe cortes selecionados de produtores do Triângulo Mineiro. Membros do <strong>Clube Prime</strong> têm acesso antecipado.',
          conteudo: `
              <p>O <strong>Triângulo Mineiro</strong> é uma das regiões pecuárias mais importantes do Brasil. Uberlândia, Uberaba e Araguari formam o triângulo que concentra genética de elite, confinamentos de ponta e frigoríficos exportadores.</p>

              <h2>Capital da Genética Bovina</h2>
              <p>Uberaba é a <strong>capital mundial do zebu</strong>. Sede da ABCZ (Associação Brasileira dos Criadores de Zebu) e da Expozebu, a cidade abriga o maior acervo genético de gado zebuíno do planeta.</p>
              <ul>
                  <li><strong>Expozebu:</strong> maior feira de gado zebuíno do mundo, em maio</li>
                  <li><strong>ABCZ:</strong> registro genealógico de milhões de animais</li>
                  <li><strong>Centrais de inseminação:</strong> genética exportada para mais de 40 países</li>
              </ul>

              <h2>Confinamento de Precisão</h2>
              <p>O Triângulo Mineiro lidera em confinamento tecnificado. Fazendas como a Agropecuária Jacarezinho e a Minerva Foods operam com:</p>
              <ul>
                  <li>Nutrição de precisão com dietas formuladas por zootecnistas</li>
                  <li>Monitoramento por GPS e sensores de consumo</li>
                  <li>Terminação de Angus x Nelore em 90-120 dias</li>
                  <li>Rastreabilidade completa do campo ao prato</li>
              </ul>

              <h2>Qualidade da Carne da Região</h2>
              <p>A combinação de genética de elite com confinamento tecnificado resulta em carcaças com acabamento superior. O Triângulo Mineiro é fornecedor dos principais programas de carne premium do Brasil, incluindo marcas como Friboi Reserva e Angus Certified.</p>
          `,
          faq: [
            {
              pergunta: 'Por que Uberaba é importante para a pecuária?',
              resposta: 'Uberaba é a capital mundial do zebu, sede da ABCZ e da Expozebu. A cidade concentra o maior acervo genético de gado zebuíno do mundo e exporta genética bovina para mais de 40 países.'
            },
            {
              pergunta: 'O que é confinamento de precisão?',
              resposta: 'É um sistema de terminação bovina que usa tecnologia para otimizar a alimentação e o ganho de peso. Inclui dietas formuladas individualmente, monitoramento por sensores e rastreabilidade completa, resultando em carne com qualidade controlada.'
            }
          ],
          relacionados: [
            { slug: 'regioes/alta-mogiana', titulo: 'Alta Mogiana: Carne Premium de SP', categoria: 'regiao' },
            { slug: 'racas/nelore', titulo: 'Nelore: A Base da Pecuária Brasileira', categoria: 'raca' },
            { slug: 'cotacao-arroba-boi-gordo-hoje', titulo: 'Cotação da Arroba Hoje', categoria: 'cotacao' }
          ],
          tempoLeitura: 7
        },
        {
          slug: 'regioes/pantanal',
          titulo: 'Pantanal: A Carne Orgânica das Planícies Alagáveis',
          tituloCurto: 'Pantanal',
          categoria: 'regiao',
          fotoKeyword: 'pantanal cattle wetlands brazil',
          metaDescription: 'Pecuária do Pantanal: boi criado a pasto em planícies alagáveis, carne orgânica natural, sustentabilidade e sabor único da maior planície úmida do mundo.',
          ogDescription: 'Pantanal: boi a pasto natural, carne com sabor único e sustentabilidade real.',
          blocoClube: 'Cortes especiais de produtores sustentáveis do Pantanal chegam ao <strong>Empório Família Rodrigues</strong> em lotes limitados. Membros do <strong>Clube Prime</strong> são avisados primeiro.',
          conteudo: `
              <p>O <strong>Pantanal</strong> é a maior planície alagável do mundo — e também um dos berços mais autênticos da pecuária brasileira. Aqui, o boi é criado em <strong>liberdade total</strong>, pastando em campos naturais que se renovam com as cheias sazonais. É a definição de carne sustentável.</p>

              <h2>Pecuária Pantaneira: Tradição de 250 Anos</h2>
              <p>A pecuária no Pantanal existe desde o século XVIII. O gado foi uma das primeiras atividades econômicas da região e, ao contrário de outras áreas, a criação aqui <strong>preserva o bioma</strong> — as fazendas são as guardiãs do Pantanal.</p>
              <ul>
                  <li><strong>Criação extensiva:</strong> 1 a 3 cabeças por hectare (baixíssima lotação)</li>
                  <li><strong>Pastagem natural:</strong> sem desmatamento, sem plantio de capim exótico</li>
                  <li><strong>Sem insumos químicos:</strong> muitos rebanhos são certificados orgânicos</li>
                  <li><strong>Manejo tradicional:</strong> comitivas de boiadeiros conduzem o gado entre pastagens</li>
              </ul>

              <h2>Sabor Único da Carne Pantaneira</h2>
              <p>O boi pantaneiro se alimenta de gramíneas nativas diversificadas — não de uma monocultura de capim. Essa dieta variada, combinada com o exercício de caminhar entre pastagens, produz uma carne com:</p>
              <ul>
                  <li><strong>Sabor pronunciado:</strong> mais intenso que boi de confinamento</li>
                  <li><strong>Gordura amarelada:</strong> rica em betacaroteno e ômega-3</li>
                  <li><strong>Textura firme:</strong> músculo desenvolvido pelo exercício natural</li>
                  <li><strong>Menor teor de gordura total:</strong> carne naturalmente mais magra</li>
              </ul>

              <h2>Certificação e Sustentabilidade</h2>
              <p>Diversas fazendas do Pantanal possuem certificação orgânica ou sustentável. O selo "Boi Pantaneiro" garante que o animal foi criado em sistema extensivo, em pastagem nativa, sem hormônios e sem antibióticos promotores de crescimento.</p>
          `,
          faq: [
            {
              pergunta: 'A carne do Pantanal é orgânica?',
              resposta: 'Muitos rebanhos do Pantanal são certificados orgânicos ou em processo de certificação. Mesmo sem o selo, a criação extensiva em pastagem nativa, sem insumos químicos, já é naturalmente muito próxima do padrão orgânico.'
            },
            {
              pergunta: 'Por que a gordura do boi pantaneiro é amarela?',
              resposta: 'A gordura amarelada é causada pelo betacaroteno presente nas gramíneas nativas que o boi come. É um indicador de boi criado a pasto (não confinado). Essa gordura é mais rica em ômega-3 e vitaminas lipossolúveis.'
            }
          ],
          relacionados: [
            { slug: 'regioes/alta-mogiana', titulo: 'Alta Mogiana: Carne Premium de SP', categoria: 'regiao' },
            { slug: 'guia/carne-de-pasto-vs-confinamento', titulo: 'Pasto vs Confinamento', categoria: 'guia' },
            { slug: 'racas/nelore', titulo: 'Nelore: A Base da Pecuária', categoria: 'raca' }
          ],
          tempoLeitura: 8
        }
      ];
      const idx = calcularIndiceRotativo(REGIOES);
      return REGIOES[idx];
    }

    case 'sexta':
      // Segunda página comercial local da semana (offset 2 → item diferente do de segunda)
      return LOCAL_COMERCIAL[calcularIndiceRotativo(LOCAL_COMERCIAL, 2)];

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

  // Nunca chega aqui, mas TypeScript ficaria feliz
  return null;
}

// Wrapper que injeta painel de mercado no resultado
async function selecionarConteudoComPainel() {
  // Buscar resumo de mercado
  let resumoMercado = {};
  try { resumoMercado = await getResumoMercado(); } catch(e) { console.warn('Mercado indisponível:', e.message); }

  const dados = await selecionarConteudo();
  const dia = process.env.DIA_OVERRIDE || getDiaSemana();
  const diaCotacao = ['quarta', 'quinta'].includes(dia);
  // Páginas comerciais locais não mostram o painel agro (dólar/petróleo/soja) —
  // é irrelevante para quem busca onde comprar carne.
  dados.painelMercado = dados.categoria === 'local' ? '' : gerarPainelMercado(resumoMercado, diaCotacao);
  return dados;
}

// --- Main ---

const dados = await selecionarConteudoComPainel();
await publicar(dados);
