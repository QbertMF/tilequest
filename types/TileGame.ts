export interface Tile {
  id: number;
  value: number | null; // null represents empty tile
  position: { row: number; col: number };
  originalPosition: { row: number; col: number }; // for image cropping
}

export interface TileGameState {
  tiles: Tile[];
  size: { rows: number; cols: number };
  emptyTileId: number;
  selectedImage: any;
}

export function createTileGame(rows: number = 5, cols: number = 5, selectedImage: any): TileGameState {
  const tiles: Tile[] = [];
  let id = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isEmptyTile = row === 0 && col === 0; // top left corner
      tiles.push({
        id: id++,
        value: isEmptyTile ? null : id,
        position: { row, col },
        originalPosition: { row, col }
      });
    }
  }
  
  return {
    tiles,
    size: { rows, cols },
    emptyTileId: tiles.find(tile => tile.value === null)!.id,
    selectedImage
  };
}

export function moveTiles(gameState: TileGameState, clickedTileId: number): TileGameState {
  const clickedTile = gameState.tiles.find(t => t.id === clickedTileId);
  const emptyTile = gameState.tiles.find(t => t.value === null);
  
  if (!clickedTile || !emptyTile) return gameState;
  
  const sameRow = clickedTile.position.row === emptyTile.position.row;
  const sameCol = clickedTile.position.col === emptyTile.position.col;
  
  if (!sameRow && !sameCol) return gameState;
  
  const newTiles = [...gameState.tiles];
  const clickedPosition = { ...clickedTile.position };
  
  if (sameRow) {
    const tilesToMove = newTiles.filter(t => 
      t.position.row === clickedTile.position.row &&
      t.value !== null &&
      ((clickedTile.position.col < emptyTile.position.col && t.position.col >= clickedTile.position.col && t.position.col < emptyTile.position.col) ||
       (clickedTile.position.col > emptyTile.position.col && t.position.col <= clickedTile.position.col && t.position.col > emptyTile.position.col))
    );
    
    const direction = clickedTile.position.col < emptyTile.position.col ? 1 : -1;
    tilesToMove.forEach(tile => {
      tile.position.col += direction;
    });
  } else {
    const tilesToMove = newTiles.filter(t => 
      t.position.col === clickedTile.position.col &&
      t.value !== null &&
      ((clickedTile.position.row < emptyTile.position.row && t.position.row >= clickedTile.position.row && t.position.row < emptyTile.position.row) ||
       (clickedTile.position.row > emptyTile.position.row && t.position.row <= clickedTile.position.row && t.position.row > emptyTile.position.row))
    );
    
    const direction = clickedTile.position.row < emptyTile.position.row ? 1 : -1;
    tilesToMove.forEach(tile => {
      tile.position.row += direction;
    });
  }
  
  // Make clicked tile position empty
  const newEmptyTile = newTiles.find(t => t.id === gameState.emptyTileId);
  if (newEmptyTile) {
    newEmptyTile.position = clickedPosition;
  }
  
  return { ...gameState, tiles: newTiles };
}

function isSolvable(gameState: TileGameState): boolean {
  const gridSize = gameState.size.rows;
  const tiles = [];
  
  // Create array with tile values in position order
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tile = gameState.tiles.find(t => t.position.row === row && t.position.col === col);
      tiles.push(tile?.value || 0);
    }
  }
  
  const arr = tiles.filter(n => n !== 0); // exclude empty
  let inversions = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inversions++;
    }
  }
  if (gridSize % 2 !== 0) {
    return inversions % 2 === 0;
  } else {
    const emptyRowFromBottom = gridSize - Math.floor(tiles.indexOf(0) / gridSize);
    return (inversions + emptyRowFromBottom) % 2 === 0;
  }
}

export function shuffleTiles(gameState: TileGameState): TileGameState {
  let newGameState;
  do {
    const newTiles = [...gameState.tiles];
    const nonEmptyTiles = newTiles.filter(t => t.value !== null);
    
    // Get all positions except empty tile position
    const availablePositions = newTiles
      .filter(t => t.value !== null)
      .map(t => ({ ...t.position }));
    
    // Shuffle positions
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    // Assign shuffled positions to non-empty tiles
    nonEmptyTiles.forEach((tile, index) => {
      tile.position = availablePositions[index];
    });
    
    newGameState = { ...gameState, tiles: newTiles, selectedImage: gameState.selectedImage };
  } while (!isSolvable(newGameState));
  
  return newGameState;
}

export function isGameComplete(gameState: TileGameState): boolean {
  return gameState.tiles
    .filter(tile => tile.value !== null)
    .every(tile => 
      tile.position.row === tile.originalPosition.row && 
      tile.position.col === tile.originalPosition.col
    );
}