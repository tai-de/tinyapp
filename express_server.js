const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id/u", (req, res) => {
  const templateVars = { urls: urlDatabase, updatedUrl: req.params.id };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id/n", (req, res) => {
  const templateVars = { urls: urlDatabase, newUrl: req.params.id };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
