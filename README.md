# 💰 Bytebank - Tech Challenge 4

> Aplicação financeira mobile desenvolvida com React Native.

---

## 📋 Índice

- [Sobre](#sobre)
- [Instalação](#instalação)
- [Como usar](#como-usar)
- [Exemplos de código](#exemplos-de-código)

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

## Exemplos de código

### Firebase - regras de segurança - limites de requisições, logs e bloqueios por padrão

```javascript

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidTransaction() {
      let data = request.resource.data;
      return 'amount' in data && data.amount is number
        && 'category' in data && data.category is string
        && 'description' in data && data.description is string
        && 'type' in data && data.type in ['income', 'expense']
        && 'date' in data && data.date is timestamp
        && 'userId' in data && data.userId is string
        && data.amount > 0
        && data.amount <= 999999.99
        && data.category.size() > 0 && data.category.size() <= 100
        && data.description.size() > 0 && data.description.size() <= 500;
    }

    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);

      
      allow create: if isAuthenticated() 
                    && isOwner(request.resource.data.userId) 
                    && isValidTransaction()
                    && !('createdAt' in request.resource.data)
                    && !('updatedAt' in request.resource.data);

      
     allow update: if isAuthenticated() 
              && isOwner(resource.data.userId)
              && request.resource.data.userId == resource.data.userId;
              
              
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false;
    }
    
    match /rateLimits/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    match /auditLogs/{log} {
      allow read, write: if false;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

```

---

## 🛠 Tecnologias

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)

---

## 📄 Licença

Este projeto está sob a licença MIT.