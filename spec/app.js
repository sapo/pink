'use strict';

Ink.setPath('Pink', 'libs/Pink/');

var routerMock=jasmine.createSpyObj('router', ['navigate']);

Ink.createModule('Pink.Plugin.Router', 1, [], function() {
   var Mock=function() {
   };
   
   Mock.prototype=routerMock;
   
   return Mock;
});

describe("App module", function() {
    it('Can create a new application', function(done) {
       Ink.requireModules(['Pink.App_1', 'Pink.Plugin.Router_1'], function(App, Router) {
           var Module = function() {
               App.call(this, 'home'); 
               
               this.signals.appReady.add(function() {
                   routerMock.navigate();
                   expect(routerMock.navigate).toHaveBeenCalled();
                   done();
               });
           };
           
           Module.prototype = new App();
           Module.constructor = Module;

           (new Module()).run();
       });
    });
});
