// ###############################################################################
// ###############################################################################
//
// BASE INITS
//
// ###############################################################################
// ###############################################################################

var SERVER_BD_ADDRESS = 'mongodb://172.18.0.2';

express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
var mongoose = require('mongoose');
var random = require('mongoose-random');
var session = require('express-session');
var merge = require('merge');

app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true})); //init session
app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json

var sess; //used to follow the user's session

// ###############################################################################
// ###############################################################################
//
// MONGOOSE'S SCHEMAS
//
// ###############################################################################
// ###############################################################################

//************* DataExpression
//define a schema
var DataExpressionSchema = mongoose.Schema({
    vf: {type :String, required:true},
    ve: String,
});

//add random pluggin to the schema before compiling
DataExpressionSchema.plugin(random, { path: 'r' });

//compile the schema into a model (a class)
var DataExpression = mongoose.model('DataExpression', DataExpressionSchema);

// if you have an existing collection, it must first by synced.
// this will add random data for the `path` key for each doc.
DataExpression.syncRandom(function (err, result) {
  console.log(result.updated);
});

//************* DataExpressionStat
var DataExpressionStatSchema = mongoose.Schema({
  user_id: Number,
  expression_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DataExpression' },
  nb_answer_good: Number,
  nb_answer_wrong: Number,
  priority: Number,
  date_last_answer: Date
});
DataExpressionStatSchema.plugin(random, { path: 'r' });
var DataExpressionStat = mongoose.model('DataExpressionStat', DataExpressionStatSchema);
DataExpressionStat.syncRandom(function (err, result) {
  console.log(result.updated);
});

// ###############################################################################
// ###############################################################################
//
// DECLARE THE ENGINE
//
// ###############################################################################
// ###############################################################################

var engine = require('./engine');



// ###############################################################################
// ###############################################################################
//
// ROUTES
//
// ###############################################################################
// ###############################################################################

//-------------------------------------------------------------------
// ROUTE : /expression
//-------------------------------------------------------------------
router.route('/expression')
    .post(function(req, res) {
          console.log("post /expression");
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.writeHead(200, {'Content-Type': 'text/plain'});

          dataExpression = new DataExpression({vf: req.body.vf , ve: req.body.ve});
          DataExpression.create(dataExpression, function(err){
            if(err)
              console.log(err);
            else
              console.log("Add new Expression : "+ dataExpression.vf + " / " + dataExpression.ve);
          });

          res.end("received");
    })
    .put(function(req, res) {
    })
    .get(function(req, res) {
   });

//-------------------------------------------------------------------
// ROUTE : /expression/random
//-------------------------------------------------------------------
router.route('/expression/list-top-priority/:user_id')
    .get(function(req, res) {
        engine.listTopPriority(req, res, DataExpression, DataExpressionStat, merge);
    });



//-------------------------------------------------------------------
//
//-------------------------------------------------------------------


router.route('/expression/related/:word')
    .get(function(req, res) {
        engine.listRelatedExpressions(req.params.word, res, DataExpression, DataExpressionStat, merge);
    });


//-------------------------------------------------------------------
//
//-------------------------------------------------------------------


router.route('/expression/list-new-expressions/:user_id')
    .get(function(req, res) {
        engine.listNewExpressions(req, res, DataExpression, DataExpressionStat, merge);
    });



//-------------------------------------------------------------------
// ROUTE : /expression/stats
//-------------------------------------------------------------------
router.route('/expression/stats/:user_id')
    .get(function(req, res) {

          //--step : build an array with all the expression_id associated with stats
          DataExpressionStat.find({user_id: req.params.user_id})
          .select({expression_id:1, _id:0})
           .exec(function(err, stats) {
              if(!err){
                  //-- build an array with expression'id associted with stats
                  var expression_ban_list = [];
                  for(var i in stats)
                      expression_ban_list.push(stats[i].expression_id);

                  //--step : get all the expression which aren't in the previous built-array
                  DataExpression.find({'_id': { $nin: expression_ban_list }})
                  .exec(function(err, expressions){
                      console.log(">>>>>>>>>> Expressions without any stats for user : " + req.params.user_id);
                      for(var i in expressions)
                         console.log(expressions[i].ve);
                  });
              }
          });
          res.end('1');
    });

