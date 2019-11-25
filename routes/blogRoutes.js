const mongoose = require("mongoose");
const redis = require("redis");
const requireLogin = require("../middlewares/requireLogin");
const util = require("util");

// Configure redis
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

const Blog = mongoose.model("Blog");

module.exports = app => {
  app.get("/api/blogs/:id", requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  app.get("/api/blogs", requireLogin, async (req, res) => {
    try {
      // Redis service

      //Do we have any cached data in redis related to this query
      client.get = util.promisify(client.get);

      const cachedBlogs = await client.get(req.user.id);

      //if yes, then respond to the request right away and return

      if (cachedBlogs) {
        console.log("Serving from redis cache");
        return res.send(cachedBlogs);
      }
      //if no, we need to respond to the request and update our cache to store the data
      const blogs = await Blog.find({ _user: req.user.id });
      console.log("Serving from mongo");
      res.send(blogs);
      client.set(req.user.id, JSON.stringify(blogs));
    } catch (error) {
      console.log(error);
    }
  });

  app.post("/api/blogs", requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
  });
};
