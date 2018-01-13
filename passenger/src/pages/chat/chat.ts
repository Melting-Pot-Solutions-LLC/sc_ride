import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { ChatService } from '../../services/chat-service';
import { DriverService } from '../../services/driver-service';
import { Camera } from '@ionic-native/camera';
import { Keyboard } from '@ionic-native/keyboard';
import * as firebase from 'firebase';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html'
})

export class ChatPage {
  messages: Array<any>;
  readMessagesSubscription: any;
  getMessagesSubscription: any;
  checkTypingMessageStatusSubscription: any;
  getDriverSubscription: any;
  onKeyboardShowSubscription: any;
  onKeyboardHideSubscription: any;
  messageText: any;
  driverId: any;
  driver: any;
  keydownTimeout: any = null;
  isTyping: boolean;

  @ViewChild('content') content: any;

  constructor(
    public nav: NavController,
    public navParams: NavParams,
    public chatService: ChatService,
    public driverService: DriverService,
    public actionSheetCtrl: ActionSheetController,
    private camera: Camera,
    private keyboard: Keyboard
  ) {
    this.driverId = navParams.get('driverId');
    this.readMessagesSubscription = this.chatService.readMessages(this.driverId);
    this.getMessagesSubscription = this.chatService.getMessages(this.driverId).subscribe(snapshot => {
      this.messages = snapshot;
      this.contentScrollToBottom();
    });
    this.getDriverSubscription = this.driverService.getDriver(this.driverId).subscribe(snapshot => {
      this.driver = snapshot;      
    });
    this.checkTypingMessageStatusSubscription = this.chatService.checkTypingMessageStatus(this.driverId).subscribe(snapshot => {
      this.isTyping = snapshot;
      this.contentScrollToBottom();
    });
    this.onKeyboardShowSubscription = this.keyboard.onKeyboardShow().subscribe(() => {
      this.contentScrollToBottom();
    });
    this.onKeyboardHideSubscription = this.keyboard.onKeyboardHide().subscribe(() => {
      this.contentScrollToBottom();
    })
  }

  ionViewDidEnter() {
    this.contentScrollToBottom();
  }


  ionViewWillLeave() {
    this.readMessagesSubscription.unsubscribe();
    this.getMessagesSubscription.unsubscribe();
    this.getDriverSubscription.unsubscribe();
    this.checkTypingMessageStatusSubscription.unsubscribe();
    this.onKeyboardShowSubscription.unsubscribe();
    this.onKeyboardHideSubscription.unsubscribe();
  }

  contentScrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom(false);
    })
  }

  doRefresh(refresher) {
    this.chatService.getMessages(this.driverId, this.messages.length).take(1).subscribe(snapshot => {
      this.messages = snapshot.concat(this.messages);
      refresher.complete();
      setTimeout(() => {
        this.content.scrollToTop(false);
      })
    })
  }

  keyDownText(event) {
    if (this.keydownTimeout)
      clearTimeout(this.keydownTimeout)
    else this.chatService.startTypingMessage(this.driverId);
    this.keydownTimeout = setTimeout(() => {
      this.keydownTimeout = null;
      this.chatService.stopTypingMessage(this.driverId);
    }, 5000);
  }

  sendMessage() {
    this.chatService.sendMessage(this.driverId, this.messageText);
    this.messageText = '';
  }

  saveImageToFirebase(base64string): firebase.Promise<any> {
    let ref = firebase.storage().ref().child('/messages/' + Date.now() + '_image.png');
    return ref.putString(base64string, 'data_url');
  }

  sendImage() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Upload image',
      buttons: [
        {
          text: 'Take Photo',
          handler: () => {
            this.camera.getPicture({
              destinationType: this.camera.DestinationType.DATA_URL,
              sourceType: this.camera.PictureSourceType.CAMERA,
              encodingType: this.camera.EncodingType.PNG
            }).then((imageData) => {
              this.saveImageToFirebase('data:image/png;base64,' + imageData).then((snapshot) => {
                this.chatService.sendMessage(this.driverId, "<img src='"+snapshot.downloadURL+"'>");
              }, (error) => {
                console.log(error);
              })
            }, (error) => {
              console.log(error);
            })
          }
        }, {
          text: 'Photo from Library',
          handler: () => {
            this.camera.getPicture({
              destinationType: this.camera.DestinationType.DATA_URL,
              sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
              encodingType: this.camera.EncodingType.PNG
            }).then((imageData) => {
              this.saveImageToFirebase('data:image/png;base64,' + imageData).then((snapshot) => {
                this.chatService.sendMessage(this.driverId, "<img src='"+snapshot.downloadURL+"'>");
              }, (error) => {
                console.log(error);
              })
            }, (error) => {
              console.log(error);
            })
          }
        }, {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    actionSheet.present();
  }
}
