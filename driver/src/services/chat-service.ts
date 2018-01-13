import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database/database';
import { AuthService } from './auth-service';
import { TripService } from './trip-service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/observable/of';

@Injectable()
export class ChatService {
  defaultSkipInterval: number = 7;

  constructor(
    public db: AngularFireDatabase,
    public authService: AuthService,
    public tripService: TripService
  ) {

  }

  sendMessage(passengerId, text) {
    let user = this.authService.getUserData();
    this.db.list('chats/' + passengerId + '_' + user.uid + '/messages').push({
      fromPassenger: false,
      isRead : false,
      text: text,
      createdAt : Date.now()
    })
  }

  readMessages(passengerId) {
    let user = this.authService.getUserData();
    let messages = this.db.list('chats/' + passengerId + '_' + user.uid + '/messages');
    return messages.subscribe(snapshots => {
      snapshots.forEach(snapshot => {
        if (snapshot.fromPassenger)
          messages.update(snapshot, { isRead: true });
      });
    })
  }

  checkTypingMessageStatus(passengerId) {
    let user = this.authService.getUserData();
    return this.db.object('chats/' + passengerId + '_' + user.uid).map(message => {
      return message.isPassengerTyping;
    });
  }

  startTypingMessage(passengerId) {
    let user = this.authService.getUserData();
    this.db.object('chats/' + passengerId + '_' + user.uid).update({
      isDriverTyping : true
    })
  }

  stopTypingMessage(passengerId) {
    let user = this.authService.getUserData();
    this.db.object('chats/' + passengerId + '_' + user.uid).update({
      isDriverTyping : false
    })
  }

  getMessages(passengerId, skipInterval?) {
    let intervals = skipInterval ? [-(skipInterval + this.defaultSkipInterval), -skipInterval] :
        [-this.defaultSkipInterval];
    let user = this.authService.getUserData();
    return this.db.list('chats/' + passengerId + '_' + user.uid + '/messages').map(messages => {
      return messages.map(message => {
        if (!message.fromPassenger) {
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
        orderByChild: 'driverId',
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
          return !message.isRead && message.fromPassenger;
        });
        return {
          text: lastMessage.text.startsWith("<img src='") ? 'image' : lastMessage.text,
          date: lastMessage.createdAt,
          count: unreadMessages.length,
          passengerId: chat.passengerId
        }
      })
    }).mergeMap(historyData => {
      if (historyData.length) return Observable.combineLatest(
        historyData.map(historyItem => {
          return this.tripService.getPassenger(historyItem.passengerId).map(passenger => {
            historyItem.name = passenger.name;
            historyItem.photo = passenger.photoURL;
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
        orderByChild: 'driverId',
        equalTo: user.uid
      }
    }).map(chats => {
      return chats.map(chat => {
        let messages = (<any>Object).keys(chat.messages).map(key => {
          return chat.messages[key];
        });
        let unreadMessages = messages.filter(message => {
          return !message.isRead && message.fromPassenger;
        });
        return unreadMessages.length;
      }).reduce((acc, x) => {
        return acc + x;
      }, 0)
    })
  }
}