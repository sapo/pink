/**
 * @module Pink.Data.Toggle
 * @desc Toggle bindings (wrapper for Ink's Toggle component)
 * @author intra-team AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.Toggle', '1', ['Pink.Data.Binding_1', 'Ink.UI.Toggle_1'], function(ko, Toggle) {
    /*
     * Toggle binding handler
     * 
     */
    ko.bindingHandlers.toggle = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {}; // sensible defaults 

            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }

            new Toggle(element, options);
        }
    };

    return {};
});