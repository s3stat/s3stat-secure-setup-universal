'use strict';

var EndpointList = {
	lastRenderTime: new Date()
};

EndpointList.populate = function()
{
	if (!AppState.UserName || !AppState.Password || !AppState.AWSAccessKey || !AppState.AWSSecretKey || !AppState.AWSAccountID)
	{
		tool.load("credentials.html");
		return;
	}

	AppState.Endpoints = [];
	AppState.BucketNames = [];
	AppState.S3statXML = null;

	EndpointList.populateS3stat();
	EndpointList.populateDistributions();
	EndpointList.populateStreamingDistributions();
	EndpointList.populateBuckets();

}

EndpointList.populateBuckets = function()
{
	AWSHelper.listBuckets(function(err, data)
	{
		if (err)
		{
			tool.error("Insufficient permissions on your IAM User.", "Couldn't read S3 bucket list.", err, "ListBuckets");
			console.log(err);
			return;
		}

		for (var i = 0; i < data.Buckets.length; i++)
		{
			var b = data.Buckets[i].Name;
			var e = new Endpoint();

			e.Id = b;
			e.Type = Endpoint.EndpointType.S3;
			e.BucketName = b;
			e.Title = b;
			e.Subtitle = "";
			e.IsCloudfront = false;
			e.HasReports = false;
			e.IsS3 = true;
			e.IsS3stat = false;
			e.IsStreaming = false;
			e.IsLoggingKnown = false;
			e.IsS3statKnown = false;
			e.LogBucketName = b;
			e.LogPath = "";
			e.LogPrefix = "logs/";

			AppState.Endpoints.push(e);
			AppState.BucketNames.push(b);
			EndpointDetail.update(e);
		}

		EndpointList.bucketsReady = true;

		EndpointList.sortEnpdoints();
		EndpointList.render();
		EndpointList.integrateS3stat();
		EndpointList.populateLogging(Endpoint.EndpointType.S3, EndpointList.populateLoggingS3);

		EndpointDetail.populateBucketList();
	});

}

EndpointList.populateDistributions = function()
{
	AWSHelper.listDistributions(function(err, data)
	{
		if (err)
		{
			// We'll assume this means they simply don't have Cloudfront service.
			console.log(err);
			//tool.error("Insufficient permissions on your IAM User.", "Couldn't read Cloudfront Distribution list.", err, "ListDistributions");
			return;
		}
		// TODO: truncated lists

		for (var i = 0; i < data.DistributionList.Items.length; i++)
		{
			var d = data.DistributionList.Items[i];
			var e = new Endpoint();

			if (!d.Origins || !d.Origins.Items[0])
			{
				continue;
			}
			var origin = d.Origins.Items[0].DomainName.replace(".s3.amazonaws.com", "");

			e.Id = d.Id;
			e.Type = Endpoint.EndpointType.Cloudfront;
			e.BucketName = origin;
			e.AWSDistributionID = d.Id;
			e.Title = origin;
			e.Subtitle = d.Id;
			e.IsCloudfront = true;
			e.HasReports = false;
			e.IsS3 = false;
			e.IsS3stat = false;
			e.IsStreaming = false;
			e.IsLoggingKnown = false;
			e.IsS3statKnown = false;
			e.LogBucketName = origin;
			e.LogPath = "";
			e.LogPrefix = "cflog/";

			AppState.Endpoints.push(e);
			EndpointDetail.update(e);
		}

		EndpointList.sortEnpdoints();
		EndpointList.render();
		EndpointList.integrateS3stat();
		EndpointList.populateLogging(Endpoint.EndpointType.Cloudfront, EndpointList.populateLoggingCF);
	});
}


EndpointList.populateStreamingDistributions = function()
{
	AWSHelper.listStreamingDistributions(function(err, data)
	{
		if (err)
		{
			// No cloudfront service?
			console.log(err);
			return;
		}

		for (var i = 0; i < data.StreamingDistributionList.Items.length; i++)
		{
			var d = data.StreamingDistributionList.Items[i];
			var e = new Endpoint();

			if (!d.S3Origin || !d.S3Origin.DomainName)
			{
				continue;
			}
			var origin = d.S3Origin.DomainName.replace(".s3.amazonaws.com", "");

			e.Id = d.Id;
			e.Type = Endpoint.EndpointType.Streaming;
			e.BucketName = origin;
			e.AWSDistributionID = d.Id;
			e.Title = origin;
			e.Subtitle = d.Id;
			e.IsCloudfront = true;
			e.HasReports = false;
			e.IsS3 = false;
			e.IsS3stat = false;
			e.IsStreaming = true;
			e.IsLoggingKnown = false;
			e.IsS3statKnown = false;
			e.LogBucketName = origin;
			e.LogPath = "";
			e.LogPrefix = "streamlog/";

			AppState.Endpoints.push(e);
			EndpointDetail.update(e);
		}

		EndpointList.sortEnpdoints();
		EndpointList.render();
		EndpointList.integrateS3stat();
		EndpointList.populateLogging(Endpoint.EndpointType.Streaming, EndpointList.populateLoggingStreaming);
	});
}

