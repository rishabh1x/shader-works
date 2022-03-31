const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

let allShadersDefinition = [];
var currentShaderPage = 0;
const pageSize = 12;

app.get("/", (req, res) => {
    // res.sendFile(__dirname + "/index.html");

    //on get request, call fetchD2Manifest
    fetchD2Manifest(res);
});

app.post("/", (req, res) => {
    //fetch pageId from req url parameter
    const pageId = req.body.pageId;

    /// call changeShaderPage function and pass pageId
    let pageChunk = changeShaderPage(pageId);
    res.render("index", {shaders: pageChunk, page: currentShaderPage});
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, () => {
    console.log("running on port " + port);
});

/// function to fetch the manifest from the Destiny 2 API
function fetchD2Manifest(getRes) {
    const baseURL = "https://www.bungie.net/Platform/Destiny2/Manifest/";

    //print baseURL
    console.log("Manifest url: " + baseURL);

    https.get(baseURL, (manifestRes) => {
        console.log('manifestResponseCode:', manifestRes.statusCode);

        let chunks = [];
        manifestRes.on("data", (data) => {
            chunks.push(data);
        }).on("end", () => {
            let data = Buffer.concat(chunks);
            const manifestJSON = JSON.parse(data);
            console.log("manifestJSON: " + manifestJSON);

            var manifest = manifestJSON.Response;
            var manifestVersion = manifest.version;
            var collectibleDefinition = manifest.jsonWorldComponentContentPaths.en.DestinyCollectibleDefinition;

            //print manifest version
            console.log("manifest version: " + manifestVersion);

            // if collectibleDefinition valid then print and call fetchD2Collectibles
            if (collectibleDefinition != null) {
                console.log("collectibleDefinition:-\n" + collectibleDefinition);
                fetchD2Collectibles(collectibleDefinition, getRes);
            }
        });
    });
}

/// function to fetch the collectible definitions from the Destiny 2 API using the collectibleDefinition from manifest
function fetchD2Collectibles(jsonWorldComponentContentPaths, getRes) {
    const baseURL = "https://www.bungie.net" + jsonWorldComponentContentPaths;

    //print baseURL
    console.log("collectible definition url: " + baseURL);

    https.get(baseURL, (collectibleRes) => {
        console.log('collectibleResponseCode:', collectibleRes.statusCode);

        let chunks = [];
        collectibleRes.on("data", (data) => {
            chunks.push(data);
        }).on("end", () => {
            let data = Buffer.concat(chunks);
            const collectibleJSON = JSON.parse(data);
            console.log("collectibleJSON: " + collectibleJSON);

            /// filter the collectible data to only include value where displayProperties.description contains "shader"
            var collectibleDefinitions = collectibleJSON;

            let allShaders = [];
            // iterate on collectibleDefinitions object and filter for shaders
            for (var key in collectibleDefinitions) {
                if (collectibleDefinitions.hasOwnProperty(key)) {
                    var collectibleDefinition = collectibleDefinitions[key];
                    var displayProperties = collectibleDefinition.displayProperties;
                    var description = displayProperties.description;
                    if (description.includes("shader")) {
                        allShaders.push(collectibleDefinition);
                    }
                }
            }
            
            allShadersDefinition = allShaders;
            //print the number of items in allShaders
            console.log("number of shaders: " + allShaders.length);

            //print sort allShaders ascending by itemHash property
            allShaders.sort(function(a, b) {
                return a.itemHash - b.itemHash;
            });

            console.log(currentShaderPage);

            //render index and pass allShaders array
            getRes.render("index", {shaders: allShaders, page: currentShaderPage});
        });
    });
}

/// function to change the currentShaderPage
function changeShaderPage(pageId) {
    if (pageId === "n") {
        currentShaderPage++;
    } else if (pageId === "p") {
        currentShaderPage--;
    } else {
        currentShaderPage = pageId-1;
    }
    /// fetch page chunk from allShadersdefinition using pageSize and currentShaderPage
    let pageChunk = allShadersDefinition.slice(currentShaderPage * pageSize, (currentShaderPage + 1) * pageSize);
    return pageChunk;
}