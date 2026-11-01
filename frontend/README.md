# EventCheck frontend

Aplicação React, TypeScript e Tailwind para cadastro de organizações e
gerenciamento de eventos.

## Executar com Compose

Na raiz do repositório, configure as variáveis de ambiente conforme
`.env.example` e execute:

```powershell
podman-compose up -d --build
```

O frontend fica disponível na porta `5173` por padrão. O endereço pode ser
alterado com `FRONTEND_PORT`. O Nginx serve a aplicação e encaminha as
requisições `/api` para o serviço FastAPI.

## Executar em desenvolvimento

Com a API em execução na porta `8080`, execute:

```powershell
npm install
npm run dev
```

O Vite encaminha `/api` para `VITE_API_PROXY_TARGET`, configurado em
`.env.local`; sem essa variável, usa `http://localhost:8080`.

## Fluxo atual

- Cadastro de organização com login automático após o cadastro.
- Login de organização e restauração da sessão ao recarregar a página.
- Painel para listar, criar e excluir eventos.
