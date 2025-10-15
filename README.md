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

