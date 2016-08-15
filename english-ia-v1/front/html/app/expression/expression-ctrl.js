
app.controller('CtrlExpressionAdd', ['DataExpression', function(DataExpression) {

	var self = this;

	self.addExpression = function(){
		//POST : add a new Expression
		var expression = new DataExpression;
		expression.vf = self.vf;
		expression.ve = self.ve;
		expression.$save();

		self.vf = '';
		self.ve = '';
	}

}]);
