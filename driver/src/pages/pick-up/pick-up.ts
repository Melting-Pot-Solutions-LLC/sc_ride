import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { DropOffPage } from '../drop-off/drop-off';
import { TripService } from "../../services/trip-service";
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
/*
 Generated class for the PickUpPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-pick-up',
  templateUrl: 'pick-up.html'
})
export class PickUpPage {
  // trip info
  trip: any;
  passenger: any;

  constructor(
    public nav: NavController,
    public tripService: TripService,
    private launchNavigator: LaunchNavigator,
    public alertCtrl: AlertController
  ) {
    this.trip = tripService.getCurrentTrip();
    tripService.getPassenger(this.trip.passengerId).take(1).subscribe(snapshot => {
      this.passenger = snapshot;
    })
  }

  // pickup
  pickup() {
    this.tripService.pickUp(this.trip.$key);
    this.nav.setRoot(DropOffPage);
  }

  // open Google Maps
  openGoogleMaps() {
    this.launchNavigator.isAppAvailable(this.launchNavigator.APP.GOOGLE_MAPS)
      .then(isAvailable => {
        if (isAvailable) {
          let options: LaunchNavigatorOptions = {
            app: this.launchNavigator.APP.GOOGLE_MAPS,
            start: [
              this.trip.origin.location.lat,
              this.trip.origin.location.lng
            ],
            startName: this.trip.origin.vicinity,
            destinationName: this.trip.destination.vicinity
          };
          this.launchNavigator.navigate([
            this.trip.destination.location.lat,
            this.trip.destination.location.lng
          ], options)
            .then(() => {})
            .catch(error => console.log(error));
        }
        else {
          let alert = this.alertCtrl.create({
            message: 'Google Maps not available',
            buttons: ['OK']
          });
          alert.present();
        }
      })
      .catch(error => console.log(error));
  }
}
