Ink.createModule('App.Tasks.Shell', '1', ['Pink.Data.Binding_1', 'App.Tasks', 'App.Tasks.Libs.Animation'], function(ko, app, Animation) {
    var Module = function() {
        var self=this;
        
        this.definedRoutes = app.definedRoutes;

        this.mainModule = app.mainModule;
        this.mainModule.notifyBeforeDestroy = this.handleBeforeModuleDestroy;
        
        this.modalModule = app.modalModule;
        this.alertModule = app.alertModule;
        this.infoModule = app.infoModule;

        this.appTitle = app.appTitle;
    };

    Module.prototype.afterRender = function() {
        new Ink.UI.Toggle('#mainMenuTrigger');
        app.signals.shellRendered.dispatch();
    };

    Module.prototype.handleBeforeModuleDestroy = function(element) {
    	var moduleEl=element.firstChild;
    	
    	ko.cleanNode(moduleEl); // Remove old module bindings
    	document.getElementById('tempContainer').appendChild(moduleEl);
    	element.style.display = 'none';

    	// Run the animation after the new module is bound...
    	window.setTimeout(function() {
        	Animation(moduleEl)
        	.set('opacity', 0.5)
        	.translate(-500)
        	.duration('0.5s')
    		.end(function() {
                element.style.display = 'block';
                moduleEl.parentNode.removeChild(moduleEl);
            });

    	}, 250);
    };

    return new Module();
});
