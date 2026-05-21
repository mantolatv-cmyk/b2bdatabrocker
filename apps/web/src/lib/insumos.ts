export interface Insumo {
  id: string;
  name: string;
  emoji: string;
  category: string;
  ncm: string;
  basePrice: number;
  keywords: string[];
}

export type InsumoCategory = {
  id: string;
  name: string;
  emoji: string;
};

export const CATEGORIES: InsumoCategory[] = [
  { id: "mercearia", name: "Mercearia", emoji: "🏪" },
  { id: "laticinios", name: "Laticínios", emoji: "🥛" },
  { id: "acougue", name: "Açougue & Frios", emoji: "🥩" },
  { id: "bebidas", name: "Bebidas", emoji: "🥤" },
  { id: "limpeza", name: "Limpeza", emoji: "🧹" },
  { id: "higiene", name: "Higiene Pessoal", emoji: "🧴" },
  { id: "hortifruti", name: "Hortifrúti", emoji: "🥦" },
  { id: "congelados", name: "Congelados", emoji: "❄️" },
  { id: "utilidades", name: "Utilidades", emoji: "🔋" },
];

const INSUMOS_DATA: Insumo[] = [
  // ── MERCEARIA ──
  { id: "arroz_tipo1",       name: "Arroz Tipo 1 (5kg)",           emoji: "🌾", category: "mercearia", ncm: "1006.30.21", basePrice: 2520, keywords: ["arroz", "arroz tipo 1", "arroz branco"] },
  { id: "arroz_parboilizado", name: "Arroz Parboilizado (5kg)",     emoji: "🌾", category: "mercearia", ncm: "1006.30.11", basePrice: 2680, keywords: ["arroz parboilizado", "arroz"] },
  { id: "arroz_integral",    name: "Arroz Integral (5kg)",          emoji: "🌾", category: "mercearia", ncm: "1006.30.29", basePrice: 2890, keywords: ["arroz integral", "arroz"] },
  { id: "feijao_carioca",    name: "Feijão Carioca (1kg)",         emoji: "🫘", category: "mercearia", ncm: "0713.33.19", basePrice: 890,  keywords: ["feijao", "feijão", "carioca"] },
  { id: "feijao_preto",      name: "Feijão Preto (1kg)",           emoji: "🫘", category: "mercearia", ncm: "0713.33.29", basePrice: 920,  keywords: ["feijao preto", "feijão preto"] },
  { id: "feijao_fradinho",   name: "Feijão Fradinho (1kg)",        emoji: "🫘", category: "mercearia", ncm: "0713.33.99", basePrice: 850,  keywords: ["feijao fradinho", "feijão fradinho"] },
  { id: "lentilha",          name: "Lentilha (500g)",              emoji: "🟤", category: "mercearia", ncm: "0713.40.00", basePrice: 780,  keywords: ["lentilha"] },
  { id: "grao_de_bico",      name: "Grão-de-bico (500g)",          emoji: "🟤", category: "mercearia", ncm: "0713.20.00", basePrice: 950,  keywords: ["grao de bico", "grão de bico"] },
  { id: "ervilha_seca",      name: "Ervilha Seca (500g)",           emoji: "🟢", category: "mercearia", ncm: "0713.10.00", basePrice: 720,  keywords: ["ervilha", "ervilha seca"] },
  { id: "macarrao_espaguete",name: "Macarrão Espaguete (500g)",    emoji: "🍝", category: "mercearia", ncm: "1902.19.00", basePrice: 580,  keywords: ["macarrao", "macarrão", "espaguete"] },
  { id: "macarrao_penne",    name: "Macarrão Penne (500g)",        emoji: "🍝", category: "mercearia", ncm: "1902.19.00", basePrice: 560,  keywords: ["macarrao", "macarrão", "penne"] },
  { id: "macarrao_parafuso", name: "Macarrão Parafuso (500g)",     emoji: "🍝", category: "mercearia", ncm: "1902.19.00", basePrice: 570,  keywords: ["macarrao", "macarrão", "parafuso"] },
  { id: "macarrao_lasanha",  name: "Macarrão Lasanha (500g)",      emoji: "🍝", category: "mercearia", ncm: "1902.19.00", basePrice: 620,  keywords: ["macarrao", "macarrão", "lasanha"] },
  { id: "farinha_trigo",     name: "Farinha de Trigo (1kg)",        emoji: "🌾", category: "mercearia", ncm: "1101.00.10", basePrice: 490,  keywords: ["farinha", "trigo", "farinha de trigo"] },
  { id: "farinha_mandioca",  name: "Farinha de Mandioca (1kg)",     emoji: "🌾", category: "mercearia", ncm: "1106.20.00", basePrice: 750,  keywords: ["farinha de mandioca", "farinha"] },
  { id: "fuba",              name: "Fubá (500g)",                  emoji: "🌽", category: "mercearia", ncm: "1103.13.00", basePrice: 380,  keywords: ["fuba", "fubá"] },
  { id: "amido_milho",       name: "Amido de Milho (500g)",        emoji: "🌽", category: "mercearia", ncm: "1108.12.00", basePrice: 450,  keywords: ["amido de milho", "maizena"] },
  { id: "acucar_refinado",   name: "Açúcar Refinado (1kg)",        emoji: "🍬", category: "mercearia", ncm: "1701.99.00", basePrice: 410,  keywords: ["acucar", "açúcar", "refinado"] },
  { id: "acucar_mascavo",    name: "Açúcar Mascavo (500g)",        emoji: "🟤", category: "mercearia", ncm: "1701.14.00", basePrice: 890,  keywords: ["acucar mascavo", "açúcar mascavo"] },
  { id: "acucar_cristal",    name: "Açúcar Cristal (1kg)",         emoji: "🍬", category: "mercearia", ncm: "1701.99.00", basePrice: 390,  keywords: ["acucar cristal", "açúcar cristal"] },
  { id: "sal_refinado",      name: "Sal Refinado (1kg)",           emoji: "🧂", category: "mercearia", ncm: "2501.00.19", basePrice: 250,  keywords: ["sal"] },
  { id: "sal_grosso",        name: "Sal Grosso (1kg)",             emoji: "🧂", category: "mercearia", ncm: "2501.00.11", basePrice: 320,  keywords: ["sal grosso"] },
  { id: "cafe_moido",        name: "Café Moído (500g)",            emoji: "☕", category: "mercearia", ncm: "0901.21.00", basePrice: 1890, keywords: ["cafe", "café", "moido", "torrado"] },
  { id: "cafe_graos",        name: "Café em Grãos (500g)",         emoji: "☕", category: "mercearia", ncm: "0901.11.00", basePrice: 2450, keywords: ["cafe", "café", "grao", "grão"] },
  { id: "cafe_soluvel",      name: "Café Solúvel (150g)",          emoji: "☕", category: "mercearia", ncm: "2101.11.10", basePrice: 1580, keywords: ["cafe soluvel", "café solúvel", "instantaneo"] },
  { id: "cha_matte",         name: "Chá Matte (200g)",             emoji: "🧉", category: "mercearia", ncm: "2101.20.00", basePrice: 1280, keywords: ["cha", "chá", "matte"] },
  { id: "cha_preto",         name: "Chá Preto (20 un)",             emoji: "🫖", category: "mercearia", ncm: "0902.30.00", basePrice: 890,  keywords: ["cha", "chá", "preto"] },
  { id: "achocolatado",      name: "Achocolatado em Pó (400g)",    emoji: "🍫", category: "mercearia", ncm: "1806.90.00", basePrice: 1250, keywords: ["achocolatado", "chocolate em po"] },
  { id: "leite_empo_integral",name: "Leite em Pó Integral (400g)", emoji: "🥛", category: "mercearia", ncm: "0402.10.10", basePrice: 2890, keywords: ["leite em po", "leite em pó"] },
  { id: "oleo_soja",         name: "Óleo de Soja (900ml)",         emoji: "🌻", category: "mercearia", ncm: "1507.90.11", basePrice: 950,  keywords: ["oleo", "óleo", "soja"] },
  { id: "oleo_milho",        name: "Óleo de Milho (900ml)",        emoji: "🌽", category: "mercearia", ncm: "1515.21.00", basePrice: 1120, keywords: ["oleo", "óleo", "milho"] },
  { id: "oleo_canola",       name: "Óleo de Canola (900ml)",       emoji: "🌻", category: "mercearia", ncm: "1514.11.10", basePrice: 1350, keywords: ["oleo", "óleo", "canola"] },
  { id: "azeite_extra",      name: "Azeite de Oliva Extra Virgem (500ml)", emoji: "🫒", category: "mercearia", ncm: "1509.10.00", basePrice: 3890, keywords: ["azeite"] },
  { id: "azeite_composto",   name: "Azeite de Oliva Composto (500ml)", emoji: "🫒", category: "mercearia", ncm: "1509.90.10", basePrice: 2650, keywords: ["azeite"] },
  { id: "vinagre_alcool",    name: "Vinagre de Álcool (750ml)",    emoji: "🍶", category: "mercearia", ncm: "2209.00.00", basePrice: 380,  keywords: ["vinagre"] },
  { id: "vinagre_vinho",     name: "Vinagre de Vinho (750ml)",     emoji: "🍷", category: "mercearia", ncm: "2209.00.00", basePrice: 590,  keywords: ["vinagre", "vinho"] },
  { id: "molho_tomate",      name: "Molho de Tomate (340g)",       emoji: "🥫", category: "mercearia", ncm: "2103.20.10", basePrice: 490,  keywords: ["molho de tomate", "molho"] },
  { id: "extrato_tomate",    name: "Extrato de Tomate (350g)",     emoji: "🥫", category: "mercearia", ncm: "2002.90.00", basePrice: 720,  keywords: ["extrato de tomate"] },
  { id: "catchup",           name: "Catchup (300g)",               emoji: "🍅", category: "mercearia", ncm: "2103.20.10", basePrice: 680,  keywords: ["catchup", "ketchup"] },
  { id: "mostarda",          name: "Mostarda (200g)",              emoji: "🟡", category: "mercearia", ncm: "2103.30.10", basePrice: 520,  keywords: ["mostarda"] },
  { id: "maionese",          name: "Maionese (500g)",              emoji: "🥚", category: "mercearia", ncm: "2103.90.21", basePrice: 850,  keywords: ["maionese"] },
  { id: "sardinha_lata",     name: "Sardinha em Lata (125g)",     emoji: "🐟", category: "mercearia", ncm: "1604.13.00", basePrice: 620,  keywords: ["sardinha", "enlatado"] },
  { id: "atum_lata_oleo",    name: "Atum em Óleo (170g)",         emoji: "🐟", category: "mercearia", ncm: "1604.14.00", basePrice: 1350, keywords: ["atum", "enlatado"] },
  { id: "milho_lata",        name: "Milho em Lata (200g)",        emoji: "🌽", category: "mercearia", ncm: "2005.80.00", basePrice: 520,  keywords: ["milho", "enlatado", "lata"] },
  { id: "ervilha_lata",      name: "Ervilha em Lata (200g)",      emoji: "🟢", category: "mercearia", ncm: "2005.40.00", basePrice: 490,  keywords: ["ervilha", "enlatado"] },
  { id: "palmito",           name: "Palmito em Conserva (300g)",  emoji: "🌴", category: "mercearia", ncm: "2008.91.00", basePrice: 1890, keywords: ["palmito"] },
  { id: "azeitona_conserva", name: "Azeitona em Conserva (300g)", emoji: "🫒", category: "mercearia", ncm: "2005.70.00", basePrice: 1120, keywords: ["azeitona", "conserva"] },
  { id: "doce_leite",        name: "Doce de Leite (400g)",        emoji: "🍮", category: "mercearia", ncm: "0404.90.00", basePrice: 1580, keywords: ["doce de leite"] },
  { id: "geleia_frutas",     name: "Geleia de Frutas (300g)",     emoji: "🍓", category: "mercearia", ncm: "1707.10.00", basePrice: 1220, keywords: ["geleia", "geléia"] },
  { id: "mel",               name: "Mel (500g)",                  emoji: "🍯", category: "mercearia", ncm: "0409.00.00", basePrice: 2850, keywords: ["mel"] },
  { id: "creme_leite_lata",  name: "Creme de Leite (200g)",       emoji: "🥛", category: "mercearia", ncm: "0401.30.10", basePrice: 620,  keywords: ["creme de leite"] },
  { id: "leite_condensado",  name: "Leite Condensado (395g)",     emoji: "🥛", category: "mercearia", ncm: "0402.91.00", basePrice: 780,  keywords: ["leite condensado"] },
  { id: "coco_ralado",       name: "Coco Ralado (100g)",          emoji: "🥥", category: "mercearia", ncm: "1105.00.00", basePrice: 420,  keywords: ["coco", "ralado"] },
  { id: "gelatina",          name: "Gelatina em Pó (30g)",        emoji: "🟣", category: "mercearia", ncm: "1702.90.00", basePrice: 280,  keywords: ["gelatina"] },
  { id: "biscoito_cream_cracker", name: "Biscoito Cream Cracker (200g)", emoji: "🍪", category: "mercearia", ncm: "1905.31.00", basePrice: 520, keywords: ["biscoito", "cream cracker"] },
  { id: "biscoito_maizena",  name: "Biscoito Maizena (200g)",     emoji: "🍪", category: "mercearia", ncm: "1905.31.00", basePrice: 580,  keywords: ["biscoito", "maizena", "doce"] },
  { id: "biscoito_recheado", name: "Biscoito Recheado (140g)",    emoji: "🍪", category: "mercearia", ncm: "1905.31.00", basePrice: 450,  keywords: ["biscoito", "recheado"] },
  { id: "pao_forma",         name: "Pão de Forma (400g)",         emoji: "🍞", category: "mercearia", ncm: "1905.90.00", basePrice: 980,  keywords: ["pao", "pão", "forma"] },
  { id: "farinha_rosca",     name: "Farinha de Rosca (500g)",     emoji: "🌾", category: "mercearia", ncm: "1901.20.00", basePrice: 680,  keywords: ["farinha de rosca"] },
  { id: "fermento_po",       name: "Fermento em Pó (100g)",       emoji: "🧁", category: "mercearia", ncm: "2102.10.00", basePrice: 350,  keywords: ["fermento"] },

  // ── LATICÍNIOS ──
  { id: "leite_uht_integral",name: "Leite UHT Integral (1L)",     emoji: "🥛", category: "laticinios", ncm: "0401.20.10", basePrice: 580,  keywords: ["leite", "uht", "integral"] },
  { id: "leite_uht_desnatado",name: "Leite UHT Desnatado (1L)",   emoji: "🥛", category: "laticinios", ncm: "0401.20.20", basePrice: 580,  keywords: ["leite", "uht", "desnatado"] },
  { id: "queijo_mucarela",   name: "Queijo Muçarela (kg)",        emoji: "🧀", category: "laticinios", ncm: "0406.10.10", basePrice: 4290, keywords: ["queijo", "mucarela", "muçarela"] },
  { id: "queijo_prato",      name: "Queijo Prato (kg)",           emoji: "🧀", category: "laticinios", ncm: "0406.10.90", basePrice: 4590, keywords: ["queijo", "prato"] },
  { id: "queijo_parmesao",   name: "Queijo Parmesão Ralado (100g)", emoji: "🧀", category: "laticinios", ncm: "0406.20.00", basePrice: 1250, keywords: ["queijo", "parmesao", "parmesão"] },
  { id: "queijo_minas",      name: "Queijo Minas Frescal (kg)",   emoji: "🧀", category: "laticinios", ncm: "0406.10.90", basePrice: 3890, keywords: ["queijo", "minas"] },
  { id: "requeijao",         name: "Requeijão Cremoso (200g)",    emoji: "🧀", category: "laticinios", ncm: "0406.30.00", basePrice: 980,  keywords: ["requeijao", "requeijão"] },
  { id: "iogurte_natural",   name: "Iogurte Natural (170g)",      emoji: "🥛", category: "laticinios", ncm: "0403.10.10", basePrice: 420,  keywords: ["iogurte", "natural"] },
  { id: "iogurte_frutas",    name: "Iogurte de Frutas (170g)",    emoji: "🥛", category: "laticinios", ncm: "0403.10.10", basePrice: 450,  keywords: ["iogurte", "frutas"] },
  { id: "iogurte_grego",     name: "Iogurte Grego (170g)",        emoji: "🥛", category: "laticinios", ncm: "0403.10.10", basePrice: 620,  keywords: ["iogurte", "grego"] },
  { id: "manteiga_com_sal",  name: "Manteiga com Sal (200g)",     emoji: "🧈", category: "laticinios", ncm: "0405.10.00", basePrice: 1420, keywords: ["manteiga"] },
  { id: "manteiga_sem_sal",  name: "Manteiga sem Sal (200g)",     emoji: "🧈", category: "laticinios", ncm: "0405.10.00", basePrice: 1450, keywords: ["manteiga"] },
  { id: "margarina_cremosa", name: "Margarina Cremosa (500g)",    emoji: "🧈", category: "laticinios", ncm: "1517.10.00", basePrice: 890,  keywords: ["margarina"] },
  { id: "margarina_light",   name: "Margarina Light (500g)",      emoji: "🧈", category: "laticinios", ncm: "1517.10.00", basePrice: 920,  keywords: ["margarina", "light"] },
  { id: "nata",              name: "Nata (200g)",                 emoji: "🥛", category: "laticinios", ncm: "0401.30.21", basePrice: 1120, keywords: ["nata"] },

  // ── AÇOUGUE & FRIOS ──
  { id: "alcatra",           name: "Alcatra Bovina (kg)",         emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 4290, keywords: ["carne", "bovina", "alcatra"] },
  { id: "patinho",           name: "Patinho Bovina (kg)",          emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 3890, keywords: ["carne", "patinho"] },
  { id: "coxao_mole",        name: "Coxão Mole (kg)",             emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 3990, keywords: ["carne", "coxao mole", "coxão mole"] },
  { id: "coxao_duro",        name: "Coxão Duro (kg)",             emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 3590, keywords: ["carne", "coxao duro", "coxão duro"] },
  { id: "file_mignon",       name: "Filé Mignon (kg)",            emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 7290, keywords: ["carne", "file mignon", "filé mignon"] },
  { id: "contra_file",       name: "Contrafilé (kg)",             emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 4590, keywords: ["carne", "contra file", "contrafilé"] },
  { id: "picanha",           name: "Picanha Bovina (kg)",         emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 8490, keywords: ["carne", "picanha"] },
  { id: "costela_bovina",    name: "Costela Bovina (kg)",         emoji: "🥩", category: "acougue", ncm: "0201.20.00", basePrice: 3290, keywords: ["carne", "costela"] },
  { id: "maminha",           name: "Maminha Bovina (kg)",         emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 4590, keywords: ["carne", "maminha"] },
  { id: "lagarto",           name: "Lagarto Bovina (kg)",         emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 3790, keywords: ["carne", "lagarto"] },
  { id: "acem",              name: "Acém Bovina (kg)",            emoji: "🥩", category: "acougue", ncm: "0201.20.00", basePrice: 2890, keywords: ["carne", "acem", "acém"] },
  { id: "carne_moida_1",     name: "Carne Moída de Primeira (kg)", emoji: "🥩", category: "acougue", ncm: "0201.30.00", basePrice: 3190, keywords: ["carne", "moida", "moída", "primeira"] },
  { id: "carne_moida_2",     name: "Carne Moída de Segunda (kg)", emoji: "🥩", category: "acougue", ncm: "0201.20.00", basePrice: 2590, keywords: ["carne", "moida", "moída", "segunda"] },
  { id: "frango_inteiro",    name: "Frango Inteiro (kg)",         emoji: "🍗", category: "acougue", ncm: "0207.11.00", basePrice: 1590, keywords: ["frango"] },
  { id: "peito_frango",      name: "Peito de Frango (kg)",        emoji: "🍗", category: "acougue", ncm: "0207.13.00", basePrice: 2190, keywords: ["frango", "peito"] },
  { id: "coxa_frango",       name: "Coxa de Frango (kg)",         emoji: "🍗", category: "acougue", ncm: "0207.13.00", basePrice: 1290, keywords: ["frango", "coxa"] },
  { id: "sobrecoxa",         name: "Sobrecoxa de Frango (kg)",    emoji: "🍗", category: "acougue", ncm: "0207.13.00", basePrice: 1390, keywords: ["frango", "sobrecoxa"] },
  { id: "asa_frango",        name: "Asa de Frango (kg)",          emoji: "🍗", category: "acougue", ncm: "0207.13.00", basePrice: 1190, keywords: ["frango", "asa"] },
  { id: "linguica_toscana",  name: "Linguiça Toscana (kg)",       emoji: "🌭", category: "acougue", ncm: "1601.00.00", basePrice: 2290, keywords: ["linguica", "linguiça", "toscana"] },
  { id: "linguica_calabresa",name: "Linguiça Calabresa (kg)",    emoji: "🌭", category: "acougue", ncm: "1601.00.00", basePrice: 2190, keywords: ["linguica", "linguiça", "calabresa"] },
  { id: "salsicha",          name: "Salsicha Hot Dog (kg)",       emoji: "🌭", category: "acougue", ncm: "1601.00.00", basePrice: 1890, keywords: ["salsicha"] },
  { id: "presunto_cozido",   name: "Presunto Cozido (kg)",        emoji: "🥓", category: "acougue", ncm: "1602.49.00", basePrice: 2890, keywords: ["presunto"] },
  { id: "presunto_defumado", name: "Presunto Defumado (kg)",      emoji: "🥓", category: "acougue", ncm: "1602.49.00", basePrice: 3290, keywords: ["presunto", "defumado"] },
  { id: "mortadela",         name: "Mortadela (kg)",              emoji: "🥓", category: "acougue", ncm: "1601.00.00", basePrice: 1590, keywords: ["mortadela"] },
  { id: "salame",            name: "Salame (kg)",                 emoji: "🥓", category: "acougue", ncm: "1601.00.00", basePrice: 4590, keywords: ["salame"] },
  { id: "bacon",             name: "Bacon Fatiado (kg)",          emoji: "🥓", category: "acougue", ncm: "0209.10.00", basePrice: 3590, keywords: ["bacon"] },
  { id: "lombo_suino",       name: "Lombo Suíno (kg)",            emoji: "🥩", category: "acougue", ncm: "0203.29.00", basePrice: 2190, keywords: ["suino", "suíno", "lombo"] },
  { id: "perna_suina",       name: "Perna Suína (kg)",            emoji: "🥩", category: "acougue", ncm: "0203.29.00", basePrice: 1790, keywords: ["suino", "suíno", "perna"] },
  { id: "costela_suina",     name: "Costela Suína (kg)",          emoji: "🥩", category: "acougue", ncm: "0203.29.00", basePrice: 2590, keywords: ["suino", "suíno", "costela"] },

  // ── BEBIDAS ──
  { id: "cerveja_lata",      name: "Cerveja Pilsen Lata (350ml)", emoji: "🍺", category: "bebidas", ncm: "2203.00.00", basePrice: 420,  keywords: ["cerveja", "pilsen", "lata"] },
  { id: "cerveja_garrafa",   name: "Cerveja Pilsen Garrafa (600ml)", emoji: "🍺", category: "bebidas", ncm: "2203.00.00", basePrice: 780,  keywords: ["cerveja", "pilsen", "garrafa"] },
  { id: "refri_cola_2l",     name: "Refrigerante Cola 2L",        emoji: "🥤", category: "bebidas", ncm: "2202.10.00", basePrice: 890,  keywords: ["refrigerante", "cola"] },
  { id: "refri_guarana_2l",  name: "Refrigerante Guaraná 2L",     emoji: "🥤", category: "bebidas", ncm: "2202.10.00", basePrice: 890,  keywords: ["refrigerante", "guarana", "guaraná"] },
  { id: "refri_laranja",     name: "Refrigerante Laranja 2L",     emoji: "🥤", category: "bebidas", ncm: "2202.10.00", basePrice: 850,  keywords: ["refrigerante", "laranja"] },
  { id: "agua_com_gas",      name: "Água Mineral com Gás (500ml)", emoji: "💧", category: "bebidas", ncm: "2201.10.00", basePrice: 320,  keywords: ["agua", "água", "gas", "gás"] },
  { id: "agua_sem_gas",      name: "Água Mineral sem Gás (1.5L)", emoji: "💧", category: "bebidas", ncm: "2201.10.00", basePrice: 380,  keywords: ["agua", "água", "mineral"] },
  { id: "suco_uva_integral", name: "Suco de Uva Integral (1L)",   emoji: "🍇", category: "bebidas", ncm: "2009.69.00", basePrice: 1580, keywords: ["suco", "uva"] },
  { id: "suco_laranja",      name: "Suco de Laranja (1L)",       emoji: "🍊", category: "bebidas", ncm: "2009.11.00", basePrice: 1250, keywords: ["suco", "laranja"] },
  { id: "energetico",        name: "Bebida Energética (250ml)",   emoji: "⚡", category: "bebidas", ncm: "2202.10.00", basePrice: 980,  keywords: ["energetico", "energético"] },

  // ── LIMPEZA ──
  { id: "sabao_po",          name: "Sabão em Pó (1kg)",           emoji: "🫧", category: "limpeza", ncm: "3401.19.00", basePrice: 1490, keywords: ["sabao", "sabão", "po", "roupa"] },
  { id: "sabao_liquido",     name: "Sabão Líquido (500ml)",       emoji: "🫧", category: "limpeza", ncm: "3401.19.00", basePrice: 1890, keywords: ["sabao", "sabão", "liquido", "líquido"] },
  { id: "amaciante",         name: "Amaciante de Roupas (500ml)", emoji: "🌸", category: "limpeza", ncm: "3809.91.00", basePrice: 1280, keywords: ["amaciante"] },
  { id: "agua_sanitaria",    name: "Água Sanitária (1L)",         emoji: "🧴", category: "limpeza", ncm: "2828.90.11", basePrice: 520,  keywords: ["agua sanitaria", "água sanitária"] },
  { id: "detergente_liquido",name: "Detergente Líquido (500ml)",  emoji: "🧴", category: "limpeza", ncm: "3402.20.00", basePrice: 350,  keywords: ["detergente"] },
  { id: "limpador_multiuso", name: "Limpador Multiuso (500ml)",   emoji: "🧴", category: "limpeza", ncm: "3402.20.00", basePrice: 620,  keywords: ["limpador", "multiuso"] },
  { id: "desinfetante",      name: "Desinfetante (500ml)",        emoji: "🧴", category: "limpeza", ncm: "3808.94.19", basePrice: 780,  keywords: ["desinfetante"] },
  { id: "lustra_moveis",     name: "Lustra-móveis (200ml)",       emoji: "🪑", category: "limpeza", ncm: "3405.20.00", basePrice: 980,  keywords: ["lustra", "moveis", "móveis"] },
  { id: "esponja",           name: "Esponja de Limpeza (un)",     emoji: "🧽", category: "limpeza", ncm: "3924.90.00", basePrice: 280,  keywords: ["esponja"] },
  { id: "palha_aco",         name: "Palha de Aço (un)",           emoji: "✨", category: "limpeza", ncm: "7323.10.00", basePrice: 190,  keywords: ["palha", "aco", "aço"] },
  { id: "saco_lixo_30l",     name: "Saco de Lixo 30L (10 un)",    emoji: "🗑️", category: "limpeza", ncm: "3923.21.00", basePrice: 1290, keywords: ["saco", "lixo"] },
  { id: "saco_lixo_50l",     name: "Saco de Lixo 50L (10 un)",    emoji: "🗑️", category: "limpeza", ncm: "3923.21.00", basePrice: 1690, keywords: ["saco", "lixo"] },
  { id: "papel_toalha",      name: "Papel Toalha (4 un)",          emoji: "🧻", category: "limpeza", ncm: "4818.10.00", basePrice: 890,  keywords: ["papel toalha", "papel"] },
  { id: "guardanapo",        name: "Guardanapo de Papel (50 un)", emoji: "🧻", category: "limpeza", ncm: "4818.10.00", basePrice: 520,  keywords: ["guardanapo"] },

  // ── HIGIENE PESSOAL ──
  { id: "creme_dental",      name: "Creme Dental (90g)",          emoji: "🪥", category: "higiene", ncm: "3306.10.00", basePrice: 680,  keywords: ["creme dental", "dental"] },
  { id: "escova_dental",     name: "Escova Dental (un)",          emoji: "🪥", category: "higiene", ncm: "9603.21.00", basePrice: 890,  keywords: ["escova", "dental"] },
  { id: "shampoo",           name: "Shampoo (350ml)",             emoji: "🧴", category: "higiene", ncm: "3305.10.00", basePrice: 1590, keywords: ["shampoo"] },
  { id: "condicionador",     name: "Condicionador (350ml)",       emoji: "🧴", category: "higiene", ncm: "3305.10.00", basePrice: 1690, keywords: ["condicionador"] },
  { id: "sabonete_barra",    name: "Sabonete em Barra (90g)",     emoji: "🧼", category: "higiene", ncm: "3401.11.00", basePrice: 320,  keywords: ["sabonete"] },
  { id: "sabonete_liquido",  name: "Sabonete Líquido (250ml)",    emoji: "🧼", category: "higiene", ncm: "3401.11.00", basePrice: 980,  keywords: ["sabonete", "liquido", "líquido"] },
  { id: "desodorante_aerosol",name: "Desodorante Aerosol (150ml)", emoji: "🧴", category: "higiene", ncm: "3307.20.10", basePrice: 1490, keywords: ["desodorante"] },
  { id: "desodorante_rollon",name: "Desodorante Roll-on (50ml)",   emoji: "🧴", category: "higiene", ncm: "3307.20.10", basePrice: 1120, keywords: ["desodorante", "roll on"] },
  { id: "papel_higienico",   name: "Papel Higiênico (L12 P11)",   emoji: "🧻", category: "higiene", ncm: "4818.10.00", basePrice: 2290, keywords: ["papel", "higienico", "higiênico"] },
  { id: "absorvente",        name: "Absorvente Íntimo (8 un)",     emoji: "🩸", category: "higiene", ncm: "9619.00.00", basePrice: 890,  keywords: ["absorvente"] },
  { id: "fralda_infantil",   name: "Fralda Descartável Infantil (30 un)", emoji: "👶", category: "higiene", ncm: "9619.00.00", basePrice: 4290, keywords: ["fralda"] },
  { id: "fralda_geriatrica", name: "Fralda Descartável Geriátrica (10 un)", emoji: "👴", category: "higiene", ncm: "9619.00.00", basePrice: 3590, keywords: ["fralda"] },
  { id: "algodao",           name: "Algodão Hidrófilo (100g)",    emoji: "☁️", category: "higiene", ncm: "5601.21.00", basePrice: 520,  keywords: ["algodao", "algodão"] },
  { id: "cotonete",          name: "Cotonete (75 un)",            emoji: "🟢", category: "higiene", ncm: "5601.21.00", basePrice: 380,  keywords: ["cotonete"] },

  // ── HORTIFRÚTI ──
  { id: "batata_inglesa",    name: "Batata Inglesa (kg)",         emoji: "🥔", category: "hortifruti", ncm: "0701.90.00", basePrice: 590,  keywords: ["batata"] },
  { id: "cebola",            name: "Cebola (kg)",                 emoji: "🧅", category: "hortifruti", ncm: "0703.10.19", basePrice: 490,  keywords: ["cebola"] },
  { id: "tomate",            name: "Tomate (kg)",                 emoji: "🍅", category: "hortifruti", ncm: "0702.00.00", basePrice: 750,  keywords: ["tomate"] },
  { id: "cenoura",           name: "Cenoura (kg)",                emoji: "🥕", category: "hortifruti", ncm: "0706.10.00", basePrice: 420,  keywords: ["cenoura"] },
  { id: "alface",            name: "Alface Crespa (un)",          emoji: "🥬", category: "hortifruti", ncm: "0705.11.00", basePrice: 250,  keywords: ["alface"] },
  { id: "couve",             name: "Couve Manteiga (un)",         emoji: "🥬", category: "hortifruti", ncm: "0704.90.00", basePrice: 280,  keywords: ["couve"] },
  { id: "espinafre",         name: "Espinafre (maço)",            emoji: "🥬", category: "hortifruti", ncm: "0709.70.00", basePrice: 350,  keywords: ["espinafre"] },
  { id: "brocolis",          name: "Brócolis (un)",               emoji: "🥦", category: "hortifruti", ncm: "0704.10.00", basePrice: 520,  keywords: ["brocolis", "brócolis"] },
  { id: "banana",            name: "Banana Nanica (kg)",          emoji: "🍌", category: "hortifruti", ncm: "0803.90.00", basePrice: 520,  keywords: ["banana"] },
  { id: "maca",              name: "Maçã Fuji (kg)",              emoji: "🍎", category: "hortifruti", ncm: "0808.10.00", basePrice: 980,  keywords: ["maca", "maçã"] },
  { id: "laranja",           name: "Laranja Pera (kg)",           emoji: "🍊", category: "hortifruti", ncm: "0805.10.00", basePrice: 420,  keywords: ["laranja"] },
  { id: "limao",             name: "Limão Tahiti (kg)",           emoji: "🍋", category: "hortifruti", ncm: "0805.50.00", basePrice: 380,  keywords: ["limao", "limão"] },
  { id: "mamao",             name: "Mamão (un)",                  emoji: "🥭", category: "hortifruti", ncm: "0807.19.00", basePrice: 650,  keywords: ["mamao", "mamão"] },
  { id: "melancia",          name: "Melancia (kg)",               emoji: "🍉", category: "hortifruti", ncm: "0807.19.00", basePrice: 320,  keywords: ["melancia"] },
  { id: "abacate",           name: "Abacate (un)",               emoji: "🥑", category: "hortifruti", ncm: "0804.40.00", basePrice: 850,  keywords: ["abacate"] },
  { id: "abacaxi",           name: "Abacaxi (un)",                emoji: "🍍", category: "hortifruti", ncm: "0804.30.00", basePrice: 780,  keywords: ["abacaxi"] },

  // ── CONGELADOS ──
  { id: "sorvete_creme",     name: "Sorvete de Creme (2L)",       emoji: "🍦", category: "congelados", ncm: "2105.00.00", basePrice: 2290, keywords: ["sorvete", "creme"] },
  { id: "sorvete_chocolate", name: "Sorvete de Chocolate (2L)",   emoji: "🍫", category: "congelados", ncm: "2105.00.00", basePrice: 2290, keywords: ["sorvete", "chocolate"] },
  { id: "legumes_congelados",name: "Legumes Congelados (500g)",   emoji: "🥦", category: "congelados", ncm: "0710.80.00", basePrice: 980,  keywords: ["legumes", "congelado"] },
  { id: "batata_palito",     name: "Batata Palito Congelada (500g)", emoji: "🍟", category: "congelados", ncm: "2004.10.00", basePrice: 1290, keywords: ["batata", "palito", "congelado"] },
  { id: "frango_empanado",   name: "Frango Empanado Congelado (500g)", emoji: "🍗", category: "congelados", ncm: "1602.32.00", basePrice: 1590, keywords: ["frango", "empanado", "congelado"] },
  { id: "lasanha_congelada", name: "Lasanha Congelada (500g)",     emoji: "🍝", category: "congelados", ncm: "1902.20.00", basePrice: 2290, keywords: ["lasanha", "congelado"] },
  { id: "pizza_congelada",   name: "Pizza Congelada (400g)",      emoji: "🍕", category: "congelados", ncm: "1905.90.00", basePrice: 1890, keywords: ["pizza", "congelado"] },

  // ── UTILIDADES ──
  { id: "alcool_70",         name: "Álcool 70 (1L)",              emoji: "🧴", category: "utilidades", ncm: "3808.94.19", basePrice: 780,  keywords: ["alcool", "álcool"] },
  { id: "inseticida",        name: "Inseticida Aerossol (400ml)",  emoji: "🦟", category: "utilidades", ncm: "3808.91.99", basePrice: 1690, keywords: ["inseticida"] },
  { id: "vela",              name: "Vela (8 un)",                 emoji: "🕯️", category: "utilidades", ncm: "3406.00.00", basePrice: 620,  keywords: ["vela"] },
  { id: "pilha_aa",          name: "Pilha AA (4 un)",             emoji: "🔋", category: "utilidades", ncm: "8506.10.10", basePrice: 1290, keywords: ["pilha", "aa"] },
  { id: "pilha_aaa",         name: "Pilha AAA (4 un)",            emoji: "🔋", category: "utilidades", ncm: "8506.10.10", basePrice: 1390, keywords: ["pilha", "aaa"] },
  { id: "lampada_led",       name: "Lâmpada LED 9W (un)",        emoji: "💡", category: "utilidades", ncm: "8539.50.00", basePrice: 1890, keywords: ["lampada", "lâmpada", "led"] },
  { id: "filtro_cafe",       name: "Filtro de Papel para Café (100 un)", emoji: "☕", category: "utilidades", ncm: "4823.20.00", basePrice: 520, keywords: ["filtro", "cafe", "café"] },

  // ── LOGÍSTICA / NÃO-ALIMENTAR ──
  { id: "diesel",            name: "Óleo Diesel S10 (Litro)",     emoji: "🚚", category: "utilidades", ncm: "2710.19.21", basePrice: 620,  keywords: ["diesel", "combustivel", "combustível"] },
];

export const ALL_INSUMOS: Insumo[] = INSUMOS_DATA;

export const INSUMOS_MAP = new Map<string, Insumo>(ALL_INSUMOS.map(i => [i.id, i]));

export const INSUMOS_KEYWORDS = ALL_INSUMOS.flatMap(i => i.keywords);

export const INSUMOS_CATEGORIES = CATEGORIES;

export function getInsumoById(id: string): Insumo | undefined {
  return INSUMOS_MAP.get(id);
}

export function findInsumosByKeyword(text: string): Insumo[] {
  const lower = text.toLowerCase();
  return ALL_INSUMOS.filter(i => i.keywords.some(k => lower.includes(k)));
}

export function getCategoryLabel(categoryId: string): string {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? `${cat.emoji} ${cat.name}` : categoryId;
}

export function getCategoryName(categoryId: string): string {
  return CATEGORIES.find(c => c.id === categoryId)?.name ?? categoryId;
}

export const INSUMOS_COUNT = ALL_INSUMOS.length;
