const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require("stripe")(
    "sk_test_sT84dbsVo3VcNIpuSfB4sRV8" // update your secret key here
);
const https = require('https');

const TRIP_STATUS_GOING = 'going';
const TRIP_STATUS_FINISHED = 'finished';
const PAYMENT_METHOD_CARD = 'card';
const DRIVER_ONESIGNAL_API_KEY = 'MzRlODRhMTctMTczYy00MWZlLWEzNDAtMDg4NjJhMmU5MDIz';
const DRIVER_ONESIGNAL_APP_ID = '3483a9d4-bbd7-45de-99d7-7f2d1f40a8aa';
const PASSENGER_ONESIGNAL_API_KEY = 'OTI4MTgxNjMtMjVlNS00N2M5LTgwNzMtYzRmNzRmOTgyNTgw';
const PASSENGER_ONESIGNAL_APP_ID = 'ddcf8041-d46b-4345-81c7-57f492799e9c';


// send push notification
function sendNotification(restApiKey, appId, title, text, ids, additionalData) {
  return new Promise((resolve, reject) => {
    var headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'Basic ' + restApiKey
    };
    
    var options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: headers
    };

    var data = {
      app_id: appId,
      ios_badgeType: 'Increase',
      ios_badgeCount : 1,
      content_available: true,
      headings: {
        'en': title
      },
      contents: {
        'en': text
      }
    };

    if (additionalData)
      data['data'] = additionalData;

    if (ids) {
      if (Array.isArray(ids))
        data['include_player_ids'] = ids
      else
        data['include_player_ids'] = [ids];
    }
    else
      data['included_segments'] = ['All'];
    
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        data = JSON.parse(data);
        if (data.errors)
          reject(data.errors)
        else
          resolve(data);
      })
    });
    
    req.on('error', function(error) {
      reject(error);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  })
};


// init app
admin.initializeApp(functions.config().firebase);


// calculate driver's rating
exports.calculateRating = functions.database.ref('/trips/{tripId}').onWrite(event => {
  // Exit when the data is deleted.
  if (!event.data.exists()) {
    return false;
  }

  // Grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // validate data
  if (!original.rating) {
    return false;
  }

  return admin.database().ref('/trips').orderByChild('driverId').equalTo(original.driverId).once('value').then(function(snap) {
    var stars = 0;
    var count = 0;

    snap.forEach(function (trip) {
      if (trip.val().rating) {
        stars += parseInt(trip.val().rating);
        count++
      }
    });

    // calculate avg
    var rating = stars / count;
    return admin.database().ref('/drivers/' + original.driverId).update({
      rating: rating.toFixed(1)
    })
  })
});

