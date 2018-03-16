<template>
  <div class="song" @click="startEditMode">
    <h4>{{ song.name }}
      <span
      v-if="songKey"
      v-html="songKey"
      @click="editKey"
      class="song-key">
      </span>
    </h4>
    <div v-if="parts.length > 0">
      <ul class="parts">
        <li v-for="(part, p) in parts" :key="p" class="part" :class="{ active: currPartId === part.id }">
          <div class="part-name" :class="{ active: currPartId === part.id && currField === 'PART' }">
            <p><b>{{ part.name }}</b></p>
          </div>
          <div class="chords-container" :class="{ active: currPartId === part.id && currField === 'CHORD' }">
            <div class="chords" v-for="(chordLine, l) in part.chords" :key="l">
              <div 
              class="chord" 
              v-for="(chord, c) in chordLine" 
              :key="c"
              v-html="chord.html(song.notes.arrangement)">
              </div>
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
import Chord from '../classes/Chord'
import SongPart from '../classes/SongPart';
import SongNote from '../classes/SongNote';
import SongArrangement from '../classes/SongArrangement';

@Component({
  props: {
    song: SongModel
  }
})
export default class Song extends Vue {
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
        return `Add a chord, then <b>SPACE</b> or <b>TAB</b> to enter the next.<br>
        <b>ENTER</b> will add another row.<br>
        <b>SHIFT</b> + <b>ENTER</b> adds a new part.`
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

  get parts(): Array<{ chords: Chord[][] }> {
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

  private startEditMode() {
    this.$store.commit(Mutations.EDIT_MODE, this.song.id)
    if (this.song.notes && this.song.notes.arrangement) {
      this.$store.commit(Mutations.UPDATE_CURRENT_SONG, this.song)
      const key = this.song.notes.arrangement.key()
      if (key === '') {
        this.currField = EditFields.KEY
      } else if (key === MusicSymbols.gClef) {
        console.log('Key:', key)
      }
      if (this.currField === EditFields.PART) {
        const currPart = this.song.notes.arrangement.parts.find(part => part.id === this.currPartId)
        if (currPart && currPart.name) {
          this.userInput = currPart.name
        }
      }
    } else {
      this.currField = EditFields.KEY
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
    this.$store.dispatch(Actions.SAVE_EDITS)
  }

  private toggleShiftKey(e: KeyboardEvent) {
    console.log('toggleShiftKey()')
    this.addUserInput()
    this.addNewPart()
    console.log(this.getCurrSong())
  }

  private handleDelete(e: KeyboardEvent) {
    if (this.userInput === '') {
      // Only remove stuff if field is empty
      const currSong = this.getCurrSong()
      const currPart = this.getCurrPart()
      const lastChordLine = currPart.chords[currPart.chords.length - 1]
      if (lastChordLine !== undefined) {
        lastChordLine.pop()
        if (lastChordLine.length === 0) {
          currPart.chords.pop()
          if (currPart.chords.length === 0) {
            currSong.notes!.arrangement.parts.pop()
          }
        }
        this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
        this.saveEdits()
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
        this.getCurrPart()
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
          console.log(`Let's add ${value} to ${this.currField}`)
          currPart.name = value
          this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
          this.currField = EditFields.CHORD
        break
        case EditFields.CHORD:
          console.log(`Let's add ${value} to ${this.currField}`)
          try {
            const chord = Chord.parse(value, currSong.notes!.arrangement)
            currPart.chords[currPart.chords.length - 1].push(chord)
            this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
          } catch {
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
    this.$store.commit(Mutations.UPDATE_CURRENT_SONG, currSong)
  }

  private addNewChordLine() {
    const currSong: SongModel = this.getCurrSong()
    // Add new empty array to currSong.notes.arrangement.chords
    if (currSong.notes !== undefined) {
      const last = currSong.notes.arrangement.parts.length - 1
      currSong.notes.arrangement.parts[last].chords.push([])
    }
  }

  private getCurrSong(): SongModel {
    let currSong = (this.$store as Store<IState>).state!.currSong
    if (!currSong) {
      this.$store.commit(Mutations.EDIT_MODE, this.song.id)
      this.$store.commit(Mutations.UPDATE_CURRENT_SONG, this.song)
      currSong = this.song
    }
    return currSong!
  }

  private getCurrPart(): SongPart {
    const currSong = this.getCurrSong()
    if (currSong.notes === undefined) {
      const arrangement = new SongArrangement()
      const newPart = new SongPart()
      arrangement.parts.push(newPart)
      currSong.notes = new SongNote(arrangement)
      return currSong.notes.arrangement.parts[0]
    } else {
      const last = currSong.notes!.arrangement.parts.length - 1
      return currSong.notes!.arrangement.parts[last]
    }
  }
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
      grid-template-columns: 120px 1fr;
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
        .chords {
          display: grid;
          grid-template-columns: repeat(auto-fit, 4em);
        }
      }
      .part-name.active,
      .chords-container.active {
        border: 1px dashed #999;
        background-color: #e0f1f7;
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
