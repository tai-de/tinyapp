const cookieParser = require('cookie-parser');

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    username: "user1",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    username: "user2",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function(length) {
  const existingKeys = Object.keys(urlDatabase);
  let newKey = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1, length + 1);
  if (existingKeys.includes(newKey)) {
    newKey = generateRandomString();
  }
  return newKey;
};

// user lookup, given a value to search for and an optional key (default is email)
// will return true if user is found
const userLookup = function(value, key = 'email') {
  for (const user in users) {
    if (users[user][key] === value) {
      return true;
    }
  }
  return false;
};

//
// ROUTES FOR GET REQ
//

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_register", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id/u", (req, res) => {
  const templateVars = { urls: urlDatabase, updatedUrl: req.params.id, user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id/n", (req, res) => {
  const templateVars = { urls: urlDatabase, newUrl: req.params.id, user: users[req.cookies['user_id']] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies['user_id']] };
  res.render("urls_show", templateVars);
});

// redirect from /u/id to long url
app.get("/u/:id", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = urlDatabase[shortUrl];
  res.redirect(longUrl);
});

// 404/catch-all
app.get("*", (req, res) => {
  res.redirect('/urls');
});

//
// ROUTES FOR POST REQ
//

// add new url
app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString(6);
  const longUrl = req.body["longURL"];
  urlDatabase[shortUrl] = longUrl;
  res.redirect(`/urls/${shortUrl}/n`);
});

// update existing url
app.post("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = req.body["longURL"];
  urlDatabase[shortUrl] = longUrl;
  res.redirect(`/urls/${shortUrl}/u`);
});

// delete existing url
app.post("/urls/:id/delete", (req, res) => {
  const shortUrl = req.params.id;
  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
});

// register
app.post("/register", (req, res) => {
  const userId = generateRandomString(3);
  const userEmail = req.body["email"];
  const userUsername = req.body["username"];
  const userPassword = req.body["password"];

  if (userEmail === '' || userUsername === '' || userPassword === '') {
    return res.status(400).send('Error 400 - Invalid entries: Enter all fields!');
  }
  if (userLookup(userEmail)) {
    return res.status(400).send('Error 400 - Invalid entry: Email address in use!');
  }
  users[userId] = { id: userId, email: userEmail, username: userUsername, password: userPassword };
  console.log(`new user: [${userId}], email: ${userEmail}, username: ${userUsername}, password: ${userPassword}`);
  res.cookie('user_id', userId);
  res.redirect(`/urls`);
});

// login
app.post("/login", (req, res) => {
  console.log('new username:', req.body["username"]);
  res.cookie('username', req.body["username"]);
  res.redirect(`/urls`);
});

// logout
app.post("/logout", (req, res) => {
  console.log('username deleted:', req.cookies['username']);
  res.clearCookie('username');
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
