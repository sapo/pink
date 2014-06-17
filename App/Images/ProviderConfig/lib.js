Ink.createModule('App.Images.ProviderConfig', '1', ['App.Images', 'Pink.Data.Binding'], function(app, ko) {
    var Module = function(modal) {
    	var self=this;
    	
    	this.apiKey = ko.observable(modal.params.apiKey);
    	this.itemCount = ko.observable(modal.params.itemCount);
    	
    	modal.confirmHandler = function() {
    		app.signals.providerConfigUpdated.dispatch({
    			key: self.apiKey(),
    			itemCount: self.itemCount()
    		});
    		modal.hide();
    	}
    };

    return Module;
});