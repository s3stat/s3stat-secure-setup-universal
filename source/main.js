const { app, BrowserWindow } = require('electron');
//var electron = require('electron'); // Module to control application life.
//var app = electron.app; // Module to create native browser window.
//var BrowserWindow = electron.BrowserWindow;
var AWS = require('aws-sdk');
var ipc = require('electron').ipcMain;
var Menu = require('electron');

if (require('electron-squirrel-startup')) app.quit();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

function createWindow()
{
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		icon: 'file://' + __dirname + '/assets/img/s3stat_spark_white.ico',
		frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true		}
	}); // and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/pages/index.html'); // Open the DevTools.
	//mainWindow.webContents.openDevTools(); // Emitted when the window is closed.
	mainWindow.on('closed', function()
	{
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
		app.quit();
	});

	console.log("mainWindow", mainWindow)


	mainWindow.on("maximize", function()
	{
		mainWindow.webContents.send("maximize");
	});
	mainWindow.on("unmaximize", function()
	{
		mainWindow.webContents.send("unmaximize");
	});
	mainWindow.on("minimize", function()
	{
		mainWindow.webContents.send("minimize");
	});
	mainWindow.on("restore", function()
	{
		mainWindow.webContents.send("restore");
	});


	if (process.platform == 'darwin')
	{
		var template = [{
			label: "S3stat",
			submenu: [
				{ label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); } }
			]
		}, {
			label: "Edit",
			submenu: [
				{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
				{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
				{ type: "separator" },
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
			]
		}
		];

		var menu = electron.Menu.buildFromTemplate(template);
		electron.Menu.setApplicationMenu(menu);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow); // Quit when all windows are closed.
app.on('window-all-closed', function()
{
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin')
	{
		app.quit();
	}
});
app.on('activate', function()
{
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null)
	{
		createWindow();
	}


});


ipc.on('btn-maximize', function()
{
	mainWindow.maximize();
});

ipc.on('btn-unmaximize', function()
{
	mainWindow.unmaximize();
});

ipc.on('btn-minimize', function()
{
	mainWindow.minimize();
});

ipc.on('btn-close', function()
{
	//mainWindow.close();
	app.quit();
});


