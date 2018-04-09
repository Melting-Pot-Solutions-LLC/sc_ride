import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import moment from 'moment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/mergeMap';
import { STATUSES } from "./constants";

@Injectable()
export class DriverService {

  constructor(public db: AngularFireDatabase) {

  }

  // get driver by id
  getDriver(id) {
    return this.db.object('drivers/' + id);
  }

  // get all drivers
  getDrivers() {
    return this.db.list('drivers/');
  }

  // update driver's status
  updateDriverStatus(driverId, status) {
    return this.db.object('drivers/' + driverId).update({
      status: status
    })
  }

  // get driver's statistics
  getDriverStatistics(driverId) {
    return this.db.list('trips/', {
      query: {
        orderByChild: 'driverId',
        equalTo: driverId
      }
    }).map(trips => {
      return trips.map(trip => {
        return {
          day: (moment(moment().startOf('day')).isBefore(trip.createdAt)) ? 1 : 0,
          week: (moment(moment().startOf('week')).isBefore(trip.createdAt)) ? 1 : 0,
          month: (moment(moment().startOf('month')).isBefore(trip.createdAt)) ? 1 : 0
        }
      }).reduce((acc, x) => {
        return {
          day: acc.day + x.day,
          week: acc.week + x.week,
          month: acc.month + x.month
        }
      }, {
        day: 0,
        week: 0,
        month: 0
      })
    })
  }

  // get driver position
  getDriverPosition(locality, vehicleType, id) {
    return this.db.object('localities/' + locality + '/' + vehicleType + '/' + id);
  }

  getActiveDriver(locality, vehicleType) {
    return this.db.list('localities/' + locality + '/' + vehicleType).mergeMap(localitiesDrivers => {
      if (localitiesDrivers.length)
        return Observable.zip(
          ...localitiesDrivers.map(localitiesDriver => {
            return this.getDriver(localitiesDriver.$key).map(driver => {
              if (driver.status == STATUSES[1])
                return localitiesDriver;
              else return null; 
            })
          })
        ).map(activeDrivers => activeDrivers.filter(el => el != null))
      else return Observable.of([]);
    })
  }

  // calculate vehicle angle
  calcAngle(oldLat, oldLng, lat, lng) {
    let brng = Math.atan2(lat - oldLat, lng - oldLng);
    brng = brng * (180 / Math.PI);

    return brng;
  }

  // return icon suffix by angle
  getIconWithAngle(vehicle) {
    let angle = this.calcAngle(vehicle.oldLat, vehicle.oldLng, vehicle.lat, vehicle.lng);

    if (angle >= -180 && angle <= -160) {
      return '_left';
    }

    if (angle > -160 && angle <= -110) {
      return '_bottom_left';
    }

    if (angle > -110 && angle <= -70) {
      return '_bottom';
    }

    if (angle > -70 && angle <= -20) {
      return '_bottom_right';
    }

    if (angle >= -20 && angle <= 20) {
      return '_right';
    }

    if (angle > 20 && angle <= 70) {
      return '_top_right';
    }

    if (angle > 70 && angle <= 110) {
      return '_top';
    }

    if (angle > 110 && angle <= 160) {
      return '_top_left';
    }

    if (angle > 160 && angle <= 180) {
      return '_left';
    }
  }
}