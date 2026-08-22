# 🔐 Bip39 Calculadora

> Calculadora offline de BIP39 para Android — gera entropia com dados, baralho, bingo e moedas, calcula checksum e valida seed phrases. 100% local, sem internet.

![Android](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)
![Offline](https://img.shields.io/badge/Mode-100%25%20Offline-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 O que é BIP39?

BIP39 (Bitcoin Improvement Proposal 39) é o padrão que define as **seed phrases** (frases de recuperação) usadas em carteiras de criptomoedas. São as famosas 12 ou 24 palavras que representam a chave privada da sua carteira.

Esta calculadora permite trabalhar com essas palavras de forma **100% offline**, sem nunca transmitir seus dados pela internet.

---

## ✨ Funcionalidades

- 🎲 **Dados** — gera entropia jogando dados físicos
- 🃏 **Baralho** — gera entropia embaralhando cartas
- 🎱 **Bingo** — gera entropia com pedras de bingo
- 🪙 **Moedas** — gera entropia lançando moedas
- ✅ **Checksum** — calcula e valida a última palavra BIP39
- 🔑 Suporte às **2048 palavras** da wordlist BIP39 padrão
- 📵 Funciona **100% offline** — sem nenhuma permissão de internet

---

## 📲 Download

### ⬇️ Link Direto

[**Baixar app-debug.apk**](https://github.com/FelipeCOjeda/Bip39Calculadora/releases/download/v0.1.0/app-debug.apk)

Ou acesse a página de [**Releases**](https://github.com/FelipeCOjeda/Bip39Calculadora/releases) e clique em `app-debug.apk`.

---

## 🔐 Verificação de Integridade

Após baixar, verifique o hash SHA256 antes de instalar:

```
7890b3d12d024fbac0940546d2df008376553b576417d382a028b0f1bef1e713
```

**Como verificar:**

```bash
# Linux / Mac
sha256sum app-debug.apk

# Windows (PowerShell)
Get-FileHash app-debug.apk -Algorithm SHA256
```

---

## 🔒 Segurança

> ⚠️ **ATENÇÃO:** Seed phrases são as chaves do seu patrimônio em cripto. Nunca as compartilhe.

| Característica | Status |
|---|---|
| 100% Offline | ✅ Sem permissão de internet |
| Sem coleta de dados | ✅ Nenhum analytics ou tracking |
| Código aberto | ✅ Auditável por qualquer pessoa |
| Armazenamento local | ✅ Dados ficam apenas no seu dispositivo |

---

## 🛠️ Como Compilar

```bash
git clone https://github.com/FelipeCOjeda/Bip39Calculadora.git
cd Bip39Calculadora
npm install
npm run build
npx cap sync android
```

Abra a pasta `android/` no **Android Studio** e gere o APK.

---

## 📦 Estrutura do Projeto

```
Bip39Calculadora/
├── www/                  # Código da interface web
├── android/              # Projeto Android (Capacitor)
├── capacitor.config.json # Configuração do Capacitor
└── package.json          # Dependências do projeto
```

---

## 🛠️ Tecnologias

- [Capacitor](https://capacitorjs.com/) — framework para app híbrido Android
- HTML / CSS / JavaScript — interface web
- BIP39 wordlist padrão (2048 palavras)

---

## ⚠️ Aviso Legal

Este software é fornecido **"como está"**, sem garantias de qualquer tipo. O uso de seed phrases envolve riscos financeiros reais. O autor não se responsabiliza por perdas causadas pelo uso indevido desta ferramenta.

**Nunca use seed phrases reais em dispositivos não confiáveis.**

---

## 📄 Licença

MIT © [Felipe Cavalhero Ojeda](https://github.com/FelipeCOjeda)
