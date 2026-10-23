# Farmácia Validade

Sistema de gestão de farmácia com controle de validade de medicamentos, estoque, clientes e vendas.

## Stack utilizada

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + JavaScript (JSX) |
| Estilização | CSS puro |
| Roteamento | React Router DOM v6 |
| HTTP | Axios |
| Backend | Node.js + Express (CommonJS) |
| Banco de dados | MySQL |
| Ícones | Lucide React |

## Estrutura do projeto

```text
farmacia_validade_js/
├── client/src/
│   ├── components/Layout.jsx
│   ├── contexts/AuthContext.jsx
│   ├── contexts/DataContext.jsx
│   ├── pages/Login.jsx
│   ├── pages/...
│   ├── index.css
│   └── main.jsx
├── server/
│   ├── db.js
│   ├── index.js
│   ├── schema.sql
│   ├── seed.sql
│   ├── .env.example
│   └── package.json
├── index.html
├── package.json
└── vite.config.js
```

## Login sem cadastro

O sistema agora começa pela tela de login. Não existe cadastro público: o administrador define e envia as credenciais por um canal seguro. Nesta primeira versão, o login administrativo fica nas variáveis de ambiente do backend:

```env
ADMIN_LOGIN=admin
ADMIN_PASSWORD=troque-esta-senha
AUTH_SECRET=gere-uma-chave-aleatoria-longa
```

O frontend envia as credenciais para `POST /api/auth/login`. O backend valida os valores, cria uma sessão assinada e devolve um cookie `HttpOnly`. A aplicação verifica essa sessão em `GET /api/auth/me`, e todas as rotas de dados (`medicamentos`, `lotes`, `clientes` e `vendas`) passam pelo middleware `requireAuth`. O botão **Sair da conta** chama `POST /api/auth/logout` e elimina o cookie.

A senha não é armazenada no navegador, nem em `localStorage`. A sessão dura oito horas e é invalidada automaticamente quando expira. Em produção, configure `NODE_ENV=production` para que o cookie também receba a flag `Secure`, exigindo HTTPS.

## Instalação e execução

### Pré-requisitos

- Node.js em versão LTS suportada, npm e Git.
- MySQL Server 8 ou superior instalado e iniciado.
- MySQL Workbench para importar os scripts pela interface (opcional).

O Workbench é o cliente de administração: o MySQL Server também precisa estar instalado.
Cada computador terá seu próprio banco e seu arquivo `server/.env`.

### 1. Baixar o projeto

O repositório é privado. O responsável deve conceder acesso ao orientador antes da clonagem.

```bash
git clone https://github.com/davif77/ValiMed.git
cd ValiMed
```

Se o projeto já foi clonado, use `git pull --ff-only` na pasta do projeto.
Se o Git avisar sobre alterações locais, preserve-as antes de atualizar.

### 2. Criar o banco no MySQL Workbench

1. Conecte ao MySQL local com um usuário autorizado a criar bancos e tabelas.
2. Em **File → Open SQL Script**, abra `server/schema.sql`.
3. Execute o arquivo inteiro com **Ctrl + Shift + Enter**.
4. Confira **Action Output**: não deve haver erros. Atualize o painel **Schemas**.
5. Para testar com cadastros prontos, abra `server/seed.sql` e execute o arquivo inteiro da mesma forma.

| Arquivo | Finalidade |
|---|---|
| `server/schema.sql` | Cria o banco e as cinco tabelas, usando `qtd_caixa` em medicamentos |
| `server/seed.sql` | Carga opcional com 15 medicamentos, 10 clientes, 45 lotes e 10 vendas fictícias |
| `server/.env.example` | Modelo para configurar o banco e o login local |

O schema não apaga bancos, tabelas nem registros. Pode ser reexecutado em uma instalação
com a mesma estrutura, mas **não altera nem migra tabelas antigas**.
Se um banco anterior usa `principio_ativo` e não possui `qtd_caixa`, importar o schema
não corrige essa diferença: faça backup e ajuste a estrutura antes de usar a aplicação.
Para uma instalação nova, use um banco vazio.

O seed usa datas relativas ao dia da primeira execução. Inclui lotes vencidos,
descartados, próximos do vencimento, com vencimento hoje, validade longa,
estoque zerado e estoque baixo. As quantidades representam o saldo após as vendas
demonstrativas; não execute outra baixa de estoque para essas vendas.
A classificação visual depende das regras da aplicação.

A carga de demonstração é transacional. Se ocorrer erro, suas inserções são revertidas.
Se já existir qualquer medicamento com código `VALIMED-DEMO-`, a carga inteira é
ignorada: as vendas não são duplicadas, os estoques não são repostos e as datas não são renovadas.
Os códigos, CPFs, fabricantes, preços e demais cadastros são fictícios.
Execute o seed inteiro, sem selecionar apenas trechos. Ele usa um procedimento auxiliar
e requer a permissão `CREATE ROUTINE`, normalmente disponível ao usuário root local.

Alternativa no terminal do cliente MySQL, iniciando **na raiz do projeto**:

```text
mysql -u root -p
SOURCE server/schema.sql;
SOURCE server/seed.sql;
EXIT;
```

Os comandos `SOURCE` são executados dentro do cliente MySQL, não no PowerShell.
O segundo arquivo é opcional.

### 3. Configurar o backend

Na raiz do projeto:

```bash
cd server
npm install
```