// calculate driver report
exports.makeReport = functions.database.ref('/trips/{tripId}').onWrite(event => {
  // Exit when the data is deleted.
  if (!event.data.exists()) {
    return false;
  }

  // Grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // get old status
  const oldStatus = event.data.child('status').previous.val();

  if ((original.status == TRIP_STATUS_FINISHED) && (oldStatus == TRIP_STATUS_GOING)) {
    var date = new Date();
    var fee = parseFloat(original.fee);

    // total
    var totalPath = 'reports/' + original.driverId;
    // by year
    var yearPath = totalPath + '/' + date.getFullYear();
    // by month
    var monthPath = yearPath + '/' + (date.getMonth() + 1);
    // by date
    var datePath = monthPath + '/' + date.getDate();

    return Promise.all([
      admin.database().ref(totalPath + '/total').once('value'),
      admin.database().ref(yearPath + '/total').once('value'),
      admin.database().ref(monthPath + '/total').once('value'),
      admin.database().ref(datePath + '/total').once('value')
    ])
    .then(results => {
      return results.map(result => {
        return result.val() ? parseFloat(result.val()) : 0;
      })
    })
    .then(results => {
      return Promise.all([
        admin.database().ref(totalPath + '/total').set(results[0] + fee),
        admin.database().ref(yearPath + '/total').set(results[1] + fee),
        admin.database().ref(monthPath + '/total').set(results[2] + fee),
        admin.database().ref(datePath + '/total').set(results[3] + fee)
      ])
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        // check payment method
        if (original.paymentMethod == PAYMENT_METHOD_CARD) {
          // check format currency
          if (original.currency == '$') {
            return admin.database().ref('passengers/' + original.passengerId).once('value')
              .then(snapshot => {
                var passengerVal = snapshot.val();
                // if customerId is already created
                if (passengerVal.card && passengerVal.card.customerId)
                  return passengerVal.card.customerId;
                // if customerId is not created
                else if (passengerVal.card && passengerVal.card.token) {
                  // create customer
                  return stripe.customers.create({
                    email: passengerVal.email,
                    source: passengerVal.card.token,
                  })
                  .then(customer => {
                    var customerIdPath = 'passengers/' + original.passengerId + '/card/customerId';
                    // save customer id for next payments
                    return admin.database().ref(customerIdPath).set(customer.id).then(() => {
                      return customer.id;
                    });
                  })
                  .catch(error => reject(error));
                }
                else reject('card token not found');
              })
              .then(customerId => {
                const currency = 'usd';
                var amount = Math.round(fee * 100);
                // create payment
                return stripe.charges.create({
                  amount: amount,
                  currency: currency,
                  customer: customerId,
                  description: "Charge for tripId: " + event.params.tripId
                }, {
                  idempotency_key: event.params.tripId
                })
              })
              .then(charge => {
                console.log('successful charge: ', charge);
                var driverBalancePath = 'drivers/' + original.driverId + '/balance';
                // - 30 cents - 2.9% - 20%
                var driverFee = (fee - 0.3) * 0.8 / 1.029;
                admin.database().ref(driverBalancePath).once('value')
                  .then(snapshot => snapshot.val() ? parseFloat(snapshot.val()) : 0)
                  // update driver balance
                  .then(snapshotVal => admin.database().ref(driverBalancePath).set(snapshotVal + driverFee))
                  // get passenger's pushId
                  .then(() => admin.database().ref('passengers/' + original.passengerId + '/pushId').once('value'))
                  .then(pushId => {
                    pushId = pushId.val();
                    if (pushId)
                      // send push notification
                      return sendNotification(
                        PASSENGER_ONESIGNAL_API_KEY,
                        PASSENGER_ONESIGNAL_APP_ID,
                        'Successfull payment', 
                        'Thank you! Your payment $' + fee +' was processed successfully.', 
                        pushId
                      ).then(function(success) {
                        console.log('successful sendNotification: ', success);
                        resolve();
                      }, function(error) {
                        reject(error);
                      })
                    else reject('push id not found');
                  })
                  .catch(error => reject(error))
              })
              .catch(error => reject(error));
          }
          else reject('currency ' + original.currency + ' is not supported');
        }
        else reject('incorrect payment method');
      })
    })
    .then(() => {
      return true;
    })
    .catch(error => {
      console.log('makeReport error: ', error);
      return false;
    })
  }
  else return false;
});

// send push notification after user sends message
exports.sendChatPushNotification = functions.database.ref('/chats/{chatId}/messages/{messageId}').onCreate(event => {
  // grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // get user id and send push notification
  var senderPath,
      receiverPath,
      restApiKey,
      appId,
      notificationParams = {},
      userIds = event.params.chatId.split('_'); 
  if (original.fromPassenger) {
    senderPath = 'passengers/' + userIds[0] + '/name';
    receiverPath = 'drivers/' + userIds[1] + '/pushId';
    notificationParams['passengerId'] = userIds[0];
    restApiKey = DRIVER_ONESIGNAL_API_KEY;
    appId = DRIVER_ONESIGNAL_APP_ID;
  }
  else {
    senderPath = 'drivers/' + userIds[1] + '/name';
    receiverPath = 'passengers/' + userIds[0] + '/pushId';
    notificationParams['driverId'] = userIds[1];
    restApiKey = PASSENGER_ONESIGNAL_API_KEY;
    appId = PASSENGER_ONESIGNAL_APP_ID;
  };
  return Promise.all([
    admin.database().ref(senderPath).once('value'),
    admin.database().ref(receiverPath).once('value')
  ]).then(function(results) {
    var senderName = results[0].val();
    var pushId = results[1].val();
    if (senderName && pushId)
      return sendNotification(
        restApiKey,
        appId,
        'New message',
        senderName + ': ' + original.text,
        pushId, {
          type: 'chat',
          params: notificationParams
        }
      ).then(function(success) {
        console.log('successful sendChatPushNotification: ', success);
        return true;
      }, function(error) {
        console.log('sendChatPushNotification error: ', error);
        return false;
      })
    else return false;
  }, function(error) {
    console.log('sendChatPushNotification error: ', error);
    return false;
  })
});