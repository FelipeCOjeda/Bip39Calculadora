// Registro de métodos físicos de geração de entropia.
// Cada método expõe: id, label, inputs esperados por palavra, e uma função
// pick(inputs) -> { valid, index, discardReason?, detail } que mapeia a jogada
// física para um índice 0-2047 na wordlist (ou indica descarte/nova jogada
// quando o intervalo sorteado tem viés, exatamente como nos repositórios originais).
//
// "Variação" = parametrização do mesmo método físico (ex: técnica de moedas
// 11x1 vs 6x2 vs 4+4+3). Para adicionar uma variação nova, basta registrar
// outra entrada aqui — a UI (app.js) lê esse registro dinamicamente.

const BIP39Methods = (() => {
  const methods = {};

  function register(method) { methods[method.id] = method; }

  register({
    id: 'dados',
    label: 'Dados (5×D6)',
    origin: 'github.com/FelipeCOjeda/Bip39-Dados6',
    variations: [
      { id: '5d6', label: '5 dados de 6 faces (padrão)', dieFaces: 6, dieCount: 5 }
    ],
    // inputs: array de 5 valores 1-6
    pick(inputs) {
      const [d1, d2, d3, d4, d5] = inputs;
      const idx = (d1 - 1) * 1296 + (d2 - 1) * 216 + (d3 - 1) * 36 + (d4 - 1) * 6 + (d5 - 1);
      if (idx >= 6144) return { valid: false, discardReason: 'Índice ≥ 6144 — role os 5 dados de novo.', detail: { idx } };
      return { valid: true, index: idx % 2048, detail: { idx } };
    }
  });

  register({
    id: 'baralho',
    label: 'Baralho (2 cartas, sem reposição)',
    origin: 'github.com/FelipeCOjeda/Bip39-baralho',
    variations: [
      { id: '2cartas', label: '2 cartas de um baralho de 52 (padrão)' }
    ],
    // inputs: [a, b] índices 0-51 de duas cartas distintas
    pick(inputs) {
      const [a, b] = inputs;
      if (a === b) return { valid: false, discardReason: 'Cartas iguais — escolha duas cartas diferentes.' };
      const bp = b < a ? b : b - 1;
      const n = 51 * a + bp;
      if (n > 2047) return { valid: false, discardReason: 'N > 2047 — devolva as cartas, embaralhe e repita.', detail: { n } };
      return { valid: true, index: n, detail: { n } };
    }
  });

  register({
    id: 'bingo',
    label: 'Bingo (2 bolas de 1 a 60)',
    origin: 'github.com/FelipeCOjeda/Bip39-Bingo',
    variations: [
      { id: '2bolas60', label: '2 bolas, 1-60 (padrão)' }
    ],
    // inputs: [b1, b2] cada um 1-60
    pick(inputs) {
      const [b1, b2] = inputs;
      const idx = (b1 - 1) * 60 + (b2 - 1);
      if (idx >= 2048) return { valid: false, discardReason: 'Índice ≥ 2048 — sorteie as duas bolas de novo.', detail: { idx } };
      return { valid: true, index: idx, detail: { idx } };
    }
  });

  register({
    id: 'moedas',
    label: 'Moedas (cara/coroa)',
    origin: 'github.com/FelipeCOjeda/bip39-moedas',
    variations: [
      { id: '11x1', label: '11 lançamentos individuais (padrão, sem descarte)', groups: [11] },
      { id: '6x2', label: '2 lançamentos de 6+5 (1 moeda descartada)', groups: [6, 5], discard: 1 },
      { id: '4x3', label: '3 lançamentos de 4+4+3 (1 moeda descartada)', groups: [4, 4, 3], discard: 1 }
    ],
    // inputs: array de 11 bits (0=cara,1=coroa) já concatenados pela UI conforme a variação
    pick(inputs) {
      const bits = inputs.join('');
      const idx = parseInt(bits, 2);
      return { valid: true, index: idx, detail: { bits } };
    }
  });

  return {
    all: () => Object.values(methods),
    get: id => methods[id]
  };
})();
