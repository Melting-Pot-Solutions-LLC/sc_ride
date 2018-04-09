import { Component } from '@angular/core';
import { NavController, ItemSliding, PopoverController } from 'ionic-angular';
import { DriverService } from '../../services/driver-service';
import * as _ from 'lodash';
import { DriverStatisticsPage } from '../../pages/driver-statistics/driver-statistics';
import { STATUSES } from "../../services/constants";

@Component({
  selector: 'page-admin-panel',
  templateUrl: 'admin-panel.html',
})
export class AdminPanelPage {

  drivers: Array<any>;
  loadedDrivers: Array<any>;
  getDriversSubscription: any;
  statuses = STATUSES;

  constructor(
    public nav: NavController,
    public driverService: DriverService,
    public popoverCtrl: PopoverController
  ) {
    this.getDriversSubscription = this.driverService.getDrivers().subscribe(snapshot => {
      this.loadedDrivers = _.sortBy(snapshot, num => num.status);
      this.initializeItems();
    })
  }

  ionViewWillLeave() {
    this.getDriversSubscription.unsubscribe();
  }

  initializeItems() {
    this.drivers = this.loadedDrivers;
  }

  getItems(ev: any) {
    this.initializeItems();
    let val = ev.target.value;
    if (val && val.trim() != '') {
      this.drivers = this.drivers.filter((driver) => {
        return (driver.name.toLowerCase().indexOf(val.toLowerCase()) > -1) ||
          (driver.plate.toLowerCase().indexOf(val.toLowerCase()) > -1) ||
          (driver.brand.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  authorizeDriver(slidingItem: ItemSliding, driverId) {
  	this.driverService.updateDriverStatus(driverId, this.statuses[1])
  		.then(() => slidingItem.close())
  		.catch(error => console.log(error));
  }

  declineDriver(slidingItem: ItemSliding, driverId) {
  	this.driverService.updateDriverStatus(driverId, this.statuses[2])
  		.then(() => slidingItem.close())
  		.catch(error => console.log(error));
  }

  acceptDriver(slidingItem: ItemSliding, driverId) {
  	this.driverService.updateDriverStatus(driverId, this.statuses[1])
  		.then(() => slidingItem.close())
  		.catch(error => console.log(error));
  }

  openStatistics(driverId) {
		let popover = this.popoverCtrl.create(DriverStatisticsPage, {
			driverId: driverId
		});
    popover.present();
  }
}
