import { Badge, Mission, UserProfile } from '../types';

export const XP_RULES = {
  STRENGTH_PER_KG: 0.02,
  CARDIO_PER_KM: 15,
  WATER_GOAL: 10,
  NUTRITION_LOG: 20,
  FULL_DAY_BONUS: 30,
};

export const getXPForLevel = (level: number) => {
  if (level <= 1) return 0;
  return 50 * (level - 1) * level;
};

export const getLevelFromXP = (xp: number) => {
  let level = 1;
  while (xp >= getXPForLevel(level + 1)) {
    level++;
  }
  return level;
};

export const getStatusRank = (level: number) => {
  if (level >= 100) return 'Lenda Viva';
  if (level >= 75) return 'Mito';
  if (level >= 50) return 'Elite Alpha';
  if (level >= 36) return 'Atleta';
  if (level >= 21) return 'Guerreiro';
  if (level >= 11) return 'Consistente';
  if (level >= 6) return 'Ativo';
  return 'Iniciante';
};

// Achievement Generator Helpers
const createBadges = () => {
  const allBadges: Badge[] = [];

  // 1. FORÇA (1-100)
  for (let i = 1; i <= 100; i++) {
    let title = "";
    let requirement = 0;
    
    if (i === 1) { title = "Primeiro Peso"; requirement = 50; }
    else if (i === 2) { title = "Começando Leve"; requirement = 200; }
    else if (i === 3) { title = "Primeira Tonelada"; requirement = 1000; }
    else if (i <= 20) {
      const tons = [2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120];
      const val = tons[i - 4] || (100 + (i - 19) * 10);
      title = i <= 19 ? `${val} Toneladas` : "Força em Ascensão";
      requirement = val * 1000;
    } else if (i <= 40) {
      const titles = ["Volume Crescente", "Corpo em Evolução", "Mestre da Carga", "Força Avançada", "Peso Pesado", "Consistência de Ferro", "Domínio da Força"];
      title = `${titles[(i - 21) % titles.length]} ${Math.floor((i - 21) / titles.length) + 1}`;
      requirement = 120000 + (i - 20) * 5000;
    } else if (i <= 70) {
      const titles = ["Titã do Ferro", "Máquina de Levantar", "Brutalidade Controlada", "Força Imparável", "Evolução Máxima"];
      title = `${titles[(i - 41) % titles.length]} ${Math.floor((i - 41) / titles.length) + 1}`;
      requirement = 220000 + (i - 40) * 10000;
    } else {
      const titles = ["Lenda da Força", "Rei do Ferro", "Monstro da Academia", "Força Absoluta"];
      title = `${titles[(i - 71) % titles.length]} ${Math.floor((i - 71) / titles.length) + 1}`;
      requirement = 520000 + (i - 70) * 20000;
    }

    allBadges.push({
      id: `s_${i}`,
      title,
      description: `Levantou um total acumulado de ${(requirement / 1000).toFixed(1)}t`,
      icon: '🏋️',
      category: 'strength',
      requirement
    });
  }

  // 2. CARDIO (101-180)
  for (let i = 1; i <= 80; i++) {
    const id = 100 + i;
    let title = "";
    let requirement = 0;
    
    if (i === 1) { title = "Primeiro Km"; requirement = 1; }
    else if (i === 2) { title = "3 Km"; requirement = 3; }
    else if (i === 3) { title = "5 Km"; requirement = 5; }
    else if (i === 4) { title = "10 Km"; requirement = 10; }
    else if (i <= 10) {
      const dists = [15, 20, 30, 50, 75, 100];
      requirement = dists[i - 5];
      title = `${requirement} Km`;
    } else if (i <= 40) {
      const titles = ["Ritmo Constante", "Sem Parar", "Resistência Inicial", "Fôlego em Alta"];
      title = `${titles[(i - 11) % titles.length]} ${Math.floor((i - 11) / titles.length) + 1}`;
      requirement = 110 + (i - 10) * 5;
    } else {
      const titles = ["Maratonista", "Máquina de Cardio", "Resistência Máxima", "Sem Limites"];
      title = `${titles[(i - 41) % titles.length]} ${Math.floor((i - 41) / titles.length) + 1}`;
      requirement = 260 + (i - 40) * 10;
    }

    allBadges.push({
      id: `c_${id}`,
      title,
      description: `Percorreu ${requirement}km no total`,
      icon: '🏃',
      category: 'cardio',
      requirement
    });
  }

  // 3. HIDRATAÇÃO (181-230)
  for (let i = 1; i <= 50; i++) {
    const id = 180 + i;
    let title = "";
    let requirement = 0;
    
    if (i === 1) { title = "Primeiro Copo"; requirement = 1; } // simplified to 1 day
    else if (i === 2) { title = "1 Dia Completo"; requirement = 1; }
    else if (i <= 9) {
      const days = [3, 5, 7, 10, 15, 20, 30];
      requirement = days[i - 3];
      title = `${requirement} Dias`;
    } else if (i === 10) { title = "Hidratação em Dia"; requirement = 40; }
    else if (i <= 50) {
      const titles = ["Corpo Hidratado", "Fluxo Constante", "Disciplina Líquida", "Mestre da Água"];
      title = `${titles[(i - 11) % titles.length]} ${Math.floor((i - 11) / titles.length) + 1}`;
      requirement = 45 + (i - 10) * 5;
    }

    allBadges.push({
      id: `h_${id}`,
      title,
      description: `Bateu a meta de água por ${requirement} dias`,
      icon: '💧',
      category: 'water',
      requirement
    });
  }

  // 4. ALIMENTAÇÃO (231-300)
  for (let i = 1; i <= 70; i++) {
    const id = 230 + i;
    let title = "";
    let requirement = 0;
    
    if (i === 1) { title = "Primeiro Registro"; requirement = 1; }
    else if (i === 2) { title = "Dia Completo"; requirement = 1; }
    else if (i <= 9) {
      const days = [3, 7, 10, 15, 30, 60, 100];
      requirement = days[i - 3];
      title = `${requirement} Dias`;
    } else if (i === 10) { title = "Nutrição em Dia"; requirement = 110; }
    else {
      const titles = ["Foco na Dieta", "Controle Total", "Consistência Alimentar", "Mestre da Nutrição"];
      title = `${titles[(i - 11) % titles.length]} ${Math.floor((i - 11) / titles.length) + 1}`;
      requirement = 115 + (i - 10) * 5;
    }

    allBadges.push({
      id: `a_${id}`,
      title,
      description: `Manteve a dieta por ${requirement} dias`,
      icon: '🍽️',
      category: 'nutrition',
      requirement
    });
  }

  // 5. CONSISTÊNCIA / STREAK (301-360)
  for (let i = 1; i <= 60; i++) {
    const id = 300 + i;
    let title = "";
    let requirement = 0;
    
    const baseDays = [2, 3, 5, 7, 10, 15, 20, 30, 50, 75];
    if (i <= 10) {
      requirement = baseDays[i - 1];
      title = `${requirement} Dias Seguidos`;
    } else {
      const titles = ["Imparável", "Disciplina Total", "Sem Falhar", "Foco Absoluto"];
      title = `${titles[(i - 11) % titles.length]} ${Math.floor((i - 11) / titles.length) + 1}`;
      requirement = 80 + (i - 10) * 5;
    }

    allBadges.push({
      id: `st_${id}`,
      title,
      description: `Manteve um streak de ${requirement} dias ativos`,
      icon: '🔥',
      category: 'consistency',
      requirement
    });
  }

  // 6. MISSÕES (361-410)
  for (let i = 1; i <= 50; i++) {
    const id = 360 + i;
    let title = "";
    let requirement = 0;
    
    if (i === 1) { title = "Primeira Missão"; requirement = 1; }
    else if (i <= 8) {
      const counts = [5, 10, 20, 30, 50, 75, 100];
      requirement = counts[i - 2];
      title = `${requirement} Missões`;
    } else {
      const titles = ["Executor", "Missão Cumprida", "Sem Falhas", "Elite das Missões"];
      title = `${titles[(i - 9) % titles.length]} ${Math.floor((i - 9) / titles.length) + 1}`;
      requirement = 110 + (i - 9) * 10;
    }

    allBadges.push({
      id: `m_${id}`,
      title,
      description: `Completou ${requirement} missões no total`,
      icon: '🎯',
      category: 'missions',
      requirement
    });
  }

  // 7. USO DO APP (411-450)
  for (let i = 1; i <= 40; i++) {
    const id = 410 + i;
    let title = "";
    let requirement = 0;
    
    const baseDays = [1, 3, 7, 15, 30, 60, 90, 120, 180, 365];
    if (i <= 10) {
      requirement = baseDays[i - 1];
      title = i === 1 ? "Primeiro Login" : `${requirement} Dias de Uso`;
    } else {
      const titles = ["Sempre Presente", "Hábito Criado", "Rotina Ativa", "Parte do Dia"];
      title = `${titles[(i - 11) % titles.length]} ${Math.floor((i - 11) / titles.length) + 1}`;
      requirement = 370 + (i - 10) * 10;
    }

    allBadges.push({
      id: `u_${id}`,
      title,
      description: `Membro da comunidade Vitalis por ${requirement} dias`,
      icon: '🧠',
      category: 'usage',
      requirement
    });
  }

  // 8. CONQUISTAS ESPECIAIS (451-499)
  for (let i = 1; i <= 49; i++) {
    const id = 450 + i;
    let title = "";
    let requirement = 0;
    
    const specs = ["Primeiro Treino", "Primeiro Cardio", "Primeira Meta", "Primeiro Dia Completo", "Primeira Semana Perfeita", "Primeiro Mês Perfeito"];
    if (i <= 6) {
      title = specs[i - 1];
      requirement = i; // random req
    } else {
      const titles = ["Superação", "Evolução", "Quebrando Limites", "Mente Forte", "Corpo em Evolução", "Consistência Real", "Determinação", "Novo Nível", "Transformação"];
      title = `${titles[(i - 7) % titles.length]} ${Math.floor((i - 7) / titles.length) + 1}`;
      requirement = i;
    }

    allBadges.push({
      id: `sp_${id}`,
      title,
      description: "Uma conquista única por sua dedicação excepcional",
      icon: '🏆',
      category: 'special',
      requirement
    });
  }

  // 9. CONQUISTA FINAL (500)
  allBadges.push({
    id: `legend_500`,
    title: "🎖️ LENDÁRIO – 1 ANO DE CONSISTÊNCIA",
    description: "Você alcançou o ápice. 365 dias de dedicação total ao seu corpo e mente.",
    icon: '👑',
    category: 'special',
    requirement: 365
  });

  return allBadges;
};

