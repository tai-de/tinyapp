const cookieSession = require('cookie-session');
const express = require("express");
const methodOverride = require('method-override');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const {
  generateRandomString,
  userLookup,
  urlsForUser,
  getAllUrls,
  checkUniqueHits,
  updateUrlDatabase
} = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(cookieSession({
  name: 'session',
  keys: ['bulbasaur', 'bulbasaur']
}));

const appName = "TinyApp";

//
// DATABASES
//

const users = {
  "x12b": {
    id: "x12b",
    email: "user@example.com",
    username: "Example 1",
    password: "$2a$10$EYcB7T6tt.io9IgF8gCQhOzlsNUEQdkWycSuiQ3evCrAPKAlVU5Ne",
    theme: 'dark',
  },
  "81v3": {
    id: "81v3",
    email: "user2@example.com",
    username: "Example 2",
    password: "$2a$10$Ot2RG54I9TxlHrt0eAcZeOEUllm.v2hEnBRPbFsCzQf0OBhXWa4Oa",
    theme: 'danger',
  },
};

const urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    private: 'true',
    userId: "x12b",
    username: "Example #1",
    created: new Date(Date.parse('2022-11-27T21:40:51.059Z')),
    updated: new Date(Date.parse('2022-11-29T08:10:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    private: 'false',
    userId: "x12b",
    username: "Example #1",
    created: new Date(Date.parse('2022-11-25T22:44:51.059Z')),
    updated: new Date(Date.parse('2022-11-28T20:01:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
  "8va2xM": {
    longUrl: "http://www.youtube.com",
    private: 'false',
    userId: "x12b",
    username: "Example #1",
    created: '',
    updated: '',
    hits: 0,
    uniqueHits: [],
  },
  "b6UTxQ": {
    longUrl: "https://www.tsn.ca",
    private: 'false',
    userId: "81v3",
    username: "Example #2",
    created: new Date(Date.parse('2022-11-26T23:56:51.059Z')),
    updated: new Date(Date.parse('2022-11-27T13:24:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
};

//
// GET ROUTING FOR ROOT REDIRECT, LOGIN/REGISTER, AND PROFILE PAGES
//

app.get("/", (req, res) => {
  const userId = req.session['user_id'];

  // Check if userId stored in session exists/is logged in

  if (userId) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});

app.get("/register", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { username, userEmail, userTheme, appName };

  // Check if userId stored in session exists/is logged in

  if (userId && userLookup(users, userId, 'id')) {
    return res.redirect('/urls');
  }

  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { username, userEmail, userTheme, appName };

  // Check if userId stored in session exists/is logged in

  if (userId && userLookup(users, userId, 'id')) {
    return res.redirect('/urls');
  }

  res.render("login", templateVars);
});

app.get("/profile", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { username, userEmail, userTheme, appName };

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  res.render("profile", templateVars);

});

//
// GET ROUTING FOR ALL URLS AND MY URLS PAGES
//

app.get("/urls/all", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { urls: getAllUrls(urlDatabase, userId), username, userEmail, userTheme, appName };

  res.render("urls_all", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { urls: urlsForUser(urlDatabase, userId), username, userEmail, userTheme, appName };

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  res.render("urls_index", templateVars);
});

//
// GET ROUTING FOR CREATING NEW SHORTURL
//

app.get("/urls/new", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const templateVars = { username, userEmail, userTheme, appName };

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  res.render("urls_new", templateVars);
});

//
// GET ROUTING FOR VIEWING SHORTURL STATS / EDIT PAGE
//

app.get(["/urls/:id", "/urls/:id/edit"], (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const shortUrl = req.params.id;
  const userUrls = urlsForUser(urlDatabase, userId);
  const editStatus = req.path.indexOf("/edit") > -1;

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the shortUrl exists and if the user is the owner

  if (urlDatabase[shortUrl] && userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! This URL does not belong to you so the details are restricted.', cta: { url: `../u/${shortUrl}`, display: 'Click here to visit the URL.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Redirect to create new shortUrl if the requested one does not exist & user is logged in

  if (!urlDatabase[shortUrl] && (userId && userLookup(users, userId, 'id'))) {
    res.redirect('/urls/new');
  }

  // Redirect to login if requested shortUrl does not exist & user does not exist

  if (!urlDatabase[shortUrl] && (!userId || !userLookup(users, userId, 'id'))) {
    res.redirect('/login');
  }

  const templateVars = {
    id: shortUrl,
    urlObj: userUrls[shortUrl],
    edit: editStatus,
    username,
    userEmail,
    appName
  };
  res.render("urls_show", templateVars);
});

//
// GET ROUTING FOR U/SHORTURL REDIRECT TO LONGURL
//

app.get("/u/:id", (req, res) => {
  const date = new Date();
  const shortUrl = req.params.id;
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  let visitorId = req.session['visitor_id'];

  // Check if the user already has a visitorId created (used for stats)

  if (!visitorId) {
    visitorId = '#' + generateRandomString(4, users);
    req.session['visitor_id'] = visitorId;
  }

  // Check if the shortUrl exists

  if (!urlDatabase[shortUrl]) {
    const errorVars = { username, userEmail, userTheme, code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("error_page", errorVars);
  }

  const longUrl = urlDatabase[shortUrl].longUrl;

  // Check if the uniqueHits array for the shortUrl already includes this visitor (using checkUniqueHits helper)

  if (!checkUniqueHits(urlDatabase[shortUrl], visitorId)) {
    const uniqueHit = { visitor: visitorId, date };
    urlDatabase[shortUrl].uniqueHits.push(uniqueHit);
  }

  urlDatabase[shortUrl].hits += 1;

  res.redirect(longUrl);
});

//
// GET ROUTING FOR 404
//

app.get("*", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const errorVars = { username, userEmail, userTheme, code: 404, message: 'Page not found.', appName };
  return res.status(404).render("error_page", errorVars);
});

//
// POST ROUTING FOR CREATING NEW SHORTURL
//

app.post("/urls", (req, res) => {
  const date = new Date();
  const userId = req.session['user_id'];

  // Prevent unregistered/logged out users from creating shortUrl

  if (!userId || !userLookup(users, userId, 'id')) {
    return res.redirect('/login');
  }

  const shortUrl = generateRandomString(6, urlDatabase);
  const username = userLookup(users, userId, 'id', 'username');
  const longUrl = req.body["longURL"];
  const private = req.body["private"];

  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longUrl = longUrl;
  urlDatabase[shortUrl].private = private;
  urlDatabase[shortUrl].userId = userId;
  urlDatabase[shortUrl].username = username;
  urlDatabase[shortUrl].created = date;
  urlDatabase[shortUrl].updated = '';
  urlDatabase[shortUrl].hits = 0;
  urlDatabase[shortUrl].uniqueHits = [];
  res.redirect(`/urls/${shortUrl}`);
});

//
// POST (PUT) ROUTING FOR UPDATING EXISTING SHORTURL
//

app.put("/urls/:id", (req, res) => {
  const date = new Date();
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const shortUrl = req.params.id;
  const longUrl = req.body["longURL"];
  const makePrivate = req.body["private"];

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the shortUrl being edited exists

  if (!urlDatabase[shortUrl]) {
    const errorVars = { username, userEmail, userTheme, code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("error_page", errorVars);
  }

  // Check if the shortUrl belongs to the user attempting an edit

  if (userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! This URL does not belong to you so you cannot edit or delete it.', appName };
    return res.status(401).render("error_page", errorVars);
  }

  urlDatabase[shortUrl].longUrl = longUrl;
  urlDatabase[shortUrl].updated = date;
  urlDatabase[shortUrl].private = makePrivate;

  res.redirect(`/urls`);
});

//
// POST (PUT) ROUTING FOR UPDATING EXISTING SHORTURL OWNER
//

app.put("/urls/:id/reassign", (req, res) => {
  const date = new Date();
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const shortUrl = req.params.id;
  const newOwnerUsername = req.body["newOwner"];

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the shortUrl being edited exists

  if (!urlDatabase[shortUrl]) {
    const errorVars = { username, userEmail, userTheme, code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("error_page", errorVars);
  }

  // Check if the shortUrl belongs to the user attempting an edit

  if (userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! This URL does not belong to you so you cannot edit or delete it.', appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the new owner username is the same as current owner

  if (username === newOwnerUsername) {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entry. This URL already belongs to you.', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the new owner username is valid

  if (!userLookup(users, newOwnerUsername, 'username')) {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entry. The requested username for reassignment does not exist.', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  const newOwnerId = userLookup(users, newOwnerUsername, 'username', 'id');

  urlDatabase[shortUrl].updated = date;
  urlDatabase[shortUrl].userId = newOwnerId;
  urlDatabase[shortUrl].username = newOwnerUsername;

  res.redirect(`/urls`);
});

//
// POST (DELETE) ROUTING FOR DELETING EXISTING SHORTURL
//

app.delete("/urls/:id", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const shortUrl = req.params.id;

  // Check if userId stored in session exists/is logged in

  if (!userId || !userLookup(users, userId, 'id')) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("error_page", errorVars);
  }

  // Check if the shortUrl being deleted exists

  if (!urlDatabase[shortUrl]) {
    const errorVars = { username, userEmail, userTheme, code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("error_page", errorVars);
  }

  // Check if the shortUrl belongs to the user requesting deletion

  if (userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { username, userEmail, userTheme, code: 401, message: 'Unauthorized! This URL does not belong to you so you cannot edit or delete it.', appName };
    return res.status(401).render("error_page", errorVars);
  }

  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
});

//
// POST ROUTING FOR REGISTERING NEW USER
//

app.post("/register", (req, res) => {
  const date = [new Date()];
  const userId = generateRandomString(4, users);
  const userEmail = req.body["email"].toLowerCase();
  const userUsername = req.body["username"];
  const userPassword = req.body["password"];
  const hashedPassword = bcrypt.hashSync(userPassword, 10);

  console.log('new registration attempt from:', userEmail);

  // Check if any submitted fields were empty

  if (userEmail === '' || userUsername === '' || userPassword === '') {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entries: Enter all fields!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(400).render("error_page", errorVars);
  }

  // Check if email address has already registered (using userLookup helper)

  if (userLookup(users, userEmail)) {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entry: Email address in use!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(400).render("error_page", errorVars);
  }

  // Check if username has already been selected by another user (using userLookup helper)

  if (userLookup(users, userUsername, 'username')) {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entry: Username in use!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(400).render("error_page", errorVars);
  }

  users[userId] = { id: userId, email: userEmail, username: userUsername, password: hashedPassword };
  console.log(`new user: [${userId}], email: ${userEmail}, username: ${userUsername}`);
  users[userId]._logins = [date];

  req.session['user_id'] = userId;
  res.redirect(`/urls`);
});

//
// POST ROUTING FOR LOGGING IN
//

app.post("/login", (req, res) => {
  const date = [new Date()];
  const loginEmail = req.body["email"].toLowerCase();
  const loginPass = req.body["password"];
  const userEmail = userLookup(users, loginEmail, 'email');
  const userId = userLookup(users, loginEmail, 'email', 'id');
  const userPass = userLookup(users, loginEmail, 'email', 'password');
  const passCheck = bcrypt.compareSync(loginPass, userPass);

  console.log('new login attempt from:', userId, loginEmail);

  // Check if user email exists (using userLookup helper)

  if (!userEmail) {
    const errorVars = { username, userEmail, userTheme, code: 403, message: 'Invalid entry: Email address does not exist!', cta: { url: '/login', display: 'Click here to try again.' }, appName };
    return res.status(403).render("error_page", errorVars);
  }

  // Check if password matches (truthy stored in variable from bcrypt.compareSync)

  if (!passCheck) {
    const errorVars = { username, userEmail, userTheme, code: 403, message: 'Invalid entry: Password is incorrect!', cta: { url: '/login', display: 'Click here to try again.' }, appName };
    return res.status(403).render("error_page", errorVars);
  }

  console.log('successful login from:', userId, loginEmail);
  users[userId]._logins ? users[userId]._logins.push(date) : users[userId]._logins = [date];
  console.log('login history:', users[userId]._logins);

  req.session['user_id'] = userId;
  res.redirect(`/urls`);
});

//
// POST (PUT) ROUTING FOR UPDATING PROFILE
//

app.put("/profile", (req, res) => {
  const userId = req.session['user_id'];
  const username = users[userId] ? users[userId].username : null;
  const userEmail = users[userId] ? users[userId].email : null;
  const userTheme = users[userId] ? users[userId].theme : null;
  const updateUsername = req.body["username"];
  const updateTheme = req.body["colorPref"];

  if (username !== updateUsername && userLookup(users, updateUsername, 'username')) {
    const errorVars = { username, userEmail, userTheme, code: 400, message: 'Invalid entry: Username in use!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(400).render("error_page", errorVars);
  }

  users[userId].username = updateUsername;

  if (updateTheme !== '') {
    users[userId].theme = updateTheme;
  }

  updateUrlDatabase(urlDatabase, users, userId, userId);

  res.redirect(`/profile`);
});

//
// POST ROUTING FOR LOGGING OUT
//

app.post("/logout", (req, res) => {
  const userId = req.session['user_id'];
  console.log('user logged out:', userId);
  res.clearCookie('session');
  res.redirect(`/login`);
});

//
// SERVER LISTENING
//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
