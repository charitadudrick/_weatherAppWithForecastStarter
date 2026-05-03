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

    $.getJSON(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${this.apiKey}`
    )
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
    const { name } = data;
    const { temp, humidity, feels_like, temp_max, temp_min } = data.main;
    const { description, icon } = data.weather[0];
    const { speed, deg } = data.wind;

    const capitalDesc =
      description.charAt(0).toUpperCase() + description.slice(1);

    $(".city").text(`Weather in ${name}`);
    $(".time").text(new Date().toLocaleString());

    $(".temp").text(`${Math.round(temp)}${degreesLabel}`);

    $(".feels-like").text(
      `Feels like: ${Math.round(feels_like)}${degreesLabel}`
    );
    $(".temp_max").text(`H: ${Math.round(temp_max)}${degreesLabel}`);
    $(".temp_min").text(` L: ${Math.round(temp_min)}${degreesLabel}`);

    $(".description").text(capitalDesc);
    $(".humidity").text(`Humidity: ${humidity}%`);

    $(".wind").text(
      `Wind: ${Math.round(speed)}${speedLabel} ${getCardinalDirection(deg)}`
    );
    $(".deg").text("");

    $(".icon").attr(
      "src",
      `https://openweathermap.org/img/wn/${icon}.png`
    );

    // Unsplash background
    $.getJSON(
      `https://api.unsplash.com/photos/random?query=${name}&client_id=${unsplashKey}`
    ).done((imgData) => {
      $("body").css(
        "background-image",
        `url(${imgData.urls.full})`
      );
    });

    $(".weather").removeClass("loading");
  },

  fetchForecast: function (city) {
    $.getJSON(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${this.apiKey}`
    ).done((data) => {
      if (!data || !data.list) return;

      this.displayHourly(data.list);
      this.displayDaily(data.list);
    });
  },

  displayHourly: function (list) {
    const $container = $(".hourly-forecast");
    $container.empty();

    list.slice(0, 10).forEach((item) => {
      const time = getLocalDate(item.dt);
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;
      const pop = Math.round(item.pop * 100);

      $container.append(`
        <div class="forecast-item">
          <span>${time}</span>
          <img src="https://openweathermap.org/img/wn/${icon}.png">
          <b>${temp}${degreesLabel}</b>
          <div class="pop-label">${pop}%</div>
        </div>
      `);
    });

    setTimeout(checkInitialScroll, 0);
  },

  displayDaily: function (list) {
    const $container = $(".daily-forecast");
    $container.empty();

    for (let i = 0; i < list.length; i += 8) {
      const item = list[i];
      const date = new Date(item.dt * 1000).toLocaleDateString([], {
        weekday: "long",
      });
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;
      const pop = Math.round(item.pop * 100);

      $container.append(`
        <div class="forecast-item">
          <span>${date}</span>
          <img src="https://openweathermap.org/img/wn/${icon}.png">
          <b>${temp}${degreesLabel}</b>
          <div class="pop-label">${pop}%</div>
        </div>
      `);
    }

    setTimeout(checkInitialScroll, 0);
  },

  search: function () {
    const value = $(".search-bar").val().trim();
    if (value) {
      this.fetchWeather(value);
      $(".search-bar").val("");
    }
  },
};

/* --- Geolocation --- */
function fetchUserCity() {
  const geoApiKey = "841afa96ceb940da8f6157a7f16cc527";

  $.getJSON(
    `https://api.geoapify.com/v1/ipinfo?apiKey=${geoApiKey}`
  )
    .done((data) => {
      if (data.city && data.city.name) {
        userCity = data.city.name;
      }
    })
    .always(() => {
      weather.fetchWeather(userCity);
    });
}

/* --- Scroll Arrows (safe even if not in HTML) --- */
function handleScrollArrows() {
  $(".hourly-forecast, .daily-forecast").each(function () {
    const $this = $(this);
    const scrollLeft = $this.scrollLeft();
    const maxScroll = this.scrollWidth - $this.outerWidth();

    $this
      .siblings(".left-arrow")
      .toggleClass("is-visible", scrollLeft > 10);

    $this
      .siblings(".right-arrow")
      .toggleClass("is-visible", scrollLeft < maxScroll);
  });
}

function checkInitialScroll() {
  handleScrollArrows();
}

/* --- App Initialization --- */
$(function () {
  fetchUserCity();

  // Unit toggle
  $(".temp").on("click", () => {
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
  $(".search button").on("click", () => {
    weather.search();
  });

  // Enter key search
  $(".search-bar").on("keypress", function (e) {
    if (e.key === "Enter") {
      weather.search();
    }
  });
});