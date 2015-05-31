Ink.createModule('App.Images.Shell', '1', ['App.Images'], function(app) {
    'use strict';

    var Module = function() {
        var self=this;

        this.appTitle = app.appTitle;
        this.mainModule = app.mainModule;
        this.modalModule = app.modalModule;
        this.alertModule = app.alertModule;
        this.infoModule = app.infoModule;
    };

    Module.prototype.afterRender = function() {
        app.signals.shellRendered.dispatch();
    };

    return new Module();
});
