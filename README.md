# 🚀 Swift SDR - AI-Powered Sales Engagement CRM

**Swift SDR** é um Mini CRM de Pré-Vendas (SDR) projetado para acelerar o funil comercial através de personalização em escala. Utilizando Inteligência Artificial integrada a uma arquitetura robusta em **Angular** e **Node.js**, o Swift SDR automatiza a geração de abordagens contextuais, permitindo que as equipes de vendas foquem no que realmente importa: a conexão humana.

---

## 🎯 O Desafio & Motivação
Equipes de prospecção perdem horas valiosas alternando entre abas para pesquisar leads e redigir mensagens. O Swift SDR resolve isso integrando dados do lead, contexto de campanha e LLMs (Large Language Models) em um fluxo de trabalho profissional e tipado.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Motivação |
| :--- | :--- | :--- |
| **Frontend** | **Angular & Bootstrap** | Framework robusto com tipagem forte (TypeScript) e interface responsiva. |
| **Backend** | **Node.js (Express)** | Ambiente escalável para orquestração de APIs e lógica de IA. |
| **Banco de Dados** | **PostgreSQL (Supabase)** | Banco relacional confiável com suporte a JSONB para campos flexíveis. |
| **Integração IA** | **API de LLM (Gemini)** | Geração de conteúdo dinâmico baseado no contexto do lead. |

---

## 🏗️ Arquitetura e Decisões Técnicas

### 1. Estrutura Enterprise com Angular
A escolha do **Angular** reflete a necessidade de uma aplicação escalável. A arquitetura baseada em serviços garante que a lógica de negócio seja modular e de fácil manutenção.

### 2. Multi-Tenancy e Isolamento
O sistema suporta múltiplos Workspaces de forma isolada. No backend em **Node.js**, cada requisição é validada para garantir a segurança dos dados vinculados ao workspace ativo.

### 3. Flexibilidade com JSONB
Utilizamos o tipo `JSONB` no PostgreSQL para campos personalizados. Isso permite atributos dinâmicos sem a necessidade de migrações estruturais no banco.

---

## 🚀 Funcionalidades

- [ ] Autenticação e Gestão de Workspaces.
- [ ] Gestão de Leads com campos padrão e personalizados (JSONB).
- [ ] Funil de vendas Kanban com interface **Bootstrap**.
- [ ] Geração de mensagens personalizadas via IA.
- [ ] Regras de transição com validação de campos obrigatórios.
- [ ] Geração automática de mensagens por gatilho de etapa.

---

## 📦 Como rodar o projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/alanzink1/swift-sdr.git

Configuração do Backend (Node.js):

2. **Acesse a pasta /server.**

- Configure o .env com suas credenciais.

- Execute npm install e npm start.

**Configuração do Frontend (Angular):**

- Acesse a pasta `/client.`

- Execute `npm install.`

- Inicie com `ng serve`.

## ✍️ Autor
#### Alan Rodrigues - Junior Fullstack Developer & Project Leader

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alanzink1)

[![github](https://img.shields.io/badge/github-000000?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.github.com/alanzink1)
