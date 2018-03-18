import { Note, MusicSymbols } from '../constants'
import IChordData from '../interfaces/IChordData'
import SongArrangement from './SongArrangement'

class Chord {
  public static parse(chord: string, arrangement?: SongArrangement): Chord {
    if (chord === MusicSymbols.gClef) {
      const noChord = new Chord()
      noChord.rootNote = MusicSymbols.gClef
      return noChord
    }
    const chordRegex = /^([a-h])([\#b])?(m)?([\+\-0-9])?\/?([a-h])?([\#b])?/i
    const result = chordRegex.exec(chord)
    if (result !== null) {
      // const [fullMatch, note, minor, modifier] = result
      // console.table([fullMatch, note, minor, modifier])
      const parsedChord = new Chord()
      result.forEach((match, i) => {
        if (match !== undefined) {
          switch (i) {
            // case 0:
            //   console.log(`Chord match found, parsing ${match}`)
            case 1:
              // Note
              parsedChord.rootNote = match.toUpperCase()
              if (parsedChord.rootNote === 'H') {
                parsedChord.rootNote = 'B'
              }
              break
            case 2:
              // Sharp or Flat
              parsedChord.rootNoteSign = match
              break
            case 3:
              // Minor
              parsedChord.isMinor = true
              break
            case 4:
              // Modifier(s)
              parsedChord.modifiers = match
              break
            case 5:
              // Bass note
              parsedChord.bassNote = match.toUpperCase()
              if (parsedChord.bassNote === 'H') {
                parsedChord.bassNote = 'B'
              }
              break
            case 6:
              // Bass note sharp or flat
              parsedChord.bassNoteSign = match
              break
          }
        }
      })
      // Set root note int
      if (parsedChord.rootNote !== '') {
        parsedChord.rootInt = Note[parsedChord.rootNote + parsedChord.rootNoteSign]
        if (parsedChord.rootInt === undefined) {
          throw new Error(`Found no root note in ${chord}`)
        }
      } else {
        throw new Error(`${chord} is not a valid Chord`)
      }
      // Set bass note if necessary
      if (parsedChord.bassNote !== '') {
        parsedChord.bassInt = Note[parsedChord.bassNote + parsedChord.bassNoteSign]
        if (parsedChord.bassInt === undefined) {
          throw new Error(`Found no bass note in ${chord}`)
        }
      }
      if (arrangement && arrangement.transpose > 0) {
        console.warn(
          `We might need to transpose this chord (${chord}) since the song has been transposed by ${
            arrangement.transpose
          }`,
          parsedChord
        )
        parsedChord.transposeBy(-arrangement.transpose)
      }

      return parsedChord
    } else {
      // No match
      throw new Error(`Found no match for chord: '${chord}'`)
    }
  }

  public static chordFromData(data: IChordData): Chord {
    const chord = new Chord()
    Object.assign(chord, data)
    return chord
  }

  public rootInt: number = -1
  public rootNote: string = ''
  public rootNoteSign: string = ''
  public bassInt: number = -1
  public bassNote: string = ''
  public bassNoteSign: string = ''
  public isMinor: boolean = false
  public modifiers: string = ''

  public transposeBy(transpose: number): Chord {
    this.rootInt += transpose
    this.bassNote += transpose
    return this
  }

  public html(arrangement: SongArrangement): string {
    const root = this.chordFromInt(this.rootInt, arrangement)
    const bass = this.bassInt > -1 ? this.chordFromInt(this.bassInt, arrangement) : ''
    const isMinor = this.isMinor ? 'm' : ''
    const bassDelimiter = bass !== '' ? '/' : ''
    return `${root}${isMinor}${this.modifiers}${bassDelimiter}${bass}`
    // return `${this.rootNote}${this.sign(this.rootNoteSign)}${isMinor}${
    //   this.modifiers
    // }${bassDelimiter}${this.bassNote}${this.sign(this.bassNoteSign)}`
  }

  /**
   * Convert a note from number to string
   * @param input - input chord's note as number
   * @param originalKeyInt - The arrangement's original key
   * @param transpose - Number of steps to transpose
   */
  public chordFromInt(input: number, arrangement: SongArrangement): string {
    const { originalKey, transpose, preferredSign } = arrangement
    const originalKeyInt = Note[originalKey]
    if (input === -1) {
      return ''
    }
    let noteInt = input + transpose
    if (noteInt > 11) {
      noteInt -= 12
    } else if (noteInt < 0) {
      noteInt += 12
    }
    // Find chord(s) that matches transposed input
    const chords = Object.entries(Note).filter(([key, value]) => {
      return value === noteInt
    })
    let chord = ''
    if (noteInt === 11) {
      chord = 'B'
    } else if (chords.length > 1) {
      // Determine if we should use 'b' or '#' by looking at arrangement's key
      // and preferredSign
      const newKey = originalKeyInt + transpose
      console.log('Preferred:', preferredSign)
      switch (preferredSign) {
        case MusicSymbols.sharp:
          const sharpChord = chords.find((option: [string, number]) => option[0].endsWith('#'))
          if (sharpChord) {
            chord = sharpChord[0][0] + MusicSymbols.sharp
          }
          break
        case MusicSymbols.flat:
          const flatChord = chords.find((option: [string, number]) => option[0].endsWith('b'))
          if (flatChord) {
            chord = flatChord[0][0] + MusicSymbols.flat
          }
          break
        default:
          const flats = [3, 10]
          const sharps = [1, 6, 8]
          if (flats.includes(newKey)) {
            // This is a preferred b key
            chord = chords[0][0].indexOf('b') > -1 ? chords[0][0] : chords[1][0]
            chord = chord[0] + this.sign('b')
          } else if (sharps.includes(newKey)) {
            // This is a preferred # key
            chord = chords[0][0].indexOf('#') > -1 ? chords[0][0] : chords[1][0]
            chord = chord[0] + this.sign('#')
          } else {
            chord = chords[0][0]
          }
          break
      }
    } else if (chords.length > 0) {
      chord = chords[0][0]
    } else {
      console.warn(
        'Found no chords for input:',
        input,
        'originalKeyInt:',
        originalKeyInt,
        'transpose:',
        transpose,
        'noteInt:',
        noteInt
      )
    }
    return chord
  }

  public serialize = (): IChordData => {
    return {
      rootInt: this.rootInt,
      rootNote: this.rootNote,
      rootNoteSign: this.rootNoteSign,
      bassInt: this.bassInt,
      bassNote: this.bassNote,
      bassNoteSign: this.bassNoteSign,
      isMinor: this.isMinor,
      modifiers: this.modifiers
    }
  }

  private sign(input: string): string {
    if (input === '') {
      return ''
    }
    return input === '#' ? MusicSymbols.sharp : MusicSymbols.flat
  }
}

export default Chord
