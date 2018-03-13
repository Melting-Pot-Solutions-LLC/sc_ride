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

  // get passenger by id
  getUser(id) {
    return this.db.object('passengers/' + id);
  }

  // login by email and password
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

  logout() {
    const user = this.getUserData();
    this.db.object('passengers/' + user.uid + '/pushId').remove();
    return this.afAuth.auth.signOut();
  }

  // register new account
  register(email, password, name) {
    return Observable.create(observer => {
      this.afAuth.auth.createUserWithEmailAndPassword(email, password).then((authData: any) => {
        authData.name = name;

        // update passenger object
        this.updateUserProfile(authData).then(() => {
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

  // update user display name and photo
  updateUserProfile(user) {
    return new Promise((resolve, reject) => {
      let name = user.name ? user.name : user.email;
      let photoUrl = user.photoURL ? user.photoURL : DEFAULT_AVATAR;

      this.getUserData().updateProfile({
        displayName: name,
        photoURL: photoUrl
      }).then(() => {
        if (this.platform.is('cordova'))
          this.oneSignal.getIds().then((ids) => {
            this.db.object('passengers/' + user.uid).update({
              name: name,
              photoURL: photoUrl,
              email: user.email,
              phoneNumber: user.phoneNumber ? user.phoneNumber : '',
              pushId: ids.userId
            }).then(() => {
              resolve();
            }, (error) => {
              reject(error);
            })
          }, (error) => {
            reject(error);
          })
        else
          this.db.object('passengers/' + user.uid).update({
            name: name,
            photoURL: photoUrl,
            email: user.email,
            phoneNumber: user.phoneNumber ? user.phoneNumber : ''
          }).then(() => {
            resolve();
          }, (error) => {
            reject(error);
          })
      }, (error) => {
        reject(error);
      })
    })
  }

  // create new user if not exist
  createUserIfNotExist(user) {
    return new Promise((resolve, reject) => {
      // check if user does not exist
      this.getUser(user.uid).take(1).subscribe(snapshot => {
        if (snapshot.$value === null)
          // update passenger object
          this.updateUserProfile(user).then(() => {
            resolve();
          }, (error) => {
            reject(error);
          })
        else {
          if (this.platform.is('cordova')) {
            // update push id
            this.oneSignal.getIds().then((ids) => {
              this.db.object('passengers/' + user.uid).update({
                pushId: ids.userId
              }).then(() => {
                resolve();
              }, (error) => {
                reject(error);
              })
            }, (error) => {
              reject(error);
            })
          }
          else resolve();
        }
      })
    })
  }

  // update card setting
  updateCardSetting(number, exp, cvv, token) {
    const user = this.getUserData();
    this.db.object('passengers/' + user.uid + '/card').set({
      number: number,
      exp: exp,
      cvv: cvv,
      token: token
    })
  }

  // get card setting
  getCardSetting() {
    const user = this.getUserData();
    return this.db.object('passengers/' + user.uid + '/card');
  }
}
