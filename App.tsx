import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createTileGame, moveTiles, shuffleTiles } from './types/TileGame';
import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'normal' | 'hard';

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [gameState, setGameState] = useState(() => createTileGame());
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const tileSize = 60;
  
  const getDifficultySize = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 3;
      case 'normal': return 4;
      case 'hard': return 5;
    }
  };
  
  useEffect(() => {
    const size = getDifficultySize(difficulty);
    setGameState(createTileGame(size, size));
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(false);
  }, [difficulty]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted]);
  
  const handleTileClick = (tileId: number) => {
    if (!gameActive) return;
    
    const newGameState = moveTiles(gameState, tileId);
    if (newGameState !== gameState) {
      if (!gameStarted) {
        setGameStarted(true);
      }
      setMoves(prev => prev + 1);
      setGameState(newGameState);
    }
  };
  
  const startGame = () => {
    setGameState(prevState => shuffleTiles(prevState));
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(true);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teo's Sliding Tile Game</Text>
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyLabel}>Difficulty:</Text>
        <Picker
          selectedValue={difficulty}
          style={styles.picker}
          onValueChange={(value) => setDifficulty(value)}
        >
          <Picker.Item label="Easy (3x3)" value="easy" />
          <Picker.Item label="Normal (4x4)" value="normal" />
          <Picker.Item label="Hard (5x5)" value="hard" />
        </Picker>
      </View>
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>Start Game</Text>
      </TouchableOpacity>
      <Text style={styles.timer}>Time: {formatTime(timer)} | Moves: {moves}</Text>
      <View style={styles.gameBoard}>
        {gameState.tiles.map(tile => (
          <TouchableOpacity
            key={tile.id}
            style={[
              styles.tile,
              {
                left: tile.position.col * tileSize,
                top: tile.position.row * tileSize,
                backgroundColor: tile.value ? '#4CAF50' : 'transparent'
              }
            ]}
            onPress={() => handleTileClick(tile.id)}
            disabled={!tile.value || !gameActive}
          >
            {tile.value && <Text style={styles.tileText}>{tile.value}</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  difficultyLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  picker: {
    height: 50,
    width: 150,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  gameBoard: {
    position: 'relative',
    width: 300,
    height: 300,
  },
  tile: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
