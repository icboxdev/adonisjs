# Enterprise Backend API | AdonisJS v6

Este repositório hospeda o core backend de uma aplicação robusta desenvolvida com **AdonisJS v6**. O projeto foi concebido seguindo princípios de **Clean Architecture**, **SOLID** e foco total em type-safety para garantir escalabilidade e fácil manutenção.



## 🛠️ Tech Stack

* **Framework:** [AdonisJS v6](https://docs.adonisjs.com/guides/introduction)
* **Runtime:** Node.js v20+
* **Language:** TypeScript
* **ORM:** Lucid (Active Record)
* **Validation:** VineJS
* **Database:** PostgreSQL (Recomendado)
* **Authentication:** AdonisJS Auth (OATH/Token)

## 🚀 Key Features

* **Service Layer Pattern:** Lógica de negócio isolada dos Controllers para maior testabilidade.
* **Standardized Responses:** Middleware para padronização de respostas JSON e tratamento global de erros.
* **Strict Typing:** Interfaces e tipos customizados para garantir integridade em todo o fluxo de dados.
* **Security:** Proteção contra CSRF, XSS e SQL Injection nativa, além de configuração de Rate Limiting.
* **Automated Testing:** Cobertura de testes funcionais e unitários utilizando Japa.

## ⚙️ Setup & Installation

### Prerequisites

* Node.js (v20.x ou superior)
* Package Manager (npm/pnpm/yarn)
* Instância de banco de dados (Docker recomendado)

### Steps

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/icboxdev/adonisjs.git](https://github.com/icboxdev/adonisjs.git)
   cd adonisjs
