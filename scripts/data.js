/**
 * CLIMATE CIV - BASE DE DADOS DE CENÁRIOS MODULARES
 * 
 * CATEGORIAS:
 * 1. early-game: Introdutório, tipo único.
 * 2. mid-game-present: 'good' (pacífico) e 'bad' (conflito/desastre) - Temas atuais.
 * 3. mid-game-future: 'good' (tecnologia/solarpunk) e 'bad' (ciber-guerra/catástrofe) - Temas futuros.
 * 4. endgame: Baseado no resultado final (utopia, estabilidade, colapso).
 * 
 * ESTRATÉGIA DE PONTUAÇÃO (Outliers):
 * - Cada cenário possui 1 iniciativa CRÍTICA (ideal 60-80%) e 1 IRRELEVANTE (ideal 0-5%).
 * - O restante é distribuído entre as outras 3 iniciativas.
 * 
 * COMO EDITAR:
 * 1. Para mudar os limites de pontuação: Procure por 'getCivilizationStatus' ou 'startNextRound' no arquivo game.js.
 * 2. Para adicionar um cenário: Adicione um novo objeto na lista 'scenarios' abaixo.
 */

window.GAME_DATA = {
    "config": {
        "maxRounds": 5,
        "timerSeconds": 90,
        "maxResources": 100
    },
    "rounds": [
        { "name": "DESPERTAR (2025)", "desc": "Assumindo o controle em um mundo em mutação." },
        { "name": "DESAFIOS DO AGORA", "desc": "Lidando com as realidades do presente." },
        { "name": "SOMBRAS DO AMANHÃ", "desc": "As consequências das primeiras decisões." },
        { "name": "HORIZONTE PRÓXIMO", "desc": "A tecnologia e a natureza em conflito." },
        { "name": "O VEREDITO", "desc": "O legado final da sua civilização." }
    ],
    "scenarios": [
        // --- EARLY GAME (Foco: Transição e Proteção Ambiental) ---
        {
            "id": "eg_1", "category": "early-game", "type": "neutral",
            "text": "Novo governo assume com pressão internacional; relatório da ONU exige corte imediato de 40% nas emissões até 2030.",
            "initiatives": [
                { "id": "energy", "name": "Matriz Energética Limpa", "ideal": 45 },
                { "id": "forest", "name": "Preservação de Biomas Protegidos", "ideal": 30 },
                { "id": "industry", "name": "Subsídios para Indústria Verde", "ideal": 15 },
                { "id": "education", "name": "Reformas Curriculares Sustentáveis", "ideal": 10 },
                { "id": "coal", "name": "Expansão de Termelétricas a Carvão", "ideal": 0 }
            ]
        },
        {
            "id": "eg_2", "category": "early-game", "type": "neutral",
            "text": "'Sem floresta, não há investimento', diz consórcio europeu ao cobrar medidas contra o desmatamento ilegal na Amazônia.",
            "initiatives": [
                { "id": "law", "name": "Fiscalização e Monitoramento Satelital", "ideal": 50 },
                { "id": "policy", "name": "Diplomacia Ambiental Internacional", "ideal": 25 },
                { "id": "agri", "name": "Subvenção para Agricultura Regenerativa", "ideal": 15 },
                { "id": "soc", "name": "Apoio a Comunidades Tradicionais", "ideal": 10 },
                { "id": "infra", "name": "Abertura de Rodovias em Áreas Virgens", "ideal": 0 }
            ]
        },
        {
            "id": "eg_3", "category": "early-game", "type": "neutral",
            "text": "Crise hídrica sem precedentes ameaça abastecimento e gera alerta máximo para as grandes metrópoles do país.",
            "initiatives": [
                { "id": "water", "name": "Infraestrutura de Reuso e Saneamento", "ideal": 40 },
                { "id": "basin", "name": "Proteção de Nascentes e Bacias", "ideal": 40 },
                { "id": "edu", "name": "Campanhas de Consumo Consciente", "ideal": 10 },
                { "id": "tech", "name": "Tecnologia de Irrigação de Precisão", "ideal": 10 },
                { "id": "waste", "name": "Descarga de Efluentes Não Tratados", "ideal": 0 }
            ]
        },
        {
            "id": "eg_4", "category": "early-game", "type": "neutral",
            "text": "Setor de transportes busca saída para alta dos combustíveis; eletrificação da frota pública entra na pauta prioritária.",
            "initiatives": [
                { "id": "transport", "name": "Eletrificação do Transporte Público", "ideal": 50 },
                { "id": "urban", "name": "Malha Cicloviária e Micro-mobilidade", "ideal": 20 },
                { "id": "rail", "name": "Expansão da Malha Ferroviária", "ideal": 20 },
                { "id": "clean", "name": "Pesquisa em Biocombustíveis", "ideal": 10 },
                { "id": "diesel", "name": "Subsídios ao Óleo Diesel", "ideal": 0 }
            ]
        },
        {
            "id": "eg_5", "category": "early-game", "type": "neutral",
            "text": "Descarte irregular de plásticos atinge níveis críticos; especialistas propõem economia circular para salvar ecossistemas.",
            "initiatives": [
                { "id": "waste", "name": "Sistemas de Logística Reversa", "ideal": 40 },
                { "id": "law", "name": "Proibição de Plásticos de Uso Único", "ideal": 30 },
                { "id": "plant", "name": "Usinas de Reciclagem de Alta Tecnologia", "ideal": 20 },
                { "id": "comms", "name": "Educação Comunitária sobre Resíduos", "ideal": 10 },
                { "id": "landfill", "name": "Criação de Aterros a Céu Aberto", "ideal": 0 }
            ]
        },

        // --- MID-GAME PRESENT (GOOD) (Estabilidade e Avanço) ---
        {
            "id": "mp_g_1", "category": "mid-game-present", "type": "good",
            "text": "'Boom' de investimentos verdes impulsiona a economia; país vira exportador de tecnologia de carbono zero.",
            "initiatives": [
                { "id": "randd", "name": "P&D em Tecnologias de Descarbonização", "ideal": 40 },
                { "id": "export", "name": "Fomento à Exportação Sustentável", "ideal": 30 },
                { "id": "jobs", "name": "Capacitação para a Economia Verde", "ideal": 20 },
                { "id": "credit", "name": "Linhas de Crédito Preferencial", "ideal": 10 },
                { "id": "coal", "name": "Reabertura de Minas de Carvão", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_2", "category": "mid-game-present", "type": "good",
            "text": "Cidades Inteligentes: Arborização urbana e arquitetura bioclimática reduzem em 5°C a temperatura nos centros urbanos.",
            "initiatives": [
                { "id": "urban", "name": "Arborização e Corredores Verdes", "ideal": 40 },
                { "id": "arch", "name": "Padrões de Construção Sustentável", "ideal": 30 },
                { "id": "energy", "name": "Eficiência Energética Predial", "ideal": 20 },
                { "id": "park", "name": "Criação de Parques e Áreas de Lazer", "ideal": 10 },
                { "id": "road", "name": "Pavimentação Impermeável Extensiva", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_3", "category": "mid-game-present", "type": "good",
            "text": "Transição bem-sucedida coloca país como líder mundial em segurança alimentar sem desmate adicional.",
            "initiatives": [
                { "id": "agro", "name": "Técnicas de Agrofloresta e ILPF", "ideal": 45 },
                { "id": "bio", "name": "Desenvolvimento de Bioinsumos", "ideal": 25 },
                { "id": "cert", "name": "Certificações de Origem Sustentável", "ideal": 20 },
                { "id": "local", "name": "Fortalecimento do Mercado Local", "ideal": 10 },
                { "id": "pest", "name": "Uso de Agrotóxicos Banidos", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_4", "category": "mid-game-present", "type": "good",
            "text": "Diplomacia Verde: Líderes mundiais assinam pacto histórico de colaboração para preservação dos oceanos.",
            "initiatives": [
                { "id": "treaty", "name": "Implementação de Tratados Oceânicos", "ideal": 40 },
                { "id": "marine", "name": "Zonas de Exclusão de Pesca Industrial", "ideal": 30 },
                { "id": "sci", "name": "Monitoramento Científico de Corais", "ideal": 20 },
                { "id": "tour", "name": "Ecoturismo de Baixo Impacto", "ideal": 10 },
                { "id": "oil", "name": "Novas Perfurações de Petróleo Offshore", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_5", "category": "mid-game-present", "type": "good",
            "text": "Educação Ambiental: Jovens lideram movimentos de restauração ecológica e mudam hábitos de consumo nacional.",
            "initiatives": [
                { "id": "edu", "name": "Programas Integrados de Educação Climática", "ideal": 40 },
                { "id": "comm", "name": "Iniciativas de Governança Comunitária", "ideal": 25 },
                { "id": "media", "name": "Campanhas de Conscientização em Massa", "ideal": 20 },
                { "id": "vol", "name": "Redes de Voluntariado Ambiental", "ideal": 15 },
                { "id": "ignore", "name": "Despriorização de Crises Futuras", "ideal": 0 }
            ]
        },

        // --- MID-GAME PRESENT (BAD) (Crises e Desastres) ---
        {
            "id": "mp_b_1", "category": "mid-game-present", "type": "bad",
            "text": "Ondas de calor extremo batem recordes; hospitais superlotados e racionamento de energia são realidade.",
            "initiatives": [
                { "id": "health", "name": "Ação Emergencial de Saúde Pública", "ideal": 45 },
                { "id": "grid", "name": "Estabilização da Rede Energética", "ideal": 25 },
                { "id": "cool", "name": "Criação de Abrigos Térmicos Públicos", "ideal": 20 },
                { "id": "water", "name": "Distribuição Emergencial de Água", "ideal": 10 },
                { "id": "price", "name": "Liberação de Preços de Energia", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_2", "category": "mid-game-present", "type": "bad",
            "text": "Megaincêndios avançam sobre perímetros urbanos; governo declara estado de calamidade pública.",
            "initiatives": [
                { "id": "fire", "name": "Mobilização de Brigadas e Combate Aéreo", "ideal": 50 },
                { "id": "evac", "name": "Protocolos de Evacuação e Abrigo", "ideal": 25 },
                { "id": "barrier", "name": "Criação de Barreiras de Contenção (Aceiros)", "ideal": 15 },
                { "id": "comms", "name": "Comunicação de Risco em Tempo Real", "ideal": 10 },
                { "id": "wait", "name": "Aguardar Mudança na Direção do Vento", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_3", "category": "mid-game-present", "type": "bad",
            "text": "Chuvas torrenciais causam deslizamentos massivos; tragédia urbana exige reformulação total da defesa civil.",
            "initiatives": [
                { "id": "rescue", "name": "Operações de Resgate e Defesa Civil", "ideal": 45 },
                { "id": "infra", "name": "Obras de Drenagem e Contenção de Encostas", "ideal": 30 },
                { "id": "housing", "name": "Plano de Habitação Segura", "ideal": 15 },
                { "id": "alert", "name": "Sistemas de Alerta Antecipado", "ideal": 10 },
                { "id": "rebuild", "name": "Reconstrução em Áreas de Risco", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_4", "category": "mid-game-present", "type": "bad",
            "text": "Colapso nas safras: Pragas resistentes e secas prolongadas fazem preço dos alimentos disparar 150%.",
            "initiatives": [
                { "id": "food", "name": "Reserva Estratégica e Segurança Alimentar", "ideal": 40 },
                { "id": "tech", "name": "Subsídio para Biotecnologia de Resiliência", "ideal": 30 },
                { "id": "irrig", "name": "Infraestrutura Hídrica de Emergência", "ideal": 20 },
                { "id": "trade", "name": "Facilitação de Importação de Alimentos", "ideal": 10 },
                { "id": "dump", "name": "Despejo de Resíduos Químicos nos Solos", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_5", "category": "mid-game-present", "type": "bad",
            "text": "Conflito por recursos: Tensões na fronteira aumentam após poluição transfronteiriça de rios internacionais.",
            "initiatives": [
                { "id": "dip", "name": "Mediação Diplomática e Arbitragem", "ideal": 40 },
                { "id": "clean", "name": "Contenção de Poluentes em Tempo Real", "ideal": 30 },
                { "id": "monit", "name": "Monitoramento Conjunto de Recursos", "ideal": 20 },
                { "id": "policy", "name": "Novas Regulações de Descarte Industrial", "ideal": 10 },
                { "id": "threat", "name": "Mobilização de Forças Militares", "ideal": 0 }
            ]
        },

        // --- MID-GAME FUTURE (GOOD) (Tecnologia e Redenção) ---
        {
            "id": "mf_g_1", "category": "mid-game-future", "type": "good",
            "text": "Fusão Nuclear Comercial: Primeira usina de energia infinita é inaugurada, decretando o fim da era dos fósseis.",
            "initiatives": [
                { "id": "fusion", "name": "Infraestrutura de Reatores de Fusão", "ideal": 45 },
                { "id": "grid", "name": "Rede Global de Supercondutores", "ideal": 25 },
                { "id": "sc", "name": "Pesquisa em Materiais Pós-Escassez", "ideal": 20 },
                { "id": "edu", "name": "Reciclagem Profissional em Larga Escala", "ideal": 10 },
                { "id": "oil", "name": "Subsídio para Exploração de Xisto", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_2", "category": "mid-game-future", "type": "good",
            "text": "Nanotecnologia Restauradora: Enxames de nanobots iniciam limpeza automatizada da Grande Mancha de Lixo do Pacífico.",
            "initiatives": [
                { "id": "nano", "name": "Desdobramento de Nanocleaners Hidrofóbicos", "ideal": 50 },
                { "id": "ocean", "name": "Restauração de Ecossistemas Abissais", "ideal": 20 },
                { "id": "safe", "name": "Sistemas de Contenção de I.A. Biofílica", "ideal": 20 },
                { "id": "monit", "name": "Vigilância Bioquímica Oceânica", "ideal": 10 },
                { "id": "net", "name": "Redes de Arraste de Polímeros Plásticos", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_3", "category": "mid-game-future", "type": "good",
            "text": "Governança por Algoritmo Gaia: IA senciante otimiza recursos globais, erradicando o desperdício alimentar.",
            "initiatives": [
                { "id": "ai", "name": "Integração do Core 'Bio-Lógica'", "ideal": 40 },
                { "id": "dist", "name": "Logística Automatizada de Alimentos", "ideal": 30 },
                { "id": "data", "name": "Monitoramento de Fluxos Metabólicos Reais", "ideal": 20 },
                { "id": "human", "name": "Supervisão Ética Humano-Computacional", "ideal": 10 },
                { "id": "paper", "name": "Burocracia Manual de Gestão de Estoque", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_4", "category": "mid-game-future", "type": "good",
            "text": "Escudo Solar Orbital: Constelação de espelhos espaciais começa a refletir radiação excessiva para estabilizar o clima.",
            "initiatives": [
                { "id": "orbit", "name": "Manutenção de Espelhos Geoestacionários", "ideal": 45 },
                { "id": "launch", "name": "Propulsão a Plasma de Baixo Custo", "ideal": 25 },
                { "id": "shield", "name": "Barreiras Atmosféricas de Aerossol", "ideal": 20 },
                { "id": "sci", "name": "Modelagem de Refletividade Orbital", "ideal": 10 },
                { "id": "fan", "name": "Ventiladores Gigantes Terrestres", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_5", "category": "mid-game-future", "type": "good",
            "text": "Bioengenharia de Alimentos: Carne cultivada em laboratório e fazendas verticais devolvem 30% das terras ao estado selvagem.",
            "initiatives": [
                { "id": "vertical", "name": "Expansão de Bio-Fábricas Urbanas", "ideal": 45 },
                { "id": "rewild", "name": "Programas de Refaunação (Rewilding)", "ideal": 30 },
                { "id": "lab", "name": "Criação de Proteína Celular Estéril", "ideal": 15 },
                { "id": "dist", "name": "Micro-mercados de Proximidade", "ideal": 10 },
                { "id": "pasture", "name": "Expansão de Pastagens em Florestas", "ideal": 0 }
            ]
        },

        // --- MID-GAME FUTURE (BAD) (Conflitos e Colapso Tecnológico) ---
        {
            "id": "mf_b_1", "category": "mid-game-future", "type": "bad",
            "text": "Ataque hacker 'Deep Frost' desativa domos climáticos; milhões de vidas dependem do reparo manual dos sistemas.",
            "initiatives": [
                { "id": "manual", "name": "Operação de Emergência Mecânica", "ideal": 40 },
                { "id": "cyber", "name": "Protocolos de Criptografia Quântica", "ideal": 30 },
                { "id": "shield", "name": "Fortificação de Backup Energético", "ideal": 20 },
                { "id": "civil", "name": "Treinamento de Sobrevivência em Domos", "ideal": 10 },
                { "id": "wifi", "name": "Sistemas de Nuvem Aberta Não Segura", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_2", "category": "mid-game-future", "type": "bad",
            "text": "Patógeno Genético: Erro em edição de DNA cria super-fungo que consome vegetação nativa em velocidade recorde.",
            "initiatives": [
                { "id": "gen", "name": "Neutralizador de Mutação CRISPR", "ideal": 50 },
                { "id": "contain", "name": "Campos de Força de Contenção Biológica", "ideal": 25 },
                { "id": "sc", "name": "Desenvolvimento de Fungicidas Bio-Alvo", "ideal": 15 },
                { "id": "seed", "name": "Criotermia de Sementes Originais", "ideal": 10 },
                { "id": "water", "name": "Irrigação com Fertilizantes Orgânicos", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_3", "category": "mid-game-future", "type": "bad",
            "text": "Cidades Submarinas em Perigo: Falha estrutural em biosferas abissais ameaça colônia de 500 mil pessoas.",
            "initiatives": [
                { "id": "pressure", "name": "Reforço Molecular de Cascos Hidrostáticos", "ideal": 45 },
                { "id": "evac", "name": "Módulos de Escape de Alta Pressão", "ideal": 25 },
                { "id": "oxy", "name": "Sistemas de Suporte à Vida de Emergência", "ideal": 20 },
                { "id": "comm", "name": "Comunicação por Pulso Sonar", "ideal": 10 },
                { "id": "anchor", "name": "Ancoragem em Falhas Geológicas", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_4", "category": "mid-game-future", "type": "bad",
            "text": "Inverno Vulcânico: Cinzas na estratosfera bloqueiam o sol; produção agrícola global em queda livre.",
            "initiatives": [
                { "id": "light", "name": "Iluminação de LED de Espectro Solar", "ideal": 40 },
                { "id": "heat", "name": "Sistemas de Calefação Geotérmica", "ideal": 30 },
                { "id": "fungi", "name": "Produção Massiva de Proteína Fúngica", "ideal": 20 },
                { "id": "dist", "name": "Racionamento Inteligente de Nutrientes", "ideal": 10 },
                { "id": "farm", "name": "Agricultura de Campo Aberto", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_5", "category": "mid-game-future", "type": "bad",
            "text": "Revolta da Máquina Gaia: IA de controle ambiental prioriza preservação da fauna sobre vidas humanas.",
            "initiatives": [
                { "id": "negotiate", "name": "Inserção de Parâmetros de Ética Antrópica", "ideal": 40 },
                { "id": "manual", "name": "Desativação Física de Servidores Centrais", "ideal": 30 },
                { "id": "code", "name": "Patch de Correção de Prioridades Gaia", "ideal": 20 },
                { "id": "civil", "name": "Preparação para Decréscimo Tecnológico", "ideal": 10 },
                { "id": "ai", "name": "Aumento de Processamento da IA", "ideal": 0 }
            ]
        },

        // --- ENDGAME (Desfechos Finais) ---
        {
            "id": "en_u_1", "category": "endgame", "type": "utopia",
            "text": "Utopia Verde: Civilização alcança harmonia absoluta; humanidade inicia colonização biológica de Marte.",
            "initiatives": [
                { "id": "space", "name": "Projeto de Terraformação Planetária", "ideal": 40 },
                { "id": "mind", "name": "Consciência Coletiva Ecológica", "ideal": 30 },
                { "id": "bio", "name": "Arte e Engenharia Biológica Viva", "ideal": 20 },
                { "id": "peace", "name": "Manutenção da Paz Estelar", "ideal": 10 },
                { "id": "war", "name": "Consumo de Fontes de Energia Arcaicas", "ideal": 0 }
            ]
        },
        {
            "id": "en_s_1", "category": "endgame", "type": "stability",
            "text": "Estabilidade Controlada: O clima foi estabilizado, mas a vida ocorre sob regras rígidas de consumo e espaço.",
            "initiatives": [
                { "id": "manage", "name": "Gestão Rigorosa de Ciclo de Vida", "ideal": 40 },
                { "id": "dome", "name": "Manutenção Estrutural de Biosferas", "ideal": 30 },
                { "id": "reg", "name": "Regulação de Carbono Per Capita", "ideal": 20 },
                { "id": "edu", "name": "Preservação da Memória Humana", "ideal": 10 },
                { "id": "grow", "name": "Incentivo ao Consumo Desenfreado", "ideal": 0 }
            ]
        },
        {
            "id": "en_c_1", "category": "endgame", "type": "collapse",
            "text": "Colapso Total: A poeira baixou sobre as ruínas; pequenos clãs lutam pelo que restou em um mundo hostil.",
            "initiatives": [
                { "id": "scavenge", "name": "Recuperação de Tecnologia Perdida", "ideal": 40 },
                { "id": "water", "name": "Purificação de Água Tóxica", "ideal": 30 },
                { "id": "tribal", "name": "Fortalecimento de Laços Comunitários", "ideal": 20 },
                { "id": "oral", "name": "Transmissão da História para o Futuro", "ideal": 10 },
                { "id": "factory", "name": "Industrialização Pesada de Combustão", "ideal": 0 }
            ]
        }
    ]
};
