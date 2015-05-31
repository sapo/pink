Ink.createModule('App.Tasks.EditTask', '1', ['Pink.Data.Binding_1', 'App.Tasks.DataProvider', 'App.Tasks', 'Pink.Data.AutoComplete_1'], function(ko, dataProvider, app) {
    'use strict';

    var Module = function() {
    	var self=this;
    	
        this.moduleName = 'App.Tasks.EditTask';
        this.subject = ko.observable('');
        this.description = ko.observable('');
        this.phoneNumber = ko.observable('');
        this.date = ko.observable('');
        this.status = ko.observable('');
        this.task = undefined;

        this.otherTasks = ko.observableArray();
        this.dependentTask = ko.observable();
        
        this.invalidSubject = ko.computed(function() {
        	return self.subject().trim().length == 0;
        });
    };

    Module.prototype.initialize = function(data) {
    	var tasks = [], otherTasks;
    	var i;
    	
    	this.otherTasks([]);
    	otherTasks = dataProvider.listTasks();
    	
    	if (!data.id) {
    		this.task=undefined;

    		this.subject('');
    		this.description('');
    		this.phoneNumber('');
    		this.date('');
    		this.status('todo');
    		this.otherTasks(otherTasks);
    		this.dependentTask(undefined);
    	} else {
    		this.task = dataProvider.getTask(data.id);

    		this.subject(this.task.subject);
    		this.description(this.task.description);
    		this.phoneNumber(this.task.phoneNumber);
    		this.date(this.task.date);
    		this.status(this.task.status);
    		this.dependentTask(this.task.dependentTask);

    		for (i=0; i<otherTasks.length; i++) {
    			if (otherTasks[i]._id != this.task._id) {
    				tasks.push(otherTasks[i]);
    			}
    		}
    		
    		this.otherTasks(tasks);
    	}
    };

    Module.prototype.removeTask = function() {
    	var self=this;
    	
    	app.showConfirm('Please confirm...', 'Remove the item?', function() {
    		dataProvider.deleteTask(self.task);
    		app.signals.taskUpdated.dispatch();
        	app.navigateTo(self.task.status);
    	});
    };
    
    Module.prototype.saveTask = function() {
    	if (this.invalidSubject()) {
    		return;
    	}
    	
    	if (!this.task) { // New Task
    		this.task = {
    			subject: this.subject(),
    			description: this.description(),
    			phoneNumber: this.phoneNumber(),
    			date: this.date(),
    			status: this.status(),
    			dependentTask: this.dependentTask()
    		};
    		
    		dataProvider.addTask(this.task);
    		
    		app.signals.taskAdded.dispatch(this.task);
    	} else {
    		this.task.subject = this.subject();
    		this.task.description = this.description();
    		this.task.phoneNumber = this.phoneNumber();
    		this.task.date = this.date();
    		this.task.status = this.status();
    		this.task.dependentTask = this.dependentTask();
    		
    		dataProvider.updateTask(this.task);
    		
    		app.signals.taskUpdated.dispatch(this.task);
    	}
    	
    	app.navigateTo(this.task.status);
    };
    
    return new Module();
});
