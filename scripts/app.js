var path = require('path');
var fs = require('fs');
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var admin = require('firebase-admin');
var serviceAccount = require('../mikes-pro-shop-firebase-adminsdk-9uc5w-83e548c4f4.json');
var BallLayout = require('./BallLayout');
var Person = require('./Person');

var certOptions = {
    key: fs.readFileSync(path.resolve('server.key')),
    cert: fs.readFileSync(path.resolve('server.crt'))
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
var app = express();
var col = db.collection('people');
var people = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('static'));

app.get('/', function (req, res) {
    // res.send('hello world');
    res.render('index', {people: people});
});

app.get('/people', function (req, res) {
    db.collection('people').get()
        .then((snapshot) => {
            people = [];
            snapshot.forEach((doc) => {
                // console.log(doc.id, '=>', doc.data());
                let data = doc.data();
                let person = new Person();
                let contactInfo = JSON.parse(data.contactInfo);
                let ballLayouts = JSON.parse(data.layouts);
                person.id = doc.id;
                person.contactInfo = contactInfo;
                person.ballLayouts = ballLayouts;
                people.push(person);
            });

            res.render('index', { people: people });
        })
        .catch((err) => {
            console.log('Error getting documents', err);
        });
    
    // res.send('people will go here');
});

app.post('/people', function (req, res) {
    let person = new Person();
    let contactInfo = JSON.stringify(person.contactInfo);
    let layouts = JSON.stringify(person.ballLayouts);
    let docRef = col.doc();

    docRef.set({
        id: docRef.id,
        contactInfo: contactInfo,
        layouts: layouts,
        notes: person.notes
    }).then(ref => {
        console.log("Created user with id - " + docRef.id);
        res.send('200 - OK');
    }).catch(err => {
        console.log('Error getting documents', err);
        res.send('300 - Error getting documents'); //no idea what code i should return so using 300 for now
    });

});

app.get('/people/:id', function (req, res) {
    if (people.length > 0) {
        console.log(people[0]);
    }
    res.send("" + people.length);
});

/******************************************************************/

var useHttps = false;
if (process.argv.length > 2) {
    for (var i = 2; i < process.argv.length; i++) {
        if (process.argv[i].toLowerCase() === "https") {
            useHttps = true;
        }
    }
}

if (useHttps) {
    https.createServer(certOptions, app).listen(4443, () =>
    {
        console.log("starting server on port 4443...");
    });
} else {
    app.listen(3000, function () {
        console.log("starting server on port 3000..."); 
    });
}