import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  QUESTS,
  NPCS,
  SECTIONS,
  FACTIONS,
  createDefaultWorldState,
  type WorldState,
  type Quest,
  type NPC,
  type Section,
} from "./enhancedData";

/**
 * Quest Engine
 * ============
 * React context for managing world state, quests, NPC interactions,
 * and progression.
 */

interface QuestContextValue {
  world: WorldState;
  activeQuest: Quest | null;
  availableQuests: Quest[];
  visitBuilding: (sectionId: string) => void;
  interactNPC: (npc: NPC) => { dialogue: string; questOffered?: Quest };
  acceptQuest: (questId: string) => void;
  completeQuestObjective: (objectiveId: string) => void;
  discoverSector: (sectorId: number) => void;
  advanceTime: (hours: number) => void;
  setWeather: (type: WorldState["weather"]["type"]) => void;
}

const QuestContext = createContext<QuestContextValue | null>(null);

export function useQuestEngine() {
  const ctx = useContext(QuestContext);
  if (!ctx) throw new Error("useQuestEngine must be used within QuestProvider");
  return ctx;
}

export function QuestProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<WorldState>(createDefaultWorldState);

  const activeQuest = world.activeQuestId
    ? QUESTS.find((q) => q.id === world.activeQuestId) ?? null
    : null;

  const availableQuests = QUESTS.filter(
    (q) => !q.completed && !q.active && !world.completedQuests.includes(q.id)
  );

  const visitBuilding = useCallback((sectionId: string) => {
    setWorld((w) => {
      if (w.visitedBuildings.includes(sectionId)) return w;
      const section = SECTIONS.find((s) => s.id === sectionId);
      const newVisited = [...w.visitedBuildings, sectionId];
      const newSectors = section && !w.discoveredSectors.includes(section.sector)
        ? [...w.discoveredSectors, section.sector]
        : w.discoveredSectors;

      // Check quest objectives
      const active = w.activeQuestId ? QUESTS.find((q) => q.id === w.activeQuestId) : null;
      if (active) {
        const updated = active.objectives.map((obj) => {
          if (obj.completed) return obj;
          if (obj.targetType === "visit" && obj.targetId === sectionId) {
            return { ...obj, completed: true };
          }
          if (obj.targetType === "visit" && obj.targetId === "all-sectors") {
            if (newSectors.length >= 8) return { ...obj, completed: true };
          }
          return obj;
        });
        const allDone = updated.every((o) => o.completed);
        if (allDone) {
          // Auto-complete quest
          return {
            ...w,
            visitedBuildings: newVisited,
            discoveredSectors: newSectors,
            completedQuests: [...w.completedQuests, active.id],
            activeQuestId: null,
            playerLevel: w.playerLevel + 1,
            reputation: {
              ...w.reputation,
              [active.giverId === "npc-ghost" ? "Void Walkers" :
               active.giverId === "npc-aria" ? "Neural Syndicate" :
               active.giverId === "npc-glitch" ? "Data Cartel" :
               active.giverId === "npc-renderer" ? "Render Guild" :
               active.giverId === "npc-quantum" ? "Quantum Front" :
               active.giverId === "npc-sensor" ? "Sensory Net" : "Neural Syndicate"]: (w.reputation[active.giverId === "npc-ghost" ? "Void Walkers" :
               active.giverId === "npc-aria" ? "Neural Syndicate" :
               active.giverId === "npc-glitch" ? "Data Cartel" :
               active.giverId === "npc-renderer" ? "Render Guild" :
               active.giverId === "npc-quantum" ? "Quantum Front" :
               active.giverId === "npc-sensor" ? "Sensory Net" : "Neural Syndicate"] || 0) + 50,
            },
          };
        }
      }

      return {
        ...w,
        visitedBuildings: newVisited,
        discoveredSectors: newSectors,
      };
    });
  }, []);

  const interactNPC = useCallback((npc: NPC) => {
    const quest = npc.questId ? QUESTS.find((q) => q.id === npc.questId) : undefined;
    const isQuestGiver = quest && !quest.completed && !quest.active;

    if (world.activeQuestId === quest?.id) {
      // Check if all objectives done
      const allDone = quest.objectives.every((o) => o.completed);
      if (allDone) {
        return {
          dialogue: `Excellent work, operative. ${quest.reward} granted.`,
        };
      }
      return {
        dialogue: npc.dialogue[2] ?? npc.dialogue[0],
      };
    }

    if (isQuestGiver) {
      return {
        dialogue: npc.dialogue[2] ?? npc.dialogue[0],
        questOffered: quest,
      };
    }

    // Random dialogue
    const idx = Math.floor(Math.random() * npc.dialogue.length);
    return { dialogue: npc.dialogue[idx] };
  }, [world]);

  const acceptQuest = useCallback((questId: string) => {
    setWorld((w) => ({
      ...w,
      activeQuestId: questId,
    }));
  }, []);

  const completeQuestObjective = useCallback((objectiveId: string) => {
    setWorld((w) => {
      if (!w.activeQuestId) return w;
      // Objectives auto-update on visit/interact
      return w;
    });
  }, []);

  const discoverSector = useCallback((sectorId: number) => {
    setWorld((w) => {
      if (w.discoveredSectors.includes(sectorId)) return w;
      return { ...w, discoveredSectors: [...w.discoveredSectors, sectorId] };
    });
  }, []);

  const advanceTime = useCallback((hours: number) => {
    setWorld((w) => {
      let newTime = w.weather.timeOfDay + hours;
      let newDay = w.day;
      if (newTime >= 24) {
        newDay += Math.floor(newTime / 24);
        newTime = newTime % 24;
      }
      const timeStr = `${String(Math.floor(newTime)).padStart(2, "0")}:${String(Math.floor((newTime % 1) * 60)).padStart(2, "0")}`;
      return {
        ...w,
        day: newDay,
        time: timeStr,
        weather: { ...w.weather, timeOfDay: newTime },
      };
    });
  }, []);

  const setWeather = useCallback((type: WorldState["weather"]["type"]) => {
    setWorld((w) => ({
      ...w,
      weather: { ...w.weather, type },
    }));
  }, []);

  return (
    <QuestContext.Provider
      value={{
        world,
        activeQuest,
        availableQuests,
        visitBuilding,
        interactNPC,
        acceptQuest,
        completeQuestObjective,
        discoverSector,
        advanceTime,
        setWeather,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}
