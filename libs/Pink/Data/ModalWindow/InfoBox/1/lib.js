/**
 * @module Pink.Data.ModalWindow.InfoBox
 * @desc InfoBox Module for use with the ModalWindow widget
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */    

Ink.createModule('Pink.Data.ModalWindow.InfoBox', '1', ['Pink.Data.Binding_1'], function(ko) {
    var Module = function() {
        this.message = ko.observable('');
    };

    Module.prototype.initialize = function(modal) {
        this.modal = modal;
        modal.confirmHandler = this.confirm.bind(this);
        this.message(modal.params.message);
        this.confirmCallback = modal.params.confirmCallback;
    }

    Module.prototype.confirm = function() {
        this.modal.hide();
        if (typeof this.confirmCallback == 'function') {
            this.confirmCallback();
        }
    }

    return new Module();
});
