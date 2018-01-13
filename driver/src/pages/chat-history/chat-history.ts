import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ChatPage } from '../chat/chat';
import { ChatService } from '../../services/chat-service';

@Component({
  selector: 'page-chat-history',
  templateUrl: 'chat-history.html'
})

export class ChatHistoryPage {
	chats: Array<any>;
  loadedChats: Array<any>;
  getHistorySubscription: any;

  constructor(public nav: NavController, public chatService: ChatService) {
  }

  ionViewWillEnter() {
    this.getHistorySubscription = this.chatService.getHistory().subscribe(snapshot => {
      this.loadedChats = snapshot;
      this.initializeItems();
    })
  }

  ionViewWillLeave() {
    this.getHistorySubscription.unsubscribe();
  }

  initializeItems() {
    this.chats = this.loadedChats;
  }

  getItems(ev: any) {
    this.initializeItems();
    let val = ev.target.value;
    if (val && val.trim() != '') {
      this.chats = this.chats.filter((chat) => {
        return (chat.name.toLowerCase().indexOf(val.toLowerCase()) > -1) ||
          (chat.text.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  goToChat(passengerId) {
    this.nav.push(ChatPage, {
      passengerId: passengerId
    })
  }
}
