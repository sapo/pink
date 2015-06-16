'use strict';

Ink.setPath('Pink', 'libs/Pink/');

describe("App module", function() {
    it('Can create an application and run a home module', function(done) {
       loadFixtures('spec/app.html');
        
       Ink.requireModules(['Pink.App_1', 'Pink.Data.Binding_1'], function(App, ko) {
           var signalHandlerMock=jasmine.createSpyObj('signals', ['appReady']);
           var app;
           var Module = function() {
               App.call(this, 'home'); 
               
               this.signals.appReady.add(function() {
                   signalHandlerMock.appReady();
               });
           };
           
           Module.prototype = new App();
           Module.constructor = Module;
           
           Module.prototype.listInvisibleRoutes = function() {
               return [
                   {hash: 'home', module: 'App.Test.Home'}
               ];
           };

           app = new Module();
           
           Ink.createModule('App.Test.Shell', 1, [], function() {
              var Module=function() {
                  this.mainModule=app.mainModule;
              };
              return Module;
           });

           Ink.createModule('App.Test.Home', 1, [], function() {
               var Module=function() {
                   expect(signalHandlerMock.appReady).toHaveBeenCalled();
                   done();
               }
               return Module; 
           });

           // Clear bindings from previous tests
           ko.cleanNode(document.documentElement);
           
           app.run();
       });
    });
});
