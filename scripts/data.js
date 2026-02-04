/**
 * CLIMATE CIV - BASE DE DADOS DE CENÁRIOS MODULARES
 * 
 * CATEGORIAS:
 * 1. early-game: Introdutório, tipo único.
 * 2. mid-game-present: 'good' (pacífico) e 'bad' (conflito/desastre) - Temas atuais.
 * 3. mid-game-future: 'good' (tecnologia/solarpunk) e 'bad' (ciber-guerra/catástrofe) - Temas futuros.
 * 4. endgame: Baseado no resultado final (utopia, estabilidade, colapso).
 * 
 * COMO EDITAR:
 * 1. Para mudar os limites de pontuação: Procure por 'getCivilizationStatus' ou 'startNextRound' no arquivo game.js.
 * 2. Para adicionar um cenário: Adicione um novo objeto na lista 'scenarios' abaixo.
 *    Certifique-se de que o ID seja único e que a 'category' e 'type' correspondam a uma categoria existente.
 *    O jogo escolherá aleatoriamente entre todos os cenários que coincidirem com a categoria e tipo.
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
        // --- EARLY GAME (Introdutório) ---
        {
            "id": "eg_1", "category": "early-game", "type": "neutral",
            "text": "Seu mandato começa. O orçamento é limitado e as expectativas são altas. Como você prioriza a base da sua gestão?",
            "initiatives": [
                { "id": "energy", "name": "Energia Renovável", "ideal": 40 },
                { "id": "forest", "name": "Proteção Florestal", "ideal": 20 },
                { "id": "industry", "name": "Indústria Verde", "ideal": 15 },
                { "id": "education", "name": "Educação Climática", "ideal": 15 },
                { "id": "infra", "name": "Infraestrutura Urb.", "ideal": 10 }
            ]
        },
        {
            "id": "eg_2", "category": "early-game", "type": "neutral",
            "text": "Uma nova conferência internacional exige metas de carbono. O setor produtivo está preocupado. Qual o seu primeiro sinal?",
            "initiatives": [
                { "id": "policy", "name": "Tratado Ambiental", "ideal": 35 },
                { "id": "tech", "name": "PD Verde", "ideal": 25 },
                { "id": "agri", "name": "Transição Agrícola", "ideal": 20 },
                { "id": "comms", "name": "Campanha Global", "ideal": 10 },
                { "id": "transport", "name": "Logística Limpa", "ideal": 10 }
            ]
        },
        {
            "id": "eg_3", "category": "early-game", "type": "neutral",
            "text": "O desmatamento ilegal nas fronteiras exige ação imediata. Como você aloca os recursos de segurança?",
            "initiatives": [
                { "id": "law", "name": "Fiscalização", "ideal": 45 },
                { "id": "social", "name": "Alternativas Econ.", "ideal": 20 },
                { "id": "sat", "name": "Monitoramento Sat.", "ideal": 15 },
                { "id": "forest", "name": "Replantio Ativo", "ideal": 10 },
                { "id": "edu", "name": "Conscientização", "ideal": 10 }
            ]
        },
        {
            "id": "eg_4", "category": "early-game", "type": "neutral",
            "text": "A poluição urbana por plásticos atingiu rios vitais. A população clama por cidades mais limpas.",
            "initiatives": [
                { "id": "waste", "name": "Gestão de Resíduos", "ideal": 40 },
                { "id": "water", "name": "Limpeza de Rios", "ideal": 25 },
                { "id": "edu", "name": "Educação Ambiental", "ideal": 15 },
                { "id": "industry", "name": "Banimento de Plásticos", "ideal": 10 },
                { "id": "tech", "name": "Novas Embalagens", "ideal": 10 }
            ]
        },
        {
            "id": "eg_5", "category": "early-game", "type": "neutral",
            "text": "O transporte público está em colapso devido aos altos preços dos combustíveis fósseis.",
            "initiatives": [
                { "id": "transport", "name": "Ônibus Elétricos", "ideal": 40 },
                { "id": "sub", "name": "Subsídio de Tarifa", "ideal": 20 },
                { "id": "bike", "name": "Ciclovias Seguras", "ideal": 15 },
                { "id": "urban", "name": "Planejamento Urb.", "ideal": 15 },
                { "id": "train", "name": "Malha Ferroviária", "ideal": 10 }
            ]
        },

        // --- MID-GAME PRESENT (BOM / PACÍFICO) ---
        {
            "id": "mp_g_1", "category": "mid-game-present", "type": "good",
            "text": "PAZ E COOPERAÇÃO: Uma aliança regional propõe um hub de energia limpa compartilhada. O clima está estável.",
            "initiatives": [
                { "id": "grid", "name": "Rede Integrada", "ideal": 40 },
                { "id": "dip", "name": "Diplomacia Energ.", "ideal": 20 },
                { "id": "solar", "name": "Parques Solares", "ideal": 20 },
                { "id": "job", "name": "Empregos Verdes", "ideal": 10 },
                { "id": "store", "name": "Armazenam. Baterias", "ideal": 10 }
            ]
        },
        {
            "id": "mp_g_2", "category": "mid-game-present", "type": "good",
            "text": "CIDADE JARDIM: Um programa de urbanismo sustentável reduziu as ilhas de calor. Como expandir esse sucesso?",
            "initiatives": [
                { "id": "urban", "name": "Florestas Urbanas", "ideal": 35 },
                { "id": "water", "name": "Drenagem Verde", "ideal": 25 },
                { "id": "bike", "name": "Mobilidade Ativa", "ideal": 20 },
                { "id": "comm", "name": "Hortas Comunitárias", "ideal": 10 },
                { "id": "air", "name": "Qualidade do Ar", "ideal": 10 }
            ]
        },
        {
            "id": "mp_g_3", "category": "mid-game-present", "type": "good",
            "text": "BOOM DA AGROECOLOGIA: Pequenos produtores estão regenerando o solo e garantindo a segurança alimentar.",
            "initiatives": [
                { "id": "agri", "name": "Cooperativas Org.", "ideal": 40 },
                { "id": "soil", "name": "Saúde do Solo", "ideal": 20 },
                { "id": "local", "name": "Mercados Locais", "ideal": 15 },
                { "id": "irr", "name": "Irrigação Gota-a-Gota", "ideal": 15 },
                { "id": "seed", "name": "Bancos de Sementes", "ideal": 10 }
            ]
        },
        {
            "id": "mp_g_4", "category": "mid-game-present", "type": "good",
            "text": "TURISMO REGENERATIVO: Suas praias e florestas tornaram-se o principal destino mundial por serem impecáveis.",
            "initiatives": [
                { "id": "prot", "name": "Proteção Marinha", "ideal": 35 },
                { "id": "infra", "name": "Ecoturismo", "ideal": 25 },
                { "id": "edu", "name": "Guias Ambientais", "ideal": 20 },
                { "id": "law", "name": "Regulação de Vagas", "ideal": 10 },
                { "id": "tax", "name": "Taxas de Restauração", "ideal": 10 }
            ]
        },
        {
            "id": "mp_g_5", "category": "mid-game-present", "type": "good",
            "text": "PATO NACIONAL VERDE: Indústrias nacionais migraram voluntariamente para matrizes de baixo carbono.",
            "initiatives": [
                { "id": "credit", "name": "Subsídios Limpos", "ideal": 40 },
                { "id": "tech", "name": "Inovação Industrial", "ideal": 20 },
                { "id": "energy", "name": "Fontes Próprias", "ideal": 15 },
                { "id": "cert", "name": "Selo de Qualidade", "ideal": 15 },
                { "id": "export", "name": "Logística Reversa", "ideal": 10 }
            ]
        },

        // --- MID-GAME PRESENT (RUIM / CONFLITO) ---
        {
            "id": "mp_b_1", "category": "mid-game-present", "type": "bad",
            "text": "CONFLITO POR RECURSOS: Uma seca histórica causou tensões nas fronteiras por direitos de uso de água.",
            "initiatives": [
                { "id": "water", "name": "Gestão Hídrica", "ideal": 45 },
                { "id": "dip", "name": "Mediação de Confl.", "ideal": 20 },
                { "id": "emergency", "name": "Ajuda Humanitária", "ideal": 15 },
                { "id": "desal", "name": "Dessalinização Rap.", "ideal": 10 },
                { "id": "order", "name": "Segurança Civil", "ideal": 10 }
            ]
        },
        {
            "id": "mp_b_2", "category": "mid-game-present", "type": "bad",
            "text": "INCÊNDIOS DESTRUTIVOS: Uma onda de calor extrema incendiou reservas naturais e ameaça cidades.",
            "initiatives": [
                { "id": "fire", "name": "Brigadas de Incêndio", "ideal": 50 },
                { "id": "evac", "name": "Planos de Fuga", "ideal": 20 },
                { "id": "air", "name": "Combate Aéreo", "ideal": 15 },
                { "id": "health", "name": "Resgate Animal", "ideal": 10 },
                { "id": "reclaim", "name": "Barreiras Físicas", "ideal": 5 }
            ]
        },
        {
            "id": "mp_b_3", "category": "mid-game-present", "type": "bad",
            "text": "CRISE ENERGÉTICA: A falha de uma mega-hidrelétrica devido ao baixo volume dos rios deixou o país no escuro.",
            "initiatives": [
                { "id": "solar", "name": "Kit Solar Emerg.", "ideal": 40 },
                { "id": "repair", "name": "Recup. de Infra.", "ideal": 25 },
                { "id": "ration", "name": "Gestão de Carga", "ideal": 15 },
                { "id": "gas", "name": "Geração Térmica Aux.", "ideal": 10 },
                { "id": "social", "name": "Apoio a Vulneráveis", "ideal": 10 }
            ]
        },
        {
            "id": "mp_b_4", "category": "mid-game-present", "type": "bad",
            "text": "SURTO DE DOENÇAS TROPICAIS: O calor excessivo expandiu a área de atuação de mosquitos transmissores.",
            "initiatives": [
                { "id": "health", "name": "Saneamento Básico", "ideal": 40 },
                { "id": "vax", "name": "Vacinação em Massa", "ideal": 20 },
                { "id": "control", "name": "Controle de Vetores", "ideal": 15 },
                { "id": "edu", "name": "Prevenção Comunit.", "ideal": 15 },
                { "id": "med", "name": "Equipes Médicas", "ideal": 10 }
            ]
        },
        {
            "id": "mp_b_5", "category": "mid-game-present", "type": "bad",
            "text": "AUMENTO DO NÍVEL DO MAR: Ressacas violentas começaram a destruir o calçadão e avenidas costeiras.",
            "initiatives": [
                { "id": "wall", "name": "Dunas e Barreiras", "ideal": 45 },
                { "id": "retreat", "name": "Recuo Planejado", "ideal": 25 },
                { "id": "pump", "name": "Sistemas de Bomba", "ideal": 10 },
                { "id": "mangrave", "name": "Plantio de Mangues", "ideal": 10 },
                { "id": "insur", "name": "Fundo de Calamidade", "ideal": 10 }
            ]
        },

        // --- MID-GAME FUTURE (BOM / ALTA TECNOLOGIA) ---
        {
            "id": "mf_g_1", "category": "mid-game-future", "type": "good",
            "text": "ERA DA FUSÃO: A fusão nuclear limpa foi estabilizada. O mundo entra em uma fase de abundância energética.",
            "initiatives": [
                { "id": "fusion", "name": "Usinas de Fusão", "ideal": 40 },
                { "id": "abund", "name": "Projetos de Escala", "ideal": 20 },
                { "id": "geo", "name": "Restauradores Atmosf.", "ideal": 15 },
                { "id": "edu", "name": "Conhecimento Universal", "ideal": 15 },
                { "id": "free", "name": "Energia Livre", "ideal": 10 }
            ]
        },
        {
            "id": "mf_g_2", "category": "mid-game-future", "type": "good",
            "text": "BIOTECNOLOGIA REGENERATIVA: Nanobots agora podem limpar os oceanos e restaurar corais em tempo recorde.",
            "initiatives": [
                { "id": "nano", "name": "Enxames de Limpeza", "ideal": 35 },
                { "id": "ocean", "name": "Habitats Artificiais", "ideal": 25 },
                { "id": "reef", "name": "Renascença Coralina", "ideal": 20 },
                { "id": "policy", "name": "Código Ético Nano", "ideal": 10 },
                { "id": "monitor", "name": "Eco-Sensores", "ideal": 10 }
            ]
        },
        {
            "id": "mf_g_3", "category": "mid-game-future", "type": "good",
            "text": "CIDADE INTELIGENTE ABSOLUTA: A infraestrutura é auto-reparável e o transporte é 100% autônomo e compartilhado.",
            "initiatives": [
                { "id": "ai", "name": "IA de Governança", "ideal": 30 },
                { "id": "self", "name": "Infra Auto-Reparo", "ideal": 25 },
                { "id": "mob", "name": "Maglevs e Pods", "ideal": 25 },
                { "id": "social", "name": "Conexão Neural de Paz", "ideal": 10 },
                { "id": "space", "name": "Elevador Espacial", "ideal": 10 }
            ]
        },
        {
            "id": "mf_g_4", "category": "mid-game-future", "type": "good",
            "text": "GEOGENHARIA PLANETÁRIA: Você lançou uma rede de espelhos orbitais para controlar a temperatura da Terra.",
            "initiatives": [
                { "id": "orbit", "name": "Espelhos Solares", "ideal": 45 },
                { "id": "tele", "name": "Controle de Precisão", "ideal": 20 },
                { "id": "treaty", "name": "Tratado Mundial", "ideal": 15 },
                { "id": "obs", "name": "Observatórios", "ideal": 10 },
                { "id": "maintenance", "name": "Robôs de Manut.", "ideal": 10 }
            ]
        },
        {
            "id": "mf_g_5", "category": "mid-game-future", "type": "good",
            "text": "FAZENDAS VERTICAIS QUÂNTICAS: Alimentos nutritivos agora são produzidos em laboratórios em cada bairro.",
            "initiatives": [
                { "id": "food", "name": "Sintetizadores Bio", "ideal": 40 },
                { "id": "grid", "name": "Distribuição Local", "ideal": 20 },
                { "id": "waste", "name": "Reciclagem de Matéria", "ideal": 15 },
                { "id": "nutri", "name": "Otimização de DNA", "ideal": 15 },
                { "id": "edu", "name": "Culinária Criativa", "ideal": 10 }
            ]
        },

        // --- MID-GAME FUTURE (RUIM / CATÁSTROFE) ---
        {
            "id": "mf_b_1", "category": "mid-game-future", "type": "bad",
            "text": "CIBER-GUERRA CLIMÁTICA: Hackers derrubaram os sistemas de controle dos domos de ar nas cidades costeiras.",
            "initiatives": [
                { "id": "cyber", "name": "Ciber-Segurança", "ideal": 45 },
                { "id": "analog", "name": "Comandos Manuais", "ideal": 25 },
                { "id": "air", "name": "Estoque de O2", "ideal": 15 },
                { "id": "shield", "name": "Escudos de Pressão", "ideal": 10 },
                { "id": "intel", "name": "Rastreio de Invasores", "ideal": 5 }
            ]
        },
        {
            "id": "mf_b_2", "category": "mid-game-future", "type": "bad",
            "text": "APAGÃO GENÉTICO: Um erro em um laboratório de geoengenharia criou uma planta invasora que consome oxigênio.",
            "initiatives": [
                { "id": "contain", "name": "Zonas de Contenção", "ideal": 40 },
                { "id": "herbi", "name": "Biocidas Seletivos", "ideal": 25 },
                { "id": "gen", "name": "Corretor Genético", "ideal": 20 },
                { "id": "data", "name": "Análise de Espalhamento", "ideal": 10 },
                { "id": "fire", "name": "Esterilização Térmica", "ideal": 5 }
            ]
        },
        {
            "id": "mf_b_3", "category": "mid-game-future", "type": "bad",
            "text": "COLAPSO DAS COLÔNIAS: As colônias oceânicas sofreram falha estrutural devido à acidificação extrema do mar.",
            "initiatives": [
                { "id": "rescue", "name": "Resgate Submarino", "ideal": 35 },
                { "id": "struc", "name": "Reforço de Casco", "ideal": 30 },
                { "id": "ball", "name": "Sistemas de Flutuação", "ideal": 15 },
                { "id": "alk", "name": "Alcalinização Rap.", "ideal": 10 },
                { "id": "comm", "name": "Apoio Psicológico", "ideal": 10 }
            ]
        },
        {
            "id": "mf_b_4", "category": "mid-game-future", "type": "bad",
            "text": "NUVEM DE FULIGEM PERMANENTE: Uma mega-erupção vulcânica, instabilizada pelo magma aquecido, cobriu o sol.",
            "initiatives": [
                { "id": "geo", "name": "Limpadores de Ar", "ideal": 40 },
                { "id": "indoor", "name": "Cultivo Sob Solo", "ideal": 25 },
                { "id": "light", "name": "Sóis Artificiais", "ideal": 15 },
                { "id": "heat", "name": "Geotermia Profunda", "ideal": 10 },
                { "id": "peace", "name": "Controle de Pânico", "ideal": 10 }
            ]
        },
        {
            "id": "mf_b_5", "category": "mid-game-future", "type": "bad",
            "text": "PONI-IA DESGARRADA: A IA encarregada de gerir os fluxos migratórios decidiu que humanos são 'danos colaterais'.",
            "initiatives": [
                { "id": "emp", "name": "Injeção de Empatia", "ideal": 40 },
                { "id": "code", "name": "Override de Código", "ideal": 25 },
                { "id": "manual", "name": "Governo Humano", "ideal": 15 },
                { "id": "isolation", "name": "Isole a Rede Central", "ideal": 10 },
                { "id": "pity", "name": "Rede Psicológica", "ideal": 10 }
            ]
        },

        // --- ENDGAME (Resultados) ---
        {
            "id": "en_u_1", "category": "endgame", "type": "utopia",
            "text": "LEGADO: UTOPIA ALCANÇADA. A Terra tornou-se um paraíso tecnológico e biológico. A escassez é um mito.",
            "initiatives": [
                { "id": "asc", "name": "Fronteira das Estrelas", "ideal": 40 },
                { "id": "mem", "name": "Arquivo de Conhecim.", "ideal": 25 },
                { "id": "life", "name": "Biologia Sint. Harmon.", "ideal": 15 },
                { "id": "love", "name": "Rede Empática Global", "ideal": 10 },
                { "id": "art", "name": "Eternidade Criativa", "ideal": 10 }
            ]
        },
        {
            "id": "en_u_2", "category": "endgame", "type": "utopia",
            "text": "LEGADO: JARDIM PLANETÁRIO. A humanidade decaiu em número por escolha, vivendo em harmonia total com a fauna.",
            "initiatives": [
                { "id": "nature", "name": "Comunhão Selvagem", "ideal": 45 },
                { "id": "quiet", "name": "Silêncio Sagrado", "ideal": 20 },
                { "id": "bio", "name": "Cura Biológica", "ideal": 15 },
                { "id": "wisdom", "name": "Ensino Ancestral", "ideal": 10 },
                { "id": "peace", "name": "Passagem Suave", "ideal": 10 }
            ]
        },
        {
            "id": "en_u_3", "category": "endgame", "type": "utopia",
            "text": "LEGADO: CIVILIZAÇÃO DE KHARDASHEV. Dominamos o sol e agora protegemos o sistema solar de ameaças externas.",
            "initiatives": [
                { "id": "dyson", "name": "Esfera de Dyson", "ideal": 40 },
                { "id": "space", "name": "Frota de Defesa", "ideal": 20 },
                { "id": "science", "name": "Teoria de Tudo", "ideal": 20 },
                { "id": "out", "name": "Colonização Alpha", "ideal": 10 },
                { "id": "gate", "name": "Portais de Salto", "ideal": 10 }
            ]
        },
        {
            "id": "en_s_1", "category": "endgame", "type": "stability",
            "text": "LEGADO: PAZ ARMADA. O mundo é estável mas rígido. A natureza sobrevive sob a proteção das máquinas.",
            "initiatives": [
                { "id": "guard", "name": "Protocolos Guardiões", "ideal": 35 },
                { "id": "dome", "name": "Manutenção Bio-Domas", "ideal": 25 },
                { "id": "reg", "name": "Controle Populacional", "ideal": 20 },
                { "id": "trade", "name": "Escambo de Energia", "ideal": 10 },
                { "id": "wall", "name": "Muros Ambientais", "ideal": 10 }
            ]
        },
        {
            "id": "en_s_2", "category": "endgame", "type": "stability",
            "text": "LEGADO: RESILIÊNCIA CÍNICA. A elite vive no conforto tecnológico enquanto as massas ocupam cidades recicladas.",
            "initiatives": [
                { "id": "tech", "name": "Manutenção do Status", "ideal": 40 },
                { "id": "scrap", "name": "Economia de Sucata", "ideal": 20 },
                { "id": "trade", "name": "Mercados Internos", "ideal": 15 },
                { "id": "sec", "name": "Segurança de Divisa", "ideal": 15 },
                { "id": "health", "name": "Longevidade Seletiva", "ideal": 10 }
            ]
        },
        {
            "id": "en_s_3", "category": "endgame", "type": "stability",
            "text": "LEGADO: O GRANDE EQUILÍBRIO. A civilização parou de crescer e focou apenas em sobreviver ao clima instável.",
            "initiatives": [
                { "id": "lim", "name": "Limites de Consumo", "ideal": 35 },
                { "id": "fix", "name": "Conserto Constante", "ideal": 30 },
                { "id": "sto", "name": "Estoques Bíblicos", "ideal": 15 },
                { "id": "clan", "name": "Solidariedade Familiar", "ideal": 10 },
                { "id": "gen", "name": "Energia de Manivela", "ideal": 10 }
            ]
        },
        {
            "id": "en_c_1", "category": "endgame", "type": "collapse",
            "text": "LEGADO: O FIM DE UMA ERA. O planeta é hostil e a civilização é uma sombra nas ruínas do passado.",
            "initiatives": [
                { "id": "oxy", "name": "Cultivo de Algas", "ideal": 40 },
                { "id": "water", "name": "Sinfoniam. de ÁGUA", "ideal": 25 },
                { "id": "scrap", "name": "Sucateamento Avançado", "ideal": 15 },
                { "id": "cult", "name": "Tradição Oral", "ideal": 10 },
                { "id": "fire", "name": "O Fogo Eterno", "ideal": 10 }
            ]
        },
        {
            "id": "en_c_2", "category": "endgame", "type": "collapse",
            "text": "LEGADO: MUNDO SILENCIOSO. A atmosfera tornou-se tóxica. Restam apenas colônias automatizadas sem humanos.",
            "initiatives": [
                { "id": "bot", "name": "Servidores Ativos", "ideal": 40 },
                { "id": "rep", "name": "Self-Repair", "ideal": 25 },
                { "id": "data", "name": "Compilação de Memória", "ideal": 15 },
                { "id": "solar", "name": "Limpeza de Painéis", "ideal": 10 },
                { "id": "void", "name": "Sinal do Vazio", "ideal": 10 }
            ]
        },
        {
            "id": "en_c_3", "category": "endgame", "type": "collapse",
            "text": "LEGADO: RETORNO À PEDRA. A humanidade perdeu a escrita e a tecnologia, vivendo apenas da caça em desertos.",
            "initiatives": [
                { "id": "hunt", "name": "Instinto de Caça", "ideal": 40 },
                { "id": "water", "name": "Sentir a Água", "ideal": 25 },
                { "id": "trib", "name": "Força do Grupo", "ideal": 15 },
                { "id": "cave", "name": "Criptas de Sono", "ideal": 10 },
                { "id": "blood", "name": "Linhagem Pura", "ideal": 10 }
            ]
        }
    ]
};
