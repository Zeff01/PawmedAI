# 🐾 PawMed AI

**PawMed AI** is an intelligent veterinary assistant powered by OpenAI’s Vision API. It helps pet owners and veterinarians classify and identify pet-related diseases through image analysis. The platform includes a modern frontend built with Next.js and a robust backend using NestJS.

### 📌 GIT GUIDELINES:
Refer to this Notion Link: https://www.notion.so/PawMed-AI-Team-Guidelines-2319f77caba0806fb99dfa7923cd381a?source=copy_link

## 🧠 Features

- 🐶 Upload pet images to detect potential diseases
- 📷 Image classification using OpenAI Vision API
- 🔐 Authentication and secure API integration
- 🧾 PDF preview of diagnostic reports (mobile & desktop optimized)
- ⚙️ Fully containerized with Docker
- 📊 Scalable and modular architecture

## 🛠 Tech Stack

### Frontend
- **Next.js**
- **Tailwind CSS**
- **ShadCN UI**
- **React-PDF** for PDF rendering
- **TypeScript**

### Backend
- **Express TS**
- **OpenAI Vision API**
- **Docker**
- **pnpm**

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm
- Docker
- OpenAI API Key

### 1. Clone the Repository

```bash
https://github.com/Zeff01/PawmedAI.git
cd PawmedAI
code .
```

### 2. Setup Environment

Create .env files in both client and server directories:

**/client/.env**
```bash
NEXT_PUBLIC_UC_PUB_KEY=<yourkeyhere>
NEXT_PUBLIC_UC_AUTH_SECRET_KEY=<yourkeyhere>
RESEND_API_KEY=<yourkeyhere>
```

**/server/.env**
```bash
BASE_URL=<baseurlhere>
API_KEY=<apikeyhere>
LLM=<llmhere>
NGROK_AUTHTOKEN=<ngroktokenhere>
```

***Note: Refer to Jan Phillip Dacallos for the private keys.***

# 📚 Documentation

- [Environment Setup](SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

