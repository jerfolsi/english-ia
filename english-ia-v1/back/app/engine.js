module.exports = {

  listTopPriority: function(req, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});
      //console.log("GET /api/expression/listTopPriority has been reached");

      //get user_id from request's params
      user_id = req.params.user_id;
      //console.log("user_id : "+ user_id);

      //--- charge la liste des expressions-stat par ordre de priorité decroissante
      DataExpressionStat.find({user_id: user_id})
          .sort({'priority': -1, 'date_last_answer': 1})
          .limit(100)
          .populate("expression_id")
          .exec(function(err, stats){
                if(!err){
                    result = JSON.stringify(stats);
                    res.end(result);
                }else{
                     //res.end(error);
                    res.end("error1");
                }
          });
  },
 

  listNewExpressions: function(req, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});

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
                  .limit(100)
                  .exec(function(err, expressions){
                      res.end(JSON.stringify(expressions));
                  });
              }
          });
  },


  //-----------------------------------------------------------------
  // fonction qui renvoi un mot au hasard
  //-----------------------------------------------------------------
  random: function(req, res, DataExpression, DataExpressionStat, merge) {

      DataExpression.findRandom().limit(1).exec(function(err, elements){
          if(elements.length > 0){
              var expression = elements[0];

              //--- merge new properties before sending the response
              var target = merge(expression.toObject(),{
                        priority: 0,
                        nb_answer_wrong: 0,
                        nb_answer_good: 0
              });

              res.end(JSON.stringify(target));
          }
      });
  },

  //-----------------------------------------------------------------
  // fonction qui renvoie un mot au hasard parmi les priorités les plus elevées
  // de l'utilisateur
  //-----------------------------------------------------------------
  randomFromStats: function (user_id, res, DataExpression, DataExpressionStat, merge) {
		  res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});

      //get a random number to define the randomSizeLimit
      var randomSizeLimit = 1+Math.floor(Math.random()*30);
      console.log("randomSizeLimit : " + randomSizeLimit);

   		//--- charge la liste des expressions-stat par ordre de priorité decroissante
   		DataExpressionStat.find({user_id: user_id})
      .sort({'priority': -1, 'date_last_answer': 1})
      .limit(randomSizeLimit)
      .exec(function(err, stats){
       		var result = "";
     			if(!err){
              if(stats.length > 0)
              {
           				//-- renvoie la liste brute
           				for(var i in stats){
           					var stat = stats[i];
           					//console.log("priority["+stat.priority + "] : "+stat.expression_id);
           					result += "\n"+"priority["+stat.priority + "] : "+stat.expression_id;
           				}

           				//-- choisi au hasard un element de cette liste
           				var indiceRand = Math.ceil(Math.random()*stats.length-1);
           				console.log("randomIndice : " + indiceRand);
           				var statSelected = stats[indiceRand];

           				DataExpression.findOne({_id: statSelected.expression_id}).exec(function(err, expression){
          	 				//--- merge new properties before sending the response
          	                var target = merge(expression.toObject(),{
          	                      priority: statSelected.priority,
                                  nb_answer_wrong: statSelected.nb_answer_wrong,
                                  nb_answer_good: statSelected.nb_answer_good
          	                });

          	                //--- send response to the client
                          	res.end(JSON.stringify(target));
           				});
              }
              else{
                  res.end("error");
              }

     			}else{
     				//console.log(err);
            res.end("error");
     			}
   		});
   },



  //-----------------------------------------------------------------
  // fonction qui renvoie un mot au hasard parmi les priorités les plus elevées
  // de l'utilisateur
  //-----------------------------------------------------------------
  randomFromStatsLessAnswered: function (user_id, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});

         //--- charge la liste des expressions-stat par ordre de priorité decroissante
      DataExpressionStat.findOne({user_id: user_id})
      .sort({'date_last_answer': 1})
      .populate('expression_id')
      .exec(function(err, statSelected){
          var result = "";
          if(!err){




                var target = merge(statSelected.expression_id.toObject(),{
                                  priority: statSelected.priority,
                                  nb_answer_wrong: statSelected.nb_answer_wrong,
                                  nb_answer_good: statSelected.nb_answer_good
                            });


              //--- send response to the client
              console.log(target);
              res.end(JSON.stringify(target));
          }else{
            //console.log(err);
            res.end("error");
          }
      });
   },


  //-----------------------------------------------------------------
  //-----------------------------------------------------------------
  expressionsWithoutStats: function (user_id, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});

//      DataExpressionStat.findRandom()

      //--step : build an array with all the expression_id associated with stats
      DataExpressionStat.find({user_id: user_id})
           .select({expression_id:1, _id:0})
           .exec(function(err, stats) {
              if(!err){
                  //-- build an array with expression'id associted with stats
                  var expression_ban_list = [];
                  for(var i in stats)
                      expression_ban_list.push(stats[i].expression_id);

                  //--step : get all the expression which aren't in the previous built-array
                  DataExpression.findRandom({'_id': { $nin: expression_ban_list }})
                  .limit(1)
                  .exec(function(err, expressions){
                      console.log(">>>>>>>>>> Expressions without any stats for user : " + user_id);
                      //for(var i in expressions)
                      //   console.log(expressions[i].ve);

                      if(!err && expressions != undefined && expressions.length > 0)
                      {
                        var expression = expressions[0];

                        //--- merge new properties before sending the response
                        var target = merge(expression.toObject(),{
                                  priority: 0,
                                  nb_answer_wrong: 0,
                                  nb_answer_good: 0
                        });
                        res.end(JSON.stringify(target));
                      }
                      else {
                        res.end("{}");
                      }
                  });
              }
          });
  },


  nbExpressionWithoutStats: function (user_id, DataExpression, DataExpressionStat, callback) {
      //--step : build an array with all the expression_id associated with stats
      DataExpressionStat.find({user_id: user_id})
          .select({expression_id:1, _id:0})
           .exec(function(err, stats) {
              if(!err){
                  //-- build an array with expression'id associted with stats
                  var expression_ban_list = [];
                  for(var i in stats)
                      expression_ban_list.push(stats[i].expression_id);

                  //--step : get all the expression which aren't in the previous built-array
                  DataExpression.count({'_id': { $nin: expression_ban_list }})
                  .exec(function(err, nb){
                      callback(nb);
                  });
              }
          });

  },


  nbExpressionWithStats: function (user_id, DataExpression, DataExpressionStat, callback) {
        DataExpressionStat.count({user_id: user_id}, function(err, nbStats) {
                      callback(nbStats);
              });
  },



  //-----------------------------------------------------------------
  //-----------------------------------------------------------------
   resetStats: function (req, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});
      //console.log("GET /api/expression/resetStats has been reached");

      //get user_id from request's params
      user_id = req.params.user_id;
      //console.log("user_id : "+ user_id);

      DataExpressionStat.remove({user_id: user_id}).exec(function(err){
          if(!err){
            console.log("all stats for user : " + user_id + " have been removed");
          }
      });

   },

  //-----------------------------------------------------------------
  //-----------------------------------------------------------------
   listRelatedExpressions:  function (word, res, DataExpression, DataExpressionStat, merge) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(200, {'Content-Type': 'text/plain'});

      console.log(">>>>>>>>>> ");

      DataExpression.find({ve: new RegExp(word, "g")})
      .exec(function(err, expressions){
        //console.log(JSON.stringify(expressions));
        res.end(JSON.stringify(expressions));
      });
  }

};
