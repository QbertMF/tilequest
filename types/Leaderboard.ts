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
    console.log('Retrieved leaderboard data:', data);
    
    if (!data) {
      return { entries: [] };
    }
    
    const parsed = JSON.parse(data);
    
    // Check if it's the old format with difficulty buckets
    if (parsed.easy || parsed.normal || parsed.hard || parsed.ultra) {
      console.log('Migrating old leaderboard format');
      const entries: LeaderboardEntry[] = [];
      
      // Convert old format to new format
      ['easy', 'normal', 'hard', 'ultra'].forEach(difficulty => {
        if (parsed[difficulty]) {
          parsed[difficulty].forEach((entry: any) => {
            entries.push({
              name: entry.name,
              time: entry.time,
              moves: entry.moves,
              gridSize: difficulty === 'easy' ? 9 : difficulty === 'normal' ? 16 : difficulty === 'hard' ? 25 : 36,
              numbersShown: true, // Default for old entries
              date: entry.date
            });
          });
        }
      });
      
      const result = { entries };
      console.log('Migrated leaderboard:', result);
      
      // Save the migrated format
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(result));
      return result;
    }
    
    // New format
    const result = parsed.entries ? parsed : { entries: [] };
    console.log('Parsed leaderboard:', result);
    return result;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { entries: [] };
  }
}

export async function addLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  try {
    console.log('Adding leaderboard entry:', entry);
    const leaderboard = await getLeaderboard();
    console.log('Current leaderboard before adding:', leaderboard);
    
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
    
    console.log('Leaderboard after processing:', leaderboard);
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    console.log('Leaderboard saved successfully');
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