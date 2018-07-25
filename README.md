# S3stat Secure Setup
## Cross-platform Electron version

This is a tool to configure Cloudfront and Amazon S3 endpoints for logging and reporting with [S3stat].

For more information about the tool, visit the [Download] page.


## Building and Running

This is an Electron app, so the Simplest Thing That Will Work (tm) is to download the source, make sure Electron is installed on your system, then run it with that.  Here's how to pull that off:

1. Clone (or download and unzip) the source for the app.  There's a button to do that above somewhere.

2. Download and [Install Electron], ideally using the -g option to make it global in your $PATH.  
- If you're not a developer, this will likely lead you down a rabbit hole where you'll also need to install [NPM], for which you'll first need to install [Node.js], and likely half a dozen other things.  (But then if you're not a developer, why not simply run the pre-built version of the tool available from our [Download] page and save yourself some pain?)

3. Run Electron (by typing `electron` into your terminal or command prompt).

4. Drag and Drop the `main.js` file from the source folder onto the Electron window.

Enjoy!


[S3stat]: https://www.s3stat.com/
[Download]: https://www.s3stat.com/Setup/Download.aspx
[Electron]: https://electronjs.org/
[Install Electron]: https://electronjs.org/docs/tutorial/installation
[NPM]: https://www.npmjs.com/
[Node.js]: https://nodejs.org/
