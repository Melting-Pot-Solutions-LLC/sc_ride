import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database/database';
import { AuthService } from './auth-service';
import { DriverService } from './driver-service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/observable/of';

@Injectable()
export class ChatService {
  defaultSkipInterval: number = 7;

  constructor(
    public db: AngularFireDatabase,
    public authService: AuthService,
    public driverService: DriverService
  ) {

  }

  sendMessage(driverId, text) {
    let user = this.authService.getUserData();
    this.db.object('chats/' + user.uid + '_' + driverId).take(1).subscribe(snapshot => {
      if (snapshot.$value === null) {
        this.db.object('chats/' + user.uid + '_' + driverId).update({
          passengerId: user.uid,
          driverId: driverId,
          isPassengerTyping : false,
          isDriverTyping : false
        }).then(_ => {
          this.addMessageToChatObject(user.uid, driverId, text);
        })
      }
      else this.addMessageToChatObject(user.uid, driverId, text);
    });
  }

  readMessages(driverId) {
    let user = this.authService.getUserData();
    let messages = this.db.list('chats/' + user.uid + '_' + driverId + '/messages');
    return messages.subscribe(snapshots => {
      snapshots.forEach(snapshot => {
        if (!snapshot.fromPassenger)
          messages.update(snapshot, { isRead: true });
      });
    })
  }

  checkTypingMessageStatus(driverId) {
    let user = this.authService.getUserData();
    return this.db.object('chats/' + user.uid + '_' + driverId).map(message => {
      return message.isDriverTyping;
    });
  }

  startTypingMessage(driverId) {
    let user = this.authService.getUserData();
    this.db.object('chats/' + user.uid + '_' + driverId).take(1).subscribe(snapshot => {
      if (snapshot.$value !== null) {
        this.db.object('chats/' + user.uid + '_' + driverId).update({
          isPassengerTyping : true
        })
      }
    })
  }

  stopTypingMessage(driverId) {
    let user = this.authService.getUserData();
    this.db.object('chats/' + user.uid + '_' + driverId).take(1).subscribe(snapshot => {
      if (snapshot.$value !== null) {
        this.db.object('chats/' + user.uid + '_' + driverId).update({
          isPassengerTyping : false
        })
      }
    })
  }

  getMessages(driverId, skipInterval?) {
    let intervals = skipInterval ? [-(skipInterval + this.defaultSkipInterval), -skipInterval] :
        [-this.defaultSkipInterval];
    let user = this.authService.getUserData();
    return this.db.list('chats/' + user.uid + '_' + driverId + '/messages').map(messages => {
      return messages.map(message => {
        if (message.fromPassenger) {
          message.photo = user.photoURL;
          message.name = user.displayName;
        };
        if (!message.text.startsWith("<img src='") && !message.text.startsWith('<p>'))
          message.text = '<p>'+message.text+'</p>';
        return message;
      }).sort((a,b) => {
        return a.createdAt - b.createdAt;
      }).slice(...intervals)
    })
  }

  getHistory() {
    let user = this.authService.getUserData();
    return this.db.list('chats', {
      query: {
        orderByChild: 'passengerId',
        equalTo: user.uid
      }
    }).map(chats => {
      return chats.map(chat => {
        let messages = (<any>Object).keys(chat.messages).map(key => {
          return chat.messages[key];
        });
        let lastMessage = messages.sort((a,b) => {
          return b.createdAt - a.createdAt;
        })[0];
        let unreadMessages = messages.filter(message => {
          return !message.isRead && !message.fromPassenger;
        });
        return {
          text: lastMessage.text.startsWith("<img src='") ? 'image' : lastMessage.text,
          date: lastMessage.createdAt,
          count: unreadMessages.length,
          driverId: chat.driverId
        }
      })
    }).mergeMap(historyData => {
      if (historyData.length) return Observable.zip(
        ...historyData.map(historyItem => {
          return this.driverService.getDriver(historyItem.driverId).map(driver => {
            historyItem.name = driver.name;
            historyItem.photo = driver.photoURL;
            return historyItem;   
          })
        })
      )
      else return Observable.of([]);
    })
  }

  getUnreadMessages() {
    let user = this.authService.getUserData();
    return this.db.list('chats', {
      query: {
        orderByChild: 'passengerId',
        equalTo: user.uid
      }
    }).map(chats => {
      return chats.map(chat => {
        if (chat.messages) {
          let messages = (<any>Object).keys(chat.messages).map(key => {
            return chat.messages[key];
          });
          let unreadMessages = messages.filter(message => {
            return !message.isRead && !message.fromPassenger;
          });
          return unreadMessages.length;
        }
        else return 0;
      }).reduce((acc, x) => {
        return acc + x;
      }, 0)
    })
  }

  addMessageToChatObject(passengerId, driverId, text) {
    this.db.list('chats/' + passengerId + '_' + driverId + '/messages').push({
      fromPassenger: true,
      isRead : false,
      text: text,
      createdAt : Date.now()
    })
  }
}