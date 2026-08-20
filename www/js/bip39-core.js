// Núcleo BIP39: conversão de palavras de entropia em candidatos de checksum,
// e análise de qualidade da entropia coletada. Sem rede, sem dependências externas.
// Lógica de checksum portada de github.com/FelipeCOjeda/bip39-Checksumcalculator

const BIP39Core = (() => {
  function wordlistFor(lang) {
    return window.BIP39_WORDLISTS[lang] || window.BIP39_WORDLISTS.portuguese;
  }

  // words: array de N-1 palavras de entropia (11 ou 23) já validadas contra a wordlist.
  // seedSize: 12 ou 24.
  // Retorna todos os candidatos possíveis para a última palavra (entropia restante + checksum),
  // ordenados por índice. Isso é o mesmo princípio usado pelo BIP39: a última palavra carrega
  // os bits de entropia que sobraram + o checksum SHA-256 do restante.
  async function checksumCandidates(words, lang, seedSize) {
    const list = wordlistFor(lang);
    let entropyBits = '';
    for (const w of words) {
      const idx = list.indexOf(w);
      if (idx < 0) throw new Error(`Palavra fora da wordlist: "${w}"`);
      entropyBits += idx.toString(2).padStart(11, '0');
    }

    const checksumLen = seedSize === 12 ? 4 : 8;
    const wordsNeeded = seedSize === 12 ? 11 : 23;
    if (words.length !== wordsNeeded) {
      throw new Error(`Esperado ${wordsNeeded} palavras de entropia, recebido ${words.length}`);
    }

    const extraBits = 11 - checksumLen; // bits de entropia restantes que cabem na última palavra
    const combos = 1 << extraBits;
    const results = [];

    for (let c = 0; c < combos; c++) {
      const extraStr = c.toString(2).padStart(extraBits, '0');
      const fullEntropy = entropyBits + extraStr;
      const byteLen = fullEntropy.length / 8;
      const bytes = new Uint8Array(byteLen);
      for (let b = 0; b < byteLen; b++) {
        bytes[b] = parseInt(fullEntropy.substr(b * 8, 8), 2);
      }
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      const hashArr = new Uint8Array(hash);
      let hashBits = '';
      for (let b = 0; b < Math.ceil(checksumLen / 8); b++) {
        hashBits += hashArr[b].toString(2).padStart(8, '0');
      }
      const csBits = hashBits.substr(0, checksumLen);
      const lastWordBits = extraStr + csBits;
      const lastWordIdx = parseInt(lastWordBits, 2);
      results.push({ idx: lastWordIdx, word: list[lastWordIdx], extra: extraStr });
    }

    results.sort((a, b) => a.idx - b.idx);
    return results;
  }

  // Verifica se uma frase completa (12/24 palavras) tem checksum válido.
  async function validateMnemonic(words, lang) {
    const seedSize = words.length;
    if (seedSize !== 12 && seedSize !== 24) return { valid: false, reason: 'Tamanho de seed inválido' };
    const body = words.slice(0, -1);
    const lastWord = words[words.length - 1];
    const candidates = await checksumCandidates(body, lang, seedSize);
    const ok = candidates.some(c => c.word === lastWord);
    return { valid: ok };
  }

  // Score de entropia efetiva (0-10) + avisos de padrão, mesma heurística usada
  // nas ferramentas de dados/baralho/bingo/moedas.
  function analyzeQuality(collected) {
    const total = collected.length;
    const unique = new Set(collected.map(w => w.index)).size;
    const bitsPerWord = 11;
    const effectiveEntropy = unique * bitsPerWord;
    const maxEntropy = total * bitsPerWord;
    const ratio = maxEntropy > 0 ? effectiveEntropy / maxEntropy : 0;
    const midRatio = maxEntropy > 0 ? 33 / maxEntropy : 0;
    let score;
    if (ratio <= midRatio) score = (ratio / (midRatio || 1)) * 5;
    else score = 5 + ((ratio - midRatio) / (1 - midRatio)) * 5;
    score = Math.min(10, Math.max(0, score));

    const warnings = [];
    const counts = {};
    collected.forEach(w => { counts[w.index] = (counts[w.index] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, c]) => c > 1);
    if (repeated.length > 0) {
      warnings.push({ sev: 'high', msg: `Palavras repetidas (${repeated.length})` });
    }
    if (total >= 3) {
      for (let i = 0; i < total - 2; i++) {
        if (collected[i + 1].index === collected[i].index + 1 && collected[i + 2].index === collected[i].index + 2) {
          warnings.push({ sev: 'high', msg: `Índices sequenciais na posição ${i + 1}-${i + 3}` });
          break;
        }
      }
    }
    if (total >= 3) {
      const initials = collected.map(w => w.word[0].toLowerCase());
      let allAlpha = true;
      for (let i = 1; i < initials.length; i++) if (initials[i] < initials[i - 1]) { allAlpha = false; break; }
      if (allAlpha) warnings.push({ sev: 'medium', msg: 'Todas as iniciais em ordem alfabética' });
    }

    return { score, effectiveEntropy, maxEntropy, unique, total, warnings };
  }

  return { wordlistFor, checksumCandidates, validateMnemonic, analyzeQuality };
})();
