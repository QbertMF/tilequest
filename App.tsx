import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createTileGame, moveTiles, shuffleTiles, isGameComplete } from './types/TileGame';
import { useState, useEffect } from 'react';

type Difficulty = 'easy' | 'normal' | 'hard';

const images = [
  require('./assets/truck1.png'),
  require('./assets/truck2.png'),
  require('./assets/truck3.png'),
];

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [gameState, setGameState] = useState(() => {
    const selectedImage = images[Math.floor(Math.random() * images.length)];
    return createTileGame(4, 4, selectedImage);
  });
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  
  const screenDimensions = Dimensions.get('window');
  const boardSize = Math.min(screenDimensions.width, screenDimensions.height) * 0.8;
  const tileSize = boardSize / gameState.size.cols;
  
  const getDifficultySize = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 3;
      case 'normal': return 4;
      case 'hard': return 5;
    }
  };
  
  useEffect(() => {
    const size = getDifficultySize(difficulty);
    const selectedImage = images[Math.floor(Math.random() * images.length)];
    setGameState(createTileGame(size, size, selectedImage));
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(false);
  }, [difficulty]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);
  
  const handleTileClick = (tileId: number) => {
    if (!gameActive || gameComplete) return;
    
    const newGameState = moveTiles(gameState, tileId);
    if (newGameState !== gameState) {
      if (!gameStarted) {
        setGameStarted(true);
      }
      setMoves(prev => prev + 1);
      setGameState(newGameState);
      
      if (isGameComplete(newGameState)) {
        setGameComplete(true);
        setGameActive(false);
        setGameStarted(false);
      }
    }
  };
  
  const startGame = () => {
    setGameState(prevState => shuffleTiles(prevState));
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(true);
    setGameComplete(false);
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
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timer}>Time: {formatTime(timer)} | Moves: {moves}</Text>
      <View style={[styles.gameBoard, { width: boardSize, height: boardSize }]}>
        {gameComplete ? (
          <Image
            source={gameState.selectedImage}
            style={{
              width: gameState.size.cols * tileSize,
              height: gameState.size.rows * tileSize,
            }}
          />
        ) : (
          gameState.tiles.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={[
                styles.tile,
                {
                  left: tile.position.col * tileSize,
                  top: tile.position.row * tileSize,
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: tile.value ? 'transparent' : '#f0f0f0'
                }
              ]}
              onPress={() => handleTileClick(tile.id)}
              disabled={!tile.value || !gameActive}
            >
              {tile.value && (
                <>
                  <Image
                    source={gameState.selectedImage}
                    style={[
                      styles.tileImage,
                      {
                        left: -tile.originalPosition.col * tileSize,
                        top: -tile.originalPosition.row * tileSize,
                        width: gameState.size.cols * tileSize,
                        height: gameState.size.rows * tileSize,
                      }
                    ]}
                  />
                  <Text style={styles.tileNumber}>{tile.value}</Text>
                </>
              )}
            </TouchableOpacity>
          ))
        )}
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
    marginLeft: 10,
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
  },
  tile: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  tileImage: {
    position: 'absolute',
  },
  tileNumber: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  tileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
