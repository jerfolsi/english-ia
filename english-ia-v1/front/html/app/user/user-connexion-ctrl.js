



app.controller('UserConnexionCtrl', ['$http', '$location', 'UserService', function($http, $location, UserService){
	var self = this;
	self.email = "a@a.com";
	self.password = "a";

	//temp : pour simuler la connexion auto
	//gagner du temps pendant le DEV
	UserService.isLogged = true;
	$location.path("/home");


	self.status = function(){
		return UserService.isLogged == true;
	}

	self.login = function(){
		var data = {
			email : self.email,
			password : self.password
		};

		$http.post("http://localhost:8888/api/user/connexion/", data)
		  	.then(function (response) {
		  			if(response.data == "success"){
		  				//connexion reussie
		  				UserService.isLogged = true;
		  				UserService.email = self.email;
		  				//$location.path( "/home" );
		  			}else{
		  				//connexion échouée
	    	  			self.loggout();
		  			}
		    	 }, function (error) {
		  			  self.loggout();
		              alert('error');
		         });
	};

	self.loggout = function(){
		 UserService.isLogged = false;
		 UserService.email = '';
	}

}]);
