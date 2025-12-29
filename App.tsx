import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Modal, TextInput, ScrollView, Alert, Animated } from 'react-native';
import { createTileGame, moveTiles, shuffleTiles, isGameComplete } from './types/TileGame';
import { getLeaderboard, addLeaderboardEntry, clearLeaderboard, LeaderboardData, LeaderboardEntry } from './types/Leaderboard';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';

type Difficulty = 'easy' | 'normal' | 'hard' | 'ultra';

const images = [
  require('./assets/images/truck1.png'),
  require('./assets/images/truck2.png'),
  require('./assets/images/truck3.png'),
  require('./assets/images/monster_truck1.png'),
  require('./assets/images/monster_truck2.png'),
  require('./assets/images/abstract1.png'),
  require('./assets/images/abstract2.png'),
  require('./assets/images/blocks1.png'),
  require('./assets/images/cottage.png'),
  require('./assets/images/csify_city.png'),
  require('./assets/images/flake.png'),
  require('./assets/images/nature1.png'),
  require('./assets/images/teddy1.png'),
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
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({ entries: [] });
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showSolveButton, setShowSolveButton] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const animatedValues = useRef<Map<number, { x: Animated.Value; y: Animated.Value }>>(new Map());
  
  const screenDimensions = Dimensions.get('window');
  const headerHeight = 150; // Approximate height for title, difficulty, button, and timer
  const availableHeight = screenDimensions.height - headerHeight;
  const boardSize = Math.min(screenDimensions.width, availableHeight) * 0.8;
  const tileSize = boardSize / gameState.size.cols;
  
  const getDifficultySize = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 3;
      case 'normal': return 4;
      case 'hard': return 5;
      case 'ultra': return 6;
    }
  };
  
  const loadLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  };
  
  useEffect(() => {
    loadLeaderboard();
  }, []);
  
  useEffect(() => {
    const size = getDifficultySize(difficulty);
    const selectedImage = images[Math.floor(Math.random() * images.length)];
    const newGameState = createTileGame(size, size, selectedImage);
    setGameState(newGameState);
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(false);
    
    // Initialize animated values for new tiles
    animatedValues.current.clear();
    newGameState.tiles.forEach(tile => {
      animatedValues.current.set(tile.id, {
        x: new Animated.Value(tile.position.col * tileSize),
        y: new Animated.Value(tile.position.row * tileSize)
      });
    });
  }, [difficulty, tileSize]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);
  
  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount >= 7) {
      setShowSolveButton(true);
    }
  };
  
  const handleTileClick = (tileId: number) => {
    if (!gameActive || gameComplete) return;
    
    const newGameState = moveTiles(gameState, tileId);
    if (newGameState !== gameState) {
      if (!gameStarted) {
        setGameStarted(true);
      }
      setMoves(prev => prev + 1);
      
      // Animate tiles to new positions
      const animations = newGameState.tiles
        .map(tile => {
          const animatedValue = animatedValues.current.get(tile.id);
          if (animatedValue) {
            return Animated.parallel([
              Animated.timing(animatedValue.x, {
                toValue: tile.position.col * tileSize,
                duration: 200,
                useNativeDriver: false
              }),
              Animated.timing(animatedValue.y, {
                toValue: tile.position.row * tileSize,
                duration: 200,
                useNativeDriver: false
              })
            ]);
          }
          return null;
        })
        .filter((anim): anim is Animated.CompositeAnimation => anim !== null);
      
      Animated.parallel(animations).start();
      setGameState(newGameState);
      
      if (isGameComplete(newGameState)) {
        setGameComplete(true);
        setGameActive(false);
        setGameStarted(false);
        setShowNameInput(true);
      }
    }
  };
  
  const startGame = () => {
    const shuffledState = shuffleTiles(gameState);
    setGameState(shuffledState);
    
    // Update animated values to match shuffled positions without animation
    shuffledState.tiles.forEach(tile => {
      const animatedValue = animatedValues.current.get(tile.id);
      if (animatedValue) {
        animatedValue.x.setValue(tile.position.col * tileSize);
        animatedValue.y.setValue(tile.position.row * tileSize);
      }
    });
    
    setTimer(0);
    setGameStarted(false);
    setMoves(0);
    setGameActive(true);
    setGameComplete(false);
  };
  
  const submitScore = async () => {
    if (playerName.trim().length === 0) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    const entry: LeaderboardEntry = {
      name: playerName.trim().substring(0, 8),
      time: timer,
      moves,
      gridSize: gameState.size.rows * gameState.size.cols,
      numbersShown: showNumbers,
      date: new Date().toISOString()
    };
    
    await addLeaderboardEntry(entry);
    await loadLeaderboard();
    setShowNameInput(false);
    setPlayerName('');
    setShowLeaderboard(true);
  };
  
  const clearAllData = () => {
    console.log('Clear button clicked');
    
    // Use window.confirm for web compatibility
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to delete all leaderboard data? This action cannot be undone.');
      if (confirmed) {
        performClear();
      }
    } else {
      Alert.alert(
        'Clear All Data',
        'Are you sure you want to delete all leaderboard data? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: performClear
          }
        ]
      );
    }
  };
  
  const performClear = async () => {
    try {
      console.log('Clearing leaderboard...');
      await clearLeaderboard();
      setLeaderboard({ entries: [] });
      console.log('Leaderboard cleared successfully');
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('All leaderboard data has been cleared.');
      } else {
        Alert.alert('Success', 'All leaderboard data has been cleared.');
      }
    } catch (error) {
      console.error('Error clearing leaderboard:', error);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to clear data.');
      } else {
        Alert.alert('Error', 'Failed to clear data.');
      }
    }
  };
  
  const solvePuzzle = () => {
    const solvedTiles = gameState.tiles.map(tile => ({
      ...tile,
      position: { ...tile.originalPosition }
    }));
    
    const solvedState = { ...gameState, tiles: solvedTiles };
    setGameState(solvedState);
    setGameComplete(true);
    setGameActive(false);
    setGameStarted(false);
    setShowNameInput(true);
  };
  
  const selectRandomImage = () => {
    const currentImageIndex = images.findIndex(img => img === gameState.selectedImage);
    const availableImages = images.filter((_, index) => index !== currentImageIndex);
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    const newGameState = { ...gameState, selectedImage: randomImage };
    setGameState(newGameState);
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newGameState = { ...gameState, selectedImage: { uri: result.assets[0].uri } };
      setGameState(newGameState);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleTitleClick}>
        <Text style={styles.title}>Teo's Tile Quest</Text>
      </TouchableOpacity>
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
          <Picker.Item label="Ultra (6x6)" value="ultra" />
        </Picker>
      </View>
      <View style={styles.mainButtonRow}>
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scoresButton} onPress={() => setShowLeaderboard(true)}>
          <Text style={styles.startButtonText}>Scores</Text>
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
          gameState.tiles.map(tile => {
            const animatedValue = animatedValues.current.get(tile.id);
            if (!animatedValue) {
              animatedValues.current.set(tile.id, {
                x: new Animated.Value(tile.position.col * tileSize),
                y: new Animated.Value(tile.position.row * tileSize)
              });
            }
            const currentAnimatedValue = animatedValues.current.get(tile.id)!;
            
            return (
              <Animated.View
                key={tile.id}
                style={[
                  styles.tile,
                  {
                    left: currentAnimatedValue.x,
                    top: currentAnimatedValue.y,
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: tile.value ? 'transparent' : '#f0f0f0'
                  }
                ]}
              >
                <TouchableOpacity
                  style={{ width: '100%', height: '100%' }}
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
                  {showNumbers && <Text style={styles.tileNumber}>{tile.value}</Text>}
                </>
              )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </View>
      
      <View style={styles.imageButtonRow}>
        <TouchableOpacity 
          style={[styles.imagePickerButton, gameActive && styles.disabledButton]} 
          onPress={pickImage}
          disabled={gameActive}
        >
          <MaterialIcons name="photo" size={24} color={gameActive ? '#999' : '#0c0a3e'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.imagePickerButton, gameActive && styles.disabledButton]} 
          onPress={selectRandomImage}
          disabled={gameActive}
        >
          <MaterialIcons name="shuffle" size={24} color={gameActive ? '#999' : '#0c0a3e'} />
        </TouchableOpacity>
        
        <View style={styles.spacer} />
        
        <TouchableOpacity 
          style={[styles.numbersToggleButton, gameActive && styles.disabledButton]} 
          onPress={() => setShowNumbers(!showNumbers)}
          disabled={gameActive}
        >
          <MaterialIcons name="numbers" size={24} color={gameActive ? '#999' : (showNumbers ? '#0c0a3e' : '#999')} />
        </TouchableOpacity>
        
        {showSolveButton && (
          <TouchableOpacity 
            style={styles.imagePickerButton} 
            onPress={solvePuzzle}
          >
            <MaterialIcons name="help" size={24} color="#0c0a3e" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Name Input Modal */}
      <Modal visible={showNameInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSubtitle}>Time: {formatTime(timer)} | Moves: {moves}</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name (max 8 chars)"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={8}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={submitScore}>
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.skipButton]} onPress={() => setShowNameInput(false)}>
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Leaderboard Modal */}
      <Modal visible={showLeaderboard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.modalTitle}>Leaderboard</Text>
            <ScrollView style={styles.leaderboardScroll}>
              {leaderboard.entries.length === 0 ? (
                <Text style={styles.noEntries}>No entries yet</Text>
              ) : (
                leaderboard.entries.map((entry, index) => (
                  <View key={index} style={styles.leaderboardEntry}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entryGrid}>{Math.sqrt(entry.gridSize)}x{Math.sqrt(entry.gridSize)}</Text>
                    <Text style={styles.entryNumbers}>{entry.numbersShown ? '123' : '---'}</Text>
                    <Text style={styles.entryMoves}>{entry.moves}m</Text>
                    <Text style={styles.entryTime}>{formatTime(entry.time)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.leaderboardButtons}>
              <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
                <Text style={styles.modalButtonText}>Clear All Data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowLeaderboard(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3c677',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0c0a3e',
    textAlign: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  difficultyLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#0c0a3e',
  },
  picker: {
    height: 60,
    width: 200,
  },
  startButton: {
    backgroundColor: '#b33f62',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  scoresButton: {
    backgroundColor: '#7b1e7a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    width: '60%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  hiddenSolveButton: {
    backgroundColor: '#f9564f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'center',
  },
  imagePickerButton: {
    backgroundColor: '#f3c677',
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#0c0a3e',
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
    alignSelf: 'center',
  },
  numbersToggleButton: {
    backgroundColor: '#f3c677',
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#0c0a3e',
  },
  spacer: {
    width: 30,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
  },
  timer: {
    fontSize: 18,
    marginBottom: 20,
    color: '#7b1e7a',
  },
  gameBoard: {
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#0c0a3e',
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
    backgroundColor: '#f9564f',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  tileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#f3c677',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  leaderboardModal: {
    backgroundColor: '#f3c677',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c0a3e',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7b1e7a',
    marginBottom: 15,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#0c0a3e',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    backgroundColor: '#b33f62',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  skipButton: {
    backgroundColor: '#7b1e7a',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  leaderboardScroll: {
    maxHeight: 400,
  },
  difficultySection: {
    marginBottom: 20,
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0a3e',
    marginBottom: 10,
  },
  noEntries: {
    color: '#7b1e7a',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#0c0a3e20',
  },
  rank: {
    width: 30,
    fontWeight: 'bold',
    color: '#0c0a3e',
  },
  entryName: {
    flex: 1,
    color: '#0c0a3e',
    fontWeight: 'bold',
  },
  entryGrid: {
    width: 35,
    textAlign: 'center',
    color: '#7b1e7a',
    fontSize: 12,
  },
  entryNumbers: {
    width: 30,
    textAlign: 'center',
    color: '#7b1e7a',
    fontSize: 12,
  },
  entryMoves: {
    width: 35,
    textAlign: 'right',
    color: '#7b1e7a',
  },
  entryTime: {
    width: 50,
    textAlign: 'right',
    color: '#7b1e7a',
  },
  closeButton: {
    backgroundColor: '#b33f62',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  leaderboardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  clearButton: {
    backgroundColor: '#f9564f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 2,
    alignItems: 'center',
  },
});
