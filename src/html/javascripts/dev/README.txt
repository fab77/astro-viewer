HiPS 3D visualisation tool.

To start using it, just copy the bundle in dist/astrocore.js into your project and link it in your HTML page:
```
<script src="./javascripts/astrocore.js"></script>
```

Below an example of index.html that loads the HiPS https://alasky.cds.unistra.fr/DSS/DSSColor/, enable the TAP https://sky.esa.int/esasky-tap/tap and show the source catalogue catalogues.integral_ibis:

```
<!DOCTYPE html>
<html>
<head>
    <script src="./javascripts/astrocore.js"></script>
</head>
<body onload="run();">
    <script>
        let window.AstroAPI = undefined
        async function run() {
            const AC = new astrocore.AstroCore();
            window.AstroAPI = AC
            const hipsUrl = "https://alasky.cds.unistra.fr/DSS/DSSColor/";
            const resp = await fetch(hipsUrl + "properties");
            const propsText = await resp.text();
            const desc = new astrocore.HiPSDescriptor(propsText, new URL(hipsUrl));
            const insideSphere = false
            window.AstroAPI.activateHiPS(desc, insideSphere);
            window.AstroAPI.run();
            const tapRepo = await astrocore.addTAPRepo("https://sky.esa.int/esasky-tap/tap")
            const catalogue = tapRepo.cataloguesList.find(cat => cat.name === "catalogues.integral_ibis")
            window.AstroAPI.showCatalogue(catalogue)
        }
    </script>
    <canvas id="astrocanvas"></canvas>
</body>
</html>
```
This project provide as well a development web interface to test the majority of the features. To explore it you need Node installed.
Clone this project and run the following in a terminal in the root directory:

```
$ npm run all
```
This command will ocmpile the bundle, prepare the web development UI and run a local webserver where it is possible to explore the functionalities of AstroViewer. As output of the npm command you should see:

```
Starting up http-server, serving public

http-server version: 14.1.1

http-server settings: 
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:8080
  http://10.0.0.184:8080
Hit CTRL-C to stop the server
```

which means that you local AstroViewer is listening on both http://127.0.0.1:8080, http://10.0.0.184:8080. Just open thebrowser on one of the links and start exploring AstroViewer.
