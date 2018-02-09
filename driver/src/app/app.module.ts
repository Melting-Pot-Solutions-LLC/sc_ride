import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpModule } from '@angular/http';
import { Geolocation } from '@ionic-native/geolocation';
import { IonicStorageModule } from '@ionic/storage';
import { Facebook } from '@ionic-native/facebook';
import { Camera } from '@ionic-native/camera';
import { Keyboard } from '@ionic-native/keyboard';
import { OneSignal } from '@ionic-native/onesignal';

// Import the AF2 Module
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

// Import moment module
import { MomentModule } from 'angular2-moment';

// import services
import { DriverService } from '../services/driver-service';
import { ReportService } from '../services/report-service';
import { TransactionService } from '../services/transaction-service';
import { PlaceService } from '../services/place-service';
import { DealService } from '../services/deal-service';
import { TripService } from '../services/trip-service';
import { AuthService } from '../services/auth-service';
import { SettingService } from '../services/setting-service';
import { ChatService } from '../services/chat-service';
// end import services

// import pages
import { HomePage } from '../pages/home/home';
import { JobHistoryPage } from '../pages/job-history/job-history';
import { LoginPage } from '../pages/login/login';
import { ModalJobPage } from '../pages/modal-job/modal-job';
import { DropOffPage } from '../pages/drop-off/drop-off';
import { PickUpPage } from '../pages/pick-up/pick-up';
import { ProfilePage } from '../pages/profile/profile';
import { RegisterPage } from '../pages/register/register';
import { SettingPage } from '../pages/setting/setting';
import { SupportPage } from '../pages/support/support';
import { WalletPage } from '../pages/wallet/wallet';
import { UserPage } from '../pages/user/user';
import { ChatHistoryPage } from '../pages/chat-history/chat-history';
import { ChatPage } from '../pages/chat/chat';
// end import pages

// AF2 Settings
export const firebaseConfig = {
  apiKey: "AIzaSyDKo4A60BeWXnVTdfEku2kef4dTJ0nB13g",
  authDomain: "sc-ride.firebaseapp.com",
  databaseURL: "https://sc-ride.firebaseio.com",
  projectId: "sc-ride",
  storageBucket: "gs://sc-ride.appspot.com/",
  messagingSenderId: "825922165729"
};

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    JobHistoryPage,
    LoginPage,
    ModalJobPage,
    DropOffPage,
    PickUpPage,
    ProfilePage,
    RegisterPage,
    SettingPage,
    SupportPage,
    WalletPage,
    UserPage,
    ChatHistoryPage,
    ChatPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    MomentModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    JobHistoryPage,
    LoginPage,
    ModalJobPage,
    DropOffPage,
    PickUpPage,
    ProfilePage,
    RegisterPage,
    SettingPage,
    SupportPage,
    WalletPage,
    UserPage,
    ChatHistoryPage,
    ChatPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    DriverService,
    ReportService,
    TransactionService,
    PlaceService,
    DealService,
    TripService,
    AuthService,
    SettingService,
    ChatService,
    Facebook,
    Camera,
    Keyboard,
    OneSignal,
    /* import services */
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {
}
