const mongoose = require("mongoose");

const url = 'mongodb://user:user@ac-7hpmnos-shard-00-00.ldgjyxv.mongodb.net:27017,ac-7hpmnos-shard-00-01.ldgjyxv.mongodb.net:27017,ac-7hpmnos-shard-00-02.ldgjyxv.mongodb.net:27017/?ssl=true&replicaSet=atlas-7shmny-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(url)
  .then(() => {
    console.log("Database Connected")
  })
  .catch((error) => console.log('This is errorrr...' + error));


