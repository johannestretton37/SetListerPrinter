<template>
  <div class="song">
    <h4 @click="startEditMode">{{ song.name }}
      <span
      v-if="songKey"
      v-html="songKey"
      @click="editKey"
      class="song-key">
      </span>
    </h4>
    <div v-if="parts.length > 0">
      <p>currPartId: {{ currPartId }}</p>
      <p>currField: {{ currField }}</p>
      <p>currChordIndexPath: [{{ currChordIndexPath.join('][') }}]</p>
      <ul class="parts">
        <li v-for="(part, p) in parts" :key="p" class="part" :class="{ active: currPartId === part.id }">
          <div
            class="part-name"
            :class="{ active: currPartId === part.id && currField === 'PART' }"
            @click="startEditMode(part, EditFields.PART)">
            <p><b>{{ part.name }}</b></p>
          </div>
          <div class="chords-container">
            <div class="chords" v-for="(chordLine, l) in part.chords" :key="l">
              <template v-for="(chord, c) in chordLine">
                <div
                  v-if="chord.html(song.notes.arrangement)"
                  class="chord" 
                  :class="{ active: currPartId === part.id && currChordIndexPath[0] === l && currChordIndexPath[1] === c - 1 }"
                  :key="c"
                  @click="startEditMode(part, EditFields.CHORD, [l,c - 1])"
                  v-html="chord.html(song.notes.arrangement)">
                </div>
                <div
                  class="chord active" 
                  v-if="currPartId === part.id && currChordIndexPath[0] === l && currChordIndexPath[1] === c"
                  :key="c + 'cursor'"></div>
              </template>
            </div>
            <div class="chords" v-if="currPartId === part.id && currField === 'CHORD' && part.chords === undefined">
              <div class="chord active"></div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <form v-if="isEditMode" @submit.prevent="handleSubmit">
      <label for="input" v-html="label"></label>
      <input
      id="input"
      ref="input"
      type="text"
      @keydown.tab="handleWhiteSpace"
      @keydown.space="handleWhiteSpace"
      @keydown.shift.enter="toggleShiftKey"
      @keydown.delete="handleDelete"
      autofocus="true"
      autocomplete="off"
      @blur="handleBlur"
      v-model="userInput" />
    </form>
        <div class="buttons">
      <!-- <div
      v-if="!isEditMode"
      class="button edit"
      @click="startEditMode">
        EDIT
      </div> -->
      <div
      class="button save"
      v-if="isEditMode"
      @click="saveEdits">
        SAVE
      </div>
      <div
      class="button edit"
      v-if="isEditMode"
      @click="resetSong">
        RESET
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import SongModel from '../classes/Song'
import { Mutations, Actions, EditFields, MusicSymbols } from '../constants'
import { Store } from 'vuex'
import { IState } from '../stores/Store'
import Chord, { cursorChord } from '../classes/Chord'
import SongPart from '../classes/SongPart';
import SongNote from '../classes/SongNote';
import SongArrangement from '../classes/SongArrangement';

@Component({
  props: {
    song: SongModel
  }
})
export default class Song extends Vue {
  public EditFields = EditFields
  public currChordIndexPath: number[] = [-1, 0]
  private userInput: string = ''
  private song!: SongModel
  private currField: EditFields = EditFields.PART

  get editModeId() {
    return this.$store.getters.editModeId
  }

  get isEditMode() {
    return this.$store.getters.editModeId === this.song.id
  }

  get label(): string {
    switch (this.currField) {
      case EditFields.KEY:
        return 'Add song\'s key <i>(or leave blank)</i>, then hit <b>ENTER</b>'
      case EditFields.PART:
        return 'Add song part, then <b>ENTER</b>'
      case EditFields.CHORD:
        return `Enter a chord, then <b>SPACE</b> or <b>TAB</b> to add it.<br>
        <b>ENTER</b> will add another row.<br>
        <b>SHIFT</b> + <b>ENTER</b> creates a new part.`
      default:
        return ''
    }
  }

  get songKey(): string {
    if (this.isEditMode) {
      return this.$store.getters.currKey
    } else {
      if (this.song.notes && this.song.notes.arrangement) {
        console.log('Render song key:', this.song.notes.arrangement.key())
        return this.song.notes.arrangement.key()
      }
    }
    return ''
  }

  get currPartId(): string {
    return this.$store.state.currPartId
  }

  get parts(): SongPart[] {
    let parts = this.isEditMode ? this.$store.getters.currSongParts : undefined
    if (parts === undefined) {
      if (this.song.notes && this.song.notes.arrangement && this.song.notes.arrangement.parts) {
        parts = this.song.notes.arrangement.parts
      } else {
        parts = []
      }
    }
    return parts
  }

