'use strict';

var EndpointDetail = {
	lastRenderTime: new Date(),
	currentEndpoint: null
};



EndpointDetail.populateBucketList = function()
{
	var list = $("#logBucket");
	list.material_select('destroy');
	list.empty();

	list.append($("<option/>"));
	for (var i = 0; i < AppState.BucketNames.length; i++)
	{
		var bucket = AppState.BucketNames[i];
		var option = $("<option>" + bucket + "</option>");
		list.append(option);
	}

	list.material_select();

}

EndpointDetail.populate = function(endpoint)
{
	EndpointDetail.currentEndpoint = endpoint;

	var logBucket = $("#logBucket");

	$(".endpointpanel").removeClass("active");
	EndpointDetail.reset();

	if (!endpoint.IsLoggingKnown || !endpoint.IsS3statKnown)
	{
		$("#pending").addClass("active");
		return;
	}

	$("#configure").addClass("active");
	$("#endpointtitle").text(endpoint.Title);

	$("#logPrefix").val(endpoint.LogPrefix);
	if (endpoint.IsLogging)
	{
		logBucket.val(endpoint.LogBucketName);
		EndpointDetail.disable();
	}
	else
	{
		logBucket.val(endpoint.Title);
	}
	$("label[for=logBucket]").addClass("active");
	$("label[for=logPrefix]").addClass("active");



	if (endpoint.IsS3stat && endpoint.IsLogging)
	{
		$("#configure").removeClass("active");
		$("#disable").addClass("active");
		EndpointDetail.disable();
	}

	var headerSelector = "#endpoint_log" + (endpoint.IsLogging ? "yes" : "no") + "_report" + (endpoint.IsS3stat ? "yes" : "no");
	$("#endpoint_reporting").addClass("active");
	$(headerSelector).addClass("active");


	logBucket.material_select('destroy');
	logBucket.material_select();

};

EndpointDetail.reset = function(endpoint)
{
	$(".endpointpanel").removeClass("active");
	var logBucket = $("#logBucket");

	logBucket.val("");
	$("#logPrefix").val("");
	$("label[for=logBucket]").removeClass("active");
	$("label[for=logPrefix]").removeClass("active");
	logBucket.prop('disabled', false);
	$("#logPrefix").prop('disabled', false);

	logBucket.material_select('destroy');
	logBucket.material_select();
};

EndpointDetail.disable = function(endpoint)
{
	$("#logBucket").prop('disabled', true);
	$("#logPrefix").prop('disabled', true);
}

EndpointDetail.update = function(endpoint)
{
	if (!endpoint)
	{
		// todo: all
		return;
	}

	if (EndpointDetail.currentEndpoint && EndpointDetail.currentEndpoint.Id == endpoint.Id)
	{
		EndpointDetail.populate(EndpointDetail.currentEndpoint);
	}
}


