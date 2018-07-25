'use strict';

var Endpoint = function()
{
	this.Id = 0;
	this.BucketID = 0;
	this.DistributionID = 0;
	this.Type = Endpoint.EndpointType.S3;
	this.IsCloudfront = false;
	this.IsS3 = false;
	this.IsStreaming = false;
	this.IsS3stat = false;
	this.IsLogging = false;
	this.HasReports = false;

	this.IsLoggingKnown = false;
	this.IsS3statKnown = false;

	this.BucketName = "";
	this.AWSDistributionID = "";
	this.Title = "";
	this.Subtitle = "";

	this.DistributionConfig = {};
	this.StreamingDistributionConfig = {};
	this.BucketLoggingConfig = {};
	this.Policy = "";
	this.ETag = "";

	this.LogPath = "";
	this.LogPrefix = "";
	this.LogBucketName = "";
	this.LogRegion = "";
	this.SourceRegion = "";
}

Endpoint.EndpointType = {
	Cloudfront: "Cloudfront",
	S3: "S3",
	Streaming: "Streaming"
}

Endpoint.prototype.getSafeID = function()
{
	return this.Id.replace(/[^a-zA-Z0-9]/ig, "_");
}

Endpoint.prototype.toTransport = function()
{
	return {
		Type: this.Type,
		S3AccountID: AppState.Account.S3AccountID,
		BucketID: this.BucketID,
		DistributionID: this.DistributionID,
		BucketName: this.BucketName,
		AWSDistributionID: this.AWSDistributionID,
		LogBucketName: this.LogBucketName,
		LogPrefix: this.LogPrefix,
		LogRegion: this.LogRegion
	};
};

Endpoint.prototype.toJSON = function()
{
	return JSON.stringify(this.toTransport());
};

