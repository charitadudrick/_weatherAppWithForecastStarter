/* --- Configuration & Global Variables --- */
let units = "metric";
let userCity = "Philadelphia";
const unsplashKey = "3aec8sTVyLBtqALtmIS3PAZlPpcTqD7SVl1OcUp7b9M";

const DegreeUnits = { Celsius: "°C", Fahrenheit: "°F" };
const SpeedUnits = { MPH: " mph", KPH: " km/h" };

let degreesLabel = DegreeUnits.Celsius;
let speedLabel = SpeedUnits.KPH;

/* --- Helper Functions --- */
const getLocalDate = (dt) =>
  new Date(dt * 1000).toLocaleString([], {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function getCardinalDirection(angle) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(angle / 45) % 8];
}

/* --- Weather Object --- */
let weather = {
  apiKey: "82005d27a116c2880c8f0fcb866998a0",

  fetchWeather: function (city) {
    $(".weather").addClass("loading");

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${this.apiKey}`;

    $.getJSON(url)
      .done((data) => {
        userCity = data.name;
        this.displayWeather(data);
        this.fetchForecast(userCity);
      })
      .fail(() => {
        $(".city").text("City not found");
        $(".weather").removeClass("loading");
      });
  },

  displayWeather: function (data) {
    const {
      name,
      main: { temp, feels_like, humidity, temp_max, temp_min },
      weather: weatherArr,
      wind: { speed, deg },
    } = data;

    const desc = weatherArr[0].description;
    const capDesc = desc.charAt(0).toUpperCase() + desc.slice(1);

    $(".city").text(name);
    $(".temp").text(`${Math.round(temp)}${degreesLabel}`);
    $(".description").text(capDesc);

    // Main weather icon
    const iconCode = weatherArr[0].icon;
    $(".icon").attr("src", `https://openweathermap.org/img/wn/${iconCode}@2x.png`);

    $(".feels-like").text(`Feels like: ${Math.round(feels_like)}${degreesLabel}`);
    $(".humidity").text(`Humidity: ${humidity}%`);

    // Wind split into two elements
    $(".wind").text(`Wind: ${Math.round(speed)}${speedLabel}`);
    $(".deg").text(getCardinalDirection(deg));

    // High / Low temps
    $(".temp_max").text(`High: ${Math.round(temp_max)}${degreesLabel}`);
    $(".temp_min").text(`Low: ${Math.round(temp_min)}${degreesLabel}`);

    // Unsplash background
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${name}&client_id=${unsplashKey}`;
    $.getJSON(unsplashUrl).done((imgData) => {
      if (imgData.results && imgData.results.length > 0) {
        const bgUrl = imgData.results[0].urls.regular;
        $("body").css("background-image", `url(${bgUrl})`);
      }
    });

    $(".weather").removeClass("loading");
  },

  fetchForecast: function (city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${this.apiKey}`;

    $.getJSON(url).done((data) => {
      this.displayHourly(data.list);
      this.displayDaily(data.list);
    });
  },

  displayHourly: function (list) {
    const $container = $(".hourly-forecast");
    $container.empty();

    const nextHours = list.slice(0, 10);

    nextHours.forEach((item) => {
      const time = getLocalDate(item.dt);
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;

      $container.append(`
        <div class="hour-card">
          <p>${time}</p>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
          <p>${temp}${degreesLabel}</p>
        </div>
      `);
    });
  },

  displayDaily: function (list) {
    const $container = $(".daily-forecast");
    $container.empty();

    for (let i = 8; i < list.length; i += 8) {
      const item = list[i];
      const day = getLocalDate(item.dt);
      const temp = Math.round(item.main.temp);
      const pop = Math.round(item.pop * 100);
      const icon = item.weather[0].icon;

      $container.append(`
        <div class="day-card">
          <p>${day}</p>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
          <p>${temp}${degreesLabel}</p>
          <p>Rain: ${pop}%</p>
        </div>
      `);
    }
  },

  search: function () {
    const value = $(".search-bar").val();
    if (value.trim() !== "") {
      this.fetchWeather(value.trim());
      $(".search-bar").val("");
    }
  },
};

/* --- GPS Weather Fetch --- */
function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${weather.apiKey}`;

  $.getJSON(url)
    .done((data) => {
      userCity = data.name;
      weather.displayWeather(data);
      weather.fetchForecast(userCity);
    })
    .fail(() => {
      $(".city").text("Location not found");
      $(".weather").removeClass("loading");
    });
}

/* --- Geolocation (IP fallback) --- */
function fetchUserCity() {
  const geoApiKey = "841afa96ceb940da8f6157a7f16cc527";
  const url = `https://api.geoapify.com/v1/ipinfo?apiKey=${geoApiKey}`;

  $.getJSON(url)
    .done((data) => {
      if (data.city && data.city.name) {
        userCity = data.city.name;
      }
    })
    .always(() => {
      weather.fetchWeather(userCity);
    });
}

/* --- App Initialization --- */
$(function () {
  // IP fallback on load
  fetchUserCity();

  // Use My Location button
  $(".use-location").on("click", function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        () => {
          alert("Unable to access your location");
        }
      );
    } else {
      alert("Geolocation not supported");
    }
  });

  // Unit toggle
  $(".temp").on("click", function () {
    if (units === "metric") {
      units = "imperial";
      degreesLabel = DegreeUnits.Fahrenheit;
      speedLabel = SpeedUnits.MPH;
    } else {
      units = "metric";
      degreesLabel = DegreeUnits.Celsius;
      speedLabel = SpeedUnits.KPH;
    }
    weather.fetchWeather(userCity);
  });

  // Search button
  $(".search button").on("click", function () {
    weather.search();
  });

  // Enter key
  $(".search-bar").on("keyup", function (e) {
    if (e.key === "Enter") {
      weather.search();
    }
  });
});
