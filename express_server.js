const cookieParser = require('cookie-parser');
const express = require("express");
const morgan = require('morgan');

const app = express();
const PORT = 8080; // default port 8080


app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

const appName = "TinyApp";

const users = {
  "x12b": {
    id: "x12b",
    email: "user@example.com",
    username: "user1",
    password: "purple-monkey-dinosaur",
  },
  "81v3": {
    id: "81v3",
    email: "user2@example.com",
    username: "user2",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    private: true,
    userId: "x12b",
    created: new Date(Date.parse('2022-11-27T21:40:51.059Z')),
    updated: new Date(Date.parse('2022-11-29T08:10:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    private: false,
    userId: "x12b",
    created: new Date(Date.parse('2022-11-25T22:44:51.059Z')),
    updated: new Date(Date.parse('2022-11-28T20:01:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
  "8va2xM": {
    longUrl: "http://www.youtube.com",
    private: false,
    userId: "x12b",
    created: '',
    updated: '',
    hits: 0,
    uniqueHits: [],
  },
  "b6UTxQ": {
    longUrl: "https://www.tsn.ca",
    private: false,
    userId: "81v3",
    created: new Date(Date.parse('2022-11-26T23:56:51.059Z')),
    updated: new Date(Date.parse('2022-11-27T13:24:51.059Z')),
    hits: 0,
    uniqueHits: [],
  },
};

const generateRandomString = function(length) {
  const existingKeys = Object.keys(urlDatabase);
  let newKey = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1, length + 1);
  if (existingKeys.includes(newKey)) {
    newKey = generateRandomString();
  }
  return newKey;
};

// user lookup
// given a value to search for and an optional key (default is email)
// will return the value of the third parameter if user is found (or the same value if not passed)
const userLookup = function(value, key = 'email', target = 'email') {
  for (const user in users) {
    if (users[user][key] === value) {
      return users[user][target];
    }
  }
  return false;
};

// returns urls filtered by userId
const urlsForUser = function(userId) {
  const filteredUrlDb = {};
  for (const key in urlDatabase) {
    const urlObj = urlDatabase[key];
    const urlOwner = urlDatabase[key].userId;
    if (urlOwner === userId) {
      filteredUrlDb[key] = urlObj;
    }
  }
  return filteredUrlDb;
};

// returns all public urls + the user's private ones
const getAllUrls = function(userId) {
  const filteredUrlDb = {};
  for (const key in urlDatabase) {
    const urlObj = urlDatabase[key];
    const urlOwner = urlDatabase[key].userId;
    if (urlOwner === userId) {
      filteredUrlDb[key] = urlObj;
      continue;
    } else if (!urlObj.private) {
      filteredUrlDb[key] = urlObj;
    }
  }
  return filteredUrlDb;
};

//
// ROUTES FOR GET REQ
//

app.get("/", (req, res) => {
  const userId = req.cookies['user_id'];

  if (userId) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});

app.get("/register", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { user: users[req.cookies['user_id']], appName };

  if (userId) {
    return res.redirect('/urls');
  }

  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']], appName };
  const userId = req.cookies['user_id'];

  if (userId) {
    return res.redirect('/urls');
  }

  res.render("urls_login", templateVars);
});

app.get("/urls/all", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { urls: getAllUrls(userId), user: users[userId], appName };

  res.render("urls_all", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { urls: urlsForUser(userId), user: users[userId], appName };

  if (!userId) {
    const errorVars = { code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = { user: users[userId], appName };

  if (!userId) {
    const errorVars = { code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  res.render("urls_new", templateVars);
});

app.get(["/urls/:id", "/urls/:id/edit"], (req, res) => {
  const userId = req.cookies['user_id'];
  const shortUrl = req.params.id;
  const userUrls = urlsForUser(userId);
  const editStatus = req.path.indexOf("/edit") > -1;

  if (!userId) {
    const errorVars = { code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  if (urlDatabase[shortUrl] && userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { user: users[req.cookies['user_id']], code: 401, message: 'Unauthorized! This URL does not belong to you so the details are restricted.', cta: { url: `../u/${shortUrl}`, display: 'Click here to visit the URL.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  if (!urlDatabase[shortUrl] && userId) {
    res.redirect('/urls/new');
  }
  if (!urlDatabase[shortUrl] && !userId) {
    res.redirect('/login');
  }

  const templateVars = {
    id: shortUrl,
    urlObj: userUrls[shortUrl],
    user: users[req.cookies['user_id']],
    edit: editStatus,
    appName
  };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

// redirect from /u/id to long url
app.get("/u/:id", (req, res) => {
  const shortUrl = req.params.id;
  const userId = req.cookies['user_id'];

  if (!urlDatabase[shortUrl]) {
    const errorVars = { user: users[req.cookies['user_id']], code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("urls_error", errorVars);
  }

  const longUrl = urlDatabase[shortUrl].longUrl;

  if (!urlDatabase[shortUrl].uniqueHits.includes(userId)) {
    urlDatabase[shortUrl].uniqueHits.push(userId);
  }

  urlDatabase[shortUrl].hits += 1;
  res.redirect(longUrl);
});

// 404/catch-all
app.get("*", (req, res) => {
  // res.redirect('/urls');
  const errorVars = { user: users[req.cookies['user_id']], code: 404, message: 'Page not found.', appName };
  return res.status(404).render("urls_error", errorVars);
});

//
// ROUTES FOR POST REQ
//

// add new url
app.post("/urls", (req, res) => {
  const date = new Date();
  const userId = req.cookies['user_id'];

  if (!userId) {
    return res.redirect('/login');
  }

  const shortUrl = generateRandomString(6);
  const longUrl = req.body["longURL"];
  const private = req.body["private"];
  urlDatabase[shortUrl] = {};
  urlDatabase[shortUrl].longUrl = longUrl;
  urlDatabase[shortUrl].private = private;
  urlDatabase[shortUrl].userId = userId;
  urlDatabase[shortUrl].created = date;
  urlDatabase[shortUrl].updated = '';
  urlDatabase[shortUrl].hits = 0;
  urlDatabase[shortUrl].uniqueHits = [];
  res.redirect(`/urls/${shortUrl}`);
});

// update existing url
app.post("/urls/:id", (req, res) => {
  const date = new Date();
  const userId = req.cookies['user_id'];
  const shortUrl = req.params.id;
  const longUrl = req.body["longURL"];

  if (!userId) {
    const errorVars = { code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  if (!urlDatabase[shortUrl]) {
    const errorVars = { user: users[req.cookies['user_id']], code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("urls_error", errorVars);
  }

  if (userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { user: users[req.cookies['user_id']], code: 401, message: 'Unauthorized! This URL does not belong to you so you cannot edit or delete it.', appName };
    return res.status(401).render("urls_error", errorVars);
  }

  urlDatabase[shortUrl].longUrl = longUrl;
  urlDatabase[shortUrl].updated = date;
  res.redirect(`/urls`);
});

// delete existing url
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies['user_id'];
  const shortUrl = req.params.id;

  if (!userId) {
    const errorVars = { code: 401, message: 'Unauthorized! Please login first.', cta: { url: '/login', display: 'Click here to login.' }, appName };
    return res.status(401).render("urls_error", errorVars);
  }

  if (!urlDatabase[shortUrl]) {
    const errorVars = { user: users[req.cookies['user_id']], code: 404, message: 'Not found! This short URL does not exist.', appName };
    return res.status(404).render("urls_error", errorVars);
  }

  if (userId !== urlDatabase[shortUrl].userId) {
    const errorVars = { user: users[req.cookies['user_id']], code: 401, message: 'Unauthorized! This URL does not belong to you so you cannot edit or delete it.', appName };
    return res.status(401).render("urls_error", errorVars);
  }

  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
});

// register
app.post("/register", (req, res) => {
  const date = [new Date()];
  const userId = generateRandomString(4);
  const userEmail = req.body["email"].toLowerCase();
  const userUsername = req.body["username"];
  const userPassword = req.body["password"];

  console.log('new registration attempt from:', userEmail);

  if (userEmail === '' || userUsername === '' || userPassword === '') {
    const errorVars = { code: 400, message: 'Invalid entries: Enter all fields!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.', appName } };
    return res.status(400).render("urls_error", errorVars);
  }
  if (userLookup(userEmail)) {
    const errorVars = { code: 400, message: 'Invalid entry: Email address in use!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.', appName } };
    return res.status(400).render("urls_error", errorVars);
  }
  if (userLookup(userUsername, 'username')) {
    const errorVars = { code: 400, message: 'Invalid entry: Username in use!', cta: { url: 'javascript:history.back()', display: 'Click here to try again.' }, appName };
    return res.status(400).render("urls_error", errorVars);
  }

  users[userId] = { id: userId, email: userEmail, username: userUsername, password: userPassword };
  console.log(`new user: [${userId}], email: ${userEmail}, username: ${userUsername}, password: ${userPassword}`);
  users[userId]._logins = [date];

  res.cookie('user_id', userId);
  res.redirect(`/urls`);
});

// login
app.post("/login", (req, res) => {
  const date = [new Date()];
  const loginEmail = req.body["email"].toLowerCase();
  const loginPass = req.body["password"];
  const userEmail = userLookup(loginEmail, 'email');
  const userId = userLookup(loginEmail, 'email', 'id');
  const userPass = userLookup(loginEmail, 'email', 'password');

  console.log('new login attempt from:', userId, loginEmail);

  if (!userEmail) {
    const errorVars = { code: 403, message: 'Invalid entry: Email address does not exist!', cta: { url: '/login', display: 'Click here to try again.' }, appName };
    return res.status(403).render("urls_error", errorVars);
  }
  if (loginPass !== userPass) {
    const errorVars = { code: 403, message: 'Invalid entry: Password is incorrect!', cta: { url: '/login', display: 'Click here to try again.' }, appName };
    return res.status(403).render("urls_error", errorVars);
  }

  console.log('successful login from:', userId, loginEmail);
  users[userId]._logins ? users[userId]._logins.push(date) : users[userId]._logins = [date];
  console.log('login history:', users[userId]._logins);

  res.cookie('user_id', userId);
  res.redirect(`/urls`);
});

// logout
app.post("/logout", (req, res) => {
  const userId = req.cookies['user_id'];
  console.log('user logged out:', users[userId].email);
  res.clearCookie('user_id');
  res.redirect(`/login`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
