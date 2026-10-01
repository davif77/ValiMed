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

Node.js 18 ou superior, MySQL 8 ou superior e npm.

### 1. Banco de dados

Crie o banco e execute o schema:

```bash
mysql -u root -p < server/schema.sql
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Edite .env com o banco e as credenciais fornecidas pelo administrador
npm start
# Servidor em http://localhost:3001
```

Se o arquivo `.env` já existir, altere suas variáveis sem substituí-lo.

### 3. Frontend

Em outro terminal, na raiz do projeto:

```bash
npm install
npm run dev
# Aplicação em http://localhost:5173
```

O Vite encaminha `/api` para `http://localhost:3001`, conforme `vite.config.js`.

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
