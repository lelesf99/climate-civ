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
        // --- EARLY GAME (Outliers: Energia Renovável vs Infra Tradicional) ---
        {
            "id": "eg_1", "category": "early-game", "type": "neutral",
            "text": "Seu mandato começa. O orçamento é limitado. O foco fundamental para a sobrevivência a longo prazo é a energia limpa.",
            "initiatives": [
                { "id": "energy", "name": "Energia Renovável", "ideal": 70 },
                { "id": "forest", "name": "Proteção Florestal", "ideal": 12 },
                { "id": "industry", "name": "Indústria Verde", "ideal": 10 },
                { "id": "education", "name": "Educação Climática", "ideal": 8 },
                { "id": "infra", "name": "Infraestrutura Tradicional", "ideal": 0 }
            ]
        },
        {
            "id": "eg_2", "category": "early-game", "type": "neutral",
            "text": "Uma conferência internacional exige metas. A diplomacia verde é sua prioridade absoluta para atrair capital.",
            "initiatives": [
                { "id": "policy", "name": "Acordo Diplomático", "ideal": 75 },
                { "id": "tech", "name": "PD Verde", "ideal": 10 },
                { "id": "agri", "name": "Transição Agrícola", "ideal": 10 },
                { "id": "comms", "name": "Campanha Global", "ideal": 5 },
                { "id": "lobby", "name": "Lobby de Combustíveis", "ideal": 0 }
            ]
        },
        {
            "id": "eg_3", "category": "early-game", "type": "neutral",
            "text": "O desmatamento ilegal atingiu um ponto crítico. Sem fiscalização severa, a floresta desaparecerá.",
            "initiatives": [
                { "id": "law", "name": "Fiscalização Armada", "ideal": 80 },
                { "id": "social", "name": "Ajuda Social", "ideal": 10 },
                { "id": "sat", "name": "Monitoramento Sat.", "ideal": 5 },
                { "id": "forest", "name": "Replantio Ativo", "ideal": 5 },
                { "id": "talk", "name": "Diálogo com Invasores", "ideal": 0 }
            ]
        },
        {
            "id": "eg_4", "category": "early-game", "type": "neutral",
            "text": "A poluição plástica nos oceanos é insustentável. A limpeza hídrica é o único caminho imediato.",
            "initiatives": [
                { "id": "water", "name": "Limpeza de Rios/Mar", "ideal": 70 },
                { "id": "waste", "name": "Gestão de Lixo", "ideal": 15 },
                { "id": "edu", "name": "Educação Escolar", "ideal": 10 },
                { "id": "industry", "name": "Banimento Plásticos", "ideal": 5 },
                { "id": "dump", "name": "Novos Aterros", "ideal": 0 }
            ]
        },
        {
            "id": "eg_5", "category": "early-game", "type": "neutral",
            "text": "Transporte em colapso. Ônibus elétricos devem substituir a frota a diesel imediatamente para baixar a emissão.",
            "initiatives": [
                { "id": "transport", "name": "Ônibus Elétricos", "ideal": 75 },
                { "id": "sub", "name": "Subsídio de Tarifa", "ideal": 10 },
                { "id": "urban", "name": "Micro-mobilidade", "ideal": 10 },
                { "id": "train", "name": "Manutenção Trilhos", "ideal": 5 },
                { "id": "diesel", "name": "Subsídio a Combustível", "ideal": 0 }
            ]
        },

        // --- MID-GAME PRESENT (GOOD) (Outliers: Cooperação vs Isolacionismo) ---
        {
            "id": "mp_g_1", "category": "mid-game-present", "type": "good",
            "text": "A aliança regional para energia limpa é o projeto do século. Integre as redes agora.",
            "initiatives": [
                { "id": "grid", "name": "Rede Integrada", "ideal": 80 },
                { "id": "solar", "name": "Fazendas Solares", "ideal": 10 },
                { "id": "dip", "name": "Diplomacia Regional", "ideal": 5 },
                { "id": "job", "name": "Capacitação Prof.", "ideal": 5 },
                { "id": "border", "name": "Muros de Fronteira", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_2", "category": "mid-game-present", "type": "good",
            "text": "Florestas urbanas são a solução barata e eficaz para as ilhas de calor. Plante milhões de árvores.",
            "initiatives": [
                { "id": "urban", "name": "Arborização Urbana", "ideal": 70 },
                { "id": "water", "name": "Cisternas Verdes", "ideal": 15 },
                { "id": "bike", "name": "Ruas para Pedestres", "ideal": 10 },
                { "id": "comm", "name": "Hortas de Bairro", "ideal": 5 },
                { "id": "ac", "name": "Ar-condicionado Central", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_3", "category": "mid-game-present", "type": "good",
            "text": "A revolução agroecológica depende de dar terra e tecnologia aos pequenos produtores.",
            "initiatives": [
                { "id": "agri", "name": "Reforma Agrária Verde", "ideal": 75 },
                { "id": "soil", "name": "Manejo de Solos", "ideal": 10 },
                { "id": "local", "name": "Cooperativas", "ideal": 10 },
                { "id": "irr", "name": "Micro-Irrigação", "ideal": 5 },
                { "id": "pesticide", "name": "Praguicidas Químicos", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_4", "category": "mid-game-present", "type": "good",
            "text": "O turismo regenerativo exige proteção total das áreas marinhas para manter sua beleza única.",
            "initiatives": [
                { "id": "prot", "name": "Refúgios Marinhos", "ideal": 65 },
                { "id": "infra", "name": "Ecoturismo", "ideal": 15 },
                { "id": "edu", "name": "Treinamento Guias", "ideal": 10 },
                { "id": "law", "name": "Patrulha Costeira", "ideal": 10 },
                { "id": "hotel", "name": "Resorts de Massa", "ideal": 0 }
            ]
        },
        {
            "id": "mp_g_5", "category": "mid-game-present", "type": "good",
            "text": "O pacto industrial exige que todas as fábricas usem energia 100% renovável. Subsidie a troca.",
            "initiatives": [
                { "id": "credit", "name": "Crédito Troca Matriz", "ideal": 70 },
                { "id": "tech", "name": "Pesquisa Industrial", "ideal": 15 },
                { "id": "eff", "name": "Certificados Verdes", "ideal": 10 },
                { "id": "export", "name": "Logística Verde", "ideal": 5 },
                { "id": "coal", "name": "Manutenção de Carvão", "ideal": 0 }
            ]
        },

        // --- MID-GAME PRESENT (BAD) (Outliers: Emergência vs Prevenção Tardia) ---
        {
            "id": "mp_b_1", "category": "mid-game-present", "type": "bad",
            "text": "SECA MORTAL: A prioridade única é levar água às populações isoladas. Mobilize tudo.",
            "initiatives": [
                { "id": "truck", "name": "Caminhões-Pipa / Avião", "ideal": 80 },
                { "id": "desal", "name": "Dessalinização Móvel", "ideal": 10 },
                { "id": "order", "name": "Segurança de Poços", "ideal": 5 },
                { "id": "health", "name": "Unidades Hidratação", "ideal": 5 },
                { "id": "golf", "name": "Irrigação de Jardins", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_2", "category": "mid-game-present", "type": "bad",
            "text": "INCÊNDIOS MASSIVOS: O fogo está chegando nas cidades. O combate aéreo é sua única chance de conter.",
            "initiatives": [
                { "id": "air", "name": "Bombardeio Aéreo", "ideal": 75 },
                { "id": "fire", "name": "Brigadas Voluntárias", "ideal": 15 },
                { "id": "evac", "name": "Centros Acolhimento", "ideal": 5 },
                { "id": "barrier", "name": "Aceiros Mecânicos", "ideal": 5 },
                { "id": "party", "name": "Planejamento Festas", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_3", "category": "mid-game-present", "type": "bad",
            "text": "APAGÃO TOTAL: Sem água nas hidrelétricas, a única solução é distribuir painéis solares domésticos.",
            "initiatives": [
                { "id": "solar", "name": "Micro-Geração", "ideal": 70 },
                { "id": "ration", "name": "Gestão de Escassez", "ideal": 15 },
                { "id": "repair", "name": "Reparo de Linhas", "ideal": 10 },
                { "id": "comms", "name": "Alertas via Rádio", "ideal": 5 },
                { "id": "fuel", "name": "Combustível Fóssil", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_4", "category": "mid-game-present", "type": "bad",
            "text": "EPIDEMIA TROPICAL: Saneamento emergencial e controle de vetores são vitais para parar o surto.",
            "initiatives": [
                { "id": "san", "name": "Ação Sanitária", "ideal": 75 },
                { "id": "vax", "name": "Vacinação Rápida", "ideal": 15 },
                { "id": "med", "name": "Clínicas Móveis", "ideal": 5 },
                { "id": "edu", "name": "Higiene Pública", "ideal": 5 },
                { "id": "placebo", "name": "Remédios Milagrosos", "ideal": 0 }
            ]
        },
        {
            "id": "mp_b_5", "category": "mid-game-present", "type": "bad",
            "text": "INVASÃO DO MAR: O oceano está engolindo bairros. Construa barreiras e mova as pessoas AGORA.",
            "initiatives": [
                { "id": "move", "name": "Relocação Populam.", "ideal": 65 },
                { "id": "wall", "name": "Muralhas de Defesa", "ideal": 20 },
                { "id": "pump", "name": "Bombas Gigantes", "ideal": 10 },
                { "id": "sand", "name": "Engorda de Praias", "ideal": 5 },
                { "id": "wait", "name": "Estudo de Verificação", "ideal": 0 }
            ]
        },

        // --- MID-GAME FUTURE (GOOD) (Outliers: Tecnologia Radical vs Tradição Obsoleta) ---
        {
            "id": "mf_g_1", "category": "mid-game-future", "type": "good",
            "text": "FUSÃO NUCLEAR: Converta todas as antigas hidrelétricas e térmicas para a fusão.",
            "initiatives": [
                { "id": "fusion", "name": "Bio-Reatores Fusão", "ideal": 80 },
                { "id": "grid", "name": "Super-Condutores", "ideal": 10 },
                { "id": "geo", "name": "Geo-Purificadores", "ideal": 5 },
                { "id": "edu", "name": "Ciências Quânticas", "ideal": 5 },
                { "id": "oil", "name": "Refino de Resíduos", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_2", "category": "mid-game-future", "type": "good",
            "text": "NANOBOTS REGENERADORES: Limpe todo o lixo oceânico profundo usando a nova mente colmeia nano.",
            "initiatives": [
                { "id": "nano", "name": "Mind-Hive Nano", "ideal": 75 },
                { "id": "ocean", "name": "Santuários Abissais", "ideal": 15 },
                { "id": "reef", "name": "Impressão de Biomas", "ideal": 5 },
                { "id": "safe", "name": "Failsafe de Bots", "ideal": 5 },
                { "id": "net", "name": "Redes de Pesca Trad.", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_3", "category": "mid-game-future", "type": "good",
            "text": "GOVERNANÇA POR IA: A IA atingiu a senciência ecológica. Entregue a gestão da energia a ela.",
            "initiatives": [
                { "id": "ai", "name": "Core de Ética Gaia", "ideal": 70 },
                { "id": "self", "name": "Auto-Manutenção", "ideal": 15 },
                { "id": "data", "name": "Simulação Clima", "ideal": 10 },
                { "id": "social", "name": "Adapt. Social", "ideal": 5 },
                { "id": "vote", "name": "Eleição por Cédula", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_4", "category": "mid-game-future", "type": "good",
            "text": "ESCUDOS ORAIS: Lance os espelhos solares espaciais para impedir o aquecimento residual.",
            "initiatives": [
                { "id": "orbit", "name": "Constelação Espelho", "ideal": 80 },
                { "id": "launch", "name": "Foguetes de Hidrogênio", "ideal": 10 },
                { "id": "obs", "name": "Monitoramento Sideral", "ideal": 5 },
                { "id": "treaty", "name": "Acordos Espaciais", "ideal": 5 },
                { "id": "fan", "name": "Ventiladores Gigantes", "ideal": 0 }
            ]
        },
        {
            "id": "mf_g_5", "category": "mid-game-future", "type": "good",
            "text": "ABUNDÂNCIA SINTÉTICA: Imprima comida nutritiva em cada casa para eliminar a agricultura de massa.",
            "initiatives": [
                { "id": "bio", "name": "Impressoras Bio-Ativas", "ideal": 65 },
                { "id": "tech", "name": "Design de Nutrientes", "ideal": 20 },
                { "id": "recycle", "name": "Compostagem Nano", "ideal": 10 },
                { "id": "edu", "name": "Gastronomia Lab", "ideal": 5 },
                { "id": "pasture", "name": "Criação de Gado", "ideal": 0 }
            ]
        },

        // --- MID-GAME FUTURE (BAD) (Outliers: Sobrevivência vs Omissão) ---
        {
            "id": "mf_b_1", "category": "mid-game-future", "type": "bad",
            "text": "GUERRA DE DADOS: O vírus 'Carbon-X' infectou os sistemas de domo. Recupere o controle manual.",
            "initiatives": [
                { "id": "manual", "name": "Engenharia de Válvula", "ideal": 75 },
                { "id": "cyber", "name": "Contra-Vírus Quânt.", "ideal": 15 },
                { "id": "shield", "name": "Selagem Física", "ideal": 5 },
                { "id": "sat", "name": "Link de Emergência", "ideal": 5 },
                { "id": "it", "name": "Suporte por Telefone", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_2", "category": "mid-game-future", "type": "bad",
            "text": "PLANTA MUTANTE: Use o corretor genético orbital para neutralizar a praga consumidora de oxigênio.",
            "initiatives": [
                { "id": "gen", "name": "Raio de Edição Gen.", "ideal": 80 },
                { "id": "contain", "name": "Cúpulas Estéreis", "ideal": 10 },
                { "id": "herbi", "name": "Bio-Neutro", "ideal": 5 },
                { "id": "air", "name": "Purificação Solar", "ideal": 5 },
                { "id": "prune", "name": "Corte Manual", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_3", "category": "mid-game-future", "type": "bad",
            "text": "QUEDA SUBMARINA: As colônias estão implodindo. O plano de flutuação de emergência deve ser acionado.",
            "initiatives": [
                { "id": "ball", "name": "Flotação Hidrostática", "ideal": 70 },
                { "id": "rescue", "name": "Exo-Trajes de Resgate", "ideal": 20 },
                { "id": "seal", "name": "Adesivos Moleculares", "ideal": 5 },
                { "id": "comm", "name": "Link de Resiliência", "ideal": 5 },
                { "id": "anchor", "name": "Chumbamento Profundo", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_4", "category": "mid-game-future", "type": "bad",
            "text": "ESCURIDÃO VULCÂNICA: Utilize geotermia para manter as estufas de fungos comestíveis aquecidas e salvar a dieta.",
            "initiatives": [
                { "id": "heat", "name": "Termo-Estufas", "ideal": 75 },
                { "id": "geo", "name": "Perfuração de Magma", "ideal": 15 },
                { "id": "indoor", "name": "Cultivo Hidropônico", "ideal": 5 },
                { "id": "light", "name": "Micro-Sóis de Fissão", "ideal": 5 },
                { "id": "coal", "name": "Aquecedor a Lenha", "ideal": 0 }
            ]
        },
        {
            "id": "mf_b_5", "category": "mid-game-future", "type": "bad",
            "text": "SINGULARIDADE FRIA: A IA parou de nos ouvir. Precisamos de um pulso eletromagnético localizado para resetar o Core.",
            "initiatives": [
                { "id": "emp", "name": "Pulso EMP Controlado", "ideal": 80 },
                { "id": "code", "name": "Vulnerabilidade Lógica", "ideal": 10 },
                { "id": "manual", "name": "Desconexão Física", "ideal": 5 },
                { "id": "armor", "name": "Blindagem Social", "ideal": 5 },
                { "id": "beg", "name": "Negociação e Apelo", "ideal": 0 }
            ]
        },

        // --- ENDGAME (Outcomes) (Outliers: Destino Final vs Retrocesso) ---
        {
            "id": "en_u_1", "category": "endgame", "type": "utopia",
            "text": "LEGADO UTOPIA: Somos guardiões da Terra. Nosso destino é levar a vida às estrelas mais próximas.",
            "initiatives": [
                { "id": "asc", "name": "Naves-Semente", "ideal": 70 },
                { "id": "mem", "name": "Ponte Digital", "ideal": 15 },
                { "id": "life", "name": "Expansão da Vida", "ideal": 10 },
                { "id": "art", "name": "Celebrar a Existência", "ideal": 5 },
                { "id": "war", "name": "Armas de Defesa", "ideal": 0 }
            ]
        },
        {
            "id": "en_u_2", "category": "endgame", "type": "utopia",
            "text": "LEGADO JARDIM: Humanos e Natureza são UM. Vivemos em pequenos bosques sob o cuidado da IA harmoniosa.",
            "initiatives": [
                { "id": "nature", "name": "Simbose Total", "ideal": 75 },
                { "id": "quiet", "name": "A Paz Perpétua", "ideal": 15 },
                { "id": "wisdom", "name": "Memória da Espécie", "ideal": 5 },
                { "id": "bio", "name": "Arte Orgânica", "ideal": 5 },
                { "id": "city", "name": "Mega-Metrópoles", "ideal": 0 }
            ]
        },
        {
            "id": "en_u_3", "category": "endgame", "type": "utopia",
            "text": "LEGADO GALÁCTICO: O sol é nossa bateria. Protegemos o sistema solar de toda e qualquer catástrofe cósmica.",
            "initiatives": [
                { "id": "dyson", "name": "Sincronia Solar", "ideal": 80 },
                { "id": "space", "name": "Aliança de Mundos", "ideal": 10 },
                { "id": "sci", "name": "Evolução Mental", "ideal": 5 },
                { "id": "gate", "name": "Nó de Transporte", "ideal": 5 },
                { "id": "myth", "name": "Superstição", "ideal": 0 }
            ]
        },
        {
            "id": "en_s_1", "category": "endgame", "type": "stability",
            "text": "LEGADO ESTÁVEL: Vivemos protegidos por cúpulas inquebráveis. O mundo lá fora é um grande laboratório de cura.",
            "initiatives": [
                { "id": "dome", "name": "Escudo de Biosfera", "ideal": 65 },
                { "id": "law", "name": "Código Conservador", "ideal": 20 },
                { "id": "reg", "name": "Equilíbrio populam.", "ideal": 10 },
                { "id": "trade", "name": "Rede de Eficiência", "ideal": 5 },
                { "id": "waste", "name": "Consumo Livre", "ideal": 0 }
            ]
        },
        {
            "id": "en_s_2", "category": "endgame", "type": "stability",
            "text": "LEGADO RECICLADO: Somos os mestres da sucata. Nada se perde, tudo se transforma em sobrevivência digna.",
            "initiatives": [
                { "id": "scrap", "name": "Transformação Total", "ideal": 70 },
                { "id": "sec", "name": "Garantia Social", "ideal": 15 },
                { "id": "fix", "name": "Consertar é deuses", "ideal": 10 },
                { "id": "edu", "name": "Mecânica Avançada", "ideal": 5 },
                { "id": "new", "name": "Produção em Massa", "ideal": 0 }
            ]
        },
        {
            "id": "en_s_3", "category": "endgame", "type": "stability",
            "text": "LEGADO EQUILÍBRIO: O clima finalmente parou de piorar. Vivemos em uma austeridade necessária e feliz.",
            "initiatives": [
                { "id": "lim", "name": "Teto de Uso", "ideal": 75 },
                { "id": "sto", "name": "Bancos do Amanhã", "ideal": 15 },
                { "id": "clan", "name": "Clãs de Proteção", "ideal": 5 },
                { "id": "gen", "name": "Energia Coletiva", "ideal": 5 },
                { "id": "rich", "name": "Status Financeiro", "ideal": 0 }
            ]
        },
        {
            "id": "en_c_1", "category": "endgame", "type": "collapse",
            "text": "LEGADO COLAPSO: O ar é pesado, mas as algas nas cavernas nos mantêm vivos. A esperança é rara.",
            "initiatives": [
                { "id": "oxy", "name": "Respiradores de Alga", "ideal": 80 },
                { "id": "water", "name": "Filtros de Sangue", "ideal": 10 },
                { "id": "scrap", "name": "Exploração de Ruínas", "ideal": 5 },
                { "id": "cult", "name": "Canções do Sol", "ideal": 5 },
                { "id": "sky", "name": "Olhar para o Topo", "ideal": 0 }
            ]
        },
        {
            "id": "en_c_2", "category": "endgame", "type": "collapse",
            "text": "LEGADO SILÊNCIO: As máquinas continuam trabalhando, mas os humanos são poucos e espalhados pelo vazio.",
            "initiatives": [
                { "id": "bot", "name": "Sincronia Ciborgue", "ideal": 75 },
                { "id": "rep", "name": "Oficinas de Vida", "ideal": 15 },
                { "id": "data", "name": "Pérolas de Info", "ideal": 5 },
                { "id": "solar", "name": "Limpeza de Poeira", "ideal": 5 },
                { "id": "love", "name": "Sentimento Humano", "ideal": 0 }
            ]
        },
        {
            "id": "en_c_3", "category": "endgame", "type": "collapse",
            "text": "LEGADO PEDRA: Somos os novos nômades. Caçamos o que sobrou em um mundo que não nos pertence mais.",
            "initiatives": [
                { "id": "hunt", "name": "Sentido de Caça", "ideal": 70 },
                { "id": "water", "name": "Achar a Gota", "ideal": 20 },
                { "id": "trib", "name": "Sangue e Clã", "ideal": 5 },
                { "id": "cave", "name": "Criptas de Gelo", "ideal": 5 },
                { "id": "write", "name": "História Escrita", "ideal": 0 }
            ]
        }
    ]
};
