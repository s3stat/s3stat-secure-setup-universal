var Role = {
	LogReaderUserARN: "arn:aws:iam::300171020542:user/s3stat_log_reader",
	LogReadersRoleName: "S3statLogReaders"
};

Role.populate = function()
{
	if (!AppState.UserName || !AppState.Password)
	{
		tool.load("login.html");
		return;
	}

	if (!AppState.AWSAccessKey || !AppState.AWSSecretKey || !AppState.AWSAccountID)
	{
		tool.load("credentials.html");
		return;
	}

	$("#continue").addClass("disabled");
	EndpointList.populateS3stat(function(err, data)
	{
		if (err)
		{
			tool.load("login.html");
			return;
		}

		$("#assumeRolePolicy").text(Role.getAssumeRolePolicyJson());
		$("#accessPolicy").text(Role.getAccessPolicyJson());

		if (AppState.Account.CanAssumeRole)
		{
			$("#grant").attr("checked", true);
			$("#grantlabel").text("(Role already exists)");
			$("#grant").attr("disabled", true);
			$("#grantlabel").attr("disabled", true);

			$("#continue").removeClass("disabled");
			$("#continue").attr("disabled", false);

		}
	});

}

Role.updateGrant = function()
{
	if ($("#grant")[0].checked)
	{
		$("#continue").removeClass("disabled");
		$("#continue").attr("disabled", false);

	}
};

Role.getAssumeRolePolicy = function()
{
	if (!AppState.Account || !AppState.Account.RoleExternalID)
	{
		return {};
	}

	return {
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "",
				"Effect": "Allow",
				"Principal": { "AWS": Role.LogReaderUserARN },
				"Action": "sts:AssumeRole",
				"Condition": { "StringEquals": { "sts:ExternalId": AppState.Account.RoleExternalID } }
			}
		]
	};
};

Role.getAssumeRolePolicyJson = function()
{
	return JSON.stringify(Role.getAssumeRolePolicy(), null, "  ");
};

Role.getAccessPolicy = function()
{
	return {
		"Statement": [
			{
				"Sid": "AllowS3ReadOnly",
				"Action": [
					"s3:GetObject",
					"s3:ListBucket",
					"s3:GetBucketLocation"
				],
				"Effect": "Allow",
				"Resource": ["arn:aws:s3:::*"]
			},
			{
    			"Sid": "AllowCloudWatchBucketInfo",
    			"Action": [
				  "cloudwatch:GetMetricStatistics"
    			],
    			"Effect": "Allow",
    			"Resource": [
				  "*"
    			]
			}
		]
	};
};

Role.getAccessPolicyJson = function()
{
	return JSON.stringify(Role.getAccessPolicy(), null, "  ");
};

Role.showPolicy = function(link)
{
	$("#policycontent").show();
	$(link).hide();
};

Role.createRole = function()
{
	tool.toggleContinue(true);

	var onward = function()
	{
		tool.load("endpoints.html");
	};

	var revert = function()
	{
		tool.toggleContinue(false);
	}

	if (AppState.Account.CanAssumeRole && AppState.Account.CanCloudWatch)
	{
		onward();
		return;
	}

	// Flow: createRole -> putRolePolicy -> setS3Account -> onward
	AWSHelper.createRole(Role.getAssumeRolePolicyJson(), Role.LogReadersRoleName, function(err, data)
	{
		if (err)
		{
			// Don't worry if the role already exists.
			if (err.name != "EntityAlreadyExists")
			{
				console.log(err, err.name);
				tool.error("Couldn't create the read-only role we need to read your logfiles.  The link below should help troubleshoot this.", "CreateRole Error", err, "CreateRole");
				revert();
				return;
			}
		}

		AWSHelper.putRolePolicy(Role.getAccessPolicyJson(), Role.LogReadersRoleName, function(err, data)
		{
			if (err)
			{
				console.log(err, {});
				tool.error("Couldn't apply the read-only access policy to the role we created to read your logfiles.  The link below should help troubleshoot this.", "PutRolePolicy Error", err, "PutRolePolicy");
				revert();
				return;
			}

			AppState.Account.CanAssumeRole = true;
			AppState.Account.CanCloudWatch = true;
			S3stat.setS3Account(JSON.stringify(AppState.Account), function(err, data)
			{
				if (err)
				{
					console.log(err, {});
					tool.error("Couldn't notify S3stat of role existence.", "SetS3Account Error", err, "SetS3Account");
					revert();
					return;
				}

				onward();
			});
		});

	});
};
