import * as firebase from 'firebase'
import { Store } from 'vuex'
import { Collections, Mutations } from '../constants'
import { IState } from '../stores/Store'
import SetList from '../classes/SetList'
import Song from '../classes/Song'
import User from '../classes/User'
import IUserInfo from '../interfaces/IUserInfo'

class FirestoreDatabaseConnection {
  public setListUnsubscribe: () => void
  constructor(public store: Store<IState>) {
    this.setListUnsubscribe = () => {
      console.log('No setList to unsubscribe from')
    }
  }

  public getOrCreateUser = async (userInfo: IUserInfo): Promise<any> => {
    try {
      const usersRef = await this.getCollectionRef(Collections.USERS)
      const userDoc = await (usersRef as any).doc(userInfo.uid).get()
      if (userDoc.exists) {
        const storedUser = userDoc.data()
        const user = new User({ ...storedUser })
        if (storedUser.avatar !== userInfo.avatar) {
          // Update avatar locally
          user.avatar = userInfo.avatar
          // Update avatar in firestore
          usersRef.doc(userInfo.uid).update({
            avatar: userInfo.avatar
          })
        }
        return user
      } else {
        // create user
        const newUser = await usersRef.doc(userInfo.uid).set(userInfo)
        const user = new User({ ...userInfo })
        return user
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Get a reference to a firestore collection
   * @param {string} collection - Identifier for the collection to get.
   * Possible values are: `setlists`, `users`, `invitations`
   */
  public getCollectionRef = async (
    collection: string
  ): Promise<firebase.firestore.CollectionReference> => {
    return firebase.firestore().collection(collection)
  }

  /**
   * Create new setList
   * @param {string} title - The SetList name
   * @param {User} user - The current user
   * @returns {string} - The newly created setList's id
   */
  public addSetList = (title: string, user: User): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const setListsRef = await this.getCollectionRef(Collections.SETLISTS)
        const setListRef = await setListsRef.add({
          title,
          users: {
            [user.uid]: true
          }
        })
        // Open new setList
        await this.storeUsersLastSetListId(user, setListRef.id)
        return resolve(setListRef.id)
      } catch (error) {
        return reject(error)
      }
    })
  }

  public getSetLists = (uid: string): Promise<{ [key: string]: SetList }> => {
    return new Promise(async (resolve, reject) => {
      try {
        const setListsRef = await this.getCollectionRef(Collections.SETLISTS)
        const userSetLists = await setListsRef.where(`users.${uid}`, '==', true).get()
        const setLists: { [key: string]: SetList } = {}
        userSetLists.forEach(setListSnapshot => {
          const { title, users } = setListSnapshot.data()
          const setList: SetList = {
            id: setListSnapshot.id,
            title,
            songs: [],
            users
          }
          setLists[`${setListSnapshot.id}`] = setList
        })
        return resolve(setLists)
      } catch (error) {
        console.log(error)
        console.log('Found no setLists')
        debugger
        return reject()
      }
    })
  }

  public getUsersLastSetListId = (user: User): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get users ref
        const usersRef = await this.getCollectionRef(Collections.USERS)
        const userDoc = await usersRef.doc(user.uid).get()
        const storedUser = userDoc.data()
        if (!storedUser) {
          throw new Error('No user found with id: ' + user.uid)
        }
        const currentSetList = storedUser.currentSetList
        return resolve(currentSetList)
      } catch (error) {
        return reject(error)
      }
    })
  }

  public storeUsersLastSetListId = (user: User, setListId: string): void => {
    // Get users ref
    this.getCollectionRef(Collections.USERS).then(usersRef => {
      return usersRef.doc(user.uid).set(
        {
          currentSetList: setListId
        },
        { merge: true }
      )
    })
  }

  public watchSetList = (setList: SetList): void => {
    this.setListUnsubscribe()
    this.getCollectionRef(Collections.SETLISTS).then(setListsRef => {
      this.setListUnsubscribe = setListsRef
        .doc(setList.id)
        .collection(Collections.SONGS)
        .onSnapshot(snapshot => {
          snapshot.docChanges.forEach(change => {
            const song = Song.fromSnapshot(change.doc)
            if (!song) {
              console.log(change.doc)
              throw new Error('Song is undefined')
            }
            // const songId = change.doc.id
            if (change.doc.metadata.hasPendingWrites) {
              // console.log('LOCAL CHANGE ONLY')
              const firestoreId = change.doc.id
              song.id = firestoreId
              switch (change.type) {
                case 'added':
                  console.log(
                    `- Adding song ${song.name} ${song.id} to setList at index ${song.index}`
                  )
                  this.store.commit(Mutations.ADD_SONG, song)
                  break
                case 'modified':
                  // console.log('Edit transfer')
                  this.store.commit(Mutations.EDIT_SONG, song)
                  break
                case 'removed':
                  // console.log('Remove transfer from currentSetList')
                  this.store.commit(Mutations.DELETE_SONG, song)
                  break
              }
            } else {
              // console.log('INCOMING CHANGE - UPDATE UI!!!')
              switch (change.type) {
                case 'added':
                  console.log(`- Adding song ${song.name} to setList at index ${song.index}`)
                  this.store.commit(Mutations.ADD_SONG, song)
                  break
                case 'modified':
                  // console.log('Edit transfer')
                  this.store.commit(Mutations.EDIT_SONG, song)
                  break
                case 'removed':
                  // console.log('Remove transfer from currentSetList')
                  this.store.commit(Mutations.DELETE_SONG, song)
                  break
              }
            }
          })
        })
    })
  }

  public addSong = (song: Song, setListId: string): Promise<{ id: string }> => {
    return new Promise(async (resolve, reject) => {
      try {
        const setListsRef = await this.getCollectionRef(Collections.SETLISTS)
        const songsRef = await setListsRef.doc(setListId).collection(Collections.SONGS)
        // // Check if song already exists
        // let songExists = false
        const serializedSong = song.serialize()
        const songDoc = await songsRef.add(serializedSong)
        return resolve(songDoc)
      } catch (error) {
        console.error(error)
        return reject(error)
      }
    })
  }

  public editSong = (song: Song, setListId: string): Promise<object> => {
    return new Promise(async (resolve, reject) => {
      try {
        const setListsRef = await this.getCollectionRef(Collections.SETLISTS)
        const songsRef = await setListsRef.doc(setListId).collection(Collections.SONGS)
        // // Check if song already exists
        const songRef = await songsRef.doc(song.id)
        // let songExists = false
        const serializedSong = song.serialize()
        // const songDocs = await songsRef
        //   .where('amount', '==', serializedSong.amount)
        //   .where('paidBy', '==', serializedSong.paidBy)
        //   .where('receiver', '==', serializedSong.receiver)
        //   .where('message', '==', serializedSong.message)
        //   .get()
        // if (songDocs) {
        //   songDocs.forEach(doc => {
        //     const storedSong = doc.data()
        //     const storedDate = new Date(storedSong.date)
        //     if (
        //       storedDate.getFullYear() === song.date.getFullYear() &&
        //       storedDate.getMonth() === song.date.getMonth() &&
        //       storedDate.getDate() === song.date.getDate()
        //     ) {
        //       songExists = true
        //     }
        //   })
        //   // Found no matches, proceed
        // }
        // if (songExists) {
        //   console.log('Song already exists')
        //   throw new Error('Song already exists')
        // }
        const songDoc = await songRef.set(serializedSong, {
          merge: true
        })
        return resolve()
      } catch (error) {
        console.error(error)
        return reject(error)
      }
    })
  }

  /**
   * Populate Project with Users
   */
  // public populateProjectUsers = async (project: Project): Promise<Project> => {
  //   try {
  //     // Get projects ref
  //     const projectsRef = await this.getCollectionRef(Collections.SETLISTS)
  //     // Load users
  //     const storedProjectRef = await projectsRef.doc(project.id)
  //     const storedProjectDoc = await storedProjectRef.get()
  //     const storedProject = storedProjectDoc.data()
  //     if (!storedProject) {
  //       throw new Error('Found no project with id: ' + project.id)
  //     }
  //     const projectUserIds = Object.keys(storedProject.users)
  //     // Get users ref
  //     const usersRef = await this.getCollectionRef(Collections.USERS)
  //     const userFetchPromises: Array<Promise<void>> = []
  //     // Loop through project's users' ids
  //     projectUserIds.forEach(userId => {
  //       const userFetchPromise = usersRef
  //         .doc(userId)
  //         .get()
  //         .then(userDoc => {
  //           const { uid, name, avatar, email, currentProject } = userDoc.data()
  //           const userInfo: UserInfo = {
  //             uid,
  //             name,
  //             avatar,
  //             email,
  //             currentProject
  //           }
  //           project.users[userInfo.uid] = new User({ ...userInfo })
  //         })
  //       userFetchPromises.push(userFetchPromise)
  //     })
  //     await Promise.all(userFetchPromises)
  //     return project
  //   } catch (error) {
  //     debugger
  //     return project
  //   }
  // }

  // public addTransfers = (
  //   transfers: Transfer[],
  //   project: Project,
  //   userId: string
  // ): Promise<object> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const projectsRef = await this.getCollectionRef(Collections.SETLISTS)
  //       const transfersRef = await projectsRef.doc(project.id).collection(Collections.TRANSFERS)
  //       // Find existing transfers
  //       const existingTransfers = project.transfers.slice()
  //       // Sort added transfers
  //       const sortedTransfers = Transfer.sortByDate(transfers)
  //       // Init batch
  //       const db = firebase.firestore()
  //       const batch = db.batch()
  //       // Loop added transfers
  //       sortedTransfers.forEach((transfer, i) => {
  //         // Check if transfer already exists
  //         if (existingTransfers.find(storedTransfer => storedTransfer.isEqual(transfer))) {
  //           // Ignore existing transfer
  //           console.log('Transfer already exists, ignoring', transfer)
  //         } else {
  //           // Add transfer
  //           // Prepare for storage
  //           const serializedTransfer = transfer.serialize(userId)
  //           // Create doc ref
  //           const docRef = transfersRef.doc()
  //           // Add transfer
  //           batch.set(docRef, serializedTransfer)
  //         }
  //       })
  //       return batch.commit()
  //     } catch (error) {
  //       console.error(error)
  //       return reject(error)
  //     }
  //   })
  // }

  // public deleteTransfer = (transferId: string, projectId: string) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const projectsRef = await this.getCollectionRef(Collections.SETLISTS)
  //       const transfersRef = await projectsRef.doc(projectId).collection(Collections.TRANSFERS)
  //       return resolve(transfersRef.doc(transferId).delete())
  //     } catch (error) {
  //       return reject(error)
  //     }
  //   })
  // }

  // public inviteCollaborator = (
  //   email: string,
  //   inviter: User,
  //   project: Project
  // ): Promise<string | object> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const invitation: Invitation = {
  //         invited: email,
  //         inviter: inviter.uid,
  //         projectId: project.id,
  //         projectName: project.title
  //       }
  //       const invitationsRef = await this.getCollectionRef(Collections.INVITATIONS)
  //       // Check if invitation exists
  //       const existingInvitations = await invitationsRef
  //         .where('invited', '==', email)
  //         .where('projectId', '==', project.id)
  //         .limit(1)
  //         .get()
  //       if (!existingInvitations.empty) {
  //         // Return existing invitation id
  //         console.log('Found existing invitation', existingInvitations.docs[0])
  //         debugger
  //         return resolve(existingInvitations.docs[0].id)
  //       }
  //       // Create new invitation
  //       const invitationResult = await invitationsRef.add(invitation)
  //       console.log('Created new invitation', invitationResult)
  //       // Register invitation id on project
  //       const projectsRef = await this.getCollectionRef(Collections.SETLISTS)
  //       const projectInvitationResult = await projectsRef.doc(project.id).set(
  //         {
  //           invitedUsers: {
  //             [`${email}`]: true
  //           }
  //         },
  //         {
  //           merge: true
  //         }
  //       )
  //       return resolve(invitationResult.id)
  //     } catch (error) {
  //       console.error(error)
  //       return reject(error)
  //     }
  //   })
  // }

  // public openInvite = (inviteId: string): Promise<Invitation> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const invitationsRef = await this.getCollectionRef(Collections.INVITATIONS)
  //       const invitationDoc = await invitationsRef.doc(inviteId).get()
  //       const invitation = invitationDoc.data() as Invitation
  //       return resolve(invitation)
  //     } catch (error) {
  //       console.error(error)
  //       return reject(error)
  //     }
  //   })
  // }

  // public validateInvite = (inviteId: string): Promise<boolean> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const invitationsRef = await this.getCollectionRef(Collections.INVITATIONS)
  //       const invitationDoc = await invitationsRef.doc(inviteId).get()
  //       const invitation = invitationDoc.data() as Invitation
  //       const firebaseUser = firebase.auth().currentUser
  //       if (!firebaseUser) {
  //         throw new Error('Can not validate invite if firebaseUser is not logged in')
  //       } else {
  //         if (firebaseUser.email === invitation.invited) {
  //           // firebaseUser is valid, add user uid to project.users
  //           const token = await firebaseUser.getIdToken()
  //           let name = firebaseUser.displayName
  //           let email = firebaseUser.email
  //           let avatar = firebaseUser.photoURL
  //           if (!email || !name || !avatar) {
  //             firebaseUser.providerData.forEach(function(profile) {
  //               if (profile && profile.providerId.includes('google')) {
  //                 if (!email) {
  //                   email = profile.email || ''
  //                 }
  //                 if (!avatar) {
  //                   avatar = profile.photoURL
  //                 }
  //                 if (!name) {
  //                   name = profile.displayName
  //                 }
  //               }
  //             })
  //           }
  //           const userInfo: UserInfo = {
  //             uid: firebaseUser.uid,
  //             name: name || '',
  //             avatar: avatar || '',
  //             email: email || '',
  //             currentProject: invitation.projectId
  //           }

  //           const user = await this.getOrCreateUser(userInfo)
  //           const accepted = await this.acceptInvite(invitation, inviteId, user)
  //           if (!accepted) {
  //             throw new Error(
  //               'User is valid but something went wrong when trying to unlock project.'
  //             )
  //           }
  //           return resolve(true)
  //         } else {
  //           console.log("User's email doesn't match the invitation")
  //         }
  //       }
  //       return resolve(false)
  //     } catch (error) {
  //       console.error(error)
  //       return reject(false)
  //     }
  //   })
  // }

  // public acceptInvite = (
  //   invitation: Invitation,
  //   inviteId: string,
  //   user: User
  // ): Promise<boolean> => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const projectsRef = await this.getCollectionRef(Collections.SETLISTS)
  //       // Remove invited email from project.invitedUsers and
  //       // add user uid to project.users
  //       await projectsRef.doc(invitation.projectId).set(
  //         {
  //           invitedUsers: {
  //             [`${invitation.invited}`]: firebase.firestore.FieldValue.delete()
  //           },
  //           users: {
  //             [`${user.uid}`]: true
  //           }
  //         },
  //         { merge: true }
  //       )
  //       // Remove invitation
  //       const invitationsRef = await this.getCollectionRef(Collections.INVITATIONS)
  //       await invitationsRef.doc(inviteId).delete()
  //       // Set currentProject
  //       this.storeUsersLastSetListId(user, invitation.projectId)
  //       // Success
  //       return resolve(true)
  //     } catch (error) {
  //       console.error(error)
  //       return reject(error)
  //     }
  //   })
  // }
}

export default FirestoreDatabaseConnection
