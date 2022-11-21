const express = require('express');
const passport = require('passport');
const config = require('./config.js');

const path = require('path');

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy


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
    (token, done) => {
        done(null, {}, token);
    }
));

const app = express();
app.use(express.static(__dirname + "/wwwroot"));
app.use(passport.initialize());

app.get('/hello',
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/',
        session: false
    }),
    (req, res) => {
        console.log('Validated claims: ', req.authInfo);
        // Service relies on the name claim.  
        res.status(200).json({ 'name': req.authInfo['name'] });
        res.sendFile(path.join(__dirname, ' /index.html'));
    }
);
app.post('/index', function(req,res) {
    res.sendFile(path.join(__dirname, '/index.html'));
})
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});