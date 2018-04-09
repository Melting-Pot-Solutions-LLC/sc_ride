import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { DriverService } from '../../services/driver-service';

@Component({
  selector: 'page-driver-statistics',
  templateUrl: 'driver-statistics.html',
})
export class DriverStatisticsPage {

  driverId: string;
	stats: any;
	getDriverStatisticsSubscription: any;

  constructor(
    public driverService: DriverService,
    public navParams: NavParams
  ) {
    this.driverId = navParams.get('driverId');
    this.getDriverStatisticsSubscription = this.driverService.getDriverStatistics(this.driverId).subscribe(snapshot => {
      this.stats = snapshot;
    })
  }

  ionViewWillLeave() {
    this.getDriverStatisticsSubscription.unsubscribe();
  }
}
