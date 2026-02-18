# Gerar instaladores para desktop (sem GitHub Actions)

Este guia explica como gerar o **.exe (Windows)** e o **.dmg (Mac)** no seu próprio computador e publicar na Release do GitHub manualmente.

---

## Pré-requisitos

### Em qualquer sistema

- **Node.js** 18 ou 20 (LTS): https://nodejs.org/
- **Git**: para clonar o repositório

### No Windows (para gerar o .exe)

- **Rust** (stable, com suporte a Windows): https://rustup.rs/
  - Após instalar, abra um novo terminal e confira: `rustc --version`
- **Visual Studio Build Tools** (para compilar o Rust no Windows):
  - Ao rodar `rustup` pela primeira vez, ele pode pedir para instalar o “MSVC build tools”; aceite.
  - Ou instale manualmente: https://visualstudio.microsoft.com/visual-cpp-build-tools/ (carga de trabalho “Desenvolvimento para desktop com C++”).

### No Mac (para gerar o .dmg)

- **Rust** (stable): https://rustup.rs/
  - Após instalar: `rustc --version`
- **Xcode Command Line Tools** (geralmente já existe):
  - Se precisar: `xcode-select --install`

---

## Passo a passo: Windows (.exe)

1. **Abra o terminal (PowerShell ou CMD) no Windows.**

2. **Clone o repositório** (se ainda não tiver):
   ```bash
   git clone https://github.com/JoniGuerini/breaking-eternity2.git
   cd breaking-eternity2
   ```
   Se já tiver a pasta, entre nela e atualize:
   ```bash
   cd breaking-eternity2
   git pull origin main
   ```

3. **Instale as dependências do Node:**
   ```bash
   npm ci
   ```

4. **Gere o instalador:**
   ```bash
   npx tauri build
   ```
   A primeira vez pode demorar (compilação do Rust).

5. **Onde está o .exe:**
   - Instalador NSIS (recomendado para distribuir):
     ```
     src-tauri\target\release\bundle\nsis\Breaking Eternity_0.1.0_x64-setup.exe
     ```
     (O nome pode variar levemente, ex.: com ponto no lugar de espaço.)
   - Alternativa MSI:
     ```
     src-tauri\target\release\bundle\msi\*.msi
     ```

6. **Use esse .exe** para anexar à Release no GitHub (passos mais abaixo).

---

## Passo a passo: Mac (.dmg)

1. **Abra o Terminal no Mac.**

2. **Clone o repositório** (se ainda não tiver):
   ```bash
   git clone https://github.com/JoniGuerini/breaking-eternity2.git
   cd breaking-eternity2
   ```
   Se já tiver a pasta:
   ```bash
   cd breaking-eternity2
   git pull origin main
   ```

3. **Instale as dependências do Node:**
   ```bash
   npm ci
   ```

4. **Gere o app e o instalador:**
   ```bash
   npx tauri build
   ```

5. **Onde estão os arquivos:**
   - **Instalador .dmg** (melhor para distribuir):
     ```
     src-tauri/target/release/bundle/dmg/Breaking Eternity_0.1.0_aarch64.dmg
     ```
     (No Mac com chip Apple Silicon; em Intel pode ser `x64` no nome.)
   - **App .app** (pasta do aplicativo):
     ```
     src-tauri/target/release/bundle/macos/Breaking Eternity.app
     ```

6. **Use o .dmg** para anexar à Release no GitHub (passos abaixo).

---

## Publicar na Release do GitHub (manual)

Assim os jogadores conseguem baixar pelo botão “Baixar para desktop” no jogo.

1. Acesse: **https://github.com/JoniGuerini/breaking-eternity2/releases**

2. Clique em **“Draft a new release”** (ou “Create a new release”).

3. **Tag:**
   - Se for a primeira vez, crie uma tag, por exemplo: `desktop-app`
   - Em “Choose a tag”, digite `desktop-app` e confirme “Create new tag: desktop-app on publish”.

4. **Título** (ex.): `Versão desktop (Windows e Mac)`

5. **Descrição** (opcional): pode escrever algo como “Instaladores para Windows (.exe) e Mac (.dmg).”

6. **Anexar os arquivos:**
   - Arraste para a área de “Attach binaries”:
     - **Windows:** o arquivo `.exe` da pasta `src-tauri\target\release\bundle\nsis\`
     - **Mac:** o arquivo `.dmg` da pasta `src-tauri/target/release/bundle/dmg/`
   - Você pode publicar primeiro só o Windows e depois editar a release e adicionar o .dmg (ou o contrário).

7. Clique em **“Publish release”**.

Pronto. O link que está no jogo (Configurações → Baixar para desktop) aponta para essa release; o botão **Windows** usa o link direto do .exe; o botão **Mac** abre a página de releases para a pessoa escolher o .dmg.

---

## Atualizar uma release existente

Se você já tem a release (por exemplo com tag `desktop-app`):

1. Vá em **Releases** → clique na release.
2. Clique no ícone de **lápis (Edit)**.
3. Na mesma página, em **“Attach binaries”**, arraste o novo .exe ou .dmg.
4. **“Update release”**.

Assim você pode ir gerando novos builds no seu PC/Mac e só atualizando a release com os arquivos novos.

---

## Resumo rápido

| Onde      | Comando        | Arquivo para anexar na Release                          |
|----------|----------------|---------------------------------------------------------|
| Windows  | `npx tauri build` | `src-tauri\target\release\bundle\nsis\*.exe`         |
| Mac      | `npx tauri build` | `src-tauri/target/release/bundle/dmg/*.dmg`          |

Se não for usar GitHub Actions, você pode ignorar ou apagar os arquivos em `.github/workflows/`; o build e a publicação são feitos só por você, seguindo este guia.
