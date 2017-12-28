
GENERAL OVERVIEW:
The mobile application should serve like Uber for the city of Florence, SC. It should look and act similar to Uber but simplified and will have some additional features.

TENTATIVE SCHEDULE
By December, 12 (weeks 1, 2): design a logo, start the design work and front end development
DONE, client loved the design, especially the logo design.


By December, 26 (weeks 3, 4): finish front end development (all the screens will be ready but not functional), login/signup with the email address, login/signup with Facebook, users’ profiles
- firebase login and sign up 
- drivers and customers profiles: users (customers and drivers) will fill out forms with personal info: name, age, occupation, phone number etc.
- login and sign up with facebook profile (possibly use this phonegap plugin: https://ionicframework.com/docs/native/facebook/)
- place real google maps on all necessary screens
- implement geolocation (no location tracking in the background  though)

<p style="color: green;"><b>DONE:</b></p>
By January, 9 (weeks 5, 6): implement geolocation and google maps
- should be already implemented before


By January, 23 (weeks 7, 8): implement immediate messaging and feedback system
- immediate messaging should be implemented via Firebase
- feedback system should be done with the following angular plugin: 

By February, 6 (weeks 9, 10): introduce push notifications, and payments
- find out as much as possible about push notifications. What is the easiest way to implement them?  Do I need a developer account to implement them? As of now, customers should be notified that they driver wants to take them for a ride, and drivers should only be notified only when ...
- customers should be able to register their debit/credit cards, it should be saved in the database, and after that they need to be able to pay to the platform (not to the driver) using Stripe.
- drivers do not have to pay anything top anyone


By February, 20 (weeks 11, 12): taking uploading pictures to the customers profiles and chat, real-time driver’s tracking
- use camera plugin (https://ionicframework.com/docs/native/camera/)
- need to sue background geolocation plugin which already should be in the code


By February, 27 (week 13): testing on the real iOS and Android phones, submission to AppStore and Google Play Store
- check out if everything works on Android, fix the possible bugs associated with the Android platform
- 
