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

    return new Module();
});
