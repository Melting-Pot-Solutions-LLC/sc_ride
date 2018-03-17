import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisterPage } from '../register/register';
import { LoginPage } from '../login/login';
import { AuthService } from "../../services/auth-service";

@Component({
  selector: 'page-reset-password',
  templateUrl: 'reset-password.html'
})
export class ResetPasswordPage {
  email: any;
  resetPasswordForm: FormGroup;

  constructor(
    public nav: NavController,
    public authService: AuthService,
    public formBuilder: FormBuilder,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
    this.resetPasswordForm = formBuilder.group({
      email: ['', Validators.email]
    });
  }

  signup() {
    this.nav.setRoot(RegisterPage);
  }

  login() {
    this.nav.setRoot(LoginPage);
  }

  resetPassword() {
    let loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loading.present();
    this.authService.resetPassword(this.email).then(() => {
      loading.dismiss();
      this.nav.setRoot(LoginPage);
      let successAlert = this.alertCtrl.create({
        message: 'Your password reset email has been sent successfully.',
        buttons: ['OK']
      });
      successAlert.present();
    }, (error) => {
      loading.dismiss();
      let errorAlert = this.alertCtrl.create({
        message: error.message,
        buttons: ['OK']
      });
      errorAlert.present();
    });
  }
}