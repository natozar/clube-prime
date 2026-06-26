/**
 * CLUBE PRIME SEO — Páginas comerciais locais (Ribeirão Preto)
 *
 * Conteúdo evergreen com intenção de COMPRA + termo LOCAL ("Ribeirão Preto").
 * É o segmento que um açougue local pode efetivamente rankear e que converte
 * em venda — ao contrário das keywords nacionais de cotação (CEPEA/Canal Rural),
 * dominadas por portais com décadas de autoridade.
 *
 * Importado por conteudo-diario.js (publicação rotativa segunda/sexta) e por
 * gerar-locais.js (geração imediata das páginas).
 */

// ── Schema LocalBusiness compartilhado pelas páginas comerciais locais ──
// IMPORTANTE: preencher telefone, endereço de rua, CEP, coordenadas geo e
// horário de funcionamento reais para elegibilidade total a rich results /
// pacote local do Google. Hoje só os campos verificáveis estão preenchidos.
export const LOCAL_BUSINESS_SCHEMA = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://carnesrodrigues.com.br/#business",
        "name": "Empório Família Rodrigues — Carnes Rodrigues",
        "alternateName": "Clube Prime",
        "url": "https://carnesrodrigues.com.br",
        "image": "https://carnesrodrigues.com.br/og-default.png",
        "description": "Empório de carnes nobres em Ribeirão Preto: cortes premium Angus, Hereford e cruzamentos selecionados da Alta Mogiana. Pedidos pelo WhatsApp e programa de fidelidade Clube Prime.",
        "priceRange": "$$",
        "areaServed": { "@type": "City", "name": "Ribeirão Preto" },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Ribeirão Preto",
            "addressRegion": "SP",
            "addressCountry": "BR"
        },
        "knowsAbout": ["picanha","costela","churrasco","carne Angus","cortes premium","carne para churrasco"]
    }
    </script>`;

// ── Páginas comerciais locais (intenção de compra + "Ribeirão Preto") ──
// São evergreen (slug sem data): acumulam autoridade. Publicadas segunda e
// sexta em rotação, substituindo 2 dos 3 dias antigos de cotação nacional.
export const LOCAL_COMERCIAL = [
  {
    slug: 'acougue-ribeirao-preto',
    titulo: 'Açougue em Ribeirão Preto: Onde Comprar Carne Premium com Procedência',
    tituloCurto: 'Açougue em Ribeirão Preto',
    categoria: 'local',
    fotoKeyword: 'butcher shop premium beef cuts',
    metaDescription: 'Açougue de carnes nobres em Ribeirão Preto: cortes Angus e Hereford da Alta Mogiana, com procedência garantida. Peça pelo WhatsApp e ganhe pontos no Clube Prime.',
    ogDescription: 'Carne premium com procedência em Ribeirão Preto — Empório Família Rodrigues.',
    blocoClube: 'No <strong>Empório Família Rodrigues</strong>, cada compra rende pontos no <strong>Clube Prime</strong>. Peça pelo WhatsApp, retire na loja e acumule benefícios a cada corte.',
    conteudo: `
        <p>Procurando um <strong>açougue em Ribeirão Preto</strong> que vá além do feijão com arroz? O <strong>Empório de Carnes Família Rodrigues</strong> é uma casa de carnes especializada em cortes premium, com seleção de raça, procedência e maturação — não apenas peso na balança.</p>

        <h2>Por Que Escolher um Açougue Especializado</h2>
        <p>Supermercado vende carne como commodity: embalada, anônima, sem história. Um açougue especializado entrega o oposto — você sabe a raça, a origem e o corte certo para cada preparo.</p>
        <ul>
            <li><strong>Procedência rastreável:</strong> você sabe de qual região e raça veio a peça</li>
            <li><strong>Corte sob medida:</strong> espessura da picanha, limpeza do contrafilé, costela no tamanho que você quer</li>
            <li><strong>Seleção de qualidade:</strong> marmoreio, cor e acabamento conferidos peça a peça</li>
            <li><strong>Atendimento que orienta:</strong> qual corte para a panela, qual para a brasa, quanto comprar</li>
        </ul>

        <h2>Os Cortes que Você Encontra</h2>
        <p>Do churrasco de domingo ao jantar da semana, a casa trabalha a cartela completa:</p>
        <ul>
            <li><strong>Nobres para a brasa:</strong> picanha, fraldinha, maminha, ancho, chorizo</li>
            <li><strong>Costela e cortes longos:</strong> costela ripa, costela janela, ossobuco</li>
            <li><strong>Para o dia a dia:</strong> patinho, coxão mole, acém, músculo</li>
            <li><strong>Aves e suínos:</strong> frango temperado, pernil, linguiças artesanais</li>
        </ul>

        <h2>A Carne da Alta Mogiana</h2>
        <p>Ribeirão Preto é o coração da <strong>Alta Mogiana</strong>, uma das regiões pecuárias mais nobres de São Paulo. Aqui se produz cruzamento <strong>Angus x Nelore</strong> de altíssimo nível, com marmoreio e maciez de carne premium. Comprar carne em Ribeirão Preto é estar na origem — e o Empório trabalha direto com produtores selecionados da região.</p>

        <h2>Como Comprar: WhatsApp e Clube Prime</h2>
        <p>O pedido é simples: você escolhe os cortes pelo <strong>WhatsApp</strong>, combina retirada ou entrega, e ainda acumula pontos no <strong>Clube Prime</strong> — o programa de fidelidade que dá desconto, acesso antecipado a cortes especiais e recompensa quem indica amigos. Quanto mais você compra, mais vantagens recebe.</p>
    `,
    faq: [
      { pergunta: 'Onde comprar carne premium em Ribeirão Preto?', resposta: 'O Empório Família Rodrigues é um açougue especializado em cortes premium em Ribeirão Preto, com seleção de raça (Angus, Hereford e cruzamentos da Alta Mogiana), procedência rastreável e pedido pelo WhatsApp. Cada compra acumula pontos no Clube Prime.' },
      { pergunta: 'Qual a diferença de um açougue especializado para o supermercado?', resposta: 'No açougue especializado você sabe a raça e a procedência da carne, recebe o corte sob medida (espessura, limpeza, tamanho) e tem orientação sobre o melhor corte para cada preparo. No supermercado a carne é vendida como commodity, sem essas informações.' },
      { pergunta: 'O Empório entrega em Ribeirão Preto?', resposta: 'Sim. Você faz o pedido pelo WhatsApp e combina retirada na loja ou entrega. Consulte a área de entrega e os horários diretamente pelo WhatsApp.' }
    ],
    relacionados: [
      { slug: 'comprar-picanha-ribeirao-preto', titulo: 'Onde Comprar Picanha em Ribeirão Preto', categoria: 'local' },
      { slug: 'carne-para-churrasco-ribeirao-preto', titulo: 'Carne para Churrasco em Ribeirão Preto', categoria: 'local' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' }
    ],
    schemaExtra: LOCAL_BUSINESS_SCHEMA,
    pushTitulo: 'Carne premium em Ribeirão Preto',
    pushBody: 'Cortes Angus da Alta Mogiana com procedência — peça pelo WhatsApp',
    tempoLeitura: 6
  },
  {
    slug: 'comprar-picanha-ribeirao-preto',
    titulo: 'Onde Comprar Picanha em Ribeirão Preto: Guia da Picanha Premium',
    tituloCurto: 'Picanha em Ribeirão Preto',
    categoria: 'local',
    fotoKeyword: 'picanha raw beef steak',
    metaDescription: 'Onde comprar picanha premium em Ribeirão Preto: picanha Angus com gordura na medida, cortada sob pedido. Encomende pelo WhatsApp no Empório Família Rodrigues.',
    ogDescription: 'A picanha certa para o seu churrasco — premium, em Ribeirão Preto.',
    blocoClube: 'Picanha selecionada e pontos a cada compra: é o <strong>Clube Prime</strong> do <strong>Empório Família Rodrigues</strong>. Encomende a sua pelo WhatsApp.',
    conteudo: `
        <p>A picanha é a rainha do churrasco brasileiro — mas nem toda picanha é igual. Se você procura <strong>onde comprar picanha em Ribeirão Preto</strong>, este guia mostra o que separa uma picanha premium de uma peça qualquer, e como encomendar a sua.</p>

        <h2>O Que Faz uma Picanha Premium</h2>
        <p>Picanha boa é questão de origem e de corte. Três coisas para olhar:</p>
        <ul>
            <li><strong>Capa de gordura uniforme:</strong> de 1 a 1,5 cm, branca e firme — é ela que dá sabor na brasa</li>
            <li><strong>Peso certo:</strong> a picanha verdadeira tem entre 1 e 1,5 kg; acima disso, provavelmente vem com parte do coxão junto</li>
            <li><strong>Marmoreio:</strong> as finas vetas de gordura dentro do músculo, marca da carne Angus e dos bons cruzamentos</li>
        </ul>

        <h2>Picanha Angus x Picanha Comum</h2>
        <p>A picanha <strong>Angus</strong> (ou de cruzamento Angus x Nelore) tem mais marmoreio, o que se traduz em maciez e sabor superiores. A picanha comum, de Nelore puro a pasto, é mais magra e firme — boa, mas diferente. No Empório você escolhe o padrão que combina com o seu churrasco, com a procedência da Alta Mogiana.</p>

        <h2>Quanto Comprar e Como Pedir</h2>
        <p>Para churrasco, calcule cerca de <strong>400 g de carne por adulto</strong> considerando outros cortes na mesa. Uma picanha de 1,2 kg serve bem 3 a 4 pessoas. Você encomenda pelo <strong>WhatsApp</strong>, pede a espessura dos bifes (a clássica é de 3 a 4 dedos) e combina retirada ou entrega em Ribeirão Preto.</p>

        <h2>Picanha Inteira ou em Bifes</h2>
        <p>Inteira, você assa na brasa em peça única ou no espeto — rende crosta dourada por fora e suculência por dentro. Em bifes grossos, é prática e rápida na grelha. A casa corta do jeito que você preferir, na hora.</p>
    `,
    faq: [
      { pergunta: 'Onde comprar picanha premium em Ribeirão Preto?', resposta: 'No Empório Família Rodrigues você encontra picanha premium (Angus e cruzamentos da Alta Mogiana) cortada sob pedido, com a capa de gordura na medida certa. O pedido é feito pelo WhatsApp, com retirada ou entrega em Ribeirão Preto.' },
      { pergunta: 'Como saber se a picanha é de boa qualidade?', resposta: 'Olhe três pontos: capa de gordura uniforme de 1 a 1,5 cm (branca e firme), peso entre 1 e 1,5 kg (acima disso costuma vir com coxão junto) e marmoreio — as vetas finas de gordura dentro do músculo, típicas de carne Angus.' },
      { pergunta: 'Quanto de picanha comprar por pessoa?', resposta: 'Calcule cerca de 400 g de carne por adulto quando há outros cortes no churrasco. Uma picanha de 1,2 kg serve bem de 3 a 4 pessoas.' }
    ],
    relacionados: [
      { slug: 'acougue-ribeirao-preto', titulo: 'Açougue Premium em Ribeirão Preto', categoria: 'local' },
      { slug: 'churrasco/picanha-perfeita', titulo: 'Picanha Perfeita na Grelha', categoria: 'churrasco' },
      { slug: 'racas/angus', titulo: 'Angus: A Raça do Marmoreio Premium', categoria: 'raca' }
    ],
    schemaExtra: LOCAL_BUSINESS_SCHEMA,
    pushTitulo: 'Picanha premium em Ribeirão Preto',
    pushBody: 'Angus com a gordura na medida, cortada sob pedido — encomende pelo WhatsApp',
    tempoLeitura: 6
  },
  {
    slug: 'carne-para-churrasco-ribeirao-preto',
    titulo: 'Carne para Churrasco em Ribeirão Preto: Cortes, Kit e Quantidade',
    tituloCurto: 'Carne para Churrasco em RP',
    categoria: 'local',
    fotoKeyword: 'brazilian barbecue picanha grill',
    metaDescription: 'Carne para churrasco em Ribeirão Preto: monte o kit ideal com picanha, fraldinha e costela, calcule a quantidade e encomende pelo WhatsApp no Empório Família Rodrigues.',
    ogDescription: 'Monte o churrasco perfeito com carne premium de Ribeirão Preto.',
    blocoClube: 'Monte seu kit churrasco no <strong>Empório Família Rodrigues</strong> e acumule pontos no <strong>Clube Prime</strong>. Peça pelo WhatsApp e receba os cortes frescos.',
    conteudo: `
        <p>Vai fazer churrasco e quer acertar na carne? Aqui está o guia de <strong>carne para churrasco em Ribeirão Preto</strong>: quais cortes escolher, quanto comprar e como encomendar tudo de uma vez.</p>

        <h2>Montando o Churrasco Ideal</h2>
        <p>Um bom churrasco equilibra cortes nobres, cortes saborosos e acompanhamentos de brasa. A regra de ouro é variar texturas — algo macio, algo com gordura, algo para os que gostam de carne mais firme.</p>

        <h2>Os Cortes Essenciais</h2>
        <ul>
            <li><strong>Picanha:</strong> a estrela, com a capa de gordura que derrete na brasa</li>
            <li><strong>Fraldinha:</strong> sabor intenso, macia, ótimo custo-benefício</li>
            <li><strong>Costela:</strong> para quem tem tempo — cozimento longo que desfia no garfo</li>
            <li><strong>Linguiça artesanal:</strong> abre o churrasco enquanto a carne grande assa</li>
            <li><strong>Ancho ou chorizo:</strong> para impressionar, marmoreio de sobra</li>
        </ul>

        <h2>Quanto Comprar por Pessoa</h2>
        <p>A conta prática para não faltar nem sobrar demais:</p>
        <ul>
            <li><strong>400 g de carne por adulto</strong> quando há acompanhamentos (pão de alho, farofa, salada)</li>
            <li><strong>500 g a 600 g por adulto</strong> se for basicamente carne</li>
            <li><strong>200 g por criança</strong></li>
            <li>Some <strong>1 a 2 linguiças</strong> por pessoa à parte</li>
        </ul>
        <p>Exemplo: 10 adultos e 4 crianças com acompanhamentos = cerca de 4,8 kg de carne + linguiça.</p>

        <h2>Onde Encomendar em Ribeirão Preto</h2>
        <p>No <strong>Empório Família Rodrigues</strong> você monta o kit completo pelo <strong>WhatsApp</strong>: escolhe os cortes, a quantidade e a espessura, combina retirada ou entrega, e ainda acumula pontos no Clube Prime. Carne premium da Alta Mogiana, fresca, cortada na hora.</p>
    `,
    faq: [
      { pergunta: 'Quais cortes comprar para um churrasco?', resposta: 'Varie texturas: picanha (nobre, com gordura), fraldinha (saborosa e macia), costela (para cozimento longo), linguiça artesanal (para abrir) e um corte com marmoreio como ancho ou chorizo. Esse mix agrada todos os gostos.' },
      { pergunta: 'Quanta carne comprar por pessoa no churrasco?', resposta: 'Cerca de 400 g por adulto com acompanhamentos, ou 500 a 600 g se for só carne. Crianças, 200 g. Some 1 a 2 linguiças por pessoa. Para 10 adultos e 4 crianças com acompanhamentos, cerca de 4,8 kg de carne.' },
      { pergunta: 'Onde comprar carne para churrasco em Ribeirão Preto?', resposta: 'No Empório Família Rodrigues você monta o kit churrasco completo pelo WhatsApp, com cortes premium da Alta Mogiana cortados na hora e entrega ou retirada em Ribeirão Preto.' }
    ],
    relacionados: [
      { slug: 'comprar-picanha-ribeirao-preto', titulo: 'Onde Comprar Picanha em Ribeirão Preto', categoria: 'local' },
      { slug: 'churrasco/quantidade-carne-por-pessoa', titulo: 'Calculadora: Carne por Pessoa', categoria: 'churrasco' },
      { slug: 'acougue-ribeirao-preto', titulo: 'Açougue Premium em Ribeirão Preto', categoria: 'local' }
    ],
    schemaExtra: LOCAL_BUSINESS_SCHEMA,
    pushTitulo: 'Carne para churrasco em RP',
    pushBody: 'Monte seu kit com picanha, fraldinha e costela — peça pelo WhatsApp',
    tempoLeitura: 6
  },
  {
    slug: 'delivery-carne-ribeirao-preto',
    titulo: 'Delivery de Carne em Ribeirão Preto: Peça Cortes Frescos pelo WhatsApp',
    tituloCurto: 'Delivery de Carne em RP',
    categoria: 'local',
    fotoKeyword: 'fresh beef cuts butcher counter',
    metaDescription: 'Delivery de carne em Ribeirão Preto: cortes premium frescos, da picanha à costela, pedidos pelo WhatsApp no Empório Família Rodrigues. Pontos no Clube Prime a cada compra.',
    ogDescription: 'Carne premium fresca entregue em Ribeirão Preto — peça pelo WhatsApp.',
    blocoClube: 'Peça pelo WhatsApp, receba em casa e acumule pontos: o <strong>Clube Prime</strong> do <strong>Empório Família Rodrigues</strong> recompensa cada pedido.',
    conteudo: `
        <p>Quer carne boa sem sair de casa? O <strong>delivery de carne em Ribeirão Preto</strong> do Empório Família Rodrigues entrega cortes premium frescos, escolhidos por você pelo WhatsApp — com a mesma seleção de raça e procedência da loja.</p>

        <h2>Como Funciona o Pedido</h2>
        <p>Sem app complicado, sem cadastro chato. O pedido é direto:</p>
        <ul>
            <li><strong>1.</strong> Você manda mensagem no WhatsApp com os cortes e quantidades</li>
            <li><strong>2.</strong> A casa confirma disponibilidade, peso e valor</li>
            <li><strong>3.</strong> Você escolhe entrega ou retirada e a forma de pagamento</li>
            <li><strong>4.</strong> A carne sai cortada na hora, fresca, embalada com cuidado</li>
        </ul>

        <h2>Cortes Disponíveis</h2>
        <p>Do churrasco ao dia a dia: picanha, fraldinha, ancho, costela, contrafilé, cortes para panela (patinho, coxão mole, músculo), frango temperado e linguiças artesanais. Quer algo específico? É só perguntar pelo WhatsApp.</p>

        <h2>Frescor e Procedência</h2>
        <p>A diferença do delivery especializado está na origem. A carne vem da <strong>Alta Mogiana</strong>, com seleção Angus e cruzamentos premium, e é cortada no momento do pedido — não fica dias na bandeja. Você recebe a peça no ponto e na espessura que pediu.</p>

        <h2>Clube Prime: Vantagens a Cada Pedido</h2>
        <p>Todo pedido de delivery acumula pontos no <strong>Clube Prime</strong>. São descontos, acesso antecipado a cortes especiais e um programa de indicação que recompensa você por trazer amigos. Comprar carne em Ribeirão Preto vira hábito que vale a pena.</p>
    `,
    faq: [
      { pergunta: 'Como pedir delivery de carne em Ribeirão Preto?', resposta: 'No Empório Família Rodrigues você pede pelo WhatsApp: manda os cortes e quantidades, a casa confirma peso e valor, você escolhe entrega ou retirada e a forma de pagamento. A carne é cortada na hora e entregue fresca.' },
      { pergunta: 'A carne do delivery é fresca?', resposta: 'Sim. A carne vem da Alta Mogiana com seleção de raça e é cortada no momento do pedido — não fica dias na bandeja. Você recebe a peça no ponto e na espessura que pediu.' },
      { pergunta: 'O delivery do Empório acumula pontos?', resposta: 'Sim. Todo pedido, inclusive delivery, acumula pontos no Clube Prime, que dá descontos, acesso antecipado a cortes especiais e recompensa por indicação.' }
    ],
    relacionados: [
      { slug: 'acougue-ribeirao-preto', titulo: 'Açougue Premium em Ribeirão Preto', categoria: 'local' },
      { slug: 'carne-para-churrasco-ribeirao-preto', titulo: 'Carne para Churrasco em Ribeirão Preto', categoria: 'local' },
      { slug: 'comprar-picanha-ribeirao-preto', titulo: 'Onde Comprar Picanha em Ribeirão Preto', categoria: 'local' }
    ],
    schemaExtra: LOCAL_BUSINESS_SCHEMA,
    pushTitulo: 'Delivery de carne em Ribeirão Preto',
    pushBody: 'Cortes premium frescos entregues em casa — peça pelo WhatsApp',
    tempoLeitura: 6
  }
];
