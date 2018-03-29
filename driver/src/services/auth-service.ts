import { Injectable } from "@angular/core";
import { Platform } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'rxjs/add/operator/take'
import { DEFAULT_AVATAR } from "./constants";
import { Facebook } from '@ionic-native/facebook';
import { OneSignal } from '@ionic-native/onesignal';

@Injectable()
export class AuthService {
  user: any;

  constructor(
    public platform: Platform,
    public afAuth: AngularFireAuth,
    public db: AngularFireDatabase,
    public storage: Storage,
    private fb: Facebook,
    private oneSignal: OneSignal
  ) {

  }

  // get current user data from firebase
  getUserData() {
    return this.afAuth.auth.currentUser;
  }

  // get driver by id
  getUser(id) {
    return this.db.object('drivers/' + id);
  }

  // login with email & password
  login(email, password) {
    return Observable.create(observer => {
      this.afAuth.auth.signInWithEmailAndPassword(email, password).then((result) => {
        result.name = result.displayName;
        this.createUserIfNotExist(result).then(() => {
          observer.next();
        }, (error) => {
          observer.error(error);
        })
      }, (error) => {
        if (error) {
          observer.error(error);
        }          
      })
    })
  }

  // login with facebook
  loginWithFacebook() {
    return Observable.create(observer => {
      this.fb.login(['email', 'public_profile']).then(res => {
        const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        firebase.auth().signInWithCredential(facebookCredential).then((result) => {
          result.name = result.displayName;
          this.createUserIfNotExist(result).then(() => {
            observer.next();
          }, (error) => {
            observer.error(error);
          })
        }, (error) => {
          if (error) {
            observer.error(error);
          }          
        })
      }, (error) => {
        observer.error(error);
      })
    })
  }

  // login with google
  loginWithGoogle() {
    return Observable.create(observer => {
      return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(result => {
        this.createUserIfNotExist(result.user).then(() => {
          observer.next();
        }, (error) => {
          observer.error(error);
        })
      }).catch((error: any) => {
        if (error) {
          observer.error(error);
        }
      });
    });
  }

  // logout from firebase
  logout() {
    const user = this.getUserData();
    this.db.object('drivers/' + user.uid + '/pushId').remove();
    return this.afAuth.auth.signOut();
  }

  // register new account
  register(email, password, name) {
    return Observable.create(observer => {
      this.afAuth.auth.createUserWithEmailAndPassword(email, password).then((authData: any) => {
        authData.name = name;
        this.createUserIfNotExist(authData).then(() => {
          observer.next();
        }, (error) => {
          observer.error(error);
        });
      }).catch((error: any) => {
        if (error) {
          observer.error(error);
        }
      });
    });
  }

  // update user profile data
  updateUserProfile(user) {
    let name = user.name ? user.name : user.email;
    let photoUrl = user.photoURL ? user.photoURL : DEFAULT_AVATAR;
    return this.getUserData().updateProfile({
      displayName: name,
      photoURL: photoUrl
    }).then(() => this.updateUserData(user, name, photoUrl));
  }

  // setup init data for driver
  setupUserData(driverId) {
    return this.db.object('drivers/' + driverId).update({
      balance: 10,
      rating: 4,
      refCode: driverId.substring(1, 4)
    })
  }

  // update data for driver
  updateUserData(driver, name, photoUrl) {
    return this.db.object('drivers/' + driver.uid).update({
      name: name,
      photoURL: photoUrl,
      email: driver.email,
      phoneNumber: driver.phoneNumber ? driver.phoneNumber : '',
      plate: driver.plate ? driver.plate : '',
      brand: driver.brand ? driver.brand : '',
      type: driver.type ? driver.type : ''
    })
  }

  // update pushId for driver
  updateUserPushId(driverId) {
    return new Promise((resolve, reject) => {
      if (this.platform.is('cordova')) {
        this.oneSignal.getIds()
          .then(ids => this.db.object('drivers/' + driverId).update({
            pushId: ids.userId
          }))
          .then(() => resolve())
          .catch(error => reject(error));
      }
      else resolve();
    })
  }

  // create new user if not exist
  createUserIfNotExist(user) {
    return new Promise((resolve, reject) => {
      // check if user does not exist
      this.getUser(user.uid).take(1).subscribe(snapshot => {
        // if user does not exist
        if (snapshot.$value === null)
          this.updateUserProfile(user)
            .then(() => this.setupUserData(user.uid))
            .then(() => this.updateUserPushId(user.uid))
            .then(() => resolve())
            .catch(error => reject(error));
        // if user exists
        else 
          this.updateUserPushId(user.uid)
            .then(() => resolve())
            .catch(error => reject(error));
      })
    })
  }

  // reset password
  resetPassword(email) {
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }
}
