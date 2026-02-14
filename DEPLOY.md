# Guia de Deploy

## Pré-requisitos

- Node.js 18+ (recomendado: 20 LTS)
- npm

---

## Instalação

```bash
git clone https://github.com/gustavomenani/cryptodash.git
cd cryptodash
npm install
```

---

## Desenvolvimento

```bash
npm run dev
# → http://localhost:5173
```

---

## Build de Produção

```bash
npm run build          # saída em dist/
npm run preview        # preview local da build
npm run serve          # servidor Express (porta 3000)
```

---

## Deploy — Vercel

```bash
npm i -g vercel
vercel --prod
```

Ou conecte o repositório diretamente no dashboard da Vercel.

## Deploy — Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Deploy — GitHub Pages

O repositório já inclui um workflow em `.github/workflows/deploy.yml`.  
Basta ativar o GitHub Pages com source **GitHub Actions** nas configurações do repo.

## Deploy — Docker

```bash
docker build -t cryptodash .
docker run -p 3000:3000 cryptodash
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "All proxies failed" | Verifique conexão; o app usa dados mock como fallback |
| Erro de build TypeScript | `rm -rf node_modules dist && npm install && npm run build` |

---

## Licença

MIT © 2025–2026 Gustavo Menani
