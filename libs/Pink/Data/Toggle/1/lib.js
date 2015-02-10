/**
 * @module Pink.Data.Toggle
 * @desc Toggle bindings (wrapper for Ink's Toggle component)
 * @author intra-team AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.Toggle', '1', ['Pink.Data.Binding_1', 'Ink.UI.Toggle_1', 'Ink.Dom.Event_1'], function(ko, Toggle, InkEvent) {
    /*
     * Toggle binding handler
     * 
     */
    ko.bindingHandlers.toggle = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {}; // sensible defaults

            // If the element is already a toggle trigger then exit 
            if (element.hasAttribute('data-is-toggle-trigger')) {
                return;
            }
            
            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }

            window.setTimeout(function() {
                if (document.getElementById(options.target.slice(1))) {
                    new Toggle(element, options);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                        InkEvent.stopObserving(element);
                    });
                }
            }, 100);
        }
    };

    return {};
});