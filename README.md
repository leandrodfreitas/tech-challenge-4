# 💰 Bytebank - Tech Challenge 4

> Aplicação financeira mobile desenvolvida com React Native.

---

## 📋 Índice

- [Sobre](#sobre)
- [Instalação](#instalação)
- [Como usar](#como-usar)
- [Melhorias aplicadas](#melhorias-aplicadas)

---

## Sobre

O **Bytebank** é uma aplicação financeira mobile que permite gerenciar suas finanças de forma simples e intuitiva, direto pelo celular.

---

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [React Native CLI](https://reactnative.dev/docs/environment-setup)

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/leandrodfreitas/tech-challenge-4.git
cd tech-challenge-4
```

2. Instale as dependências:

```bash
npm install
```

4. Iniciar:

```bash
npm start
```

---

## Como usar

1. Crie sua conta ou faça login
2. Visualize seu saldo e extrato na tela inicial
3. Adicionar, editar, deletar e filtrar transações 
4. Acompanhar seu histórico de transações

---

## Melhorias aplicadas

### Cache

- Cache persistente: dados salvos no disco entre sessões.
- Leituras repetidas vêm do cache (sem custo no Firebase).
- App funciona offline com os dados já carregados.
- Sincroniza automaticamente quando a conexão voltar.

### Performance 
 
- useCallback em todas as funções - evita re-renders em cascata.
- useMemo para summary - não recalcula a cada render.
- useEffect unificado - era 2 duplicados, agora é 1.
- Atualização otimista - UI responde instantaneamente.
- usePaginatedTransactions - paginação isolada e reutilizável.
- Pré-carrega os recursos críticos (fontes, imagens, sessão) em paralelo.

### Segurança 

- Consistência estrita de dados na escrita.
- Limitação de taxa de requisições (Rate Limiting).
- Trilha de auditoria completa via logs estruturados.
- Políticas de acesso baseadas em Bloqueio por Padrão (Default-Deny).

---

## 🛠 Tecnologias

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)

---

## 📄 Licença

Este projeto está sob a licença MIT.