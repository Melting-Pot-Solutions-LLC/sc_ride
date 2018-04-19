import { Component } from '@angular/core';
import { NavController, ModalController, AlertController } from 'ionic-angular';
import { DriverService } from '../../services/driver-service';
import { ModalJobPage } from '../modal-job/modal-job';
import { PickUpPage } from "../pick-up/pick-up";
import { DEAL_STATUS_PENDING } from "../../services/constants";
import { DealService } from "../../services/deal-service";
import { UserPage } from "../user/user";
import { AuthService } from "../../services/auth-service";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  driver: any;
  deal: any;
  dealSubscription: any;
  driverSubscription: any;

  constructor(public nav: NavController, public driverService: DriverService, public modalCtrl: ModalController,
              public alertCtrl: AlertController, public dealService: DealService, public authService: AuthService) {

    let firstDriverDataLoading = true;
    // get user info from service
    this.driverSubscription = driverService.getDriver().subscribe(snapshot => {
      this.driver = snapshot;

      // first data loading
      if (firstDriverDataLoading) {
        // if user did not complete registration, redirect to user setting
        if (this.driver.plate && this.driver.type && !this.dealSubscription)
          this.dealService.removePendingDeal(this.driver.$key)
        		.then(() => this.watchDeals())
        		.catch(error => console.log(error));
        else
          this.nav.setRoot(UserPage, {
            user: authService.getUserData()
          });
        firstDriverDataLoading = false;
      }
    })
  }

  ionViewWillLeave() {
    // unsubscribe when leave this page
    if (this.dealSubscription)
      this.dealSubscription.unsubscribe();
    this.driverSubscription.unsubscribe();
  }

  // make array with range is n
  range(n) {
    return new Array(Math.round(n));
  }

  // confirm a job
  confirmJob() {
    let confirm = this.alertCtrl.create({
      title: 'Are you sure?',
      buttons: [
        {
          text: 'No',
          handler: () => {
            console.log('Disagree clicked');
            this.dealService.removeDeal(this.driver.$key);
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.dealService.acceptDeal(this.driver.$key, this.deal).then(() => {
              // go to pickup page
              this.nav.setRoot(PickUpPage);
            });
          }
        }
      ]
    });
    confirm.present();
  }

  // listen to deals
  watchDeals() {
    // listen to deals
    this.dealSubscription = this.dealService.getDeal(this.driver.$key).subscribe(snapshot => {
      this.deal = snapshot;
      if (snapshot.status == DEAL_STATUS_PENDING) {
        // show modal
        let modal = this.modalCtrl.create(ModalJobPage, {
          deal: snapshot
        });

        // listen for modal close
        modal.onDidDismiss(confirm => {
          if (confirm) {
            // show confirm box
            this.confirmJob();
          } else {
            this.dealService.removeDeal(this.driver.$key);
            // do nothing
          }
        });

        modal.present();
      }
    });
  }
}
