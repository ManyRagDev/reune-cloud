/**
 * Algoritmo de sorteio de Amigo Secreto
 * Garante que ninguém tire a si mesmo
 */

interface Participant {
  user_id: string;
}

interface DrawResult {
  giver_id: string;
  receiver_id: string;
}

export function validateParticipants(participants: Participant[]): {
  valid: boolean;
  error?: string;
} {
  if (participants.length < 2) {
    return {
      valid: false,
      error: "É necessário pelo menos 2 participantes para realizar o sorteio.",
    };
  }

  // Verificar se há participantes duplicados (mesmo user_id repetido)
  const uniqueUserIds = new Set(participants.map((p) => p.user_id));
  if (uniqueUserIds.size !== participants.length) {
    return {
      valid: false,
      error: "Há participantes duplicados. Remova as duplicatas antes de sortear.",
    };
  }

  if (participants.length === 2) {
    // Com apenas 2 pessoas, o sorteio é trivial mas válido
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Realiza o sorteio usando algoritmo de embaralhamento Fisher-Yates
 * com garantia de que ninguém tira a si mesmo
 */
export function performSecretSantaDraw(
  participants: Participant[],
  previousPairs?: DrawResult[]
): DrawResult[] {
  const validation = validateParticipants(participants);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const n = participants.length;
  const givers = [...participants];
  const receivers = [...participants];

  // Algoritmo de desarranjo (derangement)
  // Garante que nenhum elemento fique na sua posição original
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    // Embaralhar receivers usando Fisher-Yates
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }

    // Verificar se ninguém tirou a si mesmo
    let isValid = true;
    for (let i = 0; i < n; i++) {
      if (givers[i].user_id === receivers[i].user_id) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      // Verificar restrições de repetição (se fornecidas)
      if (previousPairs && previousPairs.length > 0) {
        let hasRepeat = false;
        for (let i = 0; i < n; i++) {
          const pair = previousPairs.find(
            (p) =>
              p.giver_id === givers[i].user_id &&
              p.receiver_id === receivers[i].user_id
          );
          if (pair) {
            hasRepeat = true;
            break;
          }
        }

        if (!hasRepeat) {
          // Sorteio válido sem repetições
          return givers.map((giver, index) => ({
            giver_id: giver.user_id,
            receiver_id: receivers[index].user_id,
          }));
        }
      } else {
        // Sorteio válido sem verificação de repetições
        return givers.map((giver, index) => ({
          giver_id: giver.user_id,
          receiver_id: receivers[index].user_id,
        }));
      }
    }
  }

  // Se não conseguiu em maxAttempts, retornar resultado básico
  // (isso é extremamente raro, praticamente impossível com mais de 3 participantes)
  throw new Error(
    "Não foi possível encontrar um sorteio válido após várias tentativas. Tente novamente."
  );
}

/**
 * Testa o algoritmo de sorteio
 */
export function testSecretSantaDraw() {
  console.log("🧪 Testando algoritmo de Amigo Secreto...\n");

  // Teste 1: 2 participantes
  console.log("Teste 1: 2 participantes");
  const test1 = [
    { user_id: "user-1" },
    { user_id: "user-2" },
  ];
  try {
    const result1 = performSecretSantaDraw(test1);
    console.log("✅ Resultado:", result1);
    console.assert(
      result1[0].giver_id !== result1[0].receiver_id,
      "Erro: giver 1 tirou a si mesmo"
    );
    console.assert(
      result1[1].giver_id !== result1[1].receiver_id,
      "Erro: giver 2 tirou a si mesmo"
    );
    console.log("✅ Ninguém tirou a si mesmo\n");
  } catch (err) {
    console.error("❌ Erro:", err);
  }

  // Teste 2: 3 participantes
  console.log("Teste 2: 3 participantes");
  const test2 = [
    { user_id: "user-1" },
    { user_id: "user-2" },
    { user_id: "user-3" },
  ];
  try {
    const result2 = performSecretSantaDraw(test2);
    console.log("✅ Resultado:", result2);
    result2.forEach((pair, index) => {
      console.assert(
        pair.giver_id !== pair.receiver_id,
        `Erro: giver ${index} tirou a si mesmo`
      );
    });
    console.log("✅ Ninguém tirou a si mesmo\n");
  } catch (err) {
    console.error("❌ Erro:", err);
  }

  // Teste 3: 5 participantes
  console.log("Teste 3: 5 participantes");
  const test3 = [
    { user_id: "user-1" },
    { user_id: "user-2" },
    { user_id: "user-3" },
    { user_id: "user-4" },
    { user_id: "user-5" },
  ];
  try {
    const result3 = performSecretSantaDraw(test3);
    console.log("✅ Resultado:", result3);
    result3.forEach((pair, index) => {
      console.assert(
        pair.giver_id !== pair.receiver_id,
        `Erro: giver ${index} tirou a si mesmo`
      );
    });
    console.log("✅ Ninguém tirou a si mesmo\n");
  } catch (err) {
    console.error("❌ Erro:", err);
  }

  // Teste 4: Validação com apenas 1 participante
  console.log("Teste 4: 1 participante (deve falhar)");
  const test4 = [{ user_id: "user-1" }];
  try {
    const result4 = performSecretSantaDraw(test4);
    console.error("❌ Erro: deveria ter falhado");
  } catch (err) {
    console.log("✅ Erro esperado:", (err as Error).message, "\n");
  }

  // Teste 5: Participantes duplicados (deve falhar)
  console.log("Teste 5: Participantes duplicados (deve falhar)");
  const test5 = [
    { user_id: "user-1" },
    { user_id: "user-1" },
  ];
  try {
    const result5 = performSecretSantaDraw(test5);
    console.error("❌ Erro: deveria ter falhado");
  } catch (err) {
    console.log("✅ Erro esperado:", (err as Error).message, "\n");
  }

  console.log("🎉 Todos os testes concluídos!");
}

/**
 * Realiza o sorteio para o Sorteador Relâmpago (sem cadastro).
 * Garante matematicamente um ciclo hamiltoniano onde:
 * 1. Ninguém tira a si mesmo.
 * 2. Todos tiram exatamente 1 pessoa.
 * 3. Todos são tirados por exatamente 1 pessoa.
 */
export function performQuickSecretSantaDraw(
  rawNames: string[]
): Array<{ name: string; target_name: string }> {
  // Limpar nomes e remover vazios
  const cleanNames = rawNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (cleanNames.length < 3) {
    throw new Error("O Amigo Secreto precisa de pelo menos 3 participantes.");
  }

  // Verificar nomes duplicados
  const uniqueNames = new Set(cleanNames.map((n) => n.toLowerCase()));
  if (uniqueNames.size !== cleanNames.length) {
    throw new Error("Não pode haver nomes repetidos na lista. Diferencie com apelido ou sobrenome.");
  }

  // Fisher-Yates Shuffle
  const shuffled = [...cleanNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ciclo fechado garantido: shuffled[i] -> shuffled[(i + 1) % n]
  const n = shuffled.length;
  const pairs: Array<{ name: string; target_name: string }> = [];

  for (let i = 0; i < n; i++) {
    pairs.push({
      name: shuffled[i],
      target_name: shuffled[(i + 1) % n],
    });
  }

  return pairs;
}
