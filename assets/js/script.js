"use strict";

/** All Public Station in Azuracast information */
const stationsData = [];

/** Fetch API data from Azuracast server */
function fetchData() {
  fetch(apiUrl + "/api/nowplaying")
    .then((e) => (e.ok || checkError("Failed to load API data", () => location.reload()), e.json()))
    .then((data) => {
      data.forEach((reslt) => {
        const randomNumber = Math.floor(Math.random() * 5);
        const fileName = ".jpg";
        const extension = fileName.split("/").pop();

        stationsData.push({
          imgBrand: apiUrl + "/static/uploads/" + reslt.station.shortcode + "/" + "album_art." + randomNumber + extension,
          bgimg: reslt.now_playing.song.art,
          np: reslt.now_playing.song,
          name: reslt.station.name,
          streamUrl: reslt.station.listen_url,
          api: apiUrl + "/api/nowplaying_static/" + reslt.station.shortcode + ".json",
          played_at: reslt.now_playing.played_at,
          history: reslt.song_history,
        });
      }),
        processData();
    })
    .catch((err) => {
      console.error("Error fetching JSON:", err);
    });
}

function checkError(data) {
  console.error("Error loading data:", data);
}

fetchData();

/**
 * Process data
 * from feth data
 */
function processData() {

  // add eventListnere on all elements that are passed
  const addEventOnElements = function (elements, eventType, callback) {
    for (let i = 0, len = elements.length; i < len; i++) {
      elements[i].addEventListener(eventType, callback);
    }
  }

  // add all station azuracast public in playlist, from 'stationsData'
  const playlist = document.querySelector("[data-music-list]");

  for (let i = 0, len = stationsData.length; i < len; i++) {
    playlist.innerHTML += `
  <li>
    <p class="label-md" id="station">${stationsData[i].name}</p>
    <button class="music-item ${i === 0 ? "playing" : ""}" data-playlist-toggler data-playlist-item="${i}">
      <img src="${stationsData[i].imgBrand}" width="800" height="800" alt="${stationsData[i].title} Album Poster"
        class="img-cover">

      <div class="item-icon">
        <span class="material-symbols-rounded">equalizer</span>
      </div>
    </button>
  </li>
  `;
  }

  /**
   * PLAYLIST MODAL SIDEBAR TOGGLE
   * 
   * show 'playlist' modal sidebar when click on playlist button in top app bar
   * and hide when click on overlay or any playlist-item
   */

  const playlistSideModal = document.querySelector("[data-playlist]");
  const playlistTogglers = document.querySelectorAll("[data-playlist-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  const togglePlaylist = function () {
    playlistSideModal.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("modalActive");
  }

  addEventOnElements(playlistTogglers, "click", togglePlaylist);

  /**
   * PLAYLIST ITEM
   * remove active state from last time played music
   * and add active state in clicked music
   */

  const playlistItems = document.querySelectorAll("[data-playlist-item]");

  let currentMusic = 0;
  let lastPlayedMusic = 0;

  const changePlaylistItem = function () {
    playlistItems[lastPlayedMusic].classList.remove("playing");
    playlistItems[currentMusic].classList.add("playing");
  }

  addEventOnElements(playlistItems, "click", function () {
    lastPlayedMusic = currentMusic;
    currentMusic = Number(this.dataset.playlistItem);
    changePlaylistItem();
  });

  /**
   * PLAYER
   * change all visual information on player, based on current music
   */

  const playerBanner = document.querySelector("[data-player-banner]");
  const playerTitle = document.querySelector("[data-title]");
  const playerAlbum = document.querySelector("[data-album]");
  const playerArtist = document.querySelector("[data-artist]");

  const audioSource = new Audio(stationsData[currentMusic].streamUrl);

  const changePlayerInfo = function () {
    getDataSelected(stationsData[currentMusic].api);
    audioSource.src = stationsData[currentMusic].streamUrl;
    playMusic();
  }

  addEventOnElements(playlistItems, "click", changePlayerInfo);

  /**
   * PLAY MUSIC
   * 
   * play and pause music when click on play button
   */

  const playBtn = document.querySelector("[data-play-btn]");

  let playInterval;

  const playMusic = function () {
    audioSource.volume = 1;
    if (audioSource.paused) {
      audioSource.play();
      playBtn.classList.add("active");
    } else {
      audioSource.pause();
      playBtn.classList.remove("active");
      clearInterval(playInterval);
    }
  }

  playBtn.addEventListener("click", playMusic);

  /**
   * SKIP TO NEXT STATION
   */

  const playerSkipNextBtn = document.querySelector("[data-skip-next]");

  const skipNext = function () {
    lastPlayedMusic = currentMusic;
    currentMusic >= stationsData.length - 1 ? currentMusic = 0 : currentMusic++;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipNextBtn.addEventListener("click", skipNext);

  /**
   * SKIP TO PREVIOUS STATION
   */

  const playerSkipPrevBtn = document.querySelector("[data-skip-prev]");

  const skipPrev = function () {
    lastPlayedMusic = currentMusic;
    currentMusic <= 0 ? currentMusic = stationsData.length - 1 : currentMusic--;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipPrevBtn.addEventListener("click", skipPrev);

  /**
   * HISTORY STATION
   * 
   * History button
   */

  const histBtnEle = document.querySelector("[data-history]");
  const closeHistoryModal = document.querySelector("[close-history-modal]");

  histBtnEle.addEventListener("click", () => {
    // getDataSelected(stationsData[currentMusic].api),
    songListArt(stationsData[currentMusic].history),
      document.getElementById("historyModal").classList.remove("hidden");
  });
  closeHistoryModal.addEventListener("click", () => {
    document.getElementById("historyModal").classList.add("hidden");
  });

  /**
   * SHOW HISTORY
   * 
   * History song list
   */

  const songHistListEle = document.querySelector("[song-history-list]");

  const songListArt = function (d) {
    songHistListEle.innerHTML = "";

    Array.isArray(d) && d.length > 0 ? d.forEach(async b => {
      if (!b.song.title || !b.song.artist) return;
      const n = await getCoverArt(b.song, !1);
      const frDate = b.played_at;
      const coverArt = n.art;
      const liEle = document.createElement("li");
      liEle.className = "py-2 flex items-center", liEle.innerHTML = `
                    ${coverArt ? `<img class="rounded-lg object-cover" src="${coverArt}" width="100" alt="${b.title} artwork">` : ""}
                    <div class="ml-3 flex-grow">
                        <p class="text-2xl font-bold text-white text-left">${n.title}</p>
                        <p class="text-medium text-gray-400 text-left">By: ${n.artist}</p>
                        <p class="text-medium text-gray-400 text-left">From: ${n.album}</p>
                        <p class="text-xs text-gray-900 mt-1 text-left">${setTime(getTime(frDate))}</p>
                    </div>
                `, songHistListEle.appendChild(liEle)
    }) : songHistListEle.innerHTML = '<li class="py-2 flex items-center justify-center"><img src="./assets/images/spinner.svg" alt="Loading..." class="animate-spin h-30 w-30"></li>'
  }

  const getTime = function (t) {
    return new Date(t * 1000);
  }

  const setTime = function (t) {
    const second = (o) => (Date.now() - o) / 1000;
    const format = {
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    },
      n = (o) => {
        for (const [i, c] of Object.entries(format))
          if (o >= c || i === "second")
            return {
              value: Math.floor(Math.abs(o / c)),
              unit: i,
            };
      },
      a = (o) => {
        const i = new Intl.RelativeTimeFormat("en");
        const c = second(o);
        const { value: l, unit: _ } = n(c);
        const O = c > 0 ? -l : l;
        return i.format(O, _);
      },
      r = new Date(t);

    return a(r);
  }

  /**
   * 
   * @param {*} a = artist
   * @param {*} t = title
   * 
   * Get Cover art
   */
  const getCoverArt = async function (np) {
    const track = np.text;
    const resp = await fetch(
      `https://itunes.apple.com/search?limit=1&term=${encodeURIComponent(track)}`
    );

    if (resp.status === 403)
      return {
        title: np.title,
        artist: np.artist,
        album: np.album,
        art: np.art,
      };

    const data = resp.ok ? await resp.json() : {};
    if (!data.results || data.results.length === 0)
      return {
        title: np.title,
        artist: np.artist,
        album: np.album,
        art: np.art,
      };

    const itunes = data.results[0];
    const results = {
      title: itunes.trackName || np.title,
      artist: itunes.artistName || np.artist,
      album: itunes.collectionName || np.album,
      art: itunes.artworkUrl100
        ? itunes.artworkUrl100.replace("100x100", "512x512")
        : np.art,
    };
    return results;
  }

  // Get data from selected station
  async function getDataSelected(data) {
    try {
      const reslt = await (await fetch(data)).json();
      const T = stationsData[currentMusic];
      const artist = reslt.now_playing.song.artist || T.artist;
      const title = reslt.now_playing.song.title || T.title;
      // const album = reslt.now_playing.song.album || T.album;
      const np = reslt.now_playing.song;

      const n = await getCoverArt(np);

      // Open spotify
      const stream = "https://open.spotify.com/search/" + encodeURIComponent(artist + " - " + title);
      document.getElementById("spotify").href = stream;

      playerBanner.setAttribute("alt", `${n.title} Album Poster`);
      document.getElementById("title").innerHTML = n.title;
      document.title = artist + " - " + title;
      document.getElementById("album").innerHTML = n.album || "N/A";
      document.getElementById("artist").innerHTML = n.artist;

      // playerBanner.src = n.art;
      document.getElementById("artwork").src = n.art;
      document.body.style.backgroundImage = `url(${n.art})`;

      playerArtist.textContent = n.artist;
      playerTitle.textContent = n.title;
      playerAlbum.textContent = n.album || "N/A";

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: n.title,
          artist: n.title,
          artwork: [
            {
              src: n.art,
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        });
      }

    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }

  function getData() {
    setInterval(() => {
      getDataSelected(stationsData[currentMusic].api);
    }, 7000);
  }
  getData();
}