Copie `.env.example` para `.env`. No PowerShell do Windows:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS:

```bash
cp .env.example .env
```

Se o `.env` já existir, edite-o sem substituí-lo.
Preencha `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` e `DB_NAME`
com os dados da mesma conexão usada no Workbench.
O nome padrão do banco é `farmacia_validade`.

Defina `ADMIN_LOGIN`, `ADMIN_PASSWORD` e `AUTH_SECRET`.
O login do ValiMed é independente do usuário/senha do MySQL e não é criado pelo seed.
Para gerar uma chave de sessão, execute e copie o resultado para `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O modelo deixa senha e chave vazias de propósito: preencha-as antes de iniciar.
Não envie o `.env` preenchido ao GitHub. Para desenvolvimento local, mantenha
`NODE_ENV=development`; `production` exige HTTPS para o cookie de sessão.

Ainda dentro de `server`:

```bash
npm start
```

Deixe esse terminal aberto. O backend usa `http://localhost:3001`.
Ao alterar o `.env`, pare com **Ctrl + C** e execute `npm start` novamente.

### 4. Iniciar o frontend

Abra outro terminal **na raiz do projeto**, onde está o `package.json` principal:

```bash
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.
O Vite encaminha `/api` para `http://localhost:3001`, conforme `vite.config.js`.
Entre com o login e a senha definidos no `.env`.

### Problemas comuns

- **Credenciais administrativas não configuradas:** preencha `ADMIN_LOGIN`,
  `ADMIN_PASSWORD` e `AUTH_SECRET` no `server/.env` e reinicie o backend.
- **Access denied:** confira usuário e senha do MySQL; são diferentes do login do ValiMed.
- **Unknown database / tabelas ausentes:** execute `schema.sql` na conexão correta.
- **Unknown column qtd_caixa:** a tabela existente está desatualizada; o schema não faz migrações.
- **Login funciona, mas listas estão vazias:** confira `DB_NAME`, host e porta;
  importe `seed.sql` se quiser dados de demonstração e veja o terminal do backend.
- **Erro ao importar:** pare a execução e confira o erro em **Action Output**.
  Não apague o banco existente para tentar corrigir sem antes fazer backup.

## Variáveis de ambiente do backend

| Variável | Função |
|---|---|
| `DB_HOST` | Host do MySQL |
| `DB_USER` | Usuário do MySQL |
| `DB_PASSWORD` | Senha do MySQL |
| `DB_NAME` | Nome do banco |
| `DB_PORT` | Porta do MySQL, normalmente `3306` |
| `PORT` | Porta do backend, normalmente `3001` |
| `ADMIN_LOGIN` | Login que o administrador enviará ao usuário |
| `ADMIN_PASSWORD` | Senha que o administrador enviará ao usuário |
| `AUTH_SECRET` | Chave privada para assinar sessões; deve ser longa e aleatória |
| `NODE_ENV` | Use `production` em ambiente publicado com HTTPS |

## Como a autenticação funciona

O fluxo é dividido em quatro partes. Primeiro, o usuário informa o login e a senha na tela `client/src/pages/Login.jsx`. Depois, o backend compara esses valores com `ADMIN_LOGIN` e `ADMIN_PASSWORD`, sem retornar a senha para o frontend. Em seguida, o servidor grava um token de sessão assinado em cookie `HttpOnly`, que o JavaScript da página não consegue ler. Por fim, o middleware `requireAuth` valida a assinatura e a validade do token antes de liberar cada rota de dados.

Essa solução atende ao cenário simples de um único acesso administrativo e não cria contas pela interface. Para várias pessoas, permissões diferentes, troca de senha, recuperação de acesso e auditoria, o próximo passo é criar uma tabela `usuarios`, armazenar somente hashes de senha com Argon2id ou bcrypt e consultar o usuário no login. Senhas não devem ser gravadas em texto puro. [1]

Nesse cenário mais completo, o endpoint de login faria uma consulta parametrizada pelo login, compararia a senha informada com o hash armazenado e criaria a mesma sessão após a comparação. O banco continuaria no backend, nunca no React. O frontend deve conversar apenas com endpoints HTTP do servidor.

## Boas práticas para publicar

Use HTTPS, troque `AUTH_SECRET` e `ADMIN_PASSWORD`, remova credenciais reais do controle de versão e aplique permissões mínimas ao usuário do MySQL. Mantenha o cookie com `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict` e prazo de expiração limitado; essas propriedades reduzem a exposição do identificador de sessão. [2] [3]

A implementação atual é uma base funcional para o login administrativo. Ela não substitui controle de acesso por usuário, limitação de tentativas, autenticação multifator, rotação de sessão e registro de auditoria quando o sistema for utilizado em produção por uma equipe maior.

## Funcionalidades

| Módulo | Recursos |
|---|---|
| Dashboard | Estatísticas e alertas de vencimento |
| Medicamentos | Cadastro, busca e exclusão |
| Lotes | Controle de validade, quantidade e preços |
| Clientes | Cadastro, edição e exclusão |
| Venda PDV | Catálogo, seleção de lote e carrinho |
| Vendas | Registro manual e histórico |
| Relatórios | Indicadores de vendas, estoque e validade |

## Referências

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html "OWASP Password Storage Cheat Sheet"
[2]: https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies "MDN: Secure cookie configuration"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html "OWASP Session Management Cheat Sheet"
