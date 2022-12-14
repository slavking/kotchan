//var ip2cc = require('ip2cc');
//var spawn = require('child_process').spawn;
//var geoip = require('geoip');
//var City = geoip.City;
//var city = new City('GeoLiteCity.dat');

const geoip = require("geoip-lite");
const conversionTable = require('./fips_conversion');

var get_user_ip = require('./get-user-ip');
var config = require('../../config');

var default_country = "UN";

var regional_flags = ["SE-21", "KR-11", "HU-05", "GB-V2", "SE-28", "GB-I2", "GB-H9", "SE-26"];
var full_countries = ["US", "AU", "CA", "DE", "PL", "GR", "RU", "FI", "UA", "BR",
    "NO", "JP", "NL", "RS", "MD", "FR", "IE", "AR", "HR", "AT",
    "BE", "BG", "BY", "CL", "CN", "CZ", "ES", "IT", "LU", "MN",
    "MX", "MY", "OM", "TR"
];
var country_names = {"BE": "Belgium", "FR": "France", "BG": "Bulgaria", "HR": "Croatia", "DE": "Germany", "JP": "Japan", "HU": "Hungary", "BR": "Brazil", "FI": "Finland", "BY": "Belarus", "GR": "Greece", "RU": "Russian Federation", "NL": "Netherlands", "NO": "Norway", "TR": "Turkey", "LU": "Luxembourg", "PL": "Poland", "CN": "China", "CL": "Chile", "CA": "Canada", "IT": "Italy", "CZ": "Czech Republic", "AR": "Argentina", "AU": "Australia", "AT": "Austria", "IE": "Ireland", "ES": "Spain", "MD": "Moldova, Republic of", "OM": "Oman", "UA": "Ukraine", "MN": "Mongolia", "US": "United States", "KR": "Korea, Republic of", "MY": "Malaysia", "MX": "Mexico", "SE": "Sweden", "GB": "United Kingdom", "RS": "Serbia", "DK": "Denmark"};


function get_country(req, data, callback) {
    delete require.cache[require.resolve('../../config')];
    var config = require('../../config');
    /* get IP */
    var user_ip = get_user_ip(req, false);
    // Exceptions for bots
    if (req.cookies.password_livechan ==  config.no_limit_cookie && req.body.country) {
        data.country = req.body.country;

       if (country_names[req.body.country.split('-')[0]]) {
	        data.country_name = country_names[req.body.country.split('-')[0]];
	} else {
		data.country_name = req.body.country; // this is a temp fix until we get either a different country_names array or a bigger one
	}
        return callback();
    }
    // Exceptions in config
    for(i in config.ip_exceptions) {
        if(user_ip.indexOf(i) == 0){
            data.country = config.ip_exceptions[i];
            data.country_name = country_names[config.ip_exceptions[i].split('-')[0]];
            return callback();
        }
    }
    
    try {
        const geoData = geoip.lookup(user_ip);
        
        if (!geoData) {
            return callback();
        }

        console.log(geoData);

	    //stef Thu Jun 30 08:52:20 UTC 2022
        //data.country = geoData.country; // TODO: get full name based on code
	data.country = conversionTable[data.country] || geoData.country;
        data.country_name = geoData.country;


        data.latitude = geoData.ll[0];
        data.longitude = geoData.ll[1];

        // TODO: fix somehow, another geoip lib maybe?
        if (!data.no_region) {
            if ((full_countries.indexOf(geoData.country) > -1) && geoData.region) {
            
                data.country += "-" + geoData.region;
                data.country = conversionTable[data.country] || data.country;
            } else if (geoData.region && (regional_flags.indexOf(data.country + "-" + geoData.region) > -1)) {
                data.country += "-" + c_data.region;
            }
            if(data.country == 'UA-20') {
                data.country = 'RU-94';
                data.country_name = country_names['RU'];
            }
            if(data.country == 'UA-11') {
                data.country = 'RU-82';
                data.country_name = country_names['RU'];
            }

        }
        return callback();
    } catch (e) {
        console.log(e,"city lookup error", user_ip);
        data.country = default_country;
        return callback(new Error('proxy'));
    }


    // old
    // geoip
    city.lookup(user_ip, function(err, c_data) {
        if (err) {
            console.log(err,"city lookup error",user_ip);
            data.country = default_country;
            //callback();
            return callback(new Error('proxy'));
        }

        if (c_data) {
            data.country = c_data.country_code;
	        data.country_name = c_data.country_name;
            data.latitude = c_data.latitude;
            data.longitude = c_data.longitude;

            if (!data.no_region) {
                /*if ((user_ip in ip_exceptions) || (!c_data.region && (user_ip in ip_exceptions))) {
                    c_data.region = ip_exceptions[user_ip];
                }
                for(i in config.ip_exceptions) {
                    if(user_ip.indexOf(i) == 0) c_data.region = config.ip_exceptions[i];
                }*/
                if ((full_countries.indexOf(c_data.country_code) > -1) && c_data.region) {
                    data.country += "-" + c_data.region;
                } else if (c_data.region && (regional_flags.indexOf(data.country + "-" + c_data.region) > -1)) {
                    data.country += "-" + c_data.region;
                }
                if(data.country == 'UA-20') {
                    data.country = 'RU-94';
                    data.country_name = country_names['RU'];
                }
                if(data.country == 'UA-11') {
                    data.country = 'RU-82';
                    data.country_name = country_names['RU'];
                }
            }
            return callback();
        } else {
            return callback();
            //return callback(new Error('proxy'));
        }
        
        // callback();
    });

    // IP2CC
    /*ip2cc.lookUp(user_ip, function(ipaddress, country) {
	    if (country) {
	        data.country = country;
	        callback();
	    } else {
	        data.country = default_country;
	        callback();
	    }
	});*/
    // ipinfo.io
    /* set up a curl call to ipinfo.io 
	try {
		var command = "curl";
		var args = ["http://api.hostip.info/get_json.php?ip="+user_ip];
		var process = spawn(command, args);
		var stdout = "";
		var stderr = "";
		process.stdout.on("error", function(e) {console.log(e);data.country = default_country;}).on("data", function(ldata) {stdout += ldata});
	    process.stderr.on("error", function(e) {console.log(e);data.country = default_country;}).on("data", function(ldata) {data.country = default_country;});
	    process.on("close", function(code) {
	        if (code !== 0) {
	            console.log('metadata command returned error', code, command, stderr);
	            callback();
	        }
	        var json_data = stdout;
	        
	
	        var metadata;
	        try {
	            metadata = JSON.parse(json_data);
	        } catch(e) {
	            console.log('command returned unparseable metadata', command, stderr, JSON.stringify(stdout));
	            callback();
	        }

	        data.country = metadata.country_code;
	        console.log(data.country, metadata);
			callback();
	   });
	   
   } catch (e) {
	   console.log('unable to get country', e, user_ip);
	   data.country = default_country;
	   callback();
   }*/
}

module.exports = function(req, data, callback) {
    if (data.special) {
        switch (data.special) {
            case "country":
                return get_country(req, data, callback);
            default:
                return callback();
        }
    }
    return callback();

};
