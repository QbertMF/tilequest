import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LeaderboardEntry {
  name: string;
  time: number; // seconds
  moves: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'ultra';
  date: string;
}

export interface LeaderboardData {
  easy: LeaderboardEntry[];
  normal: LeaderboardEntry[];
  hard: LeaderboardEntry[];
  ultra: LeaderboardEntry[];
}

const LEADERBOARD_KEY = 'tilequest_leaderboard';

export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const data = await AsyncStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : { easy: [], normal: [], hard: [], ultra: [] };
  } catch {
    return { easy: [], normal: [], hard: [], ultra: [] };
  }
}

export async function addLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  try {
    const leaderboard = await getLeaderboard();
    leaderboard[entry.difficulty].push(entry);
    
    // Sort by moves first, then by time
    leaderboard[entry.difficulty].sort((a, b) => {
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });
    
    // Keep only top 10
    leaderboard[entry.difficulty] = leaderboard[entry.difficulty].slice(0, 10);
    
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