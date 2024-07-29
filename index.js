const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// das funktioniert anscheindend ohne probleme. und damit funktioniert es auch
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

const dotenv = require('dotenv');
dotenv.config({path:'sample.env'});
let mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const Schema = mongoose.Schema;
const Exercise = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String //wichtig für test nr 15
});

const User = new mongoose.Schema({
  username: String,
  log: [Exercise]
})

let UserModel = mongoose.model('User', User);

let ExerciseModel = mongoose.model('Exercise', Exercise);

//dem User eine Excercise hinzufügen
app.post('/api/users/:_id/exercises', (req, res) =>{
  console.log("api users exercises", req.params._id)
  let id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  if(date === '' || date == undefined){
    //date = new Date().toISOString().substring(0, 10);
    date = new Date().toDateString();
  }else{
    date = new Date(date).toDateString();
  }
  
 // console.log ("date nachher", date);
  //UserModel.findById(id, (err, data) =>{//suche nach der id // geht nicht mehr
  UserModel.findById(id)
  .exec()
  .then(data => {
    if(!data){//wenn nicht gefunden
      res.send('Unknown userId');
    } else {
      let username = data.username;
      let userid = data._id
      //neue exercise anlegen
      let newExercise = new ExerciseModel({
        username: username,
        description: description,
        duration: duration,
        date: date //new Date(date)
      });
      data.log.push(newExercise);//exercise in das log des users pushen
      data.save()
        .then(data => {
      //  console.log("gesaved, then, ", username, description, duration, date, id)
          return res.json({
            username: username,
            description: description,
            duration: Number(duration),
            date: date,
           _id: id // hier war der dumme fehler. es wird explizit nach _id verlangt. UNDERLINE
            //_id
          })//ende json
        
      })//ende save
    }//ende obere else
  })//ende find by id
}); //ende app post



//user anlegen
app.post("/api/users/", (req, res) => {
console.log ("User anlegen", req.body.username);
  let user = new UserModel({
    username: req.body.username
  }).save()
  .then((user)=>{res.json({username: user.username, _id: user._id});
             console.log(user.username, user._id);
             
             })
});

//full exercise log of user
app.get("/api/users/:id/logs", function(req, res) {
  console.log ("ich bin id logs", req.params, "from", req.query.from, "to", req.query.to, "limit", req.query.limit );
  let userid = req.params.id;

  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  
  
  //let meineDaten = UserModel.find({_id:userid})//hat nicht funktioniert. (warum auch immer)
  let meineDaten = UserModel.findById(userid)
    .exec()//ausführen
    .then(data =>{
     // console.log("data.log ", data.log);//data beinhaltet jetzt den namen des users
      let log = data.log;
      
      //filtern vom Log wenn from oder to gesetzt
       if(from){
        const fromDate = new Date(from);
        log = log.filter(Eintrag => new Date(Eintrag.date) > fromDate);  
      }

      if(to){
        const toDate = new Date(to);
        log = log.filter(Eintrag => new Date(Eintrag.date) < toDate); 
      }
      
      if (limit){//wenn limit gesetzt dann log limitieren
        log = log.slice(0, limit);
      }
      
      let count
      if (data.log == undefined){//wenn es noch kein log gibt, dann count = 0
        count = 0
      }else{
        count  = log.length
      }
     
      //let count = log.count;
      let username = data.username;
      let _id = userid;
     /* console.log("log", log);
      console.log("count", count);
      console.log("username", username);
      console.log("_id", _id);
      */
      //response zusammenstellen
      res.json({
        username: username,
        count: count,
        _id: _id,
        log: log
      })
    });
  
  
});




app.get("/api/users/", function(req, res) {
  console.log ("ich bin get users");
    UserModel.find({}).exec().then((users)=>{
     // console.log (ergebnis von )
    //console.log("meine User: ", users);
    res.json(users);
  });
});
                 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