  private startEditMode(part:SongPart, field: EditFields, indexPath: number[]) {
    this.$store.commit(Mutations.EDIT_MODE, this.song.id)
    if (this.song.notes && this.song.notes.arrangement) {
      // this.$store.commit(Mutations.UPDATE_CURRENT_SONG, this.song)
      const key = this.song.notes.arrangement.key()
      if (key === '') {
        this.currField = EditFields.KEY
      } else if (key === MusicSymbols.gClef) {
        console.log('Key:', key)
      }
      if (this.currField === EditFields.PART) {
        // tslint:disable-next-line:variable-name
        const currPart = this.song.notes.arrangement.parts.find(_part => _part.id === this.currPartId)
        if (currPart && currPart.name) {
          this.userInput = currPart.name
        }
      }
    } else {
      this.currField = EditFields.KEY
    }
    if (part) {
      this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID, part.id)
    }
    if (field) {
      this.currField = field;
    }
    if (indexPath) {
      // TODO: Rethink this method
      debugger
      this.currChordIndexPath = indexPath
    }

    this.$nextTick(() => {
      const input = this.$refs.input as HTMLFormElement
      input.focus()
    })
  }

  private editKey() {
    const defaultKey = this.songKey
      .replace(MusicSymbols.flat, 'b')
      .replace(MusicSymbols.sharp, '#')
      .replace(MusicSymbols.gClef, '')
    const newKey = prompt('Change key of this song', defaultKey)
    if (newKey !== '') {
      this.$store.commit(Mutations.EDIT_SONG_KEY, { newKey, id: this.song.id })
      this.saveEdits()
    }
  }

  private resetSong() {
    const song = new SongModel(this.song.name, this.song.id)
    this.$store.commit(Mutations.RESET_SONG, song)
    this.saveEdits()
  }

  private handleBlur() {
    this.$store.commit(Mutations.EDIT_MODE, undefined)
  }

  private saveEdits() {
    this.$store.dispatch(Actions.EDIT_SONG, this.song)
  }

  private toggleShiftKey(e: KeyboardEvent) {
    this.addUserInput()
    this.addNewPart()
  }

  private handleDelete(e: KeyboardEvent) {
    if (this.userInput === '') {
      // Only remove stuff if field is empty
      const currSong = this.getCurrSong()
      const currPart = this.getCurrPart()
      const chords = currPart.chords;
      if (chords) {
        const lastChordLine = chords[chords.length - 1]
        if (lastChordLine !== undefined) {
          lastChordLine.pop()
          if (lastChordLine.length === 0) {
            chords.pop()
            if (chords.length === 0) {
              currSong.notes!.arrangement.parts.pop()
            }
          }
          this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
          this.saveEdits()
        }
      }
    }
  }

  private handleWhiteSpace(e: KeyboardEvent) {
    if (this.currField === EditFields.PART) {
      return false
    }
    e.preventDefault()
    this.addUserInput()
  }

  private handleSubmit(e: Event) {
    e.preventDefault()
    this.addUserInput()
    this.addNewChordLine()
  }

  private addUserInput() {
    if (this.userInput === '') {
      if (this.currField === EditFields.KEY) {
        const currPart = this.getCurrPart()
        this.currField = EditFields.PART
        this.$store.commit(Mutations.EDIT_SONG_KEY, { newKey: MusicSymbols.gClef, id: this.song.id})
        this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID)
        this.saveEdits()
      }
    } else {
      const currPart = this.getCurrPart()
      const currSong = this.getCurrSong()
      const value = this.userInput.trim()
      switch (this.currField) {
        case EditFields.KEY:
          this.$store.commit(Mutations.EDIT_SONG_KEY, { newKey: value, id: this.song.id})
          this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID)
          this.currField = EditFields.PART
        break
        case EditFields.PART:
          console.log(`PART: Let's add ${value} to ${this.currField}`)
          currPart.name = value
          // this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
          this.currField = EditFields.CHORD
          this.currChordIndexPath = [-1, 0]
        break
        case EditFields.CHORD:
          console.log(`CHORD: Let's add ${value} to ${this.currField}`)
          try {
            const chord = Chord.parse(value, currSong.notes!.arrangement)
            if (!currPart.chords) {
              currPart.chords = [[chord]]
              this.currChordIndexPath = [this.currChordIndexPath[0] + 1, 0]
            } else if (currPart.chords[currPart.chords.length - 1][0].rootInt === -1) {
              // This is a new row, increment chordLine segment
              currPart.chords[currPart.chords.length - 1][0] = chord
              // this.currChordIndexPath = [this.currChordIndexPath[0] + 1, 0]
            } else {
              // This is a new chord, increment chord segment
              currPart.chords[currPart.chords.length - 1].push(chord)
              this.currChordIndexPath = this.currChordIndexPath.map((index, i) => {
                if (i === 0) {
                  return index
                } else if (i === 1) {
                  return index + 1
                }
                return -1
              })
            }
            // this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
          } catch (error) {
            console.log(error)
            alert('There is no chord named ' + value)
          }
        break
      }
      this.resetField()
      this.saveEdits()
    }
  }

  private resetField() {
    this.userInput = ''
  }

  private addNewPart() {
    const currSong: SongModel = this.getCurrSong()
    // Add new empty SongPart to currSong.notes.arrangement
    if (currSong.notes === undefined) {
      const arrangement = new SongArrangement()
      currSong.notes = new SongNote(arrangement)
    }
    const newPart = new SongPart()
    currSong.notes.arrangement.parts.push(newPart)
    this.currField = EditFields.PART
    this.currChordIndexPath = [-1, 0]
    this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID, newPart.id)
