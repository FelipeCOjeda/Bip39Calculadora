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

  // Cada tipo de dado (D6/D12/D20) é seu próprio método, com uma variação
  // por quantidade de dados lançados por vez (1 a 11 "lances"). Rodadas =
  // número mínimo de rodadas para acumular pelo menos minTotal dados desse
  // tipo no total (faces^minTotal ≥ 2048, cobrindo a faixa de 2048 palavras;
  // para D6 é 5, mesmo limiar do método original). Nenhum dado jogado é
  // descartado: todos os dígitos entram na conta, só o limiar de rejeição
  // muda com o total (ver pick).
  function registerDiceMethod(faces, methodLabel, origin) {
    let minTotal = 1;
    while (Math.pow(faces, minTotal) < 2048) minTotal++;

    register({
      id: `dados_d${faces}`,
      label: methodLabel,
      origin,
      isDice: true,
      variations: Array.from({ length: 11 }, (_, i) => {
        const n = i + 1;
        const rounds = Math.ceil(minTotal / n);
        const total = rounds * n;
        return {
          id: `${n}x`,
          label: n === minTotal
            ? `${n} dado${n > 1 ? 's' : ''} por lance (padrão, 1 rodada, ${total} no total)`
            : `${n} dado${n > 1 ? 's' : ''} por lance (${rounds} rodada${rounds > 1 ? 's' : ''}, ${total} no total)`,
          faces,
          diceCount: n,
          rounds,
          default: n === minTotal
        };
      }),
      // inputs: array com todos os valores 1..faces jogados (rounds*diceCount),
      // na ordem em que foram jogados. Índice = número em base `faces` desses
      // dígitos; se cair na faixa que causaria viés no módulo `mod` (padrão
      // 2048), descarta. `mod` menor é usado para sortear só os bits extras
      // da palavra de checksum (ver checksumDraw em app.js).
      pick(inputs, f, mod) {
        const base = f || faces;
        const m = mod || 2048;
        let idx = 0;
        for (const d of inputs) idx = idx * base + (d - 1);
        const total = Math.pow(base, inputs.length);
        const usable = Math.floor(total / m) * m;
        if (idx >= usable) {
          return {
            valid: false,
            discardReason: `Combinação fora da faixa utilizável (${usable} de ${total}) — descarte e jogue os ${inputs.length} dados de novo.`,
            detail: { idx, total }
          };
        }
        return { valid: true, index: idx % m, detail: { idx, total } };
      },
      // Menor quantidade de dados necessária para cobrir `mod` valores sem viés.
      diceCountFor(mod) {
        let n = 1;
        while (Math.pow(faces, n) < mod) n++;
        return n;
      }
    });
  }

  registerDiceMethod(6, 'Dados (D6)', 'github.com/FelipeCOjeda/Bip39-Dados6');
  registerDiceMethod(12, 'Dados (D12)', 'Generaliza a fórmula do Bip39-Dados6 (D6) para D12');
  registerDiceMethod(20, 'Dados (D20)', 'Generaliza a fórmula do Bip39-Dados6 (D6) para D20');

  register({
    id: 'baralho',
    label: 'Baralho (2 cartas, sem reposição)',
    origin: 'github.com/FelipeCOjeda/Bip39-baralho',
    variations: [
      { id: '1baralho52', label: '1 baralho, 52 cartas (padrão)', deckSize: 52, default: true },
      { id: '2baralhos104', label: '2 baralhos, 104 cartas', deckSize: 104 }
    ],
    // inputs: [a, b, deckSize] índices 0..deckSize-1 de duas cartas distintas.
    // `mod` opcional: usado para sortear só os bits extras da palavra de
    // checksum (ver checksumDraw em app.js); sem ele, mantém a faixa 0-2047
    // original do método.
    pick(inputs, mod) {
      const [a, b, deckSize] = inputs;
      if (a === b) return { valid: false, discardReason: 'Cartas iguais — escolha duas cartas diferentes.' };
      const bp = b < a ? b : b - 1;
      const n = (deckSize - 1) * a + bp;
      if (!mod) {
        if (n > 2047) return { valid: false, discardReason: 'N > 2047 — devolva as cartas, embaralhe e repita.', detail: { n } };
        return { valid: true, index: n, detail: { n } };
      }
      const total = deckSize * (deckSize - 1);
      const usable = Math.floor(total / mod) * mod;
      if (n >= usable) return { valid: false, discardReason: 'Fora da faixa utilizável — devolva as cartas, embaralhe e repita.', detail: { n } };
      return { valid: true, index: n % mod, detail: { n } };
    }
  });

  register({
    id: 'bingo',
    label: 'Bingo (2 bolas de 1 a 60)',
    origin: 'github.com/FelipeCOjeda/Bip39-Bingo',
    variations: [
      { id: '2bolas60', label: '2 bolas, 1-60 (padrão)' }
    ],
    // inputs: [b1, b2] cada um 1-60. `mod` opcional para sortear só os bits
    // extras da palavra de checksum (ver checksumDraw em app.js).
    pick(inputs, mod) {
      const [b1, b2] = inputs;
      const idx = (b1 - 1) * 60 + (b2 - 1);
      const m = mod || 2048;
      const usable = Math.floor(3600 / m) * m;
      if (idx >= usable) return { valid: false, discardReason: 'Índice fora da faixa utilizável — sorteie as duas bolas de novo.', detail: { idx } };
      return { valid: true, index: idx % m, detail: { idx } };
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
