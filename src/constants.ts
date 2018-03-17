export enum Collections {
  SETLISTS = 'setlists',
  SONGS = 'songs',
  USERS = 'users'
}

export enum Mutations {
  UPDATE_USER = 'UPDATE_USER',
  LOAD_SETLISTS = 'LOAD_SETLISTS',
  OPEN_SETLIST = 'OPEN_SETLIST',
  EDIT_MODE = 'EDIT_MODE',
  ADD_SONG = 'ADD_SONG',
  EDIT_SONG = 'EDIT_SONG',
  DELETE_SONG = 'DELETE_SONG',
  UPDATE_CURRENT_SONG = 'UPDATE_CURRENT_SONG',
  UPDATE_CURRENT_PART_ID = 'UPDATE_CURRENT_PART_ID',
  RESET_SONG = 'RESET_SONG',
  INIT_SONGS = 'INIT_SONGS',
  EDIT_SONG_KEY = 'EDIT_SONG_KEY'
}

export enum Actions {
  CREATE_SETLIST = 'CREATE_SETLIST',
  LOAD_SETLISTS = 'LOAD_SETLISTS',
  LOAD_SETLIST = 'LOAD_SETLIST',
  SAVE_EDITS = 'SAVE_EDITS',
  ADD_SONG = 'ADD_SONG'
}

export enum EditFields {
  KEY = 'KEY',
  PART = 'PART',
  CHORD = 'CHORD'
}

export const MusicSymbols = {
  natural: '&#9838;',
  sharp: '&#9839;',
  flat: '&#9837;',
  gClef: '&#119070;'
}

export const Note: { [index: string]: number } = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  H: 11,
  [MusicSymbols.gClef]: 12
}
