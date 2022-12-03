const generateRandomString = function(length, database = {}) {
  const existingKeys = Object.keys(database);
  let newKey = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1, length + 1);
  if (existingKeys.includes(newKey)) {
    newKey = generateRandomString();
  }
  return newKey;
};

// user lookup
// given a value to search for and an optional key (default is email)
// will return the value of the third parameter if user is found (or the same value if not passed)
const userLookup = function(database, value, key = 'email', target = 'email') {
  for (const user in database) {
    if (database[user][key] === value) {
      return database[user][target];
    }
  }
  return false;
};

// returns urls filtered by userId
const urlsForUser = function(database, userId) {
  const filteredUrlDb = {};
  for (const key in database) {
    const urlObj = database[key];
    const urlOwner = database[key].userId;
    if (urlOwner === userId) {
      filteredUrlDb[key] = urlObj;
    }
  }
  return filteredUrlDb;
};

// returns all public urls + the user's private ones
const getAllUrls = function(database, userId) {
  const filteredUrlDb = {};
  for (const key in database) {
    const urlObj = database[key];
    const urlOwner = database[key].userId;
    if (urlOwner === userId) {
      filteredUrlDb[key] = urlObj;
      continue;
    } else if (urlObj.private === 'false') {
      filteredUrlDb[key] = urlObj;
    }
  }
  return filteredUrlDb;
};

// checks if the id exists in the uniqueHits array of a specified shortUrl object
// returns true if so, false if not
const checkUniqueHits = function(shortUrlDb, id) {
  console.log('checking for', id);
  for (const uniqueHit of shortUrlDb.uniqueHits) {
    console.log('unique hit loop', uniqueHit);
    if (uniqueHit.visitor === id) {
      return true;
    }
  }
  return false;
};

// updates the url database for all records owned by oldUserId
// assignes newUserId & respective username for all records
const updateUrlDatabase = function(urlDb, userDb, oldUserId, newUserId) {
  const newUserName = userLookup(userDb, newUserId, 'id', 'username');

  const urlIds = Object.keys(urlDb);

  for (const id of urlIds) {
    if(urlDb[id].userId === oldUserId) {
      urlDb[id].userId = newUserId;
      urlDb[id].username = newUserName;
    }
  }

};

module.exports = {
  generateRandomString,
  userLookup,
  urlsForUser,
  getAllUrls,
  checkUniqueHits,
  updateUrlDatabase
};