export const BADGES: Badge[] = createBadges();

export const DAILY_MISSIONS: Mission[] = [
  { id: 'm_water', title: 'Hidratação Máxima', description: 'Bata sua meta de água hoje', xpReward: 10, type: 'daily', category: 'water', requirement: 1 },
  { id: 'm_workout', title: 'Hora do Show', description: 'Realize pelo menos 1 treino hoje', xpReward: 15, type: 'daily', category: 'workout', requirement: 1 },
  { id: 'm_nutrition', title: 'Dieta em Dia', description: 'Registre todas as suas refeições', xpReward: 20, type: 'daily', category: 'nutrition', requirement: 3 },
];

export const WEEKLY_MISSIONS: Mission[] = [
  { id: 'w_workouts', title: 'Foco Total', description: 'Complete 3 treinos na semana', xpReward: 50, type: 'weekly', category: 'workout', requirement: 3 },
  { id: 'w_cardio', title: 'Estrada Infinita', description: 'Percorra 10km de cardio', xpReward: 60, type: 'weekly', category: 'cardio', requirement: 10 },
  { id: 'w_consistency', title: 'Ritmo Perfeito', description: 'Seja ativo por 5 dias na semana', xpReward: 100, type: 'weekly', category: 'consistency', requirement: 5 },
];
