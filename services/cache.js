const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

// Configure redis
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = function() {
  console.log("I am about to Run");

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );
  console.log(key);

  return exec.apply(this, arguments);
};
