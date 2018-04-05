import { Component } from '@angular/core';
import { NavController, LoadingController, NavParams, AlertController } from 'ionic-angular';
import { PlaceService } from '../../services/place-service';
import { Geolocation } from '@ionic-native/geolocation';
import { HomePage } from "../home/home";
import { MapPage } from "../map/map";
import { TripService } from "../../services/trip-service";
import { GET_CURRENT_POSITIONS_OPTIONS } from "../../services/constants";

/*
 Generated class for the PlacesPage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage {
  // all places
  places: any;

  // search keyword
  keyword = '';

  // lat & lon
  lat: number;
  lon: number;

  // loading object
  loading: any;

  // page loaded flag
  pageLoaded = false;

  constructor(
    public nav: NavController,
    public placeService: PlaceService,
    public geolocation: Geolocation,
    public loadingCtrl: LoadingController,
    public navParams: NavParams,
    public tripService: TripService,
    public alertCtrl: AlertController
  ) {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });

    this.geolocation.getCurrentPosition(GET_CURRENT_POSITIONS_OPTIONS).then((resp) => {
      this.lat = resp.coords.latitude;
      this.lon = resp.coords.longitude;
      this.search();
    }).catch((error) => {
      if (error && error.message && error.code) {
        let alert = this.alertCtrl.create({
          message: error.message,
          buttons: ['OK']
        });
        alert.present();
      }
    })
  }

  // show search input
  ionViewDidEnter() {
    this.pageLoaded = true;
  }

  // hide search input
  ionViewWillLeave() {
    this.pageLoaded = false;
  }

  // choose a place
  selectPlace(place) {
    if (this.navParams.get('type') == 'origin') {
      this.tripService.setOrigin(place.name, place.geometry.location.lat, place.geometry.location.lng);
    } else {
      this.tripService.setDestination(place.name, place.geometry.location.lat, place.geometry.location.lng);
    }

    this.nav.setRoot(HomePage);
  }

  // clear search input
  clear() {
    this.keyword = '';
    this.search();
  }

  // search by address
  search() {
    this.showLoading();
    this.placeService.searchByAddress(this.keyword, this.lat, this.lon).subscribe(result => {
      this.hideLoading();
      this.places = result.results;
    });
  }

  // calculate distance from a place to current position
  calcDistance(place) {
    return this.placeService.calcCrow(place.geometry.location.lat, place.geometry.location.lng, this.lat, this.lon).toFixed(1);
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    this.loading.present();
  }

  hideLoading() {
    this.loading.dismiss();
  }

  // open map page
  openMap() {
    this.nav.push(MapPage, {type: this.navParams.get('type')});
  }
}
