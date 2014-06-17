/**
 * @module Pink.Data.Carousel
 * @desc Carousel bindings (Wrapper for Ink Carousel component)
 * @author intra-team AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.Carousel', '1', ['Pink.Data.Binding_1', 'Ink.UI.Carousel_1', 'Ink.Dom.Css_1'], function(ko, Carousel, InkCss) {
    /*
     * Carousel binding handler
     * 
     */
    ko.bindingHandlers.carousel = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {};
            
            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }

            InkCss.addClassName(element, 'ink-carousel');
            
            // Defer carousel creation to after the images and the pagination are in the DOM
            window.setTimeout(function() {
                var carousel = new Carousel(element, options);
                
                // The refit handler must be an observable
                // Apps should call the carousel refit handler after a layout change
                if (typeof binding.refitHandler == 'function') {
                	binding.refitHandler(carousel.refit.bind(carousel));
                }
            }, 0);
        }
    };
    
    return {};
});
