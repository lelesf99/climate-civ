window.GAME_DATA = {
    "config": {
        "maxRounds": 3,
        "questionsPerPlayerPerRound": 2,
        "meterMin": -1,
        "meterMax": 1
    },
    "disasters": [
        { "id": "earthquake", "name": "TERREMOTO SÍSMICO", "class": "disaster-earthquake", "description": "Tremores dificultam a leitura!" },
        { "id": "flood", "name": "INUNDAÇÃO", "class": "disaster-flood", "description": "A inundação levou algumas palavras..." },
        { "id": "fire", "name": "ONDA DE CALOR", "class": "disaster-fire", "description": "O tempo está queimando rápido!" },
        { "id": "smog", "name": "SMOG TÓXICO", "class": "disaster-smog", "description": "Visibilidade reduzida!" }
    ],
    "rounds": [
        { "name": "ERA PRESENTE (2025)", "desc": "O ponto de não retorno se aproxima." },
        { "name": "FUTURO PRÓXIMO (2050)", "desc": "As consequências começam a surgir." },
        { "name": "FUTURO DISTANTE (2100)", "desc": "A luta pela sobrevivência final." }
    ],
    "questions": [
        // ROUND 1 QUESTIONS
        {
            "id": "q1_1", "round": 1,
            "text": "A demanda por energia disparou. Qual a sua política energética imediata?",
            "options": [
                { "text": "Reativar usinas de carvão (Rápido/Barato)", "score": -1 },
                { "text": "Manter mix atual (Gás/Hidro)", "score": 0 },
                { "text": "Investir pesado em Solar/Eólica (Caro)", "score": 1 },
                { "text": "Subsídio para petróleo", "score": -1 }
            ]
        },
        {
            "id": "q1_2", "round": 1,
            "text": "Uma floresta tropical está sendo desmatada para pasto. O que fazer?",
            "options": [
                { "text": "Ignorar (Bom para economia local)", "score": -1 },
                { "text": "Fiscalização padrão", "score": 0 },
                { "text": "Criar área de proteção integral", "score": 1 },
                { "text": "Incentivar mais pasto", "score": -1 }
            ]
        },
        {
            "id": "q1_3", "round": 1,
            "text": "O trânsito nas metrópoles está caótico.",
            "options": [
                { "text": "Construir mais viadutos", "score": -1 },
                { "text": "Expandir metrô (Lento)", "score": 1 },
                { "text": "Incentivar carros elétricos", "score": 0 },
                { "text": "Transporte público gratuito", "score": 1 }
            ]
        },
        {
            "id": "q1_4", "round": 1,
            "text": "Resíduos plásticos estão enchendo os oceanos.",
            "options": [
                { "text": "Banir plásticos de uso único", "score": 1 },
                { "text": "Campanha de reciclagem", "score": 0 },
                { "text": "Enviar lixo para outro país", "score": -1 },
                { "text": "Queimar o lixo", "score": -1 }
            ]
        },
         {
            "id": "q1_5", "round": 1,
            "text": "A agricultura precisa produzir mais comida.",
            "options": [
                { "text": "Uso intensivo de agrotóxicos", "score": -1 },
                { "text": "Agrofloresta e orgânicos", "score": 1 },
                { "text": "Monocultura expandida", "score": -1 },
                { "text": "Transgênicos resistentes", "score": 0 }
            ]
        },
        {
            "id": "q1_6", "round": 1,
            "text": "Secas afetam o abastecimento de água.",
            "options": [
                { "text": "Racionamento severo", "score": 0 },
                { "text": "Desviar rios de áreas vizinhas", "score": -1 },
                { "text": "Reuso e captação de chuva", "score": 1 },
                { "text": "Perfurar aquíferos profundos", "score": -1 }
            ]
        },
        {
            "id": "q1_7", "round": 1,
            "text": "Indústrias ameaçam sair do país por leis ambientais.",
            "options": [
                { "text": "Relaxar as leis para manter empregos", "score": -1 },
                { "text": "Manter leis e perder alguns empregos", "score": 1 },
                { "text": "Subsídio para ficarem", "score": -1 },
                { "text": "Incentivos verdes para transição", "score": 1 }
            ]
        },
        {
            "id": "q1_8", "round": 1,
            "text": "Populismo anti-ciência cresce.",
            "options": [
                { "text": "Investir em educação climática", "score": 1 },
                { "text": "Ignorar", "score": -1 },
                { "text": "Debater na TV", "score": 0 },
                { "text": "Censurar cientistas", "score": -1 }
            ]
        },

        // ROUND 2
        {
            "id": "q2_1", "round": 2,
            "text": "Nível do mar subiu e ameaça cidades costeiras.",
            "options": [
                { "text": "Construir muros gigantes (Diques)", "score": 0 },
                { "text": "Abandonar a costa (Migração)", "score": 1 },
                { "text": "Aterrar o mar (Ilhas artificiais)", "score": -1 },
                { "text": "Ignorar avisos", "score": -1 }
            ]
        },
        {
            "id": "q2_2", "round": 2,
            "text": "Refugiados climáticos pedem asilo.",
            "options": [
                { "text": "Fechar fronteiras", "score": -1 },
                { "text": "Criar campos temporários", "score": 0 },
                { "text": "Integrar na sociedade", "score": 1 },
                { "text": "Deportação em massa", "score": -1 }
            ]
        },
        {
            "id": "q2_3", "round": 2,
            "text": "Escassez de carne bovina global.",
            "options": [
                { "text": "Carne de laboratório", "score": 1 },
                { "text": "Racionamento", "score": 0 },
                { "text": "Desmatar para mais gado", "score": -1 },
                { "text": "Liberar caça", "score": -1 }
            ]
        },
        {
            "id": "q2_4", "round": 2,
            "text": "Pandemias virais são frequentes.",
            "options": [
                { "text": "Isolamento total", "score": 0 },
                { "text": "Ignorar e manter economia", "score": -1 },
                { "text": "Sistema de saúde universal", "score": 1 },
                { "text": "Culpar outros países", "score": -1 }
            ]
        },
         {
            "id": "q2_5", "round": 2,
            "text": "Colapso das abelhas e polinizadores.",
            "options": [
                { "text": "Polinização robótica (Drones)", "score": 0 },
                { "text": "Restaurar habitats naturais", "score": 1 },
                { "text": "Usar mais pesticidas", "score": -1 },
                { "text": "Importar abelhas", "score": 0 }
            ]
        },
        {
            "id": "q2_6", "round": 2,
            "text": "Calor extremo torna cidades inabitáveis de dia.",
            "options": [
                { "text": "Mudar vida para a noite", "score": 0 },
                { "text": "Ar-condicionado massivo (Gasta energia)", "score": -1 },
                { "text": "Cidades subterrâneas", "score": 0 },
                { "text": "Florestas urbanas e tetos verdes", "score": 1 }
            ]
        },
        {
            "id": "q2_7", "round": 2,
            "text": "Guerra por água potável no continente.",
            "options": [
                { "text": "Entrar na guerra para garantir água", "score": -1 },
                { "text": "Negociar tratado de paz e partilha", "score": 1 },
                { "text": "Vender água por armas", "score": -1 },
                { "text": "Isolacionismo", "score": 0 }
            ]
        },
        {
            "id": "q2_8", "round": 2,
            "text": "Tecnologia de Geoengenharia disponível (risco alto).",
            "options": [
                { "text": "Bloquear o sol com aerossóis", "score": -1 },
                { "text": "Captura de carbono direta", "score": 1 },
                { "text": "Não intervir", "score": 0 },
                { "text": "Testar sem aprovação global", "score": -1 }
            ]
        },

        // ROUND 3
        {
            "id": "q3_1", "round": 3,
            "text": "A civilização está à beira do colapso.",
            "options": [
                { "text": "Autoritarismo militar", "score": -1 },
                { "text": "Comunidades autossustentáveis", "score": 1 },
                { "text": "Colônia em Marte (Foge a elite)", "score": -1 },
                { "text": "Anarquia", "score": -1 }
            ]
        },
        {
            "id": "q3_2", "round": 3,
            "text": "Últimas reservas de petróleo encontradas no Ártico.",
            "options": [
                { "text": "Explorar tudo", "score": -1 },
                { "text": "Deixar no solo", "score": 1 },
                { "text": "Usar apenas para emergência", "score": 0 },
                { "text": "Vender para financiar guerras", "score": -1 }
            ]
        },
         {
            "id": "q3_3", "round": 3,
            "text": "IA controla a distribuição de recursos.",
            "options": [
                { "text": "Desligar a IA", "score": 0 },
                { "text": "Obedecer cegamente", "score": 0 },
                { "text": "Reprogramar para priorizar elite", "score": -1 },
                { "text": "Colaboração Humano-IA ética", "score": 1 }
            ]
        },
        {
            "id": "q3_4", "round": 3,
            "text": "Tempestades solares destroem a rede elétrica.",
            "options": [
                { "text": "Reconstruir com combustíveis fósseis", "score": -1 },
                { "text": "Rede descentralizada renovável", "score": 1 },
                { "text": "Voltar à era pré-industrial", "score": 0 },
                { "text": "Roubar energia de vizinhos", "score": -1 }
            ]
        },
        {
            "id": "q3_5", "round": 3,
            "text": "Clonagem de espécies extintas possível.",
            "options": [
                { "text": "Clonar Mamutes (Turismo)", "score": 0 },
                { "text": "Restaurar ecossistemas chave", "score": 1 },
                { "text": "Clonar mão de obra barata", "score": -1 },
                { "text": "Proibir a tecnologia", "score": 0 }
            ]
        },
        {
            "id": "q3_6", "round": 3,
            "text": "Superpopulação crítica.",
            "options": [
                { "text": "Controle de natalidade forçado", "score": -1 },
                { "text": "Educação e planejamento familiar", "score": 1 },
                { "text": "Colonizar oceano", "score": 0 },
                { "text": "Ignorar", "score": -1 }
            ]
        },
        {
            "id": "q3_7", "round": 3,
            "text": "Oxigênio atmosférico caindo.",
            "options": [
                { "text": "Fábricas de oxigênio (pagas)", "score": -1 },
                { "text": "Reflorestamento massivo urgente", "score": 1 },
                { "text": "Máscaras para todos", "score": 0 },
                { "text": "Estocar ar comprimido", "score": -1 }
            ]
        },
        {
            "id": "q3_8", "round": 3,
            "text": "A Última Escolha: O legado.",
            "options": [
                { "text": "Salvar o conhecimento humano em discos de ouro", "score": 1 },
                { "text": "Destruir tudo para ninguém ter", "score": -1 },
                { "text": "Celebrar o fim", "score": 0 },
                { "text": "Tentar upload da consciência", "score": 0 }
            ]
        }
    ]
};
