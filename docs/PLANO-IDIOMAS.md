# Plano de implementação – Novos idiomas

Objetivo: adicionar **14 idiomas** ao Breaking Eternity, seguindo a mesma estrutura dos 18 já existentes.

---

## 1. Lista de idiomas a adicionar

| Ordem | Código | Nome no seletor | Observação |
|-------|--------|------------------|------------|
| 1 | `hi` | हिन्दी (Hindi) | Alta prioridade |
| 2 | `uk` | Українська (Ucraniano) | Alta prioridade |
| 3 | `pt-PT` | Português (Portugal) | Média |
| 4 | `he` | עברית (Hebraico) | Média; RTL |
| 5 | `cs` | Čeština (Tcheco) | Média |
| 6 | `hu` | Magyar (Húngaro) | Média |
| 7 | `sv` | Svenska (Sueco) | Nórdico |
| 8 | `da` | Dansk (Dinamarquês) | Nórdico |
| 9 | `nb` | Norsk (Norueguês) | Nórdico |
| 10 | `fi` | Suomi (Finlandês) | Nórdico |
| 11 | `ro` | Română (Romeno) | Europa |
| 12 | `el` | Ελληνικά (Grego) | Europa |
| 13 | `bn` | বাংলা (Bengali) | Sul da Ásia |
| 14 | `ms` | Bahasa Melayu (Malaio) | Sudeste Asiático |

**Total: 14 novos idiomas.**

---

## 2. Estrutura de cada idioma

Para cada um:

1. **Arquivo**  
   `src/locales/<codigo>.json`  
   - Mesmas chaves de `en.json`.  
   - Valores traduzidos para o idioma alvo.  
   - Manter placeholders: `{{amount}}`, `{{count}}`, `{{n}}`, `{{total}}`.  
   - Manter HTML onde existir (ex.: `<strong>`).  
   - JSON válido (minificado em uma linha ou formatado).

2. **Registro no i18n**  
   Em `src/i18n/index.ts`:  
   - `import` do JSON.  
   - Entrada em `SUPPORTED_LANGUAGES` (code + label).  
   - Código em `CODES`.  
   - Entrada em `resources`.

O seletor em Configurações já usa `SUPPORTED_LANGUAGES`, então não exige alteração na UI.

---

## 3. Ordem de execução sugerida

### Fase 1 – Alta prioridade (2 idiomas)
1. Hindi (`hi`) → `src/locales/hi.json`
2. Ucraniano (`uk`) → `src/locales/uk.json`

### Fase 2 – Média prioridade (4 idiomas)
3. Português Portugal (`pt-PT`) → `src/locales/pt-PT.json`
4. Hebraico (`he`) → `src/locales/he.json` *(checar suporte RTL na UI)*
5. Tcheco (`cs`) → `src/locales/cs.json`
6. Húngaro (`hu`) → `src/locales/hu.json`

### Fase 3 – Nórdicos (4 idiomas)
7. Sueco (`sv`) → `src/locales/sv.json`
8. Dinamarquês (`da`) → `src/locales/da.json`
9. Norueguês (`nb`) → `src/locales/nb.json`
10. Finlandês (`fi`) → `src/locales/fi.json`

### Fase 4 – Europa e outros (4 idiomas)
11. Romeno (`ro`) → `src/locales/ro.json`
12. Grego (`el`) → `src/locales/el.json`
13. Bengali (`bn`) → `src/locales/bn.json`
14. Malaio (`ms`) → `src/locales/ms.json`

---

## 4. Checklist por idioma

Para cada código (ex.: `hi`):

- [ ] Criar `src/locales/<codigo>.json` com todas as chaves de `en.json` traduzidas.
- [ ] Em `src/i18n/index.ts`:
  - [ ] Adicionar `import <var> from "@/locales/<codigo>.json"`.
  - [ ] Adicionar `{ code: "<codigo>", label: "<Nome no seletor>" }` em `SUPPORTED_LANGUAGES`.
  - [ ] Adicionar `"<codigo>"` em `CODES`.
  - [ ] Adicionar `"<codigo>": { translation: <var> }` em `resources`.
- [ ] Rodar `npm run build` e corrigir erros se houver.
- [ ] Testar no jogo: Configurações → Geral → Idioma → selecionar o novo idioma.

---

## 5. Pontos de atenção

- **Hebraico (he)**  
  Idioma RTL. Se a interface já suportar árabe (RTL), provavelmente funciona; senão, pode ser necessário ajustar CSS/`dir` quando `i18n.language === 'he'` (e `ar`).

- **Nomes de variáveis de import**  
  Códigos com hífen (`pt-PT`, `zh-CN`, `zh-TW`) não podem ser usados como identificador; usar nome válido, ex.:  
  `import ptPT from "@/locales/pt-PT.json"` e registrar como `"pt-PT": { translation: ptPT }`.

- **Consistência**  
  Manter a mesma árvore de chaves de `en.json` em todos os arquivos para evitar keys faltando e fallback indesejado.

---

## 6. Validação final

- [ ] Total de arquivos em `src/locales/`: 18 + 14 = **32** arquivos `.json`.
- [ ] `SUPPORTED_LANGUAGES` com **32** entradas.
- [ ] Build: `npm run build` sem erros.
- [ ] Amostragem: abrir 2–3 idiomas novos em Configurações e verificar telas principais (início, geradores, melhorias, configurações).

---

## 7. Resumo

| Item | Quantidade |
|------|------------|
| Idiomas já existentes | 18 |
| Idiomas novos neste plano | 14 |
| **Total após implementação** | **32** |
| Arquivos a criar | 14 JSONs |
| Arquivo a editar | `src/i18n/index.ts` |

Quando quiser, podemos executar esse plano fase a fase (por exemplo, começar pela Fase 1).
