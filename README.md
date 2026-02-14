# CryptoDash 🚀

![Status](https://img.shields.io/badge/Status-Production%20Ready-10b981)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Vite](https://img.shields.io/badge/Vite-7.x-646cff)
![Tests](https://img.shields.io/badge/Tests-Jest-c21325)

> Dashboard de criptomoedas em tempo real com criptografia local, PWA offline e interface multilíngue.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Cards com sparklines, Fear & Greed Index, estatísticas globais do mercado |
| **Mercado** | Tabela paginada com busca, ordenação e detalhes por moeda |
| **Conversor** | Conversão entre 8+ criptos e 3 moedas fiduciárias (USD, BRL, EUR) |
| **Carteira** | Portfólio pessoal com P&L, busca de moedas, edição de ativos e gráfico de alocação |
| **Alertas** | Notificações de preço com push do navegador |
| **Notícias** | Feed de notícias cripto atualizado automaticamente (CryptoCompare) |
| **Configurações** | Tema claro/escuro, 6 cores de destaque, idioma, auto-refresh, export/import |

---

## Stack & Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | TypeScript (strict) |
| Build | Vite — HMR, code-splitting, tree-shaking |
| Gráficos | Chart.js com sparklines customizadas |
| Segurança | AES-256-CBC — chave derivada via PBKDF2 + fingerprint do navegador |
| Persistência | localStorage criptografado |
| Testes | Jest + ts-jest + jsdom |
| PWA | Service Worker, manifest, funciona 100% offline |
| i18n | Português · English · Español (detecção automática) |

```
src/
├── app.ts                  # Entry point — init, routing, auto-refresh
├── style.css               # Design system com CSS custom properties
├── config/
│   └── constants.ts        # Configurações, mock data, constantes
├── core/
│   ├── api.ts              # Fetch queue, rate-limit handling, cache
│   ├── dom.ts              # Cache de elementos DOM
│   └── state.ts            # Estado global da aplicação
├── features/
│   ├── alerts.ts           # Alertas de preço
│   ├── converter.ts        # Conversor de moedas
│   ├── dashboard.ts        # Cards, gráficos, Fear & Greed, stats
│   ├── market.ts           # Tabela de mercado, sparklines, coin detail
│   ├── news.ts             # Feed de notícias (CryptoCompare API)
│   ├── settings.ts         # Tema, favoritos, preferências
│   └── wallet.ts           # Carteira / portfólio
├── utils/
│   ├── encryption.ts       # Serviço de criptografia AES-256
│   ├── helpers.ts          # Formatadores, toast, sanitização
│   └── secureStorage.ts    # Wrapper criptografado do localStorage
├── i18n/
│   ├── index.ts            # Motor de tradução
│   └── translations/       # pt-BR, en, es
├── types/
│   └── index.ts            # Tipos globais
└── __tests__/unit/         # Testes unitários
```

---

## Como Rodar

```bash
# 1. Clone o repositório
git clone https://github.com/gustavomenani/cryptodash.git
cd cryptodash

# 2. Instale dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
# → http://localhost:5173
```

### Scripts disponíveis

| Comando | Ação |
|---------|------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Preview local da build |
| `npm run serve` | Servidor Express de produção |
| `npm test` | Executa testes unitários |
| `npm run test:coverage` | Relatório de cobertura |

---

## Segurança

- Todos os dados sensíveis (carteira, alertas, favoritos) são criptografados com **AES-256-CBC**
- Chave de criptografia derivada com PBKDF2 + fingerprint do navegador
- Dados nunca armazenados em texto plano

---

## Deploy

Consulte [DEPLOY.md](./DEPLOY.md) para instruções detalhadas de deploy em Vercel, Netlify, GitHub Pages e Docker.

---

## APIs

- [CoinGecko API v3](https://www.coingecko.com/api) — Dados de mercado
- [Alternative.me](https://alternative.me/crypto/fear-and-greed-index/) — Fear & Greed Index
- [CryptoCompare](https://min-api.cryptocompare.com/) — Notícias

---

## Licença

MIT © 2025–2026 Gustavo Menani
