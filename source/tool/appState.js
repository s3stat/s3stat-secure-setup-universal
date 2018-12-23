var storage = require('electron-json-storage');

var AppState = {
	UserName: "",
	Password: "",
	AWSAccessKey: "",
	AWSSecretKey: "",
	AWSAccountID: "",
	RememberS3statLogin: false,
	RememberAWSCredentials: false,
	NoCloudfrontSubscriptionUserName: false,
	Account: {},
	BucketNames: [],
	Endpoints: [],
	S3statXML: null,
	ConfigFileName: "s3stat.config",
	ErrorLogFileName: "s3stat_error.txt"
};

AppState.toStorageJSON = function()
{
	var config = {};
	if (AppState.RememberS3statLogin)
	{
		config.UserName = AppState.UserName;
		config.Password = AppState.Password;
	}
	if (AppState.RememberAWSCredentials)
	{
		config.AWSAccessKey = AppState.AWSAccessKey;
		config.AWSSecretKey = AppState.AWSSecretKey;
		config.AWSAccountID = AppState.AWSAccountID;
	}

	config.RememberS3statLogin = AppState.RememberS3statLogin;
	config.RememberAWSCredentials = AppState.RememberAWSCredentials;

	return JSON.stringify(config);
};

AppState.save = function(callback)
{
	storage.set(AppState.ConfigFileName, AppState.toStorageJSON(), callback);
};

AppState.load = function(callback)
{
	storage.has(AppState.ConfigFileName, function(error, hasKey)
	{
		if (hasKey)
		{
			storage.get(AppState.ConfigFileName, function(error, data)
			{
				if (!error)
				{
					var config = JSON.parse(data);
					AppState.UserName = config.UserName;
					AppState.Password = config.Password;
					AppState.AWSAccessKey = config.AWSAccessKey;
					AppState.AWSSecretKey = config.AWSSecretKey;
					AppState.AWSAccountID = config.AWSAccountID;
					AppState.RememberS3statLogin = config.RememberS3statLogin;
					AppState.RememberAWSCredentials = config.RememberAWSCredentials;
				}
				callback && callback();
			});
		}
		else
		{
			callback && callback();
		}
	});
};

