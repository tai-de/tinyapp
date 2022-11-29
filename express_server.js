const cookieParser = require('cookie-parser');

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  const existingKeys = Object.keys(urlDatabase);
  let newKey = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
  if (existingKeys.includes(newKey)) {
    newKey = generateRandomString();
  }
  return newKey;
};

console.log(generateRandomString());

//
// ROUTES FOR GET REQ
//

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id/u", (req, res) => {
  const templateVars = { urls: urlDatabase, updatedUrl: req.params.id, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id/n", (req, res) => {
  const templateVars = { urls: urlDatabase, newUrl: req.params.id, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies['username'] };
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
  const shortUrl = generateRandomString();
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
