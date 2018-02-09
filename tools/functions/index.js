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
    
    req.on('error', function(err) {
      reject(err);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  })
};

// init app
admin.initializeApp(functions.config().firebase);

// calculate driver's rating
exports.calculateRating = functions.database.ref('/trips/{tripId}').onWrite(function (event) {
  // Exit when the data is deleted.
  if (!event.data.exists()) {
    return;
  }

  // Grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // validate data
  if (!original.rating) {
    return;
  }

  admin.database().ref('/trips').orderByChild('driverId').equalTo(original.driverId).once('value', function (snap) {
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
    admin.database().ref('/drivers/' + original.driverId).update({
      rating: rating.toFixed(1)
    });
  });
});

// calculate driver report
exports.makeReport = functions.database.ref('/trips/{tripId}').onWrite(function (event) {
  // Exit when the data is deleted.
  if (!event.data.exists()) {
    return;
  }

  // Grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // get old status
  const oldStatus = event.data.child('status').previous.val();

  if ((original.status == TRIP_STATUS_FINISHED) && (oldStatus == TRIP_STATUS_GOING)) {
    var date = new Date();
    var fee = parseFloat(original.fee);

    // total sale
    admin.database().ref('reports/' + original.driverId + '/total').once('value').then(function (snapshot) {
      var snapshotVal = snapshot.val() ? parseFloat(snapshot.val()) : 0;
      admin.database().ref('reports/' + original.driverId + '/total').set(parseFloat(snapshotVal) + fee);
    });

    // by year
    var yearPath = 'reports/' + original.driverId + '/' + date.getFullYear();
    admin.database().ref(yearPath + '/total').once('value').then(function (snapshot) {
      var snapshotVal = snapshot.val() ? parseFloat(snapshot.val()) : 0;
      admin.database().ref(yearPath + '/total').set(parseFloat(snapshotVal) + fee);
    });

    // by month
    var monthPath = yearPath + '/' + (date.getMonth() + 1);
    admin.database().ref(monthPath + '/total').once('value').then(function (snapshot) {
      var snapshotVal = snapshot.val() ? parseFloat(snapshot.val()) : 0;
      admin.database().ref(monthPath + '/total').set(parseFloat(snapshotVal) + fee);
    });

    // by date
    var datePath = monthPath + '/' + date.getDate();
    admin.database().ref(datePath + '/total').once('value').then(function (snapshot) {
      var snapshotVal = snapshot.val() ? parseFloat(snapshot.val()) : 0;
      admin.database().ref(datePath + '/total').set(parseFloat(snapshotVal) + fee);
    });

    // process payment
    if (original.paymentMethod == PAYMENT_METHOD_CARD) {
      // update driver balance
      admin.database().ref('drivers/' + original.driverId + '/balance').once('value').then(function (snapshot) {
        var snapshotVal = snapshot.val() ? parseFloat(snapshot.val()) : 0;
        admin.database().ref('drivers/' + original.driverId + '/balance').set(parseFloat(snapshotVal) + fee);
      });

      // format currency
      if (original.currency == '$') {
        const currency = 'usd';
        var amount = Math.round(fee * 100);
        admin.database().ref('passengers/' + original.passengerId).once('value').then(function(snapshot) {
          var passengerVal = snapshot.val();
          if (passengerVal.card && passengerVal.card.customerId) {
            stripe.charges.create({
              amount: amount,
              currency: currency,
              customer: passengerVal.card.customerId,
              description: "Charge for tripId: " + event.params.tripId
            }, {
              idempotency_key: event.params.tripId
            }, function (err, charge) {
              if (err)
                console.log(err);
              else {
                console.log(charge);
                if (passengerVal.pushId)
                  sendNotification(
                    PASSENGER_ONESIGNAL_API_KEY,
                    PASSENGER_ONESIGNAL_APP_ID,
                    'Successfull payment', 
                    'Thank you! Your payment $' + fee +' was processed successfully.', 
                    passengerVal.pushId
                  ).then(function(success) {
                    console.log('successful sendNotification: ', success);
                  }, function(err) {
                    console.log('error sendNotification: ', err);
                  })
              }
            })
          }
          else if (passengerVal.card && passengerVal.card.token) {
            stripe.customers.create({
              email: passengerVal.email,
              source: passengerVal.card.token,
            }).then(function(customer) {
              admin.database().ref('passengers/' + original.passengerId + '/card/customerId').set(customer.id);
              stripe.charges.create({
                amount: amount,
                currency: currency,
                customer: customer.id,
                description: "Charge for tripId: " + event.params.tripId
              }, {
                idempotency_key: event.params.tripId
              }, function (err, charge) {
                if (err)
                  console.log(err);
                else {
                  console.log(charge);
                  if (passengerVal.pushId)
                    sendNotification(
                      PASSENGER_ONESIGNAL_API_KEY,
                      PASSENGER_ONESIGNAL_APP_ID,
                      'Successfull payment', 
                      'Thank you! Your payment $' + fee +' was processed successfully.', 
                      passengerVal.pushId
                    ).then(function(success) {
                      console.log('successful sendNotification: ', success);
                    }, function(err) {
                      console.log('error sendNotification: ', err);
                    })
                }
              })
            })
          }
        })
      } else {
        console.log('Currency ' + original.currency + ' is not supported');
      }
    }
  }
});

// send push notification after user sends message
exports.sendChatPushNotification = functions.database.ref('/chats/{chatId}/messages/{messageId}').onCreate(function(event) {
  // grab the current value of what was written to the Realtime Database
  const original = event.data.val();

  // get user id and send push notification
  var receiverFirebaseId,
      senderFirebaseId,
      receiverNodeName,
      senderNodeName,
      restApiKey,
      appId,
      notificationParams = {},
      userIds = event.params.chatId.split('_'); 
  if (original.fromPassenger) {
    receiverFirebaseId = userIds[1];
    senderFirebaseId = userIds[0];
    receiverNodeName = 'drivers';
    senderNodeName = 'passengers';
    notificationParams['passengerId'] = userIds[0];
    restApiKey = DRIVER_ONESIGNAL_API_KEY;
    appId = DRIVER_ONESIGNAL_APP_ID;
  }
  else {
    receiverFirebaseId = userIds[0];
    senderFirebaseId = userIds[1];
    receiverNodeName = 'passengers';
    senderNodeName = 'drivers';
    notificationParams['driverId'] = userIds[1];
    restApiKey = PASSENGER_ONESIGNAL_API_KEY;
    appId = PASSENGER_ONESIGNAL_APP_ID;
  };
  return admin.database().ref(senderNodeName + '/' + senderFirebaseId + '/name').once('value').then(function(senderSnapshot) {
    var senderName = senderSnapshot.val();
    if (senderName == null)
      return
    else return admin.database().ref(receiverNodeName + '/' + receiverFirebaseId + '/pushId').once('value').then(function(receiverSnapshot) {
      var pushId = receiverSnapshot.val();
      if (pushId == null)
        return
      else
        return sendNotification(restApiKey, appId, 'New message', senderName + ': ' + original.text, pushId, {
          type: 'chat',
          params: notificationParams
        }).then(function(success) {
          console.log('successful sendNotification: ', success);
        }, function(err) {
          console.log('error sendNotification: ', err);
        })
    })
  })
});