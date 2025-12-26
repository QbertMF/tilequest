export interface Tile {
  id: number;
  value: number | null; // null represents empty tile
  position: { row: number; col: number };
}

export interface TileGameState {
  tiles: Tile[];
  size: { rows: number; cols: number };
  emptyTileId: number;
}

export function createTileGame(rows: number = 5, cols: number = 5): TileGameState {
  const tiles: Tile[] = [];
  let id = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isEmptyTile = row === 0 && col === 0; // top right corner
      tiles.push({
        id: id++,
        value: isEmptyTile ? null : id,
        position: { row, col }
      });
    }
  }
  
  return {
    tiles,
    size: { rows, cols },
    emptyTileId: tiles.find(tile => tile.value === null)!.id
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
    const minCol = Math.min(clickedTile.position.col, emptyTile.position.col);
    const maxCol = Math.max(clickedTile.position.col, emptyTile.position.col);
    const direction = clickedTile.position.col < emptyTile.position.col ? 1 : -1;
    
    for (let col = minCol; col <= maxCol; col++) {
      const tile = newTiles.find(t => t.position.row === clickedTile.position.row && t.position.col === col);
      if (tile) {
        tile.position.col += direction;
      }
    }
  } else {
    const minRow = Math.min(clickedTile.position.row, emptyTile.position.row);
    const maxRow = Math.max(clickedTile.position.row, emptyTile.position.row);
    const direction = clickedTile.position.row < emptyTile.position.row ? 1 : -1;
    
    for (let row = minRow; row <= maxRow; row++) {
      const tile = newTiles.find(t => t.position.row === row && t.position.col === clickedTile.position.col);
      if (tile) {
        tile.position.row += direction;
      }
    }
  }
  
  // Make clicked tile position empty
  const newEmptyTile = newTiles.find(t => t.id === gameState.emptyTileId);
  if (newEmptyTile) {
    newEmptyTile.position = clickedPosition;
  }
  
  return { ...gameState, tiles: newTiles };
}