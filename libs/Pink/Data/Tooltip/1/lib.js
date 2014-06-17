/**
 * @module Pink.Data.Tooltip
 * @desc Tooltip bindings
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.Tooltip', '1', ['Pink.Data.Binding_1', 'Ink.UI.Tooltip_1'], function(ko, Tooltip) {
    /*
     * Tooltip binding handler
     * 
     */
    ko.bindingHandlers.tooltip = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {}; // sensible defaults 
            
            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }
            
            new Tooltip(element, options);
        }
    };
    
    return {};
});
