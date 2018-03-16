export enum Mutations {
  OPEN_PROJECT = 'OPEN_PROJECT',
  EDIT_MODE = 'EDIT_MODE',
  UPDATE_CURRENT_SONG = 'UPDATE_CURRENT_SONG',
  UPDATE_CURRENT_PART_ID = 'UPDATE_CURRENT_PART_ID',
  RESET_SONG = 'RESET_SONG',
  INIT_SONGS = 'INIT_SONGS',
  EDIT_SONG_KEY = 'EDIT_SONG_KEY'
}

export enum Actions {
  CREATE_PROJECT = 'CREATE_PROJECT',
  LOAD_PROJECT = 'LOAD_PROJECT',
  SAVE_EDITS = 'SAVE_EDITS'
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
