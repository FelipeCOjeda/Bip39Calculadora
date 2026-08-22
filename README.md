# 🔐 Bip39 Calculadora

> Calculadora offline de palavras BIP39 para Android — segura, privada e sem internet.

![Android](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)
![Offline](https://img.shields.io/badge/Mode-100%25%20Offline-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 O que é BIP39?

BIP39 (Bitcoin Improvement Proposal 39) é o padrão que define as **seed phrases** (frases de recuperação) usadas em carteiras de criptomoedas. São as famosas 12 ou 24 palavras que representam a chave privada da sua carteira.

Esta calculadora permite trabalhar com essas palavras de forma **100% offline**, sem nunca transmitir seus dados pela internet.

---

## ✨ Funcionalidades

- ✅ Cálculo e validação de palavras BIP39
- ✅ Suporte às **2048 palavras** da wordlist BIP39 padrão
- ✅ Funciona **100% offline** — sem conexão com internet
- ✅ Nenhum dado é enviado a servidores externos
- ✅ Interface simples e intuitiva para Android

---

## 📲 Download

### Opção 1 — GitHub Releases *(recomendado)*

Baixe o APK diretamente na página de [**Releases**](https://github.com/FelipeCOjeda/Bip39Calculadora/releases) do projeto.

### Opção 2 — Clonar e compilar

```bash
git clone https://github.com/FelipeCOjeda/Bip39Calculadora.git
cd Bip39Calculadora
npm install
npm run build
npx cap sync android
```

Abra a pasta `android/` no **Android Studio** e gere o APK.

---

## 🔒 Segurança

> ⚠️ **ATENÇÃO:** Seed phrases são as chaves do seu patrimônio em cripto. Nunca as compartilhe.

Este aplicativo foi desenvolvido com segurança em mente:

| Característica | Status |
|---|---|
| 100% Offline | ✅ Sem permissão de internet |
| Sem coleta de dados | ✅ Nenhum analytics ou tracking |
| Código aberto | ✅ Auditável por qualquer pessoa |
| Armazenamento local | ✅ Dados ficam apenas no seu dispositivo |

### Verificar integridade do APK

Após baixar, verifique o hash SHA256 do arquivo antes de instalar:

```bash
# Linux / Mac
sha256sum Bip39Calculadora-APP.apk

# Windows (PowerShell)
Get-FileHash Bip39Calculadora-APP.apk -Algorithm SHA256
```

Compare com o hash publicado na página de [Releases](https://github.com/FelipeCOjeda/Bip39Calculadora/releases).

---

## 🛠️ Tecnologias

- [Capacitor](https://capacitorjs.com/) — framework para app híbrido Android
- HTML / CSS / JavaScript — interface web
- BIP39 wordlist padrão

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

## 🤝 Como Contribuir

1. Fork este repositório
2. Crie sua branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona funcionalidade X'`
4. Push: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

---

## ⚠️ Aviso Legal

Este software é fornecido **"como está"**, sem garantias de qualquer tipo. O uso de seed phrases envolve riscos financeiros reais. O autor não se responsabiliza por perdas causadas pelo uso indevido desta ferramenta.

**Nunca use seed phrases reais em dispositivos não confiáveis.**

---

## 📄 Licença

MIT © [Felipe Cavalhero Ojeda](https://github.com/FelipeCOjeda)
