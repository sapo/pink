/**
 * @module Pink.Data.DatePicker
 * @desc DatePicker bindings (wrapper for Ink's DatepPicker component)
 * @author intra-team AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.DatePicker', '1', ['Pink.Data.Binding_1', 'Ink.UI.DatePicker_1'], function(ko, DatePicker) {
    'use strict';

    /*
     * DatePicker binding handler
     */
    ko.bindingHandlers.datePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {
                onSetDate: function(picker) {
                    ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindingsAccessor, 'value', picker._element.value);
                }
            };

            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }

            if (binding.forceFallback || !Modernizr || !Modernizr.inputtypes.date) {
                new DatePicker(element, options);
            }
        }
    };

    return {};
});