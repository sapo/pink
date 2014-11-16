/**
 * @module Pink.Data.DatePicker
 * @desc DatePicker bindings (wrapper for Ink's DatepPicker component)
 * @author intra-team AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.DatePicker', '1', ['Pink.Data.Binding_1', 'Ink.UI.DatePicker_1'], function(ko, DatePicker) {
    /*
     * DatePicker binding handler
     * 
     */
    ko.bindingHandlers.datePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {}; // sensible defaults 

            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }

            if (!Modernizr || !Modernizr.inputtypes.date) {
                new DatePicker(element, options);
            }
        }
    };

    return {};
});