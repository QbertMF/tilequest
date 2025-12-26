import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { createTileGame, moveTiles } from './types/TileGame';
import { useState } from 'react';

export default function App() {
  const [gameState, setGameState] = useState(() => createTileGame());
  const tileSize = 60;
  
  const handleTileClick = (tileId: number) => {
    setGameState(prevState => moveTiles(prevState, tileId));
  };
  
  return (
    <View style={styles.container}>
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
            disabled={!tile.value}
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
