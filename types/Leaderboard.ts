import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LeaderboardEntry {
  name: string;
  time: number; // seconds
  moves: number;
  gridSize: number; // total tiles (e.g., 9 for 3x3, 16 for 4x4)
  numbersShown: boolean;
  date: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
}

const LEADERBOARD_KEY = 'tilequest_leaderboard';

export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const data = await AsyncStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

export async function addLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  try {
    const leaderboard = await getLeaderboard();
    leaderboard.entries.push(entry);
    
    // Sort by: gridSize (desc), numbersShown (asc), moves (asc), time (asc)
    leaderboard.entries.sort((a, b) => {
      if (a.gridSize !== b.gridSize) return b.gridSize - a.gridSize;
      if (a.numbersShown !== b.numbersShown) return a.numbersShown ? 1 : -1;
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });
    
    // Keep only top 50 entries
    leaderboard.entries = leaderboard.entries.slice(0, 50);
    
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Failed to save leaderboard entry:', error);
  }
}

export async function clearLeaderboard(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEADERBOARD_KEY);
  } catch (error) {
    console.error('Failed to clear leaderboard:', error);
  }
}