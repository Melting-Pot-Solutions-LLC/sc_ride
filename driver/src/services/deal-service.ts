import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database/database";
import { DEAL_STATUS_ACCEPTED, DEAL_STATUS_PENDING } from "./constants";
import { TripService } from "./trip-service";

@Injectable()
export class DealService {

  constructor(public db: AngularFireDatabase, public tripService: TripService) {

  }

  getDeal(driverId) {
    return this.db.object('deals/' + driverId);
  }

  removeDeal(driverId) {
    return this.db.object('deals/' + driverId).remove();
  }

  removePendingDeal(driverId) {
    return new Promise((resolve, reject) => {
      // check if deal exists
      this.db.object('deals/' + driverId).take(1).subscribe(snapshot => {
        // if deal exists and has a pending status
        if ((snapshot.$value !== null) && (snapshot.status == DEAL_STATUS_PENDING))
        	// remove deal
          this.db.object('deals/' + driverId).remove()
          	.then(() => resolve())
          	.catch(error => reject(error))
        // else
        else resolve();
      })
    })
  }

  // accept a deal
  acceptDeal(driverId, deal) {
    deal.driverId = driverId;

    // create trip from deal
    return this.tripService.createFromDeal(deal).then((trip) => {

      this.tripService.setCurrentTrip(trip.key);
      // set tripId to deal
      return this.db.object('deals/' + driverId).update({
        status: DEAL_STATUS_ACCEPTED,
        tripId: trip.key
      });
    });
  }
}