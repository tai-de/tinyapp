const { assert } = require('chai');

const { userLookup } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('userLookup', function() {
  it('should return a user with valid email', function() {
    const user = userLookup(testUsers, "user@example.com", "email", "id");
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return false if an email does not exist', function() {
    const user = userLookup(testUsers, "user3@example.com", "email", "id");
    const expectedUserID = false;
    assert.equal(user, expectedUserID);
  });
});