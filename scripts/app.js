var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var admin = require('firebase-admin');
// var BallLayout = require('./BallLayout');
var Customer = require('./Customer');
var serviceAccount = process.env.SERVICE_ACCOUNT || require('../service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
var app = express();
var col = db.collection('customers');
var customers = {};
var isDirty = true;

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('static'));

app.get('/', function (req, res) {
    res.redirect('/customers');
});

app.get('/test', (req, res) => {
    let idToken = req.header('Authorization');
    console.log('token - ' + idToken);
    if (!idToken) {
        res.redirect('/login');
    } else {
        admin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                let uid = decodedToken.uid;
                admin.auth().getUser(uid)
                    .then(function (userRecord) {
                        // See the UserRecord reference doc for the contents of userRecord.
                        let user = userRecord.toJSON();
                        console.log('Successfully fetched user data:', user);
                        res.send('<h1>LOGGED IN! ' + user.email + '</h1>');
                    })
                    .catch(function (error) {
                        console.log('Error fetching user data:', error);
                        res.redirect('/login');
                    });
                // ...
            }).catch(function (error) {
                // Handle error
                res.redirect('/login');
            });
    }

    // console.log(req.header('authorization'));
    // res.render('test');
});

app.get('/customers', function (req, res) {
    if (isDirty) {
        col.get()
            .then((snapshot) => {
                customers = {};
                snapshot.forEach((doc) => {
                    customers[doc.id] = Customer.buildCustomerFromDoc(doc);
                });

                isDirty = false;
                res.render('index', { customers: customers });
            })
            .catch((err) => {
                console.log('Error getting documents', err);

                res.send('error');
            });
    } else {
        res.render('index', { customers: customers });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/customers', function (req, res) {
    isDirty = true;

    let customer = new Customer();
    customer.contactInfo.firstName = req.body.customer.firstName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.lastName = req.body.customer.lastName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.phoneNumber = req.body.customer.phoneNumber;
    customer.contactInfo.email = req.body.customer.email;
    customer.notes = req.body.customer.notes;

    customer.ballLayouts[0].ballName = req.body.layout.ballName;
    customer.ballLayouts[0].middleForwardPitch = req.body.layout.middleForwardPitch;
    customer.ballLayouts[0].middleSidePitchL = req.body.layout.middleSidePitchL;
    customer.ballLayouts[0].middleSidePitchR = req.body.layout.middleSidePitchR;
    customer.ballLayouts[0].middleReversePitch = req.body.layout.middleReversePitch;
    customer.ballLayouts[0].middleHoleSize = req.body.layout.middleHoleSize;
    customer.ballLayouts[0].middleInsertSize = req.body.layout.middleInsertSize;
    customer.ballLayouts[0].ringForwardPitch = req.body.layout.ringForwardPitch;
    customer.ballLayouts[0].ringSidePitchL = req.body.layout.ringSidePitchL;
    customer.ballLayouts[0].ringSidePitchR = req.body.layout.ringSidePitchR;
    customer.ballLayouts[0].ringReversePitch = req.body.layout.ringReversePitch;
    customer.ballLayouts[0].ringHoleSize = req.body.layout.ringHoleSize;
    customer.ballLayouts[0].ringInsertSize = req.body.layout.ringInsertSize;
    customer.ballLayouts[0].bridgeSpacing = req.body.layout.bridgeSpacing;
    customer.ballLayouts[0].middleActual = req.body.layout.middleActual;
    customer.ballLayouts[0].middleCut = req.body.layout.middleCut;
    customer.ballLayouts[0].ringActual = req.body.layout.ringActual;
    customer.ballLayouts[0].ringCut = req.body.layout.ringCut;
    customer.ballLayouts[0].thumbForwardPitch = req.body.layout.thumbForwardPitch;
    customer.ballLayouts[0].thumbReversePitch = req.body.layout.thumbReversePitch;
    customer.ballLayouts[0].thumbSidePitchL = req.body.layout.thumbSidePitchL;
    customer.ballLayouts[0].thumbSidePitchR = req.body.layout.thumbSidePitchR;
    customer.ballLayouts[0].ovalAngle = req.body.layout.ovalAngle;

    let contactInfo = JSON.stringify(customer.contactInfo);
    let layouts = JSON.stringify(customer.ballLayouts);
    let docRef = col.doc();

    docRef.set({
        id: docRef.id,
        contactInfo: contactInfo,
        layouts: layouts,
        notes: customer.notes
    }).then(ref => {
        console.log('Created customer with id - ' + docRef.id);
        // res.send('200 - OK');
        res.redirect('/customers/' + docRef.id);
    }).catch(err => {
        console.log('Error getting documents', err);
        res.send('420 - Error getting documents'); //no idea what code i should return so using 300 for now
    });
});

app.put('/customers/:id', function (req, res) {
    isDirty = true;

    let id = req.params.id;
    let customer = new Customer();
    customer.contactInfo.firstName = req.body.customer.firstName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.lastName = req.body.customer.lastName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.phoneNumber = req.body.customer.phoneNumber;
    customer.contactInfo.email = req.body.customer.email;
    customer.notes = req.body.customer.notes;

    customer.ballLayouts[0].ballName = req.body.layout.ballName;
    customer.ballLayouts[0].middleForwardPitch = req.body.layout.middleForwardPitch;
    customer.ballLayouts[0].middleSidePitchL = req.body.layout.middleSidePitchL;
    customer.ballLayouts[0].middleSidePitchR = req.body.layout.middleSidePitchR;
    customer.ballLayouts[0].middleReversePitch = req.body.layout.middleReversePitch;
    customer.ballLayouts[0].middleHoleSize = req.body.layout.middleHoleSize;
    customer.ballLayouts[0].middleInsertSize = req.body.layout.middleInsertSize;
    customer.ballLayouts[0].ringForwardPitch = req.body.layout.ringForwardPitch;
    customer.ballLayouts[0].ringSidePitchL = req.body.layout.ringSidePitchL;
    customer.ballLayouts[0].ringSidePitchR = req.body.layout.ringSidePitchR;
    customer.ballLayouts[0].ringReversePitch = req.body.layout.ringReversePitch;
    customer.ballLayouts[0].ringHoleSize = req.body.layout.ringHoleSize;
    customer.ballLayouts[0].ringInsertSize = req.body.layout.ringInsertSize;
    customer.ballLayouts[0].bridgeSpacing = req.body.layout.bridgeSpacing;
    customer.ballLayouts[0].middleActual = req.body.layout.middleActual;
    customer.ballLayouts[0].middleCut = req.body.layout.middleCut;
    customer.ballLayouts[0].ringActual = req.body.layout.ringActual;
    customer.ballLayouts[0].ringCut = req.body.layout.ringCut;
    customer.ballLayouts[0].thumbForwardPitch = req.body.layout.thumbForwardPitch;
    customer.ballLayouts[0].thumbReversePitch = req.body.layout.thumbReversePitch;
    customer.ballLayouts[0].thumbSidePitchL = req.body.layout.thumbSidePitchL;
    customer.ballLayouts[0].thumbSidePitchR = req.body.layout.thumbSidePitchR;
    customer.ballLayouts[0].ovalAngle = req.body.layout.ovalAngle;

    let contactInfo = JSON.stringify(customer.contactInfo);
    let layouts = JSON.stringify(customer.ballLayouts);
    let docRef = col.doc(id);
    docRef.set({
        id: docRef.id,
        contactInfo: contactInfo,
        layouts: layouts,
        notes: customer.notes
    }).then(ref => {
        console.log('Edited customer with id - ' + docRef.id);
        // res.send('200 - OK');
        res.redirect('/customers/' + docRef.id);
    }).catch(err => {
        console.log('Error getting documents', err);
        res.send('420 - Error getting documents'); //no idea what code i should return so using 300 for now
    });
});

app.get('/customers/new', function (req, res) {
    res.render('new');
});

app.get('/customers/:id', function (req, res) {
    let id = req.params.id;

    col.doc(id).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                res.redirect('/customers');
            } else {
                let customer = Customer.buildCustomerFromDoc(doc);
                // console.log(customer);
                res.render('show', { customer: customer });
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.redirect('/customers');
        });

    // res.render('show', { customer: customer });
});