EndpointList.populateLogging = function(type, populator)
{
	for (var i = 0; i < AppState.Endpoints.length; i++)
	{
		var e = AppState.Endpoints[i];

		if (e.Type == type)
		{
			populator(e);
		}
	}
}


EndpointList.populateLoggingS3 = function(e)
{

	AWSHelper.getBucketLogging(e.BucketName, function(err, data)
	{
		if (err)
		{
			console.log(err, e, "logging");
			tool.error("Insufficient permissions on your IAM User.", "Couldn't read S3 bucket logging.", err, "GetBucketLogging");
			return;
		}

		e.BucketLoggingConfig = data.LoggingEnabled;
		e.IsLoggingKnown = true;
		if (e.BucketLoggingConfig != null)
		{
			e.IsLogging = true;
			e.LogBucketName = data.LoggingEnabled.TargetBucket.replace(".s3.amazonaws.com", "");
			e.LogPrefix = data.LoggingEnabled.TargetPrefix;
		}

		EndpointList.render();
		EndpointDetail.update(e);
	});
};

EndpointList.populateLoggingCF = function(e)
{
	AWSHelper.getDistributionConfig(e.Id, function(err, data)
	{
		if (err)
		{
			console.log(err, e, "cf logging");
			tool.error("Couldn't read logging information for a Cloudfront Distribution. Insufficient permissions on your IAM User.", "GetDistributionLogging Error", err, "GetDistributionLogging");
			return;
		}

		e.DistributionConfig = data.DistributionConfig;
		e.ETag = data.ETag;
		e.IsLoggingKnown = true;
		if (e.DistributionConfig.Logging != null)
		{
			e.IsLogging = data.DistributionConfig.Logging.Enabled;
			if (e.IsLogging)
			{
				e.LogBucketName = data.DistributionConfig.Logging.Bucket.replace(".s3.amazonaws.com", "");
				e.LogPrefix = data.DistributionConfig.Logging.Prefix;
			}
		}

		EndpointList.render();
		EndpointDetail.update(e);
	});
};

EndpointList.populateLoggingStreaming = function(e)
{
	AWSHelper.getStreamingDistributionConfig(e.Id, function(err, data)
	{
		if (err)
		{
			console.log(err, e, "cf logging");
			tool.error("Couldn't read logging information for a Cloudfront Streaming Distribution. Insufficient permissions on your IAM User.", "GetStreamingDistributionLogging Error", err, "GetDistributionLogging");
			return;
		}


		e.StreamingDistributionConfig = data.StreamingDistributionConfig;
		e.ETag = data.ETag;
		e.IsLoggingKnown = true;
		if (e.StreamingDistributionConfig.Logging != null)
		{
			e.IsLogging = data.StreamingDistributionConfig.Logging.Enabled;
			if (e.IsLogging)
			{
				e.LogBucketName = data.StreamingDistributionConfig.Logging.Bucket.replace(".s3.amazonaws.com", "");
				e.LogPrefix = data.StreamingDistributionConfig.Logging.Prefix;
			}
		}

		EndpointList.render();
		EndpointDetail.update(e);
	});
};



EndpointList.populateS3stat = function(callback)
{
	S3stat.getOrCreateS3StatAccount(function(err, data)
	{
		if (err)
		{
			tool.error("Couldn't retrieve Account information from S3stat.", "Couldn't connect to S3stat.", err, "PopulateS3stat");
			console.log(err);
			callback && callback(err, data);
			return;
		}

		AppState.S3statXML = $(data);
		AppState.Account = {
			S3AccountID: parseInt(AppState.S3statXML.children("s3accountid").text()) || 0,
			UserID: parseInt(AppState.S3statXML.children("userid").text()) || 0,
			Handle: AppState.S3statXML.children("handle").text() || "",
			RoleExternalID: AppState.S3statXML.children("roleexternalid").text() || "",
			CanAssumeRole: AppState.S3statXML.children("canassumerole").text() == "true",
			CanCloudWatch: AppState.S3statXML.children("cancloudwatch").text() == "true"
		};

		callback && callback(err, data);
	});
}

