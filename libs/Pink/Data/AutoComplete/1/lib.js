/**
 * @module Pink.Data.AutoComplete
 * @desc AutoComplete widget
 * @author intra-team  AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.AutoComplete', '1', ['Pink.Data.Binding_1', 'Ink.Dom.Event_1', 'Ink.Dom.Element_1', 'Ink.Dom.Selector_1', 'Ink.Util.String_1'], function(ko, inkEvt, inkEl, inkSel, inkStr) {
    /*
     * This function must be bound to an options object
     */
	function handleValueChange(item) {
        var labelToWrite = item ? item.label : undefined;
        var valueToWrite = item ? item.value : undefined;

        if (this.allowAny && valueToWrite == undefined) {
        	labelToWrite = valueToWrite = this.displayInput.value;
        }
        
        if (valueToWrite != undefined) {
            updateValueAndLabel(this.binding, labelToWrite, valueToWrite, this.displayInput, this.element);
        } else { //They did not make a valid selection so change the autoComplete box back to the previous selection
            var currentModelValue = ko.unwrap(this.binding.value);
            
            //If the currentModelValue exists and is not nothing, then find out the display
            // otherwise just blank it out since it is an invalid value
            if (!currentModelValue) {
                this.displayInput.value = '';
            } else {
                //Go through the source and find the id, and use its label to set the autocomplete
                var selectedItem = findSelectedItem(this.dataSource, this.binding, currentModelValue);           

                //If we found the item then update the display
                if (selectedItem) {
                    var displayText = this.labelProp ? ko.unwrap(selectedItem[this.labelProp]) : ko.unwrap(selectedItem).toString();
                    this.displayInput.value = displayText;
                } else { //if we did not find the item, then just blank it out, because it is an invalid value
                	this.displayInput.value = '';
                }
            }
        }

        return false;
    };
    
    function findSelectedItem(dataSource, binding, selectedValue) {
        var source = ko.unwrap(dataSource);
        var valueProp = ko.unwrap(binding.optionsValue);

        var selectedItem = ko.utils.arrayFirst(source, function (item) {
            if (ko.unwrap(item[valueProp]) == selectedValue) {
                return true;
            }
        }, this);

        return selectedItem;
    };
    
    function buildDataSource(dataSource, labelProp, valueProp) {
        var source = ko.unwrap(dataSource);
        var mapped = ko.utils.arrayMap(source, function (item) {
            var result = {};
            result.label = labelProp ? ko.unwrap(item[labelProp]) : ko.unwrap(item).toString();  //show in pop-up choices
            result.value = valueProp ? ko.unwrap(item[valueProp]) : ko.unwrap(item).toString();  //value
            result.source = item;
            return result;
        });
        return mapped;
    };
    
    function updateValueAndLabel(binding, labelToWrite, valueToWrite, displayInput, element) {
        if (ko.isWriteableObservable(binding.value)) {
        	binding.value(valueToWrite);
        } else {  //write to non-observable
            if (binding['_ko_property_writers'] && binding['_ko_property_writers']['value']) {
                binding['_ko_property_writers']['value'](valueToWrite);
                //Because this is not an observable, we have to manually change the controls values
                // since update will not do it for us (it will not fire since it is not observable)
                displayInput.value = labelToWrite;
                element.value = valueToWrite;
            }
        }
    };
    
    // Function to build the menu with the suggested options
    function buildOptions(ul, source, filter, itemTemplate, bindingContext, minFilterLen) {
        itemTemplate = itemTemplate || 'Pink.Data.AutoComplete.ItemTemplate';

        if (!minFilterLen || (filter && filter.length >= minFilterLen) ) {
            window.setTimeout(function() {
                var index;
                var items = 0;
                var label;
                var value;
                var li;
                var tmpUl;

                if (filter) {
                    filter = inkStr.removeAccentedChars(filter);
                    filter = ".*" + filter.replace(/\s+/g, ".*") + ".*";
                }
                
                tmpUl = document.createElement('ul');
                
                for (index=0; (index<source.length) && (items < ko.bindingHandlers.autoComplete.maxVisibleOptions); index++) {
                    label = inkStr.removeAccentedChars(source[index].label);
                    value = source[index].value;
                    
                    if (filter && !label.match(new RegExp(filter, "i"))) {
                        continue;
                    }
                    
                    li = document.createElement('li');
                    ko.renderTemplate(itemTemplate, new ko.bindingContext(source[index], bindingContext), {}, li);
                    ko.cleanNode(li);
                    tmpUl.appendChild(li);
                    items++;
                }
                
                ul.innerHTML = tmpUl.innerHTML;
            }, 0);
        } else {
            ul.innerHTML = '';
        }
    };
    
    /*
     * Function to transform the input into an autocomplete input
     * 
     * @param options: object
     * 
     */ 
    function buildAutoComplete(options) {
        var nav = document.createElement('nav');
        var ul = document.createElement('ul');
        var displayOptions = options.displayOptions;
        var displayInput = options.displayInput;
        var activeItem;
        
        nav.setAttribute('class', 'ink-navigation');
        ul.setAttribute('class', 'menu vertical');
        nav.appendChild(ul);

        buildOptions(ul, options.source, undefined, options.itemTemplate, options.bindingContext, options.minFilterLength);
        displayOptions.appendChild(nav);
        
        // Handle input focus
        inkEvt.observe(displayInput, 'focus', function() {
            buildOptions(ul, options.source, displayInput.value, options.itemTemplate, options.bindingContext, options.minFilterLength);
            displayOptions.style.display = 'block';

            window.setTimeout(function() {
                displayInput.select();
            }, 100);
        });

        inkEvt.observe(displayInput, 'blur', function() {
            window.setTimeout(function() {
                displayOptions.style.display = 'none';
                if (activeItem) {
                    activeItem.setAttribute('class', '');
                    activeItem = undefined;
                } else {
                    options.change();
                }
            }, 200);
        });

        // List option selected
        inkEvt.observe(displayOptions, 'click', function(event) {
            activeItem = inkEvt.element(event);
            var inputValue = activeItem.getAttribute('data-label');
            
            displayInput.value = inputValue;
            options.change({label: inputValue, value: activeItem.getAttribute('data-value')});
            buildOptions(ul, options.source, inputValue, options.itemTemplate, options.bindingContext, options.minFilterLength);
        }, true);
        
        // Key entered in input control
        inkEvt.observe(displayInput, 'keyup', function(event) {
           var inputValue;
           var element;
           var keyCode;

           keyCode = event.keyCode;
           // Handle arrow keys and return
           if ( (keyCode == inkEvt.KEY_DOWN) || 
                (keyCode == inkEvt.KEY_UP) || 
                (keyCode == inkEvt.KEY_RETURN) || 
                (keyCode == inkEvt.KEY_LEFT) || 
                (keyCode == inkEvt.KEY_RIGHT) ) {
               inkEvt.stop(event);
               
               if (keyCode == inkEvt.KEY_DOWN) {
                   if (!activeItem && ul.firstChild) {
                       activeItem = ul.firstChild;
                       activeItem.setAttribute('class', 'active');
                       return;
                   }
                   
                   if (activeItem && inkEl.nextElementSibling(activeItem)) {
                       activeItem.setAttribute('class', '');
                       activeItem = inkEl.nextElementSibling(activeItem);
                       activeItem.setAttribute('class', 'active');
                   }
               }
               
               if (keyCode == inkEvt.KEY_UP) {
                   if (activeItem && (activeItem == ul.firstChild)) {
                       activeItem.setAttribute('class', '');
                       activeItem = undefined;
                       displayInput.select();
                       return;
                   }
                   
                   if (activeItem && inkEl.previousElementSibling(activeItem)) {
                       activeItem.setAttribute('class', '');
                       activeItem = inkEl.previousElementSibling(activeItem);
                       activeItem.setAttribute('class', 'active');
                   }
               }
               
               if (keyCode == inkEvt.KEY_RETURN) {
                   if (activeItem) {
                       element = Ink.s('a', activeItem);
                       inputValue = element.getAttribute('data-label');
                       displayInput.value = inputValue;
                       buildOptions(ul, options.source, inputValue, options.itemTemplate, options.bindingContext, options.minFilterLength);
                       displayInput.blur();
                       options.change({label: inputValue, value: element.getAttribute('data-value')});
                   }
               }
               
               return false;
           }
           
           activeItem = undefined;
           buildOptions(ul, options.source, displayInput.value, options.itemTemplate, options.bindingContext, options.minFilterLength);
           if (options.allowAny) {
        	   options.change();
           }
        });                    
    };
	
    /*
     * Ink + Knockout autoComplete binding 
     * 
     */
    ko.bindingHandlers.autoComplete = {
        /*
         * Knockout custom binding init
         * 
         */
        maxVisibleOptions: 20,
            
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var opt = new (function() {
            	this.dataSource = valueAccessor();
            	this.binding = allBindingsAccessor();
            	this.valueProp = ko.unwrap(this.binding.optionsValue);
            	this.labelProp = ko.unwrap(this.binding.optionsText) || this.valueProp;
            	this.allowAny = ko.unwrap(this.binding.allowAny);
            	this.element = element;
            	this.itemTemplate = ko.unwrap(this.binding.optionTemplate);
            	this.bindingContext = bindingContext;
            	this.minFilterLength = ko.unwrap(this.binding.minFilterLength);
            	this.style = ko.unwrap(this.binding.pickerStyle) || 'autocomplete';
            })();
            var mappedSource;
            var subscription;
            var placeholderText = opt.binding.attr && opt.binding.attr.placeholder ? opt.binding.attr.placeholder :  element.getAttribute('placeholder') || '';
            var childClass;
            var controlChild;

            element.style.display = 'none';
            
            if (opt.style == 'autocomplete') {
                childClass = 'append-button';
                controlChild = '<span><input placeholder="' + placeholderText + '" type="text"></input></span><div class="ink-button"><i class="fa fa-times"></i></div>';
            } else if (opt.style == 'search') {
                childClass = 'append-symbol';
                controlChild = '<span><input placeholder="' + placeholderText +'" type="search"></input><i class="fa fa-search"></i></span>';
            } else {
                throw 'Invalid picker style';
            }

            opt.displayElement = inkEl.htmlToFragment('<div class="pink-auto-complete control-group '+ element.getAttribute('class') +
                    '"><div class="control '+childClass+'">'+controlChild+'</div><div class="pink-auto-complete-options"></div></div>').firstChild;
            
            element.parentNode.insertBefore(opt.displayElement, element.nextSibling);
            
            opt.displayInput = Ink.s('input', opt.displayElement);
            opt.displayOptions = Ink.s('.pink-auto-complete-options', opt.displayElement);

            if (opt.style == 'autocomplete') {
                opt.displayButton = Ink.s('.ink-button', opt.displayElement);
                // Reset button click handler
                inkEvt.observe(opt.displayButton, 'mouseup', function() {
                    updateValueAndLabel(opt.binding, '', undefined, opt.displayInput, element);
                });
            }
            
            // handle the choices being updated in a computed, so the update function doesn't 
            // have to do it each time the value is updated.
            mappedSource = ko.computed(function () {
                return buildDataSource(opt.dataSource, opt.labelProp, opt.valueProp);
            }, viewModel);
            
            subscription = mappedSource.subscribe(function (newValue) {
                var ul = opt.displayOptions.firstChild.firstChild;

                opt.source = newValue;
                buildOptions(ul, buildDataSource(newValue, 'label', 'value'), opt.displayInput.value, opt.itemTemplate, opt.bindingContext, opt.minFilterLength);
            });

            opt.source = mappedSource();
            opt.change = handleValueChange;
            
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                subscription.dispose();
                mappedSource.dispose();
            });

            buildAutoComplete(opt);
        },

        
        /*
         * Knockout custom binding update
         * 
         * Updates the autocomplete based on a model change
         * 
         */
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var dataSource = valueAccessor();
            var binding = allBindingsAccessor();
            var allowAny = ko.unwrap(binding.allowAny);
            var valueProp = ko.unwrap(binding.optionsValue);
            var labelProp = ko.unwrap(binding.optionsText) || valueProp;
            var displayElement = element.nextSibling;
            var displayInput = Ink.s('input', displayElement);
            var modelValue = binding.value;
            var currentModelValue;
            var selectedItem;
            var displayText;
            
            if (modelValue) {
                currentModelValue = ko.unwrap(modelValue);
                
                //Set the hidden box to be the same as the viewModels Bound property
                element.value = currentModelValue;

                // If the value is different from the label's, let's find the corresponding label 
                if (valueProp != labelProp) {
                    //Go through the source and find the id, and use its label to set the autocomplete
                    selectedItem = findSelectedItem(dataSource, binding, currentModelValue);
                    
                    if (selectedItem) {
                        displayText = labelProp ? ko.unwrap(selectedItem[labelProp]) : ko.unwrap(selectedItem).toString();
                        displayInput.value = displayText;
                    } else if (!allowAny || (currentModelValue == undefined)) {
                        displayInput.value = '';
                    } else {
                        displayInput.value = currentModelValue;
                    }
                } else {
                    if (currentModelValue !== undefined) {
                        displayInput.value = currentModelValue;
                    } else {
                        displayInput.value = '';
                    }
                }
            }
        }
    };
    
    return {};
});
