const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const admin = require('firebase-admin');
const Customer = require('./Customer');

admin.initializeApp({
    credential: admin.credential.cert({
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.DATABASE_URL
});

var app = express();
var db = admin.firestore();
var col = db.collection('customers');
var customers = {};
var isDirty = true;

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'static')));

/*****************************************************/

var uids = process.env.UIDS;

var auth = (req, res, next) => {
    let token = req.header("Authorization");
    if (!token) next();
    else {
        admin.auth().verifyIdToken(token, true)
            .then(function (decodedToken) {
                let uid = decodedToken.uid;
                if (uids.includes(uid)) {
                    req.validated = true;
                    next();
                } else {
                    admin.auth().getUser(uid)
                        .then(function (userRecord) {
                            // See the UserRecord reference doc for the contents of userRecord.
                            let user = userRecord.toJSON();
                            if (uids.includes(user.email)) {
                                req.validated = true;
                                next();
                            } else res.send('not authorized...log out and log back in with an admin email');
                        })
                        .catch(function (error) {
                            console.log('Error fetching user data:', error);
                            res.status(500);
                            res.send('server encountered an error');
                        });
                }
            }).catch(function (error) {
                if (error.code == 'auth/id-token-revoked') {
                    // Token has been revoked. Inform the user to reauthenticate or signOut() the user.
                    res.send('Auth token has been revoked. Please log out and back in to generate new auth token');
                } else {
                    // Token is invalid.
                    res.send('not authorized...log out and log back in with an admin email');
                }
            });
    }
};
app.use(auth);

app.get('/', function (req, res) {
    res.redirect('/customers');
});

app.get('/test', (req, res) => {
    res.send("test");
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/customers', (req, res) => {
    if (!req.validated) res.redirect('/login');
    else {
        if (isDirty) {
            col.get()
                .then((snapshot) => {
                    customers = {};
                    snapshot.forEach((doc) => {
                        customers[doc.id] = Customer.buildCustomerFromDoc(doc);
                    });

                    isDirty = true;
                    res.render('index', { customers: customers });
                })
                .catch((err) => {
                    console.log('Error getting documents', err);
                    res.status(404);
                    res.send('Error getting documents');
                });
        } else {
            res.render('index', { customers: customers });
        }
    }
});

app.post('/customers', (req, res) => {
    if (!req.validated) res.redirect('/login');
    else {
        isDirty = true;

        let customer = fillOutCustomerDetails(req.body);
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
            res.send('/'+docRef.id);
        }).catch(err => {
            console.log('Error getting documents', err);
            res.status(404);
            res.send('Error getting documents');
        });
    }
});

app.put('/customers/:id', (req, res) => {
    if (!req.validated) res.redirect('/login');
    else {
        isDirty = true;

        let id = req.params.id;
        let customer = fillOutCustomerDetails(req.body);
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
            res.send('/' + docRef.id);
        }).catch(err => {
            console.log('Error getting documents', err);
            res.send(404);
            res.send('Error getting documents');
        });
    }
});

app.get('/customers/new', (req, res) => {
    if (!req.validated) {
        res.status(401);
        res.redirect("/login");
    } else {
        res.render('new');
    }
});

app.get('/customers/:id', (req, res) => {
    if (!req.validated) res.redirect("/login");
    else {
        let id = req.params.id;
        col.doc(id).get()
            .then(doc => {
                if (!doc.exists) {
                    console.log('No such document!');
                    res.redirect('/customers');
                } else {
                    let customer = Customer.buildCustomerFromDoc(doc);
                    res.render('show', { customer: customer });
                }
            })
            .catch(err => {
                console.log('Error getting document', err);
                res.redirect('/customers');
            });
    }
});


app.get('/customers/:id/edit', (req, res) => {
    if (!req.validated) res.redirect('/login');
    else {
        let id = req.params.id;
        col.doc(id).get()
            .then(doc => {
                if (!doc.exists) {
                    console.log('No such document!');
                    res.status(404);
                    // res.redirect('/customers');
                } else {
                    let customer = Customer.buildCustomerFromDoc(doc);
                    // console.log(customer);
                    res.render('edit', { customer: customer });
                }
            })
            .catch(err => {
                console.log('Error getting document', err);
                res.status(404);
                // res.redirect('/customers');
            });
    }
});

app.delete('/customers/:id', (req, res) => {
    if (!req.validated) res.redirect('/login');
    else {
        isDirty = true;
        let id = req.params.id;

        col.doc(id).delete();
        res.status(200);
        res.send('');
    }
});

/******************************************************************/

var port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("starting server on port " + port + "...");
});

function fillOutCustomerDetails(data) {
    let customer = new Customer();
    customer.contactInfo.firstName = data.customer.firstName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.lastName = data.customer.lastName.replace(/^\w/, c => c.toUpperCase());
    customer.contactInfo.phoneNumber = data.customer.phoneNumber;
    customer.contactInfo.email = data.customer.email;
    customer.notes = data.customer.notes;

    customer.ballLayouts[0].ballName = data.layout.ballName;
    customer.ballLayouts[0].middleForwardPitch = data.layout.middleForwardPitch;
    customer.ballLayouts[0].middleSidePitchL = data.layout.middleSidePitchL;
    customer.ballLayouts[0].middleSidePitchR = data.layout.middleSidePitchR;
    customer.ballLayouts[0].middleReversePitch = data.layout.middleReversePitch;
    customer.ballLayouts[0].middleHoleSize = data.layout.middleHoleSize;
    customer.ballLayouts[0].middleInsertSize = data.layout.middleInsertSize;
    customer.ballLayouts[0].ringForwardPitch = data.layout.ringForwardPitch;
    customer.ballLayouts[0].ringSidePitchL = data.layout.ringSidePitchL;
    customer.ballLayouts[0].ringSidePitchR = data.layout.ringSidePitchR;
    customer.ballLayouts[0].ringReversePitch = data.layout.ringReversePitch;
    customer.ballLayouts[0].ringHoleSize = data.layout.ringHoleSize;
    customer.ballLayouts[0].ringInsertSize = data.layout.ringInsertSize;
    customer.ballLayouts[0].bridgeSpacing = data.layout.bridgeSpacing;
    customer.ballLayouts[0].middleActual = data.layout.middleActual;
    customer.ballLayouts[0].middleCut = data.layout.middleCut;
    customer.ballLayouts[0].ringActual = data.layout.ringActual;
    customer.ballLayouts[0].ringCut = data.layout.ringCut;
    customer.ballLayouts[0].thumbForwardPitch = data.layout.thumbForwardPitch;
    customer.ballLayouts[0].thumbReversePitch = data.layout.thumbReversePitch;
    customer.ballLayouts[0].thumbSidePitchL = data.layout.thumbSidePitchL;
    customer.ballLayouts[0].thumbSidePitchR = data.layout.thumbSidePitchR;
    customer.ballLayouts[0].ovalAngle = data.layout.ovalAngle;

    return customer;
}

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