EndpointDetail.configure = function()
{
	$(".endpointpanel").removeClass("active");
	$("#pending").addClass("active");


	var endpoint = EndpointDetail.currentEndpoint;
	endpoint.LogBucketName = $("#logBucket").val();
	endpoint.LogPrefix = $("#logPrefix").val();

	AWSHelper.getBucketLocation(endpoint.LogBucketName, function(err, data)
	{
		if (err)
		{
			console.log(err, endpoint);
			tool.error("Couldn't detect the AWS Region for the logging bucket.  The link below should help troubleshoot this.", "GetBucketLocation Error", err, "GetBucketLocation");
			EndpointDetail.update(EndpointDetail.currentEndpoint);
			return;
		}

		endpoint.LogRegion = AWSHelper.parseRegion(data.LocationConstraint);

		var saveCallback = function(err, data)
		{
			if (err)
			{
				tool.error("Is this endpoint already set up in another account?", "Couldn't save to S3stat.", err, "SaveEndpoint");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				EndpointList.render();
				return;
			}

			$(".endpointpanel").removeClass("active");
			$("#success").addClass("active");

			if (EndpointDetail.currentEndpoint.IsS3)
			{
				EndpointDetail.currentEndpoint.BucketID = parseInt(data);
			}
			else
			{
				EndpointDetail.currentEndpoint.DistributionID = parseInt(data);
			}
			EndpointDetail.currentEndpoint.IsS3stat = true;
			EndpointDetail.currentEndpoint = null;
			EndpointList.render();
		}

		var setLoggingCallback = function(err, data)
		{
			if (err)
			{
				tool.error("Couldn't set up logging for this endpoint. The link below should help troubleshoot this.", "SetLogging Error.", err, "SetLogging");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				return;
			}

			EndpointDetail.currentEndpoint.IsLogging = true;
			S3stat.setEndpoint(EndpointDetail.currentEndpoint.toJSON(), saveCallback);
		}

		// Flow: setLogging -> setLoggingCallback -> setEndpoint -> saveCallback
		// The Callbacks can short-circuit if necessary and return the form to a usable state.
		if (endpoint.IsS3)
		{
			EndpointDetail.setLoggingS3(setLoggingCallback);
		}
		else if (endpoint.IsStreaming)
		{
			EndpointDetail.setLoggingStreaming(setLoggingCallback);
		}
		else if (endpoint.IsCloudfront)
		{
			EndpointDetail.setLoggingCF(setLoggingCallback);
		}
	});

	EndpointDetail.setLoggingS3 = function(callback)
	{
		if (endpoint.IsLogging)
		{
			callback();
			return;
		}

		// Flow: GetSourceRegion -> GetACL -> PutACL -> SetLogging -> callback
		// Can short circuit at any point, show error message, and abandon save.


		AWSHelper.getBucketLocation(endpoint.BucketName, function(err, data)
		{
			if (err)
			{
				tool.error("Couldn't detect the AWS Region for this bucket.  The link below should help troubleshoot this.", "GetBucketLocation Error", err, "GetBucketLocation");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				return;
			}

			endpoint.SourceLogRegion = AWSHelper.parseRegion(data.LocationConstraint);
			AWSHelper.getBucketAcl(endpoint.BucketName, endpoint.SourceRegion, function(err, data)
			{
				if (err)
				{
					tool.error("Couldn't read the ACL for this bucket.  The link below should help troubleshoot this.", "GetBucketAcl Error", err, "GetBucketAcl");
					EndpointDetail.update(EndpointDetail.currentEndpoint);
					return;
				}

				AWSHelper.fixS3Grants(data.Grants);
				AWSHelper.putBucketAcl(endpoint.BucketName, data, endpoint.SourceRegion, function(err, data)
				{
					if (err)
					{
						tool.error("Couldn't set the ACL for this bucket.  The link below should help troubleshoot this.", "PutBucketAcl Error", err, "PutBucketAcl");
						EndpointDetail.update(EndpointDetail.currentEndpoint);
						return;
					}

					AWSHelper.putBucketLogging(endpoint.BucketName, endpoint.LogBucketName, endpoint.LogPrefix, endpoint.SourceRegion, function(err, data)
					{
						if (err)
						{
							tool.error("Couldn't set logging for this bucket.  The link below should help troubleshoot this.", "PutBucketLogging Error", err, "PutBucketLogging");
							EndpointDetail.update(EndpointDetail.currentEndpoint);
							return;
						}
						EndpointDetail.currentEndpoint.IsLogging = true;
						callback && callback(err, data);
					});
				});
			});

		});
	}

	EndpointDetail.setLoggingCF = function(callback)
	{
		if (endpoint.IsLogging)
		{
			callback();
			return;
		}

		endpoint.DistributionConfig.Logging.Enabled = true;
		endpoint.DistributionConfig.Logging.Bucket = endpoint.LogBucketName + ".s3.amazonaws.com";
		endpoint.DistributionConfig.Logging.Prefix = endpoint.LogPrefix;

		AWSHelper.updateDistribution(endpoint.AWSDistributionID, endpoint.DistributionConfig, endpoint.ETag, callback);
	}

	EndpointDetail.setLoggingStreaming = function(callback)
	{
		if (endpoint.IsLogging)
		{
			callback();
			return;
		}

		endpoint.StreamingDistributionConfig.Logging.Enabled = true;
		endpoint.StreamingDistributionConfig.Logging.Bucket = endpoint.LogBucketName + ".s3.amazonaws.com";
		endpoint.StreamingDistributionConfig.Logging.Prefix = endpoint.LogPrefix;

		AWSHelper.updateStreamingDistribution(endpoint.AWSDistributionID, endpoint.StreamingDistributionConfig, endpoint.ETag, callback);
	}
};

