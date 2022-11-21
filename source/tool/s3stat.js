var S3stat = {
	host: "https://www.s3stat.com"
	//host: "http://dev.s3stat"
	, clientVersion: 12

};


S3stat.login = function(callback)
{
	var url = S3stat.host + "/API/GetUser.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	$.ajax(url, {
		type: "POST",
		dataType: "text",
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};


S3stat.getOrCreateS3StatAccount = function(callback)
{
	var url = S3stat.host + "/API/GetS3Account.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password)
		+ "&awsaccountid=" + escape(AppState.AWSAccountID)
		+ "&clientversion=" + S3stat.clientVersion
		+ "&createifmissing=1";

	$.ajax(url, {
		type: "POST",
		dataType: "text",
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};

S3stat.setS3Account = function(json, callback)
{
	var url = S3stat.host + "/API/SetS3Account.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	$.ajax({
		type: "POST",
		contentType: "text/json",
		url: url,
		data: json,
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};

S3stat.setEndpoint = function(json, callback)
{
	var url = S3stat.host + "/API/SetEndpoint.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	$.ajax({
		type: "POST",
		contentType: "text/json",
		url: url,
		data: json,
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};

S3stat.deleteEndpoint = function(endpoint, callback)
{
	var url = S3stat.host + "/API/DeleteEndpoint.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	var postData;
	if (endpoint.IsS3)
	{
		postData = { "bucketid": endpoint.BucketID };
	}
	else
	{
		postData = { "distributionid": endpoint.DistributionID };
	}

	$.ajax({
		type: "POST",
		url: url,
		data: postData,
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};


S3stat.verifyRoleAccess = function(endpoint, callback)
{
	var url = S3stat.host + "/API/VerifyRoleAccess.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	var postData;
	if (endpoint.IsS3)
	{
		postData = { "bucketid": endpoint.BucketID };
	}
	else
	{
		postData = { "distributionid": endpoint.DistributionID };
	}

	$.ajax({
		type: "POST",
		url: url,
		data: postData,
		complete: function(data)
		{
			console.log("verifyRoleAccess", data);
			S3stat.callback(data, callback);
		}
	});
};

S3stat.noteException = function(msg, stack, context, handled, callback)
{
	var url = S3stat.host + "/API/NoteException.aspx?username="
		+ escape(AppState.UserName) + "&password=" + escape(AppState.Password);

	var postData = {
		"message": msg + "\n" + stack,
		"context": context,
		"handled": handled ? 1 : 0
	};

	$.ajax({
		type: "POST",
		url: url,
		data: postData,
		complete: function(data)
		{
			S3stat.callback(data, callback);
		}
	});
};

S3stat.callback = function(data, callback)
{
	var err = null;
	if (data.responseText.indexOf("-1") == 0)
	{
		err = data.responseText.substr(2);
	}
	callback && callback(err, data.responseText);
}