//-------------------------------------------------------------------
// ROUTE : /expression/random
//
// req.body.source = "stats" => get expressions from 'stat list'
// req.body.source = "new" => get expressions from "new list"
// req.body.source = "both" => get expressions from both
//
// req.body.stats_style = "seldom" => get the less answered expressions
//-------------------------------------------------------------------
router.route('/expression/random')
    .post(function(req, res) {

        user_id = req.body.user_id;

        engine.nbExpressionWithoutStats(1, DataExpression, DataExpressionStat,
            function(nbWithoutStats){

                var typeSelection;

                //determine le type de selection de la prochaine expression
                if(nbWithoutStats == 0){
                    typeSelection = "new";
                }
                else
                {
                    if(req.body.source == "stats")
                        typeSelection = "stats";
                    else
                        if(req.body.source == "new")
                            typeSelection = "new";
                        else
                        {
                            //it means source == "both"
                            if(Math.ceil(Math.random()*3)-1 > 0)
                                typeSelection = "new";
                            else
                                typeSelection = "stats";
                        }
                }

                //--- lance le moteur de selection en fonction du type
                console.log(">>> selection Expression : " + typeSelection);
                switch(typeSelection)
                {
                    case "new":
                        engine.expressionsWithoutStats(user_id, res, DataExpression, DataExpressionStat, merge);
                    break;

                    case "stats":
                        if(req.body.stats_style == "seldom")
                            engine.randomFromStatsLessAnswered(user_id, res, DataExpression, DataExpressionStat, merge);
                        else
                          engine.randomFromStats(user_id, res, DataExpression, DataExpressionStat, merge);
                    break;
                }
            });
    });

//-------------------------------------------------------------------
// ROUTE : /expression/resetstats
//-------------------------------------------------------------------
router.route('/expression/resetstats/:user_id')
    .get(function(req, res) {
      if(false)
          engine.resetStats(req, res, DataExpression, DataExpressionStat, merge);
    });

//-------------------------------------------------------------------
// ROUTE : /user/connexion
//-------------------------------------------------------------------
router.route('/user/connexion')
    .post(function(req, res) {
        console.log("/user/connexion/" + req.body.email);
        if(req.body.email == "a@a.com"){
            sess=req.session;
            sess.user_email=req.body.email;
            sess.user_id = 1;

            console.log("session connexion = " + JSON.stringify(sess));

            res.end("success");
        }else{
            res.end("error");
        }
});

//-------------------------------------------------------------------
// ROUTE : /expression-stat
//-------------------------------------------------------------------
router.route('/expression-stat')
    .post(function(req, res) {
        console.log("/expression-stat/{ " + req.body.expression_id + " ; " + req.body.user_id + " }");

        DataExpressionStat.findOne({
            user_id: req.body.user_id,
            expression_id: req.body.expression_id
          }, function(err, dataExpressionStat){
            if(!err){

              //enregistrement n'existe pas
              if(!dataExpressionStat){
                dataExpressionStat = new DataExpressionStat();
                dataExpressionStat.expression_id = req.body.expression_id;
                dataExpressionStat.user_id = req.body.user_id;
                dataExpressionStat.nb_answer_good = 0;
                dataExpressionStat.nb_answer_wrong = 0;
                dataExpressionStat.priority = 0;
              }

              if(req.body.answer){
                 dataExpressionStat.nb_answer_good += 1;
                 //if(dataExpressionStat.priority > 0)
                    //dataExpressionStat.priority-= 1;
              }
              else{
                 dataExpressionStat.nb_answer_wrong += 1;
                 //dataExpressionStat.priority += 1;
              }

              //-- calcul de la priorité
              dataExpressionStat.priority = dataExpressionStat.nb_answer_wrong + 1 - dataExpressionStat.nb_answer_good;

              dataExpressionStat.date_last_answer = Date.now();
              dataExpressionStat.save(function(err){});
              console.log(dataExpressionStat);
              console.log("save");
              res.end("success");
            }else
            {
              console.log(err);
              res.end("error");
            }
          });
});

//-------------------------------------------------------------------
// ROUTE : register our routes + all of our routes will be prefixed with /api
//-------------------------------------------------------------------
app.use(function(req, res, next) {
   // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.use('/api', router);


// ###############################################################################
// ###############################################################################
//
// LAUNCH THE SERVER
//
// ###############################################################################
// ###############################################################################


// warning : you have to set the right IP adresse (look the container's ip)
mongoose.connect(SERVER_BD_ADDRESS+'/expression');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    app.listen(8080);
    console.log('Magic happens on port ' + 8080);




});
