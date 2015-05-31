/**
 * @module Pink.Data.Module_1
 * @author hlima, ecunha, ttt
 * @desc Helper binding that allows declarative module loading/binding  
 *       based on knockout-amd-helpers 0.2.5 | (c) 2013 Ryan Niemeyer |  http://www.opensource.org/licenses/mit-license
 * @version 1
 */    
Ink.createModule('Pink.Data.Module', '1', ['Pink.Data.Binding_1'], function(ko) {
    'use strict';

    var NO_CACHE=true;
    
    /*
     * Function to asynchronously load the required template
     * Note: you can redefine the template file name by setting the ko.bindingHandlers.module.templateName config parameter (eg. 'tpl.android.html')
     *  
     */ 
    var loadTemplate = function(moduleName, callback) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState==4 && xhr.status==200) {
                callback(xhr.responseText);
            }
        };

        xhr.open("GET", Ink.getPath(moduleName).replace('lib.js', (ko.bindingHandlers.module.templateName || 'tpl.html'))+(NO_CACHE?'?'+Math.floor(Math.random()*1001):''), true);
        xhr.send();
    };
    
    
    //  helper functions
    var unwrap = ko.utils.unwrapObservable,
        //call a constructor function with a variable number of arguments
        construct = function(Constructor, args) {
            var instance,
            Wrapper = function() {
                return Constructor.apply(this, args || []);
            };
    
            Wrapper.prototype = Constructor.prototype;
            instance = new Wrapper();
            instance.constructor = Constructor;
    
            return instance;
        },
        addTrailingSlash = function(path) {
            return path && path.replace(/\/?$/, "/");
        },
        disposeViewModel = function(element, viewModel, finalizer, disposeCallback) {
            // If the view model has an appropriate finalizer function, then call it
            if (viewModel[finalizer]) {
                viewModel[finalizer].apply(viewModel);
            }
            
            // If defined, run this callback to notify that the old module is to be destroyed (eg. run UI transition)
            if (disposeCallback && (typeof disposeCallback == "function") ) {
                disposeCallback(element);
            }
        };

        
    /*
     * Helper binding that allows declarative module loading/binding
     * 
     */ 
    ko.bindingHandlers.module = {
            init: function(element, valueAccessor, allBindingsAccessor, data, context) {
                var value = valueAccessor(),
	                options = unwrap(value),
	                templateBinding = {},
	                initializer = ko.bindingHandlers.module.initializer || "initialize",
	                finalizer = ko.bindingHandlers.module.finalizer || "finalize",
	                notifyReady,
	                notifyBeforeDestroy;

                //build up a proper template binding object
                if (options && typeof options === "object") {
                    //initializer/finalizer function names can be overridden
                    initializer = options.initializer || initializer;
                    finalizer = options.finalizer || finalizer;
                    notifyReady = options.notifyReady;
                    notifyBeforeDestroy = options.notifyBeforeDestroy;

                    if (options["templateEngine"]) {
                        templateBinding.templateEngine = options["templateEngine"]; 
                    }
                }

                templateBinding.name = function() {
                    var template = unwrap(value);
                    return ((template && typeof template === "object") ? unwrap(template.template || template.name) : template) || "";
                };

                //set the data to an observable, that we will fill when the module is ready
                templateBinding.data = ko.observable();
                templateBinding["if"] = templateBinding.data;

                // The after render method will be called on the view model after the template renders the view
                templateBinding.afterRender = function(elements) {
                    // Only call "afterRender" if the loaded nodes are element or comment nodes (sanity check)
                    if (elements && elements.length>0 && ((elements[0].nodeType==1) || (elements[0].nodeType==8))) {
                        // The viewmodel must be a valid one
                        if (templateBinding.data()) {
                            // Run this method on the loaded view model
                            if (typeof templateBinding.data()['afterRender'] == "function") { 
                                templateBinding.data()["afterRender"](elements);
                            }

                            // Run this method on the host view model
                            if (notifyReady && (typeof notifyReady == "function") ) {
                                notifyReady(element);
                            }
                        }
                    }
                };

                // Actually apply the template binding that we built
                ko.applyBindingsToNode(element, { template: templateBinding },  context);
                
                // Setup custom disposal login to run when the node is removed
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    var oldModule = templateBinding.data();
                    
                    if (oldModule) {
                        disposeViewModel(element, oldModule, finalizer, notifyBeforeDestroy);
                    }
                });

                // Use a computed to force a re-bind when the module name changes
                ko.computed({
                    read: function() {
                        //module name could be in an observable
                        var moduleName = unwrap(value),
                            oldModule = templateBinding.data.peek(), //don't create a dependency 
                            initialArgs;

                        //observable could return an object that contains a name property
                        if (moduleName && typeof moduleName === "object") {
                            //get the current copy of data to pass into module
                            initialArgs = [].concat(unwrap(moduleName.data));

                            //name property could be observable
                            moduleName = unwrap(moduleName.name);
                        }

                        if (oldModule) {
                            disposeViewModel(element, oldModule, finalizer, notifyBeforeDestroy);
                        }
                        
                        // Destroy the old module
                        templateBinding.data(null);

                        //at this point, if we have a module name, then retrieve it via ink require
                        if (moduleName) {
                            // Prevent Ink's requireModule re-entrance bug
                            window.setTimeout(function() {
                                Ink.requireModules([addTrailingSlash(ko.bindingHandlers.module.baseDir) + moduleName], function(mod) {
                                    //if it is a constructor function then create a new instance
                                    if (typeof mod === "function") {
                                        mod = construct(mod, initialArgs);
                                    }
                                    else {
                                        //if it has an appropriate initializer function, then call it
                                        if (mod && mod[initializer]) {
                                            //if the function has a return value, then use it as the data
                                            mod = mod[initializer].apply(mod, initialArgs) || mod;
                                        }
                                    }
    
                                    //update the data that we are binding against
                                    templateBinding.data(mod);
                                });
                            }, 0);
                        }
                    },
                    disposeWhenNodeIsRemoved: element
                });

                return { controlsDescendantBindings: true };
            },
            baseDir: "",
            templateCache: {}
    };

    
    //  support KO 2.0 that did not export ko.virtualElements
    if (ko.virtualElements) {
        ko.virtualElements.allowedBindings.module = true;
    }


    /* 
     *  Template engine that uses XmlHttpRequest to pull the templates
     *  (overrides the default ko template engine)
     *  
     */
    (function(ko) {
        //get a new native template engine to start with
        var engine = new ko.nativeTemplateEngine(),
            sources = ko.bindingHandlers.module.templateCache;

        /*
         * Comment from source for integration with Ink
         * The template's path is derived from the Ink module's name
         */

        //create a template source that loads its template using XmlHttpRequest
        ko.templateSources.requireTemplate = function(key) {
            this.key = key;
            this.template = ko.observable(" "); //content has to be non-falsey to start with
            this.requested = false;
        };

        ko.templateSources.requireTemplate.prototype.text = function(value) {
            //when the template is retrieved, check if we need to load it
            if (!this.requested && this.key) {
                loadTemplate(this.key, this.template);

                this.requested = true;
            }

            //if template is currently empty, then clear it
            if (!this.key) {
                this.template("");
            }

            //always return the current template
            if (arguments.length === 0) {
                return this.template();
            }
        };

        //our engine needs to understand when to create a "requireTemplate" template source
        engine.makeTemplateSource = function(template, doc) {
            var el;

            //if a name is specified, then use the
            if (typeof template === "string") {
                //if there is an element with this id and it is a script tag, then use it
                el = (doc || document).getElementById(template);

                if (el && el.tagName.toLowerCase() === "script") {
                    return new ko.templateSources.domElement(el);
                }

                //otherwise pull the template in using our loading method (XmlHttpRequest)
                if (!(template in sources)) {
                    sources[template] = new ko.templateSources.requireTemplate(template);
                }

                //keep a single template source instance for each key, so everyone depends on the same observable
                return sources[template];
            }
            //if there is no name (foreach/with) use the elements as the template, as normal
            else if (template && (template.nodeType === 1 || template.nodeType === 8)) {
                return new ko.templateSources.anonymousTemplate(template);
            }
        };

        //make this new template engine our default engine
        ko.setTemplateEngine(engine);

    })(ko);

    return ko;
});
