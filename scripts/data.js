window.GAME_DATA = {
    "config": {
        "maxRounds": 3,
        "scenariosPerRound": 2,
        "timerSeconds": 90,
        "maxResources": 100,
        "initiativeCount": 5
    },
    "rounds": [
        { "name": "ERA PRESENTE (2025)", "desc": "Equilibrando o crescimento e a preservação." },
        { "name": "FUTURO PRÓXIMO (2050)", "desc": "Gerenciando a crise climática instalada." },
        { "name": "FUTURO DISTANTE (2100)", "desc": "A sobrevivência da espécie em jogo." }
    ],
    "scenarios": [
        // ROUND 1 SCENARIOS (2025)
        {
            "id": "s1_1", "round": 1,
            "text": "O país enfrenta um pico de demanda energética e desmatamento crescente. Como você distribuirá 100 pontos de recursos?",
            "initiatives": [
                { "id": "energy", "name": "Energia Renovável", "ideal": 35 },
                { "id": "forest", "name": "Reflorestamento", "ideal": 25 },
                { "id": "industry", "name": "Eficiência Industrial", "ideal": 15 },
                { "id": "education", "name": "Educação Climática", "ideal": 15 },
                { "id": "tech", "name": "Inovação Verde", "ideal": 10 }
            ]
        },
        {
            "id": "s1_2", "round": 1,
            "text": "A poluição dos oceanos e o desperdício de água nas cidades atingiram níveis críticos.",
            "initiatives": [
                { "id": "waste", "name": "Gestão de Resíduos", "ideal": 30 },
                { "id": "water", "name": "Infraestrutura Hídrica", "ideal": 25 },
                { "id": "ocean", "name": "Limpeza Oceânica", "ideal": 20 },
                { "id": "policy", "name": "Leis Ambientais", "ideal": 15 },
                { "id": "agri", "name": "Agroecologia", "ideal": 10 }
            ]
        },

        // ROUND 2 SCENARIOS (2050)
        {
            "id": "s2_1", "round": 2,
            "text": "O nível do mar subiu e refugiados climáticos buscam novas áreas de habitação.",
            "initiatives": [
                { "id": "urban", "name": "Cidades Resilientes", "ideal": 30 },
                { "id": "migration", "name": "Apoio Migratório", "ideal": 25 },
                { "id": "coastal", "name": "Defesa Costeira", "ideal": 20 },
                { "id": "carbon", "name": "Captura de Carbono", "ideal": 15 },
                { "id": "health", "name": "Saúde Pública", "ideal": 10 }
            ]
        },
        {
            "id": "s2_2", "round": 2,
            "text": "Ondas de calor severas prejudicam a colheita global e a saúde urbana.",
            "initiatives": [
                { "id": "food", "name": "Segurança Alimentar", "ideal": 35 },
                { "id": "cooling", "name": "Resfriamento Urbano", "ideal": 20 },
                { "id": "grid", "name": "Rede Elétrica Offline", "ideal": 15 },
                { "id": "bio", "name": "Preservação Biomas", "ideal": 20 },
                { "id": "emergency", "name": "Serviços Emergência", "ideal": 10 }
            ]
        },

        // ROUND 3 SCENARIOS (2100)
        {
            "id": "s3_1", "round": 3,
            "text": "O sistema terrestre está em ponto de ruptura. A sobrevivência requer escolhas drásticas.",
            "initiatives": [
                { "id": "survival", "name": "Bunkers Autossuficientes", "ideal": 15 },
                { "id": "geo", "name": "Geoengenharia", "ideal": 30 },
                { "id": "ecosystem", "name": "Restauração Radical", "ideal": 25 },
                { "id": "resource", "name": "Economia Circular", "ideal": 20 },
                { "id": "space", "name": "Exploração Espacial", "ideal": 10 }
            ]
        },
        {
            "id": "s3_2", "round": 3,
            "text": "Última chance: Como a humanidade será lembrada e qual o legado deixaremos?",
            "initiatives": [
                { "id": "archive", "name": "Arquivo Digital Global", "ideal": 20 },
                { "id": "seed", "name": "Banco de Sementes", "ideal": 25 },
                { "id": "culture", "name": "Preservação Cultural", "ideal": 15 },
                { "id": "ai", "name": "Governança por IA", "ideal": 20 },
                { "id": "colony", "name": "Colônias Oceânicas", "ideal": 20 }
            ]
        }
    ]
};
