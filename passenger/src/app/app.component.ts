import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { ViewChild } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { OneSignal } from '@ionic-native/onesignal';

// import pages
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { NotificationPage } from '../pages/notification/notification';
import { SupportPage } from '../pages/support/support';
import { TripsPage } from '../pages/trips/trips';
import { AngularFireAuth } from 'angularfire2/auth/auth';
import { AuthService } from '../services/auth-service';
import { ChatService } from '../services/chat-service';
import { UserPage } from '../pages/user/user';
import { CardSettingPage } from '../pages/card-setting/card-setting';
import { ChatHistoryPage } from '../pages/chat-history/chat-history';
import { ChatPage } from '../pages/chat/chat';
// end import pages

@Component({
  templateUrl: 'app.html',
  queries: {
    nav: new ViewChild('content')
  }
})

export class MyApp {
  rootPage: any;
  nav: any;
  user = {};
  getUnreadMessagesSubscription: any;
  pages = [
    {
      title: 'Home',
      icon: 'ios-home-outline',
      count: 0,
      component: HomePage
    },
    {
      title: 'History',
      icon: 'ios-time-outline',
      count: 0,
      component: TripsPage
    },
    {
      title: 'Chats history',
      icon: 'ios-chatboxes-outline',
      count: 0,
      component: ChatHistoryPage
    },
    {
      title: 'Card setting',
      icon: 'ios-card-outline',
      count: 0,
      component: CardSettingPage
    },
    {
      title: 'Notification',
      icon: 'ios-notifications-outline',
      count: 2,
      component: NotificationPage
    },
    {
      title: 'Support',
      icon: 'ios-help-circle-outline',
      count: 0,
      component: SupportPage
    },
  ];

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public afAuth: AngularFireAuth,
    public authService: AuthService,
    public chatService: ChatService,
    private oneSignal: OneSignal
  ) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      // check for login stage, then redirect
      afAuth.authState.take(1).subscribe(authData => {
        if (authData) {
          if (!this.nav.getActive())
            this.nav.setRoot(HomePage);
        } else {
          if (!this.nav.getActive())
            this.nav.setRoot(LoginPage);
        }
      });

      // get user data
      afAuth.authState.subscribe(authData => {
        if (authData) {
          this.user = authService.getUserData();
          this.getUnreadMessagesSubscription = this.chatService.getUnreadMessages().subscribe(snapshot => {
            this.pages[2].count = snapshot;
          })
        }
      })

      // push notifications
      if (platform.is('cordova')) {
        this.oneSignal.startInit('ddcf8041-d46b-4345-81c7-57f492799e9c', '59090949998');
        this.oneSignal.iOSSettings({
          "kOSSettingsKeyAutoPrompt": true,
          "kOSSettingsKeyInAppLaunchURL": false
        });
        this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.None);
        this.oneSignal.handleNotificationOpened().subscribe((jsonData) => {
          var notificationType = jsonData.notification.payload.additionalData &&
              jsonData.notification.payload.additionalData.type;
          var notificationParams = jsonData.notification.payload.additionalData &&
              jsonData.notification.payload.additionalData.params;
          if (notificationType && notificationParams)
            if ((notificationType == 'chat') && notificationParams.driverId)
              afAuth.authState.take(1).subscribe(authData => {
                if (authData)
                  this.nav.setRoot(ChatPage, {
                    driverId: notificationParams.driverId
                  })
              })
        });
        this.oneSignal.endInit();
      }
    })
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  // view current user profile
  viewProfile() {
    this.nav.push(UserPage, {
      user: this.user
    });
  }

  // logout
  logout() {
    this.nav.setRoot(LoginPage).then(() => {
      this.getUnreadMessagesSubscription.unsubscribe();
      this.authService.logout();
    });
  }
}