app.get('/customers/:id/edit', function (req, res) {
    // res.send('edit page');
    let id = req.params.id;

    col.doc(id).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
                res.redirect('/customers');
            } else {
                let customer = Customer.buildCustomerFromDoc(doc);
                // console.log(customer);
                res.render('edit', { customer: customer });
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.redirect('/customers');
        });
});

app.delete('/customers/:id', function (req, res) {
    isDirty = true;
    let id = req.params.id;
    col.doc(id).delete();
    res.redirect('/customers');
});

/******************************************************************/

var port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log("starting server on port " + port + "...");
});

// function populateCustomers() {
//     db.collection('customers').get()
//         .then((snapshot) => {
//             customers = [];
//             snapshot.forEach((doc) => {
//                 let data = doc.data();
//                 let customer = new Customer();
//                 let contactInfo = JSON.parse(data.contactInfo);
//                 let ballLayouts = JSON.parse(data.layouts);

//                 customer.id = doc.id;
//                 customer.contactInfo = contactInfo;
//                 customer.ballLayouts = ballLayouts;
//                 customers[doc.id] = customer;
//             });
//         })
//         .catch((err) => {
//             console.log('Error getting documents', err);
//         });
// }




//______________________________//______________________________

//get token on web
// firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
//     // Send token to your backend via HTTPS
//     // ...
// }).catch(function (error) {
//     // Handle error
// });

//verify toker on server
// idToken comes from the client app
// admin.auth().verifyIdToken(idToken)
//     .then(function (decodedToken) {
//         let uid = decodedToken.uid;
//         // ...
//     }).catch(function (error) {
//         // Handle error
//     });


// Verify the ID token while checking if the token is revoked by passing
// checkRevoked true.
// let checkRevoked = true;
// admin.auth().verifyIdToken(idToken, checkRevoked)
//     .then(payload => {
//         // Token is valid.
//     })
//     .catch(error => {
//         if (error.code == 'auth/id-token-revoked') {
//             // Token has been revoked. Inform the user to reauthenticate or signOut() the user.
//         } else {
//             // Token is invalid.
//         }
//     });
