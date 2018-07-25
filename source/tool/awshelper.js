var AWS = require('aws-sdk');

var AWSHelper = {};

AWS.config.update({ "signatureVersion": "v4" });

AWSHelper.verifyCredentials = function(callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey });
	var s3 = new AWS.S3();

	s3.listBuckets({}, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.getAWSAccountID = function(callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey });

	var iam = new AWS.IAM();
	iam.getUser({}, function(err, data)
	{
		callback && callback(err, data);
	});
}

AWSHelper.getAccountIDFromARN = function(arn)
{
	var splitter = /::([^:]+):(user|root|group)/;
	if (splitter.test(arn))
	{
		try
		{
			var tokens = arn.split(splitter);
			return tokens[1];
		}
		catch (e)
		{
		}
	}

	return "";
};


// S3

AWSHelper.listBuckets = function(callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var s3 = new AWS.S3();

	s3.listBuckets({}, function(err, data)
	{
		callback && callback(err, data);
	});
};


AWSHelper.getBucketLocation = function(bucketName, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var s3 = new AWS.S3();

	s3.getBucketLocation({ Bucket: bucketName }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.getBucketLogging = function(bucketName, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var s3 = new AWS.S3();

	s3.getBucketLogging({ Bucket: bucketName }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.getBucketAcl = function(bucketName, region, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: region });
	var s3 = new AWS.S3();

	s3.getBucketAcl({ Bucket: bucketName }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.putBucketAcl = function(bucketName, policy, region, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: region });
	var s3 = new AWS.S3();

	s3.putBucketAcl({ Bucket: bucketName, AccessControlPolicy: policy }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.putBucketLogging = function(bucketName, logBucketName, logPrefix, region, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: region });
	var s3 = new AWS.S3();

	var config = AWSHelper.buildLoggingConfig(logBucketName, logPrefix);
	s3.putBucketLogging({ Bucket: bucketName, BucketLoggingStatus: config }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.stopBucketLogging = function(bucketName, region, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: region });
	var s3 = new AWS.S3();

	var config = AWSHelper.buildStopLoggingConfig();
	s3.putBucketLogging({ Bucket: bucketName, BucketLoggingStatus: config }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.fixS3Grants = function(grants)
{
	var logUri = "http://acs.amazonaws.com/groups/s3/LogDelivery";
	var findGrant = function(permission)
	{
		for (var i = 0; i < grants.length; i++)
		{
			var grant = grants[i];
			if (grant.Grantee && grant.Grantee.URI == logUri && grant.Permission == permission)
			{
				return true;
			}
		}

		return false;
	}

	var addGrant = function(permission)
	{
		var grant = { "Grantee": { "Type": "Group", "URI": logUri }, "Permission": permission };
		grants.push(grant);
	}

	var fix = function(permission)
	{
		if (!findGrant(permission))
		{
			addGrant(permission);
		}
	}

	fix("WRITE");
	fix("READ_ACP");
};

AWSHelper.buildLoggingConfig = function(logBucketName, logPrefix)
{
	return {
		"LoggingEnabled": {
			"TargetBucket": logBucketName,
			"TargetGrants": [{ "Grantee": { "Type": "Group", "URI": "http://acs.amazonaws.com/groups/global/AuthenticatedUsers" }, "Permission": "READ" }],
			"TargetPrefix": logPrefix
		}
	};
};

AWSHelper.buildStopLoggingConfig = function(logBucketName, logPrefix)
{
	return {
		"LoggingEnabled": null
	};
};

// Cloudfront

AWSHelper.listDistributions = function(callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.listDistributions({}, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.listStreamingDistributions = function(callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.listStreamingDistributions({}, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.getDistributionConfig = function(id, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.getDistributionConfig({ "Id": id }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.getStreamingDistributionConfig = function(id, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.getStreamingDistributionConfig({ "Id": id }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.updateDistribution = function(id, config, eTag, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.updateDistribution({ "Id": id, "DistributionConfig": config, "IfMatch": eTag }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.updateStreamingDistribution = function(id, config, eTag, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var cf = new AWS.CloudFront();

	cf.updateStreamingDistribution({ "Id": id, "StreamingDistributionConfig": config, "IfMatch": eTag }, function(err, data)
	{
		callback && callback(err, data);
	});
};



AWSHelper.parseRegion = function(location)
{
	// Amazon helpfully returns all manner of garbage in addition to valid region codes.
	// Let's special case them...
	if (location)
	{
		if (location == "EU")
		{
			return "eu-west-1";
		}

		return location;
	}

	return "us-east-1";
};






// IAM

AWSHelper.createRole = function(assumeRolePolicy, roleName, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var iam = new AWS.IAM();

	iam.createRole({ "AssumeRolePolicyDocument": assumeRolePolicy, "RoleName": roleName }, function(err, data)
	{
		callback && callback(err, data);
	});
};

AWSHelper.putRolePolicy = function(accessPolicy, roleName, callback)
{
	AWS.config.update({ "accessKeyId": AppState.AWSAccessKey, "secretAccessKey": AppState.AWSSecretKey, region: 'us-east-1' });
	var iam = new AWS.IAM();

	iam.putRolePolicy({ "PolicyDocument": accessPolicy, "PolicyName": "S3statReadAccess", "RoleName": roleName }, function(err, data)
	{
		callback && callback(err, data);
	});
};
