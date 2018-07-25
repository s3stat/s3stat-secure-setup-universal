var electron = require('electron'); // Module to control application life.
var ipc = require('electron').ipcRenderer;

var tool = {};
tool.load = function(url, external)
{
	if (!url)
	{
		return false;
	}


	var linkedHref = url.attributes ? url.attributes["href"].value : url;
//	console.log(linkedHref);
//	debugger;

	if (url.href)
	{
		url = url.href;
	}

	if (external)
	{
		electron.shell.openExternal(url);
	}
	else
	{
		$("#content").load(url, function()
		{
			$(".breadcrumb-item").removeClass("active");
			$(".breadcrumb-item>a[href=" + linkedHref.replace(".", "\\.") + "]").parent().addClass("active");
		});
	}
	return false;
}

tool.error = function(message, title, err, errorCode)
{
	var hash = "";

	var m = $("#errorModal");
	m.find(".modal-title").text(title);
	m.find(".message-text").text(message);

	var msg = title;
	if (err)
	{
		msg = err.message || err;
		if (err.name)
		{
			hash = "#" + err.name;
			msg = err.name + ": " + msg;
		}
		else
		{
			hash = "#" + msg.replace(/[^a-zA-z0-9]+/ig, "-");
		}
		m.find(".error-text").show();
		m.find(".error-text").text(msg);
	}
	else
	{
		m.find(".error-text").hide();
		m.find(".error-text").text("");
	}

	if (errorCode)
	{
		var url = "https://www.s3stat.com/secure-setup-errors/" + errorCode + hash;
		m.find(".fix-link").show();
		m.find(".fix-link").attr("href", url);
	}
	else
	{
		m.find(".fix-link").hide();
	}

	m.modal('show');


	var stack = (new Error()).stack;
	S3stat.noteException(msg, stack, errorCode, true);
};

tool.toggleContinue = function(loading)
{
	if (loading)
	{
		//var spinner = $('<div class="preloader-wrapper small active buttonloading"><div class="spinner-layer spinner-green-only spinner-white-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>');
		$("#continue").addClass("disabled");
		//$("#continue").empty().append(spinner);
	}
	else
	{
		$("#continue").removeClass("disabled");
		//$("#continue").empty().text("Continue");
	}
};

ipc.on("maximize", function()
{
	console.log("max");
	$("#btn-maximize").hide();
	$("#btn-unmaximize").show();
});
ipc.on("unmaximize", function()
{
	console.log("unmaximize");
	$("#btn-unmaximize").hide();
	$("#btn-maximize").show();
});
ipc.on("minimize", function()
{
	console.log("minimize");
});
ipc.on("restore", function()
{
	console.log("restore");
});


