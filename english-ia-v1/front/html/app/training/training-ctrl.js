app.controller('CtrlTraining', ['DataExpression', '$http', function(DataExpression, $http){
	var self = this;

	//--------------------------------------------------
	// Initialiaz a new question
	//--------------------------------------------------
	self.init = function()
	{
		self.result = '';
		self.answer = '';
		self._id = 0;
		self.question = null;
		self.relatedExpressions = [];
		var user_id = 1;

		//--- prepare the data to post
		var data = {
			user_id : 1,
			source : 'both',
			stats_style : ''
		}

		//--- get a random expression from the API
		$http.post(SERVER_BACK_ADDRESS + "/api/expression/random", data)
		  	.then(function (response) {
		  		console.log("response : "+ response);
					self._id = response.data._id;
					self.priority = response.data.priority;

					//la question
					self.question = response.data;
					self.question.cssClass = self.getCssClass(self.question.nb_answer_wrong, self.question.nb_answer_good);
					self.initListRelatedExpressions(self.question.ve);

					self.question.indice = self.generateIndice(self.question.ve);


		    	 }, function (error) {
		    	 	console.log(error);
		              alert('error');
				});

		self.initListTopPriority();
		self.initListNewExpressions();

	};


	self.generateIndice = function(ve)
	{
		var arrayIn = ve.split(' ');
		var arrayOut = new Array();
		arrayIn.forEach(function(item){
			var newItem = "";
			if(item.length > 1){
				newItem = item.substring(0, 1);
				for(var i=1;i<item.length-1;i++)
					newItem = newItem + ".";
				newItem = newItem + item.substring(item.length-1, item.length);
			}else{
				newItem = item;
			}
			arrayOut.push(newItem);
		});
		return arrayOut.join("  ");
	}


	self.getCssClass = function(nb_answer_wrong, nb_answer_good){

		var balance = nb_answer_wrong-nb_answer_good;

		if(balance == 0)
						return "prio-level-0";
					else
						if(balance < 0)
							return "prio-level-1";
					else
						if(balance < 3)
							return "prio-level-2";
						else
							return "prio-level-3";
	}


	//--------------------------------------------------
	// handle the check Button
	//--------------------------------------------------
	self.checkBtn = function(){
		//--- init data that is planned to send to the API
		var data = {
			user_id : 1,
			expression_id : self._id,
			answer : false
		}

		//--- depends on the user's answer
		if(self.question.ve == self.answer){
			//--- Good Answser
			self.result = 'Good!';
			data.answer = true;
		}
		else{
			//---- Wrong Answer
			self.result = 'The good answer was : ' + self.question.ve;
			data.answer = false;
		}

		console.log(data);

		//--- Step : send the data to the API
		$http.post(SERVER_BACK_ADDRESS + "/api/expression-stat/", data)
		  	.then(function (response) {
		  			console.log("response : "+ response);
		  			if(response.data == "success"){
		  				//connexion reussie
		  			}else{
		  				//connexion échouée
		  			}
		    	 }, function (error) {
		    	 	console.log(error);
		              alert('error');
				});


	};

	//--------------------------------------------------
	// handle the Next Button
	//--------------------------------------------------
	self.nextBtn = function(){
		self.init();
	}


	self.nextRelatedBtn = function()
	{

	}


	//--------------------------------------------------
	// expTopPriority
	//--------------------------------------------------
	self.initListTopPriority = function(){
		//--- Step : send the data to the API
		$http.get(SERVER_BACK_ADDRESS + "/api/expression/list-top-priority/1")
		  	.then(function (response) {
				  	self.expTopPriority = response.data;

				  	for(var i=0;i<self.expTopPriority.length;i++){
				  		//self.expTopPriority[i].expression_id.vf = 'test';
				  		self.expTopPriority[i].cssClass = self.getCssClass(self.expTopPriority[i].nb_answer_wrong, self.expTopPriority[i].nb_answer_good);
				  	}

				}, function (error) {
			     	console.log(error);
			        alert('error');
				});
	}


	//--------------------------------------------------
	// expNews
	//--------------------------------------------------
	self.initListNewExpressions = function(){
		//--- Step : send the data to the API
		$http.get(SERVER_BACK_ADDRESS + "/api/expression/list-new-expressions/1")
		  	.then(function (response) {
				  	self.expNews = response.data;
				}, function (error) {
			     	console.log(error);
			        alert('error');
				});
	}


	//--------------------------------------------------
	// expNews
	//--------------------------------------------------
	self.initListRelatedExpressions = function(words){

		//---step : choice a word from the current expression
		var tab;
		//on retire les particules de la chaine
		tab = self.cleanStringFromWords(words, self.getListParticules());

		//on prend un mot au hasard
		var word = tab[Math.floor(Math.random()*tab.length)];
		self.relatedBaseWord = word;

		//--- Step : send the data to the API
		$http.get(SERVER_BACK_ADDRESS + "/api/expression/related/"+word)
		  	.then(function (response) {
				  	self.relatedExpressions = response.data;
				}, function (error) {
			     	console.log(error);
			        alert('error');
				});
	}

	self.cleanStringFromWords = function(stringToClean, words){
		//--warning : cette fonction pourrait etre écrite via une expression réguliere fun :)

		var tab = stringToClean.split(' ');
		var tab2 = [];
		//nous construisons un nouveau tableau contenant que les mots interessants
		//nous ne gardons pas les mots 'particules'
		for(var i=0;i<tab.length;i++)
			if(!(self.getListParticules().indexOf(tab[i]) > -1))
				tab2.push(tab[i]);

		return tab2;
	}

	self.getListParticules = function(){
		return [
			'a', 'at', 'and', 'an','are',
			'be',
			'do',
			'I', 'in','is',
			'out', 'on', 'off','of',
			'to','the',
			'who', 'whom', 'what', 'when', 'which', 'went','gone','was'
			];
	}



	self.init();
}]);
