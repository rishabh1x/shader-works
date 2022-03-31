const bodyParser = require("body-parser");
const express = require("express");
const https = require("https");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

// var cityReceived;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
    console.log(req.body.cityName);
    cityReceived = req.body.cityName;
    fetchD2Manifest();
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, () => {
    console.log("running on port " + port);
});

function fetchD2Manifest() {
    const baseURL = "https://www.bungie.net/Platform/Destiny2/Manifest/";

    https.get(baseURL, (manifestRes) => {
        console.log('manifestResponseCode:', manifestRes.statusCode);

        manifestRes.on("data", (data) => {
            const manifestData = JSON.parse(data);
            const temp = weatherData.main.temp;
            const weatherDescription = weatherData.weather[0].description;
            const wIcon = weatherData.weather[0].icon;
            
            const wIconSource = "https://openweathermap.org/img/wn/" + wIcon + "@2x.png";
            const weatherTempStr = "<h1>The temperature in " + query + " is " + temp + "C</h1>";
            const breakStr = "<br>";
            const weatherDescStr = "<h2>Current weather: " + weatherDescription + ".</h2>";

            response.write(weatherTempStr);
            response.write(breakStr);
            response.write(weatherDescStr);
            response.write("<img src=" + wIconSource + ">");
            response.send();
        });
    });
}