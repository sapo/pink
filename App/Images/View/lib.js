Ink.createModule('App.Images.View', '1', ['App.Images', 'Pink.Data.Binding_1'], function(app, ko) {
    var Module = function() {
    	app.signals.viewPhoto.add(this.viewPhoto.bind(this));
    	
    	this.photoSrc = ko.observable('');
    	this.photoTitle = ko.observable('');
    };
    
    
    Module.prototype.viewPhoto = function(photo) {
    	this.photoSrc(photo.url);
    	this.photoTitle(photo.title);
    	app.navigateTo('#view');
    };
    
    return new Module();
});
