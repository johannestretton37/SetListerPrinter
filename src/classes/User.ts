import IUserInfo from '../interfaces/IUserInfo'

class User {
  public uid: string
  public firstName: string
  public lastName: string
  public avatar: string
  public email: string
  public currentSetList: string

  constructor(userInfo: IUserInfo) {
    const { name, email, avatar, uid, currentSetList } = userInfo
    if (name) {
      const names = name.split(' ')
      this.firstName = names[0]
      this.lastName = names[1]
    } else {
      this.firstName = 'Undefined'
      this.lastName = 'Undefined'
    }
    this.uid = uid
    this.avatar = avatar
    this.email = email
    this.currentSetList = currentSetList
  }

  public name = (): string => {
    return `${this.firstName} ${this.lastName}`
  }

  public initials = (): string => {
    return `${this.firstName[0].toLocaleUpperCase()}${this.lastName[0].toLocaleUpperCase()}`
  }
}

export default User