//    this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
  }

  private addNewChordLine() {
    const currSong: SongModel = this.getCurrSong()
    // Add new empty array to currSong.notes.arrangement.chords
    if (currSong.notes !== undefined) {
      const last = currSong.notes.arrangement.parts.length - 1
      const chords = currSong.notes.arrangement.parts[last].chords
      if (chords) {
        chords.push([cursorChord])
        this.currChordIndexPath = [this.currChordIndexPath[0] + 1, 0]
      }
    }
  }

  private getCurrSong(): SongModel {
    return this.song
  }

  private getCurrPart(): SongPart {
    if (this.song.notes && this.song.notes!.arrangement && this.song.notes!.arrangement!.parts) {
      const lastPart = this.song.notes!.arrangement!.parts.length - 1
      const currPartId = this.song.notes!.arrangement!.parts[lastPart].id
      this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID, currPartId)
    } else {
      const arrangement = new SongArrangement()
      arrangement.parts = [new SongPart()]
      this.song.notes = new SongNote(arrangement)
      const currPartId = arrangement.parts[0].id
      this.$store.commit(Mutations.UPDATE_CURRENT_PART_ID, currPartId)
    }
    const currPart = this.song.notes!.arrangement.parts.find(part => part.id === this.currPartId)
    if (currPart) {
      return currPart
    } else {
      debugger
      return new SongPart()
    }
  }
  // private getCurrSong(): SongModel {
  //   let currSong = (this.$store as Store<IState>).state!.currSong
  //   if (!currSong) {
  //     this.$store.commit(Mutations.EDIT_MODE, this.song.id)
  //     this.$store.commit(Mutations.UPDATE_CURRENT_SONG, this.song)
  //     currSong = this.song
  //   }
  //   return currSong!
  // }

  // private getCurrPart(): SongPart {
  //   const currSong = this.getCurrSong()
  //   if (currSong.notes === undefined) {
  //     const arrangement = new SongArrangement()
  //     const newPart = new SongPart()
  //     arrangement.parts.push(newPart)
  //     currSong.notes = new SongNote(arrangement)
  //     return currSong.notes.arrangement.parts[0]
  //   } else {
  //     const last = currSong.notes!.arrangement.parts.length - 1
  //     return currSong.notes!.arrangement.parts[last]
  //   }
  // }
}
</script>

<style lang="scss" scoped>
.song {
  margin: 0.5em auto;
  cursor: pointer;
  h4 {
    margin: 0.5em auto;
    font-size: 28px;
    color: #333;
    text-align: center;
    text-transform: uppercase;
    position: relative;
    .song-key {
      display: block;
      position: absolute;
      cursor: pointer;
      right: 2em;
      bottom: 0;
      font-weight: normal;
      color: #777;
      text-transform: none;
    }
  }
  .buttons {
    display: flex;
    justify-content: center;
    .button {
      margin: 0.5em;
    }
  }
  .parts {
    margin: 0 auto;
    padding: 0;
    max-width: 46em;
    .part {
      display: grid;
      grid-template-columns: 150px 1fr;
      grid-template-rows: 1fr;
      grid-gap: 2px;
      margin-bottom: 2px;
      & > div {
        background-color: #f3f3f3;
      }
      &:hover {
        & > div {
          background-color: #eee;
        }
      }
      .part-name {
        display: flex;
        p {
          margin: auto;
          text-align: center;
          text-transform: uppercase;
        }
      }
      .chords-container {
        padding: 0.75em 0 0.75em 2em;
        padding: 0;
        .chords {
          display: grid;
          grid-template-columns: repeat(auto-fit, 4em);
          .chord {
            padding: 0.75em 1.25em;
            &.active {
              border: 1px dashed #999;
              background-color: #e0f1f7;
            }
          }
        }
      }
      .part-name,
      .chords-container {
        &.active {
          border: 1px dashed #999;
          background-color: #e0f1f7;
        }
      }
    }
  }
  &:hover {
    h4 {
      color: #000;
    }
  }
}
</style>
