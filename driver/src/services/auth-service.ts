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

        // update driver object
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
            this.db.object('drivers/' + user.uid).update({
              name: name,
              photoURL: photoUrl,
              email: user.email,
              phoneNumber: user.phoneNumber ? user.phoneNumber : '',
              plate: user.plate ? user.plate : '',
              brand: user.brand ? user.brand : '',
              type: user.type ? user.type : '',
              pushId: ids.userId,
              balance: 10,
              rating: 4,
              refCode: user.uid.substring(1, 4)
            }).then(() => {
              resolve();
            }, (error) => {
              reject(error);
            })
          }, (error) => {
            reject(error);
          })
        else
          this.db.object('drivers/' + user.uid).update({
            name: name,
            photoURL: photoUrl,
            email: user.email,
            phoneNumber: user.phoneNumber ? user.phoneNumber : '',
            plate: user.plate ? user.plate : '',
            brand: user.brand ? user.brand : '',
            type: user.type ? user.type : '',
            balance: 10,
            rating: 4,
            refCode: user.uid.substring(1, 4)
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
              this.db.object('drivers/' + user.uid).update({
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

  // reset password
  resetPassword(email) {
    return this.afAuth.auth.sendPasswordResetEmail(email);
  }
}
