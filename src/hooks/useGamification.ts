import { useState, useCallback } from 'react';
import { useUser } from './useUser';
import { db } from '../db/db';
import { getLevelFromXP, getXPForLevel, BADGES } from '../lib/gamification';
import { UserProfile } from '../types';

export const useGamification = () => {
  const { profile, updateProfile } = useUser();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  const addXP = useCallback(async (amount: number) => {
    if (!profile) return;

    const currentXP = profile.xp || 0;
    const newXP = currentXP + amount;
    const currentLevel = profile.level || 1;
    const levelAtNewXP = getLevelFromXP(newXP);

    const updates: Partial<UserProfile> = {
      xp: newXP,
    };

    if (levelAtNewXP > currentLevel) {
      updates.level = levelAtNewXP;
      setNewLevel(levelAtNewXP);
      setShowLevelUp(true);
    }

    await updateProfile(updates);
  }, [profile, updateProfile]);

  const updateStats = useCallback(async (stats: { weight?: number; cardioKm?: number; waterDayFinished?: boolean; nutritionDayFinished?: boolean; missionFinished?: boolean; appUsedToday?: boolean }) => {
    if (!profile) return;

    const updates: Partial<UserProfile> = {};
    let totalXPGained = 0;

    if (stats.appUsedToday) {
      updates.appUsageDaysCount = (profile.appUsageDaysCount || 0) + 1;
      updates.lastActiveDate = new Date().toISOString().split('T')[0];
      totalXPGained += 5;
    }

    if (stats.weight) {
      const currentWeight = profile.totalWeightLifted || 0;
      updates.totalWeightLifted = currentWeight + stats.weight;
      totalXPGained += stats.weight * 0.02; // XP_RULES.STRENGTH_PER_KG
    }

    if (stats.cardioKm) {
      const currentCardio = profile.totalCardioDistance || 0;
      updates.totalCardioDistance = currentCardio + stats.cardioKm;
      totalXPGained += stats.cardioKm * 15; // XP_RULES.CARDIO_PER_KM
    }

    if (stats.waterDayFinished) {
      updates.waterDaysCount = (profile.waterDaysCount || 0) + 1;
      totalXPGained += 10;
    }

    if (stats.nutritionDayFinished) {
      updates.nutritionDaysCount = (profile.nutritionDaysCount || 0) + 1;
      totalXPGained += 20;
    }

    if (stats.missionFinished) {
      updates.missionsCompletedCount = (profile.missionsCompletedCount || 0) + 1;
      totalXPGained += 5;
    }

    // Check for new achievements
    const currentBadges = profile.achievements || [];
    const newBadges = [...currentBadges];
    let badgeGained = false;

    const totalWeight = updates.totalWeightLifted ?? profile.totalWeightLifted ?? 0;
    const totalCardio = updates.totalCardioDistance ?? profile.totalCardioDistance ?? 0;
    const currentStreak = profile.streak || 0;
    const waterDays = updates.waterDaysCount ?? profile.waterDaysCount ?? 0;
    const nutritionDays = updates.nutritionDaysCount ?? profile.nutritionDaysCount ?? 0;
    const missions = updates.missionsCompletedCount ?? profile.missionsCompletedCount ?? 0;
    const usageDays = updates.appUsageDaysCount ?? profile.appUsageDaysCount ?? 0;

    BADGES.forEach(badge => {
      if (!currentBadges.includes(badge.id)) {
        let satisfied = false;
        if (badge.category === 'strength') satisfied = totalWeight >= badge.requirement;
        else if (badge.category === 'cardio') satisfied = totalCardio >= badge.requirement;
        else if (badge.category === 'water') satisfied = waterDays >= badge.requirement;
        else if (badge.category === 'nutrition') satisfied = nutritionDays >= badge.requirement;
        else if (badge.category === 'consistency') satisfied = currentStreak >= badge.requirement;
        else if (badge.category === 'missions') satisfied = missions >= badge.requirement;
        else if (badge.category === 'usage') satisfied = usageDays >= badge.requirement;
        else if (badge.category === 'special') {
          // Check specific logic for specials if needed, otherwise rely on manual/other triggers
          if (badge.id === 'legend_500') satisfied = usageDays >= 365;
        }

        if (satisfied) {
          newBadges.push(badge.id);
          badgeGained = true;
        }
      }
    });

    if (badgeGained) {
      updates.achievements = newBadges;
    }

    const currentXP = profile.xp || 0;
    const newXP = currentXP + Math.round(totalXPGained);
    const currentLevel = profile.level || 1;
    const levelAtNewXP = getLevelFromXP(newXP);

    updates.xp = newXP;
    if (levelAtNewXP > currentLevel) {
      updates.level = levelAtNewXP;
      setNewLevel(levelAtNewXP);
      setShowLevelUp(true);
    }

    await updateProfile(updates);
  }, [profile, updateProfile]);

  return {
    addXP,
    updateStats,
    showLevelUp,
    setShowLevelUp,
    newLevel,
    xpProgress: profile ? {
      current: profile.xp - getXPForLevel(profile.level),
      total: getXPForLevel(profile.level + 1) - getXPForLevel(profile.level),
      percent: ((profile.xp - getXPForLevel(profile.level)) / (getXPForLevel(profile.level + 1) - getXPForLevel(profile.level))) * 100
    } : { current: 0, total: 100, percent: 0 }
  };
};
