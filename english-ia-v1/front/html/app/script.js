
var app = angular.module('AppExpressionTraining', [
    // Dépendances du "module"
    'ngRoute',
    'ngResource'
]);

//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------
// routeProvider
//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------
app.config(['$routeProvider', function($routeProvider) {

        // Système de routage : pour chaque route on définit le 'template' et le 'controller'
        $routeProvider
        .when('/expression-add', {
            templateUrl: './app/expression/expression-add.html',
            access: {isFree: false}
        })
        .when('/home', {
            templateUrl: './app/training/training.html',
            access: {isFree: false}
        })
        .when('/user-connexion', {
          templateUrl: './app/user/connexion.html',
          access: {isFree: true}
        })
        .otherwise({
            redirectTo: '/home'
        });
    }
]);


//-------------------------------------------------------------------
// Le Servcice 'ResourceData'
// qui servira pour tous les types d'objets : User, Facture, Book, ..
//-------------------------------------------------------------------

app.factory('ResourceData', [ '$resource', function( $resource ) {
    return function( url, params, methods ) {
        var defaults = {
               update: { method: 'put', isArray: false },
               create: { method: 'post' }
              };

              methods = angular.extend( defaults, methods );

             var resource = $resource(url, params, methods );

             resource.prototype.$save = function() {
               if (!this.id ) {
                 return this.$create();
               }
               else {
                 return this.$update();
               }
             };

             return resource;
           };
}]);


//-------------------------------------------------------------------
// Le Servcice 'DataUser'
// qui servira pour tous les types d'objets : User, Facture, Book, ..
//-------------------------------------------------------------------
app.factory('DataExpression', ['ResourceData', function(ResourceData) {
     return ResourceData(SERVER_BACK_ADDRESS + '/api/expression/:id', { id: '@id' } );
}]);

app.factory('DataUser', ['ResourceData', function(ResourceData) {
     return ResourceData(SERVER_BACK_ADDRESS + '/api/user/:id', { id: '@id' } );
}]);

app.factory('UserService', [function() {
  return {
    isLogged: false,
    email: ''
  };
}]);


//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------
// Modele
//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

var Expression = function(vf, ve){
  this.vf = vf;
  this.ve = ve;
}

var User = function(){
  this.email = "a@a.com";
  this.password = "a";
};

//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------
// Directives
//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

/*
 * IMPORTANT:
 * It's not difficult to fool the previous control,
 * so it's really IMPORTANT to repeat server side
 * the same control before sending back reserved data.
 */
app.directive('checkUser', ['$rootScope', '$location', 'UserService',
  function ($root, $location, userSrv) {
    return {
      link: function (scope, elem, attrs, ctrl) {
        //la directive ecoute l'evenement $routeChangeStart
        $root.$on('$routeChangeStart', function(e, curr, prev){

          if (!curr.access.isFree && !userSrv.isLogged) {
            // reload the login route
            $location.path("/user-connexion");
          }
        });
      }
    }
  }]);


//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------
// Filter
//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

app.filter('questionstyle', function(){
  return function(object){
    return object.ve + " test";
  }
});
