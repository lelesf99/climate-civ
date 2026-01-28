# Civilização Climática (Climate Civilization)

Um jogo de quiz e gerenciamento de recursos com tema retro-futurista, focado em escolhas ambientais e suas consequências.

## Como Jogar

1.  Abra o arquivo `index.html` em seu navegador.
2.  4 Jogadores revezam turnos para responder perguntas sobre gestão ambiental.
3.  **Objetivo**: Manter o aquecimento global (barra) baixo.
4.  **Consequências**: Se o aquecimento subir muito (barra cheia), desastres visuais (Terremoto, Enchente, Calor) atrapalharão o jogo.

## Deploy

Este projeto é estático (HTML/CSS/JS). Para publicar no GitHub Pages:

1.  Faça o upload dos arquivos para um repositório GitHub.
2.  Vá em **Settings > Pages**.
3.  Selecione a branch `main` e a pasta `root` (ou `/docs` se preferir).
## Configuração e Edição (Para Leigos)

Todas as perguntas e configurações do jogo ficam no arquivo `scripts/data.js`. Para alterar o jogo, você não precisa saber programar, apenas seguir estes passos:

### Como editar no GitHub (Se o site estiver online)
1.  Acesse a página do repositório no GitHub.
2.  Entre na pasta `scripts` e clique no arquivo `data.js`.
3.  Clique no ícone de lápis (✏️) no canto superior direito do arquivo para editar.
4.  **Editando Perguntas**:
    - Procure a parte onde diz `"questions": [ ... ]`.
    - Você verá blocos de perguntas. Altere apenas os textos que estão entre aspas `" "`.
    - **Exemplo**: Mude `"text": "Texto antigo"` para `"text": "Sua nova pergunta"`.
    - **Importante**: Não apague as vírgulas `,` ou as chaves `{ }`.
5.  **Editando Rodadas**:
    - Procure por `"maxRounds": 3` para mudar o número de rodadas.
    - Procure por `"questionsPerPlayerPerRound": 2` para mudar quantas perguntas cada um responde.
6.  **Salvando (Commit)**:
    - Role até o final da página.
    - Onde diz "Commit changes", escreva uma breve descrição (ex: "Atualizei as perguntas").
    - Clique no botão verde **Commit changes**.
    - O site atualizará automaticamente em alguns minutos!

### Cuidados
- Mantenha a pontuação (`score`) como `-1` (Ruim), `0` (Neutro) ou `1` (Bom).
- Se o jogo parar de funcionar, provavelmente alguma vírgula ou aspas foi apagada acidentalmente. Verifique o arquivo novamente.

## Configuração

Para configurar o jogo, edite o arquivo `scripts/data.js`. 

## Licença

MIT License

## Créditos

Desenvolvido com assistência de IA para uso educacional em sala de aula. Leles Tecnologia LTDA - Todos os direitos reservados
