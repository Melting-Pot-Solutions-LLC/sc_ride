import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { DriverPage } from '../driver/driver';
import { TripService } from "../../services/trip-service";
import { DealService } from "../../services/deal-service";
import { HomePage } from "../home/home";
import { DEAL_STATUS_PENDING, DEAL_STATUS_ACCEPTED, DEAL_TIMEOUT } from "../../services/constants";

/*
 Generated class for the FindingPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-finding',
  templateUrl: 'finding.html'
})
export class FindingPage {
  drivers: any;
  removeDealTimeout: any;
  selectedIndex: number;

  constructor(
  	public nav: NavController,
  	public tripService: TripService,
  	public dealService: DealService,
  	public alertCtrl: AlertController
  ) {
    // get list available drivers
    this.drivers = this.tripService.getAvailableDrivers();
    // sort by driver distance and rating
    this.drivers = this.dealService.sortDriversList(this.drivers);
  }

  // make deal to driver
  makeDeal(index) {
  	this.selectedIndex = index;
    let driver = this.drivers[index];
    let dealAccepted = false;

    if (driver) {
      driver.status = 'Bidding';
      this.dealService.getDriverDeal(driver.$key).take(1).subscribe(snapshot => {
        // if user is available
        if (snapshot.$value === null) {
          // create a record
          console.log(snapshot);
          this.dealService.makeDeal(
              driver.$key,
              this.tripService.getOrigin(),
              this.tripService.getDestination(),
              this.tripService.getDistance(),
              this.tripService.getFee(),
              this.tripService.getCurrency(),
              this.tripService.getNote(),
              this.tripService.getPaymentMethod(),
          ).then(() => {
            // timeout to remove a deal 
            this.removeDealTimeout = setTimeout(() => {
              if (!dealAccepted) {
                sub.unsubscribe();
                // remove record
                this.dealService.removeDeal(driver.$key);
                // make deal to other user
                this.nextDriver(index);
                this.showOkAlert('Your trip request has not been accepted by ' + driver.name);
              }
            }, DEAL_TIMEOUT + 3000);

            let sub = this.dealService.getDriverDeal(driver.$key).subscribe(snap => {
              // if record doesn't exist or is accepted
              if (snap.$value === null || snap.status != DEAL_STATUS_PENDING) {
                sub.unsubscribe();

	            	// clear timeout
	            	clearTimeout(this.removeDealTimeout);

                // if deal has been cancelled
                if (snap.$value === null) {
                  this.nextDriver(index);
                  this.showOkAlert('Your trip request has not been accepted by ' + driver.name);
                } else if (snap.status == DEAL_STATUS_ACCEPTED) {
                  // if deal is accepted
                  console.log('accepted', snap.tripId);
                  dealAccepted = true;
                  this.drivers = [];
                  this.tripService.setId(snap.tripId);
                  // go to user page
                  this.nav.setRoot(DriverPage);
                }
              }
            })
          });
        } else {
          this.nextDriver(index);
        }
      });
    } else {
      // show error & try again button
      console.log('No user found');
    }
  }

  // make deal to next driver
  nextDriver(index) {
    this.drivers.splice(index, 1);
    this.selectedIndex = null;
  }

  goBack() {
    this.nav.setRoot(HomePage);
  }

  showOkAlert(text) {
    let alert = this.alertCtrl.create({
      message: text,
      buttons: ['OK']
    });
    alert.present();
  }
}
