/**
 * @module Pink.App
 * @desc Application main module class (to be inherited by apps)
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.App', '1', ['Pink.Data.Binding_1', 'Pink.Plugin.Router_1', 'Ink.Dom.Element_1', 'Pink.Plugin.Signals_1', 'Pink.Data.Module_1'], function(ko, Router, element, Signal) {
    // App constructor
    var Module = function(rootRoute, undefinedRoute) {
        this._router = undefined;

        this._modalData = {
            title: ko.observable(),
            content: ko.observable(),
            width: ko.observable(),
            height: ko.observable(),
            cancelVisible: ko.observable(),
            confirmCaption: ko.observable()
        };

        this.modalModule = {
	    	name:'Pink.Data.ModalWindow_1', 
	    	data: {
	    		parent: this._modalData, 
	    		title: this._modalData.title, 
	    		contentModule: this._modalData.content, 
	    		modalWidth: this._modalData.width, 
	    		modalHeight: this._modalData.height,
	    		cancelVisible: this._modalData.cancelVisible,
	    		confirmCaption: this._modalData.confirmCaption
	    	}
        };
        
        this._alertData = {
            title: ko.observable()
        };

        this.alertModule = {
			name:'Pink.Data.ModalWindow_1', 
			data: {
				parent: this._alertData, 
				title: this._alertData.title, 
				contentModule: 'Pink.Data.ModalWindow.AlertBox_1', 
				modalWidth: '400px', 
				modalHeight: '200px'
			}
        };
        
        this._infoData = {
            title: ko.observable()
        };

        this.infoModule = {
			name:'Pink.Data.ModalWindow_1', 
			data: {
				parent: this._infoData, 
				title: this._infoData.title, 
				contentModule: 'Pink.Data.ModalWindow.InfoBox_1', 
				modalWidth: '600px', 
				modalHeight: '300px', 
				cancelVisible: false, 
				confirmCaption: 'Ok'
			}
        };
        
        this.rootRoute = rootRoute;
        this.undefinedRoute = undefinedRoute;

        this._defineRoutingMaps();

        this.mainModule = {
			name: this.definedRoutes.activeModule, 
			data: this.definedRoutes.moduleArgs 
        };
        
        this._setupSignals();
    };

    /*
     * Toast notifications API
     *
     */

    Module.prototype._showToast = function(message, type, delay) {
        var toast = element.create('div', {'class': 'ink-alert basic '+type});
        var panel = Ink.i('toastPanel');

        element.setTextContent(toast, message);
        panel.appendChild(toast);
        window.setTimeout(function() {element.remove(toast);}, delay);
    };

    Module.prototype.showInfoToast = function(message) {
        this._showToast(message, 'info', 2000);
    };

    Module.prototype.showErrorToast = function(message) {
        this._showToast(message, 'error', 5000);
    };

    Module.prototype.showSuccessToast = function(message) {
        this._showToast(message, 'success', 2000);
    };


    /*
     * Modal dialogs API
     *
     */
    Module.prototype.showMiniModalWindow = function(title, moduleName, params, modalStyle) {
        var style = modalStyle || {};

        style.width = '550px';
        style.height = '300px';

        this.showModalWindow(title, moduleName, params, style);
    };


    Module.prototype.showSmallModalWindow = function(title, moduleName, params, modalStyle) {
        var style = modalStyle || {};

        style.width = '800px';
        style.height = '500px';

        this.showModalWindow(title, moduleName, params, style);
    };

    Module.prototype.showLargeModalWindow = function(title, moduleName, params, modalStyle) {
        var style = modalStyle || {};

        style.width = '900px';
        style.height = '600px';

        this.showModalWindow(title, moduleName, params, style);
    };

    Module.prototype.showModalWindow = function(title, moduleName, params, modalStyle) {
        this._modalData.content(undefined);

        this._modalData.width(modalStyle.width);
        this._modalData.height(modalStyle.height);
        this._modalData.cancelVisible(modalStyle.cancelVisible);
        this._modalData.confirmCaption(modalStyle.confirmCaption);
        this._modalData.title(title);
        this._modalData.content(moduleName);
        this._modalData.modal.show(params);
    };

    Module.prototype.showConfirm = function(title, message, confirmCallback, cancelCallback) {
        this._alertData.title(title);
        this._alertData.modal.show({message: message, confirmCallback: confirmCallback, cancelCallback: cancelCallback});
    };

    Module.prototype.showInfoBox = function(title, message) {
        this._infoData.title(title);
        this._infoData.modal.show({message: message});
    };
    
    Module.prototype.showStandby = function() {
        var standbyPanel = document.getElementById('standbyLightBox');

        if (standbyPanel.className.indexOf(' visible') < 0) {
            standbyPanel.className+=' visible';
        }
    };

    Module.prototype.hideStandby = function() {
        window.setTimeout(function() {
            var standbyPanel = document.getElementById('standbyLightBox');

            if (standbyPanel.className.indexOf(' visible') >= 0) {
                standbyPanel.className=standbyPanel.className.replace(' visible', '');
            }
        }, 500);
    };

    /*
     * Define routing maps
     *
     */

    /*
     * Returns a list of routes to be rendered in the top navigation bar
     * (Method to be overriden by subclasses)
     *
     * Visible route example:
     * {isActive: ko.observable(true), caption: 'Home', hash: 'home', module: 'App.Example.Home'}
     *
     */
    Module.prototype.listVisibleRoutes = function() {
        return [];
    };


    /*
     * Returns a list of the routes used internally by the app
     * (Method to be overriden by subclasses)
     *
     * Invisible route example (search users view):
     * {hash: 'users\\?search=:search', module: 'App.Example.ListUsers', parentModule: 'App.Example.ListUsers'}
     *
     */
    Module.prototype.listInvisibleRoutes = function() {
        return [];
    };


    Module.prototype._defineRoutingMaps = function () {
        // Available routes definition
        this.definedRoutes = {
            visibleRoutes: this.listVisibleRoutes(),
            invisibleRoutes: this.listInvisibleRoutes(),
            activeModule: ko.observable(undefined),
            activeRoute: ko.observable(undefined),
            moduleArgs: ko.observable(undefined)
        };
    };

    /*
     * Allows a plugin to add a new visible route
     * The plugin should call this method on it's initialization code
     */
    Module.prototype.addVisibleRoute = function(route) {
        this.definedRoutes.visibleRoutes.push(route);
    };

    /*
     * Allows a plugin to add a new invisible route
     * The plugin should call this method on it's initialization code
     */
    Module.prototype.addInvisibleRoute = function(route) {
        this.definedRoutes.invisibleRoutes.push(route);
    };

    /*
     * This methods is responsible for:
     * - Initialize the routing maps and send them to the routing plugin.
     * - View change logic
     *
     */
    Module.prototype._buildRoutingMaps = function() {
        var self = this;
        var routeHashMap = {};
        var visibleRouteHashMap = {};
        var routes = [];
        var route;

        // Build the routing maps (visible + invisible)
        routes = this.definedRoutes.visibleRoutes.concat(this.definedRoutes.invisibleRoutes);

        // Initialize the visible routes map
        for (var i = 0; i < this.definedRoutes.visibleRoutes.length; i++) {
            route = this.definedRoutes.visibleRoutes[i];
            visibleRouteHashMap[route.hash] = route;
        }

        // Configure each route's callback function
        for (var i=0; i<routes.length; i++) {
            (function () {
                var route = routes[i];

                // The Router plugin will call this function with the arguments supplied by hash regex
                routeHashMap[route.hash] = function() {
                    var parameters;
                    var argumentsValues;
                    var values = {};

                    // Turn off all visible routes
                    for (var i = 0; i < self.definedRoutes.visibleRoutes.length; i++) {
                        self.definedRoutes.visibleRoutes[i].isActive(false);
                    }

                    // Clear the active module to prevent reloading the module when moduleArgs changes
                    self.definedRoutes.activeModule(undefined);


                    // -----------------------------------------------
                    // Set the module's initializer function arguments
                    // -----------------------------------------------

                    // Retrive the parameters name from the route hash
                    parameters = route.hash.match(/:[a-z]+/g);

                    // the Array's slice call is needed because arguments is not an Array
                    argumentsValues = Array.prototype.slice.call(arguments);

                    // Create an object with the parameters associated to the respective value
                    if(argumentsValues && parameters) {
                        for(var i = 0; i < argumentsValues.length; i++) {
                            values[parameters[i].replace(":", "")] = argumentsValues[i];
                        }
                    }

                    if (route.arguments) {
                        values = Ink.extendObj(values, route.arguments);
                    }

                    // Pass the parameters and its values to the module
                    self.definedRoutes.moduleArgs([values]);
                    // Set the active module and force rebinding
                    self.definedRoutes.activeModule(route.module);
                    self.definedRoutes.activeRoute(route);
                    // Send a signal telling to which view the app changed
                    self.signals.viewChanged.dispatch(route);

                    if (visibleRouteHashMap[route.hash]) {
                        visibleRouteHashMap[route.hash].isActive(true);
                    } else if (route.parentHash && visibleRouteHashMap[route.parentHash]) {
                        visibleRouteHashMap[route.parentHash].isActive(true);
                    }
                };
            })();
        }

        routeHashMap['*'] = function () {
            if(self.undefinedRoute) {
                self.navigateTo(self.undefinedRoute, false);
            } else {
                self.navigateToStart();
            }
        };

        this._router = new Router(routeHashMap);
    };

    /*
     * Signals setup
     *
     */


    /*
     * Build the app's custom signals (client side)
     * (Method to be overriden by subclasses)
     *
     * Add custom signals to this.signals
     *
     */
    Module.prototype.addCustomSignals = function() {
        /*
         * eg.:
         *
         * this.signals.userAdded = new Signal();
         */
    };


    Module.prototype._setupSignals = function() {
        var self = this;
        this.signals = {};

        // Core app signals
        this.signals.viewChanged = new Signal();
        this.signals.shellRendered = new Signal();
        this.signals.appReady = new Signal();

        this.addCustomSignals();
    };


    /*
     * Navigate to an internal app route path
     *
     * eg. app.navigateTo('user/1');
     *
     */
    Module.prototype.navigateTo = function(path, options) {
        Router.navigate(path, options);
    };

    /*
     * Navigate to the app's initial screen
     *
     */
    Module.prototype.navigateToStart = function() {
        if (this.rootRoute) {
            this.navigateTo(this.rootRoute);
        }
    };

    /*
     * Bootstrap plugins init
     *
     * Define custom modules to be loaded on startup.
     * Custom modules can define new routes and subscribe to client side events in their initialization code.
     */

    /*
     * Return an array with the module names of the plugins to be loaded on the app's bootstrap
     * Override this method in subclasses
     *
     * eg. ['App.Example.Plugins.Calendar']
     */
    Module.prototype.listPluginModules = function() {
        return [];
    };

    Module.prototype._loadPlugins = function(callback) {
        var self=this;

        window.setTimeout(function() {
            console.log('Loading plugins...');
            Ink.requireModules(self.listPluginModules(), function() {
                console.log('All plugins loaded.');
                callback();
            });
        }, 0);
    };

    /*
     * Application startup logic methods
     *
     */

    /*
     * The application entry point must call this method
     *
     */
    Module.prototype.run = function() {
        var self=this;

        this._loadPlugins(function() {
            self._buildRoutingMaps();
            self.ready();
        });
    };

    /*
     * Override this method to add your own custom initialization logic.
     * If you override this method, you must call start() when ready
     *
     */
    Module.prototype.ready = function() {
        this.start();
    };


    /*
     * Call this method only once when all the app's initialization code has run
     *
     */
    Module.prototype.start = function() {
        this.signals.appReady.dispatch();
        ko.applyBindings();
    };

    return Module;
});
