const express = require('express');
const morgan = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
const path = require('path');
const cors = require('cors');
// create application/json parser
var jsonParser = bodyParser.json()
const passport = require('passport');
const config = require('./config.js');

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy
const sqltest = require('./sql-cosmos/get_config_load_graph.js');
const sql_func = require('./sql-cosmos/sql_func.js');
const cosmos_func = require('./sql-cosmos/cosmos_func.js');
//set up functions to recieve data from Cosmos DB
passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
  },
    function (iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
            return done(new Error("No oid found"), null);
        }
        // asynchronous verification, for effect...
        process.nextTick(function () {
            findByOid(profile.oid, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    // "Auto-registration"
                    users.push(profile);
                    return done(null, profile);
                }
                return done(null, user);
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.oid);
});

passport.deserializeUser(function (oid, done) {
    findByOid(oid, function (err, user) {
        done(err, user);
    });
});

// array to hold logged in users
var users = [];

var findByOid = function (oid, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        log.info('we are using user: ', user);
        if (user.oid === oid) {
            return fn(null, user);
        }
    }
    return fn(null, null);
};

const app = express();
app.use(methodOverride());
app.use(cookieParser());
app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));


app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.use(passport.initialize());
app.use(passport.session());


const port = process.env.PORT || 8080;

let database = '';
let server = '';
let configs;

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
};

app.use(express.static(__dirname + "/wwwroot"));
// sendFile will go here
app.use(express.json());
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
})
app.post('/login', function (req, res) {
    res.sendFile(path.join(__dirname, '/login.html'))
})
app.post('/load', function (req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,                      // required
            resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
            failureRedirect: '/'
        })(req, res, next);
    }, function (req, res) {
        database = req.body.database;
        server = req.body.server;
        configs = req.body.configs;
        res.sendFile(path.join(__dirname, '/wwwroot/graph.html'));
});
app.post('/database', function (req, res) {
    res.send(JSON.stringify({ database: database, server: server, configs: configs }));
});
app.get('/load_configs', function (req, result) {
    var data = sql_func.get_configs();
    data.then(res => {
        result.send(res);
    })
})
app.post('/insert_sql', function (req, res) {
    let body = req.body;
    let server = body.server;
    let database = body.database;
    let username = body.username;
    let password = body.password;
    sql_func.insert_sql(server, database, username, password);
    res.send(JSON.stringify({ server: server, database: database, username: username, password: password}))
});

app.post('/remove_sql', function (req, res) {
    let body = req.body;
    let database = body.database;
    let server = body.server;
    sql_func.remove_config(database);
    cosmos_func.remove_cosmos(database, server);
    res.send(JSON.stringify({ database: database, server: server }));
});
app.post('/remove_cosmos', function (req, res) {
    let body = req.body;
    let database = body.database;
    cosmos_func.remove_cosmos(database);
    res.send(JSON.stringify({ database: database}));
});

app.post('/sqltest', jsonParser, function (request, result, next) {
        var data = sqltest.load_data(request.body.name);
        data.then(res => {
                result.send(res);
            }).catch(res => result.send(res));    
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
  









