/*! Jiffy
 *  By: Matthew Robb
 */

(function(window, $){
		
	// Factory library object, will receive global scope exposure
	var Jiffy = window.Jiffy = function(event, callback){
	
		// Start or stop the engine 
		if(!event && !callback) (Jiffy.status !== "started" ? Jiffy.start : Jiffy.stop)();
	
		// Push event and callback to the bind method
		else Jiffy.bind(event, callback);
	
	}

	// Give the factory jQuery's extremely useful extend method
	Jiffy.extend = $.extend;

	/*
		- Add some environment variables to the factory
		@status 'started' or 'stopped', stores the system state
		@source stores the flickr url
		@timer is a reference to the timer object used for polling
		@delay is the amount of time in ms between polls
		@updates a count of the number of new photos
		@total a count of the number of NON new photos
		@random stores a boolean determining if we will randomize the number of photos to fetch
		@events specific methods get an event array to house callbacks
		@photos stores two buckets of photos, new and non-new
		@flickr stores the api variables for making flickr requests
	*/
	Jiffy.extend({
		status: "stopped",
		source: "https://api.flickr.com/services/rest/?method=flickr.photos.getRecent",
		timer: null,
		delay: 14000,
		updates: 0,
		total: 0,
		random: true,
		events: { start: [], stop: [], update: [], reset: [] },
		photos: { updates: {}, all: {} },
		flickr: {
			"api_key": "81aacfc3187520fe3ed863602b59e3c1",
			"extras": "description, owner_name, url_sq, url_t, url_s, url_m, url_z, url_l, url_o",
			"per_page": "5",
			"nojsoncallback": 1,
			"format": "json"
		}
	});

	// Add Event menipulation methods
	Jiffy.extend({
	
		// Binds callbacks to system events
		bind: function(event, callback){
			if(Jiffy.events[event] && typeof callback === "function") Jiffy.events[event].push(callback);
		
			return Jiffy;
		},
		
		// Searches for the specified callback and attempts to remove it from the event binding
		unbind: function(event, callback){
			var events = Jiffy.events, funcs = [];
			
			if(events[event] && typeof callback === "function"){
				$.each(events[event], function(index, item){
					if(item !== callback) funcs.push(item);
				});

				events[event] = funcs;
			}
			
			return Jiffy;
		},
	
		// Triggers each callback for the specified event
		trigger: function(event, opts){
			// Loop through the callbacks for
			if(Jiffy.events[event].length) $.each(Jiffy.events[event], function(index, value){
				value.call(Jiffy, opts);
			});
		
			return Jiffy;
		}
		
	});

	// Add some methods for manipulating the engine
	Jiffy.extend({
	
		// Starts the engine
		start: function(callback){
			if(Jiffy.status !== "started") {
				Jiffy.status = "started";
				Jiffy.update();
				Jiffy.trigger("start");
				
				// Run the callback paramter if passed in
				if(typeof callback ==="function") callback.call(Jiffy);
			}
			
			return Jiffy;
		},
	
		// Stops the engine
		stop: function(callback){
			Jiffy.status = "stopped";
			if(Jiffy.timer) clearTimeout(Jiffy.timer);
			Jiffy.trigger("stop");
			
			// Run the callback paramter if passed in
			if(typeof callback ==="function") callback.call(Jiffy);
			
			return Jiffy;
		},
	
		// Resets the polling process
		reset: function(callback, opts){
			var status = Jiffy.status, updates = {};
		
			// Stop the polling process and set the updates count to 0
			Jiffy.stop();
			Jiffy.updates = 0;
		
			// Iterate over each photo in the updates bucket deleting it and adding it to the all bucket
			$.each(Jiffy.photos.updates, function(key, value){
				updates[key] = Jiffy.photos.all[key] = value;
				delete Jiffy.photos.updates[key];
			});
		
			// If the polling WAS active upon call of reset we will start it back up again
			if(status === "started") Jiffy.start();
			
			Jiffy.trigger("reset", updates);
			
			// Run the callback paramter if passed in
			if(typeof callback ==="function") callback.call(Jiffy, updates);
					
			return Jiffy;
		},
	
		// Get's updated lists from the source
		update: function(callback){
			var url = Jiffy.source, updates = {};
			
			// If random is se to true we will randomize the number of photos to fetch
			if(Jiffy.random === true) Jiffy.flickr["per_page"] = Math.floor((Math.random() * 5) + 1);

			// Assembles the final API url out of the flickr variables
			$.each(Jiffy.flickr, function(key, value){ url += "&" + key + "=" + value });
			
			// Send the API request
			// $.getScript(url); <- no longer works due to SSL in dropbox and google drive 4/9/2013
			$.getJSON(url).then(Jiffy.jsonp);
		console.log(url)
			return Jiffy;
		},
		
		
		// JSONP callback function
		jsonp: function(result){
			var obj = result, updates = {};
					console.log(result)
			// Loop through the new photos and make sure they don't already exist before adding them to the list
			$.each(obj.photos.photo, function(index, item){
				if( !Jiffy.photos.all[item.id] && !Jiffy.photos.updates[item.id] && (Jiffy.updates+=1))
					updates[item.id] = Jiffy.photos.updates[item.id] = item;
			});
		
			// Start a timer until the next poll
			if(Jiffy.status === "started" && typeof Jiffy.delay === "number") Jiffy.timer = setTimeout(Jiffy.update, Jiffy.delay)
		
			// Trigger the update callbacks
			Jiffy.trigger("update", updates);
			
			// Run the callback paramter if passed in
			if(typeof callback ==="function") callback.call(Jiffy, updates);
		}
	
	});
	
})(this, jQuery)