EndpointList.integrateS3stat = function()
{
	if (!AppState.S3statXML)
	{
		// Chill until we have data to integrate.
		setTimeout(EndpointList.integrateS3stat, 100);
		return;
	}

	var account = AppState.S3statXML;
	account.find("CBucket").each(function(index, bucket)
	{
		var e = EndpointList.findEndpointById($(bucket).children("bucketname").text());
		if (e)
		{
			e.IsS3stat = true;
			e.HasReports = $(bucket).children("lastprocessed").text() != "";
			e.BucketID = parseInt($(bucket).children("bucketid").text()) || 0;
			EndpointDetail.update(e);
		}
	});

	account.find("CDistribution").each(function(index, dist)
	{
		var e = EndpointList.findEndpointById($(dist).children("awsdistributionid").text());
		if (e)
		{
			e.IsS3stat = true;
			e.BucketID = parseInt($(dist).children("bucketid").text()) || 0;
			e.DistributionID = parseInt($(dist).children("distributionid").text()) || 0;
			e.HasReports = $(dist).children("lastprocessed").text() != "";
			EndpointDetail.update(e);
		}
	});

	for (var i = 0; i < AppState.Endpoints.length; i++)
	{
		AppState.Endpoints[i].IsS3statKnown = true;
	}
	EndpointList.render();
}

EndpointList.findEndpointById = function(id)
{
	for (var i = 0; i < AppState.Endpoints.length; i++)
	{
		var e = AppState.Endpoints[i];
		if (e.Id == id)
		{
			return e;
		}
	}

	return null;
};

EndpointList.sortEnpdoints = function()
{
	AppState.Endpoints.sort(function(a, b)
	{
		return (a.Title.toLowerCase() < b.Title.toLowerCase()) ? -1 : 1;
	});
}

EndpointList.render = function()
{
	if (EndpointList.rendering || new Date() - EndpointList.lastRenderTime < 200)
	{
		EndpointList.pendingReRender = true;
		return;
	}
	EndpointList.rendering = true;

	EndpointList.lastRenderTime = new Date();
	var list = $("#list");
	list.empty();

	for (var i = 0; i < AppState.Endpoints.length; i++)
	{
		var e = AppState.Endpoints[i];

		var block = EndpointList.pattern.clone();
		block.find(".endpoint-title").text(e.Title);
		block.find(".endpoint-title").attr("title", e.Title);
		block.find(".endpoint-subtitle").text(e.Subtitle);
		block.attr("id", "endpoint_" + e.getSafeID());

		var tags = block.find(".tags");
		tags.append(EndpointList.createTag(e.Type, "info"));

		if (e.IsLoggingKnown)
		{
			if (e.IsLogging)
			{
				tags.append(EndpointList.createTag("Logging", "success"));
			}
			else
			{
				tags.append(EndpointList.createTag("Not Logging", "default"));
			}
		}

		if (e.IsS3statKnown)
		{
			if (e.IsS3stat)
			{
				tags.append(EndpointList.createTag("S3stat", "success"));
				if (e.HasReports)
				{
					tags.append(EndpointList.createTag("Reporting", "success"));
				}
				else
				{
					tags.append(EndpointList.createTag("Pending", "warning"));
				}
			}
			else
			{
				tags.append(EndpointList.createTag("Not Reporting", "default"));
			}
		}

		if (e.IsS3stat)
		{
			block.addClass("s3stat");
		}

		if (e.IsLoggingKnown && e.IsS3statKnown)
		{
			block.find(".loading-spinner").hide();
		}

		block[0].endpoint = e;

		block.on("click", function(evt)
		{
			EndpointDetail.populate(this.endpoint);
			EndpointList.highlightSelected();
		});

		list.append(block);
	}
	EndpointList.highlightSelected();

	EndpointList.rendering = false;
	if (EndpointList.pendingReRender)
	{
		EndpointList.pendingReRender = false;
		setTimeout(EndpointList.render, 500);
	}
}

EndpointList.highlightSelected = function()
{
	$(".endpoint.selected").removeClass("selected");
	if (EndpointDetail.currentEndpoint)
	{
		$("#endpoint_" + EndpointDetail.currentEndpoint.getSafeID()).addClass("selected");
	}
}

EndpointList.createTag = function(title, mood)
{
	return $('<span class="tag tag-' + mood + '">' + title + '</span>&nbsp;');
}
