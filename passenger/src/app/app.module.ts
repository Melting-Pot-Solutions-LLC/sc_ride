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
import { NotificationService } from '../services/notification-service';
import { PlaceService } from '../services/place-service';
import { TripService } from '../services/trip-service';
import { SettingService } from '../services/setting-service';
import { DealService } from '../services/deal-service';
import { AuthService } from '../services/auth-service';
import { ChatService } from '../services/chat-service';
// end import services

// import pages
import { DriverPage } from '../pages/driver/driver';
import { FindingPage } from '../pages/finding/finding';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { ResetPasswordPage } from '../pages/reset-password/reset-password';
import { ModalRatingPage } from '../pages/modal-rating/modal-rating';
import { NotificationPage } from '../pages/notification/notification';
import { PaymentMethodPage } from '../pages/payment-method/payment-method';
import { PlacesPage } from '../pages/places/places';
import { ProfilePage } from '../pages/profile/profile';
import { RegisterPage } from '../pages/register/register';
import { SupportPage } from '../pages/support/support';
import { TrackingPage } from '../pages/tracking/tracking';
import { MapPage } from '../pages/map/map';
import { TripsPage } from '../pages/trips/trips';
import { TripDetailPage } from '../pages/trip-detail/trip-detail';
import { UserPage } from '../pages/user/user';
import { CardSettingPage } from '../pages/card-setting/card-setting';
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
    DriverPage,
    FindingPage,
    HomePage,
    LoginPage,
    ResetPasswordPage,
    ModalRatingPage,
    NotificationPage,
    PaymentMethodPage,
    PlacesPage,
    ProfilePage,
    RegisterPage,
    SupportPage,
    TrackingPage,
    MapPage,
    TripsPage,
    TripDetailPage,
    UserPage,
    CardSettingPage,
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
    DriverPage,
    FindingPage,
    HomePage,
    LoginPage,
    ResetPasswordPage,
    ModalRatingPage,
    NotificationPage,
    PaymentMethodPage,
    PlacesPage,
    ProfilePage,
    RegisterPage,
    SupportPage,
    TrackingPage,
    MapPage,
    TripsPage,
    TripDetailPage,
    UserPage,
    CardSettingPage,
    ChatHistoryPage,
    ChatPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    DriverService,
    NotificationService,
    PlaceService,
    TripService,
    SettingService,
    DealService,
    AuthService,
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
