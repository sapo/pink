'use strict';
var ASYNC_TIMEOUT_DELAY_MS = 100;

Ink.setPath('Pink', 'libs/Pink/');

describe("Autocomplete module", function() {
    function createKeyUpEvent(keyCode) {
        var event;

        event = document.createEvent('Event');
        event.keyCode = keyCode;
        event.initEvent('keyup');
        
        return event;
    }
    
    it('Renders an autocomplete widget and can select an option with the keyboard', function(done) {
       loadFixtures('spec/autocomplete.html');
        
       Ink.requireModules(['Pink.Data.AutoComplete_1', 'Pink.Data.Binding_1', 'Ink.Dom.Event_1'], function(App, ko, inkEvt) {
           var vm={
               users: ko.observableArray([
                  {id: 1, name: 'Alice'}, 
                  {id: 2, name: 'Sarah'}, 
                  {id: 3, name: 'John'}, 
                  {id: 4, name: 'Peter'}, 
                  {id: 5, name: 'Mark'}, 
                  {id: 6, name: 'Bea'}, 
                  {id: 7, name: 'Roger'}, 
                  {id: 8, name: 'Paul'}, 
                  {id: 9, name: 'Trent'}, 
                  {id:10, name: 'Daniela'},
                  {id:11, name: 'Sam'}]),
               selectedUserId: ko.observable()
           };
           
           // Clear bindings from previous tests
           ko.cleanNode(document.documentElement);

           ko.applyBindings(vm);
           
           window.setTimeout(function() {
               var input=Ink.s('.pink-auto-complete input');
               
               input.dispatchEvent(createKeyUpEvent(inkEvt.KEY_DOWN));
               input.dispatchEvent(createKeyUpEvent(inkEvt.KEY_RETURN));

               window.setTimeout(function() {
                   expect(vm.selectedUserId()).toBe('1');
                   done();
               }, ASYNC_TIMEOUT_DELAY_MS);
           }, ASYNC_TIMEOUT_DELAY_MS);
       });
    });
});