EndpointDetail.stopLoggingCF = function(callback)
{
	if (!endpoint.IsLogging)
	{
		callback();
		return;
	}

	endpoint.DistributionConfig.Logging.Enabled = false;
	endpoint.DistributionConfig.Logging.Bucket = endpoint.LogBucketName + ".s3.amazonaws.com";
	endpoint.DistributionConfig.Logging.Prefix = endpoint.LogPrefix;

	AWSHelper.updateDistribution(endpoint.AWSDistributionID, endpoint.DistributionConfig, endpoint.ETag, callback);
}

EndpointDetail.stopLoggingStreaming = function(callback)
{
	if (!endpoint.IsLogging)
	{
		callback();
		return;
	}

	endpoint.StreamingDistributionConfig.Logging.Enabled = false;
	endpoint.StreamingDistributionConfig.Logging.Bucket = endpoint.LogBucketName + ".s3.amazonaws.com";
	endpoint.StreamingDistributionConfig.Logging.Prefix = endpoint.LogPrefix;

	AWSHelper.updateStreamingDistribution(endpoint.AWSDistributionID, endpoint.StreamingDistributionConfig, endpoint.ETag, callback);
}

EndpointDetail.stopLoggingS3 = function(callback)
{
	var endpoint = EndpointDetail.currentEndpoint;
	AWSHelper.getBucketLocation(endpoint.BucketName, function(err, data)
	{
		if (err)
		{
			tool.error("Couldn't detect the AWS Region for this bucket.  The link below should help troubleshoot this.", "GetBucketLocation Error", err, "GetBucketLocation");
			EndpointDetail.update(EndpointDetail.currentEndpoint);
			return;
		}

		endpoint.SourceLogRegion = AWSHelper.parseRegion(data.LocationConstraint);
		AWSHelper.stopBucketLogging(endpoint.BucketName, endpoint.SourceRegion, function(err, data)
		{
			if (err)
			{
				tool.error("Couldn't stop logging for this bucket.  The link below should help troubleshoot this.", "StopBucketLogging Error", err, "StopBucketLogging");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				return;
			}
			EndpointDetail.currentEndpoint.IsLogging = true;
			callback && callback(err, data);
		});
	});
};

EndpointDetail.stopReporting = function()
{
	$(".endpointpanel").removeClass("active");
	$("#pending").addClass("active");

	var stopS3stat = function()
	{
		S3stat.deleteEndpoint(EndpointDetail.currentEndpoint, function(err, data)
		{
			if (err)
			{
				tool.error("Couldn't stop reporting for this endpoint. The link below should help troubleshoot this.", "StopReporting Error.", err, "StopReporting");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				return;
			}

			EndpointDetail.currentEndpoint.IsS3stat = false;
			EndpointDetail.currentEndpoint = null;
			EndpointList.render();

			$(".endpointpanel").removeClass("active");
			$("#intro").addClass("active");
		});
	};

	if ($("#stopLogging")[0].checked)
	{
		var setLoggingCallback = function(err, data)
		{
			if (err)
			{
				tool.error("Couldn't stop logging for this endpoint. The link below should help troubleshoot this.", "SetLogging Error.", err, "StopLogging");
				EndpointDetail.update(EndpointDetail.currentEndpoint);
				return;
			}

			EndpointDetail.currentEndpoint.IsLogging = false;
			stopS3stat();
		};

		if (EndpointDetail.currentEndpoint.IsS3)
		{
			EndpointDetail.stopLoggingS3(setLoggingCallback);
		}
		else if (EndpointDetail.currentEndpoint.IsStreaming)
		{
			EndpointDetail.stopLoggingStreaming(setLoggingCallback);
		}
		else if (EndpointDetail.currentEndpoint.IsCloudfront)
		{
			EndpointDetail.stopLoggingCF(setLoggingCallback);
		}
	}
	else
	{
		stopS3stat();
	}
};

