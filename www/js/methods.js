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
    label: 'Dados (D6)',
    origin: 'github.com/FelipeCOjeda/Bip39-Dados6',
    // Uma variação por quantidade de dados jogados por rodada (1 a 11).
    // Rodadas = número mínimo de rodadas para acumular pelo menos 5 dados
    // no total (6^5 = 7776 ≥ 2048, o mesmo limiar do método original de
    // 5 dados). Nenhum dado jogado é descartado: todos os dígitos entram
    // na conta (ver pick abaixo), só o limiar de rejeição muda com o total.
    variations: Array.from({ length: 11 }, (_, i) => {
      const n = i + 1;
      const rounds = Math.ceil(5 / n);
      const total = rounds * n;
      return {
        id: `${n}d6`,
        label: n === 5
          ? '5 dados por vez (padrão, 1 rodada, 5 no total)'
          : `${n} dado${n > 1 ? 's' : ''} por vez (${rounds} rodada${rounds > 1 ? 's' : ''}, ${total} no total)`,
        diceCount: n,
        rounds,
        default: n === 5
      };
    }),
    // inputs: array com todos os valores 1-6 jogados (rounds*diceCount),
    // na ordem em que foram jogados. Índice = número em base 6 desses
    // dígitos; se cair na faixa que causaria viés no módulo 2048, descarta.
    pick(inputs) {
      let idx = 0;
      for (const d of inputs) idx = idx * 6 + (d - 1);
      const total = Math.pow(6, inputs.length);
      const usable = Math.floor(total / 2048) * 2048;
      if (idx >= usable) {
        return {
          valid: false,
          discardReason: `Combinação fora da faixa utilizável (${usable} de ${total}) — descarte e jogue os ${inputs.length} dados de novo.`,
          detail: { idx, total }
        };
      }
      return { valid: true, index: idx % 2048, detail: { idx, total } };
    }
  });

  register({
    id: 'baralho',
    label: 'Baralho (2 cartas, sem reposição)',
    origin: 'github.com/FelipeCOjeda/Bip39-baralho',
    variations: [
      { id: '1baralho52', label: '1 baralho, 52 cartas (padrão)', deckSize: 52, default: true },
      { id: '2baralhos104', label: '2 baralhos, 104 cartas', deckSize: 104 }
    ],
    // inputs: [a, b, deckSize] índices 0..deckSize-1 de duas cartas distintas
    pick(inputs) {
      const [a, b, deckSize] = inputs;
      if (a === b) return { valid: false, discardReason: 'Cartas iguais — escolha duas cartas diferentes.' };
      const bp = b < a ? b : b - 1;
      const n = (deckSize - 1) * a + bp;
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
