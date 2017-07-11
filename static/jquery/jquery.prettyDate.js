/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

function getDaysBetweenDates(d0, d1) {
  var msPerDay = 8.64e7;

  // Copy dates so don't mess them up
  var x0 = new Date(d0);
  var x1 = new Date(d1);

  // Set to noon - avoid DST errors
  x0.setHours(12,0,0);
  x1.setHours(12,0,0);

  // Round to remove daylight saving errors
  return Math.round( (x1 - x0) / msPerDay );
}

// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time){
	var date = typeof(time) === 'object' ? time : new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = getDaysBetweenDates(date, new Date());
			
	if (isNaN(day_diff) || day_diff < 0)
		return '>_<';
			
	return day_diff == 0 && (
			diff < 60 && "刚刚" ||
			diff < 120 && "1 分钟前" ||
			diff < 3600 && Math.floor( diff / 60 ) + " 分钟前" ||
			diff < 7200 && "1 小时前" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " 小时前") ||
		day_diff == 1 && "昨天" ||
		day_diff == 2 && "前天" ||
		day_diff < 7 && day_diff + " 天前" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " 个星期前" ||
        time.toLocaleDateString();
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
	jQuery.fn.prettyDate = function(){
		return this.each(function(){
			var date = prettyDate(this.title);
			if ( date )
				jQuery(this).text( date );
		});
	};
