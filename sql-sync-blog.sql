-- Sync dos 9 artigos do disco → tabela seo_artigos
-- Cole no Supabase Dashboard → SQL Editor → Run
-- Usa upsert (ON CONFLICT) para não duplicar artigos já existentes.

INSERT INTO seo_artigos (slug, titulo, categoria, meta_description, og_image_url, conteudo_resumo, publicado_em, atualizado_em, ativo)
VALUES
  (
    'churrasco/quantidade-carne-por-pessoa',
    'Quanta Carne por Pessoa no Churrasco? Guia Definitivo',
    'churrasco',
    'Tabela de quantidade de carne por pessoa no churrasco brasileiro. Picanha, costela, frango, linguiça — quanto comprar para cada tipo de evento.',
    'https://carnesrodrigues.com.br/seo/assets/images/photo-1765036741158-5a1698974257.jpg',
    'Guia prático: quanta carne comprar por pessoa no seu churrasco, sem sobrar nem faltar.',
    NOW(), NOW(), true
  ),
  (
    'churrasco/receita-costela-fogo-de-chao',
    'Costela no Fogo de Chão: Receita Tradicional Gaúcha',
    'churrasco',
    'A receita autêntica da costela no fogo de chão gaúcho. Passo a passo, tempo de cocção, tempero e dicas de churrasqueiro experiente.',
    'https://carnesrodrigues.com.br/seo/assets/images/premium_photo-1664297875423-bb2de49cb277.jpg',
    'Costela no fogo de chão: receita tradicional gaúcha, com tempero, tempo e técnica.',
    NOW(), NOW(), true
  ),
  (
    'churrasco/tradicao-churrasco-familia',
    'A Tradição do Churrasco em Família: Por Que a Carne Une Gerações',
    'churrasco',
    'O churrasco como tradição familiar brasileira: memórias, receitas de avô, dicas para reunir a família ao redor da churrasqueira.',
    'https://carnesrodrigues.com.br/seo/assets/images/premium_photo-1723490795581-1828d3b5d817.jpg',
    'Churrasco é mais que carne — é família, tradição e memória afetiva.',
    NOW(), NOW(), true
  ),
  (
    'cotacao-arroba-boi-gordo-hoje',
    'Cotação da Arroba do Boi Gordo Hoje — CEPEA/Esalq',
    'cotacao',
    'Cotação da arroba do boi gordo atualizada diariamente segundo o indicador CEPEA/Esalq. Acompanhe o preço e a variação no mercado pecuário.',
    'https://carnesrodrigues.com.br/seo/assets/images/photo-1554145707-80e42bdaaa4a.jpg',
    'Acompanhe a cotação diária da arroba do boi gordo e entenda o que move o mercado.',
    NOW(), NOW(), true
  ),
  (
    'guia/carne-de-pasto-vs-confinamento',
    'Carne de Pasto vs Confinamento: Qual É Melhor?',
    'guia',
    'Diferenças entre carne de boi a pasto e de confinamento: sabor, textura, valor nutricional, sustentabilidade e preço. Guia completo do consumidor.',
    'https://carnesrodrigues.com.br/seo/assets/images/photo-1760315200236-c4533439617a.jpg',
    'Pasto ou confinamento? Diferenças de sabor, nutrição e preço — um guia para o consumidor.',
    NOW(), NOW(), true
  ),
  (
    'mercado/panorama-semanal',
    'Panorama do Mercado Agro: Como Dólar, Milho e Petróleo Afetam o Preço da Carne',
    'mercado',
    'Análise semanal do mercado agro: como dólar, petróleo, milho e soja impactam a cotação do boi gordo e o preço da carne no açougue.',
    'https://carnesrodrigues.com.br/seo/assets/images/premium_photo-1677850457238-37da154883bc.jpg',
    'Análise semanal do agro: indicadores que movem o preço da carne.',
    NOW(), NOW(), true
  ),
  (
    'racas/angus',
    'Raça Angus: A Origem da Carne Premium',
    'raca',
    'Angus: características, origem escocesa, marmoreio, qualidade da carne e por que é considerada a raça premium do mundo.',
    'https://carnesrodrigues.com.br/seo/assets/images/photo-1572982205939-6ea96504ee4a.jpg',
    'Angus — a raça que define o padrão premium da carne no mundo.',
    NOW(), NOW(), true
  ),
  (
    'racas/hereford',
    'Raça Hereford: Tradição Britânica no Pasto Brasileiro',
    'raca',
    'Hereford: a raça britânica de bovinos famosa pela rusticidade, qualidade da carne e adaptação ao clima brasileiro.',
    'https://carnesrodrigues.com.br/seo/assets/images/premium_photo-1668453206347-922efbff8d54.jpg',
    'Hereford — tradição britânica, rusticidade e qualidade no pasto brasileiro.',
    NOW(), NOW(), true
  ),
  (
    'regioes/alta-mogiana',
    'Alta Mogiana: A Região do Boi de Pasto Premium',
    'regiao',
    'Alta Mogiana, em São Paulo: a região famosa pelo boi de pasto premium, terroir, clima ideal e tradição pecuária centenária.',
    'https://carnesrodrigues.com.br/seo/assets/images/photo-1560749610-c4b45c164e08.jpg',
    'Alta Mogiana — terroir, clima e tradição que produzem o boi premium do Sudeste.',
    NOW(), NOW(), true
  )
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  meta_description = EXCLUDED.meta_description,
  og_image_url = EXCLUDED.og_image_url,
  conteudo_resumo = EXCLUDED.conteudo_resumo,
  atualizado_em = NOW(),
  ativo = true;

-- Verificar resultado
SELECT slug, titulo, ativo, publicado_em FROM seo_artigos ORDER BY slug;